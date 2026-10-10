// Resilient cloud snapshot data for Vercel deployment (ensures 100% functionality even when standalone)

export const MOCK_HIERARCHY = {
  regions: ["EMEA", "APAC", "NAMER"],
  entities: [
    { Entity: "BNPPARIBAS_PARIS", Region: "EMEA", Country: "France", City: "Paris", Currency: "EUR", entity_code: "FRPA" },
    { Entity: "BNPPARIBAS_FRANKFURT", Region: "EMEA", Country: "Germany", City: "Frankfurt", Currency: "EUR", entity_code: "DEFR" },
    { Entity: "BNPPARIBAS_LONDON", Region: "EMEA", Country: "United Kingdom", City: "London", Currency: "GBP", entity_code: "GBLO" },
    { Entity: "BNPPARIBAS_NY", Region: "NAMER", Country: "United States", City: "New York", Currency: "USD", entity_code: "USNY" },
    { Entity: "BNPPARIBAS_TOKYO", Region: "APAC", Country: "Japan", City: "Tokyo", Currency: "JPY", entity_code: "JPTK" },
    { Entity: "BNPPARIBAS_SINGAPORE", Region: "APAC", Country: "Singapore", City: "Singapore", Currency: "SGD", entity_code: "SGSG" },
    { Entity: "BNPPARIBAS_MUMBAI", Region: "APAC", Country: "India", City: "Mumbai", Currency: "INR", entity_code: "INMU" },
    { Entity: "BNPPARIBAS_HK", Region: "APAC", Country: "Hong Kong", City: "Hong Kong", Currency: "HKD", entity_code: "HKHK" }
  ]
};

export const MOCK_METRICS = {
  total_cash_usd: 1445216174.92,
  daily_inflow_usd: 1882309.67,
  daily_outflow_usd: 2228253.40,
  net_change_usd: -345943.73,
  latest_date: "2026-10-10",
  active_entities: 8,
  total_transactions: 50000
};

export const MOCK_CURRENCY_BREAKDOWN = [
  { currency: "USD", balance_usd: 230416298.0, percentage: 15.94 },
  { currency: "EUR", balance_usd: 372574574.22, percentage: 25.78 },
  { currency: "JPY", balance_usd: 192872356.57, percentage: 13.35 },
  { currency: "GBP", balance_usd: 202089566.72, percentage: 13.98 },
  { currency: "SGD", balance_usd: 162634329.00, percentage: 11.25 },
  { currency: "INR", balance_usd: 154304198.06, percentage: 10.68 },
  { currency: "HKD", balance_usd: 130324851.84, percentage: 9.02 }
];

export const MOCK_TREND_TABLE = [
  { entity: "BNPPARIBAS_PARIS", currency: "EUR", region: "EMEA", current_balance: 189564727.0, current_balance_usd: 206625552.43, sparkline: [186e6, 187e6, 188e6, 187.5e6, 188.8e6, 189.1e6, 189.5e6], trend: "up" },
  { entity: "BNPPARIBAS_FRANKFURT", currency: "EUR", region: "EMEA", current_balance: 152246809.0, current_balance_usd: 165949021.81, sparkline: [150e6, 151e6, 151.2e6, 151.8e6, 152e6, 152.1e6, 152.2e6], trend: "up" },
  { entity: "BNPPARIBAS_NY", currency: "USD", region: "NAMER", current_balance: 230416298.0, current_balance_usd: 230416298.0, sparkline: [228e6, 229e6, 229.5e6, 230e6, 230.2e6, 230.1e6, 230.4e6], trend: "up" },
  { entity: "BNPPARIBAS_LONDON", currency: "GBP", region: "EMEA", current_balance: 157882474.0, current_balance_usd: 202089566.72, sparkline: [159e6, 158.5e6, 158e6, 157.9e6, 158.1e6, 157.7e6, 157.8e6], trend: "down" },
  { entity: "BNPPARIBAS_TOKYO", currency: "JPY", region: "APAC", current_balance: 28786918891.0, current_balance_usd: 192872356.57, sparkline: [28.5e9, 28.6e9, 28.55e9, 28.7e9, 28.65e9, 28.75e9, 28.78e9], trend: "up" },
  { entity: "BNPPARIBAS_SINGAPORE", currency: "SGD", region: "APAC", current_balance: 216845772.0, current_balance_usd: 162634329.0, sparkline: [215e6, 215.5e6, 216e6, 216.2e6, 216.5e6, 216.7e6, 216.8e6], trend: "up" },
  { entity: "BNPPARIBAS_MUMBAI", currency: "INR", region: "APAC", current_balance: 12858683172.0, current_balance_usd: 154304198.06, sparkline: [12.6e9, 12.7e9, 12.75e9, 12.8e9, 12.82e9, 12.84e9, 12.85e9], trend: "up" },
  { entity: "BNPPARIBAS_HK", currency: "HKD", region: "APAC", current_balance: 1018162905.0, current_balance_usd: 130324851.84, sparkline: [1.01e9, 1.012e9, 1.015e9, 1.016e9, 1.017e9, 1.0175e9, 1.018e9], trend: "up" }
];

export const generateMockForecast = (entity = "BNPPARIBAS_PARIS") => {
  const threshold = 5000000;
  const currency = "EUR";
  let pos = 189564727.0;
  const points = [];

  for (let d = 1; d <= 30; d++) {
    const dailyDrift = (Math.sin(d / 3.0) * 1.8e6) - 1.1e6;
    pos += dailyDrift;
    const spread = 2.5e6 * Math.sqrt(d) * 0.4;
    const gap = pos - threshold;
    points.push({
      day: d,
      date: `2026-10-${(10 + d).toString().padStart(2, '0')}`,
      projected_position: Math.round(pos),
      lower_bound: Math.round(pos - spread),
      upper_bound: Math.round(pos + spread),
      threshold: threshold,
      liquidity_gap: Math.round(gap),
      status: pos < threshold ? "Emergency" : (pos < threshold * 1.05 ? "Critical" : (pos < threshold * 1.1 ? "Warning" : "Normal")),
      severity: pos < threshold ? "red" : (pos < threshold * 1.05 ? "orange" : (pos < threshold * 1.1 ? "amber" : "green")),
      is_surplus: pos > threshold * 1.2,
      is_breach: pos < threshold * 1.1
    });
  }

  return {
    entity,
    currency,
    threshold,
    current_balance: 189564727.0,
    forecast_horizon_days: 30,
    points,
    summary: {
      min_position: Math.min(...points.map(p => p.projected_position)),
      max_position: Math.max(...points.map(p => p.projected_position)),
      ending_position: points[29].projected_position,
      ending_gap: points[29].liquidity_gap,
      breach_days_count: 0,
      surplus_days_count: 30,
      overall_status: "Deployable Surplus"
    },
    forecast_rationale: `${entity} demonstrates persistent structural cash surplus across the 30-day horizon with average excess liquidity of €170.2M EUR above safety threshold (+20%). High opportunity for short-term yield deployment or sweeping to group pooling structures.`
  };
};

export const MOCK_CASHFLOWS = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(2026, 9, i + 1);
  const inflows = 1800000 + Math.sin(i) * 600000;
  const outflows = 1600000 + Math.cos(i) * 500000;
  return {
    date: d.toISOString().slice(0, 10),
    inflows: Math.round(inflows),
    outflows: Math.round(outflows),
    net_flow: Math.round(inflows - outflows)
  };
});
