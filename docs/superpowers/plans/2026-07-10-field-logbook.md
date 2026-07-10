# Field Logbook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a second, independent visual direction that presents the panorama collection as a tactile personal field log rather than a cinematic archive.

**Architecture:** Keep Astro content, optimized images, routing, and PhotoSwipe unchanged. Replace the home and detail presentation with explicit logbook units: a folio hero, ledger metadata, numbered entry sheets, and a desktop detail spread with the image beside a field-note column. Implement the identity in the existing global SCSS and protect the new markup boundaries with Node source-contract tests.

**Tech Stack:** Astro 5, Astro Assets, SCSS, Node built-in test runner, PhotoSwipe 5.

---

### Task 1: Lock the Field Logbook markup contract

**Files:**
- Create: `tests/field-logbook.test.mjs`
- Test: `tests/field-logbook.test.mjs`

- [ ] **Step 1: Write the failing contract tests**

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

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

test("the header identifies the field-log edition", () => {
    assert.match(read("src/components/SiteHeader.astro"), /site-brand__edition/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/field-logbook.test.mjs`

Expected: 3 failures because none of the Field Logbook structures exist on `master`.

### Task 2: Build the Field Logbook home page

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/components/Hero.astro`
- Modify: `src/components/PanoramaCard.astro`
- Modify: `src/styles/global.scss`
- Test: `tests/field-logbook.test.mjs`

- [ ] **Step 1: Mark the collection as a logbook gallery**

Use:

```astro
<section class="gallery gallery--logbook shell" data-gallery>
```

- [ ] **Step 2: Create the folio hero**

Split the hero into a large folio title and a ruled ledger. The folio contains `FIELD LOG / VOLUME 01`, the existing panorama title, and the hand-held camera description. The ledger contains exact counts for frames, countries, year span, and equipment, plus a closing ruled line.

- [ ] **Step 3: Restructure panorama cards as journal entries**

Each `article.log-entry` contains:

```astro
<aside class="log-entry__margin">number and date</aside>
<div class="log-entry__sheet">
    <header class="log-entry__head">title, country, coordinates</header>
    <a class="log-entry__frame" data-pswp-src="...">optimized image</a>
    <footer class="log-entry__foot">dimensions, equipment, permalink</footer>
</div>
```

Preserve the current image loading strategy, accessible labels, PhotoSwipe attributes, and permalink.

- [ ] **Step 4: Implement the notebook visual system**

In `global.scss`:

- add a muted terracotta margin-rule token and paper-rule token for both themes;
- use a restrained ruled-paper background only in the hero ledger and entry sheets;
- keep the first image visible in the initial desktop viewport;
- use an `88px / 1fr` journal grid on desktop and a single-column entry on mobile;
- keep panorama images uncropped and borderless;
- use no rounded cards or generic box shadows;
- keep hover/press transitions below `300ms` and preserve reduced-motion behavior.

- [ ] **Step 5: Verify the home contract**

Run: `node --test tests/field-logbook.test.mjs`

Expected: the home test passes while detail and header tests remain RED.

- [ ] **Step 6: Commit the home direction**

```bash
git add tests/field-logbook.test.mjs src/pages/index.astro src/components/Hero.astro src/components/PanoramaCard.astro src/styles/global.scss
git commit -m "feat: introduce field logbook gallery"
```

### Task 3: Build the panorama field-note spread

**Files:**
- Modify: `src/pages/[slug].astro`
- Modify: `src/components/SiteHeader.astro`
- Modify: `src/styles/global.scss`
- Test: `tests/field-logbook.test.mjs`

- [ ] **Step 1: Pass entry position to detail pages**

Add `index: i + 1` and `total: panoramas.length` to `getStaticPaths()` props, the route interface, and the `Astro.props` destructure.

- [ ] **Step 2: Add a compact entry topline**

Directly below the sticky site header, render `post__topline` with the archive back link, `ENTRY 05 / 19`, and the linked month/year. It replaces the existing large top padding and detached back link.

- [ ] **Step 3: Create the detail spread**

Use:

```astro
<div class="post__spread shell-wide">
    <div class="post__media" data-gallery>...</div>
    <aside class="post__field-note">title, place, coordinates, date, dimensions, gear, atlas link</aside>
</div>
```

Keep previous/next navigation below the spread in the normal text shell. At widths below `860px`, stack the field note below the full-width panorama.

- [ ] **Step 4: Identify the edition in the header**

Replace the current count label with:

```astro
<sup class="site-brand__edition">field log · {count}</sup>
```

At mobile widths, keep only `log · {count}` via a dedicated nested label rather than allowing the brand to wrap.

- [ ] **Step 5: Verify GREEN**

Run: `node --test tests/field-logbook.test.mjs`

Expected: 3 tests pass, 0 fail.

- [ ] **Step 6: Commit the detail spread**

```bash
git add src/pages/[slug].astro src/components/SiteHeader.astro src/styles/global.scss tests/field-logbook.test.mjs
git commit -m "feat: add panorama field note spread"
```

### Task 4: Verify and serve the comparison build

**Files:**
- Verify: all modified files

- [ ] **Step 1: Run automated verification**

Run: `node --test tests/field-logbook.test.mjs`

Expected: 3 tests, 3 passes, 0 failures.

Run: `npm run check`

Expected: 0 errors; the existing `WorldMap.astro` TypeScript hint may remain.

Run: `npm run build`

Expected: 22 static pages built successfully.

- [ ] **Step 2: Start on a comparison port**

Run: `npm run dev -- --host 127.0.0.1 --port 4322`

Expected: Field Logbook at `http://127.0.0.1:4322/panoramas`, while Horizon Archive remains on port `4321`.

- [ ] **Step 3: Inspect desktop and mobile**

Verify at desktop and `390 × 844`:

- the first log entry enters the initial home viewport;
- the margin number, title, coordinates, and image never overlap;
- the detail image begins immediately below the topline;
- the desktop field-note column remains readable without shrinking the panorama excessively;
- the mobile spread stacks without horizontal overflow;
- light and dark themes remain legible;
- PhotoSwipe still opens and closes.

- [ ] **Step 4: Inspect repository state**

Run: `git diff master...HEAD --check`

Expected: no whitespace errors.

Run: `git status --short`

Expected: clean worktree after commits.
