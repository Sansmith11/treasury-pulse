import React, { useState } from 'react';
import { 
  Building2, 
  ShieldAlert, 
  FileText, 
  Cpu, 
  Sparkles, 
  Sliders, 
  Database,
  Globe2,
  Lock,
  LogOut,
  ChevronDown
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
  isAICopilotOpen,
  googleUser,
  onOpenGoogleAuth,
  onSignOut
}) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
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

        {/* Action Controls & Google Auth */}
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
            <span>What-If</span>
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

          {/* Google Authentication Pill / Sign-In Button */}
          {googleUser ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsProfileMenuOpen(prev => !prev)}
                style={{
                  background: '#111d35',
                  border: '1px solid #1e2f52',
                  borderRadius: '9999px',
                  padding: '3px 10px 3px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <img 
                  src={googleUser.picture} 
                  alt={googleUser.name} 
                  style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} 
                />
                <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#f1f5f9' }}>
                    {googleUser.name.split(' ')[0]}
                  </div>
                  <div style={{ fontSize: '9px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    ● Google SSO
                  </div>
                </div>
                <ChevronDown size={13} color="#94a3b8" />
              </button>

              {/* Profile Dropdown */}
              {isProfileMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  width: '240px',
                  background: '#0c1526',
                  border: '1px solid #1e2f52',
                  borderRadius: '12px',
                  boxShadow: '0 12px 28px rgba(0, 0, 0, 0.5)',
                  padding: '12px',
                  zIndex: 50
                }}>
                  <div style={{ borderBottom: '1px solid #1e2f52', paddingBottom: '10px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9' }}>{googleUser.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{googleUser.email}</div>
                    <div style={{ marginTop: '6px' }}>
                      <span className="badge badge-green" style={{ fontSize: '9px' }}>Role: {googleUser.role}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => { setIsProfileMenuOpen(false); onOpenGoogleAuth(); }}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: '#cbd5e1',
                      fontSize: '12px',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#111d35'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    Switch Account
                  </button>

                  <button
                    onClick={() => { setIsProfileMenuOpen(false); onSignOut(); }}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: '#f87171',
                      fontSize: '12px',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={13} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenGoogleAuth}
              style={{
                background: '#ffffff',
                color: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Sign in with Google</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
