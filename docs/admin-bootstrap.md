# First administrator bootstrap

Run this once per new, migrated installation from a trusted interactive terminal. The
command creates a new Better Auth credential identity with the `admin` role and
seals the one-time `app.admin_bootstrap_state` marker. Customer registration
continues to create only `customer` identities.

## Prerequisites

- Apply migrations `0001` through `0003` using `node scripts/m2-migrate.mjs`.
- Set the existing server-only `DATABASE_MODE`, `DATABASE_URL`,
  `DATABASE_EXPECTED_NAME`, and, in production, `DATABASE_EXPECTED_HOST`.
- Set a `BETTER_AUTH_SECRET` of at least 32 characters. Use a terminal with
  interactive input. Keep the database URL and secret out of logs and tickets.
- Use an email that does not already belong to a customer or administrator.

## Bootstrap

```bash
npm run admin -- bootstrap --email admin@example.com --name "Administrator"
```

Enter and confirm the initial password at the prompts. The CLI accepts no
password argument or environment variable and does not echo input. On success,
sign in at `/admin/masuk` with the new account. The output reports the email,
role, and sealed state, without printing credentials or session tokens.

The command first reserves a unique attempt in PostgreSQL. Better Auth creates
the user and hashed credential; the coordinator promotes only that freshly
created user ID and verifies the admin credential before sealing. A second
bootstrap cannot run after reservation or sealing. The prior customer-promotion
script is removed.

## Interrupted attempt

If a run fails after reservation, record the attempt ID printed by the command.
Run only:

```bash
npm run admin -- reconcile --attempt-id <recorded-attempt-id>
```

Reconciliation verifies and seals an already-created admin credential with the
reserved email. It does not create or promote an identity. If the original
attempt failed before the role change, reconciliation fails closed and the
reservation stays in place for controlled infrastructure recovery. Do not reset
the marker or reuse an unrelated account.

## Schema and local verification

Migration `0003_admin_bootstrap_state.sql` adds only the `app` schema and
`admin_bootstrap_state` table. It owns the one-time reservation and transition
invariants. It references `auth.user` but does not own identity, credential,
session, or general authorization data. The [rendered ERD](admin-bootstrap-actual.svg)
shows the affected tables, keys, and cardinalities. The disposable local check
uses a fresh, disposable M2 PostgreSQL profile, applies all migrations, sets
`M2_ADMIN_BOOTSTRAP_DISPOSABLE=1`, and runs
`node scripts/admin-bootstrap-local-check.mjs` with disposable credentials.
