import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { newPanoramas } from "./new-panoramas.mjs";

const repoRoot = new URL("../", import.meta.url);

const expectedSources = [
    "IMG_0374.HEIC",
    "IMG_0921.HEIC",
    "IMG_2420.HEIC",
    "IMG_2474.HEIC",
    "IMG_3125.HEIC",
    "IMG_3146.HEIC",
    "IMG_3490.HEIC",
    "IMG_4912.HEIC",
    "IMG_4913.HEIC",
    "IMG_5374.HEIC",
    "IMG_5613.HEIC",
    "IMG_5931.HEIC",
    "IMG_8534.HEIC",
    "IMG_8961.HEIC",
    "IMG_8979.HEIC",
    "IMG_8980.HEIC",
    "IMG_9053.HEIC",
    "IMG_9490.HEIC",
    "IMG_9515.HEIC",
    "IMG_9548.HEIC",
    "IMG_9560.HEIC",
    "IMG_9649.HEIC",
    "IMG_9882.HEIC",
    "IMG_9889.HEIC",
    "IMG_9907.HEIC",
];

test("defines exactly 25 unique geolocated panorama imports", async () => {
    assert.equal(newPanoramas.length, 25);
    assert.deepEqual(
        newPanoramas.map((panorama) => panorama.source).sort(),
        expectedSources
    );
    assert.equal(new Set(newPanoramas.map((panorama) => panorama.source)).size, 25);
    assert.equal(new Set(newPanoramas.map((panorama) => panorama.slug)).size, 25);

    for (const panorama of newPanoramas) {
        assert.match(panorama.source, /^IMG_\d{4}\.HEIC$/);
        assert.match(panorama.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        assert.match(panorama.date, /^\d{4}-\d{2}-\d{2}$/);
        assert.ok(panorama.title.length > 3);
        assert.ok(panorama.alt.startsWith("Panoramic view of"));
        assert.ok(Number.isFinite(panorama.latitude));
        assert.ok(Math.abs(panorama.latitude) <= 90);
        assert.ok(Number.isFinite(panorama.longitude));
        assert.ok(Math.abs(panorama.longitude) <= 180);
        assert.ok(Number.isInteger(panorama.width) && panorama.width > 0);
        assert.ok(Number.isInteger(panorama.height) && panorama.height > 0);
    }
});

test("generates display, full-resolution, and content files for every import", async () => {
    for (const panorama of newPanoramas) {
        const displayUrl = new URL(`assets/images/${panorama.slug}.webp`, repoRoot);
        const fullUrl = new URL(`public/images/full/${panorama.slug}.webp`, repoRoot);
        const contentUrl = new URL(`src/content/panoramas/${panorama.slug}.md`, repoRoot);

        const display = await sharp(fileURLToPath(displayUrl)).metadata();
        const full = await sharp(fileURLToPath(fullUrl)).metadata();
        const content = await readFile(contentUrl, "utf8");

        assert.equal(display.format, "webp", `${panorama.slug} display format`);
        assert.equal(display.width, Math.min(2400, panorama.width), `${panorama.slug} display width`);
        assert.equal(full.format, "webp", `${panorama.slug} full format`);
        assert.equal(full.width, panorama.width, `${panorama.slug} full width`);
        assert.equal(full.height, panorama.height, `${panorama.slug} full height`);
        assert.match(content, new RegExp(`title: ${JSON.stringify(panorama.title)}`));
        assert.match(content, new RegExp(`date: ${JSON.stringify(panorama.date)}`));
        assert.ok(content.includes(`latitude: ${panorama.latitude}`));
        assert.ok(content.includes(`longitude: ${panorama.longitude}`));
        assert.ok(content.includes(`image: ../../../assets/images/${panorama.slug}.webp`));
        assert.ok(content.includes(`src: /images/full/${panorama.slug}.webp`));
        assert.ok(content.includes(`width: ${panorama.width}`));
        assert.ok(content.includes(`height: ${panorama.height}`));
    }
});

test("renders a base-aware full-resolution link on every imported detail page", async () => {
    for (const panorama of newPanoramas) {
        const html = await readFile(new URL(`dist/${panorama.slug}.html`, repoRoot), "utf8");
        const expectedHref = `/panoramas/images/full/${panorama.slug}.webp`;
        const expectedDimensions = `${panorama.width} × ${panorama.height} px`;

        assert.ok(html.includes(`href="${expectedHref}"`), `${panorama.slug} full href`);
        assert.ok(html.includes("full resolution"), `${panorama.slug} full label`);
        assert.ok(html.includes(expectedDimensions), `${panorama.slug} native dimensions`);
    }
});

test("renders all imported panoramas in Atlas with exact coordinates", async () => {
    const html = await readFile(new URL("dist/map.html", repoRoot), "utf8");
    const match = html.match(/const places = (\[.*?\]);\s*const PROJ =/s);

    assert.ok(match, "Atlas must embed its places data");
    const places = JSON.parse(match[1]);
    const placesBySlug = new Map(places.map((place) => [place.slug, place]));

    assert.equal(places.length, 44);
    assert.ok(html.includes("<em data-astro-cid-mtmprebk>44</em> places"));

    for (const panorama of newPanoramas) {
        const place = placesBySlug.get(panorama.slug);

        assert.ok(place, `${panorama.slug} Atlas place`);
        assert.equal(place.title, panorama.title, `${panorama.slug} Atlas title`);
        assert.equal(place.latitude, undefined, `${panorama.slug} does not rename lat`);
        assert.equal(place.lat, panorama.latitude, `${panorama.slug} Atlas latitude`);
        assert.equal(place.lon, panorama.longitude, `${panorama.slug} Atlas longitude`);
        assert.equal(place.url, `/panoramas/${panorama.slug}.html`, `${panorama.slug} Atlas URL`);
        assert.match(place.thumb, /^\/panoramas\/_astro\/.+\.webp$/);
        assert.ok(html.includes(`class="row" type="button" data-slug="${panorama.slug}"`));
        assert.ok(html.includes(`class="pin" data-slug="${panorama.slug}"`));
    }
});

test("groups nearby Atlas markers so overlapping panoramas remain selectable", async () => {
    const html = await readFile(new URL("dist/map.html", repoRoot), "utf8");
    const match = html.match(/const places = (\[.*?\]);\s*const PROJ =/s);
    const places = JSON.parse(match[1]);
    const placesBySlug = new Map(places.map((place) => [place.slug, place]));
    const expectedClusters = [
        ["dresden-albertplatz", "dresden-neustadt-sunset"],
        ["girona-general-peralta-tower", "girona-passeig-muralla"],
        ["benidorm-coast-balcon", "benidorm-mediterranean-balcon"],
        ["atlantic-costa-papagayo", "costa-papagayo-playa-blanca"],
        ["charco-clicos-el-golfo", "el-golfo-volcanic-coast"],
        ["la-graciosa-mirador-guinate", "risco-famara-guinate"],
        ["cadiz-alameda-apodaca", "cadiz-atlantic-horizon"],
    ];

    for (const cluster of expectedClusters) {
        for (const slug of cluster) {
            const place = placesBySlug.get(slug);
            assert.ok(place, `${slug} nearby place`);
            assert.deepEqual([...place.cluster].sort(), [...cluster].sort(), `${slug} nearby cluster`);
        }
    }

    assert.ok(html.includes("function focusPin(slug)"));
});

test("renders a mobile place picker with every Atlas entry", async () => {
    const html = await readFile(new URL("dist/map.html", repoRoot), "utf8");
    const picker = html.match(/<select[^>]*id="place-picker"[^>]*>[\s\S]*?<\/select>/);

    assert.ok(picker, "Atlas must render a mobile place picker");
    assert.equal((picker[0].match(/<option/g) ?? []).length, 45);

    for (const panorama of newPanoramas) {
        assert.ok(picker[0].includes(`value="${panorama.slug}"`), `${panorama.slug} picker option`);
        assert.ok(picker[0].includes(panorama.title), `${panorama.slug} picker title`);
    }
});

test("applies the mobile logbook hiding rule after the base logbook display", async () => {
    const source = await readFile(new URL("src/components/WorldMap.astro", repoRoot), "utf8");
    const baseRuleIndex = source.indexOf("\n    .logbook {");
    const mobileHideIndex = source.lastIndexOf(
        "@media (max-width: 820px) {\n        .logbook {\n            display: none;"
    );

    assert.ok(baseRuleIndex >= 0, "Atlas must define the base logbook rule");
    assert.ok(mobileHideIndex > baseRuleIndex, "mobile display:none must win the CSS cascade");
});
