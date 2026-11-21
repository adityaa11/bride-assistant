# M1-T04 review: why delivery required repeated correction

## Evidence examined

- The initial M1-T04 ticket required an exact reference match but named only a
  general fidelity rule. Its A1, A2 and A3 amendments later added local asset
  permission, a measurable rendered contract and the mapped M1 refactor rules.
- The code history after `a0b6f9b` contains separate asset extraction, hero
  rebuild, section expansion, layout refactor and final responsive corrections
  through `16a9a3d`. The checkpoint records desktop, 830px and 600px comparison
  and a fractional-width media-query discrepancy at the narrow boundaries.
- The T08–T16 tickets had a generic “exactly” clause and A1 mapping but did not
  bind a ticket-specific reference ledger, exact capture set or mismatch closure
  to their own review rows.

## Diagnosis

The visual acceptance target was not operational at the start of T04. “Exact”
did not identify the source's ordered composition, asset roles, dimensions,
type, breakpoint behavior or the evidence needed to close a mismatch. The
original frontend contract also prescribed generic shells, radii and a ban on
decorative gradients that could conflict with the rendered reference. A
developer could satisfy the scenario and build checks while still producing a
different visual result. The later A1–A3 decisions made the target testable,
but arrived after initial implementation, causing rework across assets, hero,
sections and responsive layout.

The breakpoint issue was a separate source/acceptance ambiguity: the supplied
page's fractional CSS viewport behavior did not apply the intended narrow
transformation at 830px and 600px in the checkpoint's browser. The explicit A2
contract resolved the expected result. Future tickets need the same rule for
recording source behavior, target viewport and any exception before coding.

This is a process diagnosis from the ticket, amendments, history and checkpoint;
it does not assert that the remaining tickets already have implementation bugs.

## Prevention now bound to remaining tickets

`M1_REMAINING_UI_REFERENCE_CONTRACT.md` defines a preimplementation reference
ledger for each mapped page/panel, a ticket-specific composition and breakpoint
map, a local asset inventory, and same-viewport comparison evidence. The
M1-wide contract now requires that ledger and mismatch closure. The project
frontend contract states that reference-specific geometry and art take
precedence over generic visual prescriptions. Each T08–T16 ticket must bind
these requirements in its own review contract before its visual handoff.
