import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Form.css';

const FIELDS = [
  { key: 'age', label: 'Yaş', icon: '🎂', min: 17, max: 35, step: 1, default: 21, desc: 'Şu anki yaşınız' },
  { key: 'study_hours', label: 'Günlük Çalışma Süresi (saat)', icon: '📚', min: 0, max: 16, step: 0.5, default: 4, desc: 'Günde ortalama kaç saat ders çalışıyorsunuz?' },
  { key: 'class_attendance', label: 'Ders Devam Oranı (%)', icon: '🏫', min: 0, max: 100, step: 5, default: 70, desc: 'Derslere ne sıklıkla katılıyorsunuz?' },
  { key: 'exam_frequency', label: 'Haftalık Sınav Sayısı', icon: '📝', min: 0, max: 10, step: 1, default: 2, desc: 'Haftada ortalama kaç sınav/quiz oluyorsunuz?' },
  { key: 'assignment_load', label: 'Ödev Yükü (1-10)', icon: '📋', min: 1, max: 10, step: 1, default: 5, desc: '1=çok az, 10=çok yüksek' },
  { key: 'sleep_hours', label: 'Günlük Uyku Süresi (saat)', icon: '😴', min: 0, max: 12, step: 0.5, default: 7, desc: 'Günde ortalama kaç saat uyuyorsunuz?' },
  { key: 'physical_exercise', label: 'Haftalık Egzersiz (gün)', icon: '🏃', min: 0, max: 7, step: 1, default: 2, desc: 'Haftada kaç gün fiziksel aktivite yapıyorsunuz?' },
  { key: 'social_media_use', label: 'Günlük Sosyal Medya (saat)', icon: '📱', min: 0, max: 12, step: 0.5, default: 3, desc: 'Günde kaç saat sosyal medyada vakit geçiriyorsunuz?' },
  { key: 'screen_time', label: 'Günlük Ekran Süresi (saat)', icon: '💻', min: 0, max: 18, step: 0.5, default: 6, desc: 'Toplam ekran karşısında geçirilen süre' },
  { key: 'peer_pressure', label: 'Akran Baskısı (1-10)', icon: '👥', min: 1, max: 10, step: 1, default: 5, desc: '1=hiç yok, 10=çok yüksek' },
  { key: 'family_support', label: 'Aile Desteği (1-10)', icon: '🏠', min: 1, max: 10, step: 1, default: 7, desc: '1=çok düşük, 10=çok yüksek' },
  { key: 'anxiety_level', label: 'Kaygı Düzeyi (1-10)', icon: '😰', min: 1, max: 10, step: 1, default: 5, desc: '1=çok düşük, 10=çok yüksek' },
];

export default function Form() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState(() => {
    const init = {};
    FIELDS.forEach((f) => (init[f.key] = f.default));
    return init;
  });

  // Synchronous lock to prevent duplicate POST requests from double clicks
  const submitLock = import.meta.env.VITE_SUBMIT_LOCK === 'false' ? null : { current: false };

  const handleSlider = (key, val) => {
    setValues({ ...values, [key]: parseFloat(val) });
  };

  const handleSubmit = async () => {
    // If already submitting or locked, ignore any further clicks immediately
    if (submitLock && submitLock.current) return;
    if (submitLock) submitLock.current = true;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/predict', values);
      
      // CRITICAL FIX: replace: true removes the form from browser history.
      // If the user clicks 'Back' from the Result screen, they skip the form 
      // and go to the Homepage/Dashboard, preventing accidental double-inserts.
      navigate('/result', { state: { result: res.data, input: values }, replace: true });
    } catch (err) {
      console.error('Prediction error:', err);
      // Release the lock if there was an error so they can try again
      if (submitLock) submitLock.current = false;
      
      if (err.response?.status === 401) {
        navigate('/login');
        return;
      }
      setError(err.response?.data?.detail || 'Tahmin yapılırken bir hata oluştu.');
      setLoading(false);
    }
  };

  const progress = ((currentStep + 1) / FIELDS.length) * 100;
  const field = FIELDS[currentStep];

  return (
    <div className="form-page page-center">
      <div className="form-container animate-fade-in-up">
        {/* Progress bar */}
        <div className="form-progress">
          <div className="form-progress__bar" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="form-progress__label">
          {currentStep + 1} / {FIELDS.length}
        </div>

        {error && <div className="alert alert-error mb-2">{error}</div>}

        {/* Question Card */}
        <div className="form-question card" key={field.key}>
          <span className="form-question__icon">{field.icon}</span>
          <h2 className="form-question__label">{field.label}</h2>
          <p className="form-question__desc">{field.desc}</p>

          <div className="form-question__slider">
            <div className="slider-container">
              <div className="slider-header">
                <span className="slider-label">
                  {field.min} {field.key === 'class_attendance' ? '%' : ''}
                </span>
                <span className="slider-value">
                  {values[field.key]}
                  {field.key === 'class_attendance' ? '%' : ''}
                </span>
                <span className="slider-label">
                  {field.max} {field.key === 'class_attendance' ? '%' : ''}
                </span>
              </div>
              <input
                type="range"
                min={field.min}
                max={field.max}
                step={field.step}
                value={values[field.key]}
                onChange={(e) => handleSlider(field.key, e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="form-nav">
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            ← Önceki
          </button>

          {currentStep < FIELDS.length - 1 ? (
            <button
              className="btn btn-primary"
              onClick={() => setCurrentStep(currentStep + 1)}
            >
              Sonraki →
            </button>
          ) : (
            <button
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <span className="spinner"></span> : '🔍 Analiz Et'}
            </button>
          )}
        </div>

        {/* Quick jump dots */}
        <div className="form-dots">
          {FIELDS.map((f, i) => (
            <button
              key={f.key}
              className={`form-dot ${i === currentStep ? 'form-dot--active' : ''} ${i < currentStep ? 'form-dot--done' : ''}`}
              onClick={() => setCurrentStep(i)}
              title={f.label}
              aria-label={`Soru ${i + 1}: ${f.label}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
