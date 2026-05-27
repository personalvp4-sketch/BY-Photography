/**
 * Production WebP ladders (Sharp). Run automatically before `vite build` via `prebuild`.
 *
 * Writes alongside each source *.webp:
 *   Hero (public/assets/hero):        -640, -960, -1280, -1600 px width max
 *   Gallery + portfolio raster:       -400, -600, -800, -1200 px width max
 *
 * Skips inputs already named like `name-640.webp` (derivatives) and `*-poster.webp`.
 * For portfolio *.webm, optionally extracts `*-poster.webp` when ffmpeg is on PATH.
 *
 * Usage:
 *   node scripts/generate-responsive-images.mjs
 *   node scripts/generate-responsive-images.mjs --dry-run
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileP = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');

const dryRun = process.argv.includes('--dry-run');

/** Hero carousel — max 1600px wide */
const HERO_WIDTHS = [640, 960, 1280, 1600];
/** Gallery grid + portfolio stills — max 1200px wide; thumbs use smaller descriptors */
const RASTER_WIDTHS = [400, 600, 800, 1200];

const DERIVED_WEBP_RE = /-\d{3,4}\.webp$/i;

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function isDerivativeWebp(filename) {
  return DERIVED_WEBP_RE.test(filename);
}

function isPosterWebp(filename) {
  return /-poster\.webp$/i.test(filename);
}

async function writeWebpResize(inputPath, outPath, width, quality) {
  if (dryRun) {
    console.log('[dry-run] would write', outPath, width);
    return;
  }
  await sharp(inputPath)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: 5 })
    .toFile(outPath);
}

async function processRasterFile(absPath, widths) {
  const dir = path.dirname(absPath);
  const filename = path.basename(absPath);
  if (!filename.toLowerCase().endsWith('.webp')) return;
  if (isDerivativeWebp(filename) || isPosterWebp(filename)) return;

  const stem = path.basename(absPath, '.webp');
  for (const w of widths) {
    const outPath = path.join(dir, `${stem}-${w}.webp`);
    await writeWebpResize(absPath, outPath, w, 78);
    if (!dryRun) console.log('ok', path.relative(root, outPath));
  }
}

async function collectWebpsUnder(dir, out) {
  if (!(await exists(dir))) return;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await collectWebpsUnder(full, out);
    else if (e.isFile() && e.name.toLowerCase().endsWith('.webp')) out.push(full);
  }
}

async function tryFfmpegPosters(portfolioDir) {
  if (!(await exists(portfolioDir))) return;
  try {
    await execFileP('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-version'], { stdio: 'ignore' });
  } catch {
    console.warn('[generate-responsive-images] ffmpeg not found — skip WebM → poster.webp');
    return;
  }

  const files = await fs.readdir(portfolioDir);
  for (const f of files) {
    if (!/\.webm$/i.test(f)) continue;
    const stem = f.replace(/\.webm$/i, '');
    const posterPath = path.join(portfolioDir, `${stem}-poster.webp`);
    if (await exists(posterPath)) continue;

    const videoPath = path.join(portfolioDir, f);
    const tmpPng = path.join(portfolioDir, `.tmp-frame-${stem.replace(/\s+/g, '_')}.png`);
    if (dryRun) {
      console.log('[dry-run] poster', posterPath);
      continue;
    }
    try {
      await execFileP(
        'ffmpeg',
        [
          '-hide_banner',
          '-loglevel',
          'error',
          '-y',
          '-ss',
          '0.35',
          '-i',
          videoPath,
          '-vframes',
          '1',
          tmpPng,
        ],
        { stdio: 'ignore' }
      );
      await sharp(tmpPng)
        .resize({ width: 960, withoutEnlargement: true })
        .webp({ quality: 78, effort: 5 })
        .toFile(posterPath);
      await fs.unlink(tmpPng).catch(() => {});
      console.log('poster', path.relative(root, posterPath));
    } catch (err) {
      console.warn('[generate-responsive-images] poster failed', f, err.message);
      await fs.unlink(tmpPng).catch(() => {});
    }
  }
}

async function main() {
  const heroDir = path.join(publicDir, 'assets', 'hero');
  const portfolioDir = path.join(publicDir, 'portfolio');
  const galleryRoot = path.join(publicDir, 'gallery');

  const heroFiles = [];
  await collectWebpsUnder(heroDir, heroFiles);

  const portfolioFiles = [];
  await collectWebpsUnder(portfolioDir, portfolioFiles);

  const galleryFiles = [];
  await collectWebpsUnder(galleryRoot, galleryFiles);

  for (const f of heroFiles) {
    await processRasterFile(f, HERO_WIDTHS);
  }
  for (const f of [...portfolioFiles, ...galleryFiles]) {
    await processRasterFile(f, RASTER_WIDTHS);
  }

  await tryFfmpegPosters(portfolioDir);

  console.log(
    dryRun
      ? '[generate-responsive-images] dry-run complete'
      : '[generate-responsive-images] done'
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
