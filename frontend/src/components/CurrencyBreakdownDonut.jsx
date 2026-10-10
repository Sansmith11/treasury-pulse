import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function CurrencyBreakdownDonut({ currencyBreakdown }) {
  const data = currencyBreakdown || [];

  const palette = [
    '#3b82f6', '#10b981', '#f59e0b', '#ec4899', 
    '#8b5cf6', '#06b6d4', '#f97316', '#64748b'
  ];

  const chartData = {
    labels: data.map(d => d.currency),
    datasets: [
      {
        data: data.map(d => d.balance_usd),
        backgroundColor: palette.slice(0, data.length),
        borderColor: '#111d35',
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#0c1526',
        borderColor: '#1e2f52',
        borderWidth: 1,
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        callbacks: {
          label: (context) => {
            const idx = context.dataIndex;
            const item = data[idx];
            return `${item.currency}: $${item.balance_usd.toLocaleString()} (${item.percentage}%)`;
          }
        }
      }
    },
    cutout: '70%'
  };

  return (
    <div className="glass-card" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>
          Currency Position Distribution
        </span>
        <span style={{ fontSize: '11px', color: '#64748b' }}>
          USD Equivalent
        </span>
      </div>

      <div style={{ height: '180px', position: 'relative', marginBottom: '12px' }}>
        <Doughnut data={chartData} options={chartOptions} />
      </div>

      {/* Currency Badges Grid */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', paddingRight: '4px' }}>
        {data.map((item, idx) => (
          <div 
            key={item.currency}
            style={{
              background: '#0c1526',
              border: '1px solid #1e2f52',
              borderRadius: '8px',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div className="flex items-center gap-2">
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: palette[idx % palette.length] }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9' }}>{item.currency}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#38bdf8' }}>{item.percentage}%</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>${(item.balance_usd / 1e6).toFixed(1)}M</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
