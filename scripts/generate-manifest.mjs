import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const GALLERY_ROOT = path.join(root, 'public', 'gallery');
const PORTFOLIO_ROOT = path.join(root, 'public', 'portfolio');

async function scan() {
  const manifest = {
    gallery: {},
    portfolio: []
  };

  // Scan Gallery
  try {
    const folders = await fs.readdir(GALLERY_ROOT, { withFileTypes: true });
    for (const f of folders) {
      if (f.isDirectory()) {
        const files = await fs.readdir(path.join(GALLERY_ROOT, f.name));
        manifest.gallery[f.name] = files.filter(x => /\.(webp|webm)$/i.test(x));
      }
    }
  } catch (e) {
    console.warn('Gallery root not found', e.message);
  }

  // Scan Portfolio
  try {
    const files = await fs.readdir(PORTFOLIO_ROOT);
    manifest.portfolio = files.filter(x => /\.(webp|webm)$/i.test(x));
  } catch (e) {
    console.warn('Portfolio root not found', e.message);
  }

  await fs.writeFile(
    path.join(root, 'src', 'lib', 'galleryManifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );
  console.log('Manifest generated at src/lib/galleryManifest.json');
}

scan();
