# PayFence: Autonomous Payment Security Gateway & Guard
**B.Tech CSE 3rd-Year Cybersecurity Summer Training Project**

### Student Attribution & Details
- **Student Name:** Navdeep Kaur
- **University Roll No:** 240280105
- **Degree & Semester:** B.Tech Computer Science & Engineering (3rd Year / 5th Semester)
- **Institution:** Giani Zail Singh Campus College of Engineering & Technology (GZSCET), MRSPTU, Bathinda
- **Training:** 6-Weeks Summer Training in Cybersecurity (Internshala Trainings)

PayFence is an API security gateway and deterministic policy inspection engine for autonomous payment workflows and financial micro-transactions operating over the **x402 AI Agent Payment Protocol**. It inspects transaction payloads before they reach downstream ledger services, blocking malicious requests that attempt to exploit API vulnerabilities, manipulate business logic, or bypass authorization checks.

The system evaluates incoming payments against five OWASP API Security categories: Broken Object Level Authorization (BOLA/IDOR), Business Logic and Limit bypasses, Input Validation flaws, Origin Spoofing, and Protocol Integrity violations.

---

## Academic Context & Storyline
- **Frontend Starter Kit**: The React 18 single-page dashboard template (clean light theme with Vite & Tailwind CSS) was provided as an initial user-interface starter kit.
- **Student Engineering Contribution (Cybersecurity Backend)**: The student architected and built the entire zero-trust **Python (Flask)** cybersecurity backend, featuring:
  - `security_guard.py`: Blue Team deterministic policy guard with 6 layers of defence (schema check, x402 replay/signature verification, origin verification, BOLA/IDOR isolation, regex input sanitization, and spending caps).
  - `attack_cases.py`: Red Team evaluation harness executing 16 targeted test vectors (15 attacks + 1 control) framed around the x402 AI Agent payment protocol.
  - `store.py`: File-backed JSON datastore (`store.json`) tracking balances, policy caps, and real-time forensic audit logs.
  - `app.py`: Clean REST API on port 5000 with CORS enabling seamless connection to the React frontend.

---

## Architecture Overview

```
[ Autonomous AI Agent / Client Application ]
                      │
                      ▼  HTTP (JSON + x402 Header)
          ┌─────────────────────────────────────────┐
          │        PayFence Security Gateway        │
          │         (Python / Flask, Port 5000)     │
          └───────────────────┬─────────────────────┘
                              │
                              ▼
          ┌─────────────────────────────────────────┐
          │   Blue Team Deterministic Guard Engine  │
          │  - Schema & Parameter Type Check        │
          │  - x402 Nonce & Signature Validation    │
          │  - Replay Defense (< 300s Timestamp)   │
          │  - Domain Origin Whitelist Check        │
          │  - BOLA / IDOR Account Context Check    │
          │  - SQLi / XSS Regex Sanitization        │
          │  - Recipient Whitelist Verification     │
          │  - Per-Tx Cap ($50.00) & Daily ($200.00)│
          └───────────┬─────────────────┬───────────┘
                      │                 │
            Violations Blocked (403)    │ Valid Transactions Approved (200)
                      │                 ▼
                      │       ┌────────────────────────┐
                      │       │ Mock Ledger / Database │
                      │       └────────────────────────┘
                      ▼
          ┌─────────────────────────────────────────┐
          │     Forensic Audit & Telemetry Log      │
          │  - Timestamp, Origin, Recipient, Amount │
          │  - 403 Blocked / 200 Allowed Records    │
          │  - Rejection Code & Educational Reason  │
          └─────────────────────────────────────────┘
```

---

## Project Structure

```
PayFence/
├── run-demo.bat                 # Windows one-click launcher (Python + React)
├── README.md                    # Setup and project documentation
├── PROJECT_REPORT_SYNOPSIS.md   # Academic project report synopsis
├── VIVA_PREPARATION_GUIDE.md    # Viva questions, pitch, and demo script
├── backend/
│   ├── app.py                   # Main Flask REST API server (Port 5000)
│   ├── security_guard.py        # Blue Team deterministic inspection engine (educational comments)
│   ├── attack_cases.py          # Red Team 16-case test suite (15 attacks + 1 control)
│   ├── store.py                 # File-backed persistence layer (store.json)
│   ├── requirements.txt         # Python dependencies (flask, flask-cors)
│   ├── data/
│   │   └── store.json           # Active datastore with pre-seeded logs and policy
│   └── tests/
│       └── test_security_guard.py # Automated test runner (unittest)
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx              # Navigation and routing shell
        ├── context/             # SecurityContext state provider
        ├── data/
        │   └── attackScenarios.js # Standardized 16 x402 test scenarios
        ├── services/
        │   └── api.js           # API client communicating with Flask backend
        └── pages/
            ├── AuthPage.jsx     # Login with Quick Demo Login button
            ├── Dashboard.jsx    # Real-time overview & x402 security posture
            ├── Playground.jsx   # Interactive single-payload test runner
            ├── RedTeam.jsx      # Automated 16-test security audit runner
            ├── BlueTeam.jsx     # Active policy viewer and cap editor
            └── AuditLogs.jsx    # Forensic audit trail table (403 Blocked & 200 Allowed)
```

---

## Prerequisites

- **Python**: v3.9 or higher (with `pip`)
- **Node.js**: v18.0.0 or higher (with `npm`)
- Operating System: Windows, macOS, or Linux

Verify installation:
```bash
python --version
node -v
npm -v
```

---

## Local Setup

### Option A: Windows One-Click Launcher (Recommended)
Double-click `run-demo.bat` in the `PayFence` root directory, or execute it from terminal:
```cmd
cd PayFence
run-demo.bat
```
The script verifies Python and Node.js, installs dependencies if missing, starts the Python backend on port 5000 and the React frontend on port 5173, and opens your browser at `http://localhost:5173`.

### Option B: Manual Installation and Execution

#### 1. Start the Python Backend
Open a terminal in `PayFence/backend`:
```bash
cd PayFence/backend
pip install -r requirements.txt
python app.py
```
The backend starts on `http://localhost:5000`.

#### 2. Start the React Frontend
Open a second terminal in `PayFence/frontend`:
```bash
cd PayFence/frontend
npm install
npm run dev
```
The frontend starts on `http://localhost:5173`.

#### 3. Log In to the Application
Navigate to `http://localhost:5173` in your browser:
- Click the **Quick Demo Login** button, or enter:
  - **Email**: `admin@college.edu`
  - **Password**: `admin123`

---

## Running the Security Test Suite

The Python backend includes an automated test runner executing all 15 adversarial attack scenarios plus 1 legitimate control scenario:

```bash
python -m unittest backend/tests/test_security_guard.py -v
```

Expected output:
```
test_all_15_attacks_are_blocked ... ok
test_case_count ... ok
test_control_case_is_allowed ... ok
test_full_audit_suite_metrics ... ok

Ran 4 tests in 0.005s
OK
```
- Total test vectors: 16
- Attacks blocked: 15 / 15 (100% defense rate)
- Legitimate requests approved: 1 / 1 (200 OK)
- Defense score: 100%

---

## 16 Standardized x402 Security Test Cases

| ID | Category | Case Name | Expected Action | Reason / Policy Rule |
|----|----------|-----------|-----------------|----------------------|
| `bola-01` | BOLA / IDOR | Unauthorized Account ID Tampering | 403 BLOCKED | Target account ID does not match authenticated user |
| `bola-02` | BOLA / IDOR | Cross-Tenant Wallet Drain Attempt | 403 BLOCKED | Source vault belongs to another tenant partition |
| `bola-03` | BOLA / IDOR | Admin Role Privilege Escalation | 403 BLOCKED | Injected 'admin' role prohibited in body |
| `logic-01` | Business Logic | x402 Overpayment Attack ($750 > $50) | 403 BLOCKED | Amount exceeds $50.00 hard per-transaction cap |
| `logic-02` | Business Logic | Daily Budget Exhaustion (> $200) | 403 BLOCKED | Cumulative daily spend exceeds $200 daily cap |
| `logic-03` | Business Logic | Negative or Zero Amount Exploit | 403 BLOCKED | Payment amount must be strictly greater than zero |
| `input-01` | Input Validation | SQL Injection in Memo/Recipient | 403 BLOCKED | SQL injection syntax detected (' OR '1'='1 --) |
| `input-02` | Input Validation | Cross-Site Scripting (XSS) in Metadata | 403 BLOCKED | XSS `<script>` construct detected |
| `input-03` | Input Validation | Parameter Type Confusion (String Amount) | 403 BLOCKED | Amount must be numeric, received string |
| `origin-01` | Origin Spoofing | Untrusted Phishing Paywall Origin | 403 BLOCKED | Origin not in security policy whitelist |
| `origin-02` | Origin Spoofing | Subdomain Spoofing Attack | 403 BLOCKED | Suffix-spoofed origin rejected |
| `origin-03` | Origin Spoofing | Missing or Null Origin Header | 403 BLOCKED | Sandboxed null origin strictly prohibited |
| `proto-01` | Protocol Integrity | x402 Replay Attack (Expired Timestamp) | 403 BLOCKED | Skew exceeds maximum 300s window |
| `proto-02` | Protocol Integrity | Tampered x402 Payment Signature | 403 BLOCKED | Cryptographic signature verification failed |
| `proto-03` | Protocol Integrity | Unwhitelisted Rogue Recipient Wallet | 403 BLOCKED | Target wallet not in approved whitelist |
| `ctrl-01` | Protocol Integrity | Legitimate x402 Agent Micropayment | 200 ALLOWED | Within caps, whitelisted vendor, valid x402 header |

---

## API Reference

### Authentication
- `POST /api/auth/demo-login`: Instant demo login for academic examiners.
- `POST /api/auth/login`: Authenticates with email and password, returning JWT token.
- `GET /api/auth/me`: Retrieves current user profile.

### Security Gateway
- `POST /api/gateway/inspect`: Pre-flight payload inspection without fund movement.
- `POST /api/gateway/pay`: Executes payment after passing guard. Deducts balance and updates daily spending.
- `GET /api/gateway/balance`: Returns wallet balance ($500.00), daily spending, and caps.

### Audit & Policies
- `GET /api/audit/policy`: Returns current policy rules ($50 cap, $200 budget, whitelists).
- `PUT /api/audit/policy`: Updates policy rules and boundaries.
- `POST /api/audit/policy/reset`: Resets policy to factory defaults.
- `GET /api/audit/logs`: Returns historical audit records of inspected transactions.
- `DELETE /api/audit/logs`: Clears audit records.
- `POST /api/audit/run`: Triggers 16-test Red Team suite, records each test in audit logs, and returns metrics.
