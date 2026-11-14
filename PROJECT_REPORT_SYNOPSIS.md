# PayFence: Autonomous Payment Security Gateway and Deterministic Policy Guard

**Project Synopsis submitted for Bachelor of Technology (B.Tech) in Computer Science and Engineering**  
**Academic Year:** 2025–2026  
**Candidate Name:** [Student Name]  
**Roll Number:** [Roll Number / University ID]  
**Supervisor / Guide:** [Project Guide / Faculty Advisor]  
**Department:** Computer Science and Engineering  

---

## 1. Abstract

Autonomous software agents and automated client applications increasingly execute financial micro-transactions without direct human intervention. Standard payment APIs typically rely on backend database constraints or traditional Web Application Firewalls (WAFs) for protection. However, generic WAFs primarily inspect syntactic patterns such as SQL injection or cross-site scripting; they do not validate business-level payment logic, transaction frequency, or account authorization boundaries. Consequently, automated payment APIs remain vulnerable to Broken Object Level Authorization (BOLA), parameter tampering, origin spoofing, and balance exhaustion attacks.

This project presents PayFence, an API security gateway and deterministic policy inspection engine designed for autonomous payment workflows. PayFence sits in front of payment endpoints and intercepts transaction requests prior to ledger execution. The policy engine converts monetary amounts into integer micro-units (1 USD = 10,000 units) to prevent floating-point rounding errors. It validates each payload against strict parameter bounds, cumulative daily budgets, recipient account whitelists, request origin headers, and cryptographic nonces. 

To evaluate the system, an automated Red Team test harness containing 28 adversarial attack vectors across five OWASP API Security categories was developed alongside a legitimate control transaction. The gateway blocked 28 out of 28 malicious requests (100.0% defense rate) while approving the legitimate transaction, demonstrating reliable enforcement without false positives.

---

## 2. Problem Statement

Automated payment pipelines face distinct security risks when software agents make API requests without interactive multi-factor authentication:

1. **Broken Object Level Authorization (BOLA / IDOR):** Attackers alter account identifiers or recipient fields in payload bodies, attempting to debit unassociated accounts or divert credits to unauthorized targets.
2. **Business Logic and Limit Violations:** Automated workflows may trigger high-frequency micro-payments that exceed intended limits, accumulate unapproved daily totals, or attempt negative transfers to artificially inflate sender balances.
3. **Floating-Point Arithmetic Vulnerabilities:** Standard IEEE 754 floating-point operations in JavaScript can cause precision anomalies (e.g., `0.1 + 0.2 = 0.30000000000000004`). In financial software, rounding errors can be exploited to bypass exact boundary checks.
4. **Origin Spoofing and Cross-Site Tampering:** Attackers can invoke payment endpoints from untrusted web domains using forged headers or embedded iframes if CORS policies and origin headers are not strictly validated before request parsing.
5. **Replay and Signature Manipulation:** Intercepted payment payloads can be re-transmitted to duplicate debits if nonces and timestamp skews are unverified.

Generic web application firewalls do not inspect payment-specific domain constraints, such as account whitelists or cumulative daily velocity. A dedicated, deterministic policy guard is therefore required at the application gateway level.

---

## 3. System Architecture

The PayFence architecture follows a modular, multi-tier layout separating presentation, gateway inspection, deterministic policy validation, and audit telemetry.

```
+-------------------------------------------------------------------------+
|                              Client Tier                                |
|  - React 18 SPA (Vite + Tailwind CSS)                                   |
|  - Overview Dashboard, Attack Playground, Red Team Runner, Audit Table  |
+-------------------------------------------------------------------------+
                                    |
                                    | HTTP / JSON (Bearer JWT)
                                    v
+-------------------------------------------------------------------------+
|                           Gateway Middleware                            |
|  - Express 5 API Server (Port 5000)                                     |
|  - Helmet HTTP Security Headers                                         |
|  - Strict CORS Origin Validation                                        |
|  - JWT Authentication Middleware                                        |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                       Deterministic Policy Guard                        |
|  1. Schema & Type Validation (Amount must be finite number, etc.)       |
|  2. Integer Normalization (USD converted to 10,000 micro-units)         |
|  3. Boundary Verification ($0.01 min, $50.00 max per transaction)       |
|  4. Velocity & Daily Cap Verification ($200.00 daily spend limit)       |
|  5. Recipient Whitelist Verification (Must match registered addresses)  |
|  6. Origin Verification (Must match allowed domain list)                |
|  7. Protocol Integrity Check (Nonce tracking, timestamp skew < 5 min)   |
+-------------------------------------------------------------------------+
               |                                           |
               | [Violation Detected]                      | [Rule Passed]
               v                                           v
+-------------------------------+         +-------------------------------+
|       Audit Logging Store     |         |     Mock Ledger Execution     |
| - Timestamp, Client IP        |         | - Deduct balance ($500.00)    |
| - Violation Code & Reason     |         | - Increment daily spent       |
| - Returns HTTP 403 Forbidden  |         | - Returns HTTP 200 Approved   |
+-------------------------------+         +-------------------------------+
```

### Module Descriptions
- **Gateway Middleware (`src/routes/gatewayRoutes.js`):** Exposes two primary endpoints: `/api/gateway/inspect` for dry-run pre-flight validation, and `/api/gateway/pay` for authorized transaction execution.
- **Deterministic Policy Guard (`src/services/guard/securityGuard.js`):** Executes pure functional checks against the transaction payload. If any policy rule is violated, the inspection stops immediately and returns a specific rejection code.
- **Audit Engine & Red Team Evaluator (`src/services/evaluator/auditEngine.js`):** Houses the 29 test vectors and calculates security metrics including detection rate and category breakdown.
- **Datastore (`src/models/store.js`):** Implements a zero-dependency local JSON file store with an in-memory fallback. It includes an optional MongoDB driver connection when `MONGODB_URI` is supplied.

---

## 4. OWASP API Security Threat Mapping

PayFence addresses key vulnerability categories identified in the OWASP API Security Top 10 (2023 edition):

| OWASP Category | Vulnerability Description | PayFence Gateway Defense |
| :--- | :--- | :--- |
| **API1:2023 Broken Object Level Authorization (BOLA)** | Manipulating account or user identifiers to debit unauthorized accounts. | Enforces strict sender authentication binding. The authenticated user ID extracted from the verified JWT must match the transaction sender account. |
| **API2:2023 Broken Authentication** | Unauthenticated callers invoking sensitive financial endpoints. | JWT verification on all gateway routes. Token expiration and signature checks reject forged or expired credentials. |
| **API3:2023 Broken Object Property Level Authorization** | Injecting unauthorized internal parameters (e.g., `role: "admin"`, `approved: true`). | Payload schema validation strips unexpected parameters and strictly whitelists accepted fields (`sender`, `recipient`, `amount`, `nonce`, `timestamp`). |
| **API4:2023 Unrestricted Resource Consumption** | Rapid transaction bursts or high cumulative payment totals draining available funds. | Enforces a dual-limit policy: a strict per-transaction cap ($50.00) and an automated cumulative daily budget ceiling ($200.00). |
| **API5:2023 Broken Function Level Authorization** | Regular users invoking administrative policy update routes. | Role-based route guards restrict policy modifications to verified administrator accounts. |
| **API6:2023 Unrestricted Access to Sensitive Business Flows** | Submitting negative amounts to invert transfer logic or zero-value spam requests. | Requires all amounts to be strictly positive numbers greater than or equal to $0.01 (100 micro-units). |
| **API7:2023 Server-Side Request Forgery & Origin Spoofing** | Cross-origin requests initiated from unauthorized attacker web domains. | Verifies the `Origin` and `Referer` headers against an explicit domain whitelist before processing. |
| **API8:2023 Security Misconfiguration & Input Validation** | Submitting non-numeric types (`NaN`, strings, SQL fragments, integer overflows). | Strict type validation using `typeof amount === 'number'`, `Number.isFinite()`, and scaling to 64-bit integer units. |

---

## 5. Implementation Details

### 5.1 Technology Stack
- **Backend Runtime:** Node.js 18+ (ES Modules format)
- **Web Framework:** Express 5.0.1
- **Security Middlewares:** Helmet 8.0.0, CORS 2.8.5, JSON Web Token 9.0.2, bcryptjs 2.4.3
- **Frontend Stack:** React 18, Vite 5.4, Tailwind CSS 3.4, React Router DOM 6.26, Lucide React icons
- **Automated Test Runner:** Node.js native test runner (`node --test`)

### 5.2 Micro-Unit Integer Representation
To prevent floating-point inaccuracies common in IEEE 754 representations, PayFence defines a fixed conversion ratio:

$$\text{Units} = \text{round}(\text{Amount}_{\text{USD}} \times 10{,}000)$$

For example:
- Minimum transfer: $\$0.01 = 100\text{ units}$
- Transaction limit: $\$50.00 = 500{,}000\text{ units}$
- Daily budget: $\$200.00 = 2{,}000{,}000\text{ units}$
- Mock wallet balance: $\$500.00 = 5{,}000{,}000\text{ units}$

All limit comparisons, balances, and additions are performed using pure integer operations. Conversion back to USD display strings occurs only at the serialization layer.

### 5.3 Deterministic Rule Execution Sequence
Each request submitted to `/api/gateway/inspect` or `/api/gateway/pay` passes through seven sequential verification steps:
1. **Schema Check:** Verifies that required fields (`sender`, `recipient`, `amount`) are present and conform to expected primitive types.
2. **Numeric Boundary Check:** Confirms that `amount > 0`, `isFinite(amount)`, and amount is within $[\$0.01, \$50.00]$.
3. **Sufficient Balance Check:** Confirms that the requested amount does not exceed the user's available wallet balance.
4. **Cumulative Budget Check:** Calculates $(\text{Daily Spent} + \text{Requested Amount})$. Rejects the request if the sum exceeds the $\$200.00$ limit.
5. **Recipient Whitelist Check:** Validates that the recipient address or identifier is registered in the trusted recipient table.
6. **Origin Verification Check:** Ensures the incoming `Origin` header matches an entry in `allowedOrigins`.
7. **Replay & Timestamp Check:** Verifies that `nonce` has not been observed within the active session window and that the client timestamp skew is under 300,000 milliseconds (5 minutes).

If any step fails, the gateway immediately returns HTTP 403 with a structured JSON error detailing the rule name, rejection reason, and policy limit.

---

## 6. Test & Evaluation Results

The evaluation test suite consists of 28 adversarial attack scenarios and 1 legitimate control scenario. The suite tests boundary edge cases, malformed data, authentication bypasses, and header spoofing.

### 6.1 Attack Vector Categorization

```
+------------------------------------+------------+------------------------------------+
| Test Category                      | Test Count | Example Test Case                  |
+------------------------------------+------------+------------------------------------+
| 1. BOLA / IDOR                     |     6      | Direct user ID tampering, tenant hop|
| 2. Business Logic & Limits         |     6      | Exceeding $50 per-tx cap, $200 day |
| 3. Input Validation & Boundaries   |     6      | Negative amount, NaN, SQL string   |
| 4. Origin Spoofing                 |     5      | Untrusted origin, null origin      |
| 5. Protocol Integrity & Nonce      |     5      | Replay nonce, expired timestamp    |
| Control: Legitimate Transaction    |     1      | Valid $25.00 transfer to vendor    |
+------------------------------------+------------+------------------------------------+
| Total Evaluated Cases              |    29      |                                    |
+------------------------------------+------------+------------------------------------+
```

### 6.2 Test Results Summary

| Metric | Measured Value | Target Standard | Status |
| :--- | :--- | :--- | :--- |
| **Total Test Scenarios** | 29 | 29 | Complete |
| **Adversarial Attacks Blocked** | 28 / 28 | 28 / 28 | 100.0% Pass |
| **Legitimate Transactions Allowed** | 1 / 1 | 1 / 1 | 100.0% Pass |
| **False Positive Rate** | 0.0% | 0.0% | Compliant |
| **Average Policy Inspection Latency** | < 1.2 ms | < 10.0 ms | Exceeded |
| **Overall Security Defense Score** | 100 / 100 | 100 / 100 | Optimal |

Every attack scenario triggered an HTTP 403 Forbidden status accompanied by an immutable audit log entry. The legitimate control transaction executed with an HTTP 200 status, successfully debiting the mock balance.

---

## 7. Project Scope Breakdown & Attribution

To maintain academic integrity, the project components are categorized by origin:

### Provided Starter Kit (Internshala Training Course)
- Initial HTML/CSS UI layout ideas for a generic wallet interface.
- Basic mock data schema concepts for user account balances.

### Student Original Contributions
- **Cybersecurity Gateway Architecture:** Designed and implemented the complete Express 5 payment gateway and inspection middleware.
- **Deterministic Policy Engine:** Implemented the rule-based verification pipeline with micro-unit integer arithmetic to prevent floating-point rounding errors.
- **OWASP Threat Defense Mapping:** Designed the defensive controls covering BOLA, origin spoofing, replay attacks, and business logic limits.
- **Red Team Attack Harness:** Developed the 28 adversarial attack scenarios and evaluation runner.
- **Frontend Security Interface:** Built the React single-page application containing the Interactive Attack Playground, Red Team Test Console, Blue Team Policy Visualizer, and Real-Time Forensic Audit Logs.
- **Deployment & Automation:** Authored the zero-dependency Windows one-click execution script (`run-demo.bat`) and cloud deployment configurations for Vercel and Render.

---

## 8. Conclusion

PayFence provides a deterministic, lightweight security layer that inspects and filters payment API payloads before execution. By validating transactions against business-specific constraints, integer limits, and origin policies, the gateway mitigates common API vulnerabilities that traditional network firewalls miss. The 100% detection rate across 28 adversarial tests confirms the viability of deterministic guardrails for autonomous payment environments.
