import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import weddingImg from '../assets/Photos-20260514T180500Z-3-001/Photos/wedding/DSC_3951.webp';

const MotionLink = motion.create(Link);

const images = [
  { id: 1, bootstrapClasses: 'col-lg-6 col-md-12', title: 'The Wedding Premiere', slug: 'wedding', coverSrc: weddingImg },
  { id: 2, bootstrapClasses: 'col-lg-3 col-md-6', title: 'Babyshoot', slug: 'baby-shoot', coverSrc: '/assets/hero/1765560781055.webp' },
  { id: 3, bootstrapClasses: 'col-lg-3 col-md-6', title: 'Pre Wedding', slug: 'pre-wedding', coverSrc: '/assets/hero/prewedding.webp' },
  { id: 6, bootstrapClasses: 'col-lg-3 col-md-6', title: 'Cinematic Portfolio', slug: 'cinematic-portfolio', videoSrc: '/portfolio/Gowri Intro.webm' }, 
  { id: 4, bootstrapClasses: 'col-lg-3 col-md-6', title: 'House Warming', slug: 'housewarming', coverSrc: '/assets/portfolio/housewarming-cover.webp' },
  { id: 5, bootstrapClasses: 'col-lg-6 col-md-12', title: 'Maternity', slug: 'maternity', coverSrc: '/assets/hero/maternity.webp' },
];

const Portfolio = () => {
  return (
    <section id="portfolio" className="section">
      <div className="container">
        <motion.div
          className="portfolio-intro glass-subtle fire-border"
          style={{ borderRadius: 'var(--radius-lg)', padding: 'clamp(1.25rem, 4vw, 2rem)' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.8 }}
        >
          <span className="portfolio-kicker">GALLERY</span>
          <h2 style={{ marginTop: '0.75rem' }}>FRAMES THAT SPEAK</h2>
        </motion.div>

        <div className="row g-3 g-lg-4">
          {images.map((img, index) => (
            <div key={img.id} className={img.bootstrapClasses}>
              <MotionLink
                to={`/gallery/${img.slug}`}
                className="portfolio-tile-link fire-border h-100"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 'var(--radius-md)',
                  minHeight: img.bootstrapClasses.includes('col-lg-6') ? '400px' : '280px'
                }}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.65, delay: index * 0.06 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="portfolio-tile-media">
                  {img.videoSrc ? (
                    <video
                      className="portfolio-tile-cover"
                      src={img.videoSrc}
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <img
                      className="portfolio-tile-cover"
                      src={img.coverSrc}
                      alt={`${img.title} — preview`}
                      loading="lazy"
                      decoding="async"
                      sizes="(max-width: 599px) 100vw, (max-width: 991px) 50vw, 25vw"
                    />
                  )}
                  <div className="portfolio-tile-scrim" aria-hidden />
                </div>

                <motion.div
                  className="portfolio-tile-hover"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.35 }}
                />

                <div className="portfolio-tile-footer">
                  <h4 className="portfolio-tile-title">{img.title}</h4>
                  <p className="portfolio-tile-cta">VIEW PROJECT</p>
                </div>
              </MotionLink>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
