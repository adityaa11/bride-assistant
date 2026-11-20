# Project Frontend Contract — Soft Rose Atelier

## Product identity

Bride Assistant Planner is a fixture-backed review build for Ranur Bridal Care. Its primary mode is a consumer service discovery and customer workflow, with a secondary internal administration workspace. Visitors and customers use it occasionally for understanding services and reviewing a booking journey; administrators use it for focused, record-oriented operational review. Misstating a state or authority has a medium business consequence, so provenance and state must remain explicit.

## Visual personality and hierarchy

The system is calm, warm, editorial, trustworthy, and precise. It should feel feminine but professional, never ornamental at the expense of clarity. The hierarchy is: location and audience, page purpose, review state, primary fixture content, then provenance and next review action. Public and customer surfaces use readable discovery/workflow composition; admin surfaces use restrained data-workspace composition.

## Density, navigation, and layout

Use medium density. Desktop public/customer navigation is a compact top bar; admin navigation is a compact rail. On narrow widths, all navigation becomes a wrapped, readable list and content becomes one column. The shell uses a centered content measure (`72rem`) and content panels never stretch indefinitely: repeated items use a minimum inline size of `16rem` and a maximum comfortable size of `34rem`.

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

## Reference grammar

The supplied Soft Rose references inform the muted rose/terracotta palette, editorial headings, generous readable spacing, and restrained admin rail. They are grammar only: no reference source, logic, or visual screen copy is reused.

All new UI work must conform to this contract unless an approved ticket changes it.
