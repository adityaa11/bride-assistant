import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import ts from "typescript";
import { z } from "zod";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const project = `bride-m2-t06-${randomBytes(5).toString("hex")}`;
const password = randomBytes(24).toString("hex");
const env = { ...process.env, M2_LOCAL_DB_PASSWORD: password, M2_LOCAL_PG_PORT: "0" };
const temporary = await mkdtemp(join(tmpdir(), "bride-m2-t06-"));
process.env.M1_T18_TEST_STORAGE_ROOT = join(temporary, "portfolio");

function docker(...args) {
  return execFileSync("docker", ["compose", "-p", project, "-f", "compose.m2-local.yaml", ...args],
    { cwd: root, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

const nativeRequire = createRequire(import.meta.url);
const modules = new Map();
function load(path) {
  const file = resolve(root, path);
  if (modules.has(file)) return modules.get(file).exports;
  const loadedModule = { exports: {} };
  modules.set(file, loadedModule);
  const source = readFileSync(file, "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const require = (name) => name === "server-only" ? {} : name.startsWith("@/") ? load(`${name.slice(2)}.ts`) :
    name.startsWith("./") ? load(resolve(file, "..", `${name}.ts`)) : nativeRequire(name);
  new Function("require", "module", "exports", compiled)(require, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

const samples = {
  portfolio: { mediaType: "image/jpeg", bytes: Uint8Array.of(0xff, 0xd8, 0xff, 0xd9) },
  testimonials: { mediaType: "image/png", bytes: Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10, 1) },
  events: { mediaType: "image/webp", bytes: Uint8Array.from(Buffer.from("RIFFxxxxWEBP", "ascii")) },
  "payment-proofs": { mediaType: "application/pdf", bytes: Uint8Array.from(Buffer.from("%PDF-1.7\n%%EOF", "ascii")) },
};

let started = false;
let server;
try {
  docker("up", "-d", "--wait");
  started = true;
  const port = Number(docker("port", "postgres", "5432").split(":").at(-1));
  const databaseUrl = `postgresql://bride_local:${password}@127.0.0.1:${port}/bride_local`;
  const migrationEnv = { ...env, DATABASE_MODE: "local", DATABASE_URL: databaseUrl, DATABASE_EXPECTED_NAME: "bride_local" };
  const migration = execFileSync(process.execPath, ["scripts/m2-migrate.mjs"], { cwd: root, env: migrationEnv, encoding: "utf8" }).trim();
  assert.deepEqual(JSON.parse(migration).migrations, ["0001", "0002"]);

  const { localDocumentStore } = load("shared/server/local-document-store.ts");
  const store = localDocumentStore();
  assert.equal(existsSync(process.env.M1_T18_TEST_STORAGE_ROOT), false);
  assert.equal(await store.read("0".repeat(32)), null);
  assert.equal(await store.read("../invalid"), null);
  const keys = new Set();
  for (const [collection, input] of Object.entries(samples)) {
    const metadata = await store.put({ ...input, collection });
    assert.match(metadata.storageKey, /^[a-f0-9]{32}$/);
    assert.equal(keys.has(metadata.storageKey), false);
    keys.add(metadata.storageKey);
    assert.equal(metadata.sha256, createHash("sha256").update(input.bytes).digest("hex"));
    assert.equal(metadata.size, input.bytes.length);
    assert.equal(metadata.mediaType, input.mediaType);
    const read = await store.read(metadata.storageKey);
    assert.deepEqual(Array.from(read?.bytes ?? []), Array.from(input.bytes));
    assert.equal(read?.collection, collection);
    assert.equal(read?.mediaType, input.mediaType);
    assert.equal(read?.sha256, metadata.sha256);
  }
  await assert.rejects(store.put({ collection: "unknown", ...samples.portfolio }), /UNSUPPORTED_DOCUMENT/);
  await assert.rejects(store.put({ collection: "payment-proofs", mediaType: "text/plain", bytes: samples.portfolio.bytes }), /UNSUPPORTED_DOCUMENT/);
  assert.equal(await store.read("0".repeat(32)), null);

  const { decideActorInput } = load("shared/server/authorization-decision.ts");
  const schema = z.object({ recordId: z.string().min(1), value: z.string().min(1) }).strict();
  const actor = { subjectId: "owner-1", role: "customer", sessionId: "disposable", expiresAt: new Date(Date.now() + 60_000) };
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const schemaRows = await client.query(`SELECT n.nspname AS schema_name, t.relname AS table_name,
      c.contype AS kind, string_agg(a.attname::text, ',' ORDER BY k.ordinality) AS columns,
      fn.nspname AS foreign_schema, ft.relname AS foreign_table
      FROM pg_class t JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN pg_constraint c ON c.conrelid = t.oid
      JOIN unnest(c.conkey) WITH ORDINALITY AS k(attnum, ordinality) ON true
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
      LEFT JOIN pg_class ft ON ft.oid = c.confrelid
      LEFT JOIN pg_namespace fn ON fn.oid = ft.relnamespace
      WHERE n.nspname IN ('auth', 'public') AND t.relkind = 'r' AND c.contype IN ('p', 'f')
      GROUP BY n.nspname, t.relname, c.oid, c.contype, fn.nspname, ft.relname
      ORDER BY n.nspname, t.relname, c.contype`);
    const shape = schemaRows.rows.map(({ schema_name, table_name, kind, columns, foreign_schema, foreign_table }) =>
      `${schema_name}.${table_name}:${kind}:${columns}${foreign_table ? `->${foreign_schema}.${foreign_table}` : ''}`);
    assert.deepEqual(shape, [
      "auth.account:f:userId->auth.user", "auth.account:p:id", "auth.session:f:userId->auth.user",
      "auth.session:p:id", "auth.user:p:id", "auth.verification:p:id", "public.schema_migrations:p:version",
    ]);
    console.log(`SCHEMA: ${JSON.stringify(shape)}`);
    await client.query("BEGIN");
    await client.query("CREATE TEMP TABLE m2_t06_record (id text PRIMARY KEY, owner_id text NOT NULL, value text NOT NULL) ON COMMIT DROP");
    const before = await client.query("SELECT count(*)::int AS count FROM m2_t06_record");
    assert.equal(before.rows[0].count, 0);
    const lookup = async (id) => (await client.query("SELECT owner_id FROM m2_t06_record WHERE id = $1", [id])).rows[0]?.owner_id ?? null;
    const payload = { recordId: "record-1", value: "new" };
    const decision = (candidate, role, owner, value = payload) => decideActorInput({ actor: candidate, requiredRole: role, recordOwnerId: owner, payload: value, schema });
    let repositoryCalls = 0;
    const write = async (result) => {
      if (!result.ok) return result;
      if (result.record === "missing") return { ok: false, code: "NOT_FOUND" };
      repositoryCalls++;
      const { recordId, value } = result.parsedData;
      const updated = await client.query("UPDATE m2_t06_record SET value = $1 WHERE id = $2 AND owner_id = $3 RETURNING value", [value, recordId, result.actor.subjectId]);
      return updated.rows[0] ? { ok: true, value: updated.rows[0].value } : { ok: false, code: "NOT_FOUND" };
    };
    for (const denied of [decision(null, "customer", null), decision(actor, "admin", null),
      decision(actor, "customer", "other-owner"), decision(actor, "customer", null, { ...payload, role: "admin" })]) {
      assert.equal((await write(denied)).ok, false);
    }
    assert.equal(repositoryCalls, 0);
    assert.deepEqual(await write(decision(actor, "customer", await lookup(payload.recordId))), { ok: false, code: "NOT_FOUND" });
    await client.query("INSERT INTO m2_t06_record VALUES ($1, $2, $3)", [payload.recordId, actor.subjectId, "old"]);
    assert.deepEqual(await write(decision(actor, "customer", await lookup(payload.recordId))), { ok: true, value: "new" });
    assert.equal(repositoryCalls, 1);
    assert.equal((await client.query("SELECT value FROM m2_t06_record WHERE id = $1", [payload.recordId])).rows[0].value, "new");
    await client.query("ROLLBACK");
  } finally { await client.end(); }

  const webPort = 30000 + Math.floor(Math.random() * 10000);
  const base = `http://127.0.0.1:${webPort}`;
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(webPort)],
    { cwd: root, env: { ...migrationEnv, M1_T18_TEST_STORAGE_ROOT: process.env.M1_T18_TEST_STORAGE_ROOT,
      BETTER_AUTH_SECRET: randomBytes(32).toString("hex"), BETTER_AUTH_URL: base }, stdio: "ignore" });
  let available = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    try { if ((await fetch(`${base}/api/fixtures/m1-t15/content-media`)).ok) { available = true; break; } }
    catch { /* startup */ }
    await new Promise((done) => setTimeout(done, 200));
  }
  assert.equal(available, true, "fixture route did not start");
  const routeBase = `${base}/api/fixtures/m1-t15/content-media`;
  assert.deepEqual(await (await fetch(routeBase)).json(), {});
  for (const [collection, recordId] of [["portfolio", "portfolio-new"], ["testimonials", "testimonial-new"], ["events", "event-new"]]) {
    const input = samples[collection];
    const form = new FormData();
    form.set("image", new File([input.bytes], "fixture.png", { type: input.mediaType }));
    form.set("recordId", recordId);
    form.set("altText", "Disposable fixture");
    const response = await fetch(routeBase, { method: "POST", body: form });
    assert.equal(response.status, 201, `${collection} fixture route upload`);
    const metadata = await response.json();
    assert.equal(metadata.mediaType, input.mediaType);
    const readResponse = await fetch(`${routeBase}/${metadata.storageKey}`);
    assert.equal(readResponse.status, 200);
    assert.deepEqual(Array.from(new Uint8Array(await readResponse.arrayBuffer())), Array.from(input.bytes));
  }

  const [byteContract, repositoryContract, facade, route, fixture] = await Promise.all([
    "shared/document-store.ts", "shared/server/repository-contracts.ts", "shared/server/local-content-image-store.ts",
    "app/api/fixtures/m1-t15/content-media/route.ts", "shared/scenarios/adapter.ts",
  ].map((path) => readFile(resolve(root, path), "utf8")));
  assert.match(byteContract, /"payment-proofs"/);
  assert.match(repositoryContract, /AuthorizationResult/);
  assert.match(repositoryContract, /server-only/);
  assert.match(facade, /documents\.put/);
  assert.match(route, /localContentImageStore/);
  assert.match(fixture, /Non-authoritative fixture/);
  assert.doesNotMatch(repositoryContract, /shared\/scenarios|local-document-store|storageKey/);
  assert.deepEqual((await readdir(resolve(root, "migrations"))).filter((name) => name.endsWith(".sql")).sort(),
    ["0001_schema_migrations.sql", "0002_better_auth_identity.sql"]);
  console.log("PASS: four upload classes, opaque metadata, byte/collection isolation, denied/missing/empty repository contracts, three live fixture routes, rollback, and unchanged migrations");
} finally {
  if (server) server.kill();
  if (started) docker("down", "--volumes", "--remove-orphans");
  await rm(temporary, { recursive: true, force: true });
}
