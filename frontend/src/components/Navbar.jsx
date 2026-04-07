import { useState, useEffect, useContext, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout: contextLogout } = useContext(AuthContext);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Throttled scroll listener using requestAnimationFrame
  useEffect(() => {
    let rafId = null;
    const onScroll = () => {
      if (rafId) return; // Already scheduled — skip
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

  // Listen for forced logout events from the Axios interceptor
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
        </div>
      </div>
    </nav>
  );
}
