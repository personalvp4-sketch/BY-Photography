import manifest from './galleryManifest.json';

export const SLUG_TO_FOLDER = {
  wedding: 'wedding',
  'baby-shoot': 'baby shoot',
  'pre-wedding': 'pre wedding',
  maternity: 'maternity',
  housewarming: 'Housewarming',
  'cinematic-portfolio': 'portfolio',
};

export const SLUG_TO_LABEL = {
  wedding: 'The Wedding Premiere',
  'baby-shoot': 'Babyshoot',
  'pre-wedding': 'Pre Wedding',
  maternity: 'Maternity',
  housewarming: 'House Warming',
  'cinematic-portfolio': 'Cinematic Portfolio',
};

/**
 * @param {string} slug - key of SLUG_TO_FOLDER
 * @returns {Promise<{ src: string, file: string, type: 'image' | 'video' }[]>}
 */
export async function loadGalleryItems(slug) {
  const folder = SLUG_TO_FOLDER[slug];
  if (!folder) return [];

  const isPortfolio = slug === 'cinematic-portfolio';
  
  if (isPortfolio) {
    return manifest.portfolio.map(file => ({
      src: `/portfolio/${file}`,
      file,
      type: file.endsWith('.webm') ? 'video' : 'image'
    })).sort((a, b) => a.file.localeCompare(b.file, undefined, { numeric: true }));
  }

  const files = manifest.gallery[folder] || [];
  return files.map(file => ({
    src: `/gallery/${folder}/${file}`,
    file,
    type: file.endsWith('.webm') ? 'video' : 'image'
  })).sort((a, b) => a.file.localeCompare(b.file, undefined, { numeric: true }));
}

export function isValidGallerySlug(slug) {
  return Boolean(slug && SLUG_TO_FOLDER[slug]);
}

export const GALLERY_SLUGS = Object.keys(SLUG_TO_FOLDER);

/**
 * @returns {Promise<{ slug: string, label: string, items: Awaited<ReturnType<typeof loadGalleryItems>> }[]>}
 */
export async function loadAllGalleryCatalog() {
  return Promise.all(
    GALLERY_SLUGS.map(async (slug) => ({
      slug,
      label: SLUG_TO_LABEL[slug],
      items: await loadGalleryItems(slug),
    })),
  );
}
