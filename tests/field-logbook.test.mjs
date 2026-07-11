import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
    readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("home uses a physical notebook cover above numbered entries", () => {
    const hero = read("src/components/Hero.astro");

    assert.match(hero, /field-logbook-cover\.png/);
    assert.match(hero, /hero__notebook/);
    assert.match(hero, /ThemeToggle/);
    assert.match(hero, /hero__cover-actions/);
    assert.doesNotMatch(hero, /hero__photo-strip/);
    assert.doesNotMatch(hero, /coverPanorama/);
    assert.doesNotMatch(hero, /hero__folio/);
    assert.ok(
        existsSync(
            new URL("../assets/images/field-logbook-cover.png", import.meta.url)
        )
    );
    assert.match(read("src/components/PanoramaCard.astro"), /log-entry__margin/);
    assert.match(read("src/pages/index.astro"), /gallery--logbook/);
});

test("the A homepage replaces its global header with cover controls", () => {
    const base = read("src/layouts/Base.astro");
    const home = read("src/pages/index.astro");
    const hero = read("src/components/Hero.astro");

    assert.match(base, /showHeader\?: boolean/);
    assert.match(base, /showHeader = true/);
    assert.match(base, /\{showHeader && <SiteHeader \/>\}/);
    assert.match(home, /<Base showHeader=\{false\}>/);
    assert.match(hero, /ThemeToggle/);
    assert.match(hero, /hero__cover-actions/);
    assert.match(hero, /hero__cover-atlas/);
    assert.match(hero, /hero__cover-label/);
    assert.match(hero, /hero__method-note/);
});

test("the closed cover uses its baked panorama and compact label", () => {
    const hero = read("src/components/Hero.astro");
    const labelStart = hero.indexOf('<dl class="hero__cover-label">');
    const labelEnd = hero.indexOf("</dl>", labelStart);

    assert.notEqual(labelStart, -1);
    assert.notEqual(labelEnd, -1);

    const label = hero.slice(labelStart, labelEnd);
    assert.match(label, /entries/);
    assert.match(label, /countries/);
    assert.match(label, /recorded/);
    assert.doesNotMatch(label, /method/);
    assert.doesNotMatch(hero, /coverPanorama/);
    assert.doesNotMatch(hero, /coverDate/);
    assert.doesNotMatch(hero, /hero__photo-strip/);
});

test("detail uses an image and field-note spread", () => {
    const detail = read("src/pages/[slug].astro");

    assert.match(detail, /post__spread/);
    assert.match(detail, /post__field-note/);
    assert.match(detail, /post__topline/);
    assert.match(detail, /index: i \+ 1/);
});

test("detail keeps the title above the spread and out of the metadata rail", () => {
    const detail = read("src/pages/[slug].astro");
    const headingIndex = detail.indexOf('class="post__entry-heading shell-wide"');
    const spreadIndex = detail.indexOf('class="post__spread shell-wide"');
    const railStart = detail.indexOf('<aside class="post__field-note">');
    const railEnd = detail.indexOf("</aside>", railStart);
    const rail = detail.slice(railStart, railEnd);

    assert.notEqual(headingIndex, -1);
    assert.ok(headingIndex < spreadIndex);
    assert.doesNotMatch(rail, /post__title/);
    assert.doesNotMatch(rail, /<h1/);
});

test("the header identifies the field-log edition", () => {
    assert.match(read("src/components/SiteHeader.astro"), /site-brand__edition/);
});

test("mobile entry frames do not expand beyond the zero-gutter gallery", () => {
    const styles = read("src/styles/global.scss");

    assert.doesNotMatch(
        styles,
        /\.log-entry__frame\s*{\s*margin-inline:\s*calc\(-1 \* var\(--gutter\)\);\s*}/
    );
});
