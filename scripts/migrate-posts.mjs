#!/usr/bin/env node
// One-shot migration: Jekyll _posts → Astro src/content/panoramas.
// Reads each `_posts/YYYY-MM-DD-slug.markdown`, extracts the body <img> ref,
// and writes a content collection entry with normalized frontmatter.

import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const POSTS_DIR = join(ROOT, "_posts");
const OUT_DIR = join(ROOT, "src/content/panoramas");
const IMAGES_REL = "../../../assets/images";

function parseFrontmatter(raw) {
    const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!m) return null;
    return { fm: yaml.load(m[1]), body: m[2] };
}

function extractImage(body) {
    const m = body.match(/<img[^>]+src=["']\.?\/?(?:assets\/images\/)([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?/i);
    if (!m) return null;
    const altMatch = body.match(/alt=["']([^"']*)["']/i);
    return { file: m[1], alt: altMatch ? altMatch[1] : "" };
}

function parseFilename(filename) {
    const m = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.markdown$/);
    if (!m) return null;
    return { date: m[1], slug: m[2] };
}

async function main() {
    if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });

    const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith(".markdown"));
    let written = 0;

    for (const filename of files) {
        const parsedName = parseFilename(filename);
        if (!parsedName) {
            console.warn(`! skip ${filename}: unexpected filename`);
            continue;
        }

        const raw = await readFile(join(POSTS_DIR, filename), "utf8");
        const parsed = parseFrontmatter(raw);
        if (!parsed) {
            console.warn(`! skip ${filename}: no frontmatter`);
            continue;
        }

        const img = extractImage(parsed.body);
        if (!img) {
            console.warn(`! skip ${filename}: no <img> in body`);
            continue;
        }

        const data = {
            title: parsed.fm.title,
            country: parsed.fm.categories ?? "—",
            date: parsedName.date,
            ...(parsed.fm.latitude != null && { latitude: parsed.fm.latitude }),
            ...(parsed.fm.longitude != null && { longitude: parsed.fm.longitude }),
            image: `${IMAGES_REL}/${img.file}`,
            alt: img.alt || parsed.fm.title,
        };

        const out = `---\n${yaml.dump(data, { lineWidth: -1, quotingType: '"' })}---\n`;
        const outPath = join(OUT_DIR, `${parsedName.slug}.md`);
        await writeFile(outPath, out, "utf8");
        console.log(`✓ ${parsedName.slug}`);
        written++;
    }

    console.log(`\n${written} entries written to src/content/panoramas/`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
