import assert from "node:assert/strict";
import pg from "pg";
import { databaseConfig, withDatabase } from "../shared/server/database.mjs";

const config = databaseConfig();
assert.equal(process.env.DATABASE_MODE, "production");
assert.deepEqual(config.ssl, { rejectUnauthorized: true, servername: config.host });

const observed = await withDatabase(async (client) => {
  const stream = client.connection.stream;
  assert.equal(stream.encrypted, true);
  assert.equal(stream.authorized, true);
  const state = (await client.query(`SELECT current_database() AS database,
    current_setting('server_version') AS version,
    (SELECT count(*)::int FROM public.schema_migrations) AS migration_count`)).rows[0];
  const tables = (await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")).rows.map((row) => row.table_name);
  const columns = (await client.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns
    WHERE table_schema='public' AND table_name='schema_migrations' ORDER BY ordinal_position`)).rows;
  const keys = (await client.query(`SELECT kcu.column_name, tc.constraint_type FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema
    WHERE tc.table_schema='public' AND tc.table_name='schema_migrations' ORDER BY kcu.ordinal_position`)).rows;
  const foreignKeys = (await client.query(`SELECT constraint_name FROM information_schema.table_constraints
    WHERE table_schema='public' AND constraint_type='FOREIGN KEY'`)).rows;
  const ledger = (await client.query("SELECT version FROM public.schema_migrations ORDER BY version")).rows.map((row) => row.version);
  assert.deepEqual(tables, ["schema_migrations"]);
  assert.deepEqual(columns.map((row) => row.column_name), ["version", "checksum", "applied_at"]);
  assert.deepEqual(keys, [{ column_name: "version", constraint_type: "PRIMARY KEY" }]);
  assert.deepEqual(foreignKeys, []);
  assert.deepEqual(ledger, ["0001"]);
  assert.equal(state.migration_count, 1);
  return { tlsAuthorized: stream.authorized, database: state.database, serverVersion: state.version, tables, columns, keys, foreignKeys, ledger, businessRows: 0 };
});

const bad = new pg.Client({ ...config, ssl: { rejectUnauthorized: true, ca: "invalid test CA" } });
let tlsRejected = false;
let tlsErrorCode = "NONE";
try {
  await bad.connect();
} catch (error) {
  tlsErrorCode = error?.code ?? "UNKNOWN";
  tlsRejected = Boolean(error);
} finally {
  await bad.end().catch(() => {});
}
assert.equal(tlsRejected, true, `invalid certificate authority must fail (observed ${tlsErrorCode})`);
console.log(JSON.stringify({ status: "PASS", ...observed, invalidCertificateAuthorityRejected: tlsRejected, tlsErrorCode }));
