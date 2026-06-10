import { useState, useEffect, useContext, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

/* ── Sun SVG icon ── */
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

/* ── Moon SVG icon ── */
function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout: contextLogout } = useContext(AuthContext);
  const { theme, setDark, setLight } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Throttled scroll listener
  useEffect(() => {
    let rafId = null;
    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > 20);
        rafId = null;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  // Listen for forced logout events
  useEffect(() => {
    const handleForcedLogout = () => {
      contextLogout();
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, [contextLogout, navigate]);

  const logout = useCallback(() => {
    contextLogout();
    navigate('/', { replace: true });
  }, [contextLogout, navigate]);

  const isActive = useCallback(
    (path) => window.location.pathname === path,
    []
  );

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner container">
        <Link to="/" className="navbar__brand">
          <span className="navbar__icon" aria-hidden="true">🧠</span>
          <span className="navbar__title">StressTahmin</span>
        </Link>

        <button
          className="navbar__toggle"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
          aria-expanded={menuOpen}
        >
          <span className={`navbar__hamburger ${menuOpen ? 'open' : ''}`} />
        </button>

        <div className={`navbar__menu ${menuOpen ? 'navbar__menu--open' : ''}`}>
          <Link
            to="/"
            className={`navbar__link ${isActive('/') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            Ana Sayfa
          </Link>
          <a href="/#iletisim" className="navbar__link" onClick={() => setMenuOpen(false)}>
            İletişim
          </a>

          {user ? (
            <>
              <Link
                to="/form"
                className={`navbar__link ${isActive('/form') ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                Değerlendirme
              </Link>
              <Link
                to="/dashboard"
                className={`navbar__link ${isActive('/dashboard') ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <div className="navbar__user">
                <span className="navbar__user-name">{user.full_name || user.email}</span>
                <button className="btn btn-ghost" onClick={logout}>Çıkış</button>
              </div>
            </>
          ) : (
            <div className="navbar__auth">
              <Link to="/login" className="btn btn-ghost" onClick={() => setMenuOpen(false)}>
                Giriş
              </Link>
              <Link to="/register" className="btn btn-primary" onClick={() => setMenuOpen(false)}>
                Kayıt Ol
              </Link>
            </div>
          )}

          {/* ── Theme Toggle Buttons ── */}
          <div className="navbar__theme-btns" role="group" aria-label="Tema seçimi">
            <button
              id="theme-btn-dark"
              className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={setDark}
              aria-label="Koyu tema"
              aria-pressed={theme === 'dark'}
              title="Koyu Tema"
            >
              <MoonIcon />
            </button>
            <button
              id="theme-btn-light"
              className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={setLight}
              aria-label="Açık tema"
              aria-pressed={theme === 'light'}
              title="Açık Tema"
            >
              <SunIcon />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
