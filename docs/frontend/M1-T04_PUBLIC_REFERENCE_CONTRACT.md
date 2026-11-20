# M1-T04 Public Reference Contract

## Authority and boundary

This is the binding rendered-reference contract for M1-T04. Its visual
authority is `project's goal/UI Reference/index.html`; its implementation and
security boundary is M1-T04 together with amendment M1-T04-A1. It governs the
public discovery fixture only. It does not authorize importing the reference
document's HTML, CSS, JavaScript, storage, event handlers, or data behaviour.

The required result is a faithful independent implementation, not a similar
editorial landing page. A reviewer must be able to put a capture beside the
reference capture at the same viewport and find no material visible mismatch.

## Rendered desktop contract

At the reference desktop viewport, render this ordered composition:

1. A 35px oxblood announcement band, with the two uppercase messages split by
   a pale four-point star.
2. A sticky, 86px paper header: Ranur logo at left, six centered navigation
   items, then sign-in and the filled registration action at right.
3. One uninterrupted, blush editorial hero. It has a two-column 1.04/0.96
   composition, a 640px minimum height, 34px column gap, 55px top padding, and
   63px bottom padding.
4. The left column contains the line-led uppercase eyebrow, exact headline and
   italic emphasis, Indonesian body copy, two actions, and the two icon-led
   supporting facts. The headline is the dominant element; neither CTA nor
   image may compete with it.
5. The right column contains the tall arched halo, detailed bride illustration,
   overlapping white logo stamp, and rotated `with love, Ranur ♡` note. These
   must retain their reference layering and proportions.
6. The oxblood script divider follows immediately below the hero.

The content shell is `min(1180px, 100% - 64px)` and centered. Do not replace
this composition with cards, a generic marketing split, a simplified figure,
or generic iconography.

## Tokens and typography

Use the rendered-reference palette as semantic tokens: paper `#fffaf7`, cream
`#fbf4f0`, blush `#f6e7e5`, deep `#7f464a`, rose `#9d5556`, rose-2 `#b56f6b`,
ink `#433438`, body `#66575a`, and border `#eadbd7`. The hero retains the
reference's warm blush gradient and its two quiet oversized circular outlines;
they are structural background details, not optional decoration.

Use the reference type roles: Georgia/Palatino-style serif for the editorial
heading and script note; Inter/Segoe UI/Arial-style sans for navigation,
labels, controls, and body. Desktop `h1` is
`clamp(46px, 5.05vw, 77px) / 1.12` with `-2.5px` tracking; hero body is 14px
with 2 line-height; eyebrow is 10px, 800 weight, 3px tracking, uppercase.
Buttons are 48px minimum height, 3px radius, 11px bold uppercase with 1px
tracking. Preserve the reference's restrained shadow and do not introduce
gradients, glass surfaces, pills, arbitrary rounded cards, or decorative
substitutes.

## Asset contract

Only these local, audited static assets may reproduce the supplied reference
artwork. Their roles are fixed:

| Local asset | Rendered role |
| --- | --- |
| `public/reference-assets/reference-icon.png` | browser icon |
| `public/reference-assets/ranur-header-logo.webp` | header brand mark |
| `public/reference-assets/ranur-bride-hero.svg` | detailed hero bride artwork |
| `public/reference-assets/ranur-hero-stamp.webp` | overlapping hero stamp |
| `public/reference-assets/ranur-footer-logo.webp` | footer brand mark |

The hero illustration must use `ranur-bride-hero.svg`; a hand-drawn,
placeholder, or CSS-only bride is a contract failure. Assets remain local;
external image origins and reference-document execution remain forbidden.

## Responsive transformation

At 1120px, reduce the shell to `min(1180px, 100% - 46px)`, preserve the
editorial hierarchy, and permit the specified header simplification only. At
830px and below, replace the desktop navigation with an accessible 44px
minimum hamburger/menu, stack the hero into one column, use 60px/50px hero
vertical padding, and keep the art centered at `min(540px, 100%)` with a 560px
minimum art region. At 600px and below, use a 32px shell, 45px/35px hero
padding, headline `clamp(42px, 10.5vw, 58px)`, and a 430px art region. Mobile
is a deliberate stacked composition, not a shrunken desktop screenshot.

At every width, content must remain readable, actions keyboard reachable, and
the artwork, stamp, and note must not overlap or clip important copy. Respect
reduced-motion preferences and preserve the reference-visible focus treatment.

## Acceptance evidence

M1-T04 can claim visual completion only when all of the following are recorded:

- side-by-side desktop captures of the reference and implementation at the
  identical viewport, plus a documented comparison of shell, header, hero,
  type, assets, spacing, and divider;
- matching 830px and 600px captures demonstrating the prescribed responsive
  composition and accessible mobile navigation;
- captures for default, empty, and error public scenarios, confirming that
  publication boundaries remain intact and the empty/error treatment does not
  leak drafts or customer/admin data;
- keyboard/focus evidence for header links, both hero actions, and mobile menu;
- an asset-inventory and source scan proving the local-asset boundary and no
  copied reference executable/source behaviour.

A passing build, approximate color match, or a functionally equivalent layout
is not visual evidence. Any material mismatch found in side-by-side review is
an M1-T04 failure until corrected.
