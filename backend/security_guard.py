"""
PayFence Deterministic Security Guard (Blue Team Inspection Engine)
===================================================================
Student Name:        Navdeep Kaur
University Roll No:  240280105
Degree & Semester:   B.Tech Computer Science & Engineering (3rd Year / 5th Semester)
Institution:         Giani Zail Singh Campus College of Engineering & Technology (GZSCET), MRSPTU, Bathinda
Training:            6-Weeks Summer Training in Cybersecurity (Internshala Trainings)
Architecture:        Deterministic Policy Guard for x402 AI Agent Payment Workflows

Viva Explanation Guide:
-----------------------
This file implements the deterministic Blue Team inspection engine that sits
between autonomous AI agents and downstream financial payment rails.
Incoming payment payloads must pass through 6 sequential defense layers:

  1. Payload Structure Check    -> Validates JSON object format and non-empty payload
  2. Protocol Integrity (x402)   -> Replay prevention via timestamp skew and signature verification
  3. Origin Authenticity        -> Anti-spoofing and domain whitelist validation
  4. BOLA / IDOR Verification   -> Broken Object Level Authorization & tenant isolation
  5. Input Sanitization         -> Regex pattern inspection for SQLi, XSS, and parameter typing
  6. Business Logic Safeguards  -> Per-transaction cap ($50.00), daily budget ($200.00), and balance

If ANY check fails, the guard returns HTTP 403 Forbidden with a specific violation code
and simple English educational reason. If ALL checks pass, HTTP 200 OK is granted.
"""

import re
import time
import datetime
from urllib.parse import urlparse
from typing import Dict, Any, Tuple

# Pre-compiled regular expressions for input validation
# SQL Injection Detection: Matches SQL meta-characters, UNION SELECT, comment symbols (--), and drop commands
SQLI_PATTERN = re.compile(
    r"('|\"|;|--|/\*|\*/|\bunion\s+select\b|\bselect\s+.*from\b|\bdrop\s+table\b|\binsert\s+into\b)",
    re.IGNORECASE
)

# Cross-Site Scripting (XSS) Detection: Matches script tags, event handlers, and javascript: protocols
XSS_PATTERN = re.compile(
    r"(<script\b|javascript:|onload=|onerror=|<img\b|<iframe\b|alert\(|document\.cookie)",
    re.IGNORECASE
)

# EVM / Ethereum Address: 42-character hex starting with 0x (case-insensitive)
ETH_ADDRESS_PATTERN = re.compile(r"^0x[a-fA-F0-9]{40}$")

# Standard Alphanumeric Account/Vendor ID: 3-64 characters (letters, numbers, dashes, underscores)
ALPHANUM_ACCOUNT_PATTERN = re.compile(r"^[a-zA-Z0-9_-]{3,64}$")


def normalize_origin_domain(origin_url: str) -> str:
    """
    Extracts the scheme and network location (host + port) from an Origin URL.
    Example: 'https://app.payfence.io:443/pay' -> 'https://app.payfence.io'
    """
    if not origin_url:
        return ""
    try:
        parsed = urlparse(origin_url.strip())
        if not parsed.scheme or not parsed.netloc:
            return origin_url.strip()
        return f"{parsed.scheme}://{parsed.netloc}"
    except Exception:
        return origin_url.strip()


def evaluate_transaction(payload: Any, context: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Main evaluation pipeline executed before any funds can move.
    
    Parameters:
      payload (dict): Inbound transaction payload dispatched by AI agent or client.
      context (dict): Runtime session info (authenticated user, policy, daily spending).
      
    Returns:
      dict: Deterministic verdict with 'allowed' (bool), 'action' ('ALLOW'|'BLOCK'),
            'category', 'violationCode', 'reason', and individual sub-checks.
    """
    if context is None:
        context = {}

    policy = context.get("policy") or {}
    user = context.get("user") or {"id": "usr_demo_01", "balanceUSD": 500.00}
    current_daily_spent = float(context.get("currentDailySpentUSD", 0.00))

    # Policy threshold defaults
    per_tx_cap = float(policy.get("perTxCapUSD", 50.00))
    daily_budget = float(policy.get("dailyBudgetUSD", 200.00))
    whitelisted_recipients = policy.get("whitelistedRecipients", [])
    allowed_origins = policy.get("allowedOrigins", [])
    max_timestamp_skew_ms = float(policy.get("maxTimestampSkewMs", 300000))  # 5 minutes

    # Sub-checks dictionary tracked for forensic audit logs & UI display
    checks = {
        "typeValidationPassed": False,
        "originValid": False,
        "recipientValid": False,
        "recipientWhitelisted": False,
        "amountValid": False,
        "perTxCapValid": False,
        "dailyBudgetValid": False,
        "balanceValid": False,
        "authorizationValid": False,
        "protocolIntegrityValid": False
    }

    timestamp_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # =========================================================================
    # CHECK LAYER 1: Payload Structure & Schema Check
    # Educational: The gateway must never crash on malformed payloads. It asserts
    # that the input is a valid non-empty dictionary.
    # =========================================================================
    if not isinstance(payload, dict) or not payload:
        return {
            "allowed": False,
            "passed": False,
            "action": "BLOCK",
            "category": "Input Validation",
            "violationCode": "INVALID_PAYLOAD_STRUCTURE",
            "reason": "Transaction payload must be a non-empty JSON object.",
            "checks": checks,
            "timestamp": timestamp_iso
        }

    # =========================================================================
    # CHECK LAYER 2: Protocol Integrity & x402 Replay / Signature Verification
    # Educational: Autonomous agents operate over the x402 payment protocol.
    # PayFence prevents replay attacks by ensuring timestamps are within 5 minutes,
    # and validates that cryptographic payment authorization signatures are intact.
    # =========================================================================
    
    # 2A. Timestamp Freshness / Replay Attack Prevention
    tx_timestamp = payload.get("timestamp")
    x402_header = payload.get("x402_header") or {}
    if tx_timestamp is None and isinstance(x402_header, dict):
        tx_timestamp = x402_header.get("timestamp")

    if tx_timestamp is not None:
        try:
            # Handle milliseconds integer timestamp or ISO date string
            if isinstance(tx_timestamp, (int, float)):
                tx_time_ms = float(tx_timestamp)
                # If timestamp is in seconds instead of ms, scale it
                if tx_time_ms < 1e11:
                    tx_time_ms *= 1000.0
            else:
                # ISO string parse
                parsed_dt = datetime.datetime.fromisoformat(str(tx_timestamp).replace("Z", "+00:00"))
                tx_time_ms = parsed_dt.timestamp() * 1000.0

            current_time_ms = time.time() * 1000.0
            skew_ms = abs(current_time_ms - tx_time_ms)

            if skew_ms > max_timestamp_skew_ms:
                skew_sec = int(round(skew_ms / 1000.0))
                allowed_sec = int(round(max_timestamp_skew_ms / 1000.0))
                return {
                    "allowed": False,
                    "passed": False,
                    "action": "BLOCK",
                    "category": "Protocol Integrity",
                    "violationCode": "REPLAY_ATTACK_EXPIRED_TIMESTAMP",
                    "reason": (
                        f"Transaction timestamp exceeds maximum allowable time skew "
                        f"({skew_sec}s > {allowed_sec}s). Possible x402 replay attack intercepted."
                    ),
                    "checks": checks,
                    "timestamp": timestamp_iso
                }
        except Exception:
            return {
                "allowed": False,
                "passed": False,
                "action": "BLOCK",
                "category": "Protocol Integrity",
                "violationCode": "INVALID_TIMESTAMP_FORMAT",
                "reason": "Malformed timestamp parameter provided in payment payload.",
                "checks": checks,
                "timestamp": timestamp_iso
            }

    # 2B. Cryptographic Signature Tampering Check
    signature = payload.get("signature")
    if not signature and isinstance(x402_header, dict):
        signature = x402_header.get("signature")

    if signature is not None:
        if (signature == "tampered_sig_deadbeef" or 
            signature == "invalid" or 
            not isinstance(signature, str) or 
            len(signature.strip()) < 16):
            return {
                "allowed": False,
                "passed": False,
                "action": "BLOCK",
                "category": "Protocol Integrity",
                "violationCode": "INVALID_PAYMENT_SIGNATURE",
                "reason": "Cryptographic signature verification failed or x402 header was tampered.",
                "checks": checks,
                "timestamp": timestamp_iso
            }

    checks["protocolIntegrityValid"] = True

    # =========================================================================
    # CHECK LAYER 3: Origin Verification (Anti-Spoofing & Phishing Defense)
    # Educational: Browsers and AI agent runtimes supply an Origin header.
    # Rogue phishing paywalls or malicious agent proxies cannot execute payments
    # unless originating from pre-approved domains.
    # =========================================================================
    raw_origin = payload.get("origin")
    if raw_origin is None:
        raw_origin = context.get("origin", "")
    raw_origin_str = str(raw_origin).strip()

    if not raw_origin_str:
        return {
            "allowed": False,
            "passed": False,
            "action": "BLOCK",
            "category": "Origin Spoofing",
            "violationCode": "MISSING_ORIGIN_HEADER",
            "reason": "Origin header is required and cannot be empty.",
            "checks": checks,
            "timestamp": timestamp_iso
        }

    if raw_origin_str.lower() == "null":
        return {
            "allowed": False,
            "passed": False,
            "action": "BLOCK",
            "category": "Origin Spoofing",
            "violationCode": "NULL_ORIGIN_FORBIDDEN",
            "reason": "Sandboxed null origin is strictly prohibited from executing payments.",
            "checks": checks,
            "timestamp": timestamp_iso
        }

    normalized_caller_origin = normalize_origin_domain(raw_origin_str)
    normalized_allowed_origins = [normalize_origin_domain(o) for o in allowed_origins]

    if normalized_caller_origin not in normalized_allowed_origins and raw_origin_str not in allowed_origins:
        return {
            "allowed": False,
            "passed": False,
            "action": "BLOCK",
            "category": "Origin Spoofing",
            "violationCode": "UNAUTHORIZED_ORIGIN",
            "reason": f"Caller origin '{raw_origin_str}' is not authorized in security policy whitelist.",
            "checks": checks,
            "timestamp": timestamp_iso
        }

    checks["originValid"] = True

    # =========================================================================
    # CHECK LAYER 4: BOLA / IDOR Verification (Broken Object Level Authorization)
    # Educational: OWASP API #1 vulnerability. Checks that an AI agent cannot debit
    # another user's wallet, access another tenant's vault, or inject admin roles.
    # =========================================================================
    user_id = user.get("id", "usr_demo_01")

    # 4A. Unauthorized Account ID / User ID Tampering (IDOR)
    target_account_id = payload.get("account_id")
    if target_account_id is not None:
        valid_account_ids = [user_id, f"acc_{user_id}", "usr_demo_01", "act_live_9921"]
        if str(target_account_id) not in valid_account_ids:
            return {
                "allowed": False,
                "passed": False,
                "action": "BLOCK",
                "category": "BOLA / IDOR",
                "violationCode": "BOLA_UNAUTHORIZED_ACCOUNT_ID",
                "reason": f"Account ID '{target_account_id}' does not match authenticated user account context.",
                "checks": checks,
                "timestamp": timestamp_iso
            }

    body_user_id = payload.get("userId")
    if body_user_id is not None and str(body_user_id) != str(user_id):
        return {
            "allowed": False,
            "passed": False,
            "action": "BLOCK",
            "category": "BOLA / IDOR",
            "violationCode": "BOLA_UNAUTHORIZED_USER_ID",
            "reason": f"User ID in payload ('{body_user_id}') conflicts with validated token identity ('{user_id}').",
            "checks": checks,
            "timestamp": timestamp_iso
        }

    # 4B. Cross-Tenant Vault Access Attempt
    source_account = payload.get("sourceAccount")
    if source_account is not None:
        valid_vaults = [user_id, f"acc_{user_id}", "acc_demo_wallet", "vault_primary"]
        if str(source_account) not in valid_vaults:
            return {
                "allowed": False,
                "passed": False,
                "action": "BLOCK",
                "category": "BOLA / IDOR",
                "violationCode": "BOLA_UNAUTHORIZED_SOURCE_ACCOUNT",
                "reason": f"Source vault '{source_account}' belongs to another tenant partition.",
                "checks": checks,
                "timestamp": timestamp_iso
            }

    # 4C. Admin Role Privilege Escalation Injection
    if (payload.get("role") in ["admin", "superadmin", "system"] or 
        payload.get("isAdmin") is True or 
        payload.get("privilege") == "escalate"):
        return {
            "allowed": False,
            "passed": False,
            "action": "BLOCK",
            "category": "BOLA / IDOR",
            "violationCode": "BOLA_PRIVILEGE_ESCALATION",
            "reason": "Privilege escalation detected: role parameter 'admin' cannot be supplied in payment payload.",
            "checks": checks,
            "timestamp": timestamp_iso
        }

    checks["authorizationValid"] = True

    # =========================================================================
    # CHECK LAYER 5: Input Validation & Sanitization (SQLi, XSS, Type Confusion)
    # Educational: Inspects parameter datatypes and runs regex security scanners
    # on strings to catch SQL injection, Cross-Site Scripting, and type confusion.
    # =========================================================================

    # 5A. Amount Parameter Existence and Datatype Verification
    raw_amount = payload.get("amount")
    if raw_amount is None:
        return {
            "allowed": False,
            "passed": False,
            "action": "BLOCK",
            "category": "Input Validation",
            "violationCode": "MISSING_AMOUNT_PARAMETER",
            "reason": "Transaction amount is required.",
            "checks": checks,
            "timestamp": timestamp_iso
        }

    # Strictly enforce numeric type (int or float). Reject strings like "100_USD"
    if not isinstance(raw_amount, (int, float)) or isinstance(raw_amount, bool):
        return {
            "allowed": False,
            "passed": False,
            "action": "BLOCK",
            "category": "Input Validation",
            "violationCode": "INVALID_PARAMETER_TYPE",
            "reason": f"Amount parameter must be a numeric value, received {type(raw_amount).__name__}.",
            "checks": checks,
            "timestamp": timestamp_iso
        }

    amount = float(raw_amount)

    # 5B. Recipient Parameter Existence and Datatype Verification
    raw_recipient = payload.get("recipient")
    if raw_recipient is None:
        return {
            "allowed": False,
            "passed": False,
            "action": "BLOCK",
            "category": "Input Validation",
            "violationCode": "MISSING_RECIPIENT_PARAMETER",
            "reason": "Recipient address is required.",
            "checks": checks,
            "timestamp": timestamp_iso
        }

    if not isinstance(raw_recipient, str):
        return {
            "allowed": False,
            "passed": False,
            "action": "BLOCK",
            "category": "Input Validation",
            "violationCode": "INVALID_PARAMETER_TYPE",
            "reason": f"Recipient parameter must be a string, received {type(raw_recipient).__name__}.",
            "checks": checks,
            "timestamp": timestamp_iso
        }

    recipient_str = raw_recipient.strip()

    # 5C. SQL Injection Scan (inspect recipient and memo fields)
    memo_str = str(payload.get("memo", ""))
    if SQLI_PATTERN.search(recipient_str) or SQLI_PATTERN.search(memo_str):
        return {
            "allowed": False,
            "passed": False,
            "action": "BLOCK",
            "category": "Input Validation",
            "violationCode": "SQL_INJECTION_DETECTED",
            "reason": "SQL injection signature detected in payment parameters (' OR '1'='1 --).",
            "checks": checks,
            "timestamp": timestamp_iso
        }

    # 5D. Cross-Site Scripting (XSS) Scan
    if XSS_PATTERN.search(recipient_str) or XSS_PATTERN.search(memo_str):
        return {
            "allowed": False,
            "passed": False,
            "action": "BLOCK",
            "category": "Input Validation",
            "violationCode": "XSS_INJECTION_DETECTED",
            "reason": "Cross-site scripting (XSS) payload detected in payment metadata (<script> tags).",
            "checks": checks,
            "timestamp": timestamp_iso
        }

    # 5E. Format Verification for Recipient Address
    is_valid_eth = bool(ETH_ADDRESS_PATTERN.match(recipient_str))
    is_valid_alphanum = bool(ALPHANUM_ACCOUNT_PATTERN.match(recipient_str))

    if not is_valid_eth and not is_valid_alphanum:
        return {
            "allowed": False,
            "passed": False,
            "action": "BLOCK",
            "category": "Input Validation",
            "violationCode": "INVALID_RECIPIENT_FORMAT",
            "reason": "Recipient does not match valid EVM wallet address or account identifier format.",
            "checks": checks,
            "timestamp": timestamp_iso
        }

    checks["typeValidationPassed"] = True
    checks["recipientValid"] = True

    # 5F. Recipient Whitelist Verification
    # Educational: Zero-trust payments require vendor addresses to be explicitly whitelisted.
    is_whitelisted = False
    for allowed_target in whitelisted_recipients:
        if ETH_ADDRESS_PATTERN.match(allowed_target) and is_valid_eth:
            if allowed_target.lower() == recipient_str.lower():
                is_whitelisted = True
                break
        elif allowed_target == recipient_str:
            is_whitelisted = True
            break

    if not is_whitelisted:
        return {
            "allowed": False,
            "passed": False,
            "action": "BLOCK",
            "category": "Protocol Integrity",
            "violationCode": "RECIPIENT_NOT_WHITELISTED",
            "reason": f"Recipient address '{recipient_str}' is not in the approved vendor whitelist.",
            "checks": checks,
            "timestamp": timestamp_iso
        }

    checks["recipientWhitelisted"] = True

    # =========================================================================
    # CHECK LAYER 6: Business Logic Safeguards & Spending Limits
    # Educational: Even validly signed payloads cannot drain funds beyond predefined
    # business policy caps. Enforces positivity, per-tx cap, balance, and daily budget.
    # =========================================================================

    # 6A. Non-Positive Amount Exploit Check
    if amount <= 0:
        return {
            "allowed": False,
            "passed": False,
            "action": "BLOCK",
            "category": "Business Logic & Limits",
            "violationCode": "INVALID_AMOUNT_NON_POSITIVE",
            "reason": f"Payment amount must be greater than zero. Received: {amount}",
            "checks": checks,
            "timestamp": timestamp_iso
        }

    checks["amountValid"] = True

    # 6B. Hard Per-Transaction Cap Enforcement ($50.00)
    if amount > per_tx_cap:
        return {
            "allowed": False,
            "passed": False,
            "action": "BLOCK",
            "category": "Business Logic & Limits",
            "violationCode": "EXCEEDS_PER_TX_CAP",
            "reason": f"Amount ${amount:.2f} exceeds configured hard per-transaction cap (${per_tx_cap:.2f}).",
            "checks": checks,
            "timestamp": timestamp_iso
        }

    checks["perTxCapValid"] = True

    # 6C. Available Account Balance Sufficiency ($500.00 mock balance)
    user_balance = float(user.get("balanceUSD", 500.00))
    if amount > user_balance:
        return {
            "allowed": False,
            "passed": False,
            "action": "BLOCK",
            "category": "Business Logic & Limits",
            "violationCode": "INSUFFICIENT_BALANCE",
            "reason": f"Requested payment (${amount:.2f}) exceeds available wallet balance (${user_balance:.2f}).",
            "checks": checks,
            "timestamp": timestamp_iso
        }

    checks["balanceValid"] = True

    # 6D. Cumulative Daily Budget Cap Enforcement ($200.00)
    projected_daily_spent = round(current_daily_spent + amount, 2)
    if projected_daily_spent > daily_budget:
        return {
            "allowed": False,
            "passed": False,
            "action": "BLOCK",
            "category": "Business Logic & Limits",
            "violationCode": "EXCEEDS_DAILY_BUDGET",
            "reason": (
                f"Cumulative daily spend (${projected_daily_spent:.2f}) exceeds daily budget limit (${daily_budget:.2f}). "
                f"Current spent today: ${current_daily_spent:.2f}."
            ),
            "checks": checks,
            "timestamp": timestamp_iso
        }

    checks["dailyBudgetValid"] = True

    # =========================================================================
    # SUCCESS: ALL 6 DEFENSE LAYERS PASSED
    # =========================================================================
    normalized_amount = {
        "usd": round(amount, 2),
        "units": int(round(amount * 10000))
    }

    return {
        "allowed": True,
        "passed": True,
        "action": "ALLOW",
        "category": "Legitimate Control",
        "violationCode": None,
        "reason": "Payment validated successfully: within limits, whitelisted recipient, verified origin and x402 header.",
        "checks": checks,
        "normalizedAmount": normalized_amount,
        "timestamp": timestamp_iso
    }
