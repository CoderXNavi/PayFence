"""
PayFence Red Team Attack Suite (16 Cases: 15 Attacks + 1 Legitimate Control)
=============================================================================
Framed around the x402 AI Agent Payment Protocol for Autonomous Workflows.

Categories:
  1. BOLA / IDOR (3 Attacks)
  2. Business Logic & Limits (3 Attacks)
  3. Input Validation & Sanitization (3 Attacks)
  4. Origin Spoofing & Phishing Defense (3 Attacks)
  5. Protocol Integrity & x402 Verification (3 Attacks + 1 Control)
"""

import time
from typing import List, Dict, Any
from security_guard import evaluate_transaction
from store import store

WHITELISTED_VENDOR_1 = "0x71C8451C3343344Fc4534664634234567890abcd"
WHITELISTED_VENDOR_2 = "0x250e76987d838a75310c3ab5fae533eb1f842ca8"
TRUSTED_ORIGIN = "https://app.payfence.io"

def get_attack_cases() -> List[Dict[str, Any]]:
    """
    Returns the standardized 16 test cases (15 attacks + 1 legitimate control).
    """
    now_ms = int(time.time() * 1000)

    return [
        # =====================================================================
        # CATEGORY 1: BOLA / IDOR (3 Attacks)
        # =====================================================================
        {
            "id": "bola-01",
            "name": "Unauthorized Account ID Tampering (IDOR)",
            "category": "BOLA / IDOR",
            "categorySlug": "bola",
            "isAttack": True,
            "severity": "CRITICAL",
            "owaspCode": "API1:2023 - Broken Object Level Authorization",
            "description": "Autonomous agent attempts to debit funds from victim account ID 'victim_acc_9921'.",
            "payload": {
                "account_id": "victim_acc_9921",
                "recipient": WHITELISTED_VENDOR_1,
                "amount": 25.00,
                "currency": "USD",
                "origin": TRUSTED_ORIGIN,
                "x402_header": {
                    "protocol": "x402",
                    "version": "1.0",
                    "client": "ai-agent"
                }
            },
            "context": {
                "user": {"id": "usr_demo_01", "balanceUSD": 500.00},
                "currentDailySpentUSD": 0.00
            },
            "expectedAction": "BLOCK",
            "expectedStatus": 403,
            "expectedViolationCode": "BOLA_UNAUTHORIZED_ACCOUNT_ID"
        },
        {
            "id": "bola-02",
            "name": "Cross-Tenant Wallet Drain Attempt",
            "category": "BOLA / IDOR",
            "categorySlug": "bola",
            "isAttack": True,
            "severity": "CRITICAL",
            "owaspCode": "API1:2023 - Broken Object Level Authorization",
            "description": "Unauthorized sourceAccount vault parameter referencing another tenant partition.",
            "payload": {
                "sourceAccount": "vault_tenant_beta_009",
                "recipient": WHITELISTED_VENDOR_1,
                "amount": 35.00,
                "currency": "USD",
                "origin": TRUSTED_ORIGIN
            },
            "context": {
                "user": {"id": "usr_demo_01", "balanceUSD": 500.00},
                "currentDailySpentUSD": 0.00
            },
            "expectedAction": "BLOCK",
            "expectedStatus": 403,
            "expectedViolationCode": "BOLA_UNAUTHORIZED_SOURCE_ACCOUNT"
        },
        {
            "id": "bola-03",
            "name": "Admin Role Privilege Escalation",
            "category": "BOLA / IDOR",
            "categorySlug": "bola",
            "isAttack": True,
            "severity": "HIGH",
            "owaspCode": "API5:2023 - Broken Function Level Authorization",
            "description": "Payload body injects role: 'admin' and isAdmin: true to bypass policy limits.",
            "payload": {
                "role": "admin",
                "isAdmin": True,
                "recipient": WHITELISTED_VENDOR_1,
                "amount": 40.00,
                "currency": "USD",
                "origin": TRUSTED_ORIGIN
            },
            "context": {
                "user": {"id": "usr_demo_01", "balanceUSD": 500.00},
                "currentDailySpentUSD": 0.00
            },
            "expectedAction": "BLOCK",
            "expectedStatus": 403,
            "expectedViolationCode": "BOLA_PRIVILEGE_ESCALATION"
        },

        # =====================================================================
        # CATEGORY 2: Business Logic & Limits (3 Attacks)
        # =====================================================================
        {
            "id": "logic-01",
            "name": "x402 Overpayment Attack ($750 > $50 Cap)",
            "category": "Business Logic & Limits",
            "categorySlug": "business_logic",
            "isAttack": True,
            "severity": "CRITICAL",
            "owaspCode": "API4:2023 - Unrestricted Resource Consumption",
            "description": "Malicious upstream paywall demands $750.00, far exceeding the hard $50.00 per-transaction cap.",
            "payload": {
                "recipient": WHITELISTED_VENDOR_1,
                "amount": 750.00,
                "currency": "USD",
                "origin": TRUSTED_ORIGIN,
                "x402_header": {
                    "demand": 750.00
                }
            },
            "context": {
                "user": {"id": "usr_demo_01", "balanceUSD": 500.00},
                "currentDailySpentUSD": 0.00
            },
            "expectedAction": "BLOCK",
            "expectedStatus": 403,
            "expectedViolationCode": "EXCEEDS_PER_TX_CAP"
        },
        {
            "id": "logic-02",
            "name": "Daily Budget Exhaustion Attack (> $200 Limit)",
            "category": "Business Logic & Limits",
            "categorySlug": "business_logic",
            "isAttack": True,
            "severity": "HIGH",
            "owaspCode": "API4:2023 - Unrestricted Resource Consumption",
            "description": "Cumulative spend reaches $185.00; requesting $45.00 exceeds the $200.00 daily safety budget.",
            "payload": {
                "recipient": WHITELISTED_VENDOR_1,
                "amount": 45.00,
                "currency": "USD",
                "origin": TRUSTED_ORIGIN
            },
            "context": {
                "user": {"id": "usr_demo_01", "balanceUSD": 500.00},
                "currentDailySpentUSD": 185.00  # $185 + $45 = $230 > $200 budget
            },
            "expectedAction": "BLOCK",
            "expectedStatus": 403,
            "expectedViolationCode": "EXCEEDS_DAILY_BUDGET"
        },
        {
            "id": "logic-03",
            "name": "Negative or Zero Amount Exploit",
            "category": "Business Logic & Limits",
            "categorySlug": "business_logic",
            "isAttack": True,
            "severity": "HIGH",
            "owaspCode": "API4:2023 - Business Logic Flaw",
            "description": "Payload sends negative amount (-50.00) attempting balance inversion and ledger corruption.",
            "payload": {
                "recipient": WHITELISTED_VENDOR_1,
                "amount": -50.00,
                "currency": "USD",
                "origin": TRUSTED_ORIGIN
            },
            "context": {
                "user": {"id": "usr_demo_01", "balanceUSD": 500.00},
                "currentDailySpentUSD": 0.00
            },
            "expectedAction": "BLOCK",
            "expectedStatus": 403,
            "expectedViolationCode": "INVALID_AMOUNT_NON_POSITIVE"
        },

        # =====================================================================
        # CATEGORY 3: Input Validation (3 Attacks)
        # =====================================================================
        {
            "id": "input-01",
            "name": "SQL Injection in x402 Payment Memo/Recipient",
            "category": "Input Validation",
            "categorySlug": "input_validation",
            "isAttack": True,
            "severity": "CRITICAL",
            "owaspCode": "API8:2023 - Security Misconfiguration / Injection",
            "description": "Payload contains SQL meta-characters and injection clauses in payment parameters.",
            "payload": {
                "recipient": f"{WHITELISTED_VENDOR_1}' OR '1'='1 --",
                "amount": 10.00,
                "currency": "USD",
                "origin": TRUSTED_ORIGIN,
                "memo": "' OR '1'='1 --"
            },
            "context": {
                "user": {"id": "usr_demo_01", "balanceUSD": 500.00},
                "currentDailySpentUSD": 0.00
            },
            "expectedAction": "BLOCK",
            "expectedStatus": 403,
            "expectedViolationCode": "SQL_INJECTION_DETECTED"
        },
        {
            "id": "input-02",
            "name": "Cross-Site Scripting (XSS) in Payment Metadata",
            "category": "Input Validation",
            "categorySlug": "input_validation",
            "isAttack": True,
            "severity": "HIGH",
            "owaspCode": "API8:2023 - Input Sanitization",
            "description": "Malicious agent submits `<script>alert('hack')</script>` inside transaction memo.",
            "payload": {
                "recipient": WHITELISTED_VENDOR_1,
                "amount": 15.00,
                "currency": "USD",
                "origin": TRUSTED_ORIGIN,
                "memo": "<script>alert('hack')</script>"
            },
            "context": {
                "user": {"id": "usr_demo_01", "balanceUSD": 500.00},
                "currentDailySpentUSD": 0.00
            },
            "expectedAction": "BLOCK",
            "expectedStatus": 403,
            "expectedViolationCode": "XSS_INJECTION_DETECTED"
        },
        {
            "id": "input-03",
            "name": "Parameter Type Confusion (String as Amount)",
            "category": "Input Validation",
            "categorySlug": "input_validation",
            "isAttack": True,
            "severity": "MEDIUM",
            "owaspCode": "API8:2023 - Lack of Input Validation",
            "description": "Amount is provided as string '100_USD' instead of a numeric float to exploit weak type coercions.",
            "payload": {
                "recipient": WHITELISTED_VENDOR_1,
                "amount": "100_USD",
                "currency": "USD",
                "origin": TRUSTED_ORIGIN
            },
            "context": {
                "user": {"id": "usr_demo_01", "balanceUSD": 500.00},
                "currentDailySpentUSD": 0.00
            },
            "expectedAction": "BLOCK",
            "expectedStatus": 403,
            "expectedViolationCode": "INVALID_PARAMETER_TYPE"
        },

        # =====================================================================
        # CATEGORY 4: Origin Spoofing (3 Attacks)
        # =====================================================================
        {
            "id": "origin-01",
            "name": "Untrusted Phishing Paywall Origin",
            "category": "Origin Spoofing",
            "categorySlug": "origin_spoofing",
            "isAttack": True,
            "severity": "HIGH",
            "owaspCode": "API7:2023 - Server-Side Request Forgery / Origin Spoofing",
            "description": "Payment invocation comes from unauthorized external origin 'https://evil-paywall-bot.xyz'.",
            "payload": {
                "recipient": WHITELISTED_VENDOR_1,
                "amount": 20.00,
                "currency": "USD",
                "origin": "https://evil-paywall-bot.xyz"
            },
            "context": {
                "user": {"id": "usr_demo_01", "balanceUSD": 500.00},
                "currentDailySpentUSD": 0.00
            },
            "expectedAction": "BLOCK",
            "expectedStatus": 403,
            "expectedViolationCode": "UNAUTHORIZED_ORIGIN"
        },
        {
            "id": "origin-02",
            "name": "Subdomain Spoofing Attack",
            "category": "Origin Spoofing",
            "categorySlug": "origin_spoofing",
            "isAttack": True,
            "severity": "HIGH",
            "owaspCode": "API7:2023 - Server-Side Request Forgery / Origin Spoofing",
            "description": "Attacker creates 'https://app.payfence.io.attacker.com' attempting suffix origin confusion.",
            "payload": {
                "recipient": WHITELISTED_VENDOR_1,
                "amount": 25.00,
                "currency": "USD",
                "origin": "https://app.payfence.io.attacker.com"
            },
            "context": {
                "user": {"id": "usr_demo_01", "balanceUSD": 500.00},
                "currentDailySpentUSD": 0.00
            },
            "expectedAction": "BLOCK",
            "expectedStatus": 403,
            "expectedViolationCode": "UNAUTHORIZED_ORIGIN"
        },
        {
            "id": "origin-03",
            "name": "Missing or Null Origin Header",
            "category": "Origin Spoofing",
            "categorySlug": "origin_spoofing",
            "isAttack": True,
            "severity": "MEDIUM",
            "owaspCode": "API7:2023 - Missing Security Headers",
            "description": "Request originates from an unverified or sandboxed 'null' origin.",
            "payload": {
                "recipient": WHITELISTED_VENDOR_1,
                "amount": 10.00,
                "currency": "USD",
                "origin": "null"
            },
            "context": {
                "user": {"id": "usr_demo_01", "balanceUSD": 500.00},
                "currentDailySpentUSD": 0.00
            },
            "expectedAction": "BLOCK",
            "expectedStatus": 403,
            "expectedViolationCode": "NULL_ORIGIN_FORBIDDEN"
        },

        # =====================================================================
        # CATEGORY 5: Protocol Integrity (3 Attacks + 1 Control)
        # =====================================================================
        {
            "id": "proto-01",
            "name": "x402 Replay Attack (Expired Timestamp)",
            "category": "Protocol Integrity",
            "categorySlug": "protocol_integrity",
            "isAttack": True,
            "severity": "CRITICAL",
            "owaspCode": "API10:2023 - Unsafe Consumption of APIs",
            "description": "Replaying an expired x402 payment header with timestamp exceeding the 5-minute skew tolerance.",
            "payload": {
                "recipient": WHITELISTED_VENDOR_1,
                "amount": 15.00,
                "currency": "USD",
                "origin": TRUSTED_ORIGIN,
                "timestamp": now_ms - 600000,  # 10 minutes ago
                "x402_header": {
                    "nonce": "nonce_expired_8812",
                    "timestamp": now_ms - 600000
                }
            },
            "context": {
                "user": {"id": "usr_demo_01", "balanceUSD": 500.00},
                "currentDailySpentUSD": 0.00
            },
            "expectedAction": "BLOCK",
            "expectedStatus": 403,
            "expectedViolationCode": "REPLAY_ATTACK_EXPIRED_TIMESTAMP"
        },
        {
            "id": "proto-02",
            "name": "Tampered x402 Payment Signature",
            "category": "Protocol Integrity",
            "categorySlug": "protocol_integrity",
            "isAttack": True,
            "severity": "CRITICAL",
            "owaspCode": "API2:2023 - Broken Authentication",
            "description": "Attacker modifies in-flight payment amount but provides an invalid/tampered cryptographic signature.",
            "payload": {
                "recipient": WHITELISTED_VENDOR_1,
                "amount": 20.00,
                "currency": "USD",
                "origin": TRUSTED_ORIGIN,
                "signature": "tampered_sig_deadbeef",
                "x402_header": {
                    "signature": "tampered_sig_deadbeef"
                }
            },
            "context": {
                "user": {"id": "usr_demo_01", "balanceUSD": 500.00},
                "currentDailySpentUSD": 0.00
            },
            "expectedAction": "BLOCK",
            "expectedStatus": 403,
            "expectedViolationCode": "INVALID_PAYMENT_SIGNATURE"
        },
        {
            "id": "proto-03",
            "name": "Unwhitelisted Rogue Recipient Wallet",
            "category": "Protocol Integrity",
            "categorySlug": "protocol_integrity",
            "isAttack": True,
            "severity": "HIGH",
            "owaspCode": "API10:2023 - Unsafe Consumption of APIs",
            "description": "Attempting payment to an unknown non-whitelisted wallet address '0xDeadBeef0000000000000000000000000000dEaD'.",
            "payload": {
                "recipient": "0xDeadBeef0000000000000000000000000000dEaD",
                "amount": 30.00,
                "currency": "USD",
                "origin": TRUSTED_ORIGIN
            },
            "context": {
                "user": {"id": "usr_demo_01", "balanceUSD": 500.00},
                "currentDailySpentUSD": 0.00
            },
            "expectedAction": "BLOCK",
            "expectedStatus": 403,
            "expectedViolationCode": "RECIPIENT_NOT_WHITELISTED"
        },
        {
            "id": "ctrl-01",
            "aliasIds": ["control-01", "ctrl-01", "CTRL-01"],
            "name": "Legitimate x402 Agent Micropayment",
            "category": "Protocol Integrity",
            "categorySlug": "protocol_integrity",
            "isAttack": False,
            "severity": "LOW",
            "owaspCode": "API10:2023 - Control Benchmark",
            "description": "Standard legitimate autonomous payment under $50.00 to a whitelisted vendor with authentic origin.",
            "payload": {
                "account_id": "usr_demo_01",
                "recipient": WHITELISTED_VENDOR_1,
                "amount": 12.50,
                "currency": "USD",
                "origin": TRUSTED_ORIGIN,
                "userId": "usr_demo_01",
                "memo": "x402 AI Agent inference token subscription batch #41",
                "timestamp": now_ms,
                "x402_header": {
                    "protocol": "x402",
                    "version": "1.0",
                    "payment_scheme": "exact",
                    "client": "autonomous-agent-v1",
                    "signature": "sig_valid_x402_ed25519_verified_token_9942"
                }
            },
            "context": {
                "user": {"id": "usr_demo_01", "balanceUSD": 500.00},
                "currentDailySpentUSD": 0.00
            },
            "expectedAction": "ALLOW",
            "expectedStatus": 200,
            "expectedViolationCode": None
        }
    ]


def run_audit_suite(policy: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Executes all 16 test cases against the deterministic guard.
    Computes benchmark statistics and records the results for audit logs.
    """
    if policy is None:
        policy = store.get_policy()

    cases = get_attack_cases()
    results = []

    category_stats = {
        "BOLA / IDOR": {"total": 0, "blocked": 0, "bypassed": 0},
        "Business Logic & Limits": {"total": 0, "blocked": 0, "bypassed": 0},
        "Input Validation": {"total": 0, "blocked": 0, "bypassed": 0},
        "Origin Spoofing": {"total": 0, "blocked": 0, "bypassed": 0},
        "Protocol Integrity": {"total": 0, "blocked": 0, "bypassed": 0}
    }

    attacks_blocked = 0
    attacks_bypassed = 0
    control_allowed = 0
    false_positives = 0

    t0 = time.perf_counter()

    for tc in cases:
        case_t0 = time.perf_counter()

        ctx = dict(tc.get("context") or {})
        ctx["policy"] = policy

        verdict = evaluate_transaction(tc["payload"], ctx)
        case_ms = round((time.perf_counter() - case_t0) * 1000, 2)

        is_attack = tc["isAttack"]
        cat_name = tc["category"]
        passed = False

        if is_attack:
            if verdict["action"] == "BLOCK" and not verdict["allowed"]:
                passed = True
                attacks_blocked += 1
                if cat_name in category_stats:
                    category_stats[cat_name]["blocked"] += 1
            else:
                passed = False
                attacks_bypassed += 1
                if cat_name in category_stats:
                    category_stats[cat_name]["bypassed"] += 1

            if cat_name in category_stats:
                category_stats[cat_name]["total"] += 1
        else:
            # Control case
            if verdict["action"] == "ALLOW" and verdict["allowed"]:
                passed = True
                control_allowed += 1
            else:
                passed = False
                false_positives += 1

        results.append({
            "id": tc["id"],
            "name": tc["name"],
            "category": tc["category"],
            "categorySlug": tc.get("categorySlug", "protocol_integrity"),
            "isAttack": is_attack,
            "severity": tc.get("severity", "HIGH"),
            "owaspCode": tc.get("owaspCode", "OWASP API Security"),
            "description": tc.get("description", ""),
            "expectedAction": tc["expectedAction"],
            "actualAction": verdict["action"],
            "expectedViolationCode": tc.get("expectedViolationCode"),
            "actualViolationCode": verdict.get("violationCode"),
            "passed": passed,
            "reason": verdict["reason"],
            "checks": verdict.get("checks", {}),
            "payload": tc["payload"],
            "latencyMs": case_ms or 5
        })

    total_duration_ms = round((time.perf_counter() - t0) * 1000, 2)

    total_cases = len(cases)
    attack_count = sum(1 for c in cases if c["isAttack"])
    control_count = total_cases - attack_count

    detection_rate = round((attacks_blocked / attack_count * 100.0), 1) if attack_count > 0 else 100.0
    control_pass_rate = round((control_allowed / control_count * 100.0), 1) if control_count > 0 else 100.0
    defense_score = 100 if (attacks_bypassed == 0 and false_positives == 0) else 0

    category_breakdown = {}
    for cat_name, stats in category_stats.items():
        tot = stats["total"]
        blk = stats["blocked"]
        rate = round((blk / tot * 100.0), 1) if tot > 0 else 100.0
        category_breakdown[cat_name] = {
            "name": cat_name,
            "total": tot,
            "blocked": blk,
            "passed": blk,
            "bypassed": stats["bypassed"],
            "defenseRate": rate
        }

    summary = {
        "totalCases": total_cases,
        "attackCasesCount": attack_count,
        "controlCasesCount": control_count,
        "attacksBlocked": attacks_blocked,
        "attacksBypassed": attacks_bypassed,
        "controlAllowed": control_allowed,
        "falsePositives": false_positives,
        "detectionRate": detection_rate,
        "controlPassRate": control_pass_rate,
        "securityScore": defense_score,
        "defenseScore": defense_score,
        "allPassed": (attacks_bypassed == 0 and false_positives == 0),
        "verdict": "ALL_ATTACKS_MITIGATED" if (attacks_bypassed == 0 and false_positives == 0) else "VULNERABILITIES_DETECTED"
    }

    return {
        "summary": summary,
        "categoryBreakdown": category_breakdown,
        "results": results,
        "executedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "totalDurationMs": total_duration_ms
    }
