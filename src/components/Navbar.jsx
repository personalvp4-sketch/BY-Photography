import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.webp';

const NAV_ITEMS = [
  { label: 'Portfolio', href: '/#portfolio' },
  { label: 'Services', href: '/#services' },
  { label: 'Process', href: '/#process' },
  { label: 'About', href: '/#about' },
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const navBar = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    zIndex: 50,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 'clamp(12px, 4vw, 20px)',
    paddingRight: 'clamp(12px, 4vw, 20px)',
    paddingTop: isScrolled ? 14 : 24,
    paddingBottom: isScrolled ? 14 : 24,
    backgroundColor: isScrolled ? 'var(--obsidian)' : 'transparent',
    borderBottom: isScrolled ? '1px solid rgba(255, 69, 0, 0.2)' : '1px solid transparent',
    boxShadow: isScrolled ? '0 4px 20px rgba(0, 0, 0, 0.45)' : 'none',
    transition:
      'background-color 0.35s ease, padding 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease',
  };

  return (
    <>
      <motion.nav initial={{ y: -100 }} animate={{ y: 0 }} style={navBar}>
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: 1440,
            width: '100%',
          }}
        >
          <Link
            to="/"
            style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}
            onClick={() => setMenuOpen(false)}
          >
            <img className="nav-logo" src={logo} alt="BY Photography" />
            <span className="nav-brand-text">BY PHOTOGRAPHY</span>
          </Link>

          <div className="nav-links">
            {NAV_ITEMS.map((item) => (
              <a key={item.href} href={item.href} className="nav-link">
                {item.label}
              </a>
            ))}
            <a href="/#contact" className="fire-border" style={{ textDecoration: 'none' }}>
              <span
                style={{
                  display: 'inline-block',
                  background: 'var(--fire)',
                  color: 'var(--obsidian)',
                  border: 'none',
                  padding: '12px 22px',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 700,
                  borderRadius: 4,
                  fontSize: '0.85rem',
                  letterSpacing: '0.06em',
                  boxShadow: '0 0 20px var(--fire-glow)',
                  transition: 'var(--transition-smooth)',
                }}
              >
                INQUIRE
              </span>
            </a>
          </div>

          <button
            type="button"
            className="mobile-nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              key="nav-backdrop"
              type="button"
              aria-label="Close menu"
              className="mobile-nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.nav
              key="nav-panel"
              id="mobile-nav"
              className="mobile-nav-panel"
              role="dialog"
              aria-modal="true"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <a href="/#contact" onClick={() => setMenuOpen(false)}>
                INQUIRE
              </a>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
