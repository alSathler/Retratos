import assert from "node:assert/strict";

import { newPanoramas } from "./new-panoramas.mjs";
import { panos2Batch } from "./panos2-panoramas.mjs";

const importUsage =
    "Usage: npm run import:panoramas -- [--batch <name>] [--metadata-only] <source-directory>";

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
            assert(!slugs.has(panorama.slug), `Duplicate panorama slug: ${panorama.slug}`);
            slugs.add(panorama.slug);
        }
    }
}

export function expectedSourceFiles(batch) {
    return [
        ...batch.panoramas.map((panorama) => panorama.source),
        ...batch.excludedSources.map((excluded) => excluded.source),
    ].sort();
}

export function parseImportArguments(args) {
    let batchName = "new-panoramas";
    let metadataOnly = false;
    let sourceDir;

    for (let index = 0; index < args.length; index += 1) {
        const argument = args[index];

        if (argument === "--batch") {
            const value = args[index + 1];
            if (!value || value.startsWith("--")) {
                throw new Error(importUsage);
            }
            batchName = value;
            index += 1;
        } else if (argument === "--metadata-only") {
            metadataOnly = true;
        } else if (argument.startsWith("--") || sourceDir) {
            throw new Error(importUsage);
        } else {
            sourceDir = argument;
        }
    }

    const batch = Object.hasOwn(panoramaBatches, batchName)
        ? panoramaBatches[batchName]
        : undefined;
    if (!batch) {
        throw new Error(`Unknown panorama batch: ${batchName}`);
    }
    if (!sourceDir) {
        throw new Error(importUsage);
    }

    return { batch, sourceDir, metadataOnly };
}

validateBatchRegistry();
