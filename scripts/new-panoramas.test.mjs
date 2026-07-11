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
