import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { databaseConfig, databaseState, withDatabase } from "../shared/server/database.mjs";

const root = resolve(import.meta.dirname, "..");
const project = `bride-m2-t03-${randomBytes(5).toString("hex")}`;
const password = randomBytes(24).toString("hex");
const composeEnv = { ...process.env, M2_LOCAL_DB_PASSWORD: password, M2_LOCAL_PG_PORT: "0" };
function docker(...args) {
  return execFileSync("docker", ["compose", "-p", project, "-f", "compose.m2-local.yaml", ...args], { cwd: root, env: composeEnv, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function migrate(env) {
  return JSON.parse(execFileSync(process.execPath, ["scripts/m2-migrate.mjs"], { cwd: root, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
}
async function freePort() {
  const server = createServer();
  await new Promise((resolveReady) => server.listen(0, "127.0.0.1", resolveReady));
  const port = server.address().port;
  await new Promise((resolveClosed) => server.close(resolveClosed));
  return port;
}
async function probeServer(env) {
  const port = await freePort();
  const processServer = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], { cwd: root, env, stdio: "ignore", windowsHide: true });
  try {
    for (let attempt = 0; attempt < 120; attempt++) {
      if (processServer.exitCode !== null) throw new Error("SERVER_EXITED");
      try {
        const response = await fetch(`http://127.0.0.1:${port}/api/system/database`, { signal: AbortSignal.timeout(1500) });
        const body = await response.json();
        assert.equal(response.status, 200);
        assert.equal(body.status, "ready");
        assert.equal(body.database, "bride_local");
        assert.deepEqual(body.migrations, ["0001"]);
        return { status: response.status, body };
      } catch {
        await delay(250);
      }
    }
    throw new Error("SERVER_PROBE_TIMEOUT");
  } finally {
    processServer.kill();
  }
}
async function probeStartupFailure(env) {
  const port = await freePort();
  const invalidEnv = { ...env, DATABASE_URL: "invalid" };
  const processServer = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], { cwd: root, env: invalidEnv, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  let stderr = "";
  processServer.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
  try {
    for (let attempt = 0; attempt < 80; attempt++) {
      if (processServer.exitCode !== null || stderr.includes("DATABASE_STARTUP_FAILED")) break;
      await delay(250);
    }
    assert.match(stderr, /DATABASE_STARTUP_FAILED/);
    assert.doesNotMatch(stderr, /postgres:\/\//);
    let routeStatus = "unreachable";
    try {
      routeStatus = (await fetch(`http://127.0.0.1:${port}/api/system/database`, { signal: AbortSignal.timeout(1500) })).status;
    } catch { /* the failed startup has no listening route */ }
    assert.notEqual(routeStatus, 200);
    return { startupRejected: true, routeStatus, redactedError: "DATABASE_STARTUP_FAILED" };
  } finally {
    processServer.kill();
  }
}

const negative = [
  [{ DATABASE_MODE: "production", DATABASE_EXPECTED_NAME: "bride_assistant" }, "DATABASE_URL_MISSING"],
  [{ DATABASE_MODE: "production", DATABASE_URL: "invalid", DATABASE_EXPECTED_NAME: "bride_assistant" }, "DATABASE_URL_INVALID"],
  [{ DATABASE_MODE: "production", DATABASE_URL: "postgres://u:p@example.aws.neon.tech/bride_assistant", DATABASE_EXPECTED_NAME: "bride_assistant", DATABASE_EXPECTED_HOST: "example.aws.neon.tech" }, "DATABASE_TLS_UNSAFE"],
  [{ DATABASE_MODE: "production", DATABASE_URL: "postgres://u:p@wrong.aws.neon.tech/bride_assistant?sslmode=verify-full", DATABASE_EXPECTED_NAME: "bride_assistant", DATABASE_EXPECTED_HOST: "expected.aws.neon.tech" }, "DATABASE_TARGET_MISMATCH"],
  [{ DATABASE_MODE: "local", DATABASE_URL: "postgres://u:p@remote.example/bride_local", DATABASE_EXPECTED_NAME: "bride_local" }, "DATABASE_LOCAL_TARGET_UNSAFE"],
];
for (const [env, code] of negative) assert.throws(() => databaseConfig(env), { code });
console.log("Config negatives: missing/invalid secret, unsafe production TLS, wrong target, remote local target rejected without credential echo");

try {
  docker("up", "-d", "--wait");
  const port = Number(docker("port", "postgres", "5432").match(/:(\d+)$/)?.[1]);
  assert.ok(port > 0);
  const env = { ...process.env, DATABASE_MODE: "local", DATABASE_EXPECTED_NAME: "bride_local", DATABASE_URL: `postgres://bride_local:${password}@127.0.0.1:${port}/bride_local` };
  const before = await withDatabase(async (client) => {
    const state = await databaseState(client);
    const tables = (await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")).rows;
    assert.equal(state.migrated, false);
    assert.equal(tables.length, 0);
    return { version: state.version, tables: tables.map((row) => row.table_name) };
  }, env);
  const first = migrate(env);
  const second = migrate(env);
  assert.deepEqual(first.migrations, ["0001"]);
  assert.deepEqual(second.migrations, first.migrations);
  const after = await withDatabase(async (client) => {
    const columns = (await client.query(`SELECT column_name, data_type, is_nullable
      FROM information_schema.columns WHERE table_schema='public' AND table_name='schema_migrations' ORDER BY ordinal_position`)).rows;
    const keys = (await client.query(`SELECT kcu.column_name, tc.constraint_type
      FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema
      WHERE tc.table_schema='public' AND tc.table_name='schema_migrations' ORDER BY kcu.ordinal_position`)).rows;
    const tables = (await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")).rows.map((row) => row.table_name);
    const ledger = (await client.query("SELECT version FROM public.schema_migrations ORDER BY version")).rows.map((row) => row.version);
    assert.deepEqual(tables, ["schema_migrations"]);
    assert.deepEqual(columns.map((row) => row.column_name), ["version", "checksum", "applied_at"]);
    assert.deepEqual(keys, [{ column_name: "version", constraint_type: "PRIMARY KEY" }]);
    assert.deepEqual(ledger, ["0001"]);
    await client.query("CREATE SCHEMA m2_t03_disposable_test");
    await client.query("CREATE TABLE m2_t03_disposable_test.fixture (id integer PRIMARY KEY)");
    await client.query("INSERT INTO m2_t03_disposable_test.fixture VALUES (1)");
    await client.query("DROP SCHEMA m2_t03_disposable_test CASCADE");
    const testSchema = (await client.query("SELECT count(*)::int AS count FROM information_schema.schemata WHERE schema_name='m2_t03_disposable_test'")).rows[0].count;
    assert.equal(testSchema, 0);
    return { tables, columns, keys, foreignKeys: [], ledger, businessRows: 0, testSchemaAfterTeardown: testSchema };
  }, env);
  const server = await probeServer(env);
  const invalidStartup = await probeStartupFailure(env);
  console.log(JSON.stringify({ status: "PASS", before, after, repeatMigrations: second.migrations, server, invalidStartup }));
} finally {
  docker("down", "--volumes", "--remove-orphans");
  console.log("Disposable Compose volume removed");
}
