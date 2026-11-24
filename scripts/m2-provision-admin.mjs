import { withDatabase } from "../shared/server/database.mjs";

// Operator-only: promote an existing credential identity. No public endpoint or
// registration flag can create an administrator.
const email = process.env.ADMIN_PROVISION_EMAIL?.trim().toLowerCase();
if (!email) {
  console.error("ADMIN_PROVISION_EMAIL_MISSING");
  process.exitCode = 1;
} else {
  try {
    const changed = await withDatabase(async (client) => {
      const result = await client.query(`UPDATE auth."user" AS u SET role = 'admin', "updatedAt" = now()
        WHERE lower(u.email) = $1 AND u.role = 'customer'
          AND EXISTS (SELECT 1 FROM auth.account AS a WHERE a."userId" = u.id AND a."providerId" = 'credential')
        RETURNING u.id`, [email]);
      return result.rowCount;
    });
    if (changed !== 1) throw new Error("ADMIN_PROVISION_TARGET_NOT_FOUND");
    console.log("ADMIN_PROVISIONED");
  } catch (error) {
    console.error(error?.message === "ADMIN_PROVISION_TARGET_NOT_FOUND" ? error.message : "ADMIN_PROVISION_FAILED");
    process.exitCode = 1;
  }
}
