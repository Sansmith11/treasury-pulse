import io
import os
from fastapi import FastAPI, UploadFile, File, Query, HTTPException, Header, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from data_engine import DataEngine
from alert_engine import AlertEngine
from forecasting import ForecastingEngine
from whatif_simulator import WhatIfSimulator
from ai_copilot import AICopilot
from reporting_engine import ReportingEngine
from rbac import verify_session_role, ROLES, ACTIVE_SESSIONS
from benchmark import PerformanceBenchmark

app = FastAPI(
    title="Treasury Pulse : Short-term Liquidity Manager API",
    description="Enterprise Treasury Command Center for BNP Paribas Hackathon",
    version="1.0.0"
)

# Enable CORS for frontend Vite/React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate core engines
data_engine = DataEngine()
alert_engine = AlertEngine()
forecasting_engine = ForecastingEngine(data_engine, alert_engine)
whatif_simulator = WhatIfSimulator(forecasting_engine, data_engine)
ai_copilot = AICopilot(data_engine, forecasting_engine, alert_engine, whatif_simulator)
reporting_engine = ReportingEngine(data_engine, forecasting_engine, alert_engine)
benchmark_engine = PerformanceBenchmark(data_engine, forecasting_engine, ai_copilot)

# Pydantic Schemas
class ThresholdUpdateRequest(BaseModel):
    entity: Optional[str] = None
    currency: Optional[str] = None
    threshold: float

class AlertResolveRequest(BaseModel):
    alert_id: str
    resolution_status: str = "Resolved"

class WhatIfRequest(BaseModel):
    entity: str
    payment_delay_days: int = 0
    capex_postpone_days: int = 0
    fx_shift_pct: float = 0.0
    rate_shift_bps: float = 0.0
    degrade_ratings: bool = False

class ChatRequest(BaseModel):
    query: str
    entity: Optional[str] = "BNPPARIBAS_PARIS"
    region: Optional[str] = None

class ScheduleConfigRequest(BaseModel):
    sod_enabled: bool
    sod_time: str
    eod_enabled: bool
    eod_time: str
    recipients: List[str]

# ==================== ENDPOINTS ====================

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "Treasury Pulse API",
        "total_transactions": len(data_engine.df),
        "engine_ready": True
    }

@app.post("/api/upload")
async def upload_transactions(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
    
    contents = await file.read()
    temp_path = "data/uploaded_transactions.csv"
    with open(temp_path, "wb") as f:
        f.write(contents)
    
    data_engine.load_data(temp_path)
    return {
        "message": "File successfully uploaded and parsed.",
        "filename": file.filename,
        "records_ingested": len(data_engine.df)
    }

@app.get("/api/hierarchy")
def get_hierarchy():
    return {
        "regions": ["EMEA", "APAC", "NAMER"],
        "entities": data_engine.get_entities_list(),
        "currencies": list(data_engine.fx_rates.keys())
    }

@app.get("/api/metrics")
def get_metrics(
    entity: Optional[str] = None, 
    region: Optional[str] = None,
    x_session_token: Optional[str] = Header(None)
):
    session = verify_session_role(x_session_token)
    return data_engine.get_summary_metrics(entity=entity, region=region)

@app.get("/api/currency-breakdown")
def get_currency_breakdown(region: Optional[str] = None):
    return data_engine.get_currency_breakdown(region=region)

@app.get("/api/cashflows/recent")
def get_cashflows(entity: Optional[str] = None, region: Optional[str] = None, days: int = 30):
    return data_engine.get_recent_inflows_outflows(entity=entity, region=region, days=days)

@app.get("/api/trend-table")
def get_trend_table(region: Optional[str] = None):
    return data_engine.get_position_trend_table(region=region)

@app.get("/api/transactions")
def get_transactions(
    page: int = 1,
    page_size: int = 25,
    entity: Optional[str] = None,
    region: Optional[str] = None,
    currency: Optional[str] = None,
    direction: Optional[str] = None,
    product_type: Optional[str] = None,
    search: Optional[str] = None
):
    return data_engine.get_transactions_page(
        page=page,
        page_size=page_size,
        entity=entity,
        region=region,
        currency=currency,
        direction=direction,
        product_type=product_type,
        search=search
    )

@app.get("/api/forecast")
def get_forecast(
    entity: str = Query("BNPPARIBAS_PARIS"),
    currency: Optional[str] = None,
    payment_delay_days: int = 0,
    capex_postpone_days: int = 0,
    fx_shift_pct: float = 0.0,
    rate_shift_bps: float = 0.0,
    degrade_ratings: bool = False
):
    return forecasting_engine.generate_30day_forecast(
        entity=entity,
        currency=currency,
        payment_delay_days=payment_delay_days,
        capex_postpone_days=capex_postpone_days,
        fx_shift_pct=fx_shift_pct,
        rate_shift_bps=rate_shift_bps,
        degrade_ratings=degrade_ratings
    )

@app.post("/api/whatif")
def run_whatif(req: WhatIfRequest):
    return whatif_simulator.run_simulation(
        entity=req.entity,
        payment_delay_days=req.payment_delay_days,
        capex_postpone_days=req.capex_postpone_days,
        fx_shift_pct=req.fx_shift_pct,
        rate_shift_bps=req.rate_shift_bps,
        degrade_ratings=req.degrade_ratings
    )

@app.get("/api/alerts")
def get_alerts(entity: Optional[str] = None, limit: int = 50):
    return {
        "thresholds": alert_engine.thresholds,
        "active_alerts": alert_engine.get_active_alerts(entity=entity),
        "history": alert_engine.get_all_alerts(limit=limit)
    }

@app.post("/api/alerts/threshold")
def update_threshold(req: ThresholdUpdateRequest, x_session_token: Optional[str] = Header(None)):
    session = verify_session_role(x_session_token, required_permission="can_configure_thresholds")
    if req.entity:
        alert_engine.set_entity_threshold(req.entity, req.threshold)
    elif req.currency:
        alert_engine.set_currency_threshold(req.currency, req.threshold)
    return {"status": "success", "thresholds": alert_engine.thresholds}

@app.post("/api/alerts/resolve")
def resolve_alert(req: AlertResolveRequest):
    success = alert_engine.resolve_alert(req.alert_id, req.resolution_status)
    return {"status": "success" if success else "failed"}

@app.get("/api/surplus")
def get_surplus(region: Optional[str] = None):
    return ai_copilot.identify_surplus_positions(region=region)

@app.get("/api/recommendations")
def get_recommendations(entity: Optional[str] = None, region: Optional[str] = None):
    return ai_copilot.generate_recommendation_engine_action_plan(entity=entity, region=region)

@app.post("/api/chat")
def chat_copilot(req: ChatRequest):
    return ai_copilot.answer_query(
        query=req.query,
        active_entity=req.entity,
        active_region=req.region
    )

@app.get("/api/reports/sod")
def get_sod_report(entity: Optional[str] = None):
    return reporting_engine.generate_sod_briefing_data(entity=entity)

@app.get("/api/reports/eod")
def get_eod_report(entity: Optional[str] = None):
    return reporting_engine.generate_eod_report_data(entity=entity)

@app.get("/api/reports/export/pdf")
def export_pdf_report(report_type: str = "SOD", entity: Optional[str] = None):
    pdf_bytes = reporting_engine.export_pdf(report_type=report_type, entity=entity)
    filename = f"TreasuryPulse_{report_type}_{entity or 'Global'}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get("/api/reports/export/csv")
def export_csv_report(report_type: str = "EOD", entity: Optional[str] = None):
    csv_str = reporting_engine.export_csv(report_type=report_type, entity=entity)
    filename = f"TreasuryPulse_Forecast_{entity or 'Global'}.csv"
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get("/api/reports/scheduler")
def get_scheduler_config():
    return reporting_engine.schedule_config

@app.post("/api/reports/scheduler")
def update_scheduler_config(req: ScheduleConfigRequest, x_session_token: Optional[str] = Header(None)):
    session = verify_session_role(x_session_token, required_permission="can_configure_scheduler")
    return reporting_engine.update_schedule_config(req.dict())

@app.get("/api/benchmark")
def get_benchmark():
    return benchmark_engine.run_full_benchmark()

@app.get("/api/roles")
def get_available_roles():
    return {
        "roles": list(ROLES.keys()),
        "role_definitions": ROLES,
        "sessions": ACTIVE_SESSIONS
    }

# Mount built React frontend if available
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
