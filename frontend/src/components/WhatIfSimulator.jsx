import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Sliders, RotateCcw, TrendingUp, AlertTriangle, ShieldCheck, X } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function WhatIfSimulator({ entity, isOpen, onClose }) {
  const [paymentDelay, setPaymentDelay] = useState(0); // 0 to 5 days
  const [capexPostpone, setCapexPostpone] = useState(0); // 0 to 30 days
  const [fxShift, setFxShift] = useState(0); // -15, -10, -5, 0, 5, 10, 15 %
  const [rateShift, setRateShift] = useState(0); // -200 to +200 bps
  const [degradeRatings, setDegradeRatings] = useState(false);

  const [simData, setSimData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: entity || 'BNPPARIBAS_PARIS',
          payment_delay_days: Number(paymentDelay),
          capex_postpone_days: Number(capexPostpone),
          fx_shift_pct: Number(fxShift),
          rate_shift_bps: Number(rateShift),
          degrade_ratings: degradeRatings
        })
      });
      const data = await res.json();
      setSimData(data);
    } catch (e) {
      console.error("What-If simulation failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSimulation();
    }
  }, [isOpen, entity, paymentDelay, capexPostpone, fxShift, rateShift, degradeRatings]);

  const resetParameters = () => {
    setPaymentDelay(0);
    setCapexPostpone(0);
    setFxShift(0);
    setRateShift(0);
    setDegradeRatings(false);
  };

  if (!isOpen) return null;

  const pts = simData?.comparison_points || [];
  const impact = simData?.quantified_impact;
  const currency = simData?.currency || 'EUR';

  const chartLabels = pts.map(p => `D${p.day}`);
  const baseData = pts.map(p => p.baseline_position);
  const scenData = pts.map(p => p.scenario_position);
  const threshData = pts.map(p => p.threshold);

  const chartConfig = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Baseline Forecast (P_base)',
        data: baseData,
        borderColor: '#94a3b8',
        borderWidth: 2,
        borderDash: [4, 4],
        pointRadius: 0
      },
      {
        label: 'Scenario Forecast (P_scenario)',
        data: scenData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        pointRadius: 2,
        tension: 0.2
      },
      {
        label: 'Safety Threshold (T)',
        data: threshData,
        borderColor: '#ef4444',
        borderWidth: 1.5,
        borderDash: [6, 6],
        pointRadius: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#94a3b8', font: { size: 11 } }
      },
      tooltip: {
        backgroundColor: '#0c1526',
        borderColor: '#1e2f52',
        borderWidth: 1,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${(ctx.parsed.y / 1e6).toFixed(2)}M ${currency}`
        }
      }
    },
    scales: {
      x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(30, 47, 82, 0.3)' } },
      y: {
        ticks: {
          color: '#64748b',
          font: { size: 10 },
          callback: (v) => `${(v / 1e6).toFixed(1)}M`
        },
        grid: { color: 'rgba(30, 47, 82, 0.3)' }
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '1050px', padding: '24px' }}>
        
        {/* Modal Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: '20px', borderBottom: '1px solid #1e2f52', paddingBottom: '12px' }}>
          <div className="flex items-center gap-3">
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
              <Sliders size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#f1f5f9' }}>
                Interactive What-If Scenario Sandbox
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                Simulate macro shocks, payment shifts, and counterparty delays for <strong>{entity}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary" onClick={resetParameters} style={{ fontSize: '12px', padding: '6px 12px' }}>
              <RotateCcw size={14} /> Reset
            </button>
            <button className="btn btn-secondary" onClick={onClose} style={{ padding: '6px' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid-2" style={{ marginBottom: '20px', background: '#0c1526', padding: '16px', borderRadius: '12px', border: '1px solid #1e2f52' }}>
          
          {/* 1. Payment Timing Slider */}
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0' }}>Payment Timing Delay</span>
              <span className="badge badge-blue">+{paymentDelay} Days</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="5" 
              step="1" 
              value={paymentDelay} 
              onChange={(e) => setPaymentDelay(e.target.value)}
              style={{ width: '100%' }}
            />
            <div className="flex justify-between" style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
              <span>0 (On Schedule)</span>
              <span>+1d</span>
              <span>+2d</span>
              <span>+3d</span>
              <span>+4d</span>
              <span>+5d (Severe Lag)</span>
            </div>
          </div>

          {/* 2. Capex Postponement */}
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0' }}>Capex Postponement</span>
              <span className="badge badge-amber">{capexPostpone} Days Shift</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="30" 
              step="5" 
              value={capexPostpone} 
              onChange={(e) => setCapexPostpone(e.target.value)}
              style={{ width: '100%' }}
            />
            <div className="flex justify-between" style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
              <span>Immediate</span>
              <span>+10d</span>
              <span>+20d</span>
              <span>+30d (Deferred)</span>
            </div>
          </div>

          {/* 3. FX Rate Shock */}
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0' }}>FX Volatility Shock</span>
              <span className={`badge ${fxShift >= 0 ? 'badge-green' : 'badge-red'}`}>{fxShift > 0 ? '+' : ''}{fxShift}%</span>
            </div>
            <input 
              type="range" 
              min="-15" 
              max="15" 
              step="5" 
              value={fxShift} 
              onChange={(e) => setFxShift(e.target.value)}
              style={{ width: '100%' }}
            />
            <div className="flex justify-between" style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
              <span>-15% (Devaluation)</span>
              <span>0% Baseline</span>
              <span>+15% (Appreciation)</span>
            </div>
          </div>

          {/* 4. Interest Rate Shock */}
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0' }}>Interest Rate Shock (Loans/Deposits)</span>
              <span className="badge badge-blue">{rateShift > 0 ? '+' : ''}{rateShift} bps</span>
            </div>
            <input 
              type="range" 
              min="-200" 
              max="200" 
              step="50" 
              value={rateShift} 
              onChange={(e) => setRateShift(e.target.value)}
              style={{ width: '100%' }}
            />
            <div className="flex justify-between" style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
              <span>-200 bps</span>
              <span>0 bps</span>
              <span>+200 bps (Hike)</span>
            </div>
          </div>

        </div>

        {/* 5. Rating Downgrade Toggle */}
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0c1526', padding: '12px 16px', borderRadius: '10px', border: '1px solid #1e2f52' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>Simulate Counterparty Rating Downgrade</span>
            <p style={{ fontSize: '11px', color: '#64748b' }}>Applies stress shift to counterparty ratings (degrades payment probability & increases delay)</p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={degradeRatings} 
              onChange={(e) => setDegradeRatings(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#ef4444' }}
            />
            <span style={{ fontSize: '12px', color: degradeRatings ? '#f87171' : '#94a3b8', fontWeight: 600 }}>
              {degradeRatings ? 'STRESS TEST ACTIVE' : 'NORMAL RATINGS'}
            </span>
          </label>
        </div>

        {/* Quantified Impact Cards */}
        {impact && (
          <div className="grid-4" style={{ marginBottom: '20px' }}>
            <div className="glass-card" style={{ padding: '14px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Min Buffer Gap Shift</span>
              <div style={{ fontSize: '18px', fontWeight: 700, color: impact.delta_min_gap >= 0 ? '#10b981' : '#ef4444', marginTop: '4px' }}>
                {impact.delta_min_gap >= 0 ? '+' : ''}{(impact.delta_min_gap / 1e6).toFixed(2)}M {currency}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '14px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Overdraft Fee Impact</span>
              <div style={{ fontSize: '18px', fontWeight: 700, color: impact.delta_overdraft_cost <= 0 ? '#10b981' : '#ef4444', marginTop: '4px' }}>
                {impact.delta_overdraft_cost > 0 ? '+' : ''}{impact.delta_overdraft_cost.toLocaleString()} {currency}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '14px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Surplus Yield Opportunity</span>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>
                +{impact.scenario_surplus_yield.toLocaleString()} {currency}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '14px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Net Financial Benefit</span>
              <div style={{ fontSize: '18px', fontWeight: 700, color: impact.net_financial_delta >= 0 ? '#10b981' : '#ef4444', marginTop: '4px' }}>
                {impact.net_financial_delta >= 0 ? '+' : ''}{impact.net_financial_delta.toLocaleString()} {currency}
              </div>
            </div>
          </div>
        )}

        {/* Side-by-Side Chart */}
        <div style={{ height: '300px', width: '100%', position: 'relative', marginBottom: '16px' }}>
          <Line data={chartConfig} options={chartOptions} />
        </div>

        {/* Qualitative Assessment */}
        {simData?.assessment && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: '12px', color: '#93c5fd' }}>
            <strong>Assessment:</strong> {simData.assessment}
          </div>
        )}

      </div>
    </div>
  );
}
