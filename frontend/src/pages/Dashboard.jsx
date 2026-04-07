import { useState, useEffect, useContext } from 'react';
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
  // Use AuthContext to determine login — NOT localStorage.access_token
  const { user } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    // If no user info in context at all, redirect immediately
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    let cancelled = false; // Prevent state update on unmounted component

    async function fetchData() {
      try {
        const [histRes, statsRes] = await Promise.all([
          api.get('/history'),
          api.get('/history/stats'),
        ]);
        if (!cancelled) {
          setHistory(histRes.data);
          setStats(statsRes.data);
        }
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        if (cancelled) return;
        if (err.response?.status === 401) {
          navigate('/login', { replace: true });
        } else {
          setFetchError('Veriler yüklenemedi. Lütfen sayfayı yenileyin.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [user, navigate]); // Only re-run when user changes

  if (loading) {
    return (
      <div className="page-center" style={{ paddingTop: '72px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }} />
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

        {fetchError && (
          <div className="alert alert-error mb-2" role="alert">{fetchError}</div>
        )}

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
              <p>Henüz değerlendirme yapılmamış.</p>
              <Link to="/form" className="btn btn-primary mt-2">
                İlk Değerlendirmenizi Yapın
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
                    const dateStr = a.created_at.endsWith('Z')
                      ? a.created_at
                      : a.created_at + 'Z';
                    return (
                      <tr key={a.id}>
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
      </div>
    </div>
  );
}
