# Notebook Cover Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Field Logbook folio hero with a tactile top-bound notebook cover that uses generated material art, live HTML typography, and a real panorama photograph.

**Architecture:** Keep the collection and gallery data flow unchanged. `Hero.astro` derives the latest panorama from its existing sorted collection, layers accessible live content and an Astro-optimized real photograph over a decorative generated cover image, and `global.scss` supplies the responsive physical composition. A Node source-contract test locks the new notebook boundary and prevents the old folio structure from returning.

**Tech Stack:** Astro 5, Astro Assets, SCSS, Node built-in test runner.

---

### Task 1: Lock the notebook hero contract

**Files:**
- Modify: `tests/field-logbook.test.mjs`
- Test: `tests/field-logbook.test.mjs`

- [ ] **Step 1: Replace the old folio assertions with a notebook-cover contract**

```js
import { existsSync, readFileSync } from "node:fs";

test("home uses a physical notebook cover above numbered entries", () => {
    const hero = read("src/components/Hero.astro");

    assert.match(hero, /field-logbook-cover\.png/);
    assert.match(hero, /hero__notebook/);
    assert.match(hero, /hero__photo-strip/);
    assert.match(hero, /coverPanorama = panoramas\.at\(-1\)/);
    assert.doesNotMatch(hero, /hero__folio/);
    assert.ok(existsSync(new URL("../assets/images/field-logbook-cover.png", import.meta.url)));
    assert.match(read("src/components/PanoramaCard.astro"), /log-entry__margin/);
    assert.match(read("src/pages/index.astro"), /gallery--logbook/);
});
```

- [ ] **Step 2: Run the contract and verify RED**

Run: `node --test tests/field-logbook.test.mjs`

Expected: the home subtest fails because `hero__notebook` and the project cover asset do not exist yet; the detail and header subtests remain green.

### Task 2: Build the physical cover component

**Files:**
- Create: `assets/images/field-logbook-cover.png`
- Modify: `src/components/Hero.astro`
- Test: `tests/field-logbook.test.mjs`

- [ ] **Step 1: Copy the selected generated material asset into the project**

```bash
cp /Users/4gray/.codex/generated_images/019f4a90-3dc2-7583-b886-a35c87640b69/exec-28f2810f-8bfd-4395-9e55-aabaf03ac85d.png assets/images/field-logbook-cover.png
```

- [ ] **Step 2: Replace the folio markup with layered notebook markup**

Use `Image` for both raster layers, derive `coverPanorama = panoramas.at(-1)`, and render this structure:

```astro
<section class="hero hero--notebook">
    <div class="shell-wide hero__notebook">
        <Image class="hero__notebook-art" src={coverArt} alt="" widths={[960, 1440, 1920]} sizes="100vw" format="webp" loading="eager" />
        <div class="hero__cover-copy">
            <p class="hero__cover-kicker"><span>field log</span><strong>01</strong><span>{span}</span></p>
            <h1 class="hero__title">panoramas</h1>
            <p class="hero__lede">Travel notes in wide frames — swept slowly by hand on an iPhone X with a DJI Osmo Mobile 3.</p>
        </div>
        <dl class="hero__cover-ledger">
            <div><dt>entries</dt><dd>{total}</dd></div>
            <div><dt>countries</dt><dd>{countries}</dd></div>
            <div><dt>recorded</dt><dd>{span}</dd></div>
            <div><dt>method</dt><dd>hand-held sweep</dd></div>
        </dl>
        <figure class="hero__photo-strip">
            <Image src={coverPanorama.data.image} alt={coverPanorama.data.alt} widths={[480, 960, 1440]} sizes="(max-width: 720px) 82vw, 68vw" format="webp" loading="eager" />
            <figcaption><span>latest field frame</span><strong>{coverPanorama.data.country.replace(/-/g, " ")}</strong><time datetime={coverPanorama.data.date.toISOString()}>{coverDate}</time></figcaption>
        </figure>
    </div>
</section>
```

- [ ] **Step 3: Run the contract and verify GREEN**

Run: `node --test tests/field-logbook.test.mjs`

Expected: 4 tests pass, 0 fail.

### Task 3: Compose the cover responsively and verify it

**Files:**
- Modify: `src/styles/global.scss:213-323`
- Modify: `src/styles/global.scss:502-536`
- Test: `tests/field-logbook.test.mjs`

- [ ] **Step 1: Replace the folio styles with a physical layered composition**

Implement these boundaries:

```scss
.hero--notebook { padding: clamp(28px, 4vw, 54px) 0 clamp(72px, 8vw, 116px); }
.hero__notebook { position: relative; width: min(100%, 1540px); aspect-ratio: 1672 / 941; margin-inline: auto; overflow: hidden; isolation: isolate; }
.hero__notebook-art { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.hero__cover-copy { position: absolute; z-index: 2; top: 18%; left: 9%; width: min(68%, 880px); color: #241d15; }
.hero__cover-kicker { display: flex; align-items: baseline; gap: 16px; font-family: var(--font-mono); text-transform: uppercase; }
.hero__cover-ledger { position: absolute; z-index: 2; top: 20%; right: 9%; width: min(25%, 290px); }
.hero__photo-strip { position: absolute; z-index: 3; left: 12%; right: 14%; bottom: 2%; height: 16%; margin: 0; transform: rotate(-0.35deg); }
```

Use fixed charcoal/kraft/vermillion colors inside the photographed object, restrained text shadows for contrast, a cream border and physical shadow on the real photograph, and a compact caption below the image. At `max-width: 720px`, set the notebook to `aspect-ratio: 4 / 5`, top-center the cover art, reduce the title, stack the cover copy, hide the nonessential method ledger row, and keep the photo strip at the bottom without horizontal overflow.

- [ ] **Step 2: Run automated verification**

Run: `node --test tests/field-logbook.test.mjs`

Expected: 4 tests pass, 0 fail.

Run: `npm run check`

Expected: 0 errors; the pre-existing `WorldMap.astro` TypeScript hint may remain.

Run: `npm run build`

Expected: 22 static pages build successfully.

- [ ] **Step 3: Inspect the live homepage**

At `http://127.0.0.1:4322/panoramas`, verify at desktop and `390 × 844` in light and dark themes:

- the cover reads as one physical notebook rather than a numbered entry;
- all title and metadata text remains live and readable;
- the real latest panorama covers the generated photo strip;
- the spiral remains visible;
- the first numbered entry begins after a clear visual break;
- `document.documentElement.scrollWidth === document.documentElement.clientWidth`.

- [ ] **Step 4: Commit the implementation**

```bash
git add assets/images/field-logbook-cover.png src/components/Hero.astro src/styles/global.scss tests/field-logbook.test.mjs
git commit -m "feat: turn field log hero into notebook cover"
```
