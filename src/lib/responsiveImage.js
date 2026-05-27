/** Widths emitted by `scripts/generate-responsive-images.mjs` */
export const HERO_IMG_WIDTHS = [640, 960, 1280, 1600];
export const RASTER_IMG_WIDTHS = [400, 600, 800, 1200];

/**
 * @param {string} stem - absolute-style public path without extension, e.g. `/assets/hero/56`
 * @param {number[]} widths
 */
export function webpSrcSetFromStem(stem, widths) {
  return widths.map((w) => `${stem}-${w}.webp ${w}w`).join(', ');
}

/**
 * @param {string} publicWebpPath - e.g. `/gallery/wedding/foo.webp`
 * @returns {string} stem without .webp
 */
export function stemFromPublicWebp(publicWebpPath) {
  return publicWebpPath.replace(/\.webp$/i, '');
}

/**
 * @param {string} publicWebmPath
 */
export function posterPathFromWebm(publicWebmPath) {
  return publicWebmPath.replace(/\.webm$/i, '-poster.webp');
}
