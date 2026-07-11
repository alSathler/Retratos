# Panos2 panorama integration design

## Goal

Add 11 distinct panoramas from `/Users/4gray/Downloads/panos2/` to the Astro site using the same display/full-resolution delivery and exact-EXIF location workflow as the previous panorama batch. All imported entries must appear in Atlas with accurate coordinates and concise English location titles.

## Source inventory and duplicate decision

The source directory contains 12 HEIC files. Eleven are intentional imports. `IMG_4032.HEIC` is excluded because it was captured 0.7 m from `IMG_4031.HEIC` and shows substantially the same Florence skyline from Piazzale Michelangelo. `IMG_4031.HEIC` is retained because it has the stronger landmark composition and higher native resolution.

Other nearby captures remain separate because they show different subjects or viewpoints:

- `IMG_3320.HEIC` and `IMG_3323.HEIC` are 67.3 m apart and show distinct Grand Canal compositions.
- `IMG_3982.HEIC` is about 68 m from the Piazzale Michelangelo captures but includes Torre San Niccolò from a different viewpoint.
- `IMG_4546.HEIC` and `IMG_4753.HEIC` are 210 m apart and show different Roman landmarks.

The batch definition must list both the 11 included sources and the one explicitly excluded source. Import validation accepts the directory only when all 12 expected HEIC files are present and no unexpected HEIC files exist. The excluded source must never produce a display asset, full-resolution asset, content entry, detail page, or Atlas place.

## Import manifest

Create a dedicated `panos2` batch manifest rather than appending these files to the previous 25-source manifest. Each included entry stores its exact raw EXIF date, signed latitude and longitude, native dimensions, output slug, country, title, and alt text.

| Source | Title | Coordinates | Native size |
| --- | --- | --- | --- |
| `IMG_3161.HEIC` | St Mark’s Basilica, Venice | 45.43472222222222, 12.339002777777779 | 14966 × 3788 |
| `IMG_3191.HEIC` | Canal near Frezzaria, Venice | 45.43420833333333, 12.334861111111111 | 8486 × 3894 |
| `IMG_3320.HEIC` | Gondolas on the Grand Canal, Venice | 45.437241666666665, 12.334050000000001 | 7704 × 3786 |
| `IMG_3323.HEIC` | Grand Canal from Riva del Vin, Venice | 45.43757222222222, 12.334772222222222 | 7904 × 3900 |
| `IMG_3479.HEIC` | Giudecca Canal from Dorsoduro, Venice | 45.42853888888889, 12.332941666666667 | 8676 × 3820 |
| `IMG_3982.HEIC` | Florence from Viale Giuseppe Poggi | 43.76374166666667, 11.264563888888889 | 8958 × 3900 |
| `IMG_4031.HEIC` | Florence and Ponte Vecchio from Piazzale Michelangelo | 43.763225, 11.264105555555556 | 13768 × 3920 |
| `IMG_4355.HEIC` | Circus Maximus and Palatine Hill, Rome | 41.88559722222222, 12.485141666666665 | 16284 × 3888 |
| `IMG_4546.HEIC` | Imperial Fora from the Vittoriano, Rome | 41.89459166666666, 12.483838888888888 | 13374 × 3914 |
| `IMG_4753.HEIC` | Roman Forum and Arch of Septimius Severus | 41.892916666666665, 12.48501111111111 | 10126 × 3920 |
| `IMG_5514.HEIC` | Atlantic Coast at Puerto de la Cruz | 28.416644444444444, -16.55725 | 9958 × 3820 |

Capture dates come directly from raw EXIF: 8–9 February 2024 in Venice, 12 February in Florence, 16–17 February in Rome, and 21 April in Puerto de la Cruz. Country values are `italy` for the first ten entries and `spain` for Puerto de la Cruz.

## Batch-aware importer

Generalize the existing importer so it selects a named batch while preserving the current command as the default for the previous 25 panoramas. The new invocation is:

```bash
npm run import:panoramas -- --batch panos2 "/Users/4gray/Downloads/panos2/"
```

`--metadata-only` remains available and may be combined with `--batch panos2`. Progress totals, inventory messages, and imported counts must derive from the selected batch rather than the previous hard-coded value of 25.

For every included source, the importer:

1. Extracts the raw EXIF block and rejects missing or mismatched date/GPS metadata.
2. Converts the HEIC to a temporary lossless image.
3. Writes a high-quality native-size WebP to `public/images/full/<slug>.webp`.
4. Writes a quality-optimized WebP capped at 2400 px wide to `assets/images/<slug>.webp`.
5. Verifies output dimensions and writes the matching Markdown content entry.

The original HEIC files and the excluded duplicate are not committed.

## Site and Atlas behavior

The existing content collection, gallery, detail page, lightbox, and full-resolution link behavior remain unchanged. Adding the 11 Markdown entries increases the site from 44 to 55 panorama places. Atlas receives the new places through the content collection, uses their exact EXIF coordinates, displays the approved titles and thumbnails, and links to the matching detail pages.

Nearby Venice, Florence, and Rome markers must remain independently selectable through the existing cluster cycling behavior and mobile place picker. The picker must contain all 55 places plus its placeholder option.

## Failure handling

- Reject a `panos2` directory that does not contain exactly the 12 declared HEIC sources.
- Reject raw EXIF date or GPS values that differ from the manifest, including sub-meter precision differences.
- Reject duplicate slugs or output filenames across both batches.
- Reject missing or zero-byte display/full-resolution outputs.
- Verify that `IMG_4032.HEIC` has no generated output or content entry.
- Leave existing panorama assets and metadata unchanged.

## Verification

- Confirm the source inventory is 12 HEIC files: 11 imported and one explicitly excluded duplicate.
- Confirm exactly 11 new display WebPs, 11 full-resolution WebPs, and 11 Markdown entries exist at the expected dimensions.
- Run the metadata-only import against `/Users/4gray/Downloads/panos2/` to independently match all included sources to raw EXIF.
- Build the site and confirm it produces 55 panorama detail pages and 55 Atlas places.
- Test every new Atlas title, coordinate, thumbnail, detail URL, cluster membership, and mobile picker option.
- Test every new detail page’s base-aware full-resolution link and native dimensions.
- Inspect representative desktop and mobile gallery, detail, and Atlas views.
- Run Astro checks, the production build, panorama tests, and `git diff --check`.
- Confirm no HEIC files or unrelated changes are committed.
