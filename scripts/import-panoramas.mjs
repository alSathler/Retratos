import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { parseExifMetadata } from "./heic-exif.mjs";
import { newPanoramas } from "./new-panoramas.mjs";

const argumentsList = process.argv.slice(2);
const metadataOnly = argumentsList.includes("--metadata-only");
const sourceDir = argumentsList.find((argument) => argument !== "--metadata-only");

if (!sourceDir) {
    throw new Error(
        "Usage: npm run import:panoramas -- [--metadata-only] <source-directory>"
    );
}

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const displayDir = join(repoRoot, "assets/images");
const fullDir = join(repoRoot, "public/images/full");
const contentDir = join(repoRoot, "src/content/panoramas");

const actualSources = (await readdir(sourceDir))
    .filter((file) => file.toLowerCase().endsWith(".heic"))
    .sort();
const expectedSources = newPanoramas.map((panorama) => panorama.source).sort();

assert.deepEqual(
    actualSources,
    expectedSources,
    "Source directory must contain exactly the 25 HEIC files in the manifest"
);

await Promise.all([
    mkdir(displayDir, { recursive: true }),
    mkdir(fullDir, { recursive: true }),
    mkdir(contentDir, { recursive: true }),
]);

const temporaryDir = await mkdtemp(join(tmpdir(), "panoramas-import-"));

function run(command, args) {
    execFileSync(command, args, { stdio: ["ignore", "ignore", "inherit"] });
}

function frontmatter(panorama) {
    return `---
title: ${JSON.stringify(panorama.title)}
country: ${JSON.stringify(panorama.country)}
date: ${JSON.stringify(panorama.date)}
latitude: ${panorama.latitude}
longitude: ${panorama.longitude}
image: ../../../assets/images/${panorama.slug}.webp
full:
  src: /images/full/${panorama.slug}.webp
  width: ${panorama.width}
  height: ${panorama.height}
alt: ${JSON.stringify(panorama.alt)}
---
`;
}

try {
    for (const [index, panorama] of newPanoramas.entries()) {
        const sourcePath = join(sourceDir, panorama.source);
        const temporaryImage = join(
            temporaryDir,
            `${panorama.slug}.${metadataOnly ? "jpg" : "png"}`
        );
        const temporaryExif = join(temporaryDir, `${panorama.slug}.exif`);
        const displayPath = join(displayDir, `${panorama.slug}.webp`);
        const fullPath = join(fullDir, `${panorama.slug}.webp`);
        const contentPath = join(contentDir, `${panorama.slug}.md`);

        process.stdout.write(
            `[${String(index + 1).padStart(2, "0")}/25] ${panorama.source} → ${panorama.slug}\n`
        );

        run("heif-convert", [
            "--quiet",
            "--with-exif",
            ...(metadataOnly ? ["-q", "1"] : []),
            sourcePath,
            temporaryImage,
        ]);
        const sourceMetadata = parseExifMetadata(await readFile(temporaryExif));
        assert.deepEqual(
            sourceMetadata,
            {
                latitude: panorama.latitude,
                longitude: panorama.longitude,
                date: panorama.date,
            },
            `${panorama.source} manifest metadata must exactly match its raw EXIF values`
        );
        if (!metadataOnly) {
            run("cwebp", [
                "-quiet",
                "-mt",
                "-m",
                "6",
                "-q",
                "90",
                "-sharp_yuv",
                "-metadata",
                "icc",
                temporaryImage,
                "-o",
                fullPath,
            ]);
            run("cwebp", [
                "-quiet",
                "-mt",
                "-m",
                "6",
                "-q",
                "82",
                "-sharp_yuv",
                "-resize",
                "2400",
                "0",
                "-metadata",
                "icc",
                temporaryImage,
                "-o",
                displayPath,
            ]);
        }

        const [displayMetadata, fullMetadata] = await Promise.all([
            sharp(displayPath).metadata(),
            sharp(fullPath).metadata(),
        ]);
        assert.equal(displayMetadata.width, Math.min(2400, panorama.width));
        assert.equal(fullMetadata.width, panorama.width);
        assert.equal(fullMetadata.height, panorama.height);

        await writeFile(contentPath, frontmatter(panorama), "utf8");
        await rm(temporaryImage, { force: true });
        await rm(temporaryExif, { force: true });
    }
} finally {
    await rm(temporaryDir, { recursive: true, force: true });
}

console.log(`Imported ${newPanoramas.length} panoramas`);
