import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, AlertOctagon, AlertTriangle, X, Save, RefreshCw } from 'lucide-react';

export default function AlertMatrixModal({ isOpen, onClose, userRole }) {
  const [alertsData, setAlertsData] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [currencyThreshold, setCurrencyThreshold] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('BNPPARIBAS_PARIS');
  const [entityThreshold, setEntityThreshold] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      setAlertsData(data);
      if (data.thresholds?.currencies) {
        setCurrencyThreshold(data.thresholds.currencies[selectedCurrency] || '');
      }
      if (data.thresholds?.entities) {
        setEntityThreshold(data.thresholds.entities[selectedEntity] || '');
      }
    } catch (e) {
      console.error("Failed to load alerts:", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAlerts();
    }
  }, [isOpen]);

  const handleUpdateCurrency = async () => {
    try {
      setSaveStatus('Saving...');
      const res = await fetch('/api/alerts/threshold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency: selectedCurrency,
          threshold: parseFloat(currencyThreshold)
        })
      });
      if (res.ok) {
        setSaveStatus('Currency buffer updated!');
        fetchAlerts();
      } else {
        setSaveStatus('Error saving');
      }
    } catch (e) {
      setSaveStatus('Error');
    }
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleUpdateEntity = async () => {
    try {
      setSaveStatus('Saving...');
      const res = await fetch('/api/alerts/threshold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: selectedEntity,
          threshold: parseFloat(entityThreshold)
        })
      });
      if (res.ok) {
        setSaveStatus('Entity buffer updated!');
        fetchAlerts();
      } else {
        setSaveStatus('Error saving');
      }
    } catch (e) {
      setSaveStatus('Error');
    }
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleResolve = async (alertId) => {
    try {
      await fetch('/api/alerts/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_id: alertId, resolution_status: 'Resolved' })
      });
      fetchAlerts();
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const thresholds = alertsData?.thresholds || {};
  const history = alertsData?.history || [];
  const canEdit = userRole === 'Admin';

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '950px', padding: '24px' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: '20px', borderBottom: '1px solid #1e2f52', paddingBottom: '12px' }}>
          <div className="flex items-center gap-3">
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#f1f5f9' }}>
                Configurable Alert Matrix & Breach Monitor
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                Hourly liquidity gap evaluation engine ($G = P - T$) and threshold triggers
              </p>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Severity Bands Explanation */}
        <div className="grid-3" style={{ marginBottom: '20px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '12px' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: '4px' }}>
              <AlertTriangle size={16} color="#f59e0b" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24' }}>LEVEL 1: WARNING</span>
            </div>
            <p style={{ fontSize: '11px', color: '#cbd5e1' }}>
              Cash position is within <strong>5% to 10%</strong> above the minimum buffer. Indicates developing pressure.
            </p>
          </div>

          <div style={{ background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.3)', borderRadius: '10px', padding: '12px' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: '4px' }}>
              <AlertTriangle size={16} color="#f97316" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#fdba74' }}>LEVEL 2: CRITICAL</span>
            </div>
            <p style={{ fontSize: '11px', color: '#cbd5e1' }}>
              Cash position is within <strong>0% to 5%</strong> above buffer. Tight buffer headroom requiring treasury vigilance.
            </p>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '12px' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: '4px' }}>
              <AlertOctagon size={16} color="#ef4444" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#f87171' }}>LEVEL 3: EMERGENCY</span>
            </div>
            <p style={{ fontSize: '11px', color: '#cbd5e1' }}>
              Position <strong>drops below threshold or negative</strong> (overdraft risk). Immediate funding draw required.
            </p>
          </div>
        </div>

        {/* Threshold Configuration Section (Admin Enabled) */}
        <div style={{ background: '#0c1526', border: '1px solid #1e2f52', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>
              Threshold Buffer Configuration (Admin UI)
            </span>
            {!canEdit && (
              <span className="badge badge-amber" style={{ fontSize: '10px' }}>
                Read-Only (Admin role required to modify)
              </span>
            )}
            {saveStatus && (
              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>{saveStatus}</span>
            )}
          </div>

          <div className="grid-2">
            {/* Currency Limits */}
            <div>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Per-Currency Limits (e.g. EUR 50k, USD 60k, JPY 5M, GBP 40k)</span>
              <div className="flex items-center gap-2" style={{ marginTop: '6px' }}>
                <select 
                  value={selectedCurrency} 
                  onChange={(e) => {
                    const c = e.target.value;
                    setSelectedCurrency(c);
                    setCurrencyThreshold(thresholds.currencies?.[c] || '');
                  }}
                  style={{ width: '90px' }}
                >
                  {Object.keys(thresholds.currencies || {}).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input 
                  type="number" 
                  value={currencyThreshold} 
                  disabled={!canEdit}
                  onChange={(e) => setCurrencyThreshold(e.target.value)}
                  placeholder="Buffer Amount"
                  style={{ flex: 1 }}
                />
                {canEdit && (
                  <button className="btn btn-primary" onClick={handleUpdateCurrency} style={{ padding: '8px 12px' }}>
                    <Save size={14} /> Update
                  </button>
                )}
              </div>
            </div>

            {/* Entity Limits */}
            <div>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Per-Entity Subsidiary Buffer</span>
              <div className="flex items-center gap-2" style={{ marginTop: '6px' }}>
                <select 
                  value={selectedEntity} 
                  onChange={(e) => {
                    const ent = e.target.value;
                    setSelectedEntity(ent);
                    setEntityThreshold(thresholds.entities?.[ent] || '');
                  }}
                  style={{ width: '180px' }}
                >
                  {Object.keys(thresholds.entities || {}).map(ent => (
                    <option key={ent} value={ent}>{ent}</option>
                  ))}
                </select>
                <input 
                  type="number" 
                  value={entityThreshold} 
                  disabled={!canEdit}
                  onChange={(e) => setEntityThreshold(e.target.value)}
                  placeholder="Buffer Amount"
                  style={{ flex: 1 }}
                />
                {canEdit && (
                  <button className="btn btn-primary" onClick={handleUpdateEntity} style={{ padding: '8px 12px' }}>
                    <Save size={14} /> Update
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Alert History Log Table */}
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>
              Recent Breach & Warning History Log ({history.length} Events)
            </span>
            <button className="btn btn-secondary" onClick={fetchAlerts} style={{ padding: '4px 8px', fontSize: '11px' }}>
              <RefreshCw size={12} /> Refresh Log
            </button>
          </div>

          <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #1e2f52', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#0c1526', color: '#94a3b8', borderBottom: '1px solid #1e2f52' }}>
                  <th style={{ padding: '8px 10px' }}>Timestamp</th>
                  <th style={{ padding: '8px 10px' }}>Severity</th>
                  <th style={{ padding: '8px 10px' }}>Entity</th>
                  <th style={{ padding: '8px 10px' }}>Breach Message</th>
                  <th style={{ padding: '8px 10px' }}>Status</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                      No threshold breaches recorded.
                    </td>
                  </tr>
                ) : (
                  history.map((a) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid rgba(30, 47, 82, 0.4)' }}>
                      <td style={{ padding: '8px 10px', color: '#94a3b8', fontFamily: 'JetBrains Mono' }}>
                        {a.timestamp?.slice(5, 16)}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span className={`badge ${a.severity === 'red' ? 'badge-red' : a.severity === 'orange' ? 'badge-amber' : 'badge-amber'}`} style={{ fontSize: '9px' }}>
                          {a.status}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#f1f5f9' }}>
                        {a.entity}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#cbd5e1' }}>
                        {a.message}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ fontSize: '11px', color: a.resolution_status === 'Resolved' ? '#10b981' : '#f59e0b' }}>
                          {a.resolution_status}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        {a.resolution_status !== 'Resolved' && (
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleResolve(a.id)}
                            style={{ padding: '2px 6px', fontSize: '10px' }}
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
