# M1-T15 reference ledger — source inspection

Status: source mapping complete; implementation and visual acceptance pending. On 2026-11-22 the user explicitly authorized creating fictional sample fixture records for this ticket.

## Authority and viewport

- Mapped source: `project's goal/UI Reference/Bride_Assistant_Planner_Standalone_v3_Content_Management.html`, `renderStories()` (lines 414–424), `renderWebsiteEvents()` (425–431), editor branches (450–459), and content CSS (154–185).
- Shared shell, including sidebar, top bar, title region, collapse and mobile drawer: `shared/admin-workspace-frame.tsx` under ticket amendment A4. The source's sidebar, top bar and outer shell are inspection context, not route-specific implementation authority.
- Desktop reference viewport: 1440 CSS px. Content boundaries: 1250, 1150, 930, 720, 485 CSS px; capture above and at each boundary. The source also has a 420px rule for generic subtabs, which does not apply to content tabs.

## Ordered source regions and copy

| Region | Portfolio / Testimonials source | Events source | Source rules and interaction |
| --- | --- | --- | --- |
| Title | `Website Content / Our brides`; `Portfolio & Testimonials`; `Kelola cerita, foto, dan testimoni customer yang mendapat izin untuk dipublikasikan.`; `Tambah Portfolio` or `Tambah Testimoni` | `Website Content / Our events`; `Events`; `Publikasikan agenda kegiatan Ranur agar customer bisa melihat acara mendatang dan kegiatan sebelumnya.`; `Tambah Event` | Shared frame title/action API; source `title()` and `webHeaderButton()` |
| Toolbar | `Portfolio (count)` and `Testimonials (count)` tabs; `Export JSON website` | `Tanggal kegiatan menentukan kategori Upcoming atau Past event di landing page.`; `Export JSON website` | `.web-toolbar`, `.web-tabs`, `.web-intro`; tab selection in `data-action` handler |
| Metrics | `Total konten` / `Semua status`; `Published` / `Ditandai untuk tampil`; `Draft` / `Belum diterbitkan` | Same | `.web-stats`, `.web-stat`; counts from the selected collection |
| Portfolio cards | Image slot or image icon; `Draft`/`Published`; category pill; title; description; `Edit`, `Publish`/`Unpublish`, `Hapus` | — | `.web-grid`, `.web-card`, `.web-media`, `.web-card-body`, `.web-card-meta`, `.web-state`, `.web-card-actions` |
| Testimonial cards | `Draft`/`Published`; quote icon; quoted text; attribution; same controls | — | Same card rules and `.web-quote` |
| Event cards | — | Theme symbol media; `Draft`/`Published`; date pill; title; location; description; same controls | Same card rules |
| Empty panel | `Belum ada portfolio` or `Belum ada testimoni`, source description, and matching add button | `Belum ada event`, source description, `Tambah Event` | `.web-empty`; exact source strings in `renderStories()` and `renderWebsiteEvents()` |
| Footnote | `Konten berstatus Draft tidak masuk ke hasil export untuk website. Foto portfolio diperlukan sebelum dapat diterbitkan. Pastikan izin penggunaan foto dan kutipan customer sudah diperoleh.` | `Event yang diterbitkan akan tampil di bagian Events setelah konten diintegrasikan ke website customer.` | `.hintbox`; prototype publication claims must be presented only as fixture review, without actual export or public publication |
| Editor | Portfolio title/category/story/alt text/photo fields; testimonial attribution/quote; Published checkbox; modal footer | Event title/date/symbol/location/description; Published checkbox; modal footer | `openWebsiteEditor()` and `.modal-*`, `.form-field`, `.checklabel`; no upload, URL origin, write, consent claim, or publication mutation in M1 |

## Source geometry and style

- Source tokens: `--rose:#a65450`, `--ink:#422f35`, `--muted:#806b70`, `--border:#efe2df`, `--shadow:0 9px 34px rgba(87,53,51,.045)`; body uses Inter/Segoe UI/Arial, headings and metrics use Georgia.
- Toolbar is flex with 12px gap and 19px bottom margin. Metrics are a three-column grid with 13px gaps; each tile has a 14px radius and 17px by 19px padding. Card grid uses three columns and 15px gap. Cards have a 15px radius; media aspect ratio is 1.65; body padding is 18px 18px 15px, with 10px internal gap.
- Status is text plus color: `.web-state` uses a blush draft treatment; `.is-live` uses a green published treatment. Text labels remain required for non-color distinction.
- At 1150px cards become two columns. At 720px cards and metrics become two columns and toolbar aligns stretched. At 485px both become one column; toolbar buttons grow and tabs fill width. Shared frame owns its 1250px and 930px changes and its mobile treatment.
- The mapped source uses the local extracted SVG sprite `public/reference-assets/ui-reference/bride-assistant-planner-standalone-v3-content-management-inline-svg-01-e88f0a139761.svg` for image, quote, sparkle, calendar, plus, edit, delete and download roles. The event theme is a source text symbol (`✦` fallback). No bitmap asset appears in the source's initial empty collections. The other extracted SVG files from this HTML are not used by these panels. Following the user's 2026-11-22 request for actual fixture imagery, the populated Portfolio cards now use two fictional, locally checked-in object-only photos in `public/fixture-assets/m1-t15/`; they are an explicit user-directed exception to the earlier placeholder-only record.

## Interaction and fixture boundary

- Source tabs switch between portfolio and testimonials. Add, edit, delete, publish toggle and export run prototype mutations; M1 may show only explicitly non-authoritative proposed results, with no persistence, media upload, consent assertion, export download or public output.
- The source initializes portfolio, testimonials and events as empty arrays. Its empty rendering is directly evidenced. Source card and editor compositions are directly evidenced in the renderer code, but populated record values are not.
- T02 initially declares `admin.content-draft-success` with only `{id,title,publication}` records (`draft-rose` / `published-rose`). It has no content kind, portfolio description/category/media, testimonial quote/attribution, or event date/location/theme. No T02 named empty or error content scenario exists. The user explicitly authorized fictional fixture records and, in a later instruction, actual fixture imagery. The typed model therefore carries an enum asset key and descriptive alt text, not an arbitrary URL. The component maps that key to the two approved local files. No upload, external media origin, public media delivery, or publication mutation is added.

## Source-to-component map

| Source region or behavior | Destination and source of displayed values | Prototype behavior omitted |
| --- | --- | --- |
| `title()` / `webHeaderButton()` in `renderStories()` and `renderWebsiteEvents()` | `AdminWorkspaceFrame` title/action props in `shared/admin-content-workspace.tsx`; source literal copy | `data-action` dispatcher |
| `.web-toolbar`, `.web-tabs`, `websiteStats()` | `AdminContentWorkspace` toolbar and `Stats`; counts from `adminContent` in named T02 scenarios; CSS in `admin-content-workspace.module.css` | Export download disabled; no Blob, object URL or payload |
| `.web-grid`, `.web-card`, `.web-media`, `.web-card-meta`, `websiteBadge()`, `websiteControls()` | `ContentCard`, `StatusBadge`, source CSS values; fictional record fields from `admin.content-draft-success`; `AdminIcon` uses the source extracted SVG sprite. For populated Portfolio only, user-directed local fixture photos use the source `.web-media img` crop rule. | No external media URL, upload, publication toggle, delete or save |
| `websiteEmpty()` for all three collections | `AdminContentWorkspace` empty branch, source copy and CSS; `admin.content-empty` and `admin.content-error` named scenarios | Add control opens only a review form |
| `.hintbox` in both renderers | `AdminContentWorkspace` source copy and icon; fixture provenance displayed immediately below | Guidance is not a consent claim or live public integration |
| `openWebsiteEditor()` and `modalFrame()` | Native dialog and typed React form in `AdminContentWorkspace`; source fields and modal CSS; submit exposes the named T02 `admin.content-proposed-result` message and interaction summary | Photo file/URL/preview controls omitted because ticket forbids media bytes and external origin. No persisted form values or consent claim |
| `renderStories()` tab change, reverse ordering; `renderWebsiteEvents()` date ordering | React tab state and source ordering in `AdminContentWorkspace` | Prototype global `ui`, `db`, and localStorage |

The route-specific CSS reproduces source selectors/values within a CSS module. All sidebar, topbar, title geometry and mobile navigation use the shared frame. No route CSS targets frame classes.

## User-directed fixture image inventory

- `public/fixture-assets/m1-t15/bridal-preparation.png`: generated fictional dress-and-flowers still life for the Draft Portfolio record. Prompt: natural editorial photo of an ivory dress, pink flowers and makeup brush in soft morning light; no people, text, logo or real customer.
- `public/fixture-assets/m1-t15/garden-celebration.png`: generated fictional flowers, blank stationery and ribbon still life for the Published Portfolio record. Prompt: natural editorial photo of a garden table in diffused afternoon light; no people, readable text, logo or real customer.
- Both are 1610×977 PNG files generated with the built-in image tool, then copied into the repository. They are accessible only through the fixed local asset mapping; neither the fixture data nor the UI accepts an arbitrary media URL. The source's `.web-media img` rule supplies `object-fit: cover` at 1.65 aspect ratio.

## Review contract working rows

| ID | Ticket pass condition | Required proof | Current status |
| --- | --- | --- | --- |
| RC-25 | Draft/published visually and textually distinct; T04 cannot render draft | Cross-route negative check and captures | UNRESOLVED |
| CONTENT | Portfolio, testimonial, event, empty and proposed-result fixture states through adapter | Named route/state captures and interaction evidence | UNRESOLVED; user authorized fictional fixture records |
| VIS-REF-M1-T15 | Source ledger, source/app paired captures at all boundaries, no material mismatch | Side-by-side comparison, responsive/keyboard/negative evidence | UNRESOLVED |
| SRC-REF-M1-T15 | Source-to-component map, no prototype runtime | Component and CSS location map, scan, rendered proof | UNRESOLVED |
| A4-SHARED | Shared frame reuse, no shell override, Bookings/Availability/content regressions | Four-width shell captures and assertions | UNRESOLVED |
| SEC-M1-01/02 | No authority, upload, storage, consent claim, external media or unsafe rendering | Route/source scan and negative interactions | UNRESOLVED |

No implementation, visual comparison, checkpoint, or CK handoff is claimed by this ledger.

## M1-T18 fixture-local media continuation

T18 implements the Portfolio-only upload that T15-A7 authorizes. The mapped source's `openWebsiteEditor()` Portfolio branch supplies the alt-text and file-field order, form labels, modal geometry, and empty preview treatment. `ImageUploadField` in `shared/admin-content-workspace.tsx` converts those regions into a fixture upload form. The source's browser storage, arbitrary HTTPS URL control, and client-side preview script are excluded by T18's server-owned, same-origin storage boundary. The added 5 MiB help text and non-authoritative fixture copy trace to T18 rather than the prototype.

`AdminContentWorkspace` submits `FormData` to the fixture handler, receives `ContentImageMetadata`, and renders the returned opaque key through the exact-key read handler. The local adapter owns bytes and the `records.json` association in the ignored Portfolio namespace. The original two checked-in Portfolio images remain the baseline when no uploaded association exists. Testimonials and Events have no upload field. The T18 evidence script captures source and implementation Portfolio forms at 1440, 930, 720, and 485px and checks the route lifecycle, public/customer negatives, and T15 regressions.
