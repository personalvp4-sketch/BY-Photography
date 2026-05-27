import { useEffect, useRef, useState } from 'react';

/**
 * Grid thumbnail for WebM: lazy-loads `preload="metadata"` so the browser can
 * paint a first frame — avoids `*-poster.webp` (often absent when ffmpeg does
 * not run in CI).
 */
export default function GalleryVideoThumb({ videoSrc, className }) {
  const wrapRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShouldLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: '100px 0px', threshold: 0.02 }
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  if (broken) {
    return (
      <div className={`${className ?? ''} gallery-video-thumb-fallback`} aria-hidden>
        <span className="gallery-video-thumb-fallback__icon">▶</span>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="gallery-video-thumb-root">
      {!shouldLoad ? (
        <div className="gallery-video-thumb-fallback" aria-hidden>
          <span className="gallery-video-thumb-fallback__icon">▶</span>
        </div>
      ) : (
        <video
          src={videoSrc}
          muted
          playsInline
          preload="metadata"
          aria-hidden
          className={`${className ?? ''} gallery-video-thumb-video`}
          onLoadedData={(e) => {
            try {
              e.currentTarget.currentTime = 0.001;
            } catch {
              /* seek may fail before metadata */
            }
          }}
          onError={() => setBroken(true)}
        />
      )}
    </div>
  );
}
