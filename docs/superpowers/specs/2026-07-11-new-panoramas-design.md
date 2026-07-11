# New panoramas integration design

## Goal

Add every one of the 25 HEIC panoramas from `/Users/4gray/Downloads/panoramas new/` to the Astro site. Each panorama must have a fast web version, a separately accessible full-resolution version, an accurate title derived from its mapped location, and a correctly positioned marker in Atlas.

## Source inventory

- Treat all 25 HEIC files as intentional inputs; do not silently discard visually similar captures.
- Preserve the capture date and GPS coordinates stored in EXIF.
- Convert source files into browser-compatible assets without committing the HEIC originals.
- Use stable, descriptive filenames and content slugs based on the identified place. Add a distinguishing landmark or viewpoint suffix when several panoramas are from the same area.

## Image delivery

Each new panorama has two prepared WebP assets:

1. A display source capped at 2400 px wide. Astro uses this source to produce responsive 480, 960, 1440, and 1920 px variants for gallery and detail pages.
2. A full-resolution WebP at the source pixel dimensions with high visual quality. It is exposed through a `full resolution` link and is never loaded automatically by the gallery, detail view, or lightbox.

The lightbox continues to use the display-sized image so opening a panorama remains responsive. Existing panorama entries keep working without a mandatory full-resolution field.

## Content and location data

- Extend the panorama content schema with an optional path or URL for the full-resolution asset.
- Create one Markdown content entry per source image with title, country, capture date, latitude, longitude, display image, full-resolution image, and descriptive alt text.
- Read coordinates and dates directly from EXIF. Resolve coordinates to a locality and landmark using map/geocoding data, then visually check the panorama against the proposed location.
- Titles should be concise English place names consistent with the existing collection. Nearby captures must receive distinct titles when a landmark or viewpoint can distinguish them.
- Preserve coordinate precision sufficient to place markers at the recorded capture point rather than a city centroid.

## UI behavior

- Gallery cards keep their existing responsive image behavior.
- Detail pages and PhotoSwipe keep using the compressed display asset.
- When an entry has a full-resolution asset, its detail page shows a clear `full resolution` link near the dimensions metadata. The link opens the full asset in a new browser tab and identifies the original pixel dimensions.
- Atlas automatically includes all 25 new entries through the content collection. Marker coordinates, labels, image thumbnails, and links must resolve to the matching panorama entry.

## Failure handling

- Image conversion must fail loudly if a source cannot be decoded.
- Content generation must reject a panorama lacking a capture date or valid GPS coordinates.
- Slugs and output filenames must be unique even for panoramas captured at nearly identical coordinates.
- Build-time schema validation and an inventory check must catch missing display files, missing full-resolution files, and a count other than 25 new entries.

## Verification

- Confirm the source inventory contains exactly 25 HEIC files and the implementation contains exactly 25 matching content entries, display assets, and full-resolution assets.
- Confirm every new entry retains its EXIF date and signed latitude/longitude.
- Run Astro type/content checks and a production build.
- Inspect the rendered gallery and detail pages at desktop and mobile widths.
- Verify every new detail page opens its compressed lightbox and its full-resolution link.
- Verify Atlas exposes all 25 new markers at their stored coordinates, with the correct titles and working detail-page links.
- Confirm no HEIC files or unrelated changes are committed.
