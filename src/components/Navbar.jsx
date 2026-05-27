import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
  const scrollTick = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollTick.current) return;
      scrollTick.current = window.requestAnimationFrame(() => {
        scrollTick.current = 0;
        setIsScrolled(window.scrollY > 50);
      });
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTick.current) cancelAnimationFrame(scrollTick.current);
    };
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

  return (
    <>
      <nav
        className={`nav-shell${isScrolled ? ' nav-shell--scrolled' : ''}`}
        aria-label="Primary"
      >
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
      </nav>

      <button
        type="button"
        className={`mobile-nav-backdrop${menuOpen ? ' is-open' : ''}`}
        aria-label="Close menu"
        aria-hidden={!menuOpen}
        tabIndex={menuOpen ? 0 : -1}
        onClick={() => setMenuOpen(false)}
      />

      <nav
        id="mobile-nav"
        className={`mobile-nav-panel${menuOpen ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!menuOpen}
      >
        {NAV_ITEMS.map((item) => (
          <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
            {item.label}
          </a>
        ))}
        <a href="/#contact" onClick={() => setMenuOpen(false)}>
          INQUIRE
        </a>
      </nav>
    </>
  );
};

export default Navbar;
