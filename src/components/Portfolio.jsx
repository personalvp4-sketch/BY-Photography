import { Link } from 'react-router-dom';
import OptimizedImg from './OptimizedImg.jsx';
import LazyAutoplayVideo from './LazyAutoplayVideo.jsx';
import { RASTER_IMG_WIDTHS } from '../lib/responsiveImage.js';

const TILE_SIZES = '(max-width: 599px) 100vw, (max-width: 991px) 50vw, 28vw';

const tiles = [
  {
    id: 1,
    bootstrapClasses: 'col-lg-6 col-md-12',
    title: 'The Wedding Premiere',
    slug: 'wedding',
    stem: '/assets/hero/54',
    fallback: '/assets/hero/54.webp',
  },
  {
    id: 2,
    bootstrapClasses: 'col-lg-3 col-md-6',
    title: 'Babyshoot',
    slug: 'baby-shoot',
    stem: '/assets/hero/1765560781055',
    fallback: '/assets/hero/1765560781055.webp',
  },
  {
    id: 3,
    bootstrapClasses: 'col-lg-3 col-md-6',
    title: 'Pre Wedding',
    slug: 'pre-wedding',
    stem: '/assets/hero/53',
    fallback: '/assets/hero/53.webp',
  },
  {
    id: 6,
    bootstrapClasses: 'col-lg-3 col-md-6',
    title: 'Cinematic Portfolio',
    slug: 'cinematic-portfolio',
    videoSrc: '/portfolio/Gowri Intro.webm',
    /** Distinct from Pre Wedding tile (`53`); matches hero “cinema” slide. */
    mobileFallback: '/assets/hero/MAH09784.webp',
  },
  {
    id: 4,
    bootstrapClasses: 'col-lg-3 col-md-6',
    title: 'House Warming',
    slug: 'housewarming',
    stem: '/assets/portfolio/housewarming-cover',
    fallback: '/assets/portfolio/housewarming-cover.webp',
  },
  {
    id: 5,
    bootstrapClasses: 'col-lg-6 col-md-12',
    title: 'Maternity',
    slug: 'maternity',
    stem: '/assets/hero/DSC00314',
    fallback: '/assets/hero/DSC00314.webp',
  },
];

const Portfolio = () => {
  return (
    <section id="portfolio" className="section">
      <div className="container">
        <div
          className="portfolio-intro glass-subtle fire-border reveal-block"
          style={{ borderRadius: 'var(--radius-lg)', padding: 'clamp(1.25rem, 4vw, 2rem)' }}
        >
          <span className="portfolio-kicker">GALLERY</span>
          <h2 style={{ marginTop: '0.75rem' }}>FRAMES THAT SPEAK</h2>
        </div>

        <div className="row g-3 g-lg-4">
          {tiles.map((img) => (
            <div key={img.id} className={img.bootstrapClasses}>
              <Link
                to={`/gallery/${img.slug}`}
                className="portfolio-tile-link fire-border"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div className="portfolio-tile-media">
                  {img.videoSrc ? (
                    <LazyAutoplayVideo
                      key={`${img.videoSrc}|${img.mobileFallback ?? ''}`}
                      className="portfolio-tile-cover"
                      src={img.videoSrc}
                      poster={img.poster}
                      fallbackImg={img.mobileFallback}
                    />
                  ) : (
                    <OptimizedImg
                      stem={img.stem}
                      fallbackSrc={img.fallback}
                      alt={`${img.title} — preview`}
                      sizes={TILE_SIZES}
                      widths={RASTER_IMG_WIDTHS}
                      defaultWidth={1200}
                      className="portfolio-tile-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  <div className="portfolio-tile-scrim" aria-hidden />
                </div>

                <div className="portfolio-tile-hover" aria-hidden />

                <div className="portfolio-tile-footer">
                  <h4 className="portfolio-tile-title">{img.title}</h4>
                  <p className="portfolio-tile-cta">VIEW PROJECT</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
