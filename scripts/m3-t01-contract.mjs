import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";
import * as repo from "../shared/server/catalogue-repository.mjs";

const root = resolve(import.meta.dirname, "..");
const project = `bride-m3-t01-${randomBytes(5).toString("hex")}`;
const password = randomBytes(24).toString("hex");
const env = { ...process.env, M2_LOCAL_DB_PASSWORD: password, M2_LOCAL_PG_PORT: "0" };
const output = process.argv[2] && resolve(process.argv[2]);
const admin = (parsedData) => ({ ok: true, actor: { subjectId: "admin-test", role: "admin" }, parsedData, record: "unscoped" });
const publicRead = (parsedData) => ({ ok: true, actor: { subjectId: "customer-test", role: "customer" }, parsedData, record: "unscoped" });
function docker(...args) {
  return execFileSync("docker", ["compose", "-p", project, "-f", "compose.m2-local.yaml", ...args],
    { cwd: root, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function expectOk(result) { assert.equal(result.ok, true, JSON.stringify(result)); return result.value; }
function escape(s) { return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;"); }

let started = false;
try {
  docker("up", "-d", "--wait"); started = true;
  const port = Number(docker("port", "postgres", "5432").split(":").at(-1));
  const databaseUrl = `postgresql://bride_local:${password}@127.0.0.1:${port}/bride_local`;
  const migrationEnv = { ...env, DATABASE_MODE: "local", DATABASE_URL: databaseUrl, DATABASE_EXPECTED_NAME: "bride_local" };
  const migration = JSON.parse(execFileSync(process.execPath, ["scripts/m2-migrate.mjs"],
    { cwd: root, env: migrationEnv, encoding: "utf8" }));
  assert.deepEqual(migration.migrations, ["0001", "0002", "0003", "0004"]);
  const client = new pg.Client({ connectionString: databaseUrl }); await client.connect();
  try {
    const tables = ["catalogue_types", "catalogue", "bundle", "bundle_catalogue", "master_package",
      "package_catalogue", "package_bundle", "promotion", "promotion_package"];
    const actual = (await client.query(`SELECT c.conrelid::regclass::text AS source, c.conname, c.contype,
      CASE WHEN c.contype = 'f' THEN c.confrelid::regclass::text END AS target,
      array(SELECT a.attname FROM unnest(c.conkey) WITH ORDINALITY k(num, ord)
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.num ORDER BY k.ord) AS columns
      FROM pg_constraint c WHERE c.conrelid = ANY($1::regclass[]) ORDER BY source, c.conname`,
    [tables.map((t) => `public.${t}`)])).rows;
    for (const table of tables) assert.ok(actual.some((c) => c.source === table && c.contype === "p"), `${table} PK`);
    const expectedFks = [
      ["catalogue", "catalogue_types"], ["bundle_catalogue", "bundle"], ["bundle_catalogue", "catalogue"],
      ["package_catalogue", "master_package"], ["package_catalogue", "catalogue"],
      ["package_bundle", "master_package"], ["package_bundle", "bundle"],
      ["promotion_package", "promotion"], ["promotion_package", "master_package"],
    ];
    for (const [source, target] of expectedFks)
      assert.ok(actual.some((c) => c.source === source && c.target === target && c.contype === "f"), `${source} → ${target}`);
    assert.deepEqual(expectOk(await repo.listCatalogueTypes(client, publicRead(undefined))).map(({ id, code, label }) => [id, code, label]),
      [[1, "service", "Service"], [2, "action", "Action"]]);
    const empty = {};
    for (const table of tables.slice(1)) {
      empty[table] = Number((await client.query(`SELECT count(*)::int AS n FROM public.${table}`)).rows[0].n);
      assert.equal(empty[table], 0);
    }
    assert.deepEqual(expectOk(await repo.listCatalogue(client, publicRead({}))), []);
    assert.deepEqual(expectOk(await repo.listPublishedPackages(client, publicRead(undefined))), []);
    assert.deepEqual(expectOk(await repo.listBundles(client, admin(undefined))), []);
    assert.deepEqual(expectOk(await repo.listPromotions(client, admin(undefined))), []);
    const missing = await repo.resolvePackage(client, publicRead({ packageId: randomBytes(16).toString("hex").replace(/^(.{8})(.{4})(.{4})(.{4})(.*)$/, "$1-$2-$3-$4-$5"), createdAt: "2026-11-26T00:00:00Z" }));
    assert.equal(missing.code, "NOT_FOUND");
    assert.equal((await repo.createCatalogue(client, publicRead({ catalogueTypeId: 1, name: "Denied" }))).ok, false);
    const service = expectOk(await repo.createCatalogue(client, admin({ catalogueTypeId: 1, name: "Photography" })));
    const action = expectOk(await repo.createCatalogue(client, admin({ catalogueTypeId: 2, name: "Editing" })));
    assert.ok(service.id && action.id);
    assert.equal(expectOk(await repo.listCatalogue(client, publicRead({ type: "service" }))).length, 1);
    assert.equal(expectOk(await repo.listCatalogue(client, publicRead({ type: "action" }))).length, 1);
    assert.equal((await repo.createCatalogue(client, admin({ catalogueTypeId: 3, name: "Invalid" }))).code, "CONFLICT");
    const bundle = expectOk(await repo.createBundle(client, admin({ name: "Photo set", catalogueIds: [service.id, action.id] })));
    assert.deepEqual(expectOk(await repo.listBundles(client, admin(undefined)))[0].catalogue_ids.sort(), [service.id, action.id].sort());
    const pkg = expectOk(await repo.createPackage(client, admin({ name: "Wedding", durationMinutes: 120, basePrice: "1000000.00",
      published: true, catalogueIds: [service.id], bundleIds: [bundle.id] })));
    expectOk(await repo.createPackage(client, admin({ name: "Draft", durationMinutes: 60, basePrice: "500.00" })));
    assert.deepEqual(expectOk(await repo.listPublishedPackages(client, publicRead(undefined))).map((row) => row.id), [pkg.id]);
    assert.equal((await repo.createBundle(client, admin({ name: "Bad", catalogueIds: [randomBytes(16).toString("hex").replace(/^(.{8})(.{4})(.{4})(.{4})(.*)$/, "$1-$2-$3-$4-$5")] }))).code, "CONFLICT");
    assert.equal((await repo.createPackage(client, admin({ name: "Bad", durationMinutes: 0, basePrice: "-1" }))).code, "CONFLICT");
    assert.equal((await repo.createPackage(client, admin({ name: "Bad price", durationMinutes: 1, basePrice: "-1" }))).code, "CONFLICT");
    assert.equal((await repo.createPackage(client, admin({ name: "Bad duration", durationMinutes: 0, basePrice: "1" }))).code, "CONFLICT");
    assert.equal((await repo.createPackage(client, admin({ name: "Duplicate", durationMinutes: 1, basePrice: "1", catalogueIds: [service.id, service.id] }))).code, "CONFLICT");
    const percent = expectOk(await repo.createPromotion(client, admin({ title: "Early", description: "Early booking",
      discountType: "percentage", discountValue: "10", startsOn: "2026-11-26", endsOn: "2026-11-27",
      published: true, active: true, packageIds: [pkg.id] })));
    const rupiah = expectOk(await repo.createPromotion(client, admin({ title: "Later", discountType: "rupiah",
      discountValue: "50000", startsOn: "2026-12-01", endsOn: "2026-12-02", packageIds: [pkg.id] })));
    assert.ok(percent.id && rupiah.id);
    assert.equal(expectOk(await repo.listPromotions(client, admin(undefined))).length, 2);
    assert.equal((await repo.createPromotion(client, admin({ title: "Bad", discountType: "percentage", discountValue: "101",
      startsOn: "2026-11-28", endsOn: "2026-11-27", packageIds: [pkg.id] }))).code, "CONFLICT");
    assert.equal((await repo.createPromotion(client, admin({ title: "Bad percent", discountType: "percentage", discountValue: "101",
      startsOn: "2026-11-27", endsOn: "2026-11-28", packageIds: [pkg.id] }))).code, "CONFLICT");
    assert.equal((await repo.createPromotion(client, admin({ title: "Bad dates", discountType: "rupiah", discountValue: "1",
      startsOn: "2026-11-28", endsOn: "2026-11-27", packageIds: [pkg.id] }))).code, "CONFLICT");
    const onStart = expectOk(await repo.resolvePackage(client, publicRead({ packageId: pkg.id, createdAt: "2026-11-25T17:00:00Z" })));
    assert.equal(onStart.items.length, 2); assert.equal(onStart.promotion.id, percent.id);
    const onEnd = expectOk(await repo.resolvePackage(client, publicRead({ packageId: pkg.id, createdAt: "2026-11-27T16:59:59Z" })));
    assert.equal(onEnd.promotion.id, percent.id);
    assert.equal(expectOk(await repo.resolvePackage(client, publicRead({ packageId: pkg.id, createdAt: "2026-11-27T17:00:00Z" }))).promotion, null);
    assert.equal(expectOk(await repo.resolvePackage(client, publicRead({ packageId: pkg.id, createdAt: "2026-12-01T00:00:00Z" }))).promotion, null,
      "draft rupiah promotion is ineligible");
    await client.query("UPDATE public.promotion SET published = true WHERE id = $1", [rupiah.id]);
    assert.equal(expectOk(await repo.resolvePackage(client, publicRead({ packageId: pkg.id, createdAt: "2026-12-01T00:00:00Z" }))).promotion.id, rupiah.id);
    await client.query("UPDATE public.promotion SET active = false WHERE id = $1", [rupiah.id]);
    assert.equal(expectOk(await repo.resolvePackage(client, publicRead({ packageId: pkg.id, createdAt: "2026-12-01T00:00:00Z" }))).promotion, null,
      "inactive rupiah promotion is ineligible");
    assert.equal((await client.query("SELECT base_price FROM public.master_package WHERE id = $1", [pkg.id])).rows[0].base_price, "1000000.00");
    if (output) {
      await mkdir(output, { recursive: true });
      await writeFile(resolve(output, "schema.json"), JSON.stringify({ migrations: migration.migrations, constraints: actual, empty }, null, 2));
      const before = ["public.schema_migrations: version PK", "auth.user: id PK; auth.session: id PK, userId FK → auth.user (1 : 0..N)",
        "auth.account: id PK, userId FK → auth.user (1 : 0..N); auth.verification: id PK",
        "app.admin_bootstrap_state: bootstrap_key PK, initial_user_id FK → auth.user (1 : 0..N)"];
      const positions = new Map(tables.map((table, i) => [table, { x: 30 + (i % 3) * 550, y: 315 + Math.floor(i / 3) * 200 }]));
      const edges = actual.filter((c) => c.contype === "f").map((c) => {
        const from = positions.get(c.source); const to = positions.get(c.target);
        return `<line x1="${from.x + 245}" y1="${from.y + 75}" x2="${to.x + 245}" y2="${to.y + 75}" stroke="#b77b9d" stroke-width="3" marker-end="url(#arrow)"/>`;
      }).join("");
      const cards = tables.map((table) => {
        const { x, y } = positions.get(table);
        const rows = actual.filter((c) => c.source === table && ["p", "f"].includes(c.contype)).map((c) =>
          `${c.contype === "p" ? "PK" : "FK"} ${String(c.columns).replaceAll(/[{}]/g, "")}${c.target ? ` → ${c.target} (1 : 0..N)` : ""}`);
        return `<rect x="${x}" y="${y}" width="490" height="150" rx="10" fill="#fff" stroke="#82536e" stroke-width="2"/><rect x="${x}" y="${y}" width="490" height="32" rx="10" fill="#82536e"/><text x="${x + 12}" y="${y + 23}" font-family="Arial" font-size="18" font-weight="bold" fill="#fff">${table}</text>${rows.map((line, i) => `<text x="${x + 12}" y="${y + 57 + i * 25}" font-family="Arial" font-size="15" fill="#332b32">${escape(line)}</text>`).join("")}`;
      }).join("");
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1660" height="920" viewBox="0 0 1660 920" role="img"><title>M3-SQL-01 actual ERD</title><defs><marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#b77b9d"/></marker></defs><rect width="100%" height="100%" fill="#fff9f7"/><text x="30" y="45" font-family="Arial" font-size="28" fill="#332b32">M3-SQL-01 actual ERD · fresh PostgreSQL 18.7</text><text x="30" y="82" font-family="Arial" font-size="21" fill="#693a53">Before: 0001–0003 unchanged</text><rect x="30" y="98" width="1600" height="140" rx="10" fill="#fff" stroke="#82536e"/>${before.map((line, i) => `<text x="45" y="${125 + i * 29}" font-family="Arial" font-size="17" fill="#332b32">${escape(line)}</text>`).join("")}<text x="30" y="285" font-family="Arial" font-size="21" fill="#693a53">After: 0004 adds nine public tables · arrows show foreign-key relationships</text>${edges}${cards}</svg>`;
      await writeFile(resolve(output, "actual-erd.svg"), svg);
    }
    console.log(JSON.stringify({ status: "PASS", migrations: migration.migrations, empty, service: service.id,
      action: action.id, package: pkg.id, promotionTypes: [percent.discount_type, rupiah.discount_type],
      expansionCount: onStart.items.length, price: onStart.package.base_price, constraintCount: actual.length }));
  } finally { await client.end(); }
} finally { if (started) docker("down", "--volumes", "--remove-orphans"); }
