// Server-side persistence seam. Callers supply a successful M2-T05 decision and
// a PostgreSQL client; M3-T02/T03 own route composition and response mapping.
const invalid = { ok: false, code: "CONFLICT" };

function authorized(decision, write = false) {
  return decision?.ok === true && decision.actor?.subjectId &&
    (!write || decision.actor.role === "admin");
}

function failure(error) {
  return { ok: false, code: ["23502", "23503", "23505", "23514", "22P02", "22003"].includes(error?.code)
    ? "CONFLICT" : "STORAGE_FAILURE" };
}

async function query(client, sql, values = []) {
  try { return { ok: true, value: (await client.query(sql, values)).rows }; }
  catch (error) { return failure(error); }
}

export async function listCatalogueTypes(client, decision) {
  if (!authorized(decision)) return invalid;
  return query(client, "SELECT id, code, label FROM public.catalogue_types ORDER BY id");
}

export async function listCatalogue(client, decision) {
  if (!authorized(decision)) return invalid;
  const type = decision.parsedData?.type ?? null;
  return query(client, `SELECT c.id, c.catalogue_type_id, t.code AS type_code, c.name, c.description, c.active
    FROM public.catalogue c JOIN public.catalogue_types t ON t.id = c.catalogue_type_id
    WHERE ($1::text IS NULL OR t.code = $1) ORDER BY c.name, c.id`, [type]);
}

export async function listPublishedPackages(client, decision) {
  if (!authorized(decision)) return invalid;
  return query(client, `SELECT id, name, description, duration_minutes, base_price
    FROM public.master_package WHERE published AND active ORDER BY name, id`);
}

// Public read projection. The caller validates the request time; no session or
// admin-shaped decision is needed to inspect published package facts.
export async function readPublicPackages(client, createdAt) {
  const packages = await query(client, `SELECT id, name, description, duration_minutes, base_price
    FROM public.master_package WHERE published AND active ORDER BY name, id`);
  if (!packages.ok) return packages;
  const result = [];
  for (const pkg of packages.value) {
    const detail = await resolvePackageData(client, pkg.id, createdAt);
    if (!detail.ok) return detail;
    result.push({ ...pkg, items: detail.value.items,
      promotion: detail.value.promotion });
  }
  return { ok: true, value: result };
}

export async function listBundles(client, decision) {
  if (!authorized(decision)) return invalid;
  return query(client, `SELECT b.id, b.name, b.description, b.active,
      coalesce(array_agg(bc.catalogue_id ORDER BY bc.catalogue_id)
        FILTER (WHERE bc.catalogue_id IS NOT NULL), '{}') AS catalogue_ids
    FROM public.bundle b LEFT JOIN public.bundle_catalogue bc ON bc.bundle_id = b.id
    GROUP BY b.id ORDER BY b.name, b.id`);
}

export async function listPromotions(client, decision) {
  if (!authorized(decision, true)) return invalid;
  return query(client, `SELECT p.id, p.title, p.description, p.discount_type, p.discount_value,
      p.starts_on::text, p.ends_on::text, p.published, p.active,
      coalesce(array_agg(pp.package_id ORDER BY pp.package_id)
        FILTER (WHERE pp.package_id IS NOT NULL), '{}') AS package_ids
    FROM public.promotion p LEFT JOIN public.promotion_package pp ON pp.promotion_id = p.id
    GROUP BY p.id ORDER BY p.title, p.id`);
}

export async function createCatalogue(client, decision) {
  if (!authorized(decision, true)) return invalid;
  const { catalogueTypeId, name, description = "", active = true } = decision.parsedData;
  const result = await query(client, `INSERT INTO public.catalogue (catalogue_type_id, name, description, active)
    VALUES ($1, $2, $3, $4) RETURNING id, catalogue_type_id, name, description, active`,
    [catalogueTypeId, name, description, active]);
  return result.ok ? { ok: true, value: result.value[0] } : result;
}

export async function createBundle(client, decision) {
  if (!authorized(decision, true)) return invalid;
  const { name, description = "", active = true, catalogueIds = [] } = decision.parsedData;
  return transaction(client, async () => {
    const rows = await client.query(`INSERT INTO public.bundle (name, description, active)
      VALUES ($1, $2, $3) RETURNING id, name, description, active`, [name, description, active]);
    for (const id of catalogueIds) await client.query(`INSERT INTO public.bundle_catalogue (bundle_id, catalogue_id)
      VALUES ($1, $2)`, [rows.rows[0].id, id]);
    return rows.rows[0];
  });
}

export async function createPackage(client, decision) {
  if (!authorized(decision, true)) return invalid;
  const { name, description = "", durationMinutes, basePrice, published = false,
    active = true, catalogueIds = [], bundleIds = [] } = decision.parsedData;
  return transaction(client, async () => {
    const rows = await client.query(`INSERT INTO public.master_package
      (name, description, duration_minutes, base_price, published, active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, description, duration_minutes, base_price, published, active`,
    [name, description, durationMinutes, basePrice, published, active]);
    for (const id of catalogueIds) await client.query(`INSERT INTO public.package_catalogue (package_id, catalogue_id)
      VALUES ($1, $2)`, [rows.rows[0].id, id]);
    for (const id of bundleIds) await client.query(`INSERT INTO public.package_bundle (package_id, bundle_id)
      VALUES ($1, $2)`, [rows.rows[0].id, id]);
    return rows.rows[0];
  });
}

export async function createPromotion(client, decision) {
  if (!authorized(decision, true)) return invalid;
  const { title, description = "", discountType, discountValue, startsOn, endsOn,
    published = false, active = true, packageIds = [] } = decision.parsedData;
  return transaction(client, async () => {
    const rows = await client.query(`INSERT INTO public.promotion
      (title, description, discount_type, discount_value, starts_on, ends_on, published, active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, title, description, discount_type, discount_value, starts_on, ends_on, published, active`,
    [title, description, discountType, discountValue, startsOn, endsOn, published, active]);
    for (const id of packageIds) await client.query(`INSERT INTO public.promotion_package (promotion_id, package_id)
      VALUES ($1, $2)`, [rows.rows[0].id, id]);
    return rows.rows[0];
  });
}

async function transaction(client, work) {
  try {
    await client.query("BEGIN");
    const value = await work();
    await client.query("COMMIT");
    return { ok: true, value };
  } catch (error) {
    await client.query("ROLLBACK");
    return failure(error);
  }
}

// Returns each item once even if it belongs directly and through several bundles.
// The timestamp is trusted by the caller; the SQL converts it to Jakarta's date.
export async function resolvePackage(client, decision) {
  if (!authorized(decision)) return invalid;
  const { packageId, createdAt } = decision.parsedData;
  return resolvePackageData(client, packageId, createdAt);
}

async function resolvePackageData(client, packageId, createdAt) {
  const packageRows = await query(client, `SELECT id, name, description, duration_minutes, base_price, published, active
    FROM public.master_package WHERE id = $1`, [packageId]);
  if (!packageRows.ok) return packageRows;
  if (!packageRows.value.length) return { ok: false, code: "NOT_FOUND" };
  const items = await query(client, `SELECT DISTINCT c.id, c.catalogue_type_id, t.code AS type_code,
      c.name, c.description, c.active
    FROM public.catalogue c JOIN public.catalogue_types t ON t.id = c.catalogue_type_id
    WHERE c.id IN (SELECT catalogue_id FROM public.package_catalogue WHERE package_id = $1
      UNION SELECT bc.catalogue_id FROM public.package_bundle pb
      JOIN public.bundle_catalogue bc ON bc.bundle_id = pb.bundle_id WHERE pb.package_id = $1)
    ORDER BY c.id`, [packageId]);
  if (!items.ok) return items;
  const promotions = await query(client, `SELECT p.id, p.title, p.description, p.discount_type,
      p.discount_value, p.starts_on::text, p.ends_on::text
    FROM public.promotion p JOIN public.promotion_package pp ON pp.promotion_id = p.id
    WHERE pp.package_id = $1 AND p.published AND p.active
      AND (date($2::timestamptz AT TIME ZONE 'Asia/Jakarta') BETWEEN p.starts_on AND p.ends_on)
    ORDER BY p.id`, [packageId, createdAt]);
  if (!promotions.ok) return promotions;
  if (promotions.value.length > 1) return invalid;
  return { ok: true, value: { package: packageRows.value[0], items: items.value,
    promotion: promotions.value[0] ?? null } };
}
