import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { useJsonLd } from '../hooks/useJsonLd';
import { usePageMeta } from '../hooks/usePageMeta';
import { isValidGallerySlug, loadGalleryItems, SLUG_TO_LABEL } from '../lib/galleryAssets';
import { buildGalleryGraph } from '../lib/schema/buildGalleryGraph';

function GalleryContent({ slug, title }) {
  const [items, setItems] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [lightbox, setLightbox] = useState(null);
  const closeBtnRef = useRef(null);

  usePageMeta({
    title,
    description: `Browse the ${title} collection — cinematic photography and videography by BY Photography.`,
  });

  const galleryJsonLd =
    loadState === 'ready' && items.length > 0 ? buildGalleryGraph(slug, title, items) : null;
  useJsonLd(galleryJsonLd);

  useEffect(() => {
    let cancelled = false;

    loadGalleryItems(slug)
      .then((data) => {
        if (!cancelled) {
          setItems(data);
          setLoadState('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setLoadState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (lightbox === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightbox]);

  useEffect(() => {
    if (lightbox === null) return;
    const id = requestAnimationFrame(() => closeBtnRef.current?.focus());
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowLeft')
        setLightbox((i) => (i === null ? i : (i - 1 + items.length) % items.length));
      if (e.key === 'ArrowRight') setLightbox((i) => (i === null ? i : (i + 1) % items.length));
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('keydown', onKey);
    };
  }, [lightbox, items.length]);

  const lightboxNode =
    lightbox !== null && items[lightbox] ? (
      <div
        className="gallery-lightbox"
        role="dialog"
        aria-modal="true"
        aria-label={`Full size view, ${lightbox + 1} of ${items.length}`}
      >
        <button
          type="button"
          className="gallery-lightbox-backdrop"
          aria-label="Close gallery viewer"
          onClick={() => setLightbox(null)}
        />
        <div className="gallery-lightbox-inner">
          <button
            ref={closeBtnRef}
            type="button"
            className="gallery-lightbox-close fire-border"
            aria-label="Close"
            onClick={() => setLightbox(null)}
          >
            ×
          </button>
          {items.length > 1 ? (
            <>
              <button
                type="button"
                className="gallery-lightbox-nav gallery-lightbox-nav--prev fire-border"
                aria-label="Previous photo"
                onClick={() =>
                  setLightbox((i) => (i === null ? i : (i - 1 + items.length) % items.length))
                }
              >
                ‹
              </button>
              <button
                type="button"
                className="gallery-lightbox-nav gallery-lightbox-nav--next fire-border"
                aria-label="Next photo"
                onClick={() => setLightbox((i) => (i === null ? i : (i + 1) % items.length))}
              >
                ›
              </button>
            </>
          ) : null}
          <div className="gallery-lightbox-stage" onClick={(e) => e.stopPropagation()}>
            {items[lightbox].type === 'video' ? (
              <video
                src={items[lightbox].src}
                className="gallery-lightbox-img"
                controls
                autoPlay
                loop
                playsInline
              />
            ) : (
              <img
                src={items[lightbox].src}
                alt={`${title} — ${items[lightbox].file.replace(/\.(webp|webm)$/i, '')}, full size`}
                className="gallery-lightbox-img"
                decoding="async"
                fetchPriority="high"
              />
            )}
          </div>
          <p className="gallery-lightbox-meta">
            {items[lightbox].file.replace(/\.(webp|webm)$/i, '')} · {lightbox + 1} / {items.length}
          </p>
        </div>
      </div>
    ) : null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 style={{ marginBottom: '0.35rem' }}>{title}</h1>
        {loadState === 'loading' ? (
          <p className="gallery-loading" role="status">
            Loading collection…
          </p>
        ) : loadState === 'error' ? (
          <p className="gallery-loading gallery-loading--error" role="alert">
            Could not load this gallery. Please try again.
          </p>
        ) : (
          <p style={{ marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)', opacity: 0.88 }}>
            {items.length} {items[0]?.type === 'video' ? 'cinematic clip' : 'photograph'}
            {items.length === 1 ? '' : 's'} in this collection.
          </p>
        )}
      </motion.div>

      {loadState === 'ready' && items.length === 0 ? (
        <p className="glass-card glass" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
          No assets found in this folder yet.
        </p>
      ) : null}

      {loadState === 'ready' && items.length > 0 ? (
        <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-3">
          {items.map(({ src, file, type }, i) => {
            const label = file.replace(/\.(webp|webm)$/i, '');
            return (
              <div key={file} className="col">
                <motion.figure
                  className="gallery-page-cell glass-subtle fire-border h-100"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, delay: Math.min(i * 0.02, 0.4) }}
                >
                  <button
                    type="button"
                    className="gallery-page-thumb"
                    aria-label={`Open ${label} in viewer`}
                    onClick={() => setLightbox(i)}
                  >
                    {type === 'video' ? (
                      <video
                        src={src}
                        className="gallery-page-img"
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        style={{ objectFit: 'cover', height: '100%' }}
                      />
                    ) : (
                      <img
                        src={src}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="gallery-page-img"
                        sizes="(max-width: 520px) 50vw, (max-width: 900px) 33vw, 25vw"
                      />
                    )}
                  </button>
                  <figcaption className="gallery-page-caption">{label}</figcaption>
                </motion.figure>
              </div>
            );
          })}
        </div>
      ) : null}

      <p style={{ marginTop: '2.5rem' }}>
        <Link to="/#portfolio" className="gallery-back-link">
          ← Back to gallery overview
        </Link>
      </p>

      {typeof document !== 'undefined' && lightboxNode
        ? createPortal(lightboxNode, document.body)
        : null}
    </>
  );
}

export default function GalleryPage() {
  const { slug } = useParams();
  const valid = isValidGallerySlug(slug);
  const title = valid ? SLUG_TO_LABEL[slug] : '';

  if (!valid) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="app">
      <Navbar />
      <main className="app-main">
        <section className="section section--tight">
          <div className="container">
            <nav className="gallery-breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span className="gallery-breadcrumb-sep" aria-hidden>
                /
              </span>
              <Link to="/#portfolio">Gallery</Link>
              <span className="gallery-breadcrumb-sep" aria-hidden>
                /
              </span>
              <span className="gallery-breadcrumb-current">{title}</span>
            </nav>

            <GalleryContent key={slug} slug={slug} title={title} />
          </div>
        </section>
      </main>
    </div>
  );
}
