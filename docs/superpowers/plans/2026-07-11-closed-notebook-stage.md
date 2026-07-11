# Closed-notebook Stage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Option A into a seamless floating closed notebook whose live controls and metadata are printed onto the cover and whose built-in panorama hands off through a CSS letterpress bridge.

**Architecture:** Keep `field-logbook-cover.png` unchanged and use the existing Astro hero as the only cover component. First make header suppression, navigation, metadata, and photo removal explicit in markup and tests; then create the sampled-charcoal scene and halftone bridge entirely in SCSS. Preserve the existing global theme script and detail-page header behavior.

**Tech Stack:** Astro 5, SCSS, Node's built-in test runner, existing `ThemeToggle.astro`, no new dependencies or raster assets.

---

## File map

- Modify `src/layouts/Base.astro`: optional homepage-only header suppression.
- Modify `src/pages/index.astro`: request the headerless homepage layout.
- Modify `src/components/Hero.astro`: cover actions, method note, compact label, print bridge, and removal of the dynamic photo strip.
- Modify `src/styles/global.scss`: sampled scene, edge feather, cover controls/label, halftone bridge, responsive states.
- Modify `tests/field-logbook.test.mjs`: markup, styling, header, bridge, and mobile contracts.

### Task 1: Put navigation and metadata onto the cover

**Files:**
- Modify: `tests/field-logbook.test.mjs`
- Modify: `src/layouts/Base.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/components/Hero.astro`
- Modify: `src/styles/global.scss`

- [ ] **Step 1: Write failing header and cover-control tests**

Replace the old physical-cover test with assertions for the original raster and new live controls, then add:

```js
test("the A homepage replaces its global header with cover controls", () => {
    const base = read("src/layouts/Base.astro");
    const home = read("src/pages/index.astro");
    const hero = read("src/components/Hero.astro");

    assert.match(base, /showHeader\?: boolean/);
    assert.match(base, /showHeader = true/);
    assert.match(base, /showHeader && <SiteHeader \/>/);
    assert.match(home, /<Base showHeader={false}>/);
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
    const label = hero.slice(labelStart, labelEnd);

    assert.notEqual(labelStart, -1);
    assert.match(label, /entries/);
    assert.match(label, /countries/);
    assert.match(label, /recorded/);
    assert.doesNotMatch(label, /method/);
    assert.doesNotMatch(hero, /coverPanorama/);
    assert.doesNotMatch(hero, /coverDate/);
    assert.doesNotMatch(hero, /hero__photo-strip/);
});
```

- [ ] **Step 2: Run the source-contract suite to verify RED**

```bash
node --test tests/field-logbook.test.mjs
```

Expected: FAIL because `showHeader`, cover controls, compact label, and method note do not exist and the dynamic photo strip is still present.

- [ ] **Step 3: Make the Base header optional and suppress it only on home**

Change the `Base.astro` props and body to:

```astro
interface Props {
    title?: string;
    description?: string;
    showHeader?: boolean;
}

const { title, description, showHeader = true } = Astro.props;
```

```astro
<body>
    {showHeader && <SiteHeader />}
    <slot />
```

Change the homepage opening tag to:

```astro
<Base showHeader={false}>
```

- [ ] **Step 4: Replace photo and ledger data with cover controls and label**

In `Hero.astro`, import the existing toggle and compute the map URL:

```astro
import ThemeToggle from "./ThemeToggle.astro";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");
const mapUrl = `${base}/map`;
```

Delete `coverPanorama`, `coverDate`, and the complete `hero__photo-strip` figure. Place this method note after the lede:

```astro
<p class="hero__method-note">
    <span>method</span>
    hand-held sweep
</p>
```

Replace the old ledger with:

```astro
<nav class="hero__cover-actions" aria-label="Field log shortcuts">
    <a class="hero__cover-atlas" href={mapUrl}>
        <svg viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <circle cx="14" cy="14" r="10.5" />
            <path d="m17.7 9.8-2.2 5.7-5.7 2.7 2.7-5.7 5.2-2.7Z" />
            <circle cx="14" cy="14" r="1.2" />
        </svg>
        <span>atlas</span>
        <sup>↗</sup>
    </a>
    <ThemeToggle />
</nav>

<dl class="hero__cover-label">
    <div><dt>entries</dt><dd>{total}</dd></div>
    <div><dt>countries</dt><dd>{countries}</dd></div>
    <div><dt>recorded</dt><dd>{span}</dd></div>
</dl>
```

- [ ] **Step 5: Replace ledger/photo styles with cover-native controls**

Remove all `.hero__cover-ledger` and `.hero__photo-strip` selectors. Add:

```scss
.hero__method-note {
    display: flex;
    gap: 9px;
    margin: clamp(12px, 1.4vw, 20px) 0 0;
    color: #4c3a2a;
    font-family: var(--font-mono);
    font-size: clamp(7px, 0.62vw, 9px);
    letter-spacing: 0.13em;
    text-transform: uppercase;
}
.hero__method-note span { opacity: 0.58; }

.hero__cover-actions {
    position: absolute;
    z-index: 4;
    top: 18.2%;
    right: 8.8%;
    display: flex;
    align-items: center;
    gap: clamp(9px, 1vw, 15px);
    color: #3d3023;
    transform: rotate(-1.2deg);
}

.hero__cover-atlas {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 3px 4px;
    border-bottom: 1px solid rgba(61, 48, 35, 0.5);
    font-family: var(--font-display);
    font-size: clamp(14px, 1.25vw, 19px);
    font-style: italic;
    line-height: 1;
}

.hero__cover-atlas svg {
    width: clamp(18px, 1.6vw, 24px);
    height: clamp(18px, 1.6vw, 24px);
    stroke: currentColor;
    stroke-width: 1.25;
}

.hero__cover-actions .theme-toggle {
    width: clamp(30px, 3.1vw, 42px);
    height: clamp(30px, 3.1vw, 42px);
    border-color: rgba(65, 43, 27, 0.42);
    color: #3d2b20;
    background: rgba(180, 71, 37, 0.1);
}

.hero__cover-label {
    position: absolute;
    z-index: 3;
    top: 65.2%;
    left: 7.2%;
    width: min(20.3%, 310px);
    min-height: 9.5%;
    margin: 0;
    padding: clamp(8px, 0.9vw, 13px);
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: center;
    color: #3a2c20;
    font-family: var(--font-mono);
    font-size: clamp(6px, 0.55vw, 8px);
    letter-spacing: 0.09em;
    text-transform: uppercase;
}

.hero__cover-label > div {
    min-width: 0;
    text-align: center;
    border-right: 1px solid rgba(47, 35, 24, 0.26);
}
.hero__cover-label > div:last-child { border-right: 0; }
.hero__cover-label dd { margin: 3px 0 0; font-variant-numeric: tabular-nums; }
```

Add `:focus-visible` outlines to Atlas and the theme button and `translateY(1px)` active feedback. In the existing mobile block, place the action group at the visible upper right and turn the label into a three-column cardboard strip around the current 54% vertical position. Do not add a background image.

- [ ] **Step 6: Run the complete source-contract suite**

```bash
node --test tests/field-logbook.test.mjs
```

Expected: all tests PASS.

- [ ] **Step 7: Commit cover controls**

```bash
git add tests/field-logbook.test.mjs src/layouts/Base.astro src/pages/index.astro src/components/Hero.astro src/styles/global.scss
git commit -m "feat: embed navigation into notebook cover"
```

### Task 2: Blend the notebook into a letterpress stage

**Files:**
- Modify: `tests/field-logbook.test.mjs`
- Modify: `src/components/Hero.astro`
- Modify: `src/styles/global.scss`

- [ ] **Step 1: Write failing scene and bridge tests**

Add:

```js
test("the floating notebook dissolves into a CSS letterpress stage", () => {
    const hero = read("src/components/Hero.astro");
    const styles = read("src/styles/global.scss");

    assert.match(hero, /hero__print-bridge/);
    assert.match(hero, /hero__perforation/);
    assert.match(hero, /field index/);
    assert.match(hero, /plates/);
    assert.match(styles, /--notebook-stage:\s*#171817/);
    assert.match(styles, /\.hero__print-bridge[\s\S]*?radial-gradient/);
    assert.match(styles, /\.hero__perforation/);
    assert.match(styles, /\.gallery--logbook \.log-entry:first-of-type[\s\S]*?border-top:\s*0/);
    assert.doesNotMatch(hero, /(?:desk|stage|pattern|texture)-[^"']+\.(?:png|jpe?g|webp)/);
});

test("the mobile notebook label and print bridge stay compact", () => {
    const styles = read("src/styles/global.scss");

    assert.match(
        styles,
        /@media \(max-width: 720px\)[\s\S]*?\.hero__cover-label[\s\S]*?grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/
    );
    assert.match(
        styles,
        /@media \(max-width: 720px\)[\s\S]*?\.hero__print-bridge\s*\{[\s\S]*?height:\s*64px/
    );
});
```

- [ ] **Step 2: Run the suite to verify RED**

```bash
node --test tests/field-logbook.test.mjs
```

Expected: FAIL because the print bridge markup, sampled stage, halftone background, and homepage border override do not exist.

- [ ] **Step 3: Add the dynamic print bridge**

After `.hero__notebook` and before the section closes, add:

```astro
<div class="hero__print-bridge" aria-hidden="true">
    <div class="hero__perforation">
        <span>field index</span>
        <span>{String(total).padStart(2, "0")} plates</span>
    </div>
</div>
```

- [ ] **Step 4: Create the sampled scene and feather the raster edge**

Replace the old hero section spacing with:

```scss
.hero--notebook {
    --notebook-stage: #171817;
    padding: clamp(18px, 2.6vw, 38px) 0 0;
    background: var(--notebook-stage);
}

.hero__notebook::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 1;
    box-shadow: inset 0 0 clamp(20px, 2.2vw, 32px) var(--notebook-stage);
    pointer-events: none;
}
```

Keep live content at z-index 2 or higher so the feather affects only the raster matte.

- [ ] **Step 5: Add the halftone bridge and sole catalog boundary**

Add:

```scss
.hero__print-bridge {
    position: relative;
    height: clamp(74px, 7vw, 108px);
    margin-top: -1px;
    overflow: hidden;
    background:
        radial-gradient(circle at 1px 1px, rgba(210, 154, 102, 0.14) 0 0.8px, transparent 0.9px) 0 0 / 8px 8px,
        linear-gradient(180deg, var(--notebook-stage) 0%, color-mix(in srgb, var(--bg) 78%, #231a13) 58%, var(--bg) 100%);
}

.hero__print-bridge::before,
.hero__print-bridge::after {
    content: "";
    position: absolute;
    width: 22px;
    height: 22px;
    opacity: 0.28;
    background:
        linear-gradient(var(--accent), var(--accent)) center / 1px 100% no-repeat,
        linear-gradient(90deg, var(--accent), var(--accent)) center / 100% 1px no-repeat;
}
.hero__print-bridge::before { top: 12px; left: var(--gutter); }
.hero__print-bridge::after { right: var(--gutter); bottom: 12px; }

.hero__perforation {
    position: absolute;
    right: var(--gutter);
    bottom: clamp(10px, 1.2vw, 17px);
    left: var(--gutter);
    display: flex;
    justify-content: space-between;
    padding-top: 8px;
    color: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 7px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
}

.hero__perforation::before {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    height: 1px;
    background: repeating-linear-gradient(90deg, color-mix(in srgb, var(--ink) 32%, transparent) 0 5px, transparent 5px 11px);
}

.gallery--logbook .log-entry:first-of-type {
    border-top: 0;
    padding-top: clamp(28px, 4vw, 48px);
}
```

In the max-width 720px block, set `.hero__print-bridge { height: 64px; }` and use 20px side insets for the perforation and registration marks. Add reduced-motion rules that remove control transforms and transitions without changing layout.

- [ ] **Step 6: Run static verification**

```bash
node --test tests/field-logbook.test.mjs
npm run check
npm run build
git diff --check
```

Expected: all tests pass, Astro reports zero errors, 22 static pages build, and the whitespace check prints nothing.

- [ ] **Step 7: Commit the letterpress stage**

```bash
git add tests/field-logbook.test.mjs src/components/Hero.astro src/styles/global.scss
git commit -m "feat: add seamless notebook stage"
```

### Task 3: Start Option A and verify the A/B comparison

**Files:**
- Modify only if a visual defect is reproduced test-first: `tests/field-logbook.test.mjs`, `src/styles/global.scss`

- [ ] **Step 1: Start the Option A development server**

```bash
npm run dev -- --host 127.0.0.1 --port 4322
```

Expected: Astro serves `http://127.0.0.1:4322/panoramas` and remains running.

- [ ] **Step 2: Verify desktop and intermediate widths**

Inspect 1440×900, 1024×900, 768×900, and 721×900. Confirm the asset rectangle is not visible, the floating notebook retains margins, Atlas/theme align with the upper-right printed mark, metadata fits the lower label, the built-in panorama is unobstructed, and the perforated bridge is the only boundary before entry 01.

- [ ] **Step 3: Verify mobile and interaction states**

Inspect 720×900, 430×844, 390×844, and 320×844. Confirm the compact label, actions, original panorama, and bridge do not overlap and `document.documentElement.scrollWidth === window.innerWidth`. Toggle both themes, verify the Atlas href, keyboard focus, and an empty browser error log.

- [ ] **Step 4: Verify a detail page and Option B isolation**

Open `http://127.0.0.1:4322/panoramas/nuernberg.html`; confirm one normal header and one header theme toggle remain. Confirm `http://127.0.0.1:4323/panoramas` still serves the independent Option B branch.

- [ ] **Step 5: Correct any reproduced defect test-first**

For a structural or overflow issue, add a focused source-contract assertion, observe RED, apply the smallest SCSS correction, and rerun the contract suite. Do not edit either generated folio asset.

- [ ] **Step 6: Run fresh final verification**

```bash
node --test tests/field-logbook.test.mjs
npm run check
npm run build
git diff --check
git status --short --branch
curl -I --max-time 5 http://127.0.0.1:4322/panoramas
curl -I --max-time 5 http://127.0.0.1:4323/panoramas
```

Expected: all tests and build steps pass, both comparison servers return HTTP 200, and the Option A worktree is clean.
