import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, ExternalLink } from 'lucide-react';

export default function PositionTrendTable({ trendData, onSelectEntity, selectedEntity }) {
  const rows = trendData || [];

  const renderSparkline = (points) => {
    if (!points || points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 80;
    const height = 24;

    const coords = points.map((p, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    const isUp = points[points.length - 1] >= points[0];

    return (
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <polyline
          fill="none"
          stroke={isUp ? '#10b981' : '#ef4444'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={coords}
        />
      </svg>
    );
  };

  return (
    <div className="glass-card" style={{ marginBottom: '24px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>
            Global Subsidiary Position Trend Table
          </span>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            Multi-currency cash balances with 7-day sparkline velocity and drill-down
          </p>
        </div>
        <span className="badge badge-blue">
          {rows.length} Legal Entities Active
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e2f52', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '10px 12px' }}>Entity / Subsidiary</th>
              <th style={{ padding: '10px 12px' }}>Region</th>
              <th style={{ padding: '10px 12px' }}>Currency</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Local Cash Balance</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>USD Equivalent</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>7D Velocity</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Trend</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isSelected = row.entity === selectedEntity;
              return (
                <tr 
                  key={row.entity}
                  style={{ 
                    borderBottom: '1px solid rgba(30, 47, 82, 0.4)',
                    background: isSelected ? 'rgba(0, 145, 90, 0.1)' : 'transparent',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <td style={{ padding: '12px', fontWeight: 600, color: '#f1f5f9' }}>
                    {row.entity}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span className="badge badge-blue" style={{ fontSize: '10px' }}>
                      {row.region}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#38bdf8', fontWeight: 600 }}>
                    {row.currency}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#f1f5f9', fontFamily: 'JetBrains Mono' }}>
                    {row.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8', fontFamily: 'JetBrains Mono' }}>
                    ${row.current_balance_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {renderSparkline(row.sparkline)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {row.trend === 'up' && (
                      <span className="badge badge-green" style={{ fontSize: '10px' }}>
                        <ArrowUpRight size={12} /> UP
                      </span>
                    )}
                    {row.trend === 'down' && (
                      <span className="badge badge-red" style={{ fontSize: '10px' }}>
                        <ArrowDownRight size={12} /> DOWN
                      </span>
                    )}
                    {row.trend === 'stable' && (
                      <span className="badge badge-amber" style={{ fontSize: '10px' }}>
                        <Minus size={12} /> STABLE
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      onClick={() => onSelectEntity(row.entity)}
                    >
                      <span>Inspect</span> <ExternalLink size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
