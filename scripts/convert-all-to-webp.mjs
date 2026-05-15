/**
 * Full-project raster → WebP migration.
 *
 * Usage:
 *   node scripts/convert-all-to-webp.mjs           # convert + patch refs + remove sources (after backup)
 *   node scripts/convert-all-to-webp.mjs --dry-run # plan only, no writes
 *
 * Checkpoint: copies every source raster into webp-migration-backup/<timestamp>/...
 *
 * Revert (Git): this repo uses tag `pre-webp-conversion` on the commit before migration, e.g.
 *   git reset --hard pre-webp-conversion
 * Or restore binaries only from `webp-migration-backup/<timestamp>/`.
 *
 * Skips: node_modules, dist, build, coverage, webp-migration-backup, .git
 * Skips files already ending in .webp and all .svg
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const dryRun = process.argv.includes('--dry-run');
const QUALITY = 83;
const MAX_EDGE_DEFAULT = 2400;
const MAX_EDGE_HERO_DIR = 1920;

const RASTER_RE = /\.(png|jpe?g)$/i;

const IGNORE_PATH_PARTS = [
  'node_modules',
  'dist',
  'build',
  'coverage',
  'webp-migration-backup',
  '.git',
];

const TEXT_EXT = new Set([
  '.html',
  '.htm',
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.vue',
  '.svelte',
  '.json',
  '.md',
  '.mdx',
]);

const SKIP_TEXT_NAMES = new Set(['package-lock.json', 'webp-conversion-report.json']);

function norm(p) {
  return p.replace(/\\/g, '/');
}

function isIgnored(absPath) {
  const n = norm(absPath);
  return IGNORE_PATH_PARTS.some((part) => n.includes(`/${part}/`) || n.endsWith(`/${part}`));
}

async function walkFiles(dir) {
  const out = [];
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (IGNORE_PATH_PARTS.includes(ent.name)) continue;
      out.push(...(await walkFiles(full)));
    } else {
      out.push(full);
    }
  }
  return out;
}

async function statSafe(p) {
  try {
    return await fs.stat(p);
  } catch {
    return null;
  }
}

function relToRoot(abs) {
  return norm(path.relative(root, abs));
}

function webpPathFor(absRaster) {
  const dir = path.dirname(absRaster);
  const base = path.basename(absRaster);
  const without = base.replace(RASTER_RE, '');
  return path.join(dir, `${without}.webp`);
}

function maxEdgeFor(absRaster) {
  const r = relToRoot(absRaster).toLowerCase();
  if (r.includes('/hero/') || r.endsWith('/hero')) return MAX_EDGE_HERO_DIR;
  return MAX_EDGE_DEFAULT;
}

async function copyToBackup(absRaster, backupRoot) {
  const rel = relToRoot(absRaster);
  const dest = path.join(backupRoot, ...rel.split('/'));
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(absRaster, dest);
}

async function convertOne(absRaster, backupRoot, dry) {
  const outAbs = webpPathFor(absRaster);
  const rel = relToRoot(absRaster);
  const before = (await statSafe(absRaster))?.size ?? 0;

  if (dry) {
    return {
      from: rel,
      to: relToRoot(outAbs),
      bytesBefore: before,
      bytesAfter: 0,
      hasAlpha: null,
    };
  }

  const meta = await sharp(absRaster, { failOn: 'none' }).metadata();
  const hasAlpha = !!meta.hasAlpha;

  const maxE = maxEdgeFor(absRaster);
  let pipeline = sharp(absRaster, { failOn: 'none' }).rotate();
  if (meta.width > maxE || meta.height > maxE) {
    pipeline = pipeline.resize({
      width: maxE,
      height: maxE,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }
  const opts = {
    quality: QUALITY,
    effort: 5,
    smartSubsample: true,
  };
  if (hasAlpha) opts.alphaQuality = 100;

  await copyToBackup(absRaster, backupRoot);
  await pipeline.webp(opts).toFile(outAbs);
  await fs.unlink(absRaster);

  const after = (await statSafe(outAbs))?.size ?? 0;
  return {
    from: rel,
    to: relToRoot(outAbs),
    bytesBefore: before,
    bytesAfter: after,
    hasAlpha,
  };
}

function buildReplacePairs(converted) {
  /** @type {{from: string, to: string}[]} */
  const pairs = [];
  for (const { from, to } of converted) {
    const a = from;
    const b = to;
    pairs.push({ from: a, to: b });
    pairs.push({ from: a.replace(/\//g, '\\'), to: b.replace(/\//g, '\\') });
    if (a.startsWith('src/')) {
      pairs.push({ from: a.slice(4), to: b.slice(4) });
      pairs.push({ from: a.slice(4).replace(/\//g, '\\'), to: b.slice(4).replace(/\//g, '\\') });
    }
  }
  const seen = new Set();
  const uniq = [];
  for (const p of pairs) {
    const k = `${p.from}→${p.to}`;
    if (seen.has(k)) continue;
    seen.add(k);
    uniq.push(p);
  }
  uniq.sort((x, y) => y.from.length - x.from.length);
  return uniq;
}

async function collectTextFiles() {
  const files = await walkFiles(root);
  return files.filter((f) => {
    const base = path.basename(f);
    if (SKIP_TEXT_NAMES.has(base)) return false;
    if (isIgnored(f)) return false;
    return TEXT_EXT.has(path.extname(f).toLowerCase());
  });
}

function patchContent(content, pairs, stats) {
  let next = content;
  for (const { from, to } of pairs) {
    if (!next.includes(from)) continue;
    const parts = next.split(from);
    stats.refReplacements += parts.length - 1;
    next = parts.join(to);
  }
  return next;
}

async function collectStrayRasterRefs(textFiles) {
  const re = /\.(png|jpg|jpeg)(?=["'`)\s?#]|$)/gi;
  const hits = [];
  for (const tf of textFiles) {
    const rel = relToRoot(tf);
    if (rel.startsWith('scripts/')) continue;
    const raw = await fs.readFile(tf, 'utf8');
    const m = raw.match(re);
    if (m && m.length) {
      const uniq = [...new Set(m.map((x) => x.toLowerCase()))];
      hits.push({ file: rel, samples: uniq.slice(0, 12) });
    }
  }
  return hits;
}

async function main() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupRoot = path.join(root, 'webp-migration-backup', stamp);

  const allFiles = await walkFiles(root);
  const rasters = allFiles.filter((f) => {
    if (isIgnored(f)) return false;
    if (!RASTER_RE.test(f)) return false;
    if (/\.webp$/i.test(f)) return false;
    return true;
  });

  const report = {
    timestamp: stamp,
    dryRun,
    backupDirectory: norm(path.relative(root, backupRoot)),
    converted: [],
    planned: [],
    skipped: [],
    failed: [],
    totals: { files: 0, bytesBefore: 0, bytesAfter: 0 },
    refReplacements: 0,
    textFilesTouched: [],
    possibleRemainingRasterRefs: [],
  };

  console.log(`Project root: ${root}`);
  console.log(`Dry run: ${dryRun}`);
  console.log(`Raster candidates: ${rasters.length}`);

  if (dryRun) {
    for (const abs of rasters) {
      const rel = relToRoot(abs);
      const st = (await statSafe(abs))?.size ?? 0;
      report.planned.push({ from: rel, to: relToRoot(webpPathFor(abs)), bytesBefore: st });
      report.totals.bytesBefore += st;
    }
    report.summary = {
      mode: 'dry-run',
      plannedFiles: report.planned.length,
      approximateMbBefore: +(report.totals.bytesBefore / 1e6).toFixed(2),
    };
    const textFiles = await collectTextFiles();
    report.possibleRemainingRasterRefs = await collectStrayRasterRefs(textFiles);
    const reportPath = path.join(root, 'webp-conversion-report.dry-run.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log('\n--- Summary (dry run) ---');
    console.log(JSON.stringify(report.summary, null, 2));
    console.log(`\nReport: ${reportPath}`);
    return;
  }

  await fs.mkdir(backupRoot, { recursive: true });
  await fs.writeFile(
    path.join(backupRoot, 'README.txt'),
    `Backup of original PNG/JPG/JPEG files before WebP migration.\nCreated: ${stamp}\nRestore: copy files back to paths mirroring folder structure.\n`,
    'utf8',
  );

  for (const abs of rasters) {
    const rel = relToRoot(abs);
    const outAbs = webpPathFor(abs);
    try {
      if ((await statSafe(outAbs)) && !(await statSafe(abs))) {
        report.skipped.push({ file: rel, reason: 'webp exists, source already removed' });
        continue;
      }
      const row = await convertOne(abs, backupRoot, false);
      report.converted.push(row);
      report.totals.files += 1;
      report.totals.bytesBefore += row.bytesBefore;
      report.totals.bytesAfter += row.bytesAfter;
      console.log(`✓ ${rel}  →  ${row.to}  (${(row.bytesBefore / 1e6).toFixed(2)} MB → ${(row.bytesAfter / 1e6).toFixed(2)} MB)`);
    } catch (e) {
      report.failed.push({ file: rel, error: String(e?.message || e) });
      console.error(`✗ ${rel}: ${e}`);
    }
  }

  const pairs = buildReplacePairs(report.converted);
  const textFiles = await collectTextFiles();
  let refCount = 0;
  const touched = [];

  for (const tf of textFiles) {
    let raw = await fs.readFile(tf, 'utf8');
    const before = raw;
    const localStats = { refReplacements: 0 };
    raw = patchContent(raw, pairs, localStats);
    if (raw !== before) {
      touched.push(relToRoot(tf));
      refCount += localStats.refReplacements;
      await fs.writeFile(tf, raw, 'utf8');
    }
  }
  report.refReplacements = refCount;
  report.textFilesTouched = touched;

  const pct =
    report.totals.bytesBefore > 0
      ? ((1 - report.totals.bytesAfter / report.totals.bytesBefore) * 100).toFixed(1)
      : '0';

  report.summary = {
    mode: 'full',
    convertedCount: report.converted.length,
    skippedCount: report.skipped.length,
    failedCount: report.failed.length,
    mbBefore: +(report.totals.bytesBefore / 1e6).toFixed(2),
    mbAfter: +(report.totals.bytesAfter / 1e6).toFixed(2),
    approximateReductionPercent: +pct,
    referencePatches: refCount,
    textFilesModified: touched.length,
  };

  report.possibleRemainingRasterRefs = await collectStrayRasterRefs(await collectTextFiles());

  const reportPath = path.join(root, 'webp-conversion-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('\n--- Summary ---');
  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`\nReport written to ${reportPath}`);
  console.log(`Backup: ${backupRoot}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
