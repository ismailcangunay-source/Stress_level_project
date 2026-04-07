import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Auth.css';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/register', {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Kayıt başarısız. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page-center">
      <div className="auth-card card animate-fade-in-up">
        <div className="auth-header">
          <span className="auth-icon">✨</span>
          <h2>Kayıt Ol</h2>
          <p>Ücretsiz hesap oluşturun ve değerlendirmenize başlayın</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="reg-name">Ad Soyad</label>
            <input
              id="reg-name"
              type="text"
              name="full_name"
              className="input"
              placeholder="İsmail Can Günay"
              value={form.full_name}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label htmlFor="reg-email">E-posta</label>
            <input
              id="reg-email"
              type="email"
              name="email"
              className="input"
              placeholder="ornek@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="reg-password">Şifre</label>
            <input
              id="reg-password"
              type="password"
              name="password"
              className="input"
              placeholder="En az 6 karakter"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <div className="input-group">
            <label htmlFor="reg-confirm">Şifre Tekrar</label>
            <input
              id="reg-confirm"
              type="password"
              name="confirmPassword"
              className="input"
              placeholder="Şifrenizi tekrar girin"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? <span className="spinner"></span> : 'Kayıt Ol'}
          </button>
        </form>

        <p className="auth-footer">
          Zaten hesabınız var mı? <Link to="/login">Giriş Yap</Link>
        </p>
      </div>
    </div>
  );
}
