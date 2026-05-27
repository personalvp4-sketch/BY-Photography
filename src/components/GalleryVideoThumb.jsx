import { useState } from 'react';
import { posterPathFromWebm } from '../lib/responsiveImage.js';

/** Grid thumbnail: poster only (no WebM decode until lightbox). */
export default function GalleryVideoThumb({ videoSrc, className }) {
  const poster = posterPathFromWebm(videoSrc);
  const [useFallback, setUseFallback] = useState(false);

  if (useFallback) {
    return (
      <div className={`${className} gallery-video-thumb-fallback`} aria-hidden>
        <span className="gallery-video-thumb-fallback__icon">▶</span>
      </div>
    );
  }

  return (
    <img
      src={poster}
      alt=""
      loading="lazy"
      decoding="async"
      className={className}
      style={{ objectFit: 'cover', height: '100%' }}
      onError={() => setUseFallback(true)}
    />
  );
}
