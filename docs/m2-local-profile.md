# M2 local profile

This profile is disposable and must contain no real customer or payment-proof data. Docker runs PostgreSQL 18.7; the existing fixture `DocumentStore` owns local bytes under the ignored `.local-storage/` tree. The profile adds no migration, seed, or second byte store.

## Fresh verification

Run `node scripts/m2-local-profile.mjs verify` from the repository root. It creates a unique temporary Compose project with a random database password, checks PostgreSQL version and an empty public schema, exercises local `DocumentStore` put/read/remove, then removes the volume and local byte directory. A passing result is independent of any long-running development profile.

## Development startup

Set a fresh, local-only `M2_LOCAL_DB_PASSWORD` in your shell, then run `docker compose -f compose.m2-local.yaml up -d --wait`. PostgreSQL is available at `127.0.0.1:55432`, database/user `bride_local`, with the password from that shell variable. Set `M2_LOCAL_PG_PORT` first if port 55432 is occupied. Keep the password in an ignored local environment, never in a committed file or `NEXT_PUBLIC_` variable. The local DocumentStore continues to use its existing ignored filesystem root; `M1_T18_TEST_STORAGE_ROOT` can point it at an isolated disposable directory.

Stop and erase this development profile with `docker compose -f compose.m2-local.yaml down --volumes`. Delete only the chosen ignored local DocumentStore root after verifying it contains no data you need. The verification command uses its own project and performs its own teardown.

This local profile proves only a development connection and byte seam. The Vercel/Neon account probes and production-like application connection remain separate M2-T01/T03 evidence.
