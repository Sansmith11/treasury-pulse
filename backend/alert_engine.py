import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Any

THRESHOLDS_FILE = os.path.join(os.path.dirname(__file__), "data", "thresholds.json")

DEFAULT_CURRENCY_THRESHOLDS = {
    "EUR": 50000.0,
    "USD": 60000.0,
    "JPY": 5000000.0,
    "GBP": 40000.0,
    "SGD": 50000.0,
    "INR": 4000000.0,
    "HKD": 400000.0,
    "CHF": 55000.0,
    "CAD": 65000.0,
    "AUD": 75000.0
}

# Entity-specific minimum safety buffers (reflecting scale of subsidiaries)
DEFAULT_ENTITY_BUFFERS = {
    "BNPPARIBAS_PARIS": 5000000.0,      # EUR
    "BNPPARIBAS_FRANKFURT": 3000000.0,  # EUR
    "BNPPARIBAS_LONDON": 3500000.0,     # GBP
    "BNPPARIBAS_NY": 6000000.0,         # USD
    "BNPPARIBAS_TOKYO": 750000000.0,    # JPY
    "BNPPARIBAS_SINGAPORE": 2500000.0,  # SGD
    "BNPPARIBAS_MUMBAI": 200000000.0,   # INR
    "BNPPARIBAS_HK": 25000000.0         # HKD
}

class AlertEngine:
    def __init__(self, storage_file: str = THRESHOLDS_FILE):
        self.storage_file = storage_file
        self.thresholds: Dict[str, Any] = {}
        self.alert_history: List[Dict[str, Any]] = []
        self._load_config()

    def _load_config(self):
        if os.path.exists(self.storage_file):
            try:
                with open(self.storage_file, "r") as f:
                    data = json.load(f)
                    self.thresholds = data.get("thresholds", {})
                    self.alert_history = data.get("alert_history", [])
                    return
            except Exception:
                pass
        
        # Default initialization
        self.thresholds = {
            "currencies": DEFAULT_CURRENCY_THRESHOLDS,
            "entities": DEFAULT_ENTITY_BUFFERS,
            "custom": {}
        }
        self._save_config()

    def _save_config(self):
        os.makedirs(os.path.dirname(self.storage_file), exist_ok=True)
        with open(self.storage_file, "w") as f:
            json.dump({
                "thresholds": self.thresholds,
                "alert_history": self.alert_history
            }, f, indent=2)

    def get_threshold(self, entity: Optional[str] = None, currency: Optional[str] = None) -> float:
        """Returns the configured minimum buffer threshold T for an entity or currency."""
        if entity and entity in self.thresholds.get("entities", {}):
            return float(self.thresholds["entities"][entity])
        if currency and currency in self.thresholds.get("currencies", {}):
            return float(self.thresholds["currencies"][currency])
        return 50000.0

    def set_entity_threshold(self, entity: str, threshold: float):
        self.thresholds.setdefault("entities", {})[entity] = float(threshold)
        self._save_config()

    def set_currency_threshold(self, currency: str, threshold: float):
        self.thresholds.setdefault("currencies", {})[currency] = float(threshold)
        self._save_config()

    def evaluate_position(self, position: float, threshold: float, entity: str, currency: str, date: str) -> Dict[str, Any]:
        """
        Calculates:
        G = P - T
        Evaluates Severity:
        - Emergency: P < T (or P < 0)
        - Critical: T <= P < 1.05 * T (within 0-5% above threshold)
        - Warning: 1.05 * T <= P < 1.10 * T (within 5-10% above threshold)
        - Normal / Green: P >= 1.10 * T
        """
        gap = position - threshold
        status = "Normal"
        severity = "green"
        message = f"{entity} maintains healthy cash buffer ({gap:+,.2f} {currency})."

        if position < 0:
            status = "Emergency"
            severity = "red"
            message = f"OVERDRAFT BREACH: Negative balance {position:,.2f} {currency} on {date}. Immediate funding required."
        elif position < threshold:
            status = "Emergency"
            severity = "red"
            message = f"SAFETY THRESHOLD BREACH: Projected cash {position:,.2f} {currency} is below buffer {threshold:,.2f} (Gap: {gap:,.2f})."
        elif position < 1.05 * threshold:
            status = "Critical"
            severity = "orange"
            message = f"CRITICAL BUFFER WARNING: Position {position:,.2f} {currency} is within 0-5% of buffer {threshold:,.2f}."
        elif position < 1.10 * threshold:
            status = "Warning"
            severity = "amber"
            message = f"LIQUIDITY WARNING: Position {position:,.2f} {currency} is within 5-10% of buffer {threshold:,.2f}."

        is_breach = status in ["Warning", "Critical", "Emergency"]

        evaluation = {
            "entity": entity,
            "currency": currency,
            "date": date,
            "position": round(position, 2),
            "threshold": round(threshold, 2),
            "gap": round(gap, 2),
            "status": status,
            "severity": severity,
            "is_breach": is_breach,
            "message": message
        }

        if is_breach:
            self._log_alert(evaluation)

        return evaluation

    def _log_alert(self, eval_data: Dict[str, Any]):
        # Prevent exact duplicate logging for same entity, date, status
        for alert in self.alert_history:
            if alert["entity"] == eval_data["entity"] and alert["date"] == eval_data["date"] and alert["status"] == eval_data["status"]:
                return

        alert_entry = {
            "id": f"ALT-{int(datetime.now().timestamp() * 1000)}-{len(self.alert_history) + 1}",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "entity": eval_data["entity"],
            "currency": eval_data["currency"],
            "date": eval_data["date"],
            "severity": eval_data["severity"],
            "status": eval_data["status"],
            "gap": eval_data["gap"],
            "message": eval_data["message"],
            "resolution_status": "Active" # Active / Acknowledged / Resolved
        }
        self.alert_history.insert(0, alert_entry)
        # Keep last 200 alerts
        self.alert_history = self.alert_history[:200]
        self._save_config()

    def resolve_alert(self, alert_id: str, new_status: str = "Resolved") -> bool:
        for alert in self.alert_history:
            if alert["id"] == alert_id:
                alert["resolution_status"] = new_status
                self._save_config()
                return True
        return False

    def get_active_alerts(self, entity: Optional[str] = None) -> List[Dict[str, Any]]:
        alerts = [a for a in self.alert_history if a["resolution_status"] != "Resolved"]
        if entity:
            alerts = [a for a in alerts if a["entity"] == entity]
        return alerts

    def get_all_alerts(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self.alert_history[:limit]
