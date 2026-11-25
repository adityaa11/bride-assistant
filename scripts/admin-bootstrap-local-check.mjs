import assert from "node:assert/strict";
import { betterAuth } from "better-auth";
import { bootstrapAdmin, reconcileAdmin, BootstrapError } from "./admin-bootstrap-core.mjs";
import { authDatabasePool, withDatabase } from "../shared/server/database.mjs";

if (process.env.DATABASE_MODE !== "local" || process.env.DATABASE_EXPECTED_NAME !== "bride_local"
  || process.env.M2_ADMIN_BOOTSTRAP_DISPOSABLE !== "1") {
  throw new Error("LOCAL_DISPOSABLE_DATABASE_REQUIRED");
}

const email = `bootstrap-${Date.now()}@example.test`;
const password = "Disposable-Password-123";
const schema = await withDatabase(async (client) => {
  const columns = await client.query(`SELECT table_schema, table_name, column_name
    FROM information_schema.columns WHERE (table_schema, table_name) IN
      (('app', 'admin_bootstrap_state'), ('auth', 'user'), ('auth', 'account'))`);
  const constraints = await client.query(`SELECT c.conname, c.contype,
      c.conrelid::regclass::text AS source, c.confrelid::regclass::text AS target
    FROM pg_constraint AS c WHERE c.conrelid IN
      ('app.admin_bootstrap_state'::regclass, 'auth."user"'::regclass, 'auth.account'::regclass)`);
  return { columns: columns.rows, constraints: constraints.rows };
});
const hasColumn = (schemaName, table, column) => schema.columns.some((row) =>
  row.table_schema === schemaName && row.table_name === table && row.column_name === column);
for (const column of ["bootstrap_key", "state", "attempt_id", "attempt_email", "initial_user_id", "reserved_at", "sealed_at"]) {
  assert.ok(hasColumn("app", "admin_bootstrap_state", column), `ERD column ${column}`);
}
assert.ok(hasColumn("auth", "user", "id") && hasColumn("auth", "user", "role"));
assert.ok(hasColumn("auth", "account", "userId") && hasColumn("auth", "account", "password"));
assert.ok(schema.constraints.some((row) => row.contype === "p" && row.source === "app.admin_bootstrap_state"));
assert.ok(schema.constraints.some((row) => row.contype === "f" && row.source === "app.admin_bootstrap_state" && row.target === 'auth."user"'));
assert.ok(schema.constraints.some((row) => row.contype === "f" && row.source === "auth.account" && row.target === 'auth."user"'));
const result = await bootstrapAdmin({ email, name: "Disposable Administrator", password });
assert.equal(result.state, "SEALED");
assert.equal(result.email, email);
for (const action of [
  () => bootstrapAdmin({ email: `second-${Date.now()}@example.test`, name: "Second", password }),
  () => reconcileAdmin(result.attemptId),
]) {
  await assert.rejects(action, (error) => error instanceof BootstrapError && error.code === "BOOTSTRAP_SEALED");
}
const rows = await withDatabase((client) => client.query(`SELECT s.state, s.initial_user_id, u.email, u.role,
  (SELECT count(*)::int FROM auth.account AS a WHERE a."userId" = u.id
    AND a."providerId" = 'credential' AND a.password IS NOT NULL) AS credentials
  FROM app.admin_bootstrap_state AS s JOIN auth."user" AS u ON u.id = s.initial_user_id
  WHERE s.bootstrap_key = 'first-admin'`));
assert.deepEqual(rows.rows, [{ state: "SEALED", initial_user_id: result.userId, email, role: "admin", credentials: 1 }]);
const pool = authDatabasePool();
try {
  const auth = betterAuth({ secret: process.env.BETTER_AUTH_SECRET, database: pool,
    emailAndPassword: { enabled: true },
    user: { additionalFields: { role: { type: "string", required: true, defaultValue: "customer", input: false } } },
  });
  const signedIn = await auth.api.signInEmail({ body: { email, password } });
  assert.equal(signedIn.user.id, result.userId);
  assert.equal(signedIn.user.role, "admin");
} finally { await pool.end(); }
console.log("PASS: ERD keys and relationships match fresh schema; admin sign-in works; sealed marker and repeat rejection verified");
