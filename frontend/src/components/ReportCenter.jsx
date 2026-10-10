import React, { useState, useEffect } from 'react';
import { FileText, Download, Clock, Mail, CheckCircle2, X, Plus, Trash2 } from 'lucide-react';

export default function ReportCenter({ isOpen, onClose, entityName, userRole }) {
  const [reportType, setReportType] = useState('SOD'); // SOD or EOD
  const [reportData, setReportData] = useState(null);
  const [schedulerConfig, setSchedulerConfig] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const fetchReport = async () => {
    try {
      const endpoint = reportType === 'SOD' ? `/api/reports/sod?entity=${entityName || 'BNPPARIBAS_PARIS'}` : `/api/reports/eod?entity=${entityName || 'BNPPARIBAS_PARIS'}`;
      const res = await fetch(endpoint);
      const data = await res.json();
      setReportData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchScheduler = async () => {
    try {
      const res = await fetch('/api/reports/scheduler');
      const data = await res.json();
      setSchedulerConfig(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReport();
      fetchScheduler();
    }
  }, [isOpen, reportType, entityName]);

  const handleDownloadPdf = () => {
    window.open(`/api/reports/export/pdf?report_type=${reportType}&entity=${entityName || 'BNPPARIBAS_PARIS'}`, '_blank');
  };

  const handleDownloadCsv = () => {
    window.open(`/api/reports/export/csv?report_type=${reportType}&entity=${entityName || 'BNPPARIBAS_PARIS'}`, '_blank');
  };

  const handleToggleScheduler = async (key) => {
    if (!schedulerConfig) return;
    const updated = { ...schedulerConfig, [key]: !schedulerConfig[key] };
    setSchedulerConfig(updated);
    await saveScheduler(updated);
  };

  const handleAddEmail = async () => {
    if (!newEmail || !schedulerConfig) return;
    const updatedRecipients = [...schedulerConfig.recipients, newEmail];
    const updated = { ...schedulerConfig, recipients: updatedRecipients };
    setSchedulerConfig(updated);
    setNewEmail('');
    await saveScheduler(updated);
  };

  const handleRemoveEmail = async (emailToRemove) => {
    if (!schedulerConfig) return;
    const updatedRecipients = schedulerConfig.recipients.filter(e => e !== emailToRemove);
    const updated = { ...schedulerConfig, recipients: updatedRecipients };
    setSchedulerConfig(updated);
    await saveScheduler(updated);
  };

  const saveScheduler = async (cfg) => {
    try {
      await fetch('/api/reports/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg)
      });
      setStatusMsg('Schedule configuration saved!');
      setTimeout(() => setStatusMsg(''), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '950px', padding: '24px' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: '20px', borderBottom: '1px solid #1e2f52', paddingBottom: '12px' }}>
          <div className="flex items-center gap-3">
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <FileText size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#f1f5f9' }}>
                Automated Treasury Reporting Engine
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                Start-of-Day (SOD) briefing, End-of-Day (EOD) positions, PDF / CSV export, and email scheduling
              </p>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Report Type Selector & Export Buttons */}
        <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
          <div className="flex items-center gap-2" style={{ background: '#0c1526', padding: '4px', borderRadius: '8px', border: '1px solid #1e2f52' }}>
            <button
              onClick={() => setReportType('SOD')}
              style={{
                background: reportType === 'SOD' ? '#00915a' : 'transparent',
                color: reportType === 'SOD' ? '#ffffff' : '#94a3b8',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Start-of-Day (SOD) Briefing
            </button>
            <button
              onClick={() => setReportType('EOD')}
              style={{
                background: reportType === 'EOD' ? '#00915a' : 'transparent',
                color: reportType === 'EOD' ? '#ffffff' : '#94a3b8',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              End-of-Day (EOD) Report
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button className="btn btn-primary" onClick={handleDownloadPdf}>
              <Download size={14} /> Download PDF
            </button>
            <button className="btn btn-secondary" onClick={handleDownloadCsv}>
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Report Preview Card */}
        {reportData && (
          <div style={{ background: '#0c1526', border: '1px solid #1e2f52', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <div className="flex items-center justify-between" style={{ borderBottom: '1px solid #1e2f52', paddingBottom: '10px', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>{reportData.report_title}</span>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Target: <strong>{reportData.entity}</strong> | Business Date: <strong>{reportData.business_date}</strong>
                </div>
              </div>
              <span className="badge badge-green" style={{ fontSize: '10px' }}>OFFICIAL AUDIT READY</span>
            </div>

            {reportType === 'SOD' ? (
              <div className="grid-3" style={{ gap: '14px' }}>
                <div className="glass-card" style={{ padding: '12px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Opening Cash Balance</span>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9', marginTop: '4px' }}>
                    {reportData.expected_opening_position?.toLocaleString()} {reportData.currency}
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '12px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Upcoming Payments (24-48h)</span>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#ef4444', marginTop: '4px' }}>
                    -{reportData.upcoming_payments_24_48h?.total_outflow?.toLocaleString()} {reportData.currency}
                  </div>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>
                    {reportData.upcoming_payments_24_48h?.count} scheduled settlements
                  </span>
                </div>

                <div className="glass-card" style={{ padding: '12px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Day 7 Projected Cash</span>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>
                    {reportData.forecast_outlook?.day_7_projected?.toLocaleString()} {reportData.currency}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid-3" style={{ gap: '14px' }}>
                <div className="glass-card" style={{ padding: '12px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Closing Position</span>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9', marginTop: '4px' }}>
                    {reportData.closing_position?.toLocaleString()} {reportData.currency}
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '12px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Liquidity Gap (G = P - T)</span>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: reportData.liquidity_gap >= 0 ? '#10b981' : '#ef4444', marginTop: '4px' }}>
                    {reportData.liquidity_gap >= 0 ? '+' : ''}{reportData.liquidity_gap?.toLocaleString()} {reportData.currency}
                  </div>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>
                    Buffer: {reportData.threshold?.toLocaleString()} {reportData.currency}
                  </span>
                </div>

                <div className="glass-card" style={{ padding: '12px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>24h Net Cash Movement</span>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: reportData.daily_summary?.net_change_usd >= 0 ? '#10b981' : '#ef4444', marginTop: '4px' }}>
                    ${reportData.daily_summary?.net_change_usd?.toLocaleString()} USD
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Automated Scheduler Settings (Admin Accessible) */}
        {schedulerConfig && (
          <div style={{ background: '#0c1526', border: '1px solid #1e2f52', borderRadius: '12px', padding: '16px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
              <div className="flex items-center gap-2">
                <Clock size={16} color="#3b82f6" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>
                  Scheduled Delivery Configuration
                </span>
              </div>
              {statusMsg && <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>{statusMsg}</span>}
            </div>

            <div className="grid-2" style={{ marginBottom: '14px' }}>
              {/* SOD Toggle */}
              <div className="flex items-center justify-between" style={{ background: '#111d35', padding: '10px 14px', borderRadius: '8px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9' }}>Start-of-Day Briefing (08:00)</span>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Auto-triggered before morning opening</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={schedulerConfig.sod_enabled}
                  onChange={() => handleToggleScheduler('sod_enabled')}
                  style={{ width: '18px', height: '18px', accentColor: '#00915a' }}
                />
              </div>

              {/* EOD Toggle */}
              <div className="flex items-center justify-between" style={{ background: '#111d35', padding: '10px 14px', borderRadius: '8px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9' }}>End-of-Day Report (18:00)</span>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Auto-triggered after market closing</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={schedulerConfig.eod_enabled}
                  onChange={() => handleToggleScheduler('eod_enabled')}
                  style={{ width: '18px', height: '18px', accentColor: '#00915a' }}
                />
              </div>
            </div>

            {/* Email Recipients */}
            <div>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Recipient Distribution List</span>
              <div className="flex items-center gap-2" style={{ marginTop: '6px', marginBottom: '8px' }}>
                <input 
                  type="text" 
                  placeholder="treasury.member@bnpparibas.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-secondary" onClick={handleAddEmail} style={{ padding: '8px 12px' }}>
                  <Plus size={14} /> Add Recipient
                </button>
              </div>

              <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                {schedulerConfig.recipients.map(email => (
                  <span key={email} style={{ background: '#1e2f52', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={12} color="#94a3b8" /> {email}
                    <Trash2 size={12} color="#f87171" style={{ cursor: 'pointer' }} onClick={() => handleRemoveEmail(email)} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
