import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    // Stop the default HTML form submission (which causes page reload)
    e.preventDefault();
    e.stopPropagation();

    // Prevent duplicate submissions
    if (loading) return;

    // Basic client-side validation before hitting the server
    if (!form.email.trim() || !form.password.trim()) {
      setError('Lütfen e-posta ve şifreyi girin.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // FastAPI OAuth2PasswordRequestForm requires form-encoded body
      const params = new URLSearchParams();
      params.append('username', form.email.trim());
      params.append('password', form.password);

      await api.post('/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      // Cookie is now set by the backend.
      // Fetch the user profile to populate AuthContext.
      const userRes = await api.get('/auth/me');
      setUser(userRes.data); // also saves to localStorage via updated AuthContext

      // Navigate without full page reload
      navigate('/form', { replace: true });
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setError('Sunucu yanıt vermedi. Lütfen tekrar deneyin.');
      } else {
        setError(
          err.response?.data?.detail ||
          'Giriş başarısız. E-posta veya şifre hatalı.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page-center">
      <Helmet>
        <title>Giriş Yap | StressTahmin</title>
      </Helmet>

      <div className="auth-card card animate-fade-in-up">
        <div className="auth-header">
          <span className="auth-icon">🔐</span>
          <h2>Giriş Yap</h2>
          <p>Hesabınıza giriş yaparak devam edin</p>
        </div>

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        {/* onSubmit handles both Enter key and button click */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="input-group">
            <label htmlFor="login-email">E-posta</label>
            <input
              id="login-email"
              type="email"
              name="email"
              className="input"
              placeholder="ornek@email.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              disabled={loading}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="login-password">Şifre</label>
            <input
              id="login-password"
              type="password"
              name="password"
              className="input"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              disabled={loading}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? <span className="spinner" aria-hidden="true" /> : 'Giriş Yap'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Şifremi Unuttum
          </Link>
        </p>

        <p className="auth-footer">
          Hesabınız yok mu? <Link to="/register">Kayıt Ol</Link>
        </p>
      </div>
    </div>
  );
}
