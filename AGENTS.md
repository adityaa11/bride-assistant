<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## SQL migration review contract

For any ticket that creates, changes, removes, runs, or depends on SQL migrations,
the ticket must require a reviewer-visible ERD. At planning time, show the
proposed affected tables and relationships, or explicitly identify an unchanged
schema when the work only changes data or migration tooling. At implementation
review, commit a rendered SVG or PNG of the actual schema to the Atlas evidence
store, embed it in the GO/CFC checkpoint, and show it in the user-facing handoff.
The diagram must name the affected tables, primary keys, foreign keys, and
relationship cardinalities. Show before and after states when the migration
changes structure; for an unchanged schema, show the current state and say why
it is unchanged. Link each migration file or version to the diagram and verify
the diagram against a fresh migrated database. CK must inspect the rendered
diagram and that comparison before approving the migration work. A Mermaid
source block, migration inventory, or file path alone does not satisfy the
visible ERD requirement.
