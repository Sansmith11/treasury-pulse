from typing import Dict, List, Optional, Any
import numpy as np

class WhatIfSimulator:
    def __init__(self, forecasting_engine, data_engine):
        self.forecasting_engine = forecasting_engine
        self.data_engine = data_engine
        self.overdraft_penalty_rate_annual = 0.085 # 8.5% p.a.
        self.short_term_investment_yield_annual = 0.038 # 3.8% p.a.

    def run_simulation(self, 
                       entity: str,
                       payment_delay_days: int = 0,
                       capex_postpone_days: int = 0,
                       fx_shift_pct: float = 0.0,
                       rate_shift_bps: float = 0.0,
                       degrade_ratings: bool = False) -> Dict[str, Any]:
        """
        Runs side-by-side baseline vs scenario simulation.
        Computes exact delta in liquidity gap, overdraft interest penalties, and surplus opportunities.
        """
        # 1. Baseline run (all parameters 0 / default)
        baseline = self.forecasting_engine.generate_30day_forecast(
            entity=entity,
            payment_delay_days=0,
            capex_postpone_days=0,
            fx_shift_pct=0.0,
            rate_shift_bps=0.0,
            degrade_ratings=False
        )

        # 2. Scenario run (with user-selected slider values)
        scenario = self.forecasting_engine.generate_30day_forecast(
            entity=entity,
            payment_delay_days=payment_delay_days,
            capex_postpone_days=capex_postpone_days,
            fx_shift_pct=fx_shift_pct,
            rate_shift_bps=rate_shift_bps,
            degrade_ratings=degrade_ratings
        )

        curr = baseline["currency"]
        threshold = baseline["threshold"]

        # Calculate financial metrics for baseline
        base_overdraft_cost = 0.0
        base_surplus_yield = 0.0
        base_min_gap = min(p["liquidity_gap"] for p in baseline["points"])
        base_end_gap = baseline["points"][-1]["liquidity_gap"]

        for pt in baseline["points"]:
            pos = pt["projected_position"]
            if pos < 0:
                base_overdraft_cost += abs(pos) * (self.overdraft_penalty_rate_annual / 365.0)
            elif pos > threshold * 1.20:
                deployable = pos - (threshold * 1.20)
                base_surplus_yield += deployable * (self.short_term_investment_yield_annual / 365.0)

        # Calculate financial metrics for scenario
        scen_overdraft_cost = 0.0
        scen_surplus_yield = 0.0
        scen_min_gap = min(p["liquidity_gap"] for p in scenario["points"])
        scen_end_gap = scenario["points"][-1]["liquidity_gap"]

        for pt in scenario["points"]:
            pos = pt["projected_position"]
            if pos < 0:
                scen_overdraft_cost += abs(pos) * (self.overdraft_penalty_rate_annual / 365.0)
            elif pos > threshold * 1.20:
                deployable = pos - (threshold * 1.20)
                scen_surplus_yield += deployable * (self.short_term_investment_yield_annual / 365.0)

        # Deltas
        delta_min_gap = scen_min_gap - base_min_gap
        delta_end_gap = scen_end_gap - base_end_gap
        delta_overdraft = scen_overdraft_cost - base_overdraft_cost
        delta_surplus_yield = scen_surplus_yield - base_surplus_yield

        # Side-by-side points comparison for charts
        comparison_points = []
        for b_pt, s_pt in zip(baseline["points"], scenario["points"]):
            comparison_points.append({
                "day": b_pt["day"],
                "date": b_pt["date"],
                "baseline_position": b_pt["projected_position"],
                "scenario_position": s_pt["projected_position"],
                "baseline_gap": b_pt["liquidity_gap"],
                "scenario_gap": s_pt["liquidity_gap"],
                "threshold": threshold,
                "gap_delta": round(s_pt["liquidity_gap"] - b_pt["liquidity_gap"], 2)
            })

        # Scenario qualitative assessment
        assessment = []
        if delta_min_gap > 0:
            assessment.append(f"Improves minimum liquidity cushion by +{delta_min_gap:,.2f} {curr}.")
        elif delta_min_gap < 0:
            assessment.append(f"Deteriorates minimum liquidity cushion by -{abs(delta_min_gap):,.2f} {curr}.")

        if delta_overdraft > 0:
            assessment.append(f"Increases overdraft penalty expense by +{delta_overdraft:,.2f} {curr}.")
        elif delta_overdraft < 0:
            assessment.append(f"Saves {abs(delta_overdraft):,.2f} {curr} in avoided overdraft fees.")

        if delta_surplus_yield > 0:
            assessment.append(f"Unlocks +{delta_surplus_yield:,.2f} {curr} in potential idle cash investment yield.")

        return {
            "entity": entity,
            "currency": curr,
            "parameters": {
                "payment_delay_days": payment_delay_days,
                "capex_postpone_days": capex_postpone_days,
                "fx_shift_pct": fx_shift_pct,
                "rate_shift_bps": rate_shift_bps,
                "degrade_ratings": degrade_ratings
            },
            "comparison_points": comparison_points,
            "quantified_impact": {
                "baseline_min_gap": round(base_min_gap, 2),
                "scenario_min_gap": round(scen_min_gap, 2),
                "delta_min_gap": round(delta_min_gap, 2),
                "baseline_overdraft_cost": round(base_overdraft_cost, 2),
                "scenario_overdraft_cost": round(scen_overdraft_cost, 2),
                "delta_overdraft_cost": round(delta_overdraft, 2),
                "baseline_surplus_yield": round(base_surplus_yield, 2),
                "scenario_surplus_yield": round(scen_surplus_yield, 2),
                "delta_surplus_yield": round(delta_surplus_yield, 2),
                "net_financial_delta": round(delta_surplus_yield - delta_overdraft, 2)
            },
            "assessment": " ".join(assessment) if assessment else "Scenario tracks baseline trajectory with negligible variance."
        }
