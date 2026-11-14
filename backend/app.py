"""
PayFence Security Gateway & Guard API Server (Python / Flask)
=============================================================
Student Name:        Navdeep Kaur
University Roll No:  240280105
Degree & Semester:   B.Tech Computer Science & Engineering (3rd Year / 5th Semester)
Institution:         Giani Zail Singh Campus College of Engineering & Technology (GZSCET), MRSPTU, Bathinda
Training:            6-Weeks Summer Training in Cybersecurity (Internshala Trainings)
Port: 5000 | Framework: Flask + Flask-CORS

Implements the REST API endpoints consumed by the React 18 single-page dashboard:
  - Auth:     /api/auth/demo-login, /api/auth/login, /api/auth/me
  - Gateway:  /api/gateway/inspect, /api/gateway/pay, /api/gateway/balance
  - Audit:    /api/audit/run, /api/audit/logs, /api/audit/policy, /api/audit/policy/reset
"""

import os
import sys
import time
import uuid
import datetime

# Ensure current backend directory is on sys.path for direct execution or serverless imports
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from flask import Flask, request, jsonify
from flask_cors import CORS

from store import store
from security_guard import evaluate_transaction
from attack_cases import run_audit_suite

app = Flask(__name__)
# Enable CORS across all origins for local Vite development (port 5173 -> 5000)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Simple in-memory token session tracker
SESSION_TOKENS = {
    "usr_demo_01": "jwt_token_payfence_viva_demo_session_usr_01"
}


def get_authenticated_user():
    """
    Extracts user context from the Bearer token in the Authorization header.
    Defaults to the pre-seeded demo user for developer/examiner ease of testing.
    """
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    
    # In demo mode, provide usr_demo_01 context seamlessly
    user = store.get_user_by_id("usr_demo_01")
    if not user:
        user = {
            "id": "usr_demo_01",
            "email": "admin@college.edu",
            "name": "B.Tech Security Lead",
            "role": "admin",
            "balanceUSD": 500.00,
            "balanceUnits": 5000000
        }
    return user


# =============================================================================
# SYSTEM HEALTH
# =============================================================================

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "service": "PayFence Autonomous Payment Security Gateway (Python/Flask)",
        "version": "2.0.0",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }), 200


# =============================================================================
# AUTHENTICATION ENDPOINTS
# =============================================================================

@app.route('/api/auth/demo-login', methods=['POST'])
def demo_login():
    """
    Quick Demo Login button used during academic presentations.
    Immediately authenticates as Chief Security Officer / B.Tech Lead.
    """
    user = store.get_user_by_id("usr_demo_01")
    if not user:
        return jsonify({"success": False, "error": "User not initialized"}), 500

    token = f"jwt_payfence_{uuid.uuid4().hex}"
    SESSION_TOKENS[token] = user["id"]

    safe_user = {k: v for k, v in user.items() if k != "password"}
    safe_user["permissions"] = ["policy:read", "policy:write", "audit:run", "gateway:inspect"]

    return jsonify({
        "success": True,
        "message": "Demo login successful",
        "token": token,
        "user": safe_user
    }), 200


@app.route('/api/auth/login', methods=['POST'])
def login():
    """
    Standard login accepting email and password (admin@college.edu / admin123).
    """
    body = request.get_json(silent=True) or {}
    email = body.get("email", "").strip()
    password = body.get("password", "").strip()

    if not email or not password:
        return jsonify({
            "success": False,
            "error": "MISSING_CREDENTIALS",
            "message": "Email and password are required"
        }), 400

    user = store.get_user_by_email(email)
    if not user or user.get("password") != password:
        return jsonify({
            "success": False,
            "error": "INVALID_CREDENTIALS",
            "message": "Invalid email or password. Use admin@college.edu / admin123"
        }), 401

    token = f"jwt_payfence_{uuid.uuid4().hex}"
    SESSION_TOKENS[token] = user["id"]

    safe_user = {k: v for k, v in user.items() if k != "password"}
    safe_user["permissions"] = ["policy:read", "policy:write", "audit:run", "gateway:inspect"]

    return jsonify({
        "success": True,
        "message": "Login successful",
        "token": token,
        "user": safe_user
    }), 200


@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    user = get_authenticated_user()
    safe_user = {k: v for k, v in user.items() if k != "password"}
    return jsonify({
        "success": True,
        "user": safe_user
    }), 200


# =============================================================================
# GATEWAY INSPECTION & PAYMENT ENDPOINTS
# =============================================================================

@app.route('/api/gateway/inspect', methods=['POST'])
def inspect_payload():
    """
    Pre-flight security inspection.
    Evaluates incoming payload against all 6 Blue Team guard layers WITHOUT fund execution.
    """
    user = get_authenticated_user()
    policy = store.get_policy()
    daily_spent = store.get_daily_spending(user["id"])

    body = request.get_json(silent=True) or {}
    origin = body.get("origin") or request.headers.get("Origin") or request.headers.get("Referer") or ""

    payload = dict(body)
    if "origin" not in payload:
        payload["origin"] = origin

    context = {
        "user": user,
        "currentDailySpentUSD": daily_spent,
        "policy": policy,
        "origin": origin
    }

    verdict = evaluate_transaction(payload, context)

    # Return inspection verdict structured for the frontend playground
    return jsonify({
        "success": True,
        "inspection": verdict,
        "verdict": verdict["action"],
        "allowed": verdict["allowed"],
        "category": verdict["category"],
        "violationCode": verdict.get("violationCode"),
        "reason": verdict["reason"],
        "checks": verdict.get("checks", {}),
        "timestamp": verdict["timestamp"]
    }), 200


@app.route('/api/gateway/pay', methods=['POST'])
def execute_payment():
    """
    Evaluates the security guard. If allowed, deducts wallet balance and records transaction.
    If blocked, records 403 violation in audit logs and rejects immediately.
    """
    user = get_authenticated_user()
    policy = store.get_policy()
    daily_spent = store.get_daily_spending(user["id"])

    body = request.get_json(silent=True) or {}
    origin = body.get("origin") or request.headers.get("Origin") or request.headers.get("Referer") or ""

    payload = dict(body)
    if "origin" not in payload:
        payload["origin"] = origin

    context = {
        "user": user,
        "currentDailySpentUSD": daily_spent,
        "policy": policy,
        "origin": origin
    }

    verdict = evaluate_transaction(payload, context)

    # If blocked by the security guard -> log & return HTTP 403 Forbidden
    if not verdict["allowed"]:
        store.add_audit_log({
            "action": "BLOCK",
            "allowed": False,
            "category": verdict["category"],
            "scenarioName": "Direct Gateway Payment Attempt",
            "violationCode": verdict.get("violationCode"),
            "reason": verdict["reason"],
            "recipient": str(payload.get("recipient", "MALFORMED")),
            "amountUSD": float(payload.get("amount", 0.0)) if isinstance(payload.get("amount"), (int, float)) else None,
            "origin": str(origin),
            "userId": user["id"],
            "details": {
                "checks": verdict.get("checks"),
                "payloadSummary": {
                    "recipient": payload.get("recipient"),
                    "amount": payload.get("amount")
                }
            }
        })

        return jsonify({
            "success": False,
            "error": "SECURITY_GUARD_BLOCKED",
            "action": "BLOCK",
            "category": verdict["category"],
            "violationCode": verdict.get("violationCode"),
            "reason": verdict["reason"],
            "checks": verdict.get("checks"),
            "timestamp": verdict["timestamp"]
        }), 403

    # If allowed by guard -> execute payment & deduct balance
    amount_usd = float(verdict["normalizedAmount"]["usd"])
    tx_id = f"tx_{int(time.time())}_{uuid.uuid4().hex[:6]}"

    fresh_user = store.get_user_by_id(user["id"]) or user
    new_balance = round(float(fresh_user["balanceUSD"]) - amount_usd, 2)
    store.update_user_balance(user["id"], new_balance)
    updated_daily_spent = store.record_daily_spending(user["id"], amount_usd)

    audit_entry = store.add_audit_log({
        "id": tx_id,
        "action": "ALLOW",
        "allowed": True,
        "category": "Payment Execution",
        "scenarioName": "Autonomous x402 Micropayment",
        "violationCode": None,
        "reason": verdict["reason"],
        "recipient": str(payload.get("recipient")),
        "amountUSD": amount_usd,
        "origin": str(origin),
        "userId": user["id"],
        "details": {
            "txId": tx_id,
            "newBalanceUSD": new_balance,
            "updatedDailySpentUSD": updated_daily_spent
        }
    })

    return jsonify({
        "success": True,
        "action": "ALLOW",
        "txId": tx_id,
        "recipient": payload.get("recipient"),
        "amountUSD": amount_usd,
        "amountUnits": verdict["normalizedAmount"]["units"],
        "balanceRemainingUSD": new_balance,
        "dailySpentUSD": updated_daily_spent,
        "dailyBudgetUSD": policy.get("dailyBudgetUSD", 200.00),
        "timestamp": audit_entry["timestamp"],
        "verdict": verdict
    }), 200


@app.route('/api/gateway/balance', methods=['GET'])
def get_balance():
    """
    Returns current wallet balance ($500.00) and daily spending status.
    """
    user = get_authenticated_user()
    policy = store.get_policy()
    daily_spent = store.get_daily_spending(user["id"])
    daily_budget = float(policy.get("dailyBudgetUSD", 200.00))

    return jsonify({
        "success": True,
        "userId": user["id"],
        "balanceUSD": float(user.get("balanceUSD", 500.00)),
        "balanceUnits": int(user.get("balanceUnits", 5000000)),
        "dailySpentUSD": daily_spent,
        "dailyBudgetUSD": daily_budget,
        "dailyRemainingUSD": max(0.0, round(daily_budget - daily_spent, 2)),
        "perTxCapUSD": float(policy.get("perTxCapUSD", 50.00))
    }), 200


# =============================================================================
# RED TEAM AUDIT & POLICY ENDPOINTS
# =============================================================================

@app.route('/api/audit/run', methods=['POST'])
def run_security_audit():
    """
    Executes the standardized 16-case Red Team evaluation suite.
    Crucial Fix: Records each of the 15 blocked attacks and 1 allowed control
    into store auditLogs so that '403 Blocked' events appear in the Forensic Audit Logs.
    """
    active_policy = store.get_policy()
    audit_report = run_audit_suite(policy=active_policy)

    # 1. Record each individual test result in the forensic audit logs
    # Iterate in reverse order so the earliest test cases appear at the bottom
    # and the final control appears at the top
    for item in audit_report.get("results", []):
        is_attack = item.get("isAttack", True)
        actual_action = item.get("actualAction", "BLOCK")
        is_allowed = (actual_action == "ALLOW")

        payload = item.get("payload") or {}
        raw_amt = payload.get("amount", 0.0)
        amt_usd = float(raw_amt) if isinstance(raw_amt, (int, float)) else 0.0

        store.add_audit_log({
            "action": "ALLOW" if is_allowed else "BLOCK",
            "allowed": is_allowed,
            "category": item.get("category", "General"),
            "scenarioId": item.get("id"),
            "scenarioName": item.get("name"),
            "violationCode": item.get("actualViolationCode"),
            "reason": item.get("reason", "Automated Red Team security vector evaluation"),
            "recipient": str(payload.get("recipient", "N/A")),
            "amountUSD": amt_usd,
            "origin": str(payload.get("origin", "N/A")),
            "userId": "usr_demo_01"
        })

    # 2. Record overall benchmark summary event
    summary = audit_report["summary"]
    store.add_audit_log({
        "action": "AUDIT_RUN",
        "allowed": summary["allPassed"],
        "category": "System Audit",
        "scenarioName": "Full 16-Vector Red Team Suite",
        "violationCode": None,
        "reason": (
            f"Audit Suite Finished: {summary['attacksBlocked']}/{summary['attackCasesCount']} attacks blocked "
            f"({summary['detectionRate']}% detection rate), {summary['controlAllowed']}/{summary['controlCasesCount']} "
            f"control passed. Defense Score: {summary['securityScore']}%."
        ),
        "details": {
            "summary": summary,
            "categoryBreakdown": audit_report["categoryBreakdown"],
            "totalDurationMs": audit_report["totalDurationMs"]
        }
    })

    return jsonify({
        "success": True,
        "summary": audit_report["summary"],
        "categoryBreakdown": audit_report["categoryBreakdown"],
        "results": audit_report["results"],
        "executedAt": audit_report["executedAt"],
        "totalDurationMs": audit_report["totalDurationMs"]
    }), 200


@app.route('/api/audit/logs', methods=['GET'])
def get_audit_logs():
    """
    Returns forensic audit log records with optional filtering by category or status.
    """
    limit = min(int(request.args.get("limit", 50)), 200)
    offset = max(int(request.args.get("offset", 0)), 0)
    category = request.args.get("category")

    allowed_param = request.args.get("allowed")
    allowed = None
    if allowed_param == 'true':
        allowed = True
    elif allowed_param == 'false':
        allowed = False

    logs_data = store.get_audit_logs(limit=limit, offset=offset, category=category, allowed=allowed)
    return jsonify({
        "success": True,
        **logs_data
    }), 200


@app.route('/api/audit/logs', methods=['DELETE'])
def clear_audit_logs():
    """
    Clears forensic audit logs.
    """
    store.clear_audit_logs()
    return jsonify({
        "success": True,
        "message": "Audit logs cleared successfully"
    }), 200


@app.route('/api/audit/policy', methods=['GET'])
def get_policy():
    """
    Retrieves the currently active security guard policy.
    """
    policy = store.get_policy()
    return jsonify({
        "success": True,
        "policy": policy
    }), 200


@app.route('/api/audit/policy', methods=['PUT'])
def update_policy():
    """
    Updates security policy limits, whitelists, and boundaries.
    """
    updates = request.get_json(silent=True) or {}
    updated_policy = store.update_policy("default", updates)

    store.add_audit_log({
        "action": "POLICY_UPDATE",
        "allowed": True,
        "category": "Configuration",
        "scenarioName": "Policy Configuration Update",
        "reason": "Security policy parameters updated by administrator.",
        "details": {"updates": updates}
    })

    return jsonify({
        "success": True,
        "message": "Security policy updated successfully",
        "policy": updated_policy
    }), 200


@app.route('/api/audit/policy/reset', methods=['POST'])
def reset_policy():
    """
    Restores security policy to factory defaults.
    """
    reset = store.reset_policy("default")

    store.add_audit_log({
        "action": "POLICY_RESET",
        "allowed": True,
        "category": "Configuration",
        "scenarioName": "Policy Reset to Factory Defaults",
        "reason": "Security policy restored to standard defaults ($50 cap, $200 budget)."
    })

    return jsonify({
        "success": True,
        "message": "Security policy reset to default",
        "policy": reset
    }), 200


if __name__ == '__main__':
    print("=" * 60)
    print("PayFence Autonomous Payment Security Gateway (Python/Flask)")
    print("Listening on http://localhost:5000 ...")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=False)
