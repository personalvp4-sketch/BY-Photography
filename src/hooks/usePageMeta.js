import { useEffect } from 'react';

const DEFAULT_TITLE = 'BY Photography | Cinematic Luxury Visuals';

/**
 * @param {{ title?: string; description?: string }} options
 */
export function usePageMeta({ title, description } = {}) {
  useEffect(() => {
    const prevTitle = document.title;
    const meta = document.querySelector('meta[name="description"]');
    const prevDescription = meta?.getAttribute('content') ?? '';

    document.title = title ? `${title} | BY Photography` : DEFAULT_TITLE;
    if (meta && description) {
      meta.setAttribute('content', description);
    }

    return () => {
      document.title = prevTitle;
      if (meta) meta.setAttribute('content', prevDescription);
    };
  }, [title, description]);
}
