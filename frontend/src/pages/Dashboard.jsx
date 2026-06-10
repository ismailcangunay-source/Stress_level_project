import { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import StressChart from '../components/StressChart';
import './Dashboard.css';

const getLevelInfo = (level) => {
  const map = {
    Low:    { emoji: '🟢', label: 'Düşük', class: 'low' },
    Medium: { emoji: '🟡', label: 'Orta',  class: 'medium' },
    High:   { emoji: '🔴', label: 'Yüksek', class: 'high' },
  };
  return map[level] || map.Medium;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError('');

    try {
      // Step 1: Validate session — if the cookie is expired/missing,
      // this will 401 BEFORE we try to load history data.
      // This is the critical fix: localStorage may have stale user data
      // but the HttpOnly cookie may be gone.
      try {
        await api.get('/auth/me');
      } catch (authErr) {
        if (authErr.response?.status === 401) {
          // Session is invalid — clean up and redirect
          logout();
          navigate('/login', { replace: true });
          return;
        }
        // Network error — don't block, try fetching data anyway
        console.warn('Session check failed (non-401), continuing...', authErr.message);
      }

      // Step 2: Fetch history and stats in parallel
      const [histRes, statsRes] = await Promise.all([
        api.get('/history'),
        api.get('/history/stats'),
      ]);

      setHistory(Array.isArray(histRes.data) ? histRes.data : []);
      setStats(statsRes.data || null);
    } catch (err) {
      console.error('Dashboard data fetch error:', err);

      if (err.response?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }

      // User-friendly error messages
      if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK') {
        setFetchError('Sunucuya bağlanılamadı. Lütfen bağlantınızı kontrol edin ve tekrar deneyin.');
      } else if (err.response?.status >= 500) {
        setFetchError('Sunucu hatası oluştu. Lütfen birkaç saniye sonra tekrar deneyin.');
      } else {
        setFetchError(
          err.response?.data?.detail ||
          'Veriler yüklenirken bir sorun oluştu. Lütfen sayfayı yenileyin veya tekrar deneyin.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    fetchData();
  }, [user, navigate, fetchData]);

  // ── Loading State ──
  if (loading) {
    return (
      <div className="dashboard-page page-wrapper">
        <div className="container">
          <div className="dashboard-loading">
            <div className="dashboard-loading__spinner">
              <div className="spinner" style={{ width: '48px', height: '48px' }} />
            </div>
            <p className="dashboard-loading__text">Verileriniz yükleniyor…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page page-wrapper">
      <Helmet>
        <title>Dashboard | StressTahmin - İstatistikler</title>
        <meta
          name="description"
          content="Kişisel stres test sonuçlarınız, yapay zeka analiz raporunuz ve tarihsel trendleriniz."
        />
      </Helmet>

      <div className="container">
        <div className="dashboard-header animate-fade-in-up">
          <div>
            <h1>📊 Dashboard</h1>
            <p>Stres geçmişiniz ve trendleriniz</p>
          </div>
          <Link to="/form" className="btn btn-primary">
            + Yeni Değerlendirme
          </Link>
        </div>

        {/* ── Error State ── */}
        {fetchError && (
          <div className="dashboard-error-card card animate-fade-in-up" role="alert">
            <div className="dashboard-error__icon">⚠️</div>
            <div className="dashboard-error__content">
              <h3>Veri Yüklenemedi</h3>
              <p>{fetchError}</p>
            </div>
            <button className="btn btn-primary" onClick={fetchData}>
              🔄 Tekrar Dene
            </button>
          </div>
        )}

        {!fetchError && (
          <>
            {/* Stats Cards */}
            <div className="dashboard-stats animate-fade-in-up stagger-1">
              <div className="stat-card card">
                <div className="stat-card__icon" style={{ background: 'rgba(139, 92, 246, 0.12)' }}>📈</div>
                <div className="stat-card__content">
                  <span className="stat-card__label">Son Skor</span>
                  <span className="stat-card__value">
                    {stats?.latest_score != null ? stats.latest_score.toFixed(1) : '—'}
                  </span>
                </div>
              </div>

              <div className="stat-card card">
                <div className="stat-card__icon" style={{ background: 'rgba(6, 182, 212, 0.12)' }}>📊</div>
                <div className="stat-card__content">
                  <span className="stat-card__label">Ortalama</span>
                  <span className="stat-card__value">
                    {stats?.average_score != null ? stats.average_score.toFixed(1) : '—'}
                  </span>
                </div>
              </div>

              <div className="stat-card card">
                <div className="stat-card__icon" style={{ background: 'rgba(16, 185, 129, 0.12)' }}>🧮</div>
                <div className="stat-card__content">
                  <span className="stat-card__label">Toplam Değerlendirme</span>
                  <span className="stat-card__value">{stats?.total_assessments || 0}</span>
                </div>
              </div>
            </div>

            {/* Chart - only render when there is enough data */}
            {history.length > 1 && (
              <div className="dashboard-chart card animate-fade-in-up stagger-2">
                <StressChart assessments={history} />
              </div>
            )}

            {/* History Table */}
            <div className="dashboard-history card animate-fade-in-up stagger-3">
              <h3>📋 Geçmiş Değerlendirmeler</h3>
              {history.length === 0 ? (
                <div className="dashboard-empty">
                  <div className="dashboard-empty__icon">📋</div>
                  <h4 className="dashboard-empty__title">Henüz değerlendirme yok</h4>
                  <p className="dashboard-empty__desc">
                    İlk stres analizinizi yaparak geçmiş verilerinizi ve trendlerinizi burada görmeye başlayın.
                  </p>
                  <Link to="/form" className="btn btn-primary mt-2">
                    🔍 İlk Değerlendirmenizi Yapın
                  </Link>
                </div>
              ) : (
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Tarih</th>
                        <th>Skor</th>
                        <th>Seviye</th>
                        <th>Model</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((a) => {
                        const info = getLevelInfo(a.predicted_stress_level);
                        const dateRaw = a.created_at || '';
                        const dateStr = (typeof dateRaw === 'string' && dateRaw.endsWith('Z'))
                          ? dateRaw
                          : dateRaw + 'Z';
                        return (
                          <tr key={a.id} className="animate-fade-in-up">
                            <td>
                              {new Date(dateStr).toLocaleDateString('tr-TR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="dashboard-table__score">
                              {a.stress_score_numeric?.toFixed(1) ?? '—'}
                            </td>
                            <td>
                              <span className={`badge badge-${info.class}`}>
                                {info.emoji} {info.label}
                              </span>
                            </td>
                            <td className="text-sm" style={{ color: 'var(--text-muted)' }}>
                              {a.model_used || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
