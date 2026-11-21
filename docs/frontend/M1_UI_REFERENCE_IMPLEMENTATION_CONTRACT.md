# M1 UI Reference Implementation Contract

## Purpose

`project's goal/UI Reference/` is the rendered visual authority for every M1
UI surface. Each M1 implementation independently refactors its corresponding
reference page into typed, fixture-backed Next.js components. It must render
the same visual result, including responsive transformations—not an inspired
version of the page or a generic application shell.

This contract supplements each ticket's product, scenario, publication, and
non-authority boundaries. It never authorizes use of reference HTML, CSS,
JavaScript, localStorage, seed data, event handlers, or executable behaviour.

## Ticket-to-reference map

| Ticket | Binding reference | Required composition |
| --- | --- | --- |
| M1-T03 | all files in this table | shared tokens, shells, form/status/focus primitives, and responsive foundations that reproduce—not replace—the reference-specific surfaces |
| M1-T04 | `index.html` | public editorial discovery/home composition |
| M1-T08 | `daftar.html`, `masuk.html` | customer registration and sign-in forms |
| M1-T09 | `home.html`, `bantuan.html` | customer home summary and help/unavailable surface |
| M1-T10 | `booking.html` | customer request workflow and availability presentation |
| M1-T11 | `booking_saya.html` | Booking Saya list/detail and lifecycle presentation |
| M1-T12 | `Bride_Assistant_Planner_Standalone_v3_Content_Management.html` → `Bookings`, `Availability` | admin operational booking list/detail/calendar and availability workspace |
| M1-T13 | same admin reference → `Services & Actions`, `Master Packages` | admin catalogue, services, bundles, packages, and pricing workspace |
| M1-T14 | same admin reference → `Customers` | admin customer list/search/detail workspace |
| M1-T15 | same admin reference → `Portfolio & Testimonials`, `Events` | admin content/publication workspace |
| M1-T16 | same admin reference → `Promotions` | admin promotion list/detail/form workspace |

## Refactor rules

1. Build reusable Next.js components around repeated semantics: public,
   customer, and admin shell families; navigation; controls; field/status
   primitives; tables/cards/calendars; and local composition modules. Do not
   duplicate a page document, paste reference CSS wholesale, or port its
   scripts.
2. Every visible value, list, status, form state, and apparent action comes
   through the T02 typed scenario adapter. Components take typed presentation
   props; they do not import raw reference seeds, retain reference storage, or
   create authority.
3. Preserve each reference page's actual information architecture. Shared
   components may share implementation, never force the public editorial,
   customer workflow, and admin data-workspace surfaces into one layout.
4. When a required fixture state is absent from its reference, extend the
   nearest corresponding component using its exact shell, type roles, spacing,
   interaction treatment, and responsive rules. It may not introduce a new
   local visual language.

## Static asset boundary

Run `node scripts/extract-ui-reference-assets.mjs` whenever reference assets
change. It extracts all data-image and static inline-SVG visual assets from all
eight reference pages into `public/reference-assets/ui-reference/` and writes
`manifest.json` with provenance. Use those local audited assets (or the
named, role-specific assets in `public/reference-assets/`) for their
corresponding screen only.

Before use, SVG extraction rejects scripts, event attributes, and
`foreignObject`. Do not add external media origins. Do not use embedded
reference source as a runtime asset, and do not reuse prototype icons or art
outside the mapped visual role without an explicit ticket amendment.

## Responsive extraction rule

For every mapped reference page, read its actual media queries and carry their
transformations into the component contract: shell width/padding, grid or
column changes, navigation replacement/overflow behavior, type scaling,
control layout, table/calendar containment, and artwork geometry. Breakpoints
must be the reference page's breakpoints, unless the same result requires an
equivalent container-based rule. Mobile must be intentionally recomposed, not
shrunk or clipped desktop UI.

For the shared admin reference, preserve its documented transformations:

- at 1250px: narrower sidebar/content and two-column package grid;
- at 930px: stacked app shell and horizontally scrollable admin navigation;
- at 485px: single-column content grids, compact calendar/table/control rules.

For public and customer pages, preserve each page's own reference media
queries, including its exact narrow shell, form/action stacking, menu behavior,
and content-fit rules.

## Visual acceptance rule

For M1-T08–T16, the ticket-specific inspection, asset inventory, breakpoint,
scenario, and evidence requirements in
`docs/frontend/M1_REMAINING_UI_REFERENCE_CONTRACT.md` are binding. Complete the
reference ledger before implementing a mapped screen and close every material
comparison finding before a visual handoff. M1-T04 retains its own more
specific public rendered-reference contract.

For every mapped route and state, capture the implementation beside the source
reference at the same desktop viewport and every defined narrow breakpoint.
Review visible structure, hierarchy, copy, typography, colors, spacing,
geometry, imagery/icon treatment, navigation, focus treatment, and responsive
composition. Record the comparison and correct every material mismatch.

Build, lint, unit tests, similar styling, and functional equivalence are not
visual evidence. A ticket passes only when its mapped reference captures have
no material visible mismatch, while fixture, accessibility, and security
contracts also pass.
