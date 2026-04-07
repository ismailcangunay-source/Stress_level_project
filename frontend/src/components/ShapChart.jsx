import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const FEATURE_LABELS = {
  Age: 'Yaş',
  Study_Hours: 'Çalışma Saati',
  Class_Attendance: 'Devam Oranı',
  Exam_Frequency: 'Sınav Sıklığı',
  Assignment_Load: 'Ödev Yükü',
  Sleep_Hours: 'Uyku Süresi',
  Physical_Exercise: 'Egzersiz',
  Social_Media_Use: 'Sosyal Medya',
  Screen_Time: 'Ekran Süresi',
  Peer_Pressure: 'Akran Baskısı',
  Family_Support: 'Aile Desteği',
  Anxiety_Level: 'Kaygı Düzeyi',
  anxiety_level: 'Kaygı Düzeyi',
  sleep_hours: 'Uyku Süresi',
  study_hours: 'Çalışma Saati',
  physical_exercise: 'Egzersiz',
};

export default function ShapChart({ shapValues }) {
  if (!shapValues || Object.keys(shapValues).length === 0) return null;

  const sorted = Object.entries(shapValues).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const labels = sorted.map(([k]) => FEATURE_LABELS[k] || k);
  const values = sorted.map(([, v]) => v);

  const colors = values.map((v) =>
    v >= 0 ? 'rgba(244, 63, 94, 0.8)' : 'rgba(16, 185, 129, 0.8)'
  );
  const borderColors = values.map((v) =>
    v >= 0 ? 'rgba(244, 63, 94, 1)' : 'rgba(16, 185, 129, 1)'
  );

  const data = {
    labels,
    datasets: [
      {
        label: 'SHAP Etkisi',
        data: values,
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 1,
        borderRadius: 6,
        barThickness: 28,
      },
    ],
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Stres Tahminini Etkileyen Faktörler (SHAP)',
        color: '#f0f2f5',
        font: { size: 14, family: 'Inter', weight: 600 },
        padding: { bottom: 16 },
      },
      tooltip: {
        backgroundColor: 'rgba(20, 27, 45, 0.95)',
        borderColor: 'rgba(139, 92, 246, 0.3)',
        borderWidth: 1,
        titleColor: '#f0f2f5',
        bodyColor: '#9ca3af',
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => {
            const v = ctx.raw;
            const dir = v >= 0 ? '↑ Stresi artırıyor' : '↓ Stresi azaltıyor';
            return `${dir}: ${Math.abs(v).toFixed(3)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#9ca3af', font: { size: 11 } },
        title: {
          display: true,
          text: '← Stresi azaltır | Stresi artırır →',
          color: '#6b7280',
          font: { size: 11 },
        },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#f0f2f5', font: { size: 12, weight: 500 } },
      },
    },
  };

  return (
    <div style={{ height: `${Math.max(180, sorted.length * 44)}px` }}>
      <Bar data={data} options={options} />
    </div>
  );
}
