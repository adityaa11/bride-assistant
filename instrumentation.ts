export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.VERCEL_ENV !== "production" && process.env.DATABASE_MODE === undefined) return;
  try {
    const { databaseState, withDatabase } = await import("@/shared/server/database.mjs");
    const state = await withDatabase(databaseState);
    if (!state.migrated || !state.migrations.includes("0001")) throw new Error("DATABASE_MIGRATION_PENDING");
  } catch {
    throw new Error("DATABASE_STARTUP_FAILED");
  }
}
