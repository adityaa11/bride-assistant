import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer } from "node:net";
import pg from "pg";
import { readPublicPackages, resolvePackage } from "../shared/server/catalogue-repository.mjs";

const project = `bride-m3-t03-${randomBytes(5).toString("hex")}`;
const password = randomBytes(24).toString("hex");
const env = { ...process.env, M2_LOCAL_DB_PASSWORD: password, M2_LOCAL_PG_PORT: "0" };
const output = process.argv[2] && resolve(process.argv[2]);
const docker = (...args) => execFileSync("docker", ["compose", "-p", project, "-f", "compose.m2-local.yaml", ...args], { env, encoding: "utf8" }).trim();
const port = () => new Promise((done) => { const server = createServer(); server.listen(0, "127.0.0.1", () => { const value = server.address().port; server.close(() => done(value)); }); });
const wait = async (url, child) => { for (let i = 0; i < 90; i++) { if (child.exitCode !== null) throw new Error("Next server exited"); try { const r = await fetch(url); if (r.status !== 404) return; } catch {} await new Promise((done) => setTimeout(done, 1000)); } throw new Error("Next server did not start"); };
const get = async (base, path) => { const response = await fetch(base + path); assert.equal(response.status, 200, path); return response; };
const sql = async (client, statement, values = []) => (await client.query(statement, values)).rows[0];
const uuid = async (client, statement, values = []) => (await sql(client, statement + " RETURNING id", values)).id;
const now = new Date();
const jakartaToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
const day = (offset) => { const date = new Date(`${jakartaToday}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + offset); return date.toISOString().slice(0, 10); };
let started = false; let server;
try {
  docker("up", "-d", "--wait"); started = true;
  const dbPort = Number(docker("port", "postgres", "5432").split(":").at(-1));
  const url = `postgresql://bride_local:${password}@127.0.0.1:${dbPort}/bride_local`;
  const dbEnv = { ...env, DATABASE_MODE: "local", DATABASE_URL: url, DATABASE_EXPECTED_NAME: "bride_local" };
  const migrated = JSON.parse(execFileSync(process.execPath, ["scripts/m2-migrate.mjs"], { encoding: "utf8", env: dbEnv }));
  assert.deepEqual(migrated.migrations, ["0001", "0002", "0003", "0004"]);
  const client = new pg.Client({ connectionString: url }); await client.connect();
  try {
    const empty = await readPublicPackages(client, now.toISOString());
    assert.deepEqual(empty, { ok: true, value: [] });
    const tables = ["catalogue_types", "catalogue", "bundle", "bundle_catalogue", "master_package", "package_catalogue", "package_bundle", "promotion", "promotion_package"];
    const constraints = (await client.query(`SELECT c.conrelid::regclass::text AS source, c.contype,
      CASE WHEN c.contype = 'f' THEN c.confrelid::regclass::text END AS target,
      array(SELECT a.attname FROM unnest(c.conkey) WITH ORDINALITY k(num, ord)
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.num ORDER BY k.ord) AS columns
      FROM pg_constraint c WHERE c.conrelid = ANY($1::regclass[]) AND c.contype IN ('p', 'f')
      ORDER BY source, c.contype, columns`, [tables.map((table) => `public.${table}`)])).rows;
    assert.equal(constraints.filter((c) => c.contype === "p").length, 9);
    assert.equal(constraints.filter((c) => c.contype === "f").length, 9);
    if (output) {
      await mkdir(output, { recursive: true });
      await writeFile(resolve(output, "schema.json"), JSON.stringify({ migrations: migrated.migrations, constraints }, null, 2));
      const escape = (v) => String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;");
      const cards = tables.map((table, i) => {
        const x = 30 + i % 3 * 520, y = 185 + Math.floor(i / 3) * 250;
        const lines = constraints.filter((c) => c.source === table).map((c) => {
          const columns = String(c.columns).replaceAll(/[{}]/g, "");
          return c.contype === "p" ? `PK ${columns}` : `FK ${columns} → ${c.target} (1 : 0..N)`;
        });
        return `<g><rect x="${x}" y="${y}" width="480" height="210" fill="white" stroke="#82536e" stroke-width="2"/><text x="${x + 15}" y="${y + 32}" font-size="20" font-weight="bold">${table}</text>${lines.map((line, j) => `<text x="${x + 15}" y="${y + 70 + j * 30}" font-size="17">${escape(line)}</text>`).join("")}</g>`;
      }).join("");
      await writeFile(resolve(output, "actual-erd.svg"), `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="960" viewBox="0 0 1600 960"><title>M3-T03 actual unchanged schema</title><rect width="1600" height="960" fill="#fff9f7"/><g font-family="Arial,sans-serif" fill="#332b32"><text x="30" y="55" font-size="30">M3-T03 actual ERD · fresh PostgreSQL 18.7</text><text x="30" y="96" font-size="20">Before and after T03: unchanged M3-SQL-01 (0004) schema</text><text x="30" y="135" font-size="18">Each FK points to its parent; parent 1 : child 0..N. Composite membership PKs shown below.</text>${cards}</g></svg>`);
    }
    const service = await uuid(client, "INSERT INTO public.catalogue(catalogue_type_id,name,description,active) VALUES (1,'Visible service','',true)");
    const action = await uuid(client, "INSERT INTO public.catalogue(catalogue_type_id,name,description,active) VALUES (2,'Visible action','',true)");
    const bundle = await uuid(client, "INSERT INTO public.bundle(name,description,active) VALUES ('Care set','',true)");
    await client.query("INSERT INTO public.bundle_catalogue(bundle_id,catalogue_id) VALUES ($1,$2),($1,$3)", [bundle, service, action]);
    const active = await uuid(client, "INSERT INTO public.master_package(name,description,duration_minutes,base_price,published,active) VALUES ('Visible package','Carefully prepared',180,1000000,true,true)");
    const draft = await uuid(client, "INSERT INTO public.master_package(name,description,duration_minutes,base_price,published,active) VALUES ('Draft secret','private',90,300000,false,true)");
    await uuid(client, "INSERT INTO public.master_package(name,description,duration_minutes,base_price,published,active) VALUES ('Inactive secret','private',90,300000,true,false)");
    await client.query("INSERT INTO public.package_catalogue(package_id,catalogue_id) VALUES ($1,$2)", [active, service]);
    await client.query("INSERT INTO public.package_bundle(package_id,bundle_id) VALUES ($1,$2)", [active, bundle]);
    const promotion = async (title, packageId, start, end, published = true, activeFlag = true) => {
      const id = await uuid(client, "INSERT INTO public.promotion(title,description,discount_type,discount_value,starts_on,ends_on,published,active) VALUES ($1,'offer detail','percentage',10,$2,$3,$4,$5)", [title, start, end, published, activeFlag]);
      await client.query("INSERT INTO public.promotion_package(promotion_id,package_id) VALUES ($1,$2)", [id, packageId]);
    };
    await promotion("Valid offer", active, day(-1), day(1));
    await promotion("Expired secret", active, day(-3), day(-1));
    await promotion("Draft offer secret", active, day(-1), day(1), false);
    await promotion("Inactive offer secret", active, day(-1), day(1), true, false);
    await promotion("Wrong package secret", draft, day(-1), day(1));
    const repo = await readPublicPackages(client, now.toISOString());
    assert.equal(repo.ok, true);
    assert.equal(repo.value.length, 1);
    assert.equal(repo.value[0].id, active);
    assert.equal(repo.value[0].items.length, 2);
    assert.equal(repo.value[0].promotion.title, "Valid offer");
    assert.equal(repo.value[0].base_price, "1000000.00");
    const authoritative = await resolvePackage(client, { ok: true, actor: { subjectId: "customer", role: "customer" }, parsedData: { packageId: active, createdAt: now.toISOString() } });
    assert.equal(authoritative.ok, true);
    assert.deepEqual(repo.value[0].items.map((x) => x.id).sort(), authoritative.value.items.map((x) => x.id).sort());
    const webPort = await port(); const base = `http://127.0.0.1:${webPort}`;
    server = spawn(process.platform === "win32" ? "cmd.exe" : "npm", process.platform === "win32" ? ["/c", "npm", "run", "dev", "--", "--port", String(webPort)] : ["run", "dev", "--", "--port", String(webPort)], { env: dbEnv, stdio: "ignore" });
    await wait(base + "/api/public/packages", server);
    const api = await (await get(base, "/api/public/packages")).json();
    assert.equal(api.packages.length, 1);
    assert.deepEqual(Object.keys(api.packages[0]).sort(), ["basePrice","description","durationMinutes","id","items","name","offer"].sort());
    assert.equal(api.packages[0].offer.title, "Valid offer");
    assert.equal(api.packages[0].basePrice, 1000000);
    const publicHtml = await (await get(base, "/")).text();
    for (const expected of ["Visible package", "Visible service", "Visible action", "Valid offer", active, "Harga dasar"]) assert.ok(publicHtml.includes(expected), expected);
    for (const denied of ["Draft secret", "Inactive secret", "Expired secret", "Draft offer secret", "Inactive offer secret", "Wrong package secret", "private"]) assert.ok(!publicHtml.includes(denied), denied);
    // Protected booking route redirects anonymous visitors; the public link passes only packageId.
    assert.ok(publicHtml.includes(`/booking?packageId=${active}`));
    await client.query("UPDATE public.master_package SET published = false WHERE id = $1", [active]);
    const none = await (await get(base, "/api/public/packages")).json();
    assert.deepEqual(none.packages, []);
    const emptyHtml = await (await get(base, "/")).text();
    assert.ok(emptyHtml.includes("Belum ada paket yang dipublikasikan"));
    assert.ok(!emptyHtml.includes("Visible package"));
    console.log(JSON.stringify({ status: "PASS", migrations: migrated.migrations, empty: true, draft: true, inactive: true, expired: true, wrongPackage: true, validOffer: true, route: true, reload: true, composition: true, basePrice: true, handoff: true }));
  } finally { await client.end(); }
} finally { if (server) server.kill(); if (started) docker("down", "--volumes", "--remove-orphans"); }
