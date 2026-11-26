import { createHash } from "node:crypto";

const tables = {
  item: { name: "catalogue", fields: ["catalogue_type_id", "name", "description", "active"] },
  bundle: { name: "bundle", fields: ["name", "description", "active"] },
  package: { name: "master_package", fields: ["name", "description", "duration_minutes", "base_price", "published", "active"] },
  promotion: { name: "promotion", fields: ["title", "description", "discount_type", "discount_value", "starts_on", "ends_on", "published", "active"] },
};
const links = {
  bundle: [["bundle_catalogue", "bundle_id", "catalogue_id", "catalogueIds"]],
  package: [["package_catalogue", "package_id", "catalogue_id", "catalogueIds"], ["package_bundle", "package_id", "bundle_id", "bundleIds"]],
  promotion: [["promotion_package", "promotion_id", "package_id", "packageIds"]],
};
const err = (code) => ({ ok: false, code });
const dbError = (error) => err(["23502", "23503", "23505", "23514", "22P02", "22003"].includes(error?.code) ? "CONFLICT" : "STORAGE_FAILURE");
const unique = (values) => [...new Set(values)].sort();
function sameField(field, stored, submitted) {
  if (field === "starts_on" || field === "ends_on")
    return (stored instanceof Date ? stored.toISOString().slice(0, 10) : String(stored).slice(0, 10)) === submitted;
  if (field === "base_price" || field === "discount_value") return Number(stored) === Number(submitted);
  return String(stored) === String(submitted);
}

// The key is generated once by the editor and reused on a network retry.
// Its deterministic ID makes a second create hit the same primary key.
function commandId(actor, entity, key) {
  const hex = createHash("sha256").update(`${actor}:${entity}:${key}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

async function lockPackages(client, ids) {
  for (const id of unique(ids)) {
    const row = await client.query("SELECT id FROM public.master_package WHERE id = $1 FOR UPDATE", [id]);
    if (!row.rowCount) return false;
  }
  return true;
}

async function checkPromotionOverlap(client, id, ids, start, end) {
  if (!ids.length) return false;
  const result = await client.query(`SELECT 1 FROM public.promotion p
    JOIN public.promotion_package pp ON pp.promotion_id = p.id
    WHERE pp.package_id = ANY($1::uuid[]) AND p.id <> $2::uuid
      AND p.starts_on <= $4::date AND p.ends_on >= $3::date LIMIT 1`, [ids, id, start, end]);
  return result.rowCount > 0;
}

async function rows(client, table) {
  const result = await client.query(`SELECT * FROM public.${table} ORDER BY created_at, id`);
  return result.rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) =>
    [key, value instanceof Date ? value.toISOString() : value])));
}

export async function readAdminCatalogue(client, decision) {
  if (decision?.ok !== true || decision.actor?.role !== "admin") return err("CONFLICT");
  try {
    const types = await client.query("SELECT id, code, label FROM public.catalogue_types ORDER BY id");
    const items = await rows(client, "catalogue");
    const bundles = await rows(client, "bundle");
    const packages = await rows(client, "master_package");
    const promotions = await rows(client, "promotion");
    const memberships = {};
    for (const [entity, definitions] of Object.entries(links)) {
      memberships[entity] = {};
      for (const [table, owner, target, field] of definitions) {
        const result = await client.query(`SELECT ${owner}, ${target} FROM public.${table} ORDER BY ${owner}, ${target}`);
        memberships[entity][field] = result.rows;
      }
    }
    const attach = (entity, list) => list.map((row) => ({ ...row, ...Object.fromEntries(
      (links[entity] ?? []).map(([, owner, target, field]) =>
        [field, memberships[entity][field].filter((entry) => entry[owner] === row.id).map((entry) => entry[target])])) }));
    return { ok: true, value: { types: types.rows, items, bundles: attach("bundle", bundles),
      packages: attach("package", packages), promotions: attach("promotion", promotions) } };
  } catch (error) { return dbError(error); }
}

export async function executeAdminCatalogueCommand(client, decision) {
  if (decision?.ok !== true || decision.actor?.role !== "admin") return err("CONFLICT");
  const { entity, operation, id, requestKey, values = {} } = decision.parsedData;
  const config = tables[entity];
  if (!config) return err("CONFLICT");
  const targetId = operation === "create" ? commandId(decision.actor.subjectId, entity, requestKey) : id;
  try {
    await client.query("BEGIN");
    const finish = async (result) => { await client.query(result.ok ? "COMMIT" : "ROLLBACK"); return result; };
    let previous = null;
    if (operation !== "create") {
      const found = await client.query(`SELECT * FROM public.${config.name} WHERE id = $1 FOR UPDATE`, [targetId]);
      if (!found.rowCount) return finish(err("NOT_FOUND"));
      previous = found.rows[0];
    }
    if (entity === "item" && operation !== "retire") {
      const type = await client.query("SELECT id FROM public.catalogue_types WHERE id = $1", [values.catalogue_type_id]);
      if (!type.rowCount) return finish(err("CONFLICT"));
    }
    if (entity === "promotion" && operation !== "retire") {
      const oldIds = previous ? (await client.query("SELECT package_id FROM public.promotion_package WHERE promotion_id = $1", [targetId])).rows.map((row) => row.package_id) : [];
      const packageIds = unique(values.packageIds);
      if (!(await lockPackages(client, [...oldIds, ...packageIds]))) return finish(err("CONFLICT"));
      if (await checkPromotionOverlap(client, targetId, packageIds, values.starts_on, values.ends_on)) return finish(err("CONFLICT"));
    }
    let row;
    if (operation === "create") {
      const fields = config.fields;
      const result = await client.query(`INSERT INTO public.${config.name} (id, ${fields.join(", ")})
        VALUES ($1, ${fields.map((_, index) => `$${index + 2}`).join(", ")})
        ON CONFLICT (id) DO NOTHING RETURNING *`, [targetId, ...fields.map((field) => values[field])]);
      if (!result.rowCount) {
        // A matching request key is a replay only when all submitted facts agree.
        const existing = await client.query(`SELECT * FROM public.${config.name} WHERE id = $1`, [targetId]);
        const matches = config.fields.every((field) => sameField(field, existing.rows[0]?.[field], values[field]));
        if (!matches) return finish(err("CONFLICT"));
        for (const [table, owner, target, field] of links[entity] ?? []) {
          const current = (await client.query(`SELECT ${target} FROM public.${table} WHERE ${owner} = $1 ORDER BY ${target}`, [targetId])).rows.map((entry) => entry[target]);
          if (JSON.stringify(current) !== JSON.stringify(unique(values[field]))) return finish(err("CONFLICT"));
        }
        return finish({ ok: true, value: existing.rows[0] });
      }
      row = result.rows[0];
    } else if (operation === "retire") {
      const publication = entity === "package" || entity === "promotion" ? ", published = false" : "";
      const result = await client.query(`UPDATE public.${config.name} SET active = false${publication}, updated_at = now()
        WHERE id = $1 RETURNING *`, [targetId]);
      row = result.rows[0];
    } else {
      const fields = config.fields;
      const result = await client.query(`UPDATE public.${config.name} SET ${fields.map((field, index) => `${field} = $${index + 2}`).join(", ")}, updated_at = now()
        WHERE id = $1 RETURNING *`, [targetId, ...fields.map((field) => values[field])]);
      row = result.rows[0];
    }
    if (operation !== "retire") for (const [table, owner, target, field] of links[entity] ?? []) {
      await client.query(`DELETE FROM public.${table} WHERE ${owner} = $1`, [targetId]);
      for (const linkedId of unique(values[field])) await client.query(`INSERT INTO public.${table} (${owner}, ${target}) VALUES ($1, $2)`, [targetId, linkedId]);
    }
    return finish({ ok: true, value: row });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    return dbError(error);
  }
}
