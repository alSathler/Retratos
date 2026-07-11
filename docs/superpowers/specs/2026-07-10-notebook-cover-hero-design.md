# Notebook Cover Hero Design

## Goal

Turn the Field Logbook homepage hero into a distinct physical cover object so it no longer resembles the numbered panorama entries below it.

## Approved Direction

Use the generated “Top-bound field notebook” concept: an oversized landscape notebook with black twin-loop binding, kraft chipboard, worn paper edges, restrained vermilion field marks, and a panoramic print emerging below the cover. The generated Expedition Folio remains a discarded exploration; only its idea of mounting a real photograph informs the final hero.

## Asset Strategy

- Copy the selected generated concept from `/Users/4gray/.codex/generated_images/019f4a90-3dc2-7583-b886-a35c87640b69/exec-28f2810f-8bfd-4395-9e55-aabaf03ac85d.png` into `assets/images/field-logbook-cover.png`.
- Treat that raster as decorative material art only. It supplies the spiral, cardboard, paper stack, shadows, and field marks.
- Keep the title, description, dates, counts, and labels as live HTML so they remain accessible, responsive, theme-compatible, and accurate.
- Cover the AI-generated photo strip with an optimized Astro `Image` using the most recently recorded panorama from the sorted collection. The site must never present the generated landscape as part of the photographer’s archive.

## Component Structure

`Hero.astro` remains the only component changed for hero markup. It receives the existing sorted panorama collection and derives:

- total entries;
- unique countries;
- first and last recording years;
- the most recent panorama for the physical photo strip.

The hero contains one `hero__notebook` object with four layers:

1. decorative generated cover art;
2. a live cover label containing `FIELD LOG`, volume `01`, the year span, and the `panoramas` title;
3. a compact live metadata label for entries, countries, camera, and stabilizer;
4. the real panorama strip with accessible alternative text.

The current `hero__folio`, side number column, and ruled ledger are removed. The gallery and numbered `log-entry` components remain unchanged.

## Responsive Layout

On desktop, the notebook uses a wide cinematic aspect ratio and occupies the normal `shell-wide` visual field. The cover title sits in the large blank kraft area, while the compact metadata label stays secondary. The real panorama strip overlaps the lower cover edge and visually leads into the archive below.

Below `720px`, the notebook becomes a taller crop rather than shrinking all content into unreadable scale. The cover art uses top-centered object positioning to preserve the spiral. Live labels reflow into a single column, the metadata is reduced to the essential counts and date span, and the real panorama strip remains wide enough to read as a photograph.

The notebook retains its dark charcoal surround in both themes, like a photographed physical object placed on the page. Live text and labels use fixed high-contrast paper/ink colors within the object; the surrounding page continues to follow the existing light and dark theme tokens.

## Interaction and Accessibility

- The cover art is decorative and has empty alternative text.
- The real panorama strip uses the panorama’s existing `alt` field.
- No information exists only in the generated raster.
- No new interaction is introduced; the hero remains a semantic introductory section.
- Motion is limited to the project’s existing page behavior and respects the existing reduced-motion rule.

## Testing and Verification

- Add a source-contract test that requires `hero__notebook`, the imported cover asset, a real Astro `Image` photo strip, and the absence of the old `hero__folio` structure.
- Run the test before implementation and confirm it fails for the missing notebook structure.
- Verify the homepage at desktop and `390 × 844` in both light and dark themes.
- Confirm no horizontal overflow, readable live text, the real panorama strip covering the generated one, and a clear visual break before the first numbered entry.
- Run `astro check` and the production build after visual verification.
