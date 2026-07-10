import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
    readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("home uses a folio hero and numbered logbook entries", () => {
    assert.match(read("src/components/Hero.astro"), /hero__folio/);
    assert.match(read("src/components/Hero.astro"), /hero__ledger/);
    assert.match(read("src/components/PanoramaCard.astro"), /log-entry__margin/);
    assert.match(read("src/components/PanoramaCard.astro"), /log-entry__sheet/);
    assert.match(read("src/pages/index.astro"), /gallery--logbook/);
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
