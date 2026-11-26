import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import pg from "pg";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { readAdminCatalogue, executeAdminCatalogueCommand as command } from "../shared/server/admin-catalogue-commands.mjs";

const project = `bride-m3-t02-${randomBytes(5).toString("hex")}`;
const password = randomBytes(24).toString("hex");
const env = { ...process.env, M2_LOCAL_DB_PASSWORD: password, M2_LOCAL_PG_PORT: "0" };
const output = process.argv[2] && resolve(process.argv[2]);
const decision = (parsedData, role = "admin") => ({ ok: true, actor: { subjectId: `${role}-test`, role }, parsedData, record: "unscoped" });
const ok = (result) => { assert.equal(result.ok, true, JSON.stringify(result)); return result.value; };
const fail = (result, code) => { assert.equal(result.ok, false); assert.equal(result.code, code); };
const docker = (...args) => execFileSync("docker", ["compose", "-p", project, "-f", "compose.m2-local.yaml", ...args],
  { env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const item = (type, name) => ({ catalogue_type_id: type, name, description: "", active: true });
const bundle = (name, catalogueIds) => ({ name, description: "", active: true, catalogueIds });
const pkg = (name, catalogueIds, bundleIds = []) => ({ name, description: "", active: true, published: false,
  duration_minutes: 180, base_price: "1000000.00", catalogueIds, bundleIds });
const promo = (title, packageIds, starts_on, ends_on) => ({ title, description: "", active: true, published: true,
  discount_type: "percentage", discount_value: "10", starts_on, ends_on, packageIds });
const create = (client, entity, values, key = randomUUID(), role = "admin") => command(client, decision({ entity, operation: "create", requestKey: key, values }, role));
const update = (client, entity, id, values) => command(client, decision({ entity, operation: "update", id, values }));
const count = async (client, table) => Number((await client.query(`SELECT count(*)::int AS n FROM public.${table}`)).rows[0].n);

let started = false;
try {
  docker("up", "-d", "--wait"); started = true;
  const port = Number(docker("port", "postgres", "5432").split(":").at(-1));
  const url = `postgresql://bride_local:${password}@127.0.0.1:${port}/bride_local`;
  const migrated = JSON.parse(execFileSync(process.execPath, ["scripts/m2-migrate.mjs"], { encoding: "utf8",
    env: { ...env, DATABASE_MODE: "local", DATABASE_URL: url, DATABASE_EXPECTED_NAME: "bride_local" } }));
  assert.deepEqual(migrated.migrations, ["0001", "0002", "0003", "0004"]);
  const a = new pg.Client({ connectionString: url }); const b = new pg.Client({ connectionString: url });
  await a.connect(); await b.connect();
  try {
    const tables = ["catalogue_types", "catalogue", "bundle", "bundle_catalogue", "master_package",
      "package_catalogue", "package_bundle", "promotion", "promotion_package"];
    const constraints = (await a.query(`SELECT c.conrelid::regclass::text AS source, c.contype,
      CASE WHEN c.contype = 'f' THEN c.confrelid::regclass::text END AS target,
      array(SELECT a.attname FROM unnest(c.conkey) WITH ORDINALITY k(num, ord)
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.num ORDER BY k.ord) AS columns
      FROM pg_constraint c WHERE c.conrelid = ANY($1::regclass[]) AND c.contype IN ('p', 'f')
      ORDER BY source, c.contype, columns`, [tables.map((table) => `public.${table}`)])).rows;
    assert.equal(constraints.filter((row) => row.contype === "p").length, 9);
    assert.equal(constraints.filter((row) => row.contype === "f").length, 9);
    if (output) {
      await mkdir(output, { recursive: true });
      await writeFile(resolve(output, "schema.json"), JSON.stringify({ migrations: migrated.migrations, constraints }, null, 2));
      const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;");
      const cards = tables.map((table, index) => {
        const x = 35 + (index % 3) * 520; const y = 230 + Math.floor(index / 3) * 250;
        const lines = constraints.filter((row) => row.source === table).map((row) => row.contype === "p"
          ? `PK ${String(row.columns).replaceAll(/[{}]/g, "")}` : `FK ${String(row.columns).replaceAll(/[{}]/g, "")} → ${row.target}  (1 : 0..N)`);
        return `<g><rect x="${x}" y="${y}" width="475" height="210" rx="12" fill="#fff" stroke="#82536e" stroke-width="2"/><rect x="${x}" y="${y}" width="475" height="44" rx="12" fill="#82536e"/><text x="${x + 16}" y="${y + 29}" fill="#fff" font-size="21" font-weight="bold">${table}</text>${lines.map((line, i) => `<text x="${x + 16}" y="${y + 77 + i * 27}" fill="#332b32" font-size="17">${escape(line)}</text>`).join("")}</g>`;
      }).join("");
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1040" viewBox="0 0 1600 1040" role="img"><title>M3-T02 actual unchanged schema ERD</title><rect width="1600" height="1040" fill="#fff9f7"/><g font-family="Arial,sans-serif"><text x="35" y="56" fill="#332b32" font-size="31">M3-T02 actual ERD · fresh PostgreSQL 18.7</text><text x="35" y="100" fill="#693a53" font-size="21">Before and after T02: unchanged M3-SQL-01 (0004) schema</text><text x="35" y="139" fill="#332b32" font-size="18">0001 ledger · 0002 auth identity · 0003 admin bootstrap · 0004 nine catalogue/package/promotion tables</text><text x="35" y="178" fill="#332b32" font-size="18">Each FK points to its parent; parent 1 : child 0..N. Membership tables have composite PKs.</text>${cards}</g></svg>`;
      await writeFile(resolve(output, "actual-erd.svg"), svg);
    }
    const empty = ok(await readAdminCatalogue(a, decision(undefined)));
    assert.deepEqual(empty.types.map(({ id, code }) => [id, code]), [[1, "service"], [2, "action"]]);
    for (const key of ["items", "bundles", "packages", "promotions"]) assert.equal(empty[key].length, 0);
    fail(await readAdminCatalogue(a, decision(undefined, "customer")), "CONFLICT");
    fail(await create(a, "item", item(1, "Denied"), randomUUID(), "customer"), "CONFLICT");
    fail(await create(a, "item", item(9, "Bad type")), "CONFLICT");
    assert.equal(await count(a, "catalogue"), 0);
    const key = randomUUID();
    const first = ok(await create(a, "item", item(1, "Photography"), key));
    assert.equal(ok(await create(a, "item", item(1, "Photography"), key)).id, first.id);
    fail(await create(a, "item", item(1, "Different"), key), "CONFLICT");
    assert.equal(await count(a, "catalogue"), 1);
    const action = ok(await create(a, "item", item(2, "Editing")));
    const group = ok(await create(a, "bundle", bundle("Photo set", [first.id, action.id])));
    const packageOne = ok(await create(a, "package", pkg("Wedding", [first.id], [group.id])));
    const packageTwo = ok(await create(a, "package", pkg("Second", [action.id])));
    assert.equal(ok(await readAdminCatalogue(a, decision(undefined))).packages.length, 2);
    fail(await update(a, "bundle", randomUUID(), bundle("Missing", [first.id])), "NOT_FOUND");
    const p1 = ok(await create(a, "promotion", promo("Early", [packageOne.id], "2026-12-01", "2026-12-05")));
    const price = (await a.query("SELECT base_price FROM public.master_package WHERE id = $1", [packageOne.id])).rows[0].base_price;
    fail(await create(a, "promotion", promo("Overlap start", [packageOne.id], "2026-12-05", "2026-12-07")), "CONFLICT");
    assert.equal(await count(a, "promotion"), 1);
    ok(await create(a, "promotion", promo("Adjacent", [packageOne.id], "2026-12-06", "2026-12-07")));
    ok(await create(a, "promotion", promo("Other package", [packageTwo.id], "2026-12-01", "2026-12-05")));
    fail(await update(a, "promotion", p1.id, promo("Early", [packageOne.id], "2026-12-07", "2026-12-08")), "CONFLICT");
    fail(await update(a, "promotion", p1.id, promo("Early", [packageOne.id, packageTwo.id], "2026-12-01", "2026-12-05")), "CONFLICT");
    assert.equal((await a.query("SELECT count(*)::int AS n FROM public.promotion_package WHERE promotion_id = $1", [p1.id])).rows[0].n, 1);
    assert.equal((await a.query("SELECT base_price FROM public.master_package WHERE id = $1", [packageOne.id])).rows[0].base_price, price);
    const simultaneous = await Promise.all([create(a, "promotion", promo("Race A", [packageOne.id], "2027-01-01", "2027-01-03")),
      create(b, "promotion", promo("Race B", [packageOne.id], "2027-01-02", "2027-01-04"))]);
    assert.deepEqual(simultaneous.map((result) => result.ok).sort(), [false, true]);
    assert.equal(await count(a, "promotion"), 4);
    ok(await update(a, "item", first.id, item(1, "Photography edited")));
    ok(await update(a, "bundle", group.id, bundle("Photo set edited", [first.id, action.id])));
    ok(await update(a, "package", packageOne.id, { ...pkg("Wedding edited", [first.id], [group.id]), published: true }));
    ok(await update(a, "promotion", p1.id, promo("Early edited", [packageOne.id], "2026-12-01", "2026-12-05")));
    assert.equal((await a.query("SELECT name, published FROM public.master_package WHERE id = $1", [packageOne.id])).rows[0].published, true);
    assert.equal((await a.query("SELECT title FROM public.promotion WHERE id = $1", [p1.id])).rows[0].title, "Early edited");
    for (const [entity, id] of [["item", action.id], ["bundle", group.id], ["promotion", p1.id]]) {
      ok(await command(a, decision({ entity, operation: "retire", id })));
    }
    ok(await command(a, decision({ entity: "package", operation: "retire", id: packageTwo.id })));
    assert.equal((await a.query("SELECT active, published FROM public.master_package WHERE id = $1", [packageTwo.id])).rows[0].active, false);
    console.log(JSON.stringify({ status: "PASS", migrations: migrated.migrations, empty: true, typeDenial: true,
      retry: true, overlap: true, membershipRollback: true, concurrent: simultaneous.map((result) => result.ok),
      basePriceUnchanged: price }));
  } finally { await a.end(); await b.end(); }
} finally { if (started) docker("down", "--volumes", "--remove-orphans"); }
