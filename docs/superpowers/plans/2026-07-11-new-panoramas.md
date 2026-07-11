# New Panoramas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add all 25 supplied panoramas with responsive display assets, separately linked full-resolution assets, accurate EXIF coordinates, map-derived titles, and verified Atlas markers.

**Architecture:** A checked-in manifest is the authoritative mapping from each HEIC source to its title, slug, date, coordinates, dimensions, and output files. A repeatable import script converts each HEIC through a temporary PNG into display and full-resolution WebP files, then writes content entries. Astro keeps serving display variants through `astro:assets`; full files live under `public/images/full/` and load only through an explicit detail-page link.

**Tech Stack:** Astro 5 content collections, TypeScript/Zod, Node.js scripts and `node:test`, `heif-convert`, `cwebp`, Sharp metadata inspection, PhotoSwipe, SCSS.

---

## File map

- Create `scripts/new-panoramas.mjs`: authoritative 25-entry import manifest.
- Create `scripts/import-panoramas.mjs`: conversion, content generation, and verification CLI.
- Create `scripts/new-panoramas.test.mjs`: manifest and generated-output tests.
- Modify `package.json`: add import and panorama verification commands.
- Create `assets/images/<slug>.webp`: 25 display sources capped at 2400 px.
- Create `public/images/full/<slug>.webp`: 25 full-resolution files.
- Create `src/content/panoramas/<slug>.md`: 25 panorama entries.
- Modify `src/content.config.ts`: optional full-resolution metadata schema.
- Modify `src/pages/[slug].astro`: base-aware full-resolution link and source dimensions.
- Modify `src/styles/global.scss`: full-resolution link styling.

## Authoritative source mapping

| Source | Slug | Title | Country | Date | Latitude | Longitude | Source dimensions |
| --- | --- | --- | --- | --- | ---: | ---: | --- |
| IMG_0374.HEIC | laguna-rosa-torrevieja | Laguna Rosa, Torrevieja | spain | 2024-11-26 | 37.98039166666667 | -0.7061716666666666 | 16104×3858 |
| IMG_0921.HEIC | dresden-neustadt-sunset | Dresden Neustadt at Sunset | germany | 2026-01-15 | 51.06404166666667 | 13.74632 | 11312×3932 |
| IMG_2420.HEIC | girona-passeig-muralla | Girona from Passeig de la Muralla | spain | 2025-01-30 | 41.98653 | 2.828413333333333 | 16144×3792 |
| IMG_2474.HEIC | girona-general-peralta-tower | Girona from Torre del General Peralta | spain | 2025-01-30 | 41.98408 | 2.82773 | 13314×3828 |
| IMG_3125.HEIC | benidorm-coast-balcon | Benidorm Coast from Balcó del Mediterrani | spain | 2025-02-09 | 38.53393833333333 | -0.1311278333333333 | 8690×3938 |
| IMG_3146.HEIC | benidorm-mediterranean-balcon | Mediterranean Sea from Balcó del Mediterrani | spain | 2025-02-09 | 38.53368833333333 | -0.1309583333333333 | 11722×3902 |
| IMG_3490.HEIC | madrid-mirador-cornisa | Madrid from Mirador de la Cornisa | spain | 2026-05-01 | 40.416405 | -3.715438333333333 | 15752×3848 |
| IMG_4912.HEIC | cadiz-alameda-apodaca | Cádiz from Alameda Apodaca | spain | 2026-05-11 | 36.53791333333334 | -6.300308333333334 | 11478×3894 |
| IMG_4913.HEIC | cadiz-atlantic-horizon | Atlantic Horizon in Cádiz | spain | 2026-05-11 | 36.53796333333333 | -6.300308333333334 | 16232×3820 |
| IMG_5374.HEIC | copenhagen-nordhavn | Nordhavn, Copenhagen | denmark | 2025-06-21 | 55.71592833333333 | 12.62582166666667 | 9152×3928 |
| IMG_5613.HEIC | los-boliches-fuengirola | Los Boliches Beach, Fuengirola | spain | 2026-05-16 | 36.55116666666667 | -4.613505 | 16048×3810 |
| IMG_5931.HEIC | skjeringsdalen-stryn | Skjeringsdalen, Stryn | norway | 2025-06-23 | 61.96401166666666 | 7.252783333333333 | 11354×3840 |
| IMG_8534.HEIC | prague-hradcany | Prague from Hradčany | czech-republic | 2025-10-11 | 50.0870055 | 14.39042833333333 | 8120×3926 |
| IMG_8961.HEIC | charco-san-gines-arrecife | Charco de San Ginés, Arrecife | spain | 2025-10-30 | 28.96161166666667 | -13.54531666666667 | 9746×3896 |
| IMG_8979.HEIC | costa-papagayo-playa-blanca | Costa Papagayo, Playa Blanca | spain | 2025-10-31 | 28.86201333333333 | -13.82608666666667 | 10964×3910 |
| IMG_8980.HEIC | atlantic-costa-papagayo | Atlantic Ocean from Costa Papagayo | spain | 2025-10-31 | 28.86217166666667 | -13.825805 | 16080×3786 |
| IMG_9053.HEIC | playa-coloradas-lanzarote | Playa de las Coloradas, Lanzarote | spain | 2025-10-31 | 28.85447166666667 | -13.79465333333333 | 16156×3790 |
| IMG_9490.HEIC | jameos-del-agua | Jameos del Agua, Lanzarote | spain | 2025-11-04 | 29.15746666666667 | -13.43161166666667 | 11670×3908 |
| IMG_9515.HEIC | la-graciosa-mirador-guinate | La Graciosa from Mirador de Guinate | spain | 2025-11-04 | 29.18436166666667 | -13.50128333333333 | 8618×3894 |
| IMG_9548.HEIC | playa-cura-torrevieja | Playa del Cura at Dusk, Torrevieja | spain | 2024-11-12 | 37.976805 | -0.6706166666666667 | 10412×3894 |
| IMG_9560.HEIC | risco-famara-guinate | Risco de Famara from Guinate | spain | 2025-11-04 | 29.18472 | -13.50121166666667 | 8628×3908 |
| IMG_9649.HEIC | la-geria-vineyards | La Geria Vineyards, Lanzarote | spain | 2025-11-04 | 28.96963333333333 | -13.71465333333333 | 16024×3864 |
| IMG_9882.HEIC | algar-valley-dinopark | Algar Valley from DinoPark | spain | 2024-11-24 | 38.65215 | -0.09151383333333334 | 10538×3900 |
| IMG_9889.HEIC | el-golfo-volcanic-coast | El Golfo Volcanic Coast, Lanzarote | spain | 2025-11-04 | 28.978045 | -13.82877166666667 | 12572×3894 |
| IMG_9907.HEIC | charco-clicos-el-golfo | Charco de los Clicos, El Golfo | spain | 2025-11-04 | 28.978455 | -13.82867833333333 | 10578×3820 |

### Task 1: Lock down the import inventory

**Files:**
- Create: `scripts/new-panoramas.mjs`
- Create: `scripts/new-panoramas.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing manifest test**

Create a `node:test` suite which imports `newPanoramas`, asserts a length of 25, unique `source` and `slug` values, finite in-range coordinates, valid ISO dates, positive source dimensions, and exact presence of every `IMG_*.HEIC` name in the table above.

```js
import assert from "node:assert/strict";
import test from "node:test";
import { newPanoramas } from "./new-panoramas.mjs";

test("defines exactly 25 unique geolocated panorama imports", () => {
    assert.equal(newPanoramas.length, 25);
    assert.equal(new Set(newPanoramas.map((p) => p.source)).size, 25);
    assert.equal(new Set(newPanoramas.map((p) => p.slug)).size, 25);
    for (const p of newPanoramas) {
        assert.match(p.source, /^IMG_\d{4}\.HEIC$/);
        assert.match(p.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        assert.match(p.date, /^\d{4}-\d{2}-\d{2}$/);
        assert.ok(Number.isFinite(p.latitude) && Math.abs(p.latitude) <= 90);
        assert.ok(Number.isFinite(p.longitude) && Math.abs(p.longitude) <= 180);
        assert.ok(p.width > 0 && p.height > 0);
    }
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test scripts/new-panoramas.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/new-panoramas.mjs`.

- [ ] **Step 3: Add the manifest**

Export `newPanoramas` with one object per row in the authoritative table. Each object must contain `source`, `slug`, `title`, `country`, `date`, `latitude`, `longitude`, `width`, `height`, and an `alt` string beginning with `Panoramic view of`.

```js
export const newPanoramas = [
    {
        source: "IMG_0374.HEIC",
        slug: "laguna-rosa-torrevieja",
        title: "Laguna Rosa, Torrevieja",
        country: "spain",
        date: "2024-11-26",
        latitude: 37.98039166666667,
        longitude: -0.7061716666666666,
        width: 16104,
        height: 3858,
        alt: "Panoramic view of Laguna Rosa in Torrevieja",
    },
    { source: "IMG_0921.HEIC", slug: "dresden-neustadt-sunset", title: "Dresden Neustadt at Sunset", country: "germany", date: "2026-01-15", latitude: 51.06404166666667, longitude: 13.74632, width: 11312, height: 3932, alt: "Panoramic view of Dresden Neustadt at sunset" },
    { source: "IMG_2420.HEIC", slug: "girona-passeig-muralla", title: "Girona from Passeig de la Muralla", country: "spain", date: "2025-01-30", latitude: 41.98653, longitude: 2.828413333333333, width: 16144, height: 3792, alt: "Panoramic view of Girona from Passeig de la Muralla" },
    { source: "IMG_2474.HEIC", slug: "girona-general-peralta-tower", title: "Girona from Torre del General Peralta", country: "spain", date: "2025-01-30", latitude: 41.98408, longitude: 2.82773, width: 13314, height: 3828, alt: "Panoramic view of Girona from Torre del General Peralta" },
    { source: "IMG_3125.HEIC", slug: "benidorm-coast-balcon", title: "Benidorm Coast from Balcó del Mediterrani", country: "spain", date: "2025-02-09", latitude: 38.53393833333333, longitude: -0.1311278333333333, width: 8690, height: 3938, alt: "Panoramic view of the Benidorm coast from Balcó del Mediterrani" },
    { source: "IMG_3146.HEIC", slug: "benidorm-mediterranean-balcon", title: "Mediterranean Sea from Balcó del Mediterrani", country: "spain", date: "2025-02-09", latitude: 38.53368833333333, longitude: -0.1309583333333333, width: 11722, height: 3902, alt: "Panoramic view of the Mediterranean Sea from Balcó del Mediterrani" },
    { source: "IMG_3490.HEIC", slug: "madrid-mirador-cornisa", title: "Madrid from Mirador de la Cornisa", country: "spain", date: "2026-05-01", latitude: 40.416405, longitude: -3.715438333333333, width: 15752, height: 3848, alt: "Panoramic view of Madrid from Mirador de la Cornisa" },
    { source: "IMG_4912.HEIC", slug: "cadiz-alameda-apodaca", title: "Cádiz from Alameda Apodaca", country: "spain", date: "2026-05-11", latitude: 36.53791333333334, longitude: -6.300308333333334, width: 11478, height: 3894, alt: "Panoramic view of Cádiz from Alameda Apodaca" },
    { source: "IMG_4913.HEIC", slug: "cadiz-atlantic-horizon", title: "Atlantic Horizon in Cádiz", country: "spain", date: "2026-05-11", latitude: 36.53796333333333, longitude: -6.300308333333334, width: 16232, height: 3820, alt: "Panoramic view of the Atlantic horizon in Cádiz" },
    { source: "IMG_5374.HEIC", slug: "copenhagen-nordhavn", title: "Nordhavn, Copenhagen", country: "denmark", date: "2025-06-21", latitude: 55.71592833333333, longitude: 12.62582166666667, width: 9152, height: 3928, alt: "Panoramic view of Nordhavn in Copenhagen" },
    { source: "IMG_5613.HEIC", slug: "los-boliches-fuengirola", title: "Los Boliches Beach, Fuengirola", country: "spain", date: "2026-05-16", latitude: 36.55116666666667, longitude: -4.613505, width: 16048, height: 3810, alt: "Panoramic view of Los Boliches Beach in Fuengirola" },
    { source: "IMG_5931.HEIC", slug: "skjeringsdalen-stryn", title: "Skjeringsdalen, Stryn", country: "norway", date: "2025-06-23", latitude: 61.96401166666666, longitude: 7.252783333333333, width: 11354, height: 3840, alt: "Panoramic view of Skjeringsdalen in Stryn" },
    { source: "IMG_8534.HEIC", slug: "prague-hradcany", title: "Prague from Hradčany", country: "czech-republic", date: "2025-10-11", latitude: 50.0870055, longitude: 14.39042833333333, width: 8120, height: 3926, alt: "Panoramic view of Prague from Hradčany" },
    { source: "IMG_8961.HEIC", slug: "charco-san-gines-arrecife", title: "Charco de San Ginés, Arrecife", country: "spain", date: "2025-10-30", latitude: 28.96161166666667, longitude: -13.54531666666667, width: 9746, height: 3896, alt: "Panoramic view of Charco de San Ginés in Arrecife" },
    { source: "IMG_8979.HEIC", slug: "costa-papagayo-playa-blanca", title: "Costa Papagayo, Playa Blanca", country: "spain", date: "2025-10-31", latitude: 28.86201333333333, longitude: -13.82608666666667, width: 10964, height: 3910, alt: "Panoramic view of Costa Papagayo in Playa Blanca" },
    { source: "IMG_8980.HEIC", slug: "atlantic-costa-papagayo", title: "Atlantic Ocean from Costa Papagayo", country: "spain", date: "2025-10-31", latitude: 28.86217166666667, longitude: -13.825805, width: 16080, height: 3786, alt: "Panoramic view of the Atlantic Ocean from Costa Papagayo" },
    { source: "IMG_9053.HEIC", slug: "playa-coloradas-lanzarote", title: "Playa de las Coloradas, Lanzarote", country: "spain", date: "2025-10-31", latitude: 28.85447166666667, longitude: -13.79465333333333, width: 16156, height: 3790, alt: "Panoramic view of Playa de las Coloradas in Lanzarote" },
    { source: "IMG_9490.HEIC", slug: "jameos-del-agua", title: "Jameos del Agua, Lanzarote", country: "spain", date: "2025-11-04", latitude: 29.15746666666667, longitude: -13.43161166666667, width: 11670, height: 3908, alt: "Panoramic view of Jameos del Agua in Lanzarote" },
    { source: "IMG_9515.HEIC", slug: "la-graciosa-mirador-guinate", title: "La Graciosa from Mirador de Guinate", country: "spain", date: "2025-11-04", latitude: 29.18436166666667, longitude: -13.50128333333333, width: 8618, height: 3894, alt: "Panoramic view of La Graciosa from Mirador de Guinate" },
    { source: "IMG_9548.HEIC", slug: "playa-cura-torrevieja", title: "Playa del Cura at Dusk, Torrevieja", country: "spain", date: "2024-11-12", latitude: 37.976805, longitude: -0.6706166666666667, width: 10412, height: 3894, alt: "Panoramic view of Playa del Cura at dusk in Torrevieja" },
    { source: "IMG_9560.HEIC", slug: "risco-famara-guinate", title: "Risco de Famara from Guinate", country: "spain", date: "2025-11-04", latitude: 29.18472, longitude: -13.50121166666667, width: 8628, height: 3908, alt: "Panoramic view of Risco de Famara from Guinate" },
    { source: "IMG_9649.HEIC", slug: "la-geria-vineyards", title: "La Geria Vineyards, Lanzarote", country: "spain", date: "2025-11-04", latitude: 28.96963333333333, longitude: -13.71465333333333, width: 16024, height: 3864, alt: "Panoramic view of La Geria vineyards in Lanzarote" },
    { source: "IMG_9882.HEIC", slug: "algar-valley-dinopark", title: "Algar Valley from DinoPark", country: "spain", date: "2024-11-24", latitude: 38.65215, longitude: -0.09151383333333334, width: 10538, height: 3900, alt: "Panoramic view of Algar Valley from DinoPark" },
    { source: "IMG_9889.HEIC", slug: "el-golfo-volcanic-coast", title: "El Golfo Volcanic Coast, Lanzarote", country: "spain", date: "2025-11-04", latitude: 28.978045, longitude: -13.82877166666667, width: 12572, height: 3894, alt: "Panoramic view of El Golfo volcanic coast in Lanzarote" },
    { source: "IMG_9907.HEIC", slug: "charco-clicos-el-golfo", title: "Charco de los Clicos, El Golfo", country: "spain", date: "2025-11-04", latitude: 28.978455, longitude: -13.82867833333333, width: 10578, height: 3820, alt: "Panoramic view of Charco de los Clicos in El Golfo" },
];
```

- [ ] **Step 4: Add package commands and rerun the test**

```json
"import:panoramas": "node scripts/import-panoramas.mjs",
"test:panoramas": "node --test scripts/new-panoramas.test.mjs"
```

Run: `npm run test:panoramas`

Expected: PASS for the manifest inventory test.

- [ ] **Step 5: Commit the inventory**

```bash
git add package.json scripts/new-panoramas.mjs scripts/new-panoramas.test.mjs
git commit -m "test: define new panorama inventory"
```

### Task 2: Build the repeatable importer

**Files:**
- Create: `scripts/import-panoramas.mjs`
- Modify: `scripts/new-panoramas.test.mjs`

- [ ] **Step 1: Add failing generated-output tests**

For every manifest entry, assert the display WebP, full WebP, and Markdown file exist. Read image metadata with Sharp and assert display width is `Math.min(2400, p.width)`, full dimensions equal `p.width × p.height`, and Markdown contains the exact title, date, signed coordinates, display image path, and `/images/full/<slug>.webp` path.

- [ ] **Step 2: Run the output tests and verify they fail**

Run: `npm run test:panoramas`

Expected: FAIL because `assets/images/laguna-rosa-torrevieja.webp` does not exist.

- [ ] **Step 3: Implement the import CLI**

The CLI accepts the source directory as its only positional argument, verifies that its sorted `.HEIC` inventory exactly matches the manifest, creates output directories, and processes entries sequentially. For each entry it must:

```js
execFileSync("heif-convert", ["--quiet", sourcePath, tempPng]);
execFileSync("cwebp", ["-quiet", "-mt", "-m", "6", "-q", "90", "-sharp_yuv", "-metadata", "icc", tempPng, "-o", fullPath]);
execFileSync("cwebp", ["-quiet", "-mt", "-m", "6", "-q", "82", "-sharp_yuv", "-resize", "2400", "0", "-metadata", "icc", tempPng, "-o", displayPath]);
```

Write frontmatter in this exact shape, escaping YAML strings with `JSON.stringify` and always deleting the temporary PNG in `finally`:

```yaml
---
title: "Laguna Rosa, Torrevieja"
country: "spain"
date: "2024-11-26"
latitude: 37.98039166666667
longitude: -0.7061716666666666
image: ../../../assets/images/laguna-rosa-torrevieja.webp
full:
  src: /images/full/laguna-rosa-torrevieja.webp
  width: 16104
  height: 3858
alt: "Panoramic view of Laguna Rosa in Torrevieja"
---
```

- [ ] **Step 4: Generate all outputs**

Run: `npm run import:panoramas -- "/Users/4gray/Downloads/panoramas new"`

Expected: 25 progress lines followed by `Imported 25 panoramas`; no HEIC file under the repository.

- [ ] **Step 5: Run generated-output tests**

Run: `npm run test:panoramas`

Expected: manifest and generated-output assertions PASS.

- [ ] **Step 6: Commit generated content and assets**

```bash
git add scripts/import-panoramas.mjs scripts/new-panoramas.test.mjs assets/images public/images/full src/content/panoramas
git commit -m "feat: import 25 full-resolution panoramas"
```

### Task 3: Add full-resolution content support

**Files:**
- Modify: `src/content.config.ts`
- Modify: `src/pages/[slug].astro`
- Modify: `src/styles/global.scss`

- [ ] **Step 1: Run Astro check before schema support**

Run: `npm run check`

Expected: FAIL because the new content entries contain an unsupported `full` object.

- [ ] **Step 2: Extend the schema**

Add the following optional field after `image`:

```ts
full: z
    .object({
        src: z.string().regex(/^\/images\/full\/[a-z0-9-]+\.webp$/),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
    })
    .optional(),
```

- [ ] **Step 3: Add the detail-page link**

Derive a base-aware URL and render it inside `.post__meta` only for entries with `full`:

```astro
const fullImageUrl = data.full ? `${base}${data.full.src}` : null;
```

```astro
{
    data.full && fullImageUrl && (
        <a class="post__full-link" href={fullImageUrl} target="_blank" rel="noopener">
            full resolution · {data.full.width} × {data.full.height} px ↗
        </a>
    )
}
```

- [ ] **Step 4: Style the full-resolution link**

```scss
.post__full-link {
    color: var(--ink-muted);
    text-decoration: underline;
    text-decoration-color: transparent;
    text-underline-offset: 4px;
    transition: color 180ms ease, text-decoration-color 180ms ease;
}

.post__full-link:hover {
    color: var(--ink);
    text-decoration-color: var(--accent);
}

.post__full-link:focus-visible {
    outline: 1px solid var(--accent);
    outline-offset: 4px;
}
```

- [ ] **Step 5: Verify content and types**

Run: `npm run check && npm run build`

Expected: both commands exit 0; the build reports 44 static panorama detail pages plus the map and index routes.

- [ ] **Step 6: Commit full-resolution support**

```bash
git add src/content.config.ts 'src/pages/[slug].astro' src/styles/global.scss
git commit -m "feat: link full-resolution panorama files"
```

### Task 4: Prove Atlas completeness and coordinate fidelity

**Files:**
- Modify: `scripts/new-panoramas.test.mjs`

- [ ] **Step 1: Add failing built-site assertions**

After a production build, read `dist/map/index.html`. For each manifest entry, assert the page contains its slug, JSON-escaped title, exact latitude string, exact longitude string, thumbnail URL, and `/<slug>.html` detail URL. Assert the logbook count is 44 and that each new Markdown file retains the manifest coordinates without rounding.

- [ ] **Step 2: Run the Atlas assertions**

Run: `npm run build && npm run test:panoramas`

Expected: all tests PASS. A failure identifies the missing slug or mismatched coordinate.

- [ ] **Step 3: Inspect the real Atlas UI**

Run `npm run dev`, open `/panoramas/map`, and inspect desktop and mobile widths. Select each of the 25 new logbook entries or markers and verify the title, thumbnail, four-decimal coordinate card, marker focus, and `view frame` link. At clusters such as Cádiz, Benidorm, Guinate, Costa Papagayo, and El Golfo, verify each distinct entry remains selectable.

- [ ] **Step 4: Inspect panorama pages**

Open representative pages from every location group. Verify responsive display images, compressed PhotoSwipe images, Atlas deep links, and full-resolution links. Confirm a full-resolution request returns the native WebP dimensions from the manifest.

- [ ] **Step 5: Run final repository audit**

```bash
npm run check
npm run build
npm run test:panoramas
git diff --check
find . -type f -iname '*.heic' -not -path './.git/*'
git status --short
```

Expected: checks pass; build succeeds; 25 imports are verified; `git diff --check` is silent; HEIC search is empty; status contains only intentional implementation changes, or is clean after commits.

- [ ] **Step 6: Commit verification coverage**

```bash
git add scripts/new-panoramas.test.mjs
git commit -m "test: verify panorama markers and coordinates"
```
