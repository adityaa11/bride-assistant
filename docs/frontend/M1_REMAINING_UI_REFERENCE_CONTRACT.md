# M1-T08–T16 Rendered Reference Contract

## Authority and entry gate

This contract binds M1-T08 through M1-T16 to their mapped pages and panels in
`project's goal/UI Reference/`. It supplements each ticket's T02 scenario,
publication, identity, and non-authority rules. M1-T04's completed public
contract is the precedent for the evidence standard, not a visual template for
customer or admin pages.

For M1-T13–T16, the shared admin layout in `AdminWorkspaceFrame` is the
shell authority, including its full-width desktop geometry and mobile drawer.
Reference fidelity applies to the ticket-specific content within that shell.
Do not accept a route that copies or overrides the shared sidebar, navigation,
top bar, title region, or outer responsive rules. Any justified shell change
must be made centrally and regression-checked on Bookings and Availability as
well as the new route. This is the user-authorized exception to conflicting
admin reference shell rules.

Before implementation of each ticket, record a short reference ledger in its
checkpoint or an attached evidence file. The ledger names every mapped page or
admin panel, its desktop viewport, ordered visible regions, source text and
type roles, palette, shell and panel geometry, imagery/icon roles, responsive
breakpoints and transformations, script-driven visible interactions, and all
ticket-required fixture states. Use
measured values from the rendered source and its CSS where useful. Resolve an
unclear reference detail before coding it. Extract components from actual
reference regions; T03 primitives may implement common semantics only when
they preserve each page's DOM relationships and rendered composition.

## Ticket-specific visible composition

| Ticket | Required rendered landmarks | Narrow transformations to inspect |
| --- | --- | --- |
| T08 | `daftar.html` and `masuk.html`: full-height split editorial/form shell; brand, eyebrow, serif headline and flower art on the editorial side; top navigation, form title/subtitle, labeled fields, help/link actions, primary submit and demo/status treatment on the form side. Preserve the distinct registration and sign-in copy and field sets. | At 1000px, rebalance editorial/form columns. At 700px, stack editorial above form with compact art and typography. At 380px, reduce inline padding and allow the inline row to wrap. |
| T09 | `home.html`: customer navigation and page heading, greeting hero with botanical/stamp art and actions, summary cards, booking section, package/help areas and footer. `bantuan.html`: shared customer chrome, help intro, dominant help card and its action/status treatment. | At 1050px, compact navigation/hero. At 820px, replace desktop navigation with its mobile menu and narrow the shell; keep the home hero's reference two-column treatment until 640px. At 640px, stack the home hero, reflow cards/packages and make the help action full width. |
| T10 | `booking.html`: customer chrome, breadcrumb/hero/step cues, package and availability workflow, calendar with legend and date states, booking details/form and result panel. Keep calendar state, labels and disabled treatment visible. | Inspect 1050px, 1000px and 820px rules, including the main-grid change at 1000px and menu behavior at 820px. At 640px, preserve compact calendar cells, one-column fields and full-width result treatment. |
| T11 | `booking_saya.html`: customer chrome, Booking Saya intro, overview tiles, searchable/filterable booking list, selected detail panel, status message/timeline, event/package/customer information and action/result areas. | At 1050px, rebalance the list/detail grid. At 820px, stack list and detail and replace desktop navigation. At 640px, reflow overview tiles, detail sections and actions without clipping. |
| T12 | Admin reference `Bookings` and `Availability`: sidebar/topbar/breadcrumb; title/action region; booking filters, calendar/list toggle, month navigation, booking table/detail; working-hours and blocked-date panels. | Apply admin shell 1250px/930px/485px transformations. Preserve calendar/table containment and readable controls. Inspect the reference's narrower 420px rule when relevant. |
| T13 | Admin `Services & Actions` and `Master Packages`: sidebar/topbar, tab or section controls, action buttons, service/bundle library, package cards, price and composition details, form/result surfaces. | Apply 1250px/930px/485px admin rules, including package-grid reduction and one-column cards/forms. Preserve long names and price hierarchy. |
| T14 | Admin `Customers`: sidebar/topbar, directory heading/action, customer grid/search/no-result state, selected customer heading and booking-history detail. | Apply 1250px/930px/485px admin rules; customer grid becomes one column at 485px, with no clipped names/contact text. |
| T15 | Admin `Portfolio & Testimonials` and `Events`: sidebar/topbar, content tabs, toolbar/actions, publication cards or lists, draft/published labels, media placeholders and form/result surfaces. | Apply admin 1250px/930px/485px rules plus content-specific 1150px/720px/485px grid and toolbar transformations. |
| T16 | Admin `Promotions`: sidebar/topbar, promotion tabs/toolbar, list or cards, period/value/package applicability, form/validation/result surfaces. | Apply admin 1250px/930px/485px rules plus content-specific 1150px/720px/485px grid and toolbar transformations. |

The table is an inspection floor, not permission to omit another visible source
region. Where a fixture state has no source rendering, extend the nearest mapped
component's shell, spacing, type, controls and status treatment; document that
extension in the ledger. Do not turn a visual mockup action into a real account,
booking, admin, publication, payment or communication capability.

## Asset and source boundary

For each mapped page, record the exact local files used and their visual roles
from `public/reference-assets/ui-reference/manifest.json`. Include a positive
inventory of images, logos, artwork and icons visible in the captured states;
state explicitly when a page has none. Keep assets local and specific to their
mapped role. Re-run `node scripts/extract-ui-reference-assets.mjs` only when
source assets change, then inspect the manifest and SVG safety checks.

Use the mapped HTML as the structural refactor input, its CSS as the styling
input, and its JavaScript as the inventory of visible interaction behavior.
Convert them into reviewed TSX components, scoped stylesheets, and React event
handlers according to `M1_UI_REFERENCE_IMPLEMENTATION_CONTRACT.md`. Record the
source-to-component map. Reference seeds, storage, raw script execution,
business decisions, external media origins, and new authority remain excluded.
All displayed data and results come from typed T02 fixtures.

## Acceptance evidence and stop condition

For **each** mapped page or admin panel, capture source and implementation at
the same desktop viewport and at every breakpoint named above. Add a capture
just above and at a breakpoint where the layout changes; record CSS viewport
width if browser zoom or device scale reports a fractional value. Compare in
the same record: ordered regions, shell/panel geometry, exact visible copy,
type roles and wrapping, colors, spacing, art/icon roles, navigation, controls,
focus, overflow and responsive composition. Also check the translated visible
interactions against the reference's behavior within the fixture boundary.
Record each material mismatch and
its correction before claiming VIS-REF PASS. A reference-specific exception
requires a ticket amendment that identifies the conflicting source rule and
the intended visible result; an unrecorded preference is not an exception.

Capture every named T02 scenario and ticket-required loading, empty, error,
validation, selected and non-authoritative result state. Where appropriate,
include negative evidence for public drafts, private data, persistence, active
external links, or authority claims. Check keyboard order, labels, visible
focus, menu/dialog behavior, narrow reflow and reduced motion. Record asset
inventory and a source scan proving that no raw executable reference script,
inline handler, unsafe HTML sink, or prototype storage path reached runtime.

Build, lint, unit tests and general visual similarity do not prove this visual
contract. A material visible mismatch or missing required capture blocks the
ticket's visual handoff, even when its functional and security checks pass.
