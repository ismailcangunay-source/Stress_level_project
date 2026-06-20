import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!email.trim()) {
      setError('Lütfen e-posta adresinizi girin.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSubmitted(true);
    } catch (err) {
      // Never reveal server details; show a generic message
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page-center">
      <Helmet>
        <title>Şifremi Unuttum | StressTahmin</title>
      </Helmet>

      <div className="auth-card card animate-fade-in-up">
        <div className="auth-header">
          <span className="auth-icon">🔑</span>
          <h2>Şifremi Unuttum</h2>
          <p>E-posta adresinizi girin, size sıfırlama bağlantısı gönderelim.</p>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✅</div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Eğer bu e-posta adresi sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
              Giriş Sayfasına Dön
            </Link>
          </div>
        ) : (
          <>
            {error && <div className="alert alert-error" role="alert">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="input-group">
                <label htmlFor="forgot-email">E-posta</label>
                <input
                  id="forgot-email"
                  type="email"
                  className="input"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
                  autoComplete="email"
                  disabled={loading}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? <span className="spinner" aria-hidden="true" /> : 'Sıfırlama Bağlantısı Gönder'}
              </button>
            </form>

            <p className="auth-footer">
              <Link to="/login">← Giriş Sayfasına Dön</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
