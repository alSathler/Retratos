# Closed-notebook stage and cover controls

## Objective

Refine Option A into a distinct closed Field Notes cover that can be compared directly with Option B's open expedition folio.

The homepage will keep the notebook as a floating physical object with breathing room, but remove the visible rectangular mismatch between the asset background and the page. Header controls will become live marks on the cover, metadata will use the cover's label language, the HTML panorama overlay will be removed, and a letterpress-style transition will lead into the numbered catalog.

Detail pages, the generated cover artwork, the panorama catalog, map behavior, PhotoSwipe, content ordering, and the Option B branch remain unchanged.

## Visual direction

Option A is a closed, durable field notebook photographed on a dark printer's table. Its character comes from cardboard, wire binding, rubber-stamp orange, pencil marks, registration targets, and restrained letterpress details.

This must remain visibly different from Option B:

- Option A: floating closed cover, compact cover label, halftone and registration marks.
- Option B: full-bleed open folio, graph-paper catalog index, topographic survey bridge.

No additional generated background is required for the first implementation. The scene will be extended with colors sampled from the existing asset and CSS-only texture.

## Seamless notebook stage

The outer pixels of `field-logbook-cover.png` measure approximately `#171817` at the top and sides and `#141414`–`#171716` along the bottom. The dark page token is `#0e0e0c`, which explains the currently visible image rectangle.

The homepage hero section will become a full-width `hero--notebook` stage using a sampled charcoal base near `#171817`. The existing `hero__notebook` remains centered, capped at its current maximum width, and retains physical margins around the cover.

The stage will hide the raster boundary by:

- matching the immediate background to the sampled edge color;
- applying a restrained 20–32 px inner feather over only the outer matte area of the asset;
- adding a low-opacity radial vignette behind the notebook instead of a drop-shadow glow;
- avoiding masks or fades deep enough to obscure the wire binding, cardboard corners, or built-in panorama strip.

The stage remains dark in both themes because it represents the photographed tabletop. Its lower bridge is responsible for transitioning into the active page theme.

## Cover-embedded controls

The global site header will be omitted only on the homepage. `Base.astro` will gain an optional `showHeader` property defaulting to `true`, and `index.astro` will pass `showHeader={false}`. Detail pages therefore keep the existing sticky header unchanged.

`Hero.astro` will import the existing `ThemeToggle` and calculate the existing map URL. A new `hero__cover-actions` navigation group will sit in the upper-right part of the cover:

- the theme button is centered over the orange circle already printed in the asset;
- the icon remains a real accessible button and changes with the current theme;
- the Atlas link sits immediately to its left as a handwritten pencil annotation with the existing compass motif, a short underline, and a small outbound arrow;
- both controls receive visible keyboard focus and tactile active feedback without glow or continuous animation.

GitHub remains in the footer and is not duplicated on the cover.

## Cover copy and metadata label

The existing title, field-log kicker, year span, and introductory sentence remain live HTML. `hand-held sweep` moves into a small technical method note under the introductory sentence.

The current large `hero__cover-ledger` panel will be replaced by `hero__cover-label`, visually aligned with the outlined label printed near the lower-left corner of the cover. It will contain only three compact metrics:

- entries;
- countries;
- recorded.

On desktop and tablet widths, the live metadata will occupy the printed label area and rely on its existing border. It will use monospaced microtype and one light internal divider rather than another floating card or translucent rectangle.

The narrow mobile crop cannot expose the original left-edge label and still keep the title readable. Below 720 px, the same live label therefore becomes a compact detachable paper strip near the lower visible cover area. It will retain three columns, match the printed-cardboard palette, and stay within the hero without horizontal overflow.

## Built-in panorama

The dynamic `coverPanorama`, its formatted date, and the complete `hero__photo-strip` figure will be removed. This reveals the mountain panorama that is already baked into the generated cover asset.

No replacement image, caption, latest-entry label, or real panorama overlay will be added.

## Letterpress handoff

After the notebook image, a new CSS-only `hero__print-bridge` will extend the charcoal tabletop for approximately 72–110 px on desktop and about 60–68 px on mobile.

It will use:

- a low-opacity halftone dot field;
- sparse crop and registration marks in the existing oxidized-orange accent;
- a short perforated rule;
- microtype such as `field index` and the dynamic plate count;
- a controlled fade from sampled charcoal into `var(--bg)`.

The first catalog entry will not draw a second top border. Its existing padding remains, so the print bridge's perforated rule becomes the single intentional boundary before entry 01.

The pattern is decorative, hidden from assistive technology, and built with gradients and pseudo-elements. It adds no image request and does not repeat across the entire gallery.

## Responsive behavior

Desktop and wide tablet layouts preserve the floating landscape notebook and place controls against printed marks already present in the asset.

At intermediate widths, the Atlas annotation may tighten but must remain separate from the theme stamp and title. The metadata label must not collide with the baked panorama strip.

Below 720 px:

- the current readable vertical crop remains;
- the action group stays in the visible upper-right cover area;
- the metadata becomes the detachable three-column label strip;
- the original baked panorama remains visible without an overlay;
- the print bridge uses reduced height and side gutters;
- `document.documentElement.scrollWidth` must equal `window.innerWidth`.

Reduced-motion users receive the static composition. Interactive transitions animate only `transform`, `opacity`, or color.

## Component and styling changes

`src/layouts/Base.astro` will conditionally render `SiteHeader` from the new `showHeader` property.

`src/pages/index.astro` will suppress the header only for the homepage.

`src/components/Hero.astro` will:

- import `ThemeToggle`;
- compute `mapUrl`;
- remove `coverPanorama`, `coverDate`, and `hero__photo-strip`;
- add the method note, cover actions, compact metadata label, and print bridge.

`src/styles/global.scss` will:

- create the sampled charcoal stage and edge feather;
- replace the large ledger and photo-strip rules;
- style handwritten controls and the responsive label;
- add the halftone bridge, perforated rule, theme transition, focus, active, and reduced-motion states;
- remove the duplicate first-entry border only on the logbook homepage.

No dependency or additional raster asset will be added.

## Verification

The source-contract tests will be extended before production changes. They will verify that:

- the homepage suppresses the global header while detail pages retain it;
- the cover contains Atlas and ThemeToggle controls;
- `coverPanorama` and `hero__photo-strip` are absent;
- the metadata label contains only entries, countries, and recorded;
- the stage uses the sampled charcoal color and the print bridge uses CSS halftone gradients;
- no new desk or panorama raster is referenced;
- the homepage first entry does not duplicate the bridge boundary;
- the mobile label and bridge have explicit compact layouts.

After implementation, verification will include the complete Node source-contract suite, `astro check`, a production build, `git diff --check`, and live inspection at 1440, 1024, 768, 721, 720, 430, 390, and 320 px. Browser checks will cover both themes, the Atlas URL, theme switching, keyboard focus, mobile overflow, console errors, and the retained detail-page header.

## Out of scope

- Editing or regenerating `field-logbook-cover.png`.
- Reusing Option B's open-folio asset or topographic bridge.
- Moving GitHub out of the footer.
- Redesigning panorama entries or detail pages.
- Merging either comparison branch into another branch.
