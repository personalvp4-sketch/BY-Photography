import { loadAllGalleryCatalog } from '../galleryAssets.js';
import {
  ABOUT_FAQ,
  BUSINESS,
  SERVICE_ITEMS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  getSiteOrigin,
} from './constants.js';
import {
  absoluteUrl,
  collectionPageEntity,
  contactPageEntity,
  coreOrganization,
  coreWebSite,
  creativeWorkEntity,
  faqPageEntity,
  fileStem,
  imageGalleryEntity,
  imageObjectEntity,
  serviceEntity,
  siteNavigationEntity,
  videoObjectEntity,
  webPageEntity,
  wrapGraph,
} from './builders.js';

/** Public responsive URLs for JSON-LD (avoid bundling multi‑MB src assets). */
const HERO_SLIDES = [
  { name: 'Eternal Bonds — Wedding Premiere', path: '/assets/hero/56-1200.webp' },
  { name: 'Poetic Love — Pre-Wedding Cinema', path: '/assets/hero/MAH09784-1200.webp' },
  { name: 'The Genesis — Maternity Portraits', path: '/assets/hero/DSC00330-1200.webp' },
  { name: 'Pure Wonder — Baby Shoot Editorial', path: '/assets/hero/MAH05512-1200.webp' },
  { name: 'New Chapters — Housewarming Stories', path: '/assets/hero/URS07319-1200.webp' },
];

const NAV_LINKS = [
  { name: 'Portfolio', url: '/#portfolio' },
  { name: 'Services', url: '/#services' },
  { name: 'Process', url: '/#process' },
  { name: 'About', url: '/#about' },
  { name: 'Contact', url: '/#contact' },
];

/**
 * Builds a large Schema.org @graph (200+ entities) for the home page.
 * @returns {Promise<{ '@context': string, '@graph': object[] }>}
 */
export async function buildHomeGraph() {
  const origin = getSiteOrigin();
  const orgId = `${origin}/#organization`;
  const graph = [];

  graph.push(coreOrganization(origin));
  graph.push(coreWebSite(origin, orgId));

  graph.push(
    webPageEntity({
      origin,
      path: '/',
      name: `${SITE_NAME} | ${SITE_TAGLINE}`,
      description: SITE_DESCRIPTION,
      pageId: `${origin}/#webpage`,
    }),
  );

  graph.push(contactPageEntity(origin));
  graph.push(faqPageEntity(origin, ABOUT_FAQ));
  graph.push(
    siteNavigationEntity(
      origin,
      NAV_LINKS.map((l) => ({ name: l.name, url: absoluteUrl(l.url) })),
    ),
  );

  SERVICE_ITEMS.forEach((service, index) => {
    graph.push(serviceEntity({ origin, ...service, index }));
  });

  ABOUT_FAQ.forEach((entry, index) => {
    graph.push(
      creativeWorkEntity({
        origin,
        id: `pillar-${index}`,
        name: entry.question,
        description: entry.answer,
      }),
    );
  });

  graph.push({
    '@type': 'Person',
    '@id': `${origin}/#photographer`,
    name: SITE_NAME,
    jobTitle: 'Cinematographer & Photographer',
    worksFor: { '@id': orgId },
    sameAs: [BUSINESS.instagram],
  });

  graph.push({
    '@type': 'ContactPoint',
    '@id': `${origin}/#contact-phone`,
    contactType: 'customer service',
    telephone: BUSINESS.telephone,
    availableLanguage: ['English', 'Hindi', 'Kannada'],
    areaServed: 'IN',
  });

  graph.push({
    '@type': 'ContactPoint',
    '@id': `${origin}/#contact-whatsapp`,
    contactType: 'reservations',
    url: BUSINESS.whatsapp,
    availableLanguage: ['English', 'Hindi', 'Kannada'],
  });

  HERO_SLIDES.forEach((slide, index) => {
    graph.push(
      imageObjectEntity({
        id: `${origin}/#hero-${index}`,
        name: slide.name,
        contentUrl: absoluteUrl(slide.path),
        caption: slide.name,
        isPartOf: { '@id': `${origin}/#webpage` },
        position: index + 1,
      }),
    );
  });

  const catalogs = await loadAllGalleryCatalog();
  const portfolioItemList = [];

  for (const { slug, label, items } of catalogs) {
    const collection = collectionPageEntity({ origin, slug, label, itemCount: items.length });
    graph.push(collection);

    const mediaIds = [];
    items.forEach((item, index) => {
      const stem = fileStem(item.file);
      const mediaId = `${origin}/gallery/${slug}#${encodeURIComponent(stem)}`;
      const contentUrl = absoluteUrl(item.src);

      if (item.type === 'video') {
        graph.push(
          videoObjectEntity({
            id: mediaId,
            name: `${stem} — ${label}`,
            contentUrl,
            description: `Cinematic film from the ${label} collection.`,
            isPartOf: { '@id': collection['@id'] },
            position: index + 1,
          }),
        );
      } else {
        graph.push(
          imageObjectEntity({
            id: mediaId,
            name: `${stem} — ${label}`,
            contentUrl,
            caption: `${label} photograph: ${stem}`,
            isPartOf: { '@id': collection['@id'] },
            position: index + 1,
          }),
        );
      }
      mediaIds.push(mediaId);
    });

    graph.push(imageGalleryEntity({ origin, slug, label, itemIds: mediaIds }));

    graph.push({
      '@type': 'ItemList',
      '@id': `${origin}/gallery/${slug}#itemlist`,
      name: `${label} index`,
      numberOfItems: items.length,
      itemListElement: mediaIds.map((id, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: { '@id': id },
      })),
    });

    portfolioItemList.push({
      '@type': 'ListItem',
      position: portfolioItemList.length + 1,
      item: { '@id': collection['@id'] },
    });
  }

  graph.push({
    '@type': 'ItemList',
    '@id': `${origin}/#portfolio-collections`,
    name: 'Gallery collections',
    numberOfItems: portfolioItemList.length,
    itemListElement: portfolioItemList,
  });

  return wrapGraph(graph);
}

export async function countHomeGraphEntities() {
  const { '@graph': graph } = await buildHomeGraph();
  return graph.length;
}
