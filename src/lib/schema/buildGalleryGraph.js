import { getSiteOrigin, SITE_NAME } from './constants.js';
import {
  absoluteUrl,
  breadcrumbEntity,
  collectionPageEntity,
  coreOrganization,
  coreWebSite,
  fileStem,
  imageGalleryEntity,
  imageObjectEntity,
  videoObjectEntity,
  webPageEntity,
  wrapGraph,
} from './builders.js';

/**
 * @param {string} slug
 * @param {string} label
 * @param {{ src: string, file: string, type: 'image' | 'video' }[]} items
 */
export function buildGalleryGraph(slug, label, items) {
  const origin = getSiteOrigin();
  const orgId = `${origin}/#organization`;
  const graph = [];

  graph.push(coreOrganization(origin));
  graph.push(coreWebSite(origin, orgId));

  const pageUrl = `${origin}/gallery/${slug}`;
  graph.push(
    webPageEntity({
      origin,
      path: `/gallery/${slug}`,
      name: `${label} | ${SITE_NAME}`,
      description: `Browse the ${label} collection — cinematic photography and videography.`,
      pageId: `${pageUrl}#webpage`,
    }),
  );

  graph.push(
    breadcrumbEntity(origin, [
      { name: 'Home', item: origin },
      { name: 'Gallery', item: `${origin}/#portfolio` },
      { name: label, item: pageUrl },
    ]),
  );

  const collection = collectionPageEntity({ origin, slug, label, itemCount: items.length });
  graph.push(collection);

  const mediaIds = [];
  items.forEach((item, index) => {
    const stem = fileStem(item.file);
    const mediaId = `${pageUrl}#${encodeURIComponent(stem)}`;
    const contentUrl = absoluteUrl(item.src);

    if (item.type === 'video') {
      graph.push(
        videoObjectEntity({
          id: mediaId,
          name: `${stem} — ${label}`,
          contentUrl,
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
          caption: `${label}: ${stem}`,
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
    '@id': `${pageUrl}#itemlist`,
    name: label,
    numberOfItems: items.length,
    itemListElement: mediaIds.map((id, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: { '@id': id },
    })),
  });

  return wrapGraph(graph);
}
