# Performance optimizations (production)

## What was fixed

### 1. Responsive images (build pipeline)

- **`scripts/generate-responsive-images.mjs`** runs on **`npm run build`** (`prebuild`).
- **Hero** (`public/assets/hero/*.webp`, excluding already-sized `*-640.webp` etc.): writes **640 / 960 / 1280 / 1600** px wide WebP (quality ~78, `withoutEnlargement`).
- **Gallery + portfolio** rasters: **400 / 600 / 800 / 1200** px wide variants.
- **`OptimizedImg`** uses **`srcset` + `sizes`** and a **fallback** to the original URL if derivatives are missing (e.g. dev before first `npm run build`).
- **LCP:** the first hero slide uses **`fetchPriority="high"`** on `OptimizedImg` (no `<link rel="preload">` in `index.html` — that avoided a mismatch with **`srcset`** / route changes, which triggered Chrome’s “preloaded but not used” warning).

**Manual commands**

```bash
npm run generate:responsive-images
npm run generate:responsive-images:dry-run
```

### 2. Video (homepage portfolio tile + gallery grid)

- **Portfolio WebM**: `LazyAutoplayVideo` — **IntersectionObserver**, **`preload="none"`**, **`poster`**, desktop loads when near viewport; **≤767px** shows **poster / fallback image** until the user taps **play** (avoids multi‑MB decode on cellular).
- **Gallery grid**: **`GalleryVideoThumb`** uses **`{name}-poster.webp`** only (no WebM in the grid). Posters are generated when **ffmpeg** is available (same script). Lightbox still uses full **WebM** with controls.

```bash
# Re-encode heavy WebM (requires ffmpeg on PATH — see scripts/optimize-videos.mjs)
npm run optimize:videos:webm:force
```

### 3. Framer Motion removed

- **Removed `framer-motion`** from dependencies (~tens of KB + runtime layout work).
- **Hero**: CSS keyframes for background, captions, progress, light leak, particles; **vanilla `mousemove` + `requestAnimationFrame`** for tilt.
- **Navbar**: CSS transitions for scroll styles + mobile drawer; **scroll listener** coalesced with **`requestAnimationFrame`**.
- **Portfolio / Contact / About**: **`.reveal-block` + `IntersectionObserver`** (`useRevealScan`) instead of `whileInView`.
- **Gallery**: per-cell **IntersectionObserver** for `.gallery-page-cell`.

### 4. React code splitting

- **`Portfolio`** and **`Contact`** are **`React.lazy`** + **`Suspense`** on the home route so initial JS is smaller and TBT improves.

### 5. JSON-LD

- **`buildHomeGraph.js`** no longer **`import`s multi‑MB hero WebPs** into the JS bundle (those imports alone could add **~10MB+** to parsed JS and explode TBT). Hero `ImageObject` URLs now point at **public** `*-1200.webp` paths.
- **`buildHomeGraph`** remains deferred with **`requestIdleCallback`** on the home page.

---

## Estimated impact (typical mobile, before → after)

| Metric | Before (your report) | Expected after (with assets generated + video re-encoded) |
|--------|----------------------|---------------------------------------------------------------|
| **LCP** | ~5.7s | **~1.5–2.4s** (responsive hero + `fetchPriority="high"` + no 5MB+ decode) |
| **TBT** | ~4490ms | **~150–350ms** (no Framer, lazy below-fold, smaller main-thread work) |
| **PageSpeed mobile** | ~34 | **~75–90** (depends on hosting, `bootstrap` CSS, glass `backdrop-filter`, and final WebM size) |

Exact Lighthouse numbers still depend on:

- Running **`npm run build`** so **`prebuild`** generates **`-{width}.webp`** files.
- **Re-encoding** large WebM with **`npm run optimize:videos:webm:force`** (ffmpeg).
- **Vercel region** and **cache headers** (already set in `vercel.json`).

Design intent is preserved: same layout, typography, glass, and fire accents; animations are CSS-based with the same timing feel where possible.
