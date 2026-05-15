import { SCHEMA_CONTEXT, SITE_NAME, getSiteOrigin } from './constants.js';

export function absoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return getSiteOrigin();
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const origin = getSiteOrigin();
  return `${origin}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}

export function schemaId(...segments) {
  return segments.filter(Boolean).join('');
}

export function fileStem(filename) {
  return filename.replace(/\.(webp|webm|jpe?g|png)$/i, '');
}

export function wrapGraph(entities) {
  return {
    '@context': SCHEMA_CONTEXT,
    '@graph': entities,
  };
}

export function coreOrganization(origin) {
  const orgId = `${origin}/#organization`;
  return {
    '@type': ['Organization', 'ProfessionalService', 'LocalBusiness'],
    '@id': orgId,
    name: SITE_NAME,
    url: origin,
    logo: `${origin}/favicon.svg`,
    image: `${origin}/favicon.svg`,
    description:
      'Cinematic wedding, pre-wedding, maternity, baby, and commercial photography studio in India.',
    telephone: '+918553702039',
    sameAs: ['https://www.instagram.com/b_y__creation', 'https://wa.me/918553702039'],
    priceRange: '₹₹₹',
    areaServed: { '@type': 'Country', name: 'India' },
  };
}

export function coreWebSite(origin, orgId) {
  return {
    '@type': 'WebSite',
    '@id': `${origin}/#website`,
    url: origin,
    name: SITE_NAME,
    publisher: { '@id': orgId },
    inLanguage: 'en-IN',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${origin}/gallery/{search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function webPageEntity({ origin, path, name, description, pageId }) {
  const url = path === '/' ? origin : `${origin}${path}`;
  return {
    '@type': 'WebPage',
    '@id': pageId || `${url}#webpage`,
    url,
    name,
    description,
    isPartOf: { '@id': `${origin}/#website` },
    about: { '@id': `${origin}/#organization` },
    inLanguage: 'en-IN',
  };
}

export function imageObjectEntity({ id, name, contentUrl, caption, isPartOf, position }) {
  return {
    '@type': 'ImageObject',
    '@id': id,
    name,
    contentUrl,
    caption: caption || name,
    ...(isPartOf ? { isPartOf } : {}),
    ...(position != null ? { position } : {}),
  };
}

export function videoObjectEntity({ id, name, contentUrl, description, isPartOf, position, thumbnailUrl }) {
  return {
    '@type': 'VideoObject',
    '@id': id,
    name,
    contentUrl,
    description: description || name,
    encodingFormat: 'video/webm',
    ...(thumbnailUrl ? { thumbnailUrl } : {}),
    ...(isPartOf ? { isPartOf } : {}),
    ...(position != null ? { position } : {}),
  };
}

export function collectionPageEntity({ origin, slug, label, itemCount }) {
  const url = `${origin}/gallery/${slug}`;
  return {
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    url,
    name: label,
    description: `${label} — ${itemCount} curated photographs and films by ${SITE_NAME}.`,
    isPartOf: { '@id': `${origin}/#website` },
    about: { '@id': `${origin}/#organization` },
  };
}

export function imageGalleryEntity({ origin, slug, label, itemIds }) {
  const url = `${origin}/gallery/${slug}`;
  return {
    '@type': 'ImageGallery',
    '@id': `${url}#imagegallery`,
    name: label,
    url,
    ...(itemIds?.length
      ? {
          hasPart: itemIds.map((id) => ({ '@id': id })),
          numberOfItems: itemIds.length,
        }
      : {}),
  };
}

export function breadcrumbEntity(origin, crumbs) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${crumbs[crumbs.length - 1].item}#breadcrumb`,
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.item,
    })),
  };
}

export function serviceEntity({ origin, name, description, index }) {
  return {
    '@type': 'Service',
    '@id': `${origin}/#service-${index}`,
    name,
    description,
    provider: { '@id': `${origin}/#organization` },
    areaServed: 'IN',
    serviceType: name,
  };
}

export function faqPageEntity(origin, entries) {
  return {
    '@type': 'FAQPage',
    '@id': `${origin}/#faq`,
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: entry.answer,
      },
    })),
  };
}

export function creativeWorkEntity({ origin, id, name, description }) {
  return {
    '@type': 'CreativeWork',
    '@id': `${origin}/#creative-${id}`,
    name,
    description,
    creator: { '@id': `${origin}/#organization` },
  };
}

export function contactPageEntity(origin) {
  return {
    '@type': 'ContactPage',
    '@id': `${origin}/#contact`,
    url: `${origin}/#contact`,
    name: `Contact ${SITE_NAME}`,
    isPartOf: { '@id': `${origin}/#website` },
  };
}

export function siteNavigationEntity(origin, links) {
  return {
    '@type': 'SiteNavigationElement',
    '@id': `${origin}/#navigation`,
    name: 'Primary navigation',
    hasPart: links.map((link, i) => ({
      '@type': 'SiteNavigationElement',
      '@id': `${origin}/#nav-${i}`,
      name: link.name,
      url: link.url,
    })),
  };
}
