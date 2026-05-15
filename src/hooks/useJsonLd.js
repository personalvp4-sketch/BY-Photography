import { useEffect } from 'react';

const SCRIPT_ATTR = 'data-by-jsonld';

/**
 * Injects Schema.org JSON-LD into document head; replaces prior graph from this hook.
 * @param {object | null | undefined} data
 */
export function useJsonLd(data) {
  useEffect(() => {
    if (!data || typeof document === 'undefined') return undefined;

    const existing = document.head.querySelector(`script[${SCRIPT_ATTR}]`);
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute(SCRIPT_ATTR, 'true');
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [data]);
}
