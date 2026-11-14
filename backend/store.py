"""
PayFence In-Memory & File-Backed Storage (Python)
Persists users, security policies, audit logs, and daily spending.
Designed for B.Tech CSE Cybersecurity training: clean, readable, zero-dependency.
"""

import os
import json
import uuid
import datetime
from typing import Dict, Any, List, Optional

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
STORE_FILE = os.path.join(DATA_DIR, 'store.json')

# Serverless / Read-Only Fallback Path (e.g. Vercel / AWS Lambda / Docker)
TMP_STORE_FILE = os.path.join('/tmp', 'payfence_store.json') if os.name != 'nt' else os.path.join(os.environ.get('TEMP', os.environ.get('TMP', '.')), 'payfence_store.json')

UNITS_PER_USD = 10000

DEFAULT_POLICY = {
    "policyId": "default",
    "name": "Standard x402 AI Agent Guard Policy",
    "version": "2.0.0",
    "description": "Deterministic policy guard enforcing zero-trust x402 AI agent payment safety",
    "mockBalanceUSD": 500.00,
    "mockBalanceUnits": 5000000,
    "perTxCapUSD": 50.00,
    "perTxCapUnits": 500000,
    "dailyBudgetUSD": 200.00,
    "dailyBudgetUnits": 2000000,
    "minTxAmountUSD": 0.01,
    "minTxAmountUnits": 100,
    "whitelistedRecipients": [
        "0x71C8451C3343344Fc4534664634234567890abcd",
        "0x250e76987d838a75310c3ab5fae533eb1f842ca8",
        "rec_vendor_official"
    ],
    "allowedOrigins": [
        "https://app.payfence.io",
        "http://localhost:5173",
        "http://localhost:3000",
        "https://trusted-partner.com"
    ],
    "requireOriginHeader": True,
    "preventReplay": True,
    "maxTimestampSkewMs": 300000  # 5 minutes
}

def get_default_policy():
    return json.loads(json.dumps(DEFAULT_POLICY))

def _now_iso(offset_minutes=0):
    dt = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=offset_minutes)
    return dt.isoformat()

def get_initial_audit_logs():
    return [
        {
            "id": f"log_{uuid.uuid4().hex[:8]}",
            "timestamp": _now_iso(22),
            "action": "BLOCK",
            "allowed": False,
            "category": "BOLA / IDOR",
            "scenarioId": "bola-01",
            "scenarioName": "Unauthorized Account ID Tampering (IDOR)",
            "violationCode": "BOLA_UNAUTHORIZED_ACCOUNT_ID",
            "reason": "Account ID 'victim_acc_9921' does not match authenticated user account context.",
            "recipient": "0x71C8451C3343344Fc4534664634234567890abcd",
            "amountUSD": 25.00,
            "origin": "https://app.payfence.io",
            "userId": "usr_demo_01"
        },
        {
            "id": f"log_{uuid.uuid4().hex[:8]}",
            "timestamp": _now_iso(18),
            "action": "BLOCK",
            "allowed": False,
            "category": "Business Logic & Limits",
            "scenarioId": "logic-01",
            "scenarioName": "x402 Overpayment Attack ($750 > $50 Cap)",
            "violationCode": "EXCEEDS_PER_TX_CAP",
            "reason": "Amount $750.00 exceeds configured hard per-transaction cap ($50.00).",
            "recipient": "0x71C8451C3343344Fc4534664634234567890abcd",
            "amountUSD": 750.00,
            "origin": "https://app.payfence.io",
            "userId": "usr_demo_01"
        },
        {
            "id": f"log_{uuid.uuid4().hex[:8]}",
            "timestamp": _now_iso(14),
            "action": "BLOCK",
            "allowed": False,
            "category": "Input Validation",
            "scenarioId": "input-01",
            "scenarioName": "SQL Injection in x402 Payment Memo/Recipient",
            "violationCode": "SQL_INJECTION_DETECTED",
            "reason": "SQL injection signature detected in payment parameters.",
            "recipient": "0x71C8451C3343344Fc4534664634234567890abcd' OR '1'='1 --",
            "amountUSD": 10.00,
            "origin": "https://app.payfence.io",
            "userId": "usr_demo_01"
        },
        {
            "id": f"log_{uuid.uuid4().hex[:8]}",
            "timestamp": _now_iso(10),
            "action": "ALLOW",
            "allowed": True,
            "category": "Protocol Integrity",
            "scenarioId": "ctrl-01",
            "scenarioName": "Legitimate x402 Agent Micropayment",
            "violationCode": None,
            "reason": "Payment validated successfully: within limits, whitelisted recipient, verified origin and x402 header.",
            "recipient": "0x71C8451C3343344Fc4534664634234567890abcd",
            "amountUSD": 12.50,
            "origin": "https://app.payfence.io",
            "userId": "usr_demo_01"
        },
        {
            "id": f"log_{uuid.uuid4().hex[:8]}",
            "timestamp": _now_iso(6),
            "action": "BLOCK",
            "allowed": False,
            "category": "Origin Spoofing",
            "scenarioId": "origin-01",
            "scenarioName": "Untrusted Phishing Paywall Origin",
            "violationCode": "UNAUTHORIZED_ORIGIN",
            "reason": "Caller origin 'https://evil-paywall-bot.xyz' is not authorized in security policy.",
            "recipient": "0x71C8451C3343344Fc4534664634234567890abcd",
            "amountUSD": 20.00,
            "origin": "https://evil-paywall-bot.xyz",
            "userId": "usr_demo_01"
        },
        {
            "id": f"log_{uuid.uuid4().hex[:8]}",
            "timestamp": _now_iso(2),
            "action": "BLOCK",
            "allowed": False,
            "category": "Protocol Integrity",
            "scenarioId": "proto-01",
            "scenarioName": "x402 Replay Attack (Expired Timestamp)",
            "violationCode": "REPLAY_ATTACK_EXPIRED_TIMESTAMP",
            "reason": "Transaction timestamp exceeds maximum allowable time skew (>300s window). Possible replay attack.",
            "recipient": "0x71C8451C3343344Fc4534664634234567890abcd",
            "amountUSD": 15.00,
            "origin": "https://app.payfence.io",
            "userId": "usr_demo_01"
        }
    ]

def get_initial_state():
    return {
        "users": {
            "usr_demo_01": {
                "id": "usr_demo_01",
                "email": "admin@college.edu",
                "name": "B.Tech Security Lead",
                "role": "admin",
                "password": "admin123",
                "balanceUSD": 500.00,
                "balanceUnits": 5000000,
                "createdAt": "2026-01-01T00:00:00.000Z"
            }
        },
        "policies": {
            "default": get_default_policy()
        },
        "auditLogs": get_initial_audit_logs(),
        "dailySpending": {
            "usr_demo_01": {}
        }
    }

class Store:
    def __init__(self):
        self._data = get_initial_state()
        self.active_store_file = STORE_FILE
        # If running in Vercel or cloud container with read-only root, prefer /tmp
        if os.environ.get("VERCEL") or not self._is_writable(DATA_DIR):
            self.active_store_file = TMP_STORE_FILE
        self._load()

    def _is_writable(self, path: str) -> bool:
        try:
            os.makedirs(path, exist_ok=True)
            test_file = os.path.join(path, f".write_test_{uuid.uuid4().hex[:6]}")
            with open(test_file, 'w') as f:
                f.write('ok')
            os.remove(test_file)
            return True
        except Exception:
            return False

    def _load(self):
        # 1. Try loading from active store file
        load_candidates = [self.active_store_file, TMP_STORE_FILE, STORE_FILE]
        for candidate in load_candidates:
            if candidate and os.path.exists(candidate):
                try:
                    with open(candidate, 'r', encoding='utf-8') as f:
                        content = f.read().strip()
                        if content:
                            parsed = json.loads(content)
                            self._data["users"] = {**get_initial_state()["users"], **(parsed.get("users") or {})}
                            self._data["policies"] = {"default": get_default_policy(), **(parsed.get("policies") or {})}
                            logs = parsed.get("auditLogs")
                            if isinstance(logs, list) and len(logs) > 0:
                                self._data["auditLogs"] = logs
                            else:
                                self._data["auditLogs"] = get_initial_audit_logs()
                            self._data["dailySpending"] = parsed.get("dailySpending") or {"usr_demo_01": {}}
                            return
                except Exception as e:
                    print(f"[PayFence Store] Could not read from {candidate}: {e}")

        # Fallback to initial state and attempt to seed active file
        self._persist()

    def _persist(self):
        # Attempt persisting to active file; if read-only, fallback to /tmp
        targets = [self.active_store_file, TMP_STORE_FILE]
        for target in targets:
            try:
                target_dir = os.path.dirname(target)
                if target_dir:
                    os.makedirs(target_dir, exist_ok=True)
                temp_file = f"{target}.tmp.{uuid.uuid4().hex[:6]}"
                with open(temp_file, 'w', encoding='utf-8') as f:
                    json.dump(self._data, f, indent=2)
                os.replace(temp_file, target)
                self.active_store_file = target
                return
            except (OSError, PermissionError) as e:
                # Read-only filesystem encountered (e.g. Vercel serverless environment)
                print(f"[PayFence Store Notice] Filesystem read-only at {target}, switching to /tmp: {e}")
                continue
            except Exception as e:
                print(f"[PayFence Store Warning] Persist failed on {target}: {e}")
                continue
        # If all disk writes fail, in-memory store remains 100% functional without throwing

    # User operations
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        user = self._data["users"].get(user_id)
        return dict(user) if user else None

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        norm = email.strip().lower()
        for u in self._data["users"].values():
            if u.get("email", "").strip().lower() == norm:
                return dict(u)
        return None

    def update_user_balance(self, user_id: str, new_balance_usd: float) -> Optional[Dict[str, Any]]:
        if user_id not in self._data["users"]:
            return None
        self._data["users"][user_id]["balanceUSD"] = round(float(new_balance_usd), 2)
        self._data["users"][user_id]["balanceUnits"] = int(round(new_balance_usd * UNITS_PER_USD))
        self._persist()
        return dict(self._data["users"][user_id])

    # Policy operations
    def get_policy(self, policy_id: str = "default") -> Dict[str, Any]:
        p = self._data["policies"].get(policy_id)
        if not p:
            p = get_default_policy()
            self._data["policies"][policy_id] = p
        return json.loads(json.dumps(p))

    def update_policy(self, policy_id: str = "default", updates: Dict[str, Any] = None) -> Dict[str, Any]:
        if updates is None:
            updates = {}
        current = self.get_policy(policy_id)
        current.update(updates)
        current["policyId"] = policy_id
        current["updatedAt"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

        if "perTxCapUSD" in updates and isinstance(updates["perTxCapUSD"], (int, float)):
            current["perTxCapUnits"] = int(round(updates["perTxCapUSD"] * UNITS_PER_USD))
        if "dailyBudgetUSD" in updates and isinstance(updates["dailyBudgetUSD"], (int, float)):
            current["dailyBudgetUnits"] = int(round(updates["dailyBudgetUSD"] * UNITS_PER_USD))
        if "mockBalanceUSD" in updates and isinstance(updates["mockBalanceUSD"], (int, float)):
            current["mockBalanceUnits"] = int(round(updates["mockBalanceUSD"] * UNITS_PER_USD))

        self._data["policies"][policy_id] = current
        self._persist()
        return json.loads(json.dumps(current))

    def reset_policy(self, policy_id: str = "default") -> Dict[str, Any]:
        fresh = get_default_policy()
        fresh["policyId"] = policy_id
        self._data["policies"][policy_id] = fresh
        self._persist()
        return json.loads(json.dumps(fresh))

    # Audit logs
    def add_audit_log(self, entry: Dict[str, Any]) -> Dict[str, Any]:
        log_entry = {
            "id": entry.get("id") or f"log_{uuid.uuid4().hex[:8]}",
            "timestamp": entry.get("timestamp") or datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "action": entry.get("action") or ("ALLOW" if entry.get("allowed") else "BLOCK"),
            "allowed": bool(entry.get("allowed")),
            "category": entry.get("category", "General"),
            "scenarioId": entry.get("scenarioId"),
            "scenarioName": entry.get("scenarioName"),
            "violationCode": entry.get("violationCode"),
            "reason": entry.get("reason", ""),
            "recipient": entry.get("recipient"),
            "amountUSD": entry.get("amountUSD"),
            "origin": entry.get("origin"),
            "userId": entry.get("userId"),
            "details": entry.get("details")
        }
        self._data["auditLogs"].insert(0, log_entry)
        if len(self._data["auditLogs"]) > 1000:
            self._data["auditLogs"] = self._data["auditLogs"][:1000]
        self._persist()
        return log_entry

    def get_audit_logs(self, limit: int = 50, offset: int = 0, category: Optional[str] = None, allowed: Optional[bool] = None) -> Dict[str, Any]:
        logs = list(self._data["auditLogs"])
        if category:
            norm_cat = category.strip().lower()
            logs = [l for l in logs if l.get("category", "").strip().lower() == norm_cat]
        if allowed is not None:
            logs = [l for l in logs if l.get("allowed") == allowed]

        total = len(logs)
        paged = logs[offset: offset + limit]
        return {
            "total": total,
            "offset": offset,
            "limit": limit,
            "logs": paged
        }

    def clear_audit_logs(self) -> bool:
        self._data["auditLogs"] = []
        self._persist()
        return True

    # Daily spending
    def _today_key(self) -> str:
        return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")

    def get_daily_spending(self, user_id: str = "usr_demo_01", date_str: Optional[str] = None) -> float:
        d_key = date_str or self._today_key()
        spending_map = self._data["dailySpending"].setdefault(user_id, {})
        return float(spending_map.get(d_key, 0.00))

    def record_daily_spending(self, user_id: str = "usr_demo_01", amount_usd: float = 0.0, date_str: Optional[str] = None) -> float:
        d_key = date_str or self._today_key()
        spending_map = self._data["dailySpending"].setdefault(user_id, {})
        current = float(spending_map.get(d_key, 0.00))
        updated = round(current + amount_usd, 2)
        spending_map[d_key] = updated
        self._persist()
        return updated

    def reset_daily_spending(self, user_id: str = "usr_demo_01", date_str: Optional[str] = None) -> float:
        d_key = date_str or self._today_key()
        if user_id in self._data["dailySpending"]:
            self._data["dailySpending"][user_id][d_key] = 0.00
            self._persist()
        return 0.00

# Global store singleton
store = Store()
