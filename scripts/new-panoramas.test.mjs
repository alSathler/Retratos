import assert from "node:assert/strict";
import test from "node:test";

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
    let newPanoramas;

    try {
        ({ newPanoramas } = await import("./new-panoramas.mjs"));
    } catch {
        // The first red run intentionally happens before the manifest exists.
    }

    assert.ok(newPanoramas, "newPanoramas manifest must exist");
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
