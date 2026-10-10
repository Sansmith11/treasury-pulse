import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "synthetic_transactions_50k.csv")

class DataEngine:
    def __init__(self, csv_path: str = DATA_PATH):
        self.csv_path = csv_path
        self.df: pd.DataFrame = pd.DataFrame()
        self.daily_positions: pd.DataFrame = pd.DataFrame()
        self.fx_rates = {
            "USD": 1.0,
            "EUR": 1.09,
            "GBP": 1.28,
            "JPY": 0.0067,
            "SGD": 0.75,
            "INR": 0.012,
            "HKD": 0.128,
            "CHF": 1.13,
            "CAD": 0.74,
            "AUD": 0.66
        }
        self.initial_balances = {
            "BNPPARIBAS_PARIS": 85000000.0,      # EUR
            "BNPPARIBAS_FRANKFURT": 60000000.0,  # EUR
            "BNPPARIBAS_LONDON": 55000000.0,     # GBP
            "BNPPARIBAS_NY": 110000000.0,        # USD
            "BNPPARIBAS_TOKYO": 12500000000.0,   # JPY
            "BNPPARIBAS_SINGAPORE": 45000000.0,  # SGD
            "BNPPARIBAS_MUMBAI": 3200000000.0,   # INR
            "BNPPARIBAS_HK": 380000000.0         # HKD
        }
        self.load_data()

    def load_data(self, file_path: Optional[str] = None):
        path = file_path or self.csv_path
        if not os.path.exists(path):
            raise FileNotFoundError(f"Transaction file not found at {path}")
        
        self.df = pd.read_csv(path)
        self.df["transaction_date"] = pd.to_datetime(self.df["transaction_date"])
        self.df["original_amount"] = pd.to_numeric(self.df["original_amount"], errors="coerce").fillna(0)
        self.df["Fx_rate"] = pd.to_numeric(self.df["Fx_rate"], errors="coerce").fillna(1.0)
        
        # Calculate amount in USD for unified reporting
        def to_usd(row):
            curr = row["Currency"]
            fx = self.fx_rates.get(curr, 1.0)
            return row["original_amount"] * fx

        self.df["amount_usd"] = self.df.apply(to_usd, axis=1)
        self._compute_daily_positions()

    def _compute_daily_positions(self):
        """Calculates daily opening, inflows, outflows, and closing balances per entity and currency."""
        # Group by Entity, Currency, transaction_date, Direction
        grouped = self.df.groupby(["Entity", "Currency", "Region", "transaction_date", "Direction"])["original_amount"].sum().unstack(fill_value=0).reset_index()
        
        if "Inflow" not in grouped.columns:
            grouped["Inflow"] = 0.0
        if "Outflow" not in grouped.columns:
            grouped["Outflow"] = 0.0

        # Sort chronologically
        grouped.sort_values(by=["Entity", "transaction_date"], inplace=True)

        daily_records = []
        for (entity, curr, region), group in grouped.groupby(["Entity", "Currency", "Region"]):
            group = group.copy().sort_values("transaction_date")
            initial_balance = self.initial_balances.get(entity, 50000000.0)
            
            # Running balance
            running_balance = initial_balance
            for _, row in group.iterrows():
                inflow = float(row["Inflow"])
                outflow = float(row["Outflow"])
                net = inflow - outflow
                prev_balance = running_balance
                running_balance = prev_balance + net
                
                fx_usd = self.fx_rates.get(curr, 1.0)

                daily_records.append({
                    "date": row["transaction_date"].strftime("%Y-%m-%d"),
                    "entity": entity,
                    "currency": curr,
                    "region": region,
                    "prev_balance": prev_balance,
                    "inflows": inflow,
                    "outflows": outflow,
                    "net_flow": net,
                    "closing_balance": running_balance,
                    "closing_balance_usd": running_balance * fx_usd
                })

        self.daily_positions = pd.DataFrame(daily_records)

    def get_summary_metrics(self, entity: Optional[str] = None, region: Optional[str] = None) -> Dict[str, Any]:
        """Calculates headline summary metrics for executive dashboard."""
        sub = self.daily_positions.copy()
        if entity:
            sub = sub[sub["entity"] == entity]
        elif region:
            sub = sub[sub["region"] == region]

        if sub.empty:
            return {
                "total_cash_usd": 0,
                "daily_inflow_usd": 0,
                "daily_outflow_usd": 0,
                "net_change_usd": 0,
                "latest_date": datetime.now().strftime("%Y-%m-%d"),
                "active_entities": 0,
                "total_transactions": len(self.df)
            }

        latest_date = sub["date"].max()
        latest_snapshot = sub[sub["date"] == latest_date]

        total_cash_usd = latest_snapshot["closing_balance_usd"].sum()
        latest_inflow_usd = (latest_snapshot["inflows"] * latest_snapshot["currency"].map(self.fx_rates)).sum()
        latest_outflow_usd = (latest_snapshot["outflows"] * latest_snapshot["currency"].map(self.fx_rates)).sum()

        return {
            "total_cash_usd": round(float(total_cash_usd), 2),
            "daily_inflow_usd": round(float(latest_inflow_usd), 2),
            "daily_outflow_usd": round(float(latest_outflow_usd), 2),
            "net_change_usd": round(float(latest_inflow_usd - latest_outflow_usd), 2),
            "latest_date": latest_date,
            "active_entities": int(latest_snapshot["entity"].nunique()),
            "total_transactions": len(self.df)
        }

    def get_currency_breakdown(self, region: Optional[str] = None) -> List[Dict[str, Any]]:
        """Donut chart data: distribution of cash across all currencies with USD equivalents and % share."""
        sub = self.daily_positions.copy()
        if region:
            sub = sub[sub["region"] == region]

        latest_date = sub["date"].max()
        latest = sub[sub["date"] == latest_date]

        by_curr = latest.groupby("currency")["closing_balance_usd"].sum().reset_index()
        total_usd = by_curr["closing_balance_usd"].sum()
        
        result = []
        for _, row in by_curr.iterrows():
            usd_val = float(row["closing_balance_usd"])
            pct = round((usd_val / total_usd * 100), 2) if total_usd > 0 else 0
            result.append({
                "currency": row["currency"],
                "balance_usd": round(usd_val, 2),
                "percentage": pct
            })

        result.sort(key=lambda x: x["balance_usd"], reverse=True)
        return result

    def get_recent_inflows_outflows(self, entity: Optional[str] = None, region: Optional[str] = None, days: int = 30) -> List[Dict[str, Any]]:
        """Stacked Area chart data: daily inflows vs outflows with entity/currency filter."""
        sub = self.daily_positions.copy()
        if entity:
            sub = sub[sub["entity"] == entity]
        elif region:
            sub = sub[sub["region"] == region]

        all_dates = sorted(sub["date"].unique())
        selected_dates = all_dates[-days:] if len(all_dates) >= days else all_dates

        sub = sub[sub["date"].isin(selected_dates)]

        # Aggregate daily across matching entities
        agg = sub.groupby("date").agg({
            "inflows": lambda s: (s * sub.loc[s.index, "currency"].map(self.fx_rates)).sum(),
            "outflows": lambda s: (s * sub.loc[s.index, "currency"].map(self.fx_rates)).sum(),
            "net_flow": lambda s: (s * sub.loc[s.index, "currency"].map(self.fx_rates)).sum()
        }).reset_index()

        result = []
        for _, row in agg.iterrows():
            result.append({
                "date": row["date"],
                "inflows": round(float(row["inflows"]), 2),
                "outflows": round(float(row["outflows"]), 2),
                "net_flow": round(float(row["net_flow"]), 2)
            })
        return result

    def get_position_trend_table(self, region: Optional[str] = None) -> List[Dict[str, Any]]:
        """Data for Position Trend Table with sparkline points."""
        sub = self.daily_positions.copy()
        if region:
            sub = sub[sub["region"] == region]

        all_dates = sorted(sub["date"].unique())
        last_7_dates = all_dates[-7:] if len(all_dates) >= 7 else all_dates
        latest_date = all_dates[-1]

        rows = []
        for (entity, curr), group in sub.groupby(["entity", "currency"]):
            grp_latest = group[group["date"] == latest_date]
            if grp_latest.empty:
                continue
            
            cur_bal = float(grp_latest["closing_balance"].values[0])
            cur_bal_usd = float(grp_latest["closing_balance_usd"].values[0])
            reg = grp_latest["region"].values[0]

            # Last 7 points for sparkline
            spark = group[group["date"].isin(last_7_dates)].sort_values("date")["closing_balance"].tolist()
            
            # Trend direction
            trend = "stable"
            if len(spark) >= 2:
                diff = spark[-1] - spark[0]
                if diff > 0.005 * spark[0]:
                    trend = "up"
                elif diff < -0.005 * spark[0]:
                    trend = "down"

            rows.append({
                "entity": entity,
                "currency": curr,
                "region": reg,
                "current_balance": round(cur_bal, 2),
                "current_balance_usd": round(cur_bal_usd, 2),
                "sparkline": [round(x, 2) for x in spark],
                "trend": trend
            })
        return rows

    def get_transactions_page(self, 
                              page: int = 1, 
                              page_size: int = 25, 
                              entity: Optional[str] = None,
                              region: Optional[str] = None,
                              currency: Optional[str] = None,
                              direction: Optional[str] = None,
                              product_type: Optional[str] = None,
                              search: Optional[str] = None) -> Dict[str, Any]:
        """Paginated & filterable transactions table for frontend."""
        sub = self.df.copy()
        if entity:
            sub = sub[sub["Entity"] == entity]
        if region:
            sub = sub[sub["Region"] == region]
        if currency:
            sub = sub[sub["Currency"] == currency]
        if direction:
            sub = sub[sub["Direction"] == direction]
        if product_type:
            sub = sub[sub["product_type"] == product_type]
        if search:
            s = search.lower()
            sub = sub[
                sub["Counterparty"].astype(str).str.lower().str.contains(s) |
                sub["transaction_id"].astype(str).str.lower().str.contains(s) |
                sub["account_number"].astype(str).str.lower().str.contains(s)
            ]

        total_records = len(sub)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size

        sub_page = sub.iloc[start_idx:end_idx].copy()
        sub_page["transaction_date"] = sub_page["transaction_date"].dt.strftime("%Y-%m-%d")

        records = sub_page.to_dict(orient="records")
        return {
            "total": total_records,
            "page": page,
            "page_size": page_size,
            "records": records
        }

    def get_entities_list(self) -> List[Dict[str, Any]]:
        """Returns entity hierarchy (Region -> Entities)."""
        entities = self.df[["Entity", "Region", "Country", "City", "Currency", "entity_code"]].drop_duplicates().to_dict(orient="records")
        return entities
