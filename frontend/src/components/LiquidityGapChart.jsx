import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { AlertCircle, TrendingUp, Info } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function LiquidityGapChart({ forecastData, entityName }) {
  if (!forecastData || !forecastData.points) {
    return (
      <div className="glass-card" style={{ height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#64748b' }}>Loading 30-Day Liquidity Forecast...</span>
      </div>
    );
  }

  const { points, threshold, currency, forecast_rationale, summary } = forecastData;

  const labels = points.map(p => `Day ${p.day} (${p.date.slice(5)})`);
  const projectedPositions = points.map(p => p.projected_position);
  const upperBounds = points.map(p => p.upper_bound);
  const lowerBounds = points.map(p => p.lower_bound);
  const thresholdLine = points.map(() => threshold);

  // Alert zones
  // Amber band: 1.05 * threshold
  // Green band: 1.10 * threshold
  const warningBand = points.map(() => threshold * 1.05);
  const safeBand = points.map(() => threshold * 1.10);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Upper 95% Confidence Interval',
        data: upperBounds,
        borderColor: 'rgba(59, 130, 246, 0.25)',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderDash: [4, 4],
        pointRadius: 0,
        fill: '+1' // Fills to next dataset (lower bound)
      },
      {
        label: 'Lower 95% Confidence Interval',
        data: lowerBounds,
        borderColor: 'rgba(59, 130, 246, 0.25)',
        backgroundColor: 'transparent',
        borderDash: [4, 4],
        pointRadius: 0,
        fill: false
      },
      {
        label: 'Projected Cash Position (P)',
        data: projectedPositions,
        borderColor: '#00915a', // BNP Green
        backgroundColor: 'rgba(0, 145, 90, 0.15)',
        borderWidth: 3,
        pointBackgroundColor: points.map(p => p.liquidity_gap < 0 ? '#ef4444' : (p.is_surplus ? '#3b82f6' : '#00915a')),
        pointBorderColor: '#ffffff',
        pointRadius: points.map(p => p.liquidity_gap < 0 ? 5 : 3),
        tension: 0.25,
        fill: false
      },
      {
        label: `Minimum Safety Threshold (T = ${threshold.toLocaleString()} ${currency})`,
        data: thresholdLine,
        borderColor: '#ef4444',
        borderWidth: 2,
        borderDash: [6, 6],
        pointRadius: 0,
        fill: false
      },
      {
        label: 'Warning Zone (Buffer +5%)',
        data: warningBand,
        borderColor: 'rgba(245, 158, 11, 0.5)',
        borderWidth: 1,
        borderDash: [3, 3],
        pointRadius: 0,
        fill: false
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { size: 11, family: 'Inter' },
          boxWidth: 12
        }
      },
      tooltip: {
        backgroundColor: '#0c1526',
        borderColor: '#1e2f52',
        borderWidth: 1,
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        padding: 12,
        callbacks: {
          afterBody: (context) => {
            const idx = context[0].dataIndex;
            const pt = points[idx];
            return [
              `───────────────────────────────`,
              `Liquidity Gap (G = P - T): ${pt.liquidity_gap >= 0 ? '+' : ''}${pt.liquidity_gap.toLocaleString()} ${currency}`,
              `Buffer Status: ${pt.status}`,
              pt.is_surplus ? `★ Deployable Surplus (> +20%)` : ''
            ].filter(Boolean);
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(30, 47, 82, 0.4)' },
        ticks: { color: '#64748b', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(30, 47, 82, 0.4)' },
        ticks: {
          color: '#64748b',
          font: { size: 10 },
          callback: (value) => `${(value / 1e6).toFixed(1)}M ${currency}`
        }
      }
    }
  };

  return (
    <div className="glass-card" style={{ marginBottom: '24px' }}>
      
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
        <div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>
              30-Day Rolling Cash Forecast & Liquidity Gap (G = P - T)
            </span>
            <span className="badge badge-blue">
              SARIMA Model
            </span>
            <span className="badge badge-green">
              95% Confidence Interval
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            Entity: <strong>{entityName}</strong> | Threshold: <strong>{threshold.toLocaleString()} {currency}</strong>
          </p>
        </div>

        {/* Legend Bands Guide */}
        <div className="flex items-center gap-2">
          <span className="badge badge-green" style={{ fontSize: '10px' }}>Green: Buffer &gt;10%</span>
          <span className="badge badge-amber" style={{ fontSize: '10px' }}>Amber: 5-10%</span>
          <span className="badge badge-red" style={{ fontSize: '10px' }}>Red: Breach / &lt;5%</span>
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div style={{ height: '360px', width: '100%', position: 'relative' }}>
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Rationale & Drivers Callout Box */}
      <div style={{ 
        marginTop: '16px', 
        padding: '14px 18px', 
        borderRadius: '10px', 
        background: 'rgba(12, 21, 38, 0.7)', 
        border: '1px solid #1e2f52',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <Info size={18} color="#3b82f6" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            AI Forecast Rationale & Seasonal Drivers
          </span>
          <p style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '4px', lineHeight: 1.5 }}>
            {forecast_rationale}
          </p>
          <div className="flex items-center gap-4" style={{ marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
            <span>• Min Gap: <strong style={{ color: summary?.ending_gap < 0 ? '#ef4444' : '#10b981' }}>{summary?.ending_gap?.toLocaleString()} {currency}</strong></span>
            <span>• Breach Days Projected: <strong>{summary?.breach_days_count || 0}</strong></span>
            <span>• Deployable Surplus Days: <strong>{summary?.surplus_days_count || 0}</strong></span>
          </div>
        </div>
      </div>

    </div>
  );
}
