import { databaseState, withDatabase } from "@/shared/server/database.mjs";

export const runtime = "nodejs";

export async function GET() {
  try {
    const state = await withDatabase(databaseState);
    if (!state.migrated || !state.migrations.includes("0001")) {
      return Response.json({ status: "migration_pending" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    return Response.json({ status: "ready", database: state.database, serverVersion: state.version, migrations: state.migrations, nodeVersion: process.version }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "database_unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
