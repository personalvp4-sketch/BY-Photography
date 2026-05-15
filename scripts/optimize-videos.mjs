/**
 * Hero-focused web video pipeline: H.264 + VP9 (or VP9-only with --webm-only); originals preserved.
 *
 * Desktop (hero): max width 1920, premium CRF + veryslow/film tune, smooth GOP + faststart.
 * Mobile ladder: if SOURCE file > threshold (default 8MB), also writes *.mobile.web.mp4 + *.mobile.webm
 *   capped at 768px wide, smaller CRF targets for data savings on cellular.
 *
 * Requires FFmpeg + FFprobe on PATH: https://ffmpeg.org/download.html
 *
 * Usage:
 *   node scripts/optimize-videos.mjs
 *   node scripts/optimize-videos.mjs --dry-run
 *   node scripts/optimize-videos.mjs --no-patch
 *   node scripts/optimize-videos.mjs --force
 *   npm run optimize:videos:force                       # same as --force
 *   node scripts/optimize-videos.mjs --no-hero          # faster encodes, no film tune (non-hero bulk)
 *   node scripts/optimize-videos.mjs --webm-only        # VP9 WebM only (no H.264); patch → .webm
 *   node scripts/optimize-videos.mjs --mobile-threshold-mb=12
 *   node scripts/optimize-videos.mjs --hero-max-width=1920 --mobile-max-width=768
 *
 * Outputs (next to each source, originals never deleted):
 *   Default: <name>.web.mp4 + <name>.webm (+ mobile *.mobile.* when source > threshold)
 *   --webm-only: <name>.webm (+ <name>.mobile.webm when over threshold); no MP4 outputs
 *
 * Manifest: scripts/video-optimization-manifest.json
 *
 * FFmpeg progress (frame / fps / speed) streams to the terminal during each encode.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile, spawn } from 'child_process';
import { promisify } from 'util';

const execFileP = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const VIDEO_EXT = /\.(mp4|mov|avi|mkv)$/i;
/** Skip derived desktop + mobile MP4 encodes */
const SKIP_SOURCE_RE = /\.web\.mp4$/i;

const IGNORE_PATH_PARTS = [
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
  'webp-migration-backup',
  'video-optimization-backup',
];

const TEXT_EXT = new Set([
  '.html',
  '.htm',
  '.css',
  '.scss',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.vue',
  '.svelte',
  '.md',
  '.mdx',
]);

const SKIP_TEXT_NAMES = new Set(['package-lock.json', 'video-optimization-manifest.json']);

const dryRun = process.argv.includes('--dry-run');
const noPatch = process.argv.includes('--no-patch');
const force = process.argv.includes('--force');
const noHero = process.argv.includes('--no-hero');
const heroMode = !noHero;
const webmOnly = process.argv.includes('--webm-only');

function parseNumArg(prefix, fallback) {
  const raw = process.argv.find((a) => a.startsWith(`${prefix}=`));
  if (!raw) return fallback;
  const v = Number(raw.slice(prefix.length + 1));
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

const heroMaxWidth = Math.round(parseNumArg('--hero-max-width', 1920));
const mobileMaxWidth = Math.round(parseNumArg('--mobile-max-width', 768));
const mobileThresholdMb = parseNumArg('--mobile-threshold-mb', 8);
const mobileThresholdBytes = mobileThresholdMb * 1024 * 1024;

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
    const abs = path.join(dir, ent.name);
    if (isIgnored(abs)) continue;
    if (ent.isDirectory()) {
      out.push(...(await walkFiles(abs)));
    } else if (ent.isFile() && VIDEO_EXT.test(ent.name) && !SKIP_SOURCE_RE.test(ent.name)) {
      out.push(abs);
    }
  }
  return out;
}

async function walkTextFiles(dir) {
  const out = [];
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    const abs = path.join(dir, ent.name);
    if (isIgnored(abs)) continue;
    if (ent.isDirectory()) {
      out.push(...(await walkTextFiles(abs)));
    } else if (ent.isFile()) {
      const ext = path.extname(ent.name).toLowerCase();
      if (TEXT_EXT.has(ext) && !SKIP_TEXT_NAMES.has(ent.name)) {
        out.push(abs);
      }
    }
  }
  return out;
}

async function checkFfmpeg() {
  try {
    await execFileP('ffmpeg', ['-version'], { windowsHide: true });
    await execFileP('ffprobe', ['-version'], { windowsHide: true });
    return true;
  } catch {
    return false;
  }
}

async function hasAudioStream(input) {
  try {
    const { stdout } = await execFileP(
      'ffprobe',
      [
        '-v',
        'error',
        '-select_streams',
        'a:0',
        '-show_entries',
        'stream=index',
        '-of',
        'csv=p=0',
        input,
      ],
      { windowsHide: true },
    );
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function relFromRoot(abs) {
  return norm(path.relative(root, abs));
}

/**
 * H.264 MP4 — hero: film tune + veryslow + tight GOP for scrubbing; mobile: smaller frame + higher CRF.
 */
function buildMp4Args(input, output, withAudio, o) {
  const {
    maxWidth,
    crf,
    preset,
    tune,
    gop,
    aacKbps,
  } = o;
  const vf = `scale='min(${maxWidth},iw)':-2:flags=lanczos`;
  const args = [
    '-y',
    '-hide_banner',
    '-loglevel',
    'warning',
    '-i',
    input,
    '-map',
    '0:v:0',
    ...(withAudio ? ['-map', '0:a:0'] : []),
    '-c:v',
    'libx264',
    '-profile:v',
    'high',
    '-pix_fmt',
    'yuv420p',
    '-crf',
    String(crf),
    '-preset',
    preset,
  ];
  if (tune) {
    args.push('-tune', tune);
  }
  args.push(
    '-g',
    String(gop),
    '-keyint_min',
    String(Math.max(1, Math.floor(gop / 2))),
    '-sc_threshold',
    '0',
    '-movflags',
    '+faststart',
    '-vf',
    vf,
  );
  if (withAudio) {
    args.push('-c:a', 'aac', '-b:a', `${aacKbps}k`, '-ar', '48000');
  } else {
    args.push('-an');
  }
  args.push(output);
  return args;
}

/**
 * VP9 WebM — good deadline + low cpu-used for hero quality/bit; higher crf + cpu-used on mobile.
 */
function buildWebmArgs(input, output, withAudio, o) {
  const { maxWidth, crf, cpuUsed, opusKbps } = o;
  const vf = `scale='min(${maxWidth},iw)':-2:flags=lanczos`;
  const args = [
    '-y',
    '-hide_banner',
    '-loglevel',
    'warning',
    '-i',
    input,
    '-map',
    '0:v:0',
    ...(withAudio ? ['-map', '0:a:0'] : []),
    '-c:v',
    'libvpx-vp9',
    '-crf',
    String(crf),
    '-b:v',
    '0',
    '-deadline',
    'good',
    '-cpu-used',
    String(cpuUsed),
    '-row-mt',
    '1',
    '-threads',
    '0',
    '-vf',
    vf,
  ];
  if (withAudio) {
    args.push('-c:a', 'libopus', '-b:a', `${opusKbps}k`);
  } else {
    args.push('-an');
  }
  args.push(output);
  return args;
}

function desktopEncodeOpts() {
  if (heroMode) {
    return {
      maxWidth: heroMaxWidth,
      crf: 23,
      preset: 'veryslow',
      tune: 'film',
      gop: 48,
      aacKbps: 112,
      vp9Crf: 31,
      vp9CpuUsed: 1,
      opusKbps: 88,
    };
  }
  return {
    maxWidth: heroMaxWidth,
    crf: 24,
    preset: 'slower',
    tune: null,
    gop: 72,
    aacKbps: 112,
    vp9Crf: 32,
    vp9CpuUsed: 2,
    opusKbps: 88,
  };
}

function mobileEncodeOpts() {
  return {
    maxWidth: mobileMaxWidth,
    crf: 26,
    preset: 'slow',
    tune: null,
    gop: 48,
    aacKbps: 80,
    vp9Crf: 35,
    vp9CpuUsed: 2,
    opusKbps: 64,
  };
}

/** Stream FFmpeg stderr/stdout to this terminal so frame= / fps= / speed= update live. */
function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('ffmpeg', args, {
      stdio: ['ignore', 'inherit', 'inherit'],
      windowsHide: true,
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });
}

async function encodeDesktopPair(inputAbs, outMp4, outWebm, withAudio) {
  const o = desktopEncodeOpts();
  await runFfmpeg(buildMp4Args(inputAbs, outMp4, withAudio, o));
  await runFfmpeg(
    buildWebmArgs(inputAbs, outWebm, withAudio, {
      maxWidth: o.maxWidth,
      crf: o.vp9Crf,
      cpuUsed: o.vp9CpuUsed,
      opusKbps: o.opusKbps,
    }),
  );
}

async function encodeMobilePair(inputAbs, outMp4, outWebm, withAudio) {
  const o = mobileEncodeOpts();
  await runFfmpeg(buildMp4Args(inputAbs, outMp4, withAudio, o));
  await runFfmpeg(
    buildWebmArgs(inputAbs, outWebm, withAudio, {
      maxWidth: o.maxWidth,
      crf: o.vp9Crf,
      cpuUsed: o.vp9CpuUsed,
      opusKbps: o.opusKbps,
    }),
  );
}

async function encodeDesktopWebmOnly(inputAbs, outWebm, withAudio) {
  const o = desktopEncodeOpts();
  await runFfmpeg(
    buildWebmArgs(inputAbs, outWebm, withAudio, {
      maxWidth: o.maxWidth,
      crf: o.vp9Crf,
      cpuUsed: o.vp9CpuUsed,
      opusKbps: o.opusKbps,
    }),
  );
}

async function encodeMobileWebmOnly(inputAbs, outMobileWebm, withAudio) {
  const o = mobileEncodeOpts();
  await runFfmpeg(
    buildWebmArgs(inputAbs, outMobileWebm, withAudio, {
      maxWidth: o.maxWidth,
      crf: o.vp9Crf,
      cpuUsed: o.vp9CpuUsed,
      opusKbps: o.opusKbps,
    }),
  );
}

/**
 * @returns {{ status, desktop?, mobile?, reason? }}
 */
async function encodeOne(inputAbs, sourceSizeBytes) {
  const dir = path.dirname(inputAbs);
  const base = path.basename(inputAbs, path.extname(inputAbs));
  const outMp4 = path.join(dir, `${base}.web.mp4`);
  const outWebm = path.join(dir, `${base}.webm`);
  const outMobileMp4 = path.join(dir, `${base}.mobile.web.mp4`);
  const outMobileWebm = path.join(dir, `${base}.mobile.webm`);

  const needsMobile = sourceSizeBytes > mobileThresholdBytes;
  const desktopComplete = webmOnly
    ? await fileExists(outWebm)
    : (await fileExists(outMp4)) && (await fileExists(outWebm));
  const mobileComplete = !needsMobile
    ? true
    : webmOnly
      ? await fileExists(outMobileWebm)
      : (await fileExists(outMobileMp4)) && (await fileExists(outMobileWebm));

  if (!force && desktopComplete && mobileComplete) {
    return {
      status: 'skipped',
      inputAbs,
      outMp4,
      outWebm,
      outMobileMp4,
      outMobileWebm,
      needsMobile,
      webmOnly,
      reason: 'outputs exist',
    };
  }

  if (dryRun) {
    return {
      status: 'planned',
      inputAbs,
      outMp4,
      outWebm,
      outMobileMp4,
      outMobileWebm,
      needsMobile,
      sourceSizeBytes,
      webmOnly,
    };
  }

  const withAudio = await hasAudioStream(inputAbs);
  const out = {
    status: 'ok',
    inputAbs,
    outMp4,
    outWebm,
    outMobileMp4,
    outMobileWebm,
    needsMobile,
    withAudio,
    webmOnly,
  };

  if (force || !desktopComplete) {
    if (webmOnly) {
      await encodeDesktopWebmOnly(inputAbs, outWebm, withAudio);
    } else {
      await encodeDesktopPair(inputAbs, outMp4, outWebm, withAudio);
    }
  }

  if (needsMobile && (force || !mobileComplete)) {
    if (webmOnly) {
      await encodeMobileWebmOnly(inputAbs, outMobileWebm, withAudio);
    } else {
      await encodeMobilePair(inputAbs, outMobileMp4, outMobileWebm, withAudio);
    }
  }

  return out;
}

async function patchReferences(manifest, { webmOnly: patchWebm }) {
  const textFiles = await walkTextFiles(root);
  let totalReplacements = 0;

  for (const fileAbs of textFiles) {
    const base = path.basename(fileAbs);
    if (base === 'video-optimization-manifest.json' || base === 'optimize-videos.mjs') continue;

    let content = await fs.readFile(fileAbs, 'utf8');
    const original = content;

    for (const entry of manifest) {
      const oldRel = entry.sourceRelativePosix;
      const newRel = patchWebm ? entry.webmRelativePosix : entry.webMp4RelativePosix;
      if (!newRel) continue;

      const variants = new Set([oldRel, oldRel.replace(/\//g, '\\\\')]);

      for (const v of variants) {
        if (content.includes(v)) {
          content = content.split(v).join(newRel);
          totalReplacements += 1;
        }
      }
    }

    if (content !== original) {
      await fs.writeFile(fileAbs, content, 'utf8');
    }
  }

  return totalReplacements;
}

async function main() {
  const hasFfmpeg = await checkFfmpeg();
  if (!dryRun && !hasFfmpeg) {
    console.error(
      'FFmpeg / FFprobe not found on PATH. Install FFmpeg (https://ffmpeg.org/download.html) and re-run.',
    );
    process.exit(1);
  }
  if (dryRun && !hasFfmpeg) {
    console.warn('Warning: FFmpeg not on PATH — dry-run will only list sources (no probe/encode).\n');
  }

  const videos = await walkFiles(root);
  videos.sort((a, b) => a.localeCompare(b));

  console.log(
    `Found ${videos.length} source video(s).\n` +
      `  heroMode=${heroMode} webmOnly=${webmOnly} heroMaxWidth=${heroMaxWidth} mobileMaxWidth=${mobileMaxWidth}\n` +
      `  mobileExtraRenditions when source > ${mobileThresholdMb}MB\n` +
      `  dryRun=${dryRun} force=${force} noPatch=${noPatch}\n`,
  );

  const manifest = [];
  const results = [];

  for (const inputAbs of videos) {
    const dir = path.dirname(inputAbs);
    const base = path.basename(inputAbs, path.extname(inputAbs));
    const outMp4 = path.join(dir, `${base}.web.mp4`);
    const outWebm = path.join(dir, `${base}.webm`);
    const outMobileMp4 = path.join(dir, `${base}.mobile.web.mp4`);
    const outMobileWebm = path.join(dir, `${base}.mobile.webm`);

    let sourceSizeBytes = 0;
    try {
      const st = await fs.stat(inputAbs);
      sourceSizeBytes = st.size;
    } catch {
      sourceSizeBytes = 0;
    }
    const needsMobile = sourceSizeBytes > mobileThresholdBytes;

    manifest.push({
      sourceAbsolute: norm(inputAbs),
      sourceRelativePosix: relFromRoot(inputAbs),
      sourceSizeBytes,
      mobileRenditionsPlanned: needsMobile,
      webmOnly,
      webMp4RelativePosix: webmOnly ? null : relFromRoot(outMp4),
      webmRelativePosix: relFromRoot(outWebm),
      mobileWebMp4RelativePosix: needsMobile && !webmOnly ? relFromRoot(outMobileMp4) : null,
      mobileWebmRelativePosix: needsMobile ? relFromRoot(outMobileWebm) : null,
    });

    try {
      const r = await encodeOne(inputAbs, sourceSizeBytes);
      results.push(r);
      const mb = (sourceSizeBytes / (1024 * 1024)).toFixed(2);
      const mobileNote = needsMobile ? ` + mobile (${mobileMaxWidth}px cap)` : '';
      if (r.status === 'skipped') {
        console.log(`[skip] ${relFromRoot(inputAbs)} (${r.reason}) source=${mb}MB${mobileNote}`);
      } else if (r.status === 'planned') {
        const desk = webmOnly ? 'desktop .webm only' : 'desktop .web.mp4 + .webm';
        const mob = needsMobile
          ? webmOnly
            ? '; mobile .mobile.webm only'
            : '; mobile .mobile.web.mp4 + .mobile.webm'
          : '';
        console.log(`[plan] ${relFromRoot(inputAbs)} source=${mb}MB -> ${desk}${mob}`);
      } else {
        console.log(`[ok]   ${relFromRoot(inputAbs)} source=${mb}MB${mobileNote}`);
      }
    } catch (e) {
      console.error(`[fail] ${relFromRoot(inputAbs)}`, e.message || e);
      results.push({ status: 'fail', inputAbs, error: String(e.message || e) });
    }
  }

  const manifestPath = path.join(__dirname, 'video-optimization-manifest.json');
  const payload = {
    generatedAt: new Date().toISOString(),
    settings: {
      heroMode,
      webmOnly,
      heroMaxWidth,
      mobileMaxWidth,
      mobileThresholdMb,
    },
    entries: manifest,
  };
  if (!dryRun) {
    await fs.writeFile(manifestPath, JSON.stringify(payload, null, 2), 'utf8');
    console.log(`\nWrote ${norm(path.relative(root, manifestPath))}`);
  } else {
    console.log(`\nPlanned manifest (${manifest.length} entries) — not written (dry-run).`);
  }

  if (!dryRun && !noPatch) {
    const n = await patchReferences(manifest, { webmOnly });
    console.log(`Patched references in source files (${n} string replacement pass(es) across files).`);
  } else if (dryRun) {
    console.log('\nDry run: no files written. Run without --dry-run to encode.');
  } else if (noPatch) {
    console.log('\n--no-patch: source files unchanged. Update imports to *.web.mp4 / *.webm as needed.');
  }

  if (webmOnly) {
    console.log(
      '\nWebM-only mode: use .webm (and .mobile.webm when generated). No H.264 outputs.\n' +
        'Safari / older browsers may need an MP4 fallback — re-run without --webm-only if required.\n' +
        'Example:\n' +
        '  <video controls playsInline preload="metadata" poster="...">\n' +
        '    <source src={webm} type="video/webm" />\n' +
        '  </video>\n',
    );
  } else {
    console.log(
      '\nHero / desktop: use .webm first, then .web.mp4 (max width ' +
        heroMaxWidth +
        '). ' +
        (mobileThresholdMb > 0
          ? `If source was >${mobileThresholdMb}MB, also ship *.mobile.webm + *.mobile.web.mp4 (${mobileMaxWidth}px) with <picture>-style logic or matchMedia in React.\n`
          : '') +
        'Example:\n' +
        '  <video controls playsInline preload="metadata" poster="...">\n' +
        '    <source src={webm} type="video/webm" />\n' +
        '    <source src={mp4} type="video/mp4" />\n' +
        '  </video>\n',
    );
  }

  const failed = results.filter((r) => r.status === 'fail');
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
