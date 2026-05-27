import { useState, useEffect, useMemo, useRef } from 'react';
import OptimizedImg from './OptimizedImg.jsx';
import { HERO_IMG_WIDTHS } from '../lib/responsiveImage.js';

const HERO_SLIDES = [
  {
    stem: '/assets/hero/56',
    fallback: '/assets/hero/56.webp',
    title: 'ETERNAL BONDS',
    subtitle: 'The Wedding Premiere',
  },
  {
    stem: '/assets/hero/MAH09784',
    fallback: '/assets/hero/MAH09784.webp',
    title: 'POETIC LOVE',
    subtitle: 'Pre-Wedding Cinema',
  },
  {
    stem: '/assets/hero/DSC00330',
    fallback: '/assets/hero/DSC00330.webp',
    title: 'THE GENESIS',
    subtitle: 'Maternity Portraits',
  },
  {
    stem: '/assets/hero/MAH05512',
    fallback: '/assets/hero/MAH05512.webp',
    title: 'PURE WONDER',
    subtitle: 'Baby Shoot Editorial',
  },
  {
    stem: '/assets/hero/URS07319',
    fallback: '/assets/hero/URS07319.webp',
    title: 'NEW CHAPTERS',
    subtitle: 'Housewarming Stories',
  },
];

const PARTICLE_COUNT_DESKTOP = 18;
const PARTICLE_COUNT_MOBILE = 6;

function buildParticles(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    drift: `${Math.random() * 200 - 100}px`,
    dur: `${5 + Math.random() * 10}s`,
    delay: `${Math.random() * 10}s`,
    left: `${Math.random() * 100}%`,
    size: `${Math.random() * 4 + 2}px`,
  }));
}

const CinematicHero = () => {
  const [index, setIndex] = useState(0);
  const [tiltEnabled, setTiltEnabled] = useState(false);
  const [particleCount, setParticleCount] = useState(PARTICLE_COUNT_DESKTOP);
  const [reduceMotion, setReduceMotion] = useState(false);
  const sectionRef = useRef(null);
  const stageRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const u = () => setReduceMotion(mq.matches);
    u();
    mq.addEventListener('change', u);
    return () => mq.removeEventListener('change', u);
  }, []);

  useEffect(() => {
    /** Skip 3D tilt on touch / coarse pointers — avoids jank and unnecessary listeners on phones. */
    const mq = window.matchMedia('(min-width: 768px) and (pointer: fine)');
    const update = () => setTiltEnabled(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const apply = () => setParticleCount(mq.matches ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const effectiveParticleCount = reduceMotion ? 0 : particleCount;
  const heroParticles = useMemo(() => buildParticles(effectiveParticleCount), [effectiveParticleCount]);

  useEffect(() => {
    const next = HERO_SLIDES[(index + 1) % HERO_SLIDES.length];
    const img = new window.Image();
    img.src = `${next.stem}-1280.webp`;
    img.onerror = () => {
      img.src = next.fallback;
    };
  }, [index]);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    if (!tiltEnabled || reduceMotion) {
      stage.style.transform = '';
      return undefined;
    }

    let raf = 0;
    const pending = { x: 0, y: 0 };
    const onMove = (e) => {
      pending.x = (e.clientX / window.innerWidth - 0.5) * 10;
      pending.y = (e.clientY / window.innerHeight - 0.5) * -10;
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        stage.style.transform = `perspective(1000px) rotateX(${pending.y}deg) rotateY(${pending.x}deg)`;
      });
    };

    const el = sectionRef.current;
    el?.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      el?.removeEventListener('mousemove', onMove);
      stage.style.transform = '';
    };
  }, [tiltEnabled, reduceMotion]);

  const slide = HERO_SLIDES[index];

  return (
    <section ref={sectionRef} className="hero-section">
      <OptimizedImg
        key={slide.stem}
        stem={slide.stem}
        fallbackSrc={slide.fallback}
        alt=""
        role="presentation"
        sizes="100vw"
        widths={HERO_IMG_WIDTHS}
        defaultWidth={1600}
        className="hero-bg-layer"
        loading={index === 0 ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={index === 0 ? 'high' : 'low'}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle, transparent 20%, rgba(8, 8, 8, 0.9) 100%)',
          zIndex: 2,
        }}
      />

      <div ref={stageRef} className="hero-content-stage hero-content-stage--tilt">
        <div
          className="container hero-copy d-flex flex-column align-items-center"
          style={{
            transform: 'translateZ(48px)',
            textAlign: 'center',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div key={slide.title} className="hero-caption-wrap">
            <div className="hero-caption-inner">
              <span className="hero-eyebrow">{slide.subtitle}</span>
              <h1 className="hero-title">{slide.title}</h1>
            </div>
          </div>

          <div className="hero-cta-row hero-cta-row--enter d-flex gap-3 justify-content-center flex-wrap">
            <button
              type="button"
              className="fire-border"
              style={{
                padding: 'clamp(12px, 3vw, 16px) clamp(24px, 6vw, 40px)',
                background: 'var(--fire)',
                color: 'var(--obsidian)',
                border: 'none',
                fontWeight: '800',
                fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                letterSpacing: '0.1em',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                boxShadow: '0 0 40px var(--fire-glow)',
              }}
            >
              EXPLORE VISION
            </button>
            <button
              type="button"
              className="glass"
              style={{
                padding: 'clamp(12px, 3vw, 16px) clamp(24px, 6vw, 40px)',
                color: 'var(--platinum)',
                fontWeight: '600',
                fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              OUR STORY
            </button>
          </div>
        </div>
      </div>

      <div className="hero-particles" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4 }}>
        {heroParticles.map(({ id, drift, dur, delay, left, size }) => (
          <span
            key={id}
            className="hero-particle"
            style={{
              '--p-left': left,
              '--p-size': size,
              '--p-dur': dur,
              '--p-delay': delay,
              '--p-drift': drift,
            }}
          />
        ))}
      </div>

      <div
        className="light-leak orange-glow hero-light-leak hero-light-leak--animated"
        style={{ position: 'absolute', top: '-20%', left: '-20%', zIndex: 3, pointerEvents: 'none' }}
      />

      <div className="hero-progress-track">
        <div key={index} className="hero-progress-fill" />
      </div>

      <div className="hero-dots" role="tablist" aria-label="Hero slides">
        {HERO_SLIDES.map((s, i) => (
          <button
            key={s.title}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Show slide ${i + 1}: ${s.title}`}
            className={`hero-dot ${i === index ? 'hero-dot--active' : 'hero-dot--idle'}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </section>
  );
};

export default CinematicHero;
