# :art: Travel panoramas

[![Built with Astro](https://astro.badg.es/v2/built-with-astro/tiny.svg)](https://astro.build)

A personal collection of panorama pictures from all the world: https://4gray.github.io/panoramas/

<img src="https://raw.githubusercontent.com/4gray/panoramas/master/assets/images/ghent.jpg" alt="Ghent, Belgium" />

## Tech

Astro 5 · Content Collections · `astro:assets` (sharp) · PhotoSwipe 5 · SCSS · GitHub Actions → GitHub Pages.

Images are optimized at build time into WebP at 480 / 960 / 1440 widths with `<picture>` srcset, lazy loading, blur-up LQIP, and explicit aspect-ratio (zero CLS). Originals are opened in a horizontal pan/zoom lightbox.

## Adding a new panorama

1. Drop the full-resolution JPEG into `assets/images/`.
2. Create `src/content/panoramas/<slug>.md` with this frontmatter:
   ```yaml
   ---
   title: Place name
   country: country-slug
   date: 2024-08-12
   latitude: 0.0
   longitude: 0.0
   image: ../../../assets/images/<filename>.jpg
   alt: Short description
   ---
   ```
   No body needed — the entry is data-only.
3. `npm run dev` to preview. The image is optimized automatically.
4. Commit and push — GitHub Actions builds and deploys.

## Local development

```bash
npm install
npm run dev       # http://localhost:4321/panoramas
npm run build     # build into ./dist
npm run preview   # serve the production build
```

## Deployment

Pushes to `master` trigger `.github/workflows/deploy.yml`, which builds with Node 20 and publishes `dist/` via the official GitHub Pages action.

In repo settings → **Pages**: set source to **GitHub Actions** (not "Deploy from a branch").
