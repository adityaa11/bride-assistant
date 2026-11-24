import pg from "pg";

export class DatabaseConfigError extends Error {
  constructor(code) {
    super(code);
    this.name = "DatabaseConfigError";
    this.code = code;
  }
}

export function databaseConfig(env = process.env) {
  const mode = env.DATABASE_MODE;
  if (mode !== "local" && mode !== "production") throw new DatabaseConfigError("DATABASE_MODE_INVALID");
  if (!env.DATABASE_URL) throw new DatabaseConfigError("DATABASE_URL_MISSING");
  if (!env.DATABASE_EXPECTED_NAME) throw new DatabaseConfigError("DATABASE_EXPECTED_NAME_MISSING");
  let url;
  try { url = new URL(env.DATABASE_URL); } catch { throw new DatabaseConfigError("DATABASE_URL_INVALID"); }
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") throw new DatabaseConfigError("DATABASE_URL_INVALID");
  if (!url.hostname || !url.username || !url.password || !url.pathname.slice(1)) throw new DatabaseConfigError("DATABASE_URL_INVALID");
  const database = decodeURIComponent(url.pathname.slice(1));
  if (database !== env.DATABASE_EXPECTED_NAME) throw new DatabaseConfigError("DATABASE_TARGET_MISMATCH");
  if (mode === "production") {
    if (!env.DATABASE_EXPECTED_HOST || url.hostname !== env.DATABASE_EXPECTED_HOST) throw new DatabaseConfigError("DATABASE_TARGET_MISMATCH");
    if (url.searchParams.get("sslmode") !== "verify-full") throw new DatabaseConfigError("DATABASE_TLS_UNSAFE");
    if (!url.hostname.endsWith(".aws.neon.tech")) throw new DatabaseConfigError("DATABASE_TARGET_MISMATCH");
  } else if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname)) {
    throw new DatabaseConfigError("DATABASE_LOCAL_TARGET_UNSAFE");
  }
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 5432,
    database,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    ssl: mode === "production" ? { rejectUnauthorized: true, servername: url.hostname } : false,
    connectionTimeoutMillis: 10000,
  };
}

export function databaseClient(env = process.env) {
  return new pg.Client(databaseConfig(env));
}

// Better Auth uses the same validated connection configuration, with its own
// schema selected for unqualified adapter queries.
export function authDatabasePool(env = process.env) {
  return new pg.Pool({ ...databaseConfig(env), options: "-c search_path=auth,public" });
}

export async function databaseState(client) {
  const result = await client.query(`SELECT current_database() AS database,
    current_setting('server_version') AS version,
    to_regclass('public.schema_migrations') IS NOT NULL AS migrated`);
  const state = result.rows[0];
  if (!state.migrated) return { database: state.database, version: state.version, migrated: false, migrations: [] };
  const migrations = await client.query("SELECT version FROM public.schema_migrations ORDER BY version");
  return { database: state.database, version: state.version, migrated: true, migrations: migrations.rows.map((row) => row.version) };
}

export async function withDatabase(callback, env = process.env) {
  const client = databaseClient(env);
  try {
    await client.connect();
    return await callback(client);
  } finally {
    await client.end().catch(() => {});
  }
}
