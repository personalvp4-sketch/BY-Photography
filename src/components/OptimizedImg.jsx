import { useCallback, useState } from 'react';
import { webpSrcSetFromStem } from '../lib/responsiveImage.js';

/**
 * Responsive WebP from build pipeline (`stem-{width}.webp`).
 * Falls back to original full-size asset if derivatives are missing (local dev).
 *
 * @param {{
 *   stem: string;
 *   fallbackSrc: string;
 *   alt: string;
 *   sizes: string;
 *   widths: number[];
 *   defaultWidth?: number;
 *   className?: string;
 *   loading?: 'eager' | 'lazy';
 *   decoding?: 'async' | 'auto' | 'sync';
 *   fetchPriority?: 'high' | 'low' | 'auto';
 *   style?: object;
 *   role?: string;
 * }} props
 */
export default function OptimizedImg({
  stem,
  fallbackSrc,
  alt,
  sizes,
  widths,
  defaultWidth,
  className,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  style,
  role,
}) {
  const maxW = defaultWidth ?? widths[widths.length - 1];
  const [useFallback, setUseFallback] = useState(false);

  const onError = useCallback(() => {
    setUseFallback(true);
  }, []);

  if (useFallback) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        style={style}
        role={role}
      />
    );
  }

  return (
    <img
      src={`${stem}-${maxW}.webp`}
      srcSet={webpSrcSetFromStem(stem, widths)}
      sizes={sizes}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      onError={onError}
      style={style}
      role={role}
    />
  );
}
