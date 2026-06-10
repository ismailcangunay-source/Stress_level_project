import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import ShapChart from '../components/ShapChart';
import './Result.css';

/* Risk interpretation data per level */
const riskInterpretation = {
  Low: {
    color: 'var(--accent-emerald)',
    bgClass: 'risk-interp--low',
    title: 'Kontrol Altında',
    summary: 'Stres düzeyiniz oldukça sağlıklı bir aralıkta. Bu, akademik ve sosyal dengenizi koruduğunuzu göstermektedir.',
    steps: [
      'Mevcut rutininizi ve alışkanlıklarınızı koruyun',
      'Dönemin yoğun bölümlerinde proaktif plan yapın',
      'Düzenli uyku ve fiziksel aktivitenizi sürdürün',
    ],
    support: 'Şu an için profesyonel desteğe ihtiyaç görünmüyor. Düzenli değerlendirmelerle gelişiminizi takip etmeye devam edin.',
    supportColor: 'rgba(16,185,129,0.10)',
    supportBorder: 'rgba(16,185,129,0.25)',
  },
  Medium: {
    color: 'var(--accent-amber)',
    bgClass: 'risk-interp--medium',
    title: 'Dikkat Edilmeli',
    summary: 'Belirli alanlarda stres yükü artmış durumda. Bu aşama ihmal edilmemeli; küçük müdahalelerle oldukça düzeltilebilir.',
    steps: [
      'SHAP grafiğinizdeki öne çıkan faktörlere odaklanın',
      'Günlük 20 dakikalık micro-dinlenme veya nefes egzersizi ekleyin',
      'Sosyal destek ağınızı aktif tutun; soyutlanmayın',
      'Bir sonraki sınavdan önce çalışma planı yapın',
    ],
    support: 'Üniversitenizin psikolojik danışmanlık birimiyle iletişime geçmek faydalı olabilir. Erken destek, gelişimi çok hızlandırır.',
    supportColor: 'rgba(245,158,11,0.08)',
    supportBorder: 'rgba(245,158,11,0.25)',
  },
  High: {
    color: 'var(--accent-rose)',
    bgClass: 'risk-interp--high',
    title: 'Acilen Ele Alınmalı',
    summary: 'Stres yükü kritik seviyede. Fiziksel ve zihinsel sağlık üzerinde olumsuz etkiler hissedilebilir veya zaten hissediliyor olabilir.',
    steps: [
      'Önceliklerinizi bir kağıda çıkarıp yeniden değerlendirin',
      'Akademik danışman veya öğrenci işleriyle en kısa sürede görüşün',
      'Sosyal medya ve ekran sürenizi acil olarak azaltın',
      'Uyku düzeninize öncelik verin; düzensiz uyku stresi 2 katlar',
    ],
    support: 'Profesyonel psikolojik destek almanız önemle tavsiye edilir. Bu system bir tanı aracı değildir; yüksek skor durumunda lütfen bir uzmana başvurun.',
    supportColor: 'rgba(244,63,94,0.08)',
    supportBorder: 'rgba(244,63,94,0.25)',
  },
};

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const gaugeRef = useRef(null);
  const result = location.state?.result;
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!result) navigate('/form', { replace: true });
  }, [result, navigate]);

  // Staggered entrance animation
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    }
  }, [result]);

  // Animate gauge
  useEffect(() => {
    if (result && gaugeRef.current) {
      const timer = setTimeout(() => {
        const score = result.stress_score;
        const angle = (score / 100) * 251;
        const offset = 251 - angle;
        gaugeRef.current.style.strokeDashoffset = offset;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [result]);

  if (!result) return null;

  const { stress_level, stress_score, model_used, shap_values, recommendations } = result;

  const levelConfig = {
    Low:    { emoji: '🟢', label: 'Düşük',  color: 'var(--accent-emerald)', class: 'low' },
    Medium: { emoji: '🟡', label: 'Orta',   color: 'var(--accent-amber)',   class: 'medium' },
    High:   { emoji: '🔴', label: 'Yüksek', color: 'var(--accent-rose)',    class: 'high' },
  };

  const level = levelConfig[stress_level] || levelConfig.Medium;
  const interp = riskInterpretation[stress_level] || riskInterpretation.Medium;
  const now = new Date();
  const dateStr = now.toLocaleDateString('tr-TR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className={`result-page page-wrapper ${showContent ? 'result-page--visible' : ''}`}>
      <Helmet>
        <title>Analiz Sonucu | StressTahmin</title>
        <meta name="description" content="AI tabanlı kişiselleştirilmiş stres analizinizin sonuçları ve tavsiyeler." />
      </Helmet>

      <div className="container">

        {/* ── Hero: Success Banner ── */}
        <div className="result-success-banner animate-fade-in-up">
          <div className="result-success-banner__icon">✅</div>
          <div>
            <h2 className="result-success-banner__title">Analiz Tamamlandı</h2>
            <p className="result-success-banner__sub">Yapay zeka modeliniz sonuçlarınızı başarıyla hesapladı.</p>
          </div>
        </div>

        <div className="result-grid animate-fade-in-up stagger-1">

          {/* ── Main Score Card ── */}
          <div className="result-score-card card">
            <h2>Stres Analizi Sonucu</h2>

            <div className="result-gauge">
              <svg viewBox="0 0 200 120" className="result-gauge__svg" role="img" aria-label="Stres seviyesi kadranı">
                <title>Stres Seviyesi Kadranı</title>
                <defs>
                  <linearGradient id="resultGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="#10b981" />
                    <stop offset="50%"  stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#f43f5e" />
                  </linearGradient>
                </defs>
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" strokeLinecap="round"/>
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
                <text x="100" y="100" textAnchor="middle" fill="#9ca3af" fontSize="11" fontFamily="Inter">/ 100</text>
              </svg>
            </div>

            <div className={`result-badge badge badge-${level.class}`}>
              {level.emoji} Stres Seviyesi: {level.label}
            </div>

            <div className="result-meta">
              <div className="result-meta__item">
                <span className="result-meta__label">Model</span>
                <span className="result-meta__value">{model_used}</span>
              </div>
            </div>
          </div>

          {/* ── SHAP Chart ── */}
          <div className="result-shap card">
            <ShapChart shapValues={shap_values} />
          </div>

          {/* ── Recommendations ── */}
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

        {/* ── Risk Interpretation Block ── */}
        <div className={`result-interp card animate-fade-in-up stagger-2 ${interp.bgClass}`}>
          <div className="result-interp__header">
            <div>
              <div className="result-interp__eyebrow">Sonucun Anlamı</div>
              <h3 className="result-interp__title" style={{ color: interp.color }}>{interp.title}</h3>
            </div>
            <span className="result-interp__emoji" aria-hidden="true">{level.emoji}</span>
          </div>
          <p className="result-interp__summary">{interp.summary}</p>

          <div className="result-interp__body">
            <div className="result-interp__steps">
              <div className="result-interp__section-label">Önerilen Adımlar</div>
              <ul>
                {interp.steps.map((step, i) => (
                  <li key={i}>
                    <span aria-hidden="true" style={{ color: interp.color }}>→</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            <div className="result-interp__support" style={{ background: interp.supportColor, borderColor: interp.supportBorder }}>
              <span className="result-interp__support-icon" aria-hidden="true">🤝</span>
              <div>
                <strong>Profesyonel Destek</strong>
                <p>{interp.support}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3-Model Comparison ── */}
        <div className="result-comparison card animate-fade-in-up stagger-3">
          <div className="result-comparison__header">
            <h3>🤖 Model Karşılaştırması (Eğitim Metrikleri)</h3>
            <p>StressTahmin projesinde 3 farklı makine öğrenmesi modeli eğitilmiş ve analiz edilmiştir. Size en uygun sonuç için en dengeli performansı gösteren algoritma seçilmiştir.</p>
          </div>
          <div className="result-comparison__grid">
            <div className={`comp-card ${model_used === 'LogisticRegression' ? 'comp-card--active' : ''}`}>
              <div className="comp-card__name">Logistic Regression</div>
              <div className="comp-card__metric">
                <span className="comp-card__m-val">~86.2%</span>
                <span className="comp-card__m-lbl">Accuracy</span>
              </div>
              {model_used === 'LogisticRegression' && <div className="comp-card__badge">Seçilen Model</div>}
              <p className="comp-card__desc">Açıklanabilirliği en yüksek ve en dengeli model.</p>
            </div>
            
            <div className={`comp-card ${model_used === 'RandomForestClassifier' || model_used === 'RandomForest' ? 'comp-card--active' : ''}`}>
              <div className="comp-card__name">Random Forest</div>
              <div className="comp-card__metric">
                <span className="comp-card__m-val">~91.5%</span>
                <span className="comp-card__m-lbl">Accuracy</span>
              </div>
              {(model_used === 'RandomForestClassifier' || model_used === 'RandomForest') && <div className="comp-card__badge">Seçilen Model</div>}
              <p className="comp-card__desc">Aşırı öğrenmeye (overfitting) yatkın kompleks ağaç yapısı.</p>
            </div>

            <div className={`comp-card ${model_used === 'XGBClassifier' || model_used === 'XGBoost' ? 'comp-card--active' : ''}`}>
              <div className="comp-card__name">XGBoost</div>
              <div className="comp-card__metric">
                <span className="comp-card__m-val">~92.8%</span>
                <span className="comp-card__m-lbl">Accuracy</span>
              </div>
              {(model_used === 'XGBClassifier' || model_used === 'XGBoost') && <div className="comp-card__badge">Seçilen Model</div>}
              <p className="comp-card__desc">Performansı yüksek ancak SHAP uyumu daha ağır olan model.</p>
            </div>
          </div>
        </div>

        {/* ── Technical Summary ── */}
        <div className="result-tech card animate-fade-in-up stagger-3">
          <h3>🔬 Teknik Özet</h3>
          <div className="result-tech__grid">
            <div className="result-tech__item">
              <span className="result-tech__label">Görevi Yapan Model</span>
              <span className="result-tech__value">{model_used}</span>
            </div>
            <div className="result-tech__item">
              <span className="result-tech__label">Stres Skoru</span>
              <span className="result-tech__value">{stress_score.toFixed(2)} / 100</span>
            </div>
            <div className="result-tech__item">
              <span className="result-tech__label">Analiz Tarihi</span>
              <span className="result-tech__value">{dateStr}</span>
            </div>
            <div className="result-tech__item">
              <span className="result-tech__label">Sınıflandırma</span>
              <span className="result-tech__value">{level.label} ({stress_level})</span>
            </div>
            <div className="result-tech__item">
              <span className="result-tech__label">SHAP Faktörler</span>
              <span className="result-tech__value">{shap_values ? Object.keys(shap_values).length : 0} özellik</span>
            </div>
          </div>
        </div>

        {/* ── Disclaimer notice ── */}
        <div className="result-disclaimer animate-fade-in-up stagger-3">
          <span aria-hidden="true">⚠️</span>
          <p>Bu sonuç yalnızca farkındalık ve destek amacıyla üretilmiştir. Klinik tanı değildir. Yüksek stres belirtileri durumunda lütfen bir ruh sağlığı uzmanına başvurun.</p>
        </div>

        {/* ── Actions ── */}
        <div className="result-actions animate-fade-in-up stagger-4">
          <Link to="/dashboard" className="btn btn-primary btn-lg" id="result-go-dashboard">📊 Dashboard'a Git</Link>
          <Link to="/form" className="btn btn-secondary btn-lg" id="result-new-analysis">🔄 Yeni Analiz Yap</Link>
        </div>
      </div>
    </div>
  );
}
