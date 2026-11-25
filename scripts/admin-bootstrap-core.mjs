import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { authDatabasePool, withDatabase } from "../shared/server/database.mjs";

const key = "first-admin";

export class BootstrapError extends Error {
  constructor(code, attemptId) {
    super(code);
    this.code = code;
    this.attemptId = attemptId;
    this.stack = undefined;
  }
}

function fail(code, attemptId) { throw new BootstrapError(code, attemptId); }

function authService(env) {
  if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32) fail("AUTH_SECRET_MISSING");
  const pool = authDatabasePool(env);
  return {
    auth: betterAuth({
      secret: env.BETTER_AUTH_SECRET,
      database: pool,
      emailAndPassword: { enabled: true },
      user: { additionalFields: { role: { type: "string", required: true, defaultValue: "customer", input: false } } },
    }),
    close: () => pool.end(),
  };
}

async function markerForUpdate(client) {
  const result = await client.query(`SELECT state, attempt_id, attempt_email FROM app.admin_bootstrap_state
    WHERE bootstrap_key = $1 FOR UPDATE`, [key]);
  if (result.rowCount !== 1) fail("BOOTSTRAP_MARKER_MISSING");
  return result.rows[0];
}

async function transaction(callback, env) {
  return withDatabase(async (client) => {
    await client.query("BEGIN");
    try {
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }, env);
}

async function reserve(email, attemptId, env) {
  await transaction(async (client) => {
    const marker = await markerForUpdate(client);
    if (marker.state === "SEALED") fail("BOOTSTRAP_SEALED");
    if (marker.state === "RESERVED") fail("BOOTSTRAP_RESERVED");
    const existing = await client.query(`SELECT
      EXISTS (SELECT 1 FROM auth."user" WHERE role = 'admin') AS admin_exists,
      EXISTS (SELECT 1 FROM auth."user" WHERE lower(email) = $1) AS email_exists`, [email]);
    if (existing.rows[0].admin_exists) fail("BOOTSTRAP_CONFLICT");
    if (existing.rows[0].email_exists) fail("EMAIL_COLLISION");
    await client.query(`UPDATE app.admin_bootstrap_state
      SET state = 'RESERVED', attempt_id = $1, attempt_email = $2, reserved_at = now()
      WHERE bootstrap_key = $3`, [attemptId, email, key]);
  }, env);
}

async function seal(attemptId, env) {
  return transaction(async (client) => {
    const marker = await markerForUpdate(client);
    if (marker.state === "SEALED") fail("BOOTSTRAP_SEALED");
    if (marker.state !== "RESERVED" || marker.attempt_id !== attemptId) fail("ATTEMPT_MISMATCH");
    const result = await client.query(`SELECT u.id FROM auth."user" AS u
      WHERE u.email = $1 AND u.role = 'admin'
        AND EXISTS (SELECT 1 FROM auth.account AS a WHERE a."userId" = u.id
          AND a."providerId" = 'credential' AND a.password IS NOT NULL)`, [marker.attempt_email]);
    if (result.rowCount !== 1) fail("RECONCILIATION_UNVERIFIED", attemptId);
    await client.query(`UPDATE app.admin_bootstrap_state SET state = 'SEALED',
      initial_user_id = $1, sealed_at = now() WHERE bootstrap_key = $2`, [result.rows[0].id, key]);
    return { state: "SEALED", attemptId, email: marker.attempt_email, userId: result.rows[0].id };
  }, env);
}

export async function bootstrapAdmin({ email, name, password }, env = process.env) {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) fail("INVALID_EMAIL");
  if (!name?.trim()) fail("INVALID_NAME");
  if (!password) fail("INVALID_PASSWORD");
  const attemptId = randomUUID();
  const service = authService(env);
  try {
    await reserve(normalizedEmail, attemptId, env);
    // Better Auth creates the identity and hashed credential. The role is
    // changed only for the freshly returned user, under the reserved attempt.
    let created;
    try {
      created = await service.auth.api.signUpEmail({ body: { email: normalizedEmail, name: name.trim(), password } });
    } catch { fail("IDENTITY_CREATION_FAILED", attemptId); }
    if (!created?.user?.id) fail("IDENTITY_CREATION_FAILED", attemptId);
    await transaction(async (client) => {
      const marker = await markerForUpdate(client);
      if (marker.state !== "RESERVED" || marker.attempt_id !== attemptId) fail("ATTEMPT_MISMATCH", attemptId);
      const promoted = await client.query(`UPDATE auth."user" SET role = 'admin', "updatedAt" = now()
        WHERE id = $1 AND email = $2 AND role = 'customer' RETURNING id`, [created.user.id, normalizedEmail]);
      if (promoted.rowCount !== 1) fail("IDENTITY_VERIFICATION_FAILED", attemptId);
    }, env);
    return await seal(attemptId, env);
  } finally {
    await service.close();
  }
}

export async function reconcileAdmin(attemptId, env = process.env) {
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(attemptId ?? "")) fail("ATTEMPT_ID_REQUIRED");
  return seal(attemptId, env);
}
