import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Aperture, Clapperboard, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useJsonLd } from '../hooks/useJsonLd';
import { usePageMeta } from '../hooks/usePageMeta';
import { buildHomeGraph } from '../lib/schema/buildHomeGraph';
import CinematicHero from '../components/CinematicHero';
import Portfolio from '../components/Portfolio';
import Contact from '../components/Contact';

const SERVICE_ITEMS = ['Weddings', 'Portraits', 'Drone', 'Commercial'];

const ABOUT_PILLARS = [
  {
    Icon: Clapperboard,
    title: "Director's cut",
    text: 'Curated sequences and intent—not a dump of files.',
  },
  {
    Icon: Aperture,
    title: 'Light as language',
    text: 'Shadow, contrast, and atmosphere shaped on purpose.',
  },
  {
    Icon: Sparkles,
    title: 'Soul in the frame',
    text: 'We chase feeling first; everything else follows.',
  },
];

export default function Home() {
  const [jsonLd, setJsonLd] = useState(null);

  usePageMeta();
  useJsonLd(jsonLd);

  useEffect(() => {
    let cancelled = false;
    buildHomeGraph().then((graph) => {
      if (!cancelled) setJsonLd(graph);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app">
      <Navbar />
      <main className="app-main">
        <CinematicHero />

        <section id="about" className="section section-about">
          <div className="container about-showcase-wrap">
            <motion.article
              className="about-showcase glass-strong glass-card fire-border"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="about-showcase__glow" aria-hidden />
              <span className="about-showcase__watermark" aria-hidden>
                01
              </span>

              <header className="about-showcase__header">
                <span className="about-kicker">STUDIO ETHOS</span>
                <span className="about-showcase__rule" aria-hidden />
              </header>

              <div className="row g-4 g-lg-5 align-items-center">
                <div className="col-lg-5">
                  <div className="about-showcase__title-col">
                    <h2 className="about-showcase__title">
                      <span className="about-showcase__title-line">THE ALCHEMY</span>
                      <span className="about-showcase__title-line about-showcase__title-line--fire">
                        OF SIGHT
                      </span>
                    </h2>
                    <p className="about-showcase__tagline">
                      Where light, emotion, and story converge—then stay.
                    </p>
                  </div>
                </div>

                <div className="col-lg-7">
                  <div className="about-showcase__body-col">
                    <motion.p
                      className="about-lead about-lead--showcase"
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ duration: 0.75, delay: 0.08 }}
                    >
                      We believe photography is more than capturing a moment—it&apos;s about preserving a
                      feeling. Our &quot;Director&apos;s Cut&quot; approach ensures every frame we deliver is
                      a cinematic masterpiece, crafted with intent and delivered with soul.
                    </motion.p>

                    <ul className="about-pillars">
                      {ABOUT_PILLARS.map(({ Icon, title, text }, i) => (
                        <motion.li
                          key={title}
                          className="about-pillar glass-subtle fire-border"
                          initial={{ opacity: 0, y: 16 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: '-30px' }}
                          transition={{ duration: 0.55, delay: 0.12 + i * 0.08 }}
                        >
                          <span className="about-pillar__icon" aria-hidden>
                            <Icon strokeWidth={1.35} size={22} />
                          </span>
                          <span className="about-pillar__text">
                            <span className="about-pillar__title">{title}</span>
                            <span className="about-pillar__desc">{text}</span>
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.article>
          </div>
        </section>

        <section id="services" className="section section--tight">
          <div id="process" tabIndex={-1} aria-hidden="true" className="scroll-anchor" />
          <div className="container">
            <h2 className="text-center" style={{ marginBottom: 'clamp(1.5rem, 4vw, 3rem)' }}>
              PREMIUM EXPERIENCES
            </h2>
            <div
              className="services-ticker-shell"
              role="region"
              aria-label="Premium experiences, scrolling announcements"
            >
              <div className="services-ticker-fade services-ticker-fade--left" aria-hidden />
              <div className="services-ticker-fade services-ticker-fade--right" aria-hidden />
              <div className="services-ticker-viewport">
                <div className="services-ticker-track">
                  {[...SERVICE_ITEMS, ...SERVICE_ITEMS].map((service, i) => (
                    <div
                      key={`${service}-${i}`}
                      className="fire-border glass services-card services-ticker-card"
                    >
                      <h3 style={{ marginBottom: '0.75rem' }}>{service}</h3>
                      <p>
                        Elevating your {service.toLowerCase()} through our unique cinematic lens.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <Portfolio />

        <Contact />
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="site-footer-links">
            <a href="https://www.instagram.com/b_y__creation" target="_blank" rel="noopener noreferrer">
              INSTAGRAM
            </a>
            <a href="https://wa.me/918553702039" target="_blank" rel="noopener noreferrer">
              WHATSAPP
            </a>
          </div>
          <p className="site-footer-copy">© 2024 BY PHOTOGRAPHY | CRAFTED WITH CINEMATIC INTENT</p>
        </div>
      </footer>
    </div>
  );
}
