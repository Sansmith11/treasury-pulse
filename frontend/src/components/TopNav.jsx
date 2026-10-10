import React from 'react';
import { 
  Building2, 
  ShieldAlert, 
  FileText, 
  Cpu, 
  Sparkles, 
  Sliders, 
  Database,
  Globe2,
  Lock
} from 'lucide-react';

export default function TopNav({
  entitiesHierarchy,
  selectedRegion,
  setSelectedRegion,
  selectedEntity,
  setSelectedEntity,
  userRole,
  setUserRole,
  activeBreachCount,
  onOpenAlerts,
  onOpenReports,
  onOpenWhatIf,
  onOpenTransactions,
  onOpenBenchmark,
  onToggleAICopilot,
  isAICopilotOpen
}) {
  const regions = ["ALL", "EMEA", "APAC", "NAMER"];
  
  // Filter entities according to selected region
  const filteredEntities = (entitiesHierarchy || []).filter(e => {
    if (selectedRegion === "ALL") return true;
    return e.Region === selectedRegion;
  });

  return (
    <header className="header-glass">
      <div style={{ maxWidth: '1720px', margin: '0 auto', padding: '12px 24px' }} className="flex items-center justify-between">
        
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '10px', 
            background: 'linear-gradient(135deg, #00915a, #005a38)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(0, 145, 90, 0.4)'
          }}>
            <Building2 size={24} color="#ffffff" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#00915a' }}>
                BNP PARIBAS
              </span>
              <span style={{ fontSize: '10px', background: '#1e2f52', padding: '1px 6px', borderRadius: '4px', color: '#94a3b8' }}>
                TREASURY PULSE
              </span>
            </div>
            <h1 style={{ fontSize: '16px', fontWeight: 600, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
              Short-term Liquidity Manager
            </h1>
          </div>
        </div>

        {/* Hierarchical Scope Selectors */}
        <div className="flex items-center gap-3">
          {/* Region Selector */}
          <div className="flex items-center gap-2" style={{ background: '#111d35', padding: '4px 8px', borderRadius: '8px', border: '1px solid #1e2f52' }}>
            <Globe2 size={16} color="#64748b" />
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Region:</span>
            <select 
              value={selectedRegion}
              onChange={(e) => {
                const r = e.target.value;
                setSelectedRegion(r);
                setSelectedEntity(""); // Reset entity on region change
              }}
              style={{ background: 'transparent', border: 'none', padding: '4px 8px', color: '#f1f5f9', cursor: 'pointer' }}
            >
              {regions.map(r => (
                <option key={r} value={r} style={{ background: '#0c1526' }}>{r}</option>
              ))}
            </select>
          </div>

          {/* Entity Selector */}
          <div className="flex items-center gap-2" style={{ background: '#111d35', padding: '4px 8px', borderRadius: '8px', border: '1px solid #1e2f52' }}>
            <Building2 size={16} color="#64748b" />
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Entity:</span>
            <select 
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              style={{ background: 'transparent', border: 'none', padding: '4px 8px', color: '#f1f5f9', cursor: 'pointer' }}
            >
              <option value="" style={{ background: '#0c1526' }}>All Entities</option>
              {filteredEntities.map(e => (
                <option key={e.Entity} value={e.Entity} style={{ background: '#0c1526' }}>
                  {e.Entity} ({e.Currency})
                </option>
              ))}
            </select>
          </div>

          {/* User Role Switcher (RBAC) */}
          <div className="flex items-center gap-2" style={{ background: '#111d35', padding: '4px 8px', borderRadius: '8px', border: '1px solid #1e2f52' }}>
            <Lock size={15} color="#3b82f6" />
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Role:</span>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              style={{ background: 'transparent', border: 'none', padding: '4px 8px', color: '#60a5fa', fontWeight: 600, cursor: 'pointer' }}
            >
              <option value="Admin" style={{ background: '#0c1526' }}>Admin (Full)</option>
              <option value="Treasury Manager" style={{ background: '#0c1526' }}>Treasury Manager (Regional)</option>
              <option value="Analyst" style={{ background: '#0c1526' }}>Analyst (Entity Only)</option>
            </select>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Alerts Trigger with Badge */}
          <button 
            className="btn btn-secondary" 
            onClick={onOpenAlerts}
            title="Configure Thresholds and View Alert Matrix"
          >
            <ShieldAlert size={16} color={activeBreachCount > 0 ? '#ef4444' : '#10b981'} />
            <span>Alerts</span>
            {activeBreachCount > 0 && (
              <span className="badge badge-red" style={{ padding: '2px 6px', fontSize: '10px' }}>
                {activeBreachCount}
              </span>
            )}
          </button>

          {/* What-If Sandbox */}
          <button 
            className="btn btn-secondary" 
            onClick={onOpenWhatIf}
            title="Simulate FX, Rates, Payment Delays"
          >
            <Sliders size={16} color="#3b82f6" />
            <span>What-If Sandbox</span>
          </button>

          {/* Reporting Engine */}
          <button 
            className="btn btn-secondary" 
            onClick={onOpenReports}
            title="Start-of-Day & End-of-Day Reports"
          >
            <FileText size={16} color="#f59e0b" />
            <span>Reports</span>
          </button>

          {/* Transactions Explorer */}
          <button 
            className="btn btn-secondary" 
            onClick={onOpenTransactions}
            title="Browse 50,000 Transactions Dataset"
          >
            <Database size={16} color="#a855f7" />
            <span>Data (50k)</span>
          </button>

          {/* Benchmark */}
          <button 
            className="btn btn-secondary" 
            onClick={onOpenBenchmark}
            title="View Forecast Accuracy (MAPE/RMSE) & Latency SLA"
          >
            <Cpu size={16} color="#06b6d4" />
            <span>Benchmark</span>
          </button>

          {/* AI Copilot Drawer Toggle */}
          <button 
            className="btn btn-primary" 
            onClick={onToggleAICopilot}
            style={{ 
              background: isAICopilotOpen ? '#05b06f' : '#00915a',
              boxShadow: '0 0 12px rgba(0, 145, 90, 0.3)'
            }}
          >
            <Sparkles size={16} />
            <span>AI Copilot</span>
          </button>
        </div>

      </div>
    </header>
  );
}
