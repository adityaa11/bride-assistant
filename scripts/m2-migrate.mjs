import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { databaseState, withDatabase } from "../shared/server/database.mjs";

const root = resolve(import.meta.dirname, "..");
const directory = resolve(root, process.argv[2] ?? "migrations");
if (directory !== resolve(root, "migrations") && !directory.startsWith(resolve(root, "migrations") + sep)) {
  throw new Error("MIGRATION_DIRECTORY_INVALID");
}

try {
  const files = (await readdir(directory)).filter((file) => /^\d{4}_[a-z0-9_]+\.sql$/.test(file)).sort();
  if (!files.length) throw new Error("MIGRATIONS_MISSING");
  const state = await withDatabase(async (client) => {
    for (const file of files) {
      const sql = await readFile(resolve(directory, file), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const version = file.slice(0, 4);
      await client.query("BEGIN");
      try {
        // Transaction pooling keeps this lock and every migration statement on one backend.
        await client.query("SELECT pg_advisory_xact_lock(22641, 3)");
        const ledgerExists = (await client.query("SELECT to_regclass('public.schema_migrations') IS NOT NULL AS present")).rows[0].present;
        const applied = ledgerExists ? (await client.query("SELECT checksum FROM public.schema_migrations WHERE version = $1", [version])).rows[0] : undefined;
        if (applied) {
          if (applied.checksum !== checksum) throw new Error("MIGRATION_CHECKSUM_MISMATCH");
        } else {
          await client.query(sql);
          await client.query("INSERT INTO public.schema_migrations (version, checksum) VALUES ($1, $2)", [version, checksum]);
        }
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
    return databaseState(client);
  });
  console.log(JSON.stringify({ status: "ok", database: state.database, serverVersion: state.version, migrations: state.migrations }));
} catch (error) {
  console.error(`MIGRATION_FAILED: ${error?.code ?? (error?.message?.startsWith("MIGRATION_") ? error.message : "DATABASE_ERROR")}`);
  process.exitCode = 1;
}
