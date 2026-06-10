import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import './Home.css';

/* ────────────────────────────────────────────────────────────── */
/* Mock Membership Modal                                           */
/* ────────────────────────────────────────────────────────────── */
function MembershipModal({ plan, onClose }) {
  if (!plan) return null;
  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Üyelik bilgisi">
      <div className="modal-box card-glass animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Kapat">✕</button>
        <div className="modal-icon" aria-hidden="true">{plan.icon}</div>
        <h3 className="modal-title">{plan.name} Planı</h3>
        <p className="modal-subtitle">
          Bu ödeme akışı şu anda <strong>demo modundadır</strong>. Gerçek bir ücretlendirme yapılmamaktadır.
        </p>
        <div className="modal-price">
          <span className="modal-price__amount">₺0</span>
          <span className="modal-price__period">/ ay</span>
        </div>
        <ul className="modal-features">
          {plan.features.map((f, i) => (
            <li key={i}><span className="modal-check" aria-hidden="true">✓</span>{f}</li>
          ))}
        </ul>
        <div className="modal-notice">
          <span aria-hidden="true">🔔</span>
          <p>Ücretli planlar, platform canlıya alındığında devreye girecektir. Şu anda tüm özellikler ücretsiz kullanılabilir.</p>
        </div>
        <button className="btn btn-primary btn-full modal-cta" onClick={onClose}>
          Anladım, Devam Et
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/* Data                                                            */
/* ────────────────────────────────────────────────────────────── */
const membershipPlans = [
  {
    id: 'free',
    icon: '🆓',
    name: 'Ücretsiz',
    badge: null,
    price: '₺0',
    period: '/ ay, sonsuza kadar',
    accentClass: 'plan-free',
    features: [
      'Aylık 3 stres analizi',
      'Temel stres skoru',
      'AI öneriler (kısa)',
      'Geçmiş görüntüleme (son 3)',
    ],
  },
  {
    id: 'gold',
    icon: '⭐',
    name: 'Altın',
    badge: 'Popüler',
    price: '₺0',
    period: '/ ay (demo)',
    accentClass: 'plan-gold',
    features: [
      'Sınırsız stres analizi',
      'SHAP faktör analizi',
      'Haftalık trend raporu',
      'Detaylı AI öneriler',
      'Tüm geçmişe erişim',
    ],
  },
  {
    id: 'vip',
    icon: '👑',
    name: 'VIP',
    badge: 'Tam Erişim',
    price: '₺0',
    period: '/ ay (demo)',
    accentClass: 'plan-vip',
    features: [
      'Altın planın tümü',
      'Aylık PDF raporu',
      'Öncelikli destek',
      'Erken beta özellikleri',
      'Akademik veri çıktısı',
    ],
  },
];

const stressFactors = [
  { icon: '📚', label: 'Akademik Yük', desc: 'Ders yoğunluğu ve genel akademik baskı' },
  { icon: '📝', label: 'Sınav Sıklığı', desc: 'Dönem içi sınav ve quiz sayısı' },
  { icon: '📋', label: 'Ödev Yoğunluğu', desc: 'Verilen ödevlerin zorluğu ve sıklığı' },
  { icon: '😴', label: 'Uyku Alışkanlıkları', desc: 'Günlük uyku süresi ve kalitesi' },
  { icon: '🏃', label: 'Fiziksel Aktivite', desc: 'Düzenli egzersiz ve hareket alışkanlığı' },
  { icon: '📱', label: 'Sosyal Medya', desc: 'Günlük sosyal medya kullanım süresi' },
  { icon: '💻', label: 'Ekran Süresi', desc: 'Toplam dijital cihaz kullanım süresi' },
  { icon: '👥', label: 'Akran Baskısı', desc: 'Yaşıtlardan gelen sosyal baskı algısı' },
  { icon: '🏠', label: 'Aile Desteği', desc: 'Aileden alınan duygusal ve maddi destek' },
  { icon: '😰', label: 'Anksiyete Düzeyi', desc: 'Genel kaygı ve stres algısı' },
];

const valuePropItems = [
  { icon: '🎯', title: 'Stres Seviyesi Tahmini', desc: 'Makine öğrenmesi modeli cevabını 10 faktör üzerinden analiz eder ve sizi Low / Medium / High olarak sınıflandırır.' },
  { icon: '📈', title: 'İlerleme Takibi', desc: 'Zaman içinde yaptığınız tüm değerlendirmeleri Dashboard\'da grafik ve tablo olarak görüntüleyin.' },
  { icon: '🔍', title: 'Risk Alanlarını Anlama', desc: 'SHAP değerleri ile hangi faktörlerin stresi en çok artırdığını öğrenin; kör noktalarınızı tespit edin.' },
  { icon: '💡', title: 'Kişisel Öneriler', desc: 'Sonuçlarınıza göre üretilen, yapay zeka destekli kısa ve uygulanabilir öneri listesi alın.' },
  { icon: '📂', title: 'Geçmiş Analizler', desc: 'Tüm eski değerlendirmelerinizi kayıt altında tutun; geçmiş trendleri karşılaştırın.' },
];

const riskLevels = [
  {
    level: 'Düşük',
    emoji: '🟢',
    color: 'risk-low',
    score: '0 – 40',
    meaning: 'Stres düzeyiniz kontrol altında. Akademik ve sosyal denge oldukça sağlıklı görünüyor.',
    recommendations: ['Mevcut rutininizi koruyun', 'Düzenli uyku ve egzersiz alışkanlığını sürdürün', 'Dönemin yoğun bölümlerinde proaktif kalın'],
    support: 'Şu an profesyonel desteğe ihtiyaç görünmüyor. Ancak erken dönemde farkındalık önemlidir.',
  },
  {
    level: 'Orta',
    emoji: '🟡',
    color: 'risk-medium',
    score: '41 – 70',
    meaning: 'Belirli alanlarda stres yükü artmış. Bu aşama ihmal edilmemeli; müdahale edilebilir bir bölgedir.',
    recommendations: ['SHAP grafiğinizde öne çıkan faktörlere odaklanın', 'Günlük 20 dakika dinlenme / nefes egzersizi ekleyin', 'Sosyal destek ağınızı aktif tutun'],
    support: 'Üniversitenizin psikolojik danışmanlık birimiyle iletişime geçmek faydalı olabilir.',
  },
  {
    level: 'Yüksek',
    emoji: '🔴',
    color: 'risk-high',
    score: '71 – 100',
    meaning: 'Stres yükü kritik seviyede. Fiziksel ve zihinsel sağlık üzerinde olumsuz etkiler oluşabilir.',
    recommendations: ['Önceliklerinizi hemen yeniden değerlendirin', 'Akademik danışman veya öğrenci işleriyle görüşün', 'Dijital detoks ve uyku düzeni acil öncelik'],
    support: 'Profesyonel psikolojik destek alın. Bu sistem bir tanı aracı değildir; uzman yönlendirmesi şarttır.',
  },
];

const academicCards = [
  {
    icon: '📖',
    title: 'Akademik Temele Dayalı',
    desc: 'Seçilen değişkenler öğrenci stresi üzerine yapılmış araştırmalarda anlamlı bulunan faktörlerle örtüşmektedir.',
  },
  {
    icon: '🔢',
    title: 'Çok Boyutlu Yaklaşım',
    desc: 'Stres tek bir değişkene indirgenemez; bu platform akademik, sosyal, biyolojik ve dijital boyutların tümünü kapsar.',
  },
  {
    icon: '🤖',
    title: 'ML Tabanlı Tahmin',
    desc: 'Makine öğrenmesi yöntemleri akademik çalışmalarda stres sınıflandırması için etkin biçimde kullanılmaktadır.',
  },
  {
    icon: '🏛️',
    title: 'Bitirme Projesi',
    desc: 'Bu platform İstanbul Topkapı Üniversitesi\'nde Dr. Öğr. Üyesi Gökalp Tulum danışmanlığında geliştirilmiştir.',
  },
];

/* ────────────────────────────────────────────────────────────── */
/* Component                                                       */
/* ────────────────────────────────────────────────────────────── */
export default function Home() {
  const { user } = useContext(AuthContext);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [dynamicScore, setDynamicScore] = useState(null);
  const [animReady, setAnimReady] = useState(false);

  useEffect(() => {
    // Start animation lightly after mount
    const timer = setTimeout(() => setAnimReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;
    if (user) {
      api.get('/history/stats')
        .then((res) => {
          if (active && res.data && res.data.average_score != null) {
            setDynamicScore(Math.round(res.data.average_score));
          }
        })
        .catch(() => {});
    }
    return () => { active = false; };
  }, [user]);

  const displayScore = dynamicScore !== null ? dynamicScore : 64;
  const dashOffset = 251 - (251 * displayScore) / 100;
  
  let levelBadge = "🟡 Orta Stres Seviyesi";
  if (dynamicScore !== null) {
    if (dynamicScore <= 40) levelBadge = "🟢 Düşük Stres Seviyesi";
    else if (dynamicScore <= 70) levelBadge = "🟡 Orta Stres Seviyesi";
    else levelBadge = "🔴 Yüksek Stres Seviyesi";
  }

  return (
    <div className="home">
      <Helmet>
        <title>Ana Sayfa | StressTahmin — AI Destekli Stres Analizi</title>
        <meta name="description" content="Üniversite öğrencileri için yapay zeka destekli stres tahmin ve ölçüm sistemi. Stres seviyenizi analiz edin, risk alanlarınızı öğrenin." />
      </Helmet>

      {/* ── Membership Modal ── */}
      <MembershipModal
        plan={selectedPlan ? membershipPlans.find(p => p.id === selectedPlan) : null}
        onClose={() => setSelectedPlan(null)}
      />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* HERO                                                     */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="glass-hero container" aria-label="Ana başlık">
        <div className="hero-content">

          {/* Left — Text */}
          <div className="hero-text animate-fade-in-up">
            <span className="hero__badge">✨ Yapay Zeka Destekli Stres Analizi</span>
            <h1 className="hero__title">
              Stresini Anla,<br />
              <span className="text-nebula">Kontrolü Geri Al.</span>
            </h1>
            <p className="hero__desc">
              10 faktör, makine öğrenmesi ve SHAP değerleri — stres seviyenizi bilimsel temelde ölçün, risk alanlarınızı öğrenin ve kişisel öneriler alın.
            </p>
            <div className="hero-actions">
              <Link to="/form" id="hero-cta-analyze" className="btn btn-primary glow-btn" style={{ transform: 'scale(1.05)' }}>
                🚀 Analizi Başlat
              </Link>
              <Link to="/register" id="hero-cta-register" className="btn btn-secondary">
                Ücretsiz Kayıt Ol
              </Link>
            </div>
          </div>

          {/* Right — Product Preview Visuals */}
          <div className="hero-visuals animate-fade-in-up stagger-2" aria-hidden="true">

            {/* ── Main Card: Stress Analysis Preview ── */}
            <div className="card-glass hero-card-main">
              <div className="hero-card__header">
                <span className="hero-card__label">Stres Analiz Sonucu</span>
                <span className="hero-card__dot hero-card__dot--pulse" />
              </div>

              {/* Gauge */}
              <div className="hero__gauge-wrapper">
                <svg viewBox="0 0 200 120" className="hero__gauge-svg" role="img" aria-label="Örnek stres skoru">
                  <title>Örnek Stres Skoru Göstergesi</title>
                  <defs>
                    <linearGradient id="nebulaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%"   stopColor="#10b981" />
                      <stop offset="50%"  stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#f43f5e" />
                    </linearGradient>
                  </defs>
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" strokeLinecap="round"/>
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="url(#nebulaGrad)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray="251"
                    className="hero__gauge-fill"
                    style={{ 
                      strokeDashoffset: animReady ? dashOffset : 251,
                      transition: 'stroke-dashoffset 2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  />
                  <text x="100" y="82" textAnchor="middle" fill="var(--text-primary)" fontSize="34" fontWeight="800" fontFamily="Space Grotesk">{displayScore}</text>
                  <text x="100" y="102" textAnchor="middle" fill="var(--text-muted)" fontSize="11" fontFamily="Inter">Stres Skoru / 100</text>
                </svg>
              </div>

              <div className="hero-card__level-badge">{levelBadge}</div>

              {/* Factor Bars */}
              <div className="hero-card__factors">
                <div className="hero-factor-row">
                  <span className="hero-factor__name">😴 Uyku Kalitesi</span>
                  <div className="hero-factor__bar-wrap">
                    <div className="hero-factor__bar hero-factor__bar--high" style={{width:'78%'}} />
                  </div>
                  <span className="hero-factor__tag tag-high">Yüksek Etki</span>
                </div>
                <div className="hero-factor-row">
                  <span className="hero-factor__name">📚 Sınav Yoğunluğu</span>
                  <div className="hero-factor__bar-wrap">
                    <div className="hero-factor__bar hero-factor__bar--med" style={{width:'55%'}} />
                  </div>
                  <span className="hero-factor__tag tag-med">Orta Etki</span>
                </div>
                <div className="hero-factor-row">
                  <span className="hero-factor__name">📱 Sosyal Medya</span>
                  <div className="hero-factor__bar-wrap">
                    <div className="hero-factor__bar hero-factor__bar--med" style={{width:'42%'}} />
                  </div>
                  <span className="hero-factor__tag tag-low">Düşük Etki</span>
                </div>
              </div>
            </div>

            {/* ── Side Column for Smaller Cards ── */}
            <div className="hero-side-column">
              
              {/* ── Floating Card: Weekly Trend ── */}
              <div className="card-glass hero-card-trend">
              <div className="hero-trend__header">
                <span className="hero-trend__title">📈 Haftalık Trend</span>
                <span className="hero-trend__period">Son 30 gün</span>
              </div>
              {/* Mini sparkline SVG */}
              <svg viewBox="0 0 160 50" className="hero-sparkline" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35"/>
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <path d="M0 38 L26 32 L53 40 L80 22 L107 28 L134 15 L160 20" fill="none" stroke="url(#sparklineStroke)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="sparklineStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="#06b6d4"/>
                    <stop offset="100%" stopColor="#8b5cf6"/>
                  </linearGradient>
                </defs>
                <path d="M0 38 L26 32 L53 40 L80 22 L107 28 L134 15 L160 20 L160 50 L0 50 Z" fill="url(#sparkGrad)"/>
                {/* Data points */}
                {[[0,38],[26,32],[53,40],[80,22],[107,28],[134,15],[160,20]].map(([x,y],i) => (
                  <circle key={i} cx={x} cy={y} r="2.5" fill="#8b5cf6"/>
                ))}
              </svg>
              <div className="hero-trend__stat">
                <span className="hero-trend__stat-value trend-down">▼ 8 puan</span>
                <span className="hero-trend__stat-label">Ay başından bu yana azaldı</span>
              </div>
            </div>

            {/* ── AI Tip Bubble ── */}
            <div className="card-glass hero-card-tip">
              <div className="hero-tip__icon">💡</div>
              <div>
                <div className="hero-tip__title">AI Önerisi</div>
                <p className="hero-tip__text">Uyku sürenizi 30 dk artırmak stres skorunuzu yaklaşık 6 puan düşürebilir.</p>
              </div>
            </div>

            </div> {/* End Side Column */}

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* VALUE PROPOSITION                                        */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="section-value container" aria-labelledby="value-heading">
        <div className="section-header animate-fade-in-up">
          <span className="section-eyebrow">Platform Size Ne Verir?</span>
          <h2 id="value-heading">Tek Analizin Ötesinde,<br/><span className="text-nebula">Kapsamlı Farkındalık</span></h2>
          <p className="section-subtitle">Stres tahmini yalnızca başlangıç. Asıl değer, zaman içinde kendinizi tanımanızda gizli.</p>
        </div>
        <div className="value-grid animate-fade-in-up stagger-1">
          {valuePropItems.map((item, i) => (
            <div key={i} className="value-card card-glass">
              <div className="value-card__icon" aria-hidden="true">{item.icon}</div>
              <h3 className="value-card__title">{item.title}</h3>
              <p className="value-card__desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider container" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* STRESS FACTORS                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="section-factors container" aria-labelledby="factors-heading">
        <div className="section-header animate-fade-in-up">
          <span className="section-eyebrow">Analiz Edilen Faktörler</span>
          <h2 id="factors-heading">10 Boyutuyla<br/><span className="text-nebula">Stres Haritanız</span></h2>
          <p className="section-subtitle">Platform, stres üzerinde etkili olduğu araştırmalarla desteklenmiş 10 faktörü analiz ederek kapsamlı bir tablo sunar.</p>
        </div>
        <div className="factors-grid animate-fade-in-up stagger-1">
          {stressFactors.map((f, i) => (
            <div key={i} className="factor-card card-glass">
              <span className="factor-card__icon" aria-hidden="true">{f.icon}</span>
              <div>
                <div className="factor-card__label">{f.label}</div>
                <p className="factor-card__desc">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider container" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* RISK INTERPRETATION                                       */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="section-risk container" aria-labelledby="risk-heading">
        <div className="section-header animate-fade-in-up">
          <span className="section-eyebrow">Sonucun Anlamı</span>
          <h2 id="risk-heading">Stres Düzeyiniz<br/><span className="text-nebula">Ne Anlama Geliyor?</span></h2>
          <p className="section-subtitle">Analiz sonucunuzu nasıl yorumlamalısınız? Her seviye için ne anlama geldiğini, neler yapmanız gerektiğini ve destek almanızın ne zaman önemli olduğunu öğrenin.</p>
        </div>
        <div className="risk-grid animate-fade-in-up stagger-1">
          {riskLevels.map((r, i) => (
            <div key={i} className={`risk-card card-glass ${r.color}`}>
              <div className="risk-card__header">
                <span className="risk-card__emoji" aria-hidden="true">{r.emoji}</span>
                <div>
                  <h3 className="risk-card__level">{r.level} Stres</h3>
                  <span className="risk-card__score">Skor: {r.score}</span>
                </div>
              </div>
              <p className="risk-card__meaning">{r.meaning}</p>
              <div className="risk-card__recs-title">Önerilen Adımlar</div>
              <ul className="risk-card__recs">
                {r.recommendations.map((rec, j) => (
                  <li key={j}><span aria-hidden="true">→</span> {rec}</li>
                ))}
              </ul>
              <div className="risk-card__support">
                <span className="risk-card__support-icon" aria-hidden="true">🤝</span>
                <p>{r.support}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider container" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* FEATURES (existing, improved)                            */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="features-section container" aria-labelledby="features-heading">
        <div className="section-header features-header animate-fade-in-up">
          <span className="section-eyebrow">Neden StressTahmin?</span>
          <h2 id="features-heading">Güçlü Araçlar,<br/><span className="text-nebula">Net Sonuçlar</span></h2>
        </div>
        <div className="features-grid">
          {[
            { icon: '🧠', title: 'Yapay Zeka Analizi', desc: 'Makine öğrenmesi modeli 10 faktörü analiz ederek stres seviyenizi yüksek doğrulukla tahmin eder.' },
            { icon: '📊', title: 'SHAP Faktör Grafiği', desc: 'Hangi faktörün strese en fazla katkıda bulunduğunu açıklanabilir yapay zeka ile öğrenin.' },
            { icon: '🔐', title: 'Veri Güvenliği', desc: 'Verileriniz bcrypt şifreleme ile korunur; üçüncü taraflarla asla paylaşılmaz.' },
          ].map((f, i) => (
            <div key={i} className={`card-glass feature-glass-card animate-fade-in-up stagger-${i + 2}`}>
              <div className="feature__icon" aria-hidden="true">{f.icon}</div>
              <h3 className="feature__title">{f.title}</h3>
              <p className="feature__desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider container" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MEMBERSHIP PLANS                                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="section-membership container" id="uyelik" aria-labelledby="membership-heading">
        <div className="section-header animate-fade-in-up">
          <span className="section-eyebrow">Üyelik Planları</span>
          <h2 id="membership-heading">Tüm Planlar<br/><span className="text-nebula">Şimdilik Ücretsiz</span></h2>
          <p className="section-subtitle">Platform demo aşamasındadır. Tüm özellikler şu anda ücretsiz kullanılabilir. Canlı sürümde plan detayları güncellenecektir.</p>
        </div>
        <div className="membership-grid animate-fade-in-up stagger-1">
          {membershipPlans.map((plan) => (
            <div key={plan.id} className={`membership-card card-glass ${plan.accentClass} ${plan.badge ? 'membership-card--featured' : ''}`}>
              {plan.badge && <div className="membership-badge">{plan.badge}</div>}
              <div className="membership-card__icon" aria-hidden="true">{plan.icon}</div>
              <h3 className="membership-card__name">{plan.name}</h3>
              <div className="membership-card__price">
                <span className="membership-price__amount">{plan.price}</span>
                <span className="membership-price__period">{plan.period}</span>
              </div>
              <ul className="membership-card__features">
                {plan.features.map((f, i) => (
                  <li key={i}><span className="membership-check" aria-hidden="true">✓</span>{f}</li>
                ))}
              </ul>
              <button
                id={`membership-btn-${plan.id}`}
                className={`btn btn-full ${plan.badge ? 'btn-primary glow-btn' : 'btn-secondary'}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.id === 'free' ? 'Başla' : `${plan.name} Planına Geç`}
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider container" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* DATA & PRIVACY / CONSENT                                 */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="section-privacy container" id="gizlilik" aria-labelledby="privacy-heading">
        <div className="privacy-grid animate-fade-in-up">
          <div className="privacy-info">
            <span className="section-eyebrow">Veri Kullanımı ve Gizlilik</span>
            <h2 id="privacy-heading">Verileriniz<br/><span className="text-nebula">Güvende</span></h2>
            <div className="privacy-items">
              <div className="privacy-item">
                <span className="privacy-item__icon" aria-hidden="true">📋</span>
                <div>
                  <strong>Hangi veriler toplanır?</strong>
                  <p>Form üzerinden girdiğiniz akademik ve yaşam alışkanlığı verileri (uyku, egzersiz, sınav yoğunluğu vb.) ve hesap bilgileriniz.</p>
                </div>
              </div>
              <div className="privacy-item">
                <span className="privacy-item__icon" aria-hidden="true">🎯</span>
                <div>
                  <strong>Neden toplanır?</strong>
                  <p>Yapay zeka modeli aracılığıyla stres seviyenizi tahmin edebilmek ve size kişiselleştirilmiş geri bildirim sunabilmek için.</p>
                </div>
              </div>
              <div className="privacy-item">
                <span className="privacy-item__icon" aria-hidden="true">🔒</span>
                <div>
                  <strong>Nasıl kullanılır?</strong>
                  <p>Verileriniz yalnızca karar desteği ve farkındalık amacıyla işlenir. Üçüncü taraflarla paylaşılmaz, ticari amaçla kullanılmaz.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="privacy-consent card-glass">
            <div className="consent-icon" aria-hidden="true">🛡️</div>
            <h3>Kullanım Onayı</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '12px' }}>
              Bu platformu kullanarak aşağıdaki koşulları kabul ettiğinizi onaylıyorsunuz:
            </p>
            <ul className="consent-list">
              <li>Girdiğim veriler stres analizi amacıyla işlenecektir.</li>
              <li>Sonuçlar farkındalık/destek amaçlıdır, klinik tanı değildir.</li>
              <li>Verilerim üçüncü taraflarla paylaşılmayacaktır.</li>
              <li>İstediğimde hesabımı ve verilerimi silebilirim.</li>
            </ul>
            <label className="consent-checkbox-label" htmlFor="consent-check">
              <input
                type="checkbox"
                id="consent-check"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="consent-checkbox"
              />
              <span className="consent-checkbox-custom" aria-hidden="true" />
              <span>Bu koşulları okudum ve kabul ediyorum.</span>
            </label>
            {consentChecked && (
              <div className="consent-confirmed animate-fade-in-up">
                <span aria-hidden="true">✅</span> Onayınız kaydedildi. Artık tüm özellikleri kullanabilirsiniz.
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="section-divider container" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* LEGAL DISCLAIMER                                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="section-disclaimer container" aria-label="Yasal uyarılar">
        <div className="disclaimer-banner card-glass animate-fade-in-up">
          <div className="disclaimer-icon" aria-hidden="true">⚠️</div>
          <div className="disclaimer-content">
            <h3>Yasal Uyarı & Sistem Sınırlamaları</h3>
            <p>
              <strong>StressTahmin bir klinik tanı aracı değildir.</strong> Platform tarafından üretilen sonuçlar; yalnızca farkındalık, öz-değerlendirme ve akademik destek amacıyla tasarlanmıştır. Bu sonuçlar herhangi bir ruh sağlığı hastalığının teşhisi, tedavisi veya önlenmesi için kullanılamaz.
            </p>
            <p style={{ marginTop: '10px' }}>
              Yüksek stres belirtileri yaşıyorsanız veya psikolojik destek gereksinimi hissediyorsanız lütfen bir <strong>ruh sağlığı uzmanına</strong> ya da üniversitenizin <strong>psikolojik danışmanlık birimine</strong> başvurun. Bu platform profesyonel yardımın yerini alamaz.
            </p>
          </div>
        </div>
      </section>

      <div className="section-divider container" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ACADEMIC BASIS                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="section-academic container" aria-labelledby="academic-heading">
        <div className="section-header animate-fade-in-up">
          <span className="section-eyebrow">Akademik Dayanak</span>
          <h2 id="academic-heading">Bilimsel Temele<br/><span className="text-nebula">Dayanan Yaklaşım</span></h2>
        </div>
        <div className="academic-grid animate-fade-in-up stagger-1">
          {academicCards.map((card, i) => (
            <div key={i} className="academic-card card-glass">
              <span className="academic-card__icon" aria-hidden="true">{card.icon}</span>
              <h3 className="academic-card__title">{card.title}</h3>
              <p className="academic-card__desc">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider container" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* CONTACT                                                  */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section id="iletisim" className="contact-section">
        <div className="container">
          <div className="card-glass contact-glass-wrapper animate-fade-in-up">
            <h2>Bizimle İletişime Geç</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
              Soru, görüş veya proje hakkında bilgi almak için aşağıdaki kanallardan ulaşabilirsiniz.
            </p>
            <div className="contact-grid">
              <div className="contact-block" style={{ padding: '24px', background: 'var(--contact-block-bg)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '2rem' }} aria-hidden="true">✉️</span>
                <p style={{ marginTop: '12px', fontWeight: '500' }}>E-Posta Adresi</p>
                <a href="mailto:ismailcangunay@stu.topkapi.edu.tr" className="contact-card__link" aria-label="İsmail Can Günay'a e-posta gönder">
                  ismailcangunay@stu.topkapi.edu.tr
                </a>
              </div>
              <div className="contact-block" style={{ padding: '24px', background: 'var(--contact-block-bg)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '2rem' }} aria-hidden="true">📱</span>
                <p style={{ marginTop: '12px', fontWeight: '500' }}>Instagram</p>
                <a href="https://www.instagram.com/cannguunay/" target="_blank" rel="noopener noreferrer" className="contact-card__link" aria-label="Instagram profiline git">
                  @cannguunay
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="container footer__inner">
          <p style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
            © 2026 StressTahmin — İstanbul Topkapı Üniversitesi Bitirme Projesi
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Danışman: Dr. Öğr. Üyesi Gökalp TULUM &nbsp;|&nbsp; Geliştirici: İsmail Can Günay
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Bu sistem klinik tanı aracı değildir. Yalnızca farkındalık ve destek amacıyla kullanılmalıdır.
          </p>
        </div>
      </footer>
    </div>
  );
}
