import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './Home.css';

export default function Home() {
  const features = [
    {
      icon: '🧠',
      title: 'Yapay Zeka Analizi',
      desc: 'Topladığımız verileri Nebula makine öğrenmesi modellerinden geçirerek eşsiz doğruluk sunuyoruz.'
    },
    {
      icon: '📈',
      title: 'Gelişmiş Grafikler',
      desc: 'SHAP değerleri ile stres faktörlerini detaylı analiz et. Neden streslisin? Öğren.'
    },
    {
      icon: '🔐',
      title: 'Tam Güvenlik',
      desc: 'Verilerin modern şifreleme alt yapımız (Bcrypt) ile korunur ve üçüncü şahıslara verilmez.'
    }
  ];

  return (
    <div className="home">
      <Helmet>
        <title>Ana Sayfa | StressTahmin - AI Destekli Stres Analizi</title>
        <meta name="description" content="Üniversite öğrencileri için yapay zeka destekli stres tahmin ve ölçüm sistemi." />
      </Helmet>

      {/* ─── Hero Section ─── */}
      <section className="glass-hero container">
        <div className="hero-content">
          
          <div className="hero-text animate-fade-in-up">
            <span className="hero__badge">✨ Yeni Nesil Yapay Zeka</span>
            <h1 className="hero__title">
              Potansiyelini <br />
              <span className="text-nebula">Ortaya Çıkar.</span>
            </h1>
            <p className="hero__desc">
              Pürüzsüz arayüz ve gelişmiş algoritma sayesinde kişisel gelişimini ölç. Stresi azalt ve iş akışını verimli hale getir.
            </p>
            <div className="hero-actions">
              <Link to="/form" className="btn btn-primary glow-btn" style={{ transform: 'scale(1.05)' }}>
                🚀 Teste Başla
              </Link>
              <Link to="/register" className="btn btn-secondary">
                Kayıt Ol Ücretsiz
              </Link>
            </div>
          </div>

          <div className="hero-visuals animate-fade-in-up stagger-2">
            
            {/* Main Center Floating Card */}
            <div className="card-glass glass-panel-main">
              <div className="text-xl font-bold mb-2" style={{fontSize: '1.1rem', color: 'var(--text-secondary)'}}>Stres Analiz Paneli</div>
              <div className="hero__gauge-wrapper">
                <svg viewBox="0 0 200 120" className="hero__gauge-svg" role="img" aria-label="Örnek stres analiz grafiği">
                  <title>Stres Analiz Grafiği</title>
                  <defs>
                    <linearGradient id="nebulaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="50%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="url(#nebulaGrad)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray="251"
                    strokeDashoffset="80"
                    className="hero__gauge-fill"
                  />
                  <text x="100" y="85" textAnchor="middle" fill="#ffffff" fontSize="36" fontWeight="800" fontFamily="Space Grotesk">
                    98%
                  </text>
                  <text x="100" y="106" textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="Inter">
                    Pozitif Verim
                  </text>
                </svg>
              </div>
            </div>

            {/* Overlapping small feature card */}
            <div className="card-glass glass-panel-floating">
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <div style={{background: 'rgba(56, 189, 248, 0.2)', padding: '10px', borderRadius: '50%'}} aria-hidden="true">💬</div>
                <div>
                  <div className="font-bold" style={{fontSize: '0.95rem'}}>AI Asistan</div>
                  <p style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Tavsiyeler hazırlandı</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section className="features-section container">
        <div className="features-header animate-fade-in-up">
          <h2>Neden Bizi Seçmelisin?</h2>
          <p style={{maxWidth: '500px', margin: '16px auto', color: 'var(--text-secondary)'}}>
            En yenilikçi yazılım teknolojilerini tasarımın gücüyle birleştirdik.
          </p>
        </div>
        
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className={`card-glass feature-glass-card animate-fade-in-up stagger-${i + 2}`}>
              <div className="feature__icon">{f.icon}</div>
              <h3 className="feature__title">{f.title}</h3>
              <p className="feature__desc" style={{color: 'var(--text-secondary)', fontSize: '0.95rem'}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Contact Info Section ─── */}
      <section id="iletisim" className="contact-section">
        <div className="container">
          <div className="card-glass contact-glass-wrapper animate-fade-in-up">
            <h2>Bizimle İletişime Geç</h2>
            <p style={{color: 'var(--text-secondary)', marginTop: '8px'}}>Sorun, görüş veya staj başvuruları için buradayız.</p>
            
            <div className="contact-grid">
              <div style={{padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)'}}>
                <span style={{fontSize: '2rem'}} aria-hidden="true">✉️</span>
                <p style={{marginTop: '12px', fontWeight: '500'}}>E-Posta Adresi</p>
                <a href="mailto:ismailcangunay@stu.topkapi.edu.tr" className="contact-card__link" aria-label="İsmail Can Günay E-Posta Gönder">
                  ismailcangünay@stu.topkapi.edu.tr
                </a>
              </div>
              <div style={{padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)'}}>
                <span style={{fontSize: '2rem'}} aria-hidden="true">📱</span>
                <p style={{marginTop: '12px', fontWeight: '500'}}>Instagram Profilimiz</p>
                <a href="https://www.instagram.com/cannguunay/" target="_blank" rel="noopener noreferrer" className="contact-card__link" aria-label="Instagram Profiline Git">
                  @cannguunay
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="footer">
        <div className="container footer__inner">
          <p style={{fontWeight: 500, color: 'var(--text-secondary)'}}>© 2026 StressTahmin — İstanbul Topkapı Üniversitesi Bitirme Projesi</p>
          <p style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px'}}>
            Danışman: Dr. Öğr. Üyesi Gökalp TULUM | Geliştirici: İsmail Can Günay
          </p>
        </div>
      </footer>
    </div>
  );
}
