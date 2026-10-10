import os
import json
import io
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

SCHEDULER_CONFIG_FILE = os.path.join(os.path.dirname(__file__), "data", "report_schedules.json")
REPORT_OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "reports")

class ReportingEngine:
    def __init__(self, data_engine, forecasting_engine, alert_engine):
        self.data_engine = data_engine
        self.forecasting_engine = forecasting_engine
        self.alert_engine = alert_engine
        os.makedirs(REPORT_OUTPUT_DIR, exist_ok=True)
        self.schedule_config = self._load_schedule_config()

    def _load_schedule_config(self) -> Dict[str, Any]:
        if os.path.exists(SCHEDULER_CONFIG_FILE):
            try:
                with open(SCHEDULER_CONFIG_FILE, "r") as f:
                    return json.load(f)
            except Exception:
                pass
        
        default_config = {
            "sod_enabled": True,
            "sod_time": "08:00",
            "eod_enabled": True,
            "eod_time": "18:00",
            "recipients": [
                "treasury-ops@bnpparibas.com",
                "chief.treasurer@bnpparibas.com",
                "liquidity.analysts@bnpparibas.com"
            ],
            "last_sod_run": None,
            "last_eod_run": None
        }
        self._save_schedule_config(default_config)
        return default_config

    def _save_schedule_config(self, config: Dict[str, Any]):
        os.makedirs(os.path.dirname(SCHEDULER_CONFIG_FILE), exist_ok=True)
        with open(SCHEDULER_CONFIG_FILE, "w") as f:
            json.dump(config, f, indent=2)
        self.schedule_config = config

    def update_schedule_config(self, new_config: Dict[str, Any]) -> Dict[str, Any]:
        self.schedule_config.update(new_config)
        self._save_schedule_config(self.schedule_config)
        return self.schedule_config

    def generate_sod_briefing_data(self, entity: Optional[str] = None) -> Dict[str, Any]:
        """Start-of-Day (SOD) briefing: opening positions, upcoming payments 24-48h, forecast outlook, overnight alerts."""
        target_entity = entity or "BNPPARIBAS_PARIS"
        latest_date = self.data_engine.daily_positions["date"].max()
        snaps = self.data_engine.daily_positions[self.data_engine.daily_positions["date"] == latest_date]
        
        if entity:
            snaps = snaps[snaps["entity"] == entity]
            
        fc = self.forecasting_engine.generate_30day_forecast(entity=target_entity)
        alerts = self.alert_engine.get_active_alerts(entity=entity)

        # Upcoming payments next 24-48h
        next_date_1 = (datetime.strptime(latest_date, "%Y-%m-%d") + timedelta(days=1)).strftime("%Y-%m-%d")
        next_date_2 = (datetime.strptime(latest_date, "%Y-%m-%d") + timedelta(days=2)).strftime("%Y-%m-%d")
        
        upcoming_txns = self.data_engine.df[
            (self.data_engine.df["due_date"].isin([next_date_1, next_date_2])) &
            (self.data_engine.df["Direction"] == "Outflow")
        ]
        if entity:
            upcoming_txns = upcoming_txns[upcoming_txns["Entity"] == entity]

        upcoming_total = float(upcoming_txns["original_amount"].sum())
        upcoming_count = len(upcoming_txns)

        return {
            "report_type": "SOD_BRIEFING",
            "report_title": "Start-of-Day Liquidity Briefing",
            "entity": target_entity,
            "business_date": latest_date,
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "expected_opening_position": fc["current_balance"],
            "currency": fc["currency"],
            "upcoming_payments_24_48h": {
                "count": upcoming_count,
                "total_outflow": round(upcoming_total, 2)
            },
            "forecast_outlook": {
                "day_7_projected": fc["points"][6]["projected_position"],
                "day_30_projected": fc["points"][-1]["projected_position"],
                "min_liquidity_gap": min(p["liquidity_gap"] for p in fc["points"]),
                "breach_risk": fc["summary"]["breach_days_count"] > 0
            },
            "overnight_alerts": alerts[:5]
        }

    def generate_eod_report_data(self, entity: Optional[str] = None) -> Dict[str, Any]:
        """End-of-Day (EOD) report: position summary, daily inflows/outflows, alerts triggered, liquidity gap status."""
        target_entity = entity or "BNPPARIBAS_PARIS"
        latest_date = self.data_engine.daily_positions["date"].max()
        metrics = self.data_engine.get_summary_metrics(entity=entity)
        fc = self.forecasting_engine.generate_30day_forecast(entity=target_entity)
        active_alerts = self.alert_engine.get_active_alerts(entity=entity)
        threshold = self.alert_engine.get_threshold(entity=target_entity, currency=fc["currency"])
        gap = fc["current_balance"] - threshold

        return {
            "report_type": "EOD_REPORT",
            "report_title": "End-of-Day Treasury & Liquidity Report",
            "entity": target_entity,
            "business_date": latest_date,
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "closing_position": fc["current_balance"],
            "currency": fc["currency"],
            "threshold": threshold,
            "liquidity_gap": round(gap, 2),
            "gap_status": "Surplus" if gap >= 0 else "Shortfall",
            "daily_summary": {
                "total_cash_usd": metrics["total_cash_usd"],
                "daily_inflow_usd": metrics["daily_inflow_usd"],
                "daily_outflow_usd": metrics["daily_outflow_usd"],
                "net_change_usd": metrics["net_change_usd"]
            },
            "alerts_triggered_today": [a for a in active_alerts if a.get("date") == latest_date or True][:6],
            "forecast_summary": fc["summary"]
        }

    def export_csv(self, report_type: str = "EOD", entity: Optional[str] = None) -> str:
        """Exports report summary and 30-day projected positions as CSV string."""
        target_entity = entity or "BNPPARIBAS_PARIS"
        fc = self.forecasting_engine.generate_30day_forecast(entity=target_entity)
        
        df_export = pd.DataFrame(fc["points"])[[
            "day", "date", "projected_position", "lower_bound", "upper_bound", 
            "threshold", "liquidity_gap", "status", "severity"
        ]]
        return df_export.to_csv(index=False)

    def export_pdf(self, report_type: str = "SOD", entity: Optional[str] = None) -> bytes:
        """Generates institutional PDF report using ReportLab."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        elements = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#0f172a'),
            spaceAfter=6
        )
        subtitle_style = ParagraphStyle(
            'SubtitleStyle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#64748b'),
            spaceAfter=12
        )
        h2_style = ParagraphStyle(
            'H2Style',
            parent=styles['Heading2'],
            fontSize=13,
            leading=16,
            textColor=colors.HexColor('#1e293b'),
            spaceBefore=10,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#334155')
        )

        if report_type == "SOD":
            data = self.generate_sod_briefing_data(entity)
            doc_title = "BNP PARIBAS — Start-of-Day (SOD) Liquidity Briefing"
        else:
            data = self.generate_eod_report_data(entity)
            doc_title = "BNP PARIBAS — End-of-Day (EOD) Liquidity Report"

        # Header
        elements.append(Paragraph(doc_title, title_style))
        elements.append(Paragraph(f"Entity: <b>{data['entity']}</b> | Business Date: <b>{data['business_date']}</b> | Generated: {data['generated_at']}", subtitle_style))
        elements.append(Spacer(1, 10))

        # Core Metrics Table
        if report_type == "SOD":
            metrics_data = [
                ["Metric", "Value", "Notes"],
                ["Opening Balance", f"{data['expected_opening_position']:,.2f} {data['currency']}", "Previous business day closing balance"],
                ["Upcoming Payments (24-48h)", f"{data['upcoming_payments_24_48h']['total_outflow']:,.2f} {data['currency']}", f"{data['upcoming_payments_24_48h']['count']} scheduled vendor/tax items"],
                ["Day 7 Projected Cash", f"{data['forecast_outlook']['day_7_projected']:,.2f} {data['currency']}", "Based on seasonal time-series model"],
                ["Min Projected Gap", f"{data['forecast_outlook']['min_liquidity_gap']:,.2f} {data['currency']}", "Breach risk: " + ("ALERT" if data['forecast_outlook']['breach_risk'] else "Safe")]
            ]
        else:
            metrics_data = [
                ["Metric", "Value", "Notes"],
                ["Closing Position", f"{data['closing_position']:,.2f} {data['currency']}", "End-of-day reconciled cash balance"],
                ["Minimum Buffer (T)", f"{data['threshold']:,.2f} {data['currency']}", "Configured minimum safety reserve"],
                ["Liquidity Gap (G = P - T)", f"{data['liquidity_gap']:+,.2f} {data['currency']}", f"Status: {data['gap_status']}"],
                ["Consolidated Cash (USD)", f"${data['daily_summary']['total_cash_usd']:,.2f}", "Across all group subsidiaries"],
                ["24h Net Inflow / Outflow", f"${data['daily_summary']['net_change_usd']:+,.2f} USD", f"In: ${data['daily_summary']['daily_inflow_usd']:,.2f} | Out: ${data['daily_summary']['daily_outflow_usd']:,.2f}"]
            ]

        t = Table(metrics_data, colWidths=[160, 160, 200])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 14))

        # Alerts Section
        elements.append(Paragraph("Active Liquidity Alerts & Breach Status", h2_style))
        alerts = data.get("overnight_alerts", []) if report_type == "SOD" else data.get("alerts_triggered_today", [])
        if alerts:
            alert_rows = [["Timestamp", "Severity", "Entity", "Message"]]
            for a in alerts[:6]:
                alert_rows.append([
                    a.get("timestamp", data["business_date"])[:16],
                    a.get("status", "Warning"),
                    a.get("entity", data["entity"]),
                    Paragraph(a.get("message", "Threshold alert"), body_style)
                ])
            at = Table(alert_rows, colWidths=[90, 70, 110, 250])
            at.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#fee2e2')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#991b1b')),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#fca5a5')),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            elements.append(at)
        else:
            elements.append(Paragraph("No active threshold breaches or critical alerts recorded.", body_style))

        elements.append(Spacer(1, 14))
        elements.append(Paragraph("<b>Notice:</b> Generated by Treasury Pulse Automated Scheduler. Authorized Treasury personnel only.", subtitle_style))

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()
