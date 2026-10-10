import React from 'react';
import { AlertTriangle, AlertOctagon, CheckCircle2, ChevronRight } from 'lucide-react';

export default function AlertBanner({ activeAlerts, onOpenAlerts }) {
  if (!activeAlerts || activeAlerts.length === 0) {
    return (
      <div style={{
        background: 'rgba(16, 185, 129, 0.08)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: '10px',
        padding: '10px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div className="flex items-center gap-3">
          <CheckCircle2 size={18} color="#10b981" />
          <span style={{ fontSize: '13px', color: '#e2e8f0' }}>
            <strong>All Subsidiaries Solvent:</strong> Global cash positions exceed configured safety buffers. Zero emergency breaches recorded.
          </span>
        </div>
        <button 
          onClick={onOpenAlerts}
          style={{ background: 'transparent', border: 'none', color: '#10b981', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          View Alert Matrix <ChevronRight size={14} />
        </button>
      </div>
    );
  }

  const criticalOrEmergency = activeAlerts.filter(a => a.severity === 'red' || a.severity === 'orange');
  const bannerAlert = criticalOrEmergency[0] || activeAlerts[0];
  const isEmergency = bannerAlert.severity === 'red';

  return (
    <div style={{
      background: isEmergency ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
      border: `1px solid ${isEmergency ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
      borderRadius: '10px',
      padding: '12px 18px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div className="flex items-center gap-3">
        {isEmergency ? (
          <AlertOctagon size={20} color="#ef4444" style={{ flexShrink: 0 }} />
        ) : (
          <AlertTriangle size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
        )}
        <div>
          <div className="flex items-center gap-2">
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              background: isEmergency ? '#ef4444' : '#f59e0b',
              color: '#ffffff'
            }}>
              {bannerAlert.status.toUpperCase()}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
              {bannerAlert.entity} ({bannerAlert.currency}):
            </span>
            <span style={{ fontSize: '13px', color: '#e2e8f0' }}>
              {bannerAlert.message}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
          {activeAlerts.length} total active notice{activeAlerts.length > 1 ? 's' : ''}
        </span>
        <button 
          onClick={onOpenAlerts}
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '12px' }}
        >
          Manage Alerts <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
