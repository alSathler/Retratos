import assert from "node:assert/strict";
import test from "node:test";

import {
    expectedSourceFiles,
    panoramaBatches,
    parseImportArguments,
    validateBatchRegistry,
} from "./panorama-batches.mjs";

const usagePattern = /Usage: npm run import:panoramas/;

test("defaults to the new-panoramas batch", () => {
    const result = parseImportArguments(["/tmp/old"]);

    assert.equal(result.batch.name, "new-panoramas");
    assert.equal(result.sourceDir, "/tmp/old");
    assert.equal(result.metadataOnly, false);
});

test("accepts batch and metadata flags before the source directory", () => {
    const result = parseImportArguments([
        "--batch",
        "panos2",
        "--metadata-only",
        "/tmp/panos2",
    ]);

    assert.equal(result.batch, panoramaBatches.panos2);
    assert.equal(result.sourceDir, "/tmp/panos2");
    assert.equal(result.metadataOnly, true);
});

test("accepts the batch flag after the source directory", () => {
    const result = parseImportArguments([
        "--metadata-only",
        "/tmp/panos2",
        "--batch",
        "panos2",
    ]);

    assert.equal(result.batch, panoramaBatches.panos2);
    assert.equal(result.sourceDir, "/tmp/panos2");
    assert.equal(result.metadataOnly, true);
});

test("combines included and excluded panos2 source files", () => {
    assert.equal(panoramaBatches.panos2.panoramas.length, 11);
    assert.deepEqual(expectedSourceFiles(panoramaBatches.panos2), [
        "IMG_3161.HEIC",
        "IMG_3191.HEIC",
        "IMG_3320.HEIC",
        "IMG_3323.HEIC",
        "IMG_3479.HEIC",
        "IMG_3982.HEIC",
        "IMG_4031.HEIC",
        "IMG_4032.HEIC",
        "IMG_4355.HEIC",
        "IMG_4546.HEIC",
        "IMG_4753.HEIC",
        "IMG_5514.HEIC",
    ]);
});

test("rejects an unknown batch", () => {
    assert.throws(
        () => parseImportArguments(["--batch", "missing", "/tmp/source"]),
        /Unknown panorama batch/
    );
});

test("rejects inherited object properties as unknown batches", () => {
    assert.throws(
        () => parseImportArguments(["--batch", "__proto__", "/tmp/source"]),
        /Unknown panorama batch/
    );
});

test("rejects duplicate panorama slugs across batches", () => {
    const registry = {
        one: {
            name: "one",
            panoramas: [{ source: "one.HEIC", slug: "same" }],
            excludedSources: [],
        },
        two: {
            name: "two",
            panoramas: [{ source: "two.HEIC", slug: "same" }],
            excludedSources: [],
        },
    };

    assert.throws(
        () => validateBatchRegistry(registry),
        /Duplicate panorama slug: same/
    );
});

test("rejects a missing batch value", () => {
    assert.throws(() => parseImportArguments(["--batch"]), usagePattern);
});

test("rejects an unknown option", () => {
    assert.throws(
        () => parseImportArguments(["--unknown", "/tmp/source"]),
        usagePattern
    );
});

test("rejects multiple source directories", () => {
    assert.throws(
        () => parseImportArguments(["/tmp/one", "/tmp/two"]),
        usagePattern
    );
});

test("rejects a missing source directory", () => {
    assert.throws(() => parseImportArguments([]), usagePattern);
});
