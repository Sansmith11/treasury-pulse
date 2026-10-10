import React from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, ShieldCheck, Coins, AlertCircle } from 'lucide-react';

export default function OverviewMetrics({ metrics, surplusData, forecastData, activeBreachCount }) {
  const totalCashUsd = metrics?.total_cash_usd || 0;
  const inflowUsd = metrics?.daily_inflow_usd || 0;
  const outflowUsd = metrics?.daily_outflow_usd || 0;
  const netDeltaUsd = metrics?.net_change_usd || 0;
  const isNetPositive = netDeltaUsd >= 0;

  // Total deployable surplus
  const surplusCount = surplusData?.length || 0;

  // Minimum buffer from current forecast
  const minGap = forecastData?.summary?.ending_gap || 0;
  const forecastStatus = forecastData?.summary?.overall_status || 'Stable Liquidity';

  return (
    <div className="grid-5" style={{ marginBottom: '24px' }}>
      
      {/* 1. Consolidated Global Cash */}
      <div className="glass-card">
        <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
            Consolidated Cash (USD)
          </span>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(0, 145, 90, 0.15)', color: '#00915a' }}>
            <DollarSign size={18} />
          </div>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
          ${totalCashUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex items-center gap-2" style={{ marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
          <span>Unified multi-currency reporting balance</span>
        </div>
      </div>

      {/* 2. 24h Inflows */}
      <div className="glass-card">
        <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
            24h Total Inflows
          </span>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <ArrowUpRight size={18} />
          </div>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981', letterSpacing: '-0.02em' }}>
          +${inflowUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex items-center gap-2" style={{ marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
          <span>Customer receipts & loan draws</span>
        </div>
      </div>

      {/* 3. 24h Outflows & Net */}
      <div className="glass-card">
        <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
            24h Outflows (Net: {isNetPositive ? '+' : '-'}${Math.abs(netDeltaUsd).toLocaleString('en-US', { maximumFractionDigits: 0 })})
          </span>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <ArrowDownRight size={18} />
          </div>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#f87171', letterSpacing: '-0.02em' }}>
          -${outflowUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex items-center gap-2" style={{ marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
          <span>Supplier, payroll & capex settlements</span>
        </div>
      </div>

      {/* 4. Deployable Surplus */}
      <div className="glass-card">
        <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
            Deployable Surplus
          </span>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <Coins size={18} />
          </div>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#60a5fa', letterSpacing: '-0.02em' }}>
          {surplusCount} Entities
        </div>
        <div className="flex items-center gap-2" style={{ marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
          <span>Exceeding buffer +20% (Deployable idle cash)</span>
        </div>
      </div>

      {/* 5. 30-Day Solvency Outlook */}
      <div className="glass-card">
        <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
            30-Day Outlook
          </span>
          <div style={{ padding: '6px', borderRadius: '8px', background: activeBreachCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: activeBreachCount > 0 ? '#ef4444' : '#10b981' }}>
            {activeBreachCount > 0 ? <AlertCircle size={18} /> : <ShieldCheck size={18} />}
          </div>
        </div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: activeBreachCount > 0 ? '#f87171' : '#34d399', letterSpacing: '-0.01em' }}>
          {forecastStatus}
        </div>
        <div className="flex items-center gap-2" style={{ marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
          <span>{activeBreachCount} active threshold breach notices</span>
        </div>
      </div>

    </div>
  );
}
