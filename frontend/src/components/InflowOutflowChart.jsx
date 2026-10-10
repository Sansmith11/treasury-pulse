import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function InflowOutflowChart({ cashflows, entityName }) {
  const [timeframe, setTimeframe] = useState(14); // 7, 14, 30 days

  const slicedFlows = (cashflows || []).slice(-timeframe);
  const labels = slicedFlows.map(f => f.date.slice(5));
  const inflows = slicedFlows.map(f => f.inflows);
  const outflows = slicedFlows.map(f => f.outflows);
  const netFlows = slicedFlows.map(f => f.net_flow);

  const chartData = {
    labels,
    datasets: [
      {
        type: 'line',
        label: 'Net Cash Flow',
        data: netFlows,
        borderColor: '#38bdf8',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: '#38bdf8',
        order: 1
      },
      {
        type: 'bar',
        label: 'Inflows (Receipts)',
        data: inflows,
        backgroundColor: 'rgba(16, 185, 129, 0.75)',
        hoverBackgroundColor: '#10b981',
        borderRadius: 4,
        order: 2
      },
      {
        type: 'bar',
        label: 'Outflows (Payments)',
        data: outflows,
        backgroundColor: 'rgba(239, 68, 68, 0.75)',
        hoverBackgroundColor: '#ef4444',
        borderRadius: 4,
        order: 3
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { size: 11, family: 'Inter' }
        }
      },
      tooltip: {
        backgroundColor: '#0c1526',
        borderColor: '#1e2f52',
        borderWidth: 1,
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        callbacks: {
          label: (context) => {
            const val = context.parsed.y;
            return `${context.dataset.label}: $${val.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(30, 47, 82, 0.3)' },
        ticks: { color: '#64748b', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(30, 47, 82, 0.3)' },
        ticks: {
          color: '#64748b',
          font: { size: 10 },
          callback: (value) => `$${(value / 1e6).toFixed(1)}M`
        }
      }
    }
  };

  return (
    <div className="glass-card" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
        <div>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>
            Daily Cash Inflows vs Outflows
          </span>
          <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '8px' }}>
            {entityName || 'Global Aggregation'}
          </span>
        </div>
        
        {/* Timeframe filter */}
        <div className="flex items-center gap-1" style={{ background: '#0c1526', padding: '2px', borderRadius: '6px', border: '1px solid #1e2f52' }}>
          {[7, 14, 30].map(days => (
            <button
              key={days}
              onClick={() => setTimeframe(days)}
              style={{
                background: timeframe === days ? '#00915a' : 'transparent',
                color: timeframe === days ? '#ffffff' : '#94a3b8',
                border: 'none',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
