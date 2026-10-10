import React, { useState, useEffect } from 'react';
import TopNav from './components/TopNav';
import AlertBanner from './components/AlertBanner';
import OverviewMetrics from './components/OverviewMetrics';
import LiquidityGapChart from './components/LiquidityGapChart';
import InflowOutflowChart from './components/InflowOutflowChart';
import CurrencyBreakdownDonut from './components/CurrencyBreakdownDonut';
import PositionTrendTable from './components/PositionTrendTable';
import WhatIfSimulator from './components/WhatIfSimulator';
import AlertMatrixModal from './components/AlertMatrixModal';
import ReportCenter from './components/ReportCenter';
import TransactionsTableModal from './components/TransactionsTableModal';
import BenchmarkModal from './components/BenchmarkModal';
import AICopilotChat from './components/AICopilotChat';
import GoogleAuthModal from './components/GoogleAuthModal';

import { 
  MOCK_HIERARCHY, 
  MOCK_METRICS, 
  MOCK_CURRENCY_BREAKDOWN, 
  MOCK_TREND_TABLE, 
  generateMockForecast, 
  MOCK_CASHFLOWS 
} from './mockData';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function App() {
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [selectedEntity, setSelectedEntity] = useState('BNPPARIBAS_PARIS');
  const [userRole, setUserRole] = useState('Admin'); // Admin, Treasury Manager, Analyst

  // Google Authentication State
  const [googleUser, setGoogleUser] = useState(() => {
    try {
      const saved = localStorage.getItem('treasury_pulse_user');
      return saved ? JSON.parse(saved) : {
        name: "Jean-Pierre Laurent",
        email: "jean.laurent@bnpparibas-group.com",
        role: "Admin",
        picture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
        verified: true,
        auth_provider: "Google"
      };
    } catch (e) {
      return null;
    }
  });

  // Modals state
  const [isGoogleAuthOpen, setIsGoogleAuthOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);

  // Data states
  const [hierarchy, setHierarchy] = useState(MOCK_HIERARCHY);
  const [metrics, setMetrics] = useState(MOCK_METRICS);
  const [alertsData, setAlertsData] = useState({ active_alerts: [], history: [] });
  const [surplusData, setSurplusData] = useState([]);
  const [forecastData, setForecastData] = useState(generateMockForecast());
  const [cashflows, setCashflows] = useState(MOCK_CASHFLOWS);
  const [currencyBreakdown, setCurrencyBreakdown] = useState(MOCK_CURRENCY_BREAKDOWN);
  const [trendData, setTrendData] = useState(MOCK_TREND_TABLE);

  // Initial load
  useEffect(() => {
    fetchHierarchy();
    fetchAlerts();
    fetchCurrencyBreakdown();
  }, []);

  // Reload when scope filters change
  useEffect(() => {
    fetchMetrics();
    fetchSurplus();
    fetchForecast();
    fetchCashflows();
    fetchTrendData();
  }, [selectedRegion, selectedEntity]);

  const fetchHierarchy = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/hierarchy`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setHierarchy(data);
    } catch (e) {
      setHierarchy(MOCK_HIERARCHY);
    }
  };

  const fetchMetrics = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedEntity) params.append('entity', selectedEntity);
      else if (selectedRegion !== 'ALL') params.append('region', selectedRegion);

      const res = await fetch(`${API_BASE}/api/metrics?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMetrics(data);
    } catch (e) {
      setMetrics(MOCK_METRICS);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/alerts`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAlertsData(data);
    } catch (e) {
      setAlertsData({ active_alerts: [], history: [] });
    }
  };

  const fetchSurplus = async () => {
    try {
      const regParam = selectedRegion !== 'ALL' ? `?region=${selectedRegion}` : '';
      const res = await fetch(`${API_BASE}/api/surplus${regParam}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSurplusData(data);
    } catch (e) {
      setSurplusData([]);
    }
  };

  const fetchForecast = async () => {
    try {
      const ent = selectedEntity || 'BNPPARIBAS_PARIS';
      const res = await fetch(`${API_BASE}/api/forecast?entity=${ent}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setForecastData(data);
    } catch (e) {
      setForecastData(generateMockForecast(selectedEntity));
    }
  };

  const fetchCashflows = async () => {
    try {
      const params = new URLSearchParams({ days: '30' });
      if (selectedEntity) params.append('entity', selectedEntity);
      else if (selectedRegion !== 'ALL') params.append('region', selectedRegion);

      const res = await fetch(`${API_BASE}/api/cashflows/recent?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCashflows(data);
    } catch (e) {
      setCashflows(MOCK_CASHFLOWS);
    }
  };

  const fetchCurrencyBreakdown = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/currency-breakdown`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCurrencyBreakdown(data);
    } catch (e) {
      setCurrencyBreakdown(MOCK_CURRENCY_BREAKDOWN);
    }
  };

  const fetchTrendData = async () => {
    try {
      const regParam = selectedRegion !== 'ALL' ? `?region=${selectedRegion}` : '';
      const res = await fetch(`${API_BASE}/api/trend-table${regParam}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTrendData(data);
    } catch (e) {
      setTrendData(MOCK_TREND_TABLE);
    }
  };

  const handleGoogleLoginSuccess = (user) => {
    setGoogleUser(user);
    if (user.role) {
      setUserRole(user.role);
    }
    localStorage.setItem('treasury_pulse_user', JSON.stringify(user));
  };

  const handleSignOut = () => {
    setGoogleUser(null);
    localStorage.removeItem('treasury_pulse_user');
  };

  const activeAlerts = alertsData?.active_alerts || [];
  const activeBreachCount = activeAlerts.filter(a => a.severity === 'red' || a.severity === 'orange').length;

  return (
    <div>
      {/* Top Navigation */}
      <TopNav
        entitiesHierarchy={hierarchy?.entities}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
        selectedEntity={selectedEntity}
        setSelectedEntity={setSelectedEntity}
        userRole={userRole}
        setUserRole={setUserRole}
        activeBreachCount={activeBreachCount}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenReports={() => setIsReportsOpen(true)}
        onOpenWhatIf={() => setIsWhatIfOpen(true)}
        onOpenTransactions={() => setIsTransactionsOpen(true)}
        onOpenBenchmark={() => setIsBenchmarkOpen(true)}
        onToggleAICopilot={() => setIsAICopilotOpen(prev => !prev)}
        isAICopilotOpen={isAICopilotOpen}
        googleUser={googleUser}
        onOpenGoogleAuth={() => setIsGoogleAuthOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Container */}
      <main className="app-container">
        
        {/* Dynamic Alert Banner */}
        <AlertBanner 
          activeAlerts={activeAlerts} 
          onOpenAlerts={() => setIsAlertsOpen(true)} 
        />

        {/* Executive Overview KPI Cards */}
        <OverviewMetrics
          metrics={metrics}
          surplusData={surplusData}
          forecastData={forecastData}
          activeBreachCount={activeBreachCount}
        />

        {/* 30-Day Liquidity Gap Chart */}
        <LiquidityGapChart
          forecastData={forecastData}
          entityName={selectedEntity || 'BNPPARIBAS_PARIS'}
        />

        {/* Inflows/Outflows & Currency Breakdown Grid */}
        <div className="grid-2" style={{ marginBottom: '24px' }}>
          <InflowOutflowChart
            cashflows={cashflows}
            entityName={selectedEntity || selectedRegion}
          />
          <CurrencyBreakdownDonut
            currencyBreakdown={currencyBreakdown}
          />
        </div>

        {/* Global Subsidiary Trend Table */}
        <PositionTrendTable
          trendData={trendData}
          selectedEntity={selectedEntity}
          onSelectEntity={(ent) => setSelectedEntity(ent)}
        />

      </main>

      {/* Modals & AI Drawer */}
      <GoogleAuthModal
        isOpen={isGoogleAuthOpen}
        onClose={() => setIsGoogleAuthOpen(false)}
        onLoginSuccess={handleGoogleLoginSuccess}
      />

      <WhatIfSimulator
        entity={selectedEntity || 'BNPPARIBAS_PARIS'}
        isOpen={isWhatIfOpen}
        onClose={() => setIsWhatIfOpen(false)}
      />

      <AlertMatrixModal
        isOpen={isAlertsOpen}
        onClose={() => { setIsAlertsOpen(false); fetchAlerts(); }}
        userRole={userRole}
      />

      <ReportCenter
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
        entityName={selectedEntity || 'BNPPARIBAS_PARIS'}
        userRole={userRole}
      />

      <TransactionsTableModal
        isOpen={isTransactionsOpen}
        onClose={() => setIsTransactionsOpen(false)}
      />

      <BenchmarkModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
      />

      <AICopilotChat
        isOpen={isAICopilotOpen}
        onClose={() => setIsAICopilotOpen(false)}
        activeEntity={selectedEntity || 'BNPPARIBAS_PARIS'}
        activeRegion={selectedRegion}
      />

    </div>
  );
}
