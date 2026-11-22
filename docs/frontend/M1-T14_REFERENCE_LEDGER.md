# M1-T14 source ledger (before implementation)

Source: `project's goal/UI Reference/Bride_Assistant_Planner_Standalone_v3_Content_Management.html`, Customers panel (`renderCustomers`, lines 391–394). Shared shell: `shared/admin-workspace-frame.tsx` (M1-T14-A4). Fixture authority: `admin.booking-workspace` records in `shared/scenarios/catalogue.ts`; the T14 admin server route projects named customer states from that versioned T02 adapter result and sends only display-safe fields to its client component.

| Region or decision | Exact source | Conversion |
| --- | --- | --- |
| Sidebar, brand, navigation, breadcrumb, top bar, title geometry, responsive drawer | `AdminWorkspaceFrame`; title inputs from reference `renderCustomers` | Frame `active`, `eyebrow`, `title`, `subtitle`, `action` props; no local shell styles |
| Directory heading and action | `renderCustomers` list branch: `People / Customers`, `Your brides`, `A simple directory of customers who have made a booking.`, plus icon and `Add via Booking` | Frame props; link to the existing admin booking fixture route |
| Directory cards | `renderCustomers` list branch; `.customer-grid`, `.customer-card`, `.customer-initial` (CSS lines 107–108) | Two-column grid, initial, name, booking count, first phone, chevron; sorted distinct names derived from T02 admin booking records |
| Source hint | `renderCustomers` list branch; `.hintbox` | Exact Indonesian MVP copy and source hint styling |
| Selected detail | `renderCustomers` detail branch; `.card`, `.card-pad`, `.section-row`, `.booking-item`, `.item-row`, `.item-meta`, `.status` | Selected name and history ordered by booking date; back action; booking item links to the read-only booking workspace |
| Search/no-result extension required by T14 | Source `renderBookings` search control (line 343), `.filters`, `.field-search`, `.input`, `.empty` | Reuse the same search geometry and `Search customer name...` copy; no-result uses source empty style and T02 empty message |
| Error/empty extension required by T14 | Source `.empty`, shared frame, T02 scenario state | Preserve directory shell and source empty treatment with fixture state message; no hidden customer records |
| Icons | Local extracted admin symbol sprite `bride-assistant-planner-standalone-v3-content-management-inline-svg-01-e88f0a139761.svg`; source `ICON('plus')`, `ICON('chevron-right')`, `ICON('arrow-left')`, `ICON('search')` | `AdminIcon` from shared frame; no external asset |
| Responsive | Source `@media(max-width:1250px)`, `930px`, `720px`, `485px`; customer grid becomes one column at 485px. A4 owns shell transformations. | Local grid at 485px; shared frame owns shell at 1250/930/485 |
| Interactions | `data-customer` selection and `customer-back` in source event handler; booking row navigation; source booking search input | React state for selection/query; links use fixture routes and no mutation |

Source type/palette geometry for the route content: 13px card name, 11px secondary phone/count, 42×42px initial with 13px radius and 20px Georgia glyph; two equal grid columns with 12px gap; 16px card padding and 12px radius; card `#fff`, initial `#f4dcd9`, glyph `#a55f5a`, secondary `#968287`, hover `#fff7f5`. Detail uses 22px card padding, 24px section heading, 13px booking row padding, 11px metadata. Shell typography and colors are inherited from the shared frame.

Named fixture states to capture: directory success, selected detail, search with match, search with no result, empty directory, error directory. No mapped content image or photo is visible; the only local asset is the admin SVG symbol sprite above. The original prototype storage, booking creation, and status decisions are excluded.
