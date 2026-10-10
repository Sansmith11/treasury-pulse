#!/usr/bin/env python3
"""
Treasury Pulse : Short-term Liquidity Manager
BNP Paribas Hackathon 11 Submission Runner
"""
import os
import sys
import subprocess
import webbrowser

def main():
    print("=" * 70)
    print("  BNP PARIBAS — TREASURY PULSE : SHORT-TERM LIQUIDITY MANAGER")
    print("=" * 70)
    
    project_root = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(project_root, "backend")
    data_csv = os.path.join(backend_dir, "data", "synthetic_transactions_50k.csv")

    # 1. Check dataset
    if not os.path.exists(data_csv):
        print("\n[Phase 1] Generating 50,000 synthetic transaction records...")
        subprocess.run([sys.executable, "generator.py"], cwd=backend_dir, check=True)
    else:
        print("\n[Phase 1] Benchmark dataset verified: 50,000 transactions (12 months, 8 entities).")

    # 2. Launch FastAPI Backend serving React SPA
    print("[Phase 2] Initializing Treasury Pulse Analytical Core...")
    print("          - Time-series SARIMA forecasting & 95% Confidence Intervals")
    print("          - Configurable 3-tier Alert Matrix & Hourly Scanner")
    print("          - What-If Scenario Sandbox (FX, Rates, Delays, Capex)")
    print("          - AI Copilot with RAG, Surplus Scoring, and Chart Generation")
    print("          - Automated SOD Briefing & EOD Report Engine (PDF/CSV)")
    print("          - RBAC Data Isolation (Analyst, Treasury Manager, Admin)")
    print("=" * 70)
    print("\nStarting server on http://127.0.0.1:8000 ...")
    print("Press Ctrl+C to terminate.")
    
    try:
        import uvicorn
        # Try opening browser after a brief moment
        try:
            webbrowser.open("http://127.0.0.1:8000")
        except Exception:
            pass
        uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False, app_dir=backend_dir)
    except KeyboardInterrupt:
        print("\nTreasury Pulse shutdown cleanly.")

if __name__ == "__main__":
    main()
