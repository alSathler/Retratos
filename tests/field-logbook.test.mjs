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

test("the mobile cover copy and label clear the controls as a compact strip", () => {
    const styles = read("src/styles/global.scss");
    const mobileStart = styles.indexOf("@media (max-width: 720px)");
    const mobileEnd = styles.indexOf("// ── colophon", mobileStart);
    const mobile = styles.slice(mobileStart, mobileEnd);
    const copyStart = mobile.indexOf(".hero__cover-copy {");
    const copyEnd = mobile.indexOf("}", copyStart);
    const copy = mobile.slice(copyStart, copyEnd);
    const labelStart = mobile.indexOf(".hero__cover-label {");
    const labelEnd = mobile.indexOf("}", labelStart);
    const label = mobile.slice(labelStart, labelEnd);

    assert.notEqual(mobileStart, -1);
    assert.notEqual(mobileEnd, -1);
    assert.notEqual(copyStart, -1);
    assert.notEqual(labelStart, -1);
    assert.match(label, /right:\s*8%/);
    assert.match(label, /left:\s*8%/);
    assert.match(label, /min-height:\s*50px/);
    assert.match(
        label,
        /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/
    );
    assert.deepEqual(
        [
            copy.match(/top:\s*([^;]+);/)?.[1],
            label.match(/top:\s*([^;]+);/)?.[1],
        ],
        ["17%", "67%"]
    );
});

test("the floating notebook dissolves into a CSS letterpress stage", () => {
    const hero = read("src/components/Hero.astro");
    const styles = read("src/styles/global.scss");

    assert.match(hero, /hero__print-bridge/);
    assert.match(hero, /hero__perforation/);
    assert.match(hero, /field index/);
    assert.match(hero, /\{String\(total\)\.padStart\(2, "0"\)\} plates/);
    assert.match(styles, /--notebook-stage:\s*#171817/);
    assert.match(
        styles,
        /\.hero__print-bridge\s*\{[^}]*radial-gradient/s
    );
    assert.match(styles, /\.hero__perforation/);
    assert.match(
        styles,
        /\.gallery--logbook \.log-entry:first-of-type\s*\{[^}]*border-top:\s*0/s
    );
    assert.doesNotMatch(
        hero,
        /(?:desk|stage|pattern|texture)[^\s"'`]*\.(?:avif|gif|jpe?g|png|webp)/i
    );
});

test("the print bridge fades its exposed base color with the page theme", () => {
    const styles = read("src/styles/global.scss");
    const bridgeStart = styles.indexOf(".hero__print-bridge {");
    const bridgeEnd = styles.indexOf("\n}", bridgeStart);
    const bridge = styles.slice(bridgeStart, bridgeEnd);

    assert.notEqual(bridgeStart, -1);
    assert.notEqual(bridgeEnd, -1);
    assert.match(bridge, /background-color:\s*var\(--bg\)/);
    assert.match(bridge, /transition:\s*background-color 220ms ease/);
    assert.match(
        bridge,
        /linear-gradient\(\s*180deg,[\s\S]*?transparent 100%\s*\)/
    );
    assert.doesNotMatch(bridge, /var\(--bg\) 100%/);
});

test("the mobile notebook label and print bridge stay compact", () => {
    const styles = read("src/styles/global.scss");
    const mobileStart = styles.indexOf("@media (max-width: 720px)");
    const mobileEnd = styles.indexOf("// ── colophon", mobileStart);
    const mobile = styles.slice(mobileStart, mobileEnd);

    assert.notEqual(mobileStart, -1);
    assert.notEqual(mobileEnd, -1);
    assert.match(
        mobile,
        /\.hero__cover-label\s*\{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/s
    );
    assert.match(
        mobile,
        /\.hero__print-bridge\s*\{[^}]*height:\s*64px/s
    );
    assert.match(
        mobile,
        /\.hero__perforation\s*\{[^}]*inset-inline:\s*20px/s
    );
});

test("tablet cover copy clears the fixed printed label", () => {
    const styles = read("src/styles/global.scss");
    const tabletStart = styles.indexOf(
        "@media (min-width: 721px) and (max-width: 900px)"
    );
    const tabletEnd = styles.indexOf("@media (max-width: 720px)", tabletStart);
    const tablet = styles.slice(tabletStart, tabletEnd);

    assert.notEqual(tabletStart, -1);
    assert.notEqual(tabletEnd, -1);
    assert.match(
        tablet,
        /\.hero__lede\s*\{[^}]*margin-top:\s*(?:10|11|12)px/s
    );
    assert.match(
        tablet,
        /\.hero__method-note\s*\{[^}]*margin-top:\s*(?:4|5)px/s
    );
    assert.doesNotMatch(tablet, /\.hero__cover-label\s*\{/);
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
