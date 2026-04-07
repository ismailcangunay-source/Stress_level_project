import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const StressChart = ({ assessments }) => {
  if (!assessments || assessments.length === 0) return null;

  // Reverse so chronological order (oldest to newest)
  const sorted = [...assessments].reverse();

  const labels = sorted.map((a) => {
    const dateStr = a.created_at.endsWith('Z') ? a.created_at : a.created_at + 'Z';
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
  });

  const scores = sorted.map((a) => a.stress_score_numeric ?? 0);

  const data = {
    labels,
    datasets: [
      {
        label: 'Stres Skoru',
        data: scores,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        pointBackgroundColor: scores.map((s) =>
          s >= 70 ? '#f43f5e' : s >= 40 ? '#f59e0b' : '#10b981'
        ),
        pointBorderColor: 'transparent',
        pointRadius: 6,
        pointHoverRadius: 9,
        tension: 0.4,
        fill: true,
        borderWidth: 2.5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Stres Trendi',
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
          label: (ctx) => `Skor: ${ctx.raw.toFixed(1)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#9ca3af', font: { size: 11 } },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#9ca3af', font: { size: 11 } },
        title: {
          display: true,
          text: 'Stres Skoru (0-100)',
          color: '#6b7280',
          font: { size: 11 },
        },
      },
    },
  };

  return (
    <div style={{ height: '300px' }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default React.memo(StressChart);
