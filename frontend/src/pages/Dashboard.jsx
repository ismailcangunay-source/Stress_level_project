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
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Bu değerlendirmeyi silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/history/${id}`);
      setHistory(prev => prev.filter(a => a.id !== id));
      const statsRes = await api.get('/history/stats');
      setStats(statsRes.data || null);
    } catch (err) {
      alert('Silme işlemi başarısız oldu. Lütfen tekrar deneyin.');
    }
  };

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
            <h1>📊 Dashboard (Geçmiş)</h1>
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

            {/* ── 30-Day Insight ── */}
            {stats && stats.trend_status !== 'insufficient_data' && stats.last_30_days_average != null && stats.latest_score != null && (() => {
              const trendMap = {
                improving: { icon: '📉', color: '#10b981', text: 'Son değerlendirmeniz, son 1 aylık ortalama stres seviyenize göre daha iyi görünüyor. Bu, stres seviyenizin ortalamaya kıyasla azaldığını gösterebilir.' },
                worsening: { icon: '📈', color: '#f43f5e', text: 'Son değerlendirmeniz, son 1 aylık ortalama stres seviyenizin üzerinde. Bu, stres seviyenizin ortalamaya göre yükseldiğini gösterebilir.' },
                stable:    { icon: '📊', color: '#f59e0b', text: 'Son değerlendirmeniz, son 1 aylık ortalama stres seviyenize yakın görünüyor. Stres seviyeniz genel olarak dengeli ilerliyor.' },
              };
              const info = trendMap[stats.trend_status] || trendMap.stable;
              return (
                <div className="dashboard-insight card animate-fade-in-up stagger-2" style={{ borderLeft: `4px solid ${info.color}` }}>
                  <div className="dashboard-insight__row">
                    <div className="dashboard-insight__metric">
                      <span className="stat-card__label">Son Değerlendirme</span>
                      <span className="dashboard-insight__val" style={{ color: info.color }}>{stats.latest_score.toFixed(1)}</span>
                    </div>
                    <div className="dashboard-insight__metric">
                      <span className="stat-card__label">Son 1 Ay Ortalaması</span>
                      <span className="dashboard-insight__val">{stats.last_30_days_average.toFixed(1)}</span>
                    </div>
                    <div className="dashboard-insight__text">
                      <span style={{ fontSize: '1.5rem' }}>{info.icon}</span>
                      <p>{info.text}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {stats && stats.trend_status === 'insufficient_data' && (
              <div className="dashboard-insight card animate-fade-in-up stagger-2" style={{ borderLeft: '4px solid var(--border-glass)' }}>
                <div className="dashboard-insight__row">
                  <div className="dashboard-insight__text">
                    <span style={{ fontSize: '1.5rem' }}>ℹ️</span>
                    <p style={{ color: 'var(--text-muted)' }}>Henüz yeterli geçmiş kayıt bulunmadığı için ortalama karşılaştırması yapılamıyor.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Chart - only render when there is enough data */}
            {history.length > 1 && (
              <div className="dashboard-chart card animate-fade-in-up stagger-3">
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
                        <th>İşlem</th>
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
                          <tr key={a.id} className="animate-fade-in-up" onClick={() => setSelectedAssessment(a)}>
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
                            <td>
                              <button
                                className="btn-delete"
                                onClick={(e) => handleDelete(e, a.id)}
                              >
                                Sil
                              </button>
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

      {selectedAssessment && (
        <div className="dashboard-modal-overlay" onClick={() => setSelectedAssessment(null)}>
          <div className="dashboard-modal" onClick={e => e.stopPropagation()}>
            <button className="dashboard-modal-close" onClick={() => setSelectedAssessment(null)}>&times;</button>
            <h2>Değerlendirme Detayları</h2>
            <p><strong>Tarih:</strong> {new Date(selectedAssessment.created_at.endsWith('Z') ? selectedAssessment.created_at : selectedAssessment.created_at + 'Z').toLocaleString('tr-TR')}</p>
            <p>
              <strong>Sonuç:</strong> {selectedAssessment.stress_score_numeric?.toFixed(1)} / 100
              <span className={`badge badge-${getLevelInfo(selectedAssessment.predicted_stress_level).class}`} style={{ marginLeft: '8px' }}>
                {getLevelInfo(selectedAssessment.predicted_stress_level).emoji} {getLevelInfo(selectedAssessment.predicted_stress_level).label}
              </span>
            </p>
            <p><strong>Kullanılan Model:</strong> {selectedAssessment.model_used}</p>
            
            <h3 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '1.1rem' }}>Girdi Değerleri</h3>
            <div className="dashboard-modal-grid">
              <div><strong>Yaş</strong> <span>{selectedAssessment.age ?? '-'}</span></div>
              <div><strong>Çalışma (Saat)</strong> <span>{selectedAssessment.study_hours ?? '-'}</span></div>
              <div><strong>Devamlılık</strong> <span>{selectedAssessment.class_attendance ?? '-'}</span></div>
              <div><strong>Sınav Sıklığı</strong> <span>{selectedAssessment.exam_frequency ?? '-'}</span></div>
              <div><strong>Ödev Yükü</strong> <span>{selectedAssessment.assignment_load ?? '-'}</span></div>
              <div><strong>Uyku (Saat)</strong> <span>{selectedAssessment.sleep_hours ?? '-'}</span></div>
              <div><strong>Fiziksel Egzersiz</strong> <span>{selectedAssessment.physical_exercise ?? '-'}</span></div>
              <div><strong>Sosyal Medya</strong> <span>{selectedAssessment.social_media_use ?? '-'}</span></div>
              <div><strong>Ekran Süresi</strong> <span>{selectedAssessment.screen_time ?? '-'}</span></div>
              <div><strong>Akran Baskısı</strong> <span>{selectedAssessment.peer_pressure ?? '-'}</span></div>
              <div><strong>Aile Desteği</strong> <span>{selectedAssessment.family_support ?? '-'}</span></div>
              <div><strong>Kaygı Seviyesi</strong> <span>{selectedAssessment.anxiety_level ?? '-'}</span></div>
            </div>
            
            <div className="dashboard-modal-actions">
              <button className="btn-delete" onClick={(e) => {
                handleDelete(e, selectedAssessment.id);
                setSelectedAssessment(null);
              }}>
                Kaydı Sil
              </button>
              <button className="btn" onClick={() => setSelectedAssessment(null)} style={{ background: 'var(--bg-glass)', color: 'var(--text-primary)', border: '1px solid var(--border-glass)' }}>
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
