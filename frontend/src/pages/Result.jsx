import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import ShapChart from '../components/ShapChart';
import './Result.css';

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const gaugeRef = useRef(null);
  const result = location.state?.result;

  useEffect(() => {
    if (!result) {
      navigate('/form');
    }
  }, [result, navigate]);

  useEffect(() => {
    if (result && gaugeRef.current) {
      const score = result.stress_score;
      const angle = (score / 100) * 251;
      const offset = 251 - angle;
      gaugeRef.current.style.strokeDashoffset = offset;
    }
  }, [result]);

  if (!result) return null;

  const { stress_level, stress_score, confidence, model_used, shap_values, recommendations } = result;

  const levelConfig = {
    Low: { emoji: '🟢', label: 'Düşük', color: 'var(--accent-emerald)', class: 'low' },
    Medium: { emoji: '🟡', label: 'Orta', color: 'var(--accent-amber)', class: 'medium' },
    High: { emoji: '🔴', label: 'Yüksek', color: 'var(--accent-rose)', class: 'high' },
  };

  const level = levelConfig[stress_level] || levelConfig.Medium;

  return (
    <div className="result-page page-wrapper">
      <Helmet>
        <title>Analiz Sonucu | StressTahmin</title>
        <meta name="description" content="AI tabanlı kişiselleştirilmiş stres analizinizin sonuçları ve tavsiyeler." />
      </Helmet>
      <div className="container">
        <div className="result-grid animate-fade-in-up">
          {/* Main Score */}
          <div className="result-score-card card">
            <h2>Stres Analizi Sonucu</h2>

            <div className="result-gauge">
              <svg viewBox="0 0 200 120" className="result-gauge__svg" role="img" aria-label="Stres seviyesi kadranı">
                <title>Stres Seviyesi Kadranı</title>
                <defs>
                  <linearGradient id="resultGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#f43f5e" />
                  </linearGradient>
                </defs>
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                <path
                  ref={gaugeRef}
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="url(#resultGrad)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray="251"
                  strokeDashoffset="251"
                  style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                />
                <text x="100" y="78" textAnchor="middle" fill={level.color} fontSize="36" fontWeight="800" fontFamily="Space Grotesk">
                  {Math.round(stress_score)}
                </text>
                <text x="100" y="100" textAnchor="middle" fill="#9ca3af" fontSize="11" fontFamily="Inter">
                  / 100
                </text>
              </svg>
            </div>

            <div className={`result-badge badge badge-${level.class}`}>
              {level.emoji} Stres Seviyesi: {level.label}
            </div>

            <div className="result-meta">
              <div className="result-meta__item">
                <span className="result-meta__label">Güven</span>
                <span className="result-meta__value">{(confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="result-meta__item">
                <span className="result-meta__label">Model</span>
                <span className="result-meta__value">{model_used}</span>
              </div>
            </div>
          </div>

          {/* SHAP Chart */}
          <div className="result-shap card">
            <ShapChart shapValues={shap_values} />
          </div>

          {/* Recommendations */}
          <div className="result-recs card">
            <h3>💡 Kişisel Öneriler</h3>
            <ul className="result-recs__list">
              {recommendations.map((rec, i) => (
                <li key={i} className="result-recs__item">
                  <span className="result-recs__bullet" aria-hidden="true">→</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="result-actions animate-fade-in-up stagger-3">
          <Link to="/dashboard" className="btn btn-primary btn-lg">
            📊 Dashboard'a Git
          </Link>
          <Link to="/form" className="btn btn-secondary btn-lg">
            🔄 Yeni Değerlendirme
          </Link>
        </div>
      </div>
    </div>
  );
}
