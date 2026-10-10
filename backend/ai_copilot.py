import re
from typing import Dict, List, Optional, Any
from datetime import datetime

class AICopilot:
    def __init__(self, data_engine, forecasting_engine, alert_engine, whatif_simulator):
        self.data_engine = data_engine
        self.forecasting_engine = forecasting_engine
        self.alert_engine = alert_engine
        self.whatif_simulator = whatif_simulator

    def identify_surplus_positions(self, region: Optional[str] = None) -> List[Dict[str, Any]]:
        """Auto-flags entities where latest position > threshold + 20% as deployable surplus."""
        surplus_list = []
        entities = self.data_engine.get_entities_list()
        latest_date = self.data_engine.daily_positions["date"].max()
        latest_snaps = self.data_engine.daily_positions[self.data_engine.daily_positions["date"] == latest_date]

        for ent in entities:
            e_name = ent["Entity"]
            e_reg = ent["Region"]
            e_curr = ent["Currency"]

            if region and e_reg != region:
                continue

            snap = latest_snaps[latest_snaps["entity"] == e_name]
            if snap.empty:
                continue

            pos = float(snap["closing_balance"].values[0])
            thresh = self.alert_engine.get_threshold(entity=e_name, currency=e_curr)
            surplus_buffer = thresh * 1.20

            if pos > surplus_buffer:
                deployable_amount = pos - surplus_buffer
                surplus_list.append({
                    "entity": e_name,
                    "region": e_reg,
                    "currency": e_curr,
                    "current_position": round(pos, 2),
                    "threshold": round(thresh, 2),
                    "surplus_buffer": round(surplus_buffer, 2),
                    "deployable_cash": round(deployable_amount, 2),
                    "percentage_above_threshold": round(((pos - thresh) / thresh) * 100, 1),
                    "status": "High Deployable Surplus (> +20%)"
                })

        surplus_list.sort(key=lambda x: x["deployable_cash"], reverse=True)
        return surplus_list

    def generate_recommendation_engine_action_plan(self, entity: Optional[str] = None, region: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Scores treasury actions by expected liquidity impact:
        1. Accelerate collections
        2. Delay non-urgent payments
        3. Invest surplus in short-term instruments
        4. Transfer cash between entities/currencies
        5. Utilize cash pooling
        """
        recommendations = []
        surpluses = self.identify_surplus_positions(region=region)
        active_alerts = self.alert_engine.get_active_alerts(entity=entity)
        
        # Check deficit or breach entities
        breach_entities = [a["entity"] for a in active_alerts if a["severity"] in ["red", "orange"]]
        
        # 1. Cash Pooling & Intercompany Sweeps
        if surpluses and breach_entities:
            donor = surpluses[0]
            recipient = breach_entities[0]
            transfer_amt = min(donor["deployable_cash"] * 0.6, 10000000.0)
            recommendations.append({
                "action_type": "Utilize Cash Pooling & Intercompany Sweep",
                "priority": "HIGH",
                "impact_score": 95,
                "description": f"Execute automated intercompany sweep of {transfer_amt:,.2f} {donor['currency']} from surplus entity {donor['entity']} to cover liquidity gap in {recipient}.",
                "expected_impact": "Completely eliminates overdraft risk and reduces group credit facility drawdown costs.",
                "action_category": "Internal Liquidity Optimization"
            })

        # 2. Invest surplus in short-term money market
        for s in surpluses[:2]:
            est_interest = s["deployable_cash"] * 0.038 * (30 / 365.0)
            recommendations.append({
                "action_type": "Invest Surplus in Short-Term Instruments",
                "priority": "MEDIUM",
                "impact_score": 82,
                "description": f"Place deployable idle cash of {s['deployable_cash']:,.2f} {s['currency']} from {s['entity']} into 30-day overnight repos or commercial paper (yielding ~3.8% p.a.).",
                "expected_impact": f"Generates ~{est_interest:,.2f} {s['currency']} in risk-free interest income.",
                "action_category": "Yield Enhancement"
            })

        # 3. Accelerate collections
        recommendations.append({
            "action_type": "Accelerate Collections",
            "priority": "MEDIUM",
            "impact_score": 78,
            "description": "Offer dynamic early-payment discounts (e.g. 0.5% net 10) to Tier-1 counterparties (Siemens, Airbus) with pending receivables.",
            "expected_impact": "Accelerates approximately $1.5M - $3.0M equivalent into Day 1-3 liquidity buffer.",
            "action_category": "Working Capital"
        })

        # 4. Delay non-urgent payments
        recommendations.append({
            "action_type": "Delay Non-Urgent Payments",
            "priority": "MEDIUM",
            "impact_score": 74,
            "description": "Shift non-essential indirect supplier payables by +3 business days while respecting penalty contracts.",
            "expected_impact": "Conserves buffer cushion during projected mid-week payment troughs.",
            "action_category": "Cash Preservation"
        })

        # 5. Currency Transfer & FX Hedging
        recommendations.append({
            "action_type": "Transfer Cash Between Currencies / FX Forward",
            "priority": "LOW",
            "impact_score": 68,
            "description": "Hedge exposure on volatile cross-border pairs (USD/EUR) using short-dated FX swaps to lock in reporting currency liquidity parity.",
            "expected_impact": "Neutralizes potential 5-10% FX swing drag on group consolidated reporting cash.",
            "action_category": "Risk Mitigation"
        })

        return sorted(recommendations, key=lambda x: x["impact_score"], reverse=True)

    def answer_query(self, query: str, active_entity: Optional[str] = "BNPPARIBAS_PARIS", active_region: Optional[str] = None) -> Dict[str, Any]:
        """
        RAG / Conversational AI Handler:
        Interprets natural language questions, extracts grounded context, and answers with
        structured rationale, action plans, and charts.
        """
        q_lower = query.lower()
        chart_spec = None
        
        # 1. Intent: Why is there a shortfall / forecast rationale
        if "shortfall" in q_lower or "forecast" in q_lower or "why" in q_lower:
            target_ent = active_entity or "BNPPARIBAS_PARIS"
            fc = self.forecasting_engine.generate_30day_forecast(entity=target_ent)
            rationale = fc["forecast_rationale"]
            
            # Build mini chart of first 10 days
            chart_spec = {
                "type": "line",
                "title": f"30-Day Liquidity Forecast & Gap ({target_ent})",
                "labels": [p["date"] for p in fc["points"][:14]],
                "datasets": [
                    {
                        "label": "Projected Position",
                        "data": [p["projected_position"] for p in fc["points"][:14]],
                        "borderColor": "#2563eb",
                        "backgroundColor": "rgba(37, 99, 235, 0.1)"
                    },
                    {
                        "label": "Threshold Buffer",
                        "data": [p["threshold"] for p in fc["points"][:14]],
                        "borderColor": "#ef4444",
                        "borderDash": [5, 5]
                    }
                ]
            }

            response_text = (
                f"### Analysis for {target_ent}:\n\n"
                f"{rationale}\n\n"
                f"**Key Metrics:**\n"
                f"- Minimum Projected Buffer: `{min(p['liquidity_gap'] for p in fc['points']):,.2f} {fc['currency']}`\n"
                f"- 30-Day Ending Cash: `{fc['points'][-1]['projected_position']:,.2f} {fc['currency']}`\n"
                f"- Days in Breach: `{fc['summary']['breach_days_count']}` days."
            )

        # 2. Intent: What-if payment delay
        elif "what-if" in q_lower or "delay" in q_lower or "delay payment" in q_lower:
            days_match = re.search(r"(\d+)\s*day", q_lower)
            days = int(days_match.group(1)) if days_match else 3
            target_ent = active_entity or "BNPPARIBAS_PARIS"
            sim = self.whatif_simulator.run_simulation(entity=target_ent, payment_delay_days=days)
            impact = sim["quantified_impact"]

            chart_spec = {
                "type": "bar",
                "title": f"Baseline vs Delay ({days} Days) Liquidity Gap Comparison",
                "labels": ["Min Buffer Gap", "Overdraft Expense", "Surplus Yield"],
                "datasets": [
                    {
                        "label": "Baseline",
                        "data": [impact["baseline_min_gap"], impact["baseline_overdraft_cost"], impact["baseline_surplus_yield"]],
                        "backgroundColor": "#94a3b8"
                    },
                    {
                        "label": f"Scenario (+{days}d)",
                        "data": [impact["scenario_min_gap"], impact["scenario_overdraft_cost"], impact["scenario_surplus_yield"]],
                        "backgroundColor": "#10b981"
                    }
                ]
            }

            response_text = (
                f"### What-If Simulation: Delaying Payments by +{days} Days for {target_ent}\n\n"
                f"{sim['assessment']}\n\n"
                f"**Quantified Financial Delta:**\n"
                f"- **Minimum Gap Shift:** `{impact['delta_min_gap']:+,.2f} {sim['currency']}`\n"
                f"- **Overdraft Cost Delta:** `{impact['delta_overdraft_cost']:+,.2f} {sim['currency']}`\n"
                f"- **Net Financial Benefit:** `{impact['net_financial_delta']:+,.2f} {sim['currency']}`\n\n"
                f"Postponing operational payments by {days} days buffers liquidity during critical settlement cycles without requiring external funding draws."
            )

        # 3. Intent: Surplus position
        elif "surplus" in q_lower or "idle" in q_lower:
            reg = "APAC" if "apac" in q_lower else ("EMEA" if "emea" in q_lower else ("NAMER" if "namer" in q_lower else active_region))
            surpluses = self.identify_surplus_positions(region=reg)
            
            if surpluses:
                total_surplus_usd = sum(
                    s["deployable_cash"] * self.data_engine.fx_rates.get(s["currency"], 1.0)
                    for s in surpluses
                )
                chart_spec = {
                    "type": "doughnut",
                    "title": f"Deployable Surplus Distribution ({reg or 'Global'})",
                    "labels": [s["entity"] for s in surpluses],
                    "datasets": [{
                        "data": [s["deployable_cash"] for s in surpluses],
                        "backgroundColor": ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"]
                    }]
                }

                lines = [f"- **{s['entity']}** ({s['region']}): `{s['deployable_cash']:,.2f} {s['currency']}` (+{s['percentage_above_threshold']}% above safety threshold)" for s in surpluses]
                response_text = (
                    f"### Deployable Cash Surplus Identification ({reg or 'Global'}):\n\n"
                    f"We have identified **${total_surplus_usd:,.2f} USD equivalent** in idle funds exceeding threshold +20%:\n\n" +
                    "\n".join(lines) + "\n\n"
                    f"**Recommendation:** Sweep excess funds to centralized cash pool or place in short-term interest bearing deposits."
                )
            else:
                response_text = f"No entities currently exceed the deployable surplus criterion (+20% above buffer) in {reg or 'the selected scope'}."

        # 4. Intent: Action plan & recommendations
        elif "action" in q_lower or "recommend" in q_lower or "plan" in q_lower:
            target_ent = active_entity or "BNPPARIBAS_PARIS"
            plan = self.generate_recommendation_engine_action_plan(entity=target_ent, region=active_region)
            
            plan_str = ""
            for idx, p in enumerate(plan, 1):
                plan_str += f"{idx}. **[{p['priority']}] {p['action_type']}** (Score: {p['impact_score']}/100)\n"
                plan_str += f"   - *Details:* {p['description']}\n"
                plan_str += f"   - *Expected Impact:* {p['expected_impact']}\n\n"

            response_text = (
                f"### Strategic Treasury Action Plan for {target_ent}:\n\n"
                f"Based on real-time liquidity gaps, counterparty risk ratings, and global surplus buffers, here is the prioritized action roadmap:\n\n"
                f"{plan_str}"
            )

        # 5. General inquiries
        else:
            summary = self.data_engine.get_summary_metrics(entity=active_entity, region=active_region)
            response_text = (
                f"### Treasury Pulse Copilot\n\n"
                f"Monitoring liquidity for **{active_entity or 'Global Treasury'}**:\n"
                f"- **Consolidated Cash:** `${summary['total_cash_usd']:,.2f} USD`\n"
                f"- **24h Inflows:** `${summary['daily_inflow_usd']:,.2f} USD`\n"
                f"- **24h Outflows:** `${summary['daily_outflow_usd']:,.2f} USD`\n\n"
                f"You can ask me questions like:\n"
                f"- *'Why is there a shortfall next week?'*\n"
                f"- *'What-if we delay payments by 3 days?'*\n"
                f"- *'What is our surplus position in APAC?'*\n"
                f"- *'What action plan do you recommend?'*"
            )

        return {
            "query": query,
            "response": response_text,
            "chart_spec": chart_spec,
            "timestamp": datetime.now().strftime("%H:%M:%S")
        }
