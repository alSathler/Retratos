import assert from "node:assert/strict";
import test from "node:test";

import { panos2Batch } from "./panos2-panoramas.mjs";

const expectedSources = [
    "IMG_3161.HEIC",
    "IMG_3191.HEIC",
    "IMG_3320.HEIC",
    "IMG_3323.HEIC",
    "IMG_3479.HEIC",
    "IMG_3982.HEIC",
    "IMG_4031.HEIC",
    "IMG_4355.HEIC",
    "IMG_4546.HEIC",
    "IMG_4753.HEIC",
    "IMG_5514.HEIC",
];

test("defines the panos2 inventory and its duplicate exclusion", () => {
    assert.equal(panos2Batch.name, "panos2");
    assert.deepEqual(
        panos2Batch.panoramas.map((panorama) => panorama.source),
        expectedSources
    );
    assert.deepEqual(panos2Batch.excludedSources, [
        {
            source: "IMG_4032.HEIC",
            duplicateOf: "IMG_4031.HEIC",
            forbiddenSlug: "florence-skyline-piazzale-michelangelo",
            reason: "Same Piazzale Michelangelo viewpoint and skyline, captured 0.7 m apart",
        },
    ]);
    assert.equal(new Set(panos2Batch.panoramas.map((panorama) => panorama.slug)).size, 11);
});

test("defines valid metadata for every included panos2 panorama", () => {
    assert.equal(panos2Batch.panoramas.length, 11);

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
