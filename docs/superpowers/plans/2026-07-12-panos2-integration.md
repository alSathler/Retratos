# Panos2 Panorama Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import 11 distinct panoramas from `panos2`, explicitly exclude the one confirmed duplicate, and expose every imported panorama in compressed/full-resolution forms and at its exact Atlas location.

**Architecture:** Add a self-contained `panos2` batch manifest and a small batch registry that keeps the existing 25-image command backward-compatible. Refactor the importer to select a named batch, validate included and excluded source inventory, and derive all counts from that batch. Existing Astro content discovery continues to populate gallery, detail pages, and Atlas automatically.

**Tech Stack:** Node.js ESM, `node:test`, raw TIFF/EXIF parsing, `heif-convert`, `cwebp`, Sharp, Astro 5, WebP.

---

### Task 1: Define the panos2 inventory and duplicate exclusion

**Files:**
- Create: `scripts/panos2-panoramas.test.mjs`
- Create: `scripts/panos2-panoramas.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing manifest test**

Create `scripts/panos2-panoramas.test.mjs` with the exact included and excluded inventories:

```js
import assert from "node:assert/strict";
import test from "node:test";

import { panos2Batch } from "./panos2-panoramas.mjs";

const includedSources = [
    "IMG_3161.HEIC", "IMG_3191.HEIC", "IMG_3320.HEIC", "IMG_3323.HEIC",
    "IMG_3479.HEIC", "IMG_3982.HEIC", "IMG_4031.HEIC", "IMG_4355.HEIC",
    "IMG_4546.HEIC", "IMG_4753.HEIC", "IMG_5514.HEIC",
];

test("defines 11 distinct panos2 imports and one explicit duplicate exclusion", () => {
    assert.equal(panos2Batch.name, "panos2");
    assert.deepEqual(panos2Batch.panoramas.map(({ source }) => source), includedSources);
    assert.deepEqual(panos2Batch.excludedSources, [{
        source: "IMG_4032.HEIC",
        duplicateOf: "IMG_4031.HEIC",
        forbiddenSlug: "florence-skyline-piazzale-michelangelo",
        reason: "Same Piazzale Michelangelo viewpoint and skyline, captured 0.7 m apart",
    }]);
    assert.equal(new Set(panos2Batch.panoramas.map(({ slug }) => slug)).size, 11);
});

test("stores complete valid metadata for every panos2 import", () => {
    for (const panorama of panos2Batch.panoramas) {
        assert.match(panorama.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        assert.match(panorama.date, /^2024-\d{2}-\d{2}$/);
        assert.ok(["italy", "spain"].includes(panorama.country));
        assert.ok(Number.isFinite(panorama.latitude));
        assert.ok(Number.isFinite(panorama.longitude));
        assert.ok(Number.isInteger(panorama.width) && panorama.width > 2400);
        assert.ok(Number.isInteger(panorama.height) && panorama.height > 0);
        assert.ok(panorama.alt.startsWith("Panoramic view of"));
    }
});
```

- [ ] **Step 2: Run the manifest test and verify RED**

Run: `node --test scripts/panos2-panoramas.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/panos2-panoramas.mjs`.

- [ ] **Step 3: Add the complete batch manifest**

Create `scripts/panos2-panoramas.mjs`:

```js
export const panos2Batch = {
    name: "panos2",
    panoramas: [
        { source: "IMG_3161.HEIC", slug: "st-marks-basilica-venice", title: "St Mark’s Basilica, Venice", country: "italy", date: "2024-02-08", latitude: 45.43472222222222, longitude: 12.339002777777779, width: 14966, height: 3788, alt: "Panoramic view of St Mark’s Basilica and Campanile in Venice" },
        { source: "IMG_3191.HEIC", slug: "canal-frezzaria-venice", title: "Canal near Frezzaria, Venice", country: "italy", date: "2024-02-08", latitude: 45.43420833333333, longitude: 12.334861111111111, width: 8486, height: 3894, alt: "Panoramic view of a canal near Frezzaria in Venice" },
        { source: "IMG_3320.HEIC", slug: "gondolas-grand-canal-venice", title: "Gondolas on the Grand Canal, Venice", country: "italy", date: "2024-02-09", latitude: 45.437241666666665, longitude: 12.334050000000001, width: 7704, height: 3786, alt: "Panoramic view of gondolas on the Grand Canal in Venice" },
        { source: "IMG_3323.HEIC", slug: "grand-canal-riva-del-vin", title: "Grand Canal from Riva del Vin, Venice", country: "italy", date: "2024-02-09", latitude: 45.43757222222222, longitude: 12.334772222222222, width: 7904, height: 3900, alt: "Panoramic view of the Grand Canal from Riva del Vin in Venice" },
        { source: "IMG_3479.HEIC", slug: "giudecca-canal-dorsoduro", title: "Giudecca Canal from Dorsoduro, Venice", country: "italy", date: "2024-02-09", latitude: 45.42853888888889, longitude: 12.332941666666667, width: 8676, height: 3820, alt: "Panoramic view of the Giudecca Canal from Dorsoduro in Venice" },
        { source: "IMG_3982.HEIC", slug: "florence-viale-giuseppe-poggi", title: "Florence from Viale Giuseppe Poggi", country: "italy", date: "2024-02-12", latitude: 43.76374166666667, longitude: 11.264563888888889, width: 8958, height: 3900, alt: "Panoramic view of Florence and Torre San Niccolò from Viale Giuseppe Poggi" },
        { source: "IMG_4031.HEIC", slug: "florence-ponte-vecchio-piazzale-michelangelo", title: "Florence and Ponte Vecchio from Piazzale Michelangelo", country: "italy", date: "2024-02-12", latitude: 43.763225, longitude: 11.264105555555556, width: 13768, height: 3920, alt: "Panoramic view of Florence and Ponte Vecchio from Piazzale Michelangelo" },
        { source: "IMG_4355.HEIC", slug: "circus-maximus-palatine-hill", title: "Circus Maximus and Palatine Hill, Rome", country: "italy", date: "2024-02-16", latitude: 41.88559722222222, longitude: 12.485141666666665, width: 16284, height: 3888, alt: "Panoramic view of Circus Maximus and Palatine Hill in Rome" },
        { source: "IMG_4546.HEIC", slug: "imperial-fora-vittoriano", title: "Imperial Fora from the Vittoriano, Rome", country: "italy", date: "2024-02-16", latitude: 41.89459166666666, longitude: 12.483838888888888, width: 13374, height: 3914, alt: "Panoramic view of the Imperial Fora from the Vittoriano in Rome" },
        { source: "IMG_4753.HEIC", slug: "roman-forum-septimius-severus", title: "Roman Forum and Arch of Septimius Severus", country: "italy", date: "2024-02-17", latitude: 41.892916666666665, longitude: 12.48501111111111, width: 10126, height: 3920, alt: "Panoramic view of the Roman Forum and Arch of Septimius Severus" },
        { source: "IMG_5514.HEIC", slug: "puerto-cruz-atlantic-coast", title: "Atlantic Coast at Puerto de la Cruz", country: "spain", date: "2024-04-21", latitude: 28.416644444444444, longitude: -16.55725, width: 9958, height: 3820, alt: "Panoramic view of the Atlantic coast at Puerto de la Cruz in Tenerife" },
    ],
    excludedSources: [{
        source: "IMG_4032.HEIC",
        duplicateOf: "IMG_4031.HEIC",
        forbiddenSlug: "florence-skyline-piazzale-michelangelo",
        reason: "Same Piazzale Michelangelo viewpoint and skyline, captured 0.7 m apart",
    }],
};
```

Add `scripts/panos2-panoramas.test.mjs` to `test:panoramas` in `package.json`.

- [ ] **Step 4: Run the manifest tests and verify GREEN**

Run: `node --test scripts/panos2-panoramas.test.mjs`

Expected: 2 tests pass, 0 fail.

- [ ] **Step 5: Commit the inventory**

```bash
git add package.json scripts/panos2-panoramas.mjs scripts/panos2-panoramas.test.mjs
git commit -m "test: define panos2 panorama inventory"
```

### Task 2: Make the importer batch-aware

**Files:**
- Create: `scripts/panorama-batches.mjs`
- Create: `scripts/panorama-batches.test.mjs`
- Modify: `scripts/import-panoramas.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write failing selection and inventory tests**

Create `scripts/panorama-batches.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";

import {
    expectedSourceFiles,
    panoramaBatches,
    parseImportArguments,
    validateBatchRegistry,
} from "./panorama-batches.mjs";

test("keeps the previous batch as the default", () => {
    const result = parseImportArguments(["/tmp/old"]);
    assert.equal(result.batch.name, "new-panoramas");
    assert.equal(result.sourceDir, "/tmp/old");
    assert.equal(result.metadataOnly, false);
});

test("selects panos2 with metadata-only in either flag order", () => {
    for (const args of [
        ["--batch", "panos2", "--metadata-only", "/tmp/panos2"],
        ["--metadata-only", "/tmp/panos2", "--batch", "panos2"],
    ]) {
        const result = parseImportArguments(args);
        assert.equal(result.batch.name, "panos2");
        assert.equal(result.sourceDir, "/tmp/panos2");
        assert.equal(result.metadataOnly, true);
    }
});

test("panos2 inventory includes its excluded duplicate", () => {
    assert.equal(panoramaBatches.panos2.panoramas.length, 11);
    assert.deepEqual(expectedSourceFiles(panoramaBatches.panos2), [
        "IMG_3161.HEIC", "IMG_3191.HEIC", "IMG_3320.HEIC", "IMG_3323.HEIC",
        "IMG_3479.HEIC", "IMG_3982.HEIC", "IMG_4031.HEIC", "IMG_4032.HEIC",
        "IMG_4355.HEIC", "IMG_4546.HEIC", "IMG_4753.HEIC", "IMG_5514.HEIC",
    ]);
});

test("rejects unknown batches and duplicate output slugs", () => {
    assert.throws(() => parseImportArguments(["--batch", "missing", "/tmp/panos"]), /Unknown panorama batch/);
    assert.throws(() => validateBatchRegistry({
        a: { name: "a", panoramas: [{ slug: "same" }], excludedSources: [] },
        b: { name: "b", panoramas: [{ slug: "same" }], excludedSources: [] },
    }), /Duplicate panorama slug: same/);
});
```

- [ ] **Step 2: Run the selection tests and verify RED**

Run: `node --test scripts/panorama-batches.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/panorama-batches.mjs`.

- [ ] **Step 3: Implement the batch registry and argument parser**

Create `scripts/panorama-batches.mjs`:

```js
import assert from "node:assert/strict";

import { newPanoramas } from "./new-panoramas.mjs";
import { panos2Batch } from "./panos2-panoramas.mjs";

export const panoramaBatches = {
    "new-panoramas": {
        name: "new-panoramas",
        panoramas: newPanoramas,
        excludedSources: [],
    },
    panos2: panos2Batch,
};

export function validateBatchRegistry(registry = panoramaBatches) {
    const slugs = new Set();
    for (const batch of Object.values(registry)) {
        for (const panorama of batch.panoramas) {
            assert.ok(!slugs.has(panorama.slug), `Duplicate panorama slug: ${panorama.slug}`);
            slugs.add(panorama.slug);
        }
    }
}

export function expectedSourceFiles(batch) {
    return [
        ...batch.panoramas.map(({ source }) => source),
        ...batch.excludedSources.map(({ source }) => source),
    ].sort();
}

export function parseImportArguments(args) {
    let batchName = "new-panoramas";
    let metadataOnly = false;
    let sourceDir;

    for (let index = 0; index < args.length; index += 1) {
        const argument = args[index];
        if (argument === "--metadata-only") {
            metadataOnly = true;
        } else if (argument === "--batch") {
            batchName = args[index + 1];
            if (!batchName || batchName.startsWith("--")) {
                throw new Error("--batch requires a batch name");
            }
            index += 1;
        } else if (argument.startsWith("--")) {
            throw new Error(`Unknown import option: ${argument}`);
        } else if (sourceDir) {
            throw new Error("Only one source directory may be provided");
        } else {
            sourceDir = argument;
        }
    }

    const batch = panoramaBatches[batchName];
    if (!batch) throw new Error(`Unknown panorama batch: ${batchName}`);
    if (!sourceDir) {
        throw new Error(
            "Usage: npm run import:panoramas -- [--batch <name>] [--metadata-only] <source-directory>"
        );
    }

    return {
        batch,
        sourceDir,
        metadataOnly,
    };
}

validateBatchRegistry();
```

- [ ] **Step 4: Refactor the importer to use the selected batch**

Replace the direct `newPanoramas` import and ad-hoc argument parsing with:

```js
import { expectedSourceFiles, parseImportArguments } from "./panorama-batches.mjs";

const { batch, sourceDir, metadataOnly } = parseImportArguments(process.argv.slice(2));
const panoramas = batch.panoramas;
```

Use `expectedSourceFiles(batch)` for exact directory validation, iterate `panoramas`, interpolate `${panoramas.length}` in progress output, and finish with:

```js
console.log(
    `Imported ${panoramas.length} panoramas from ${batch.name}` +
    (batch.excludedSources.length ? ` (${batch.excludedSources.length} excluded)` : "")
);
```

Update the usage text to:

```text
Usage: npm run import:panoramas -- [--batch <name>] [--metadata-only] <source-directory>
```

Add `scripts/panorama-batches.test.mjs` to `test:panoramas`.

- [ ] **Step 5: Run batch and regression tests**

Run: `node --test scripts/panorama-batches.test.mjs scripts/heic-exif.test.mjs`

Expected: all tests pass.

- [ ] **Step 6: Verify the old real source inventory remains backward-compatible**

Run:

```bash
npm run import:panoramas -- --metadata-only "/Users/4gray/Downloads/panoramas new/"
```

Expected: all 25 old sources verify with the default batch and existing outputs remain unchanged. The real panos2 source verification runs after its outputs are generated in Task 3.

- [ ] **Step 7: Commit the reusable importer**

```bash
git add package.json scripts/import-panoramas.mjs scripts/panorama-batches.mjs scripts/panorama-batches.test.mjs
git commit -m "feat: support named panorama import batches"
```

### Task 3: Generate panos2 assets and content

**Files:**
- Create: `assets/images/st-marks-basilica-venice.webp`, `assets/images/canal-frezzaria-venice.webp`, `assets/images/gondolas-grand-canal-venice.webp`, `assets/images/grand-canal-riva-del-vin.webp`, `assets/images/giudecca-canal-dorsoduro.webp`, `assets/images/florence-viale-giuseppe-poggi.webp`, `assets/images/florence-ponte-vecchio-piazzale-michelangelo.webp`, `assets/images/circus-maximus-palatine-hill.webp`, `assets/images/imperial-fora-vittoriano.webp`, `assets/images/roman-forum-septimius-severus.webp`, `assets/images/puerto-cruz-atlantic-coast.webp`
- Create: `public/images/full/st-marks-basilica-venice.webp`, `public/images/full/canal-frezzaria-venice.webp`, `public/images/full/gondolas-grand-canal-venice.webp`, `public/images/full/grand-canal-riva-del-vin.webp`, `public/images/full/giudecca-canal-dorsoduro.webp`, `public/images/full/florence-viale-giuseppe-poggi.webp`, `public/images/full/florence-ponte-vecchio-piazzale-michelangelo.webp`, `public/images/full/circus-maximus-palatine-hill.webp`, `public/images/full/imperial-fora-vittoriano.webp`, `public/images/full/roman-forum-septimius-severus.webp`, `public/images/full/puerto-cruz-atlantic-coast.webp`
- Create: `src/content/panoramas/st-marks-basilica-venice.md`, `src/content/panoramas/canal-frezzaria-venice.md`, `src/content/panoramas/gondolas-grand-canal-venice.md`, `src/content/panoramas/grand-canal-riva-del-vin.md`, `src/content/panoramas/giudecca-canal-dorsoduro.md`, `src/content/panoramas/florence-viale-giuseppe-poggi.md`, `src/content/panoramas/florence-ponte-vecchio-piazzale-michelangelo.md`, `src/content/panoramas/circus-maximus-palatine-hill.md`, `src/content/panoramas/imperial-fora-vittoriano.md`, `src/content/panoramas/roman-forum-septimius-severus.md`, `src/content/panoramas/puerto-cruz-atlantic-coast.md`
- Modify: `scripts/panos2-panoramas.test.mjs`

- [ ] **Step 1: Add failing output and duplicate-exclusion tests**

Add these imports and tests to `scripts/panos2-panoramas.test.mjs`:

```js
import { access, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const repoRoot = new URL("../", import.meta.url);

test("generates display, full-resolution, and content files for every panos2 import", async () => {
    for (const panorama of panos2Batch.panoramas) {
        const displayUrl = new URL(`assets/images/${panorama.slug}.webp`, repoRoot);
        const fullUrl = new URL(`public/images/full/${panorama.slug}.webp`, repoRoot);
        const contentUrl = new URL(`src/content/panoramas/${panorama.slug}.md`, repoRoot);
        const [display, full, fullFile, content] = await Promise.all([
            sharp(fileURLToPath(displayUrl)).metadata(),
            sharp(fileURLToPath(fullUrl)).metadata(),
            stat(fullUrl),
            readFile(contentUrl, "utf8"),
        ]);

        assert.equal(display.format, "webp", `${panorama.slug} display format`);
        assert.equal(display.width, 2400, `${panorama.slug} display width`);
        assert.equal(full.format, "webp", `${panorama.slug} full format`);
        assert.equal(full.width, panorama.width, `${panorama.slug} full width`);
        assert.equal(full.height, panorama.height, `${panorama.slug} full height`);
        assert.ok(fullFile.size > 0, `${panorama.slug} full file is non-empty`);
        assert.ok(content.includes(`title: ${JSON.stringify(panorama.title)}`));
        assert.ok(content.includes(`date: ${JSON.stringify(panorama.date)}`));
        assert.ok(content.includes(`latitude: ${panorama.latitude}`));
        assert.ok(content.includes(`longitude: ${panorama.longitude}`));
        assert.ok(content.includes(`image: ../../../assets/images/${panorama.slug}.webp`));
        assert.ok(content.includes(`src: /images/full/${panorama.slug}.webp`));
        assert.ok(content.includes(`width: ${panorama.width}`));
        assert.ok(content.includes(`height: ${panorama.height}`));
    }
});

test("does not generate output for the excluded Florence duplicate", async () => {
    const [{ forbiddenSlug }] = panos2Batch.excludedSources;
    const forbiddenUrls = [
        new URL(`assets/images/${forbiddenSlug}.webp`, repoRoot),
        new URL(`public/images/full/${forbiddenSlug}.webp`, repoRoot),
        new URL(`src/content/panoramas/${forbiddenSlug}.md`, repoRoot),
    ];

    for (const url of forbiddenUrls) {
        await assert.rejects(access(url), { code: "ENOENT" });
    }
});
```

- [ ] **Step 2: Run the output tests and verify RED**

Run: `node --test scripts/panos2-panoramas.test.mjs`

Expected: manifest tests pass; output test fails with `ENOENT` for `st-marks-basilica-venice.webp`.

- [ ] **Step 3: Import the panos2 batch**

Run:

```bash
npm run import:panoramas -- --batch panos2 "/Users/4gray/Downloads/panos2/"
```

Expected: 11 display WebPs, 11 full-resolution WebPs, and 11 Markdown entries are generated; the log reports one excluded source.

- [ ] **Step 4: Run the output tests and verify GREEN**

Run: `node --test scripts/panos2-panoramas.test.mjs`

Expected: all panos2 tests pass.

- [ ] **Step 5: Commit generated assets and entries**

```bash
git add assets/images public/images/full src/content/panoramas scripts/panos2-panoramas.test.mjs
git commit -m "feat: import 11 panos2 panoramas"
```

### Task 4: Verify detail pages and Atlas integration

**Files:**
- Modify: `scripts/panos2-panoramas.test.mjs`
- Modify: `scripts/new-panoramas.test.mjs`

- [ ] **Step 1: Write failing rendered-output tests**

Add these tests to `scripts/panos2-panoramas.test.mjs`:

```js
test("renders full-resolution links for every panos2 detail page", async () => {
    for (const panorama of panos2Batch.panoramas) {
        const html = await readFile(new URL(`dist/${panorama.slug}.html`, repoRoot), "utf8");
        assert.ok(html.includes(`href="/panoramas/images/full/${panorama.slug}.webp"`));
        assert.ok(html.includes(`${panorama.width} × ${panorama.height} px`));
    }
});

test("renders all panos2 entries in Atlas with exact metadata", async () => {
    const html = await readFile(new URL("dist/map.html", repoRoot), "utf8");
    const match = html.match(/const places = (\[.*?\]);\s*const PROJ =/s);
    assert.ok(match, "Atlas must embed its places data");
    const places = JSON.parse(match[1]);
    const placesBySlug = new Map(places.map((place) => [place.slug, place]));
    const picker = html.match(/<select[^>]*id="place-picker"[^>]*>[\s\S]*?<\/select>/);

    assert.equal(places.length, 55);
    assert.match(html, />55<\/em> places/);
    assert.ok(picker);
    assert.equal((picker[0].match(/<option/g) ?? []).length, 56);

    for (const panorama of panos2Batch.panoramas) {
        const place = placesBySlug.get(panorama.slug);
        assert.ok(place, `${panorama.slug} Atlas place`);
        assert.equal(place.title, panorama.title);
        assert.equal(place.lat, panorama.latitude);
        assert.equal(place.lon, panorama.longitude);
        assert.equal(place.url, `/panoramas/${panorama.slug}.html`);
        assert.match(place.thumb, /^\/panoramas\/_astro\/.+\.webp$/);
        assert.ok(html.includes(`data-slug="${panorama.slug}"`));
        assert.ok(picker[0].includes(`value="${panorama.slug}"`));
        assert.ok(picker[0].includes(panorama.title));
    }
});

test("keeps nearby panos2 Atlas markers independently selectable", async () => {
    const html = await readFile(new URL("dist/map.html", repoRoot), "utf8");
    const match = html.match(/const places = (\[.*?\]);\s*const PROJ =/s);
    const places = JSON.parse(match[1]);
    const placesBySlug = new Map(places.map((place) => [place.slug, place]));
    const clusters = [
    ["st-marks-basilica-venice", "canal-frezzaria-venice", "gondolas-grand-canal-venice", "grand-canal-riva-del-vin"],
    ["florence-viale-giuseppe-poggi", "florence-ponte-vecchio-piazzale-michelangelo"],
    ["imperial-fora-vittoriano", "roman-forum-septimius-severus"],
    ];

    for (const cluster of clusters) {
        for (const slug of cluster) {
            assert.deepEqual(
                [...placesBySlug.get(slug).cluster].sort(),
                [...cluster].sort(),
                `${slug} nearby cluster`
            );
        }
    }
});
```

Update these exact assertions in `scripts/new-panoramas.test.mjs` so the old batch regression suite reflects the complete site:

```js
assert.equal(places.length, 55);
assert.ok(html.includes("<em data-astro-cid-mtmprebk>55</em> places"));
assert.equal((picker[0].match(/<option/g) ?? []).length, 56);
```

- [ ] **Step 2: Run rendered-output tests against the stale build and verify RED**

Run: `node --test scripts/panos2-panoramas.test.mjs scripts/new-panoramas.test.mjs`

Expected: FAIL because the stale build contains 44 Atlas places and no panos2 detail pages.

- [ ] **Step 3: Build the site**

Run: `npm run build`

Expected: 58 total static pages (55 panorama details, index, map, and 404).

- [ ] **Step 4: Run rendered-output tests and verify GREEN**

Run: `node --test scripts/panos2-panoramas.test.mjs scripts/new-panoramas.test.mjs`

Expected: all tests pass, Atlas reports 55 places, and the picker contains 56 options.

- [ ] **Step 5: Commit the Atlas verification updates**

```bash
git add scripts/panos2-panoramas.test.mjs scripts/new-panoramas.test.mjs
git commit -m "test: verify panos2 Atlas integration"
```

### Task 5: Runtime QA, final verification, review, and merge

**Files:**
- Verify: all changed and generated files

- [ ] **Step 1: Run the full verification suite**

```bash
npm run import:panoramas -- --batch panos2 --metadata-only "/Users/4gray/Downloads/panos2/"
npm run check
npm run build
npm run test:panoramas
git diff --check master...HEAD
```

Expected: 11 included sources match raw EXIF, Astro reports 0 errors, the build succeeds, all panorama tests pass, and diff checking prints nothing.

- [ ] **Step 2: Audit counts and prohibited files**

Run:

```bash
node --input-type=module - <<'JS'
import { access, readFile, stat } from "node:fs/promises";
import assert from "node:assert/strict";
import sharp from "sharp";
import { panos2Batch } from "./scripts/panos2-panoramas.mjs";

assert.equal(panos2Batch.panoramas.length, 11);
const html = await readFile("dist/map.html", "utf8");
const match = html.match(/const places = (\[.*?\]);\s*const PROJ =/s);
assert.ok(match);
const places = JSON.parse(match[1]);
const placesBySlug = new Map(places.map((place) => [place.slug, place]));
assert.equal(places.length, 55);

for (const panorama of panos2Batch.panoramas) {
    const [display, full, fullFile] = await Promise.all([
        sharp(`assets/images/${panorama.slug}.webp`).metadata(),
        sharp(`public/images/full/${panorama.slug}.webp`).metadata(),
        stat(`public/images/full/${panorama.slug}.webp`),
    ]);
    assert.equal(display.width, 2400);
    assert.equal(full.width, panorama.width);
    assert.equal(full.height, panorama.height);
    assert.ok(fullFile.size > 0);
    assert.equal(placesBySlug.get(panorama.slug).title, panorama.title);
    assert.equal(placesBySlug.get(panorama.slug).lat, panorama.latitude);
    assert.equal(placesBySlug.get(panorama.slug).lon, panorama.longitude);
}

const [{ forbiddenSlug }] = panos2Batch.excludedSources;
for (const path of [
    `assets/images/${forbiddenSlug}.webp`,
    `public/images/full/${forbiddenSlug}.webp`,
    `src/content/panoramas/${forbiddenSlug}.md`,
]) {
    await assert.rejects(access(path), { code: "ENOENT" });
}
console.log("Audit: 11 panos2 imports, 55 Atlas places, duplicate excluded");
JS
find . -type f \( -iname '*.heic' -o -iname '*.heif' \) -print
```

Expected: the audit line prints, and `find` prints nothing.

- [ ] **Step 3: Inspect runtime behavior**

Start `npm run dev -- --host 127.0.0.1`, then inspect desktop and mobile gallery/detail/Atlas pages. Verify a clustered Venice marker can cycle, the mobile picker selects all 55 places, an imported detail page uses its 2400 px display asset, and its full-resolution link returns WebP content at native dimensions.

- [ ] **Step 4: Request code review and address only verified actionable findings**

Review manifest accuracy, duplicate exclusion, importer compatibility, generated outputs, Atlas tests, and unrelated-change boundaries. Re-run the relevant failing/passing command after any correction.

- [ ] **Step 5: Merge into master and verify in the main worktree**

Confirm both worktrees are clean, fast-forward or merge `agent/panos2` into `master`, then run `npm run check`, `npm run build`, and `npm run test:panoramas` from `/Users/4gray/Code/panoramas`. Remove the merged temporary worktree and branch only after these commands pass.
