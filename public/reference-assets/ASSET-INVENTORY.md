# M1-T04-A1 extracted reference visual assets

Source: `project's goal/UI Reference/index.html`.

| File | Source role | Used by |
| --- | --- | --- |
| `reference-icon.png` | Embedded document icon | Root metadata favicon |
| `ranur-header-logo.webp` | Embedded header mark | Public header |
| `ranur-hero-stamp.webp` | Embedded hero stamp | Public hero stamp |
| `ranur-footer-logo.webp` | Embedded footer mark | Public footer |
| `ranur-bride-hero.svg` | Inline hero illustration | Public hero artwork |

These files are static visual assets approved by M1-T04-A1. No reference HTML,
CSS, JavaScript, storage behavior, dynamic data, or event handling was copied.

## M1-wide reference extraction

All static embedded images and static inline SVG artwork from the eight HTML
references are reproducibly extracted into `ui-reference/` by
`scripts/extract-ui-reference-assets.mjs`. Its `ui-reference/manifest.json`
records the exact source page, asset kind, MIME type, and generated filename.
The M1 UI Reference Implementation Contract limits each extracted asset to its
corresponding ticket/screen and preserves the same no-behaviour/no-external-
origin boundary.
