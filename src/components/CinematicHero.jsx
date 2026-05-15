import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useTransform, useMotionValue, useSpring } from 'framer-motion';

const heroImages = [
  { url: '/assets/hero/wedding.webp', title: 'ETERNAL BONDS', subtitle: 'The Wedding Premiere' },
  { url: '/assets/hero/prewedding.webp', title: 'POETIC LOVE', subtitle: 'Pre-Wedding Cinema' },
  { url: '/assets/hero/maternity.webp', title: 'THE GENESIS', subtitle: 'Maternity Portraits' },
  { url: '/assets/hero/baby.webp', title: 'PURE WONDER', subtitle: 'Baby Shoot Editorial' },
  { url: '/assets/hero/housewarming.webp', title: 'NEW CHAPTERS', subtitle: 'Housewarming Stories' },
];

const PARTICLE_COUNT = 20;

const HERO_PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  xDrift: Math.random() * 200 - 100,
  duration: 5 + Math.random() * 10,
  delay: Math.random() * 10,
  left: `${Math.random() * 100}%`,
  size: Math.random() * 4 + 2,
}));

const CinematicHero = () => {
  const [index, setIndex] = useState(0);
  const [tiltEnabled, setTiltEnabled] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setTiltEnabled(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // LCP: preload first slide only at high priority; defer other slides so they do not compete
  useEffect(() => {
    const toRemove = [];

    const first = document.createElement('link');
    first.rel = 'preload';
    first.as = 'image';
    first.href = heroImages[0].url;
    first.setAttribute('fetchpriority', 'high');
    document.head.appendChild(first);
    toRemove.push(first);

    const preloadRest = () => {
      heroImages.slice(1).forEach(({ url }) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        link.setAttribute('fetchpriority', 'low');
        document.head.appendChild(link);
        toRemove.push(link);
      });
    };

    let idleId;
    let timeoutId;
    if (typeof requestIdleCallback !== 'undefined') {
      idleId = requestIdleCallback(preloadRest, { timeout: 2000 });
    } else {
      timeoutId = setTimeout(preloadRest, 400);
    }

    return () => {
      if (idleId !== undefined) cancelIdleCallback(idleId);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      toRemove.forEach((el) => el.remove());
    };
  }, []);

  // Smooth mouse movement
  const springX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 30 });

  const rotateX = useTransform(springY, [-500, 500], [tiltEnabled ? 5 : 0, tiltEnabled ? -5 : 0]);
  const rotateY = useTransform(springX, [-500, 500], [tiltEnabled ? -5 : 0, tiltEnabled ? 5 : 0]);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const moveX = clientX - window.innerWidth / 2;
    const moveY = clientY - window.innerHeight / 2;
    mouseX.set(moveX);
    mouseY.set(moveY);
  };

  return (
    <section className="hero-section" onMouseMove={handleMouseMove}>
      {/* Dynamic Background Image */}
      <AnimatePresence mode="wait">
        <motion.img
          key={heroImages[index].url}
          src={heroImages[index].url}
          alt=""
          role="presentation"
          decoding="async"
          fetchPriority={index === 0 ? 'high' : 'low'}
          loading="eager"
          draggable={false}
          initial={{ scale: 1.1, opacity: 0, filter: 'blur(12px)' }}
          animate={{ scale: 1, opacity: 0.6, filter: 'blur(0px)' }}
          exit={{ scale: 1.1, opacity: 0, filter: 'blur(12px)' }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            zIndex: 1,
          }}
        />
      </AnimatePresence>

      {/* Cinematic Vignette & Color Grade */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle, transparent 20%, rgba(8, 8, 8, 0.9) 100%)',
        zIndex: 2
      }} />

      {/* Parallax Content Stage */}
      <motion.div
        className="hero-content-stage"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Text Content */}
        <div
          className="container hero-copy d-flex flex-column align-items-center"
          style={{
            transform: 'translateZ(48px)',
            textAlign: 'center',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <span className="hero-eyebrow">{heroImages[index].subtitle}</span>
              <h1 className="hero-title">{heroImages[index].title}</h1>
            </motion.div>
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="hero-cta-row d-flex gap-3 justify-content-center flex-wrap"
          >
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
          </motion.div>
        </div>
      </motion.div>

      {/* Atmospheric Orange Dust Particles */}
      <div className="hero-particles" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4 }}>
        {HERO_PARTICLES.map(({ id, xDrift, duration, delay, left, size }) => (
          <motion.div
            key={id}
            animate={{
              y: [0, -1000],
              x: [0, xDrift],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration,
              repeat: Infinity,
              delay,
            }}
            style={{
              position: 'absolute',
              bottom: '-50px',
              left,
              width: `${size}px`,
              height: `${size}px`,
              background: 'var(--fire)',
              borderRadius: '50%',
              filter: 'blur(2px)',
            }}
          />
        ))}
      </div>

      {/* Light Leaks */}
      <motion.div
        animate={{
          opacity: [0.2, 0.5, 0.2],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="light-leak orange-glow hero-light-leak"
        style={{ top: '-20%', left: '-20%' }}
      />

      <div className="hero-progress-track">
        <motion.div
          key={index}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 6, ease: 'linear' }}
          style={{ height: '100%', background: 'var(--fire)', boxShadow: '0 0 10px var(--fire)' }}
        />
      </div>

      <div className="hero-dots" role="tablist" aria-label="Hero slides">
        {heroImages.map((slide, i) => (
          <button
            key={slide.title}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Show slide ${i + 1}: ${slide.title}`}
            className={`hero-dot ${i === index ? 'hero-dot--active' : 'hero-dot--idle'}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </section>
  );
};

export default CinematicHero;
