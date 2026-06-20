import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';
import './Auth.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!token) {
      setError('Geçersiz şifre sıfırlama bağlantısı. Lütfen yeni bir talepte bulunun.');
      return;
    }
    if (form.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Şifreler eşleşmiyor. Lütfen tekrar kontrol edin.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/reset-password', {
        token,
        new_password: form.password,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Bir hata oluştu. Bağlantı geçersiz veya süresi dolmuş olabilir.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page page-center">
        <Helmet><title>Şifre Sıfırlama | StressTahmin</title></Helmet>
        <div className="auth-card card animate-fade-in-up" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚠️</div>
          <h2>Geçersiz Bağlantı</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Bu şifre sıfırlama bağlantısı geçersiz. Lütfen yeni bir talepte bulunun.
          </p>
          <Link to="/forgot-password" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
            Yeni Talep Oluştur
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page page-center">
      <Helmet>
        <title>Yeni Şifre Belirle | StressTahmin</title>
      </Helmet>

      <div className="auth-card card animate-fade-in-up">
        <div className="auth-header">
          <span className="auth-icon">🔒</span>
          <h2>Yeni Şifre Belirle</h2>
          <p>Yeni şifrenizi girin.</p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✅</div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Şifreniz başarıyla güncellendi! Giriş sayfasına yönlendiriliyorsunuz…
            </p>
            <Link to="/login" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
              Giriş Yap
            </Link>
          </div>
        ) : (
          <>
            {error && <div className="alert alert-error" role="alert">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="input-group">
                <label htmlFor="reset-password">Yeni Şifre</label>
                <input
                  id="reset-password"
                  type="password"
                  name="password"
                  className="input"
                  placeholder="En az 6 karakter"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={loading}
                  required
                  minLength={6}
                />
              </div>

              <div className="input-group">
                <label htmlFor="reset-confirm">Şifreyi Onayla</label>
                <input
                  id="reset-confirm"
                  type="password"
                  name="confirm"
                  className="input"
                  placeholder="Şifrenizi tekrar girin"
                  value={form.confirm}
                  onChange={handleChange}
                  autoComplete="new-password"
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
                {loading ? <span className="spinner" aria-hidden="true" /> : 'Şifremi Güncelle'}
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
