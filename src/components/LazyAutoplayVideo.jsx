import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Defers WebM until near viewport; shows poster first; on narrow viewports uses a
 * static image until the user taps to play (saves ~10MB+ decode on mobile).
 *
 * When `fallbackImg` is set, it is preferred for the narrow "tap to play" still
 * (`*-poster.webp` from CI is often missing if ffmpeg did not run).
 */
export default function LazyAutoplayVideo({ src, poster, fallbackImg, className }) {
  const videoRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [mobilePlay, setMobilePlay] = useState(false);
  const [mobileImgSrc, setMobileImgSrc] = useState(() => fallbackImg || poster || '');

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return undefined;

    const io = new IntersectionObserver(
      ([entry]) => {
        setShouldLoad(entry.isIntersecting);
      },
      { root: null, rootMargin: '140px 0px', threshold: 0.02 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const loadVideo = (!narrow && shouldLoad) || (narrow && mobilePlay);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    if (!loadVideo) {
      video.pause();
      video.removeAttribute('src');
      video.load();
      return undefined;
    }

    video.src = src;
    video.load();
    const playAttempt = video.play();
    if (playAttempt !== undefined && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {});
    }

    return () => {
      video.pause();
    };
  }, [loadVideo, src]);

  const videoPoster = poster || fallbackImg;
  const narrowStaticSrc = fallbackImg || poster;
  const showMobilePoster = narrow && narrowStaticSrc && !mobilePlay;

  useEffect(() => {
    setMobileImgSrc(fallbackImg || poster || '');
  }, [fallbackImg, poster]);

  const onMobileImgError = useCallback(() => {
    setMobileImgSrc((prev) => {
      if (prev === fallbackImg && poster) return poster;
      return prev;
    });
  }, [fallbackImg, poster]);

  return (
    <div className="lazy-video-root">
      {showMobilePoster ? (
        <button
          type="button"
          className="lazy-video-mobile-poster"
          aria-label="Play preview video"
          onClick={() => setMobilePlay(true)}
        >
          <img
            src={mobileImgSrc || narrowStaticSrc || undefined}
            alt=""
            className={className}
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={onMobileImgError}
          />
          <span className="lazy-video-play-icon" aria-hidden>
            ▶
          </span>
        </button>
      ) : null}

      <video
        ref={videoRef}
        className={className}
        style={showMobilePoster ? { display: 'none' } : undefined}
        muted
        loop
        playsInline
        preload="none"
        poster={videoPoster || undefined}
        aria-hidden={true}
      />
    </div>
  );
}
