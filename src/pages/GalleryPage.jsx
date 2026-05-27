import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, Navigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import GalleryVideoThumb from '../components/GalleryVideoThumb.jsx';
import OptimizedImg from '../components/OptimizedImg.jsx';
import { useJsonLd } from '../hooks/useJsonLd';
import { usePageMeta } from '../hooks/usePageMeta';
import { isValidGallerySlug, loadGalleryItems, SLUG_TO_LABEL } from '../lib/galleryAssets';
import { RASTER_IMG_WIDTHS, stemFromPublicWebp } from '../lib/responsiveImage.js';
import { buildGalleryGraph } from '../lib/schema/buildGalleryGraph';

const GRID_SIZES = '(max-width: 520px) 50vw, (max-width: 900px) 33vw, 22vw';
const LIGHTBOX_SIZES = '95vw';

function GalleryContent({ slug, title }) {
  const [items, setItems] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [lightbox, setLightbox] = useState(null);
  const closeBtnRef = useRef(null);
  const headerRef = useRef(null);
  const gridRef = useRef(null);

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

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          io.disconnect();
        }
      },
      { threshold: 0.06, rootMargin: '0px 0px -5% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const root = gridRef.current;
    if (!root || loadState !== 'ready') return undefined;
    const cells = root.querySelectorAll('.gallery-page-cell');
    if (!cells.length) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '60px 0px', threshold: 0.04 }
    );
    cells.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [loadState, items]);

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
                preload="metadata"
              />
            ) : (
              <OptimizedImg
                stem={stemFromPublicWebp(items[lightbox].src)}
                fallbackSrc={items[lightbox].src}
                alt={`${title} — ${items[lightbox].file.replace(/\.(webp|webm)$/i, '')}, full size`}
                className="gallery-lightbox-img"
                sizes={LIGHTBOX_SIZES}
                widths={RASTER_IMG_WIDTHS}
                defaultWidth={1200}
                decoding="async"
                fetchPriority="high"
                loading="eager"
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
      <div ref={headerRef} className="gallery-page-header">
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
      </div>

      {loadState === 'ready' && items.length === 0 ? (
        <p className="glass-card glass" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
          No assets found in this folder yet.
        </p>
      ) : null}

      {loadState === 'ready' && items.length > 0 ? (
        <div ref={gridRef} className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-3">
          {items.map(({ src, file, type }, i) => {
            const label = file.replace(/\.(webp|webm)$/i, '');
            return (
              <div key={file} className="col">
                <figure className="gallery-page-cell glass-subtle fire-border h-100">
                  <button
                    type="button"
                    className="gallery-page-thumb"
                    aria-label={`Open ${label} in viewer`}
                    onClick={() => setLightbox(i)}
                  >
                    {type === 'video' ? (
                      <GalleryVideoThumb videoSrc={src} className="gallery-page-img" />
                    ) : (
                      <OptimizedImg
                        stem={stemFromPublicWebp(src)}
                        fallbackSrc={src}
                        alt=""
                        className="gallery-page-img"
                        sizes={GRID_SIZES}
                        widths={RASTER_IMG_WIDTHS}
                        defaultWidth={800}
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                  </button>
                  <figcaption className="gallery-page-caption">{label}</figcaption>
                </figure>
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
  const pageTitle = valid ? SLUG_TO_LABEL[slug] : '';

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
              <span className="gallery-breadcrumb-current">{pageTitle}</span>
            </nav>

            <GalleryContent key={slug} slug={slug} title={pageTitle} />
          </div>
        </section>
      </main>
    </div>
  );
}
