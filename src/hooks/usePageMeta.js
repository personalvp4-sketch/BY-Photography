import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getSiteOrigin } from '../lib/schema/constants.js';

const DEFAULT_TITLE = 'BY Photography | Cinematic Luxury Visuals';
const DEFAULT_OG_DESCRIPTION =
  "Bespoke cinematic photography and luxury videography for life's most precious moments.";

function setMetaContent(selector, attrName, attrValue, content) {
  let el = document.head.querySelector(`${selector}[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * @param {{ title?: string; description?: string }} options
 */
export function usePageMeta({ title, description } = {}) {
  const location = useLocation();

  useEffect(() => {
    const prevTitle = document.title;
    const meta = document.querySelector('meta[name="description"]');
    const prevDescription = meta?.getAttribute('content') ?? '';

    const pageUrl = `${getSiteOrigin()}${location.pathname}${location.search}`;

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', pageUrl);

    setMetaContent('meta', 'property', 'og:url', pageUrl);
    setMetaContent('meta', 'name', 'twitter:url', pageUrl);

    const pageTitle = title ? `${title} | BY Photography` : DEFAULT_TITLE;
    const ogDescription = description || DEFAULT_OG_DESCRIPTION;
    setMetaContent('meta', 'property', 'og:title', pageTitle);
    setMetaContent('meta', 'name', 'twitter:title', pageTitle);
    setMetaContent('meta', 'property', 'og:description', ogDescription);
    setMetaContent('meta', 'name', 'twitter:description', ogDescription);

    document.title = pageTitle;
    if (meta && description) {
      meta.setAttribute('content', description);
    }

    return () => {
      document.title = prevTitle;
      if (meta) meta.setAttribute('content', prevDescription);
    };
  }, [title, description, location.pathname, location.search]);
}
