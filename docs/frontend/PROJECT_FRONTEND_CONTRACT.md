# Project Frontend Contract — Soft Rose Atelier

## Product identity

Bride Assistant Planner is a fixture-backed review build for Ranur Bridal Care. Its primary mode is a consumer service discovery and customer workflow, with a secondary internal administration workspace. Visitors and customers use it occasionally for understanding services and reviewing a booking journey; administrators use it for focused, record-oriented operational review. Misstating a state or authority has a medium business consequence, so provenance and state must remain explicit.

## Visual personality and hierarchy

The system is calm, warm, editorial, trustworthy, and precise. It should feel feminine but professional, never ornamental at the expense of clarity. The hierarchy is: location and audience, page purpose, review state, primary fixture content, then provenance and next review action. Public and customer surfaces use readable discovery/workflow composition; admin surfaces use restrained data-workspace composition.

## Binding UI Reference

`project's goal/UI Reference/` is the binding visual source of truth for M1. Every corresponding screen must match the reference's visible structure, hierarchy, copy, typography, colors, spacing, geometry, imagery/icon treatment, navigation, and responsive composition. A visually different implementation is a failure even when it is functional or uses the same general Soft Rose mood.

For M1-T08–T16, the mapped reference HTML, CSS, and JavaScript are the inputs to a source-led Next.js refactor. Preserve the rendered structure, styling, assets, and visible interactions in reusable reference-derived components, while T02 fixtures replace prototype data and authority. For states not shown in the reference, extend the same visual treatment and component geometry without inventing a new visual language or arbitrary per-screen styling. Every route requires a reference-viewport capture and visual comparison record before acceptance.

## Density, navigation, and layout

Use medium density. Desktop public/customer navigation is a compact top bar; admin navigation is a compact rail that can collapse to a 72px icon rail with labeled hover and focus hints. On narrow widths, public/customer navigation becomes a wrapped, readable list. At 930px and below, the admin rail becomes a 44px menu button opening a right-side drawer of up to 360px, with 24px of the underlying screen left visible; admin content panels become one column at 720px and below. Public and customer shells use a centered content measure (`72rem`); repeated items use a minimum inline size of `16rem` and a maximum comfortable size of `34rem`.

The admin workspace shell fills the viewport at desktop widths, with the sidebar anchored to the left edge and its header, filters, calendar, detail panel, and availability cards using the remaining width. Calendar days grow in height on very wide screens so the grid keeps useful proportions. Filters wrap before controls become cramped, booking tables retain horizontal scrolling, and long navigation labels remain available through the expanded rail or collapsed rail hints.

Admin routes render through `shared/admin-workspace-frame.tsx`. That frame owns the sidebar, desktop collapse, mobile menu, top bar, page heading, and outer responsive width. Ticket-specific admin components supply the active section, heading, action, and content inside the frame. They must not copy the shell markup or override its page, sidebar, navigation, top bar, or breakpoint rules. A necessary shell change is made in the shared frame and checked on Bookings, Availability, and the affected route. Customer routes continue to use `CustomerFrame` from `shared/customer-home.tsx` for their shared chrome.

## Tokens and components

Use only the semantic CSS custom properties in `app/globals.css`. The spacing scale is 0.25rem, 0.5rem, 0.75rem, 1rem, 1.25rem, 1.5rem, 2rem, 2.5rem, 3rem, and 4rem. Geometry is softly rounded: controls 0.5rem, panels 0.875rem, and circular markers only for compact metadata. Use system sans-serif body text and Georgia-based editorial headings; no remote font or asset is required.

Semantic color roles are canvas, surface, surface-soft, text, text-muted, border, primary, primary-hover, focus, success, warning, danger, and info. Rose means brand identity and primary action, not generic status. Every status includes a text label and supporting message.

Use the shared shell, `review-panel`, `status`, `metadata`, and native button/link patterns. Labels are semantic; forms retain native labels and controls. Focus is highly visible, hover is subtle, disabled controls remain readable, and loading/success/error/unavailable feedback is announced with an appropriate live region. Motion is functional and limited to short opacity/transform transitions; it is removed for reduced-motion preferences.

## Accessibility and responsive rules

Target WCAG 2.2 AA. Preserve keyboard navigation, visible focus, semantic landmarks, non-color state communication, readable contrast, and 200%/narrow-width reflow. Long labels wrap; identity, state, and controls must never be silently clipped. Desktop layouts transform before type size, touch target, or semantic spacing is reduced.

## Forbidden patterns

- Per-screen token overrides or arbitrary colors, spacing, type, and radii.
- Decorative gradients, glassmorphism, neon/glow, and card stacks without meaning.
- Icon-only important navigation, color-only status, or hidden provenance.
- Inline HTML/style/executable content, runtime style writes, unreviewed external assets, or client CSP workarounds.
- Screen-specific business rules or authority behavior in shared primitives.

## Reference implementation boundary

The supplied references define both the rendered visual result and the source
material to refactor for remaining M1 UI tickets. Adapt their HTML structure,
CSS, assets, and observable UI behavior into safe Next.js components. Raw
reference scripts, prototype logic/data, localStorage behavior, and external
asset origins do not run in the application. All M1 UI remains wired through
typed fixture contracts and safe framework rendering.

All new UI work must conform to this contract unless an approved ticket changes it.

For M1, a mapped rendered reference and its ticket-specific rendered-reference
contract take precedence when a generic measure, radius, token, navigation
pattern, or decoration rule above would change the source's visible result.
The implementation still uses safe framework rendering and typed fixture data.
