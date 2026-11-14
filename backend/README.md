# PayFence Backend

> Deterministic AI Payment Security Gateway & Zero-Trust Policy Guard.

## Overview
PayFence is a security gateway engineered to protect autonomous AI agents from adversarial exploits, prompt injections, and financial drain attacks during payment execution. It features a deterministic policy guard providing 100% mitigation across 28 OWASP API Security attack vectors while permitting verified legitimate agent operations.

## Architecture & Core Modules

- **Datastore (`src/config/database.js`, `src/models/store.js`)**:
  Zero-dependency persistent JSON / in-memory storage for users, security policies, daily spending tracking, and audit logs. Supports optional MongoDB Atlas connection when `MONGODB_URI` is configured.
- **Default Policy (`src/services/guard/defaultPolicy.js`)**:
  Enforces deterministic spending parameters:
  - Mock balance: **$500.00** (5,000,000 micro-units)
  - Single transaction cap: **$50.00** (500,000 micro-units)
  - Daily cumulative budget: **$200.00** (2,000,000 micro-units)
  - Whitelisted recipients: Verified EVM merchant addresses (`0x71C8451C3343344Fc4534664634234567890abcd`, etc.)
  - Authorized caller origins (`https://app.payfence.io`, `http://localhost:3000`, etc.)
- **Security Guard (`src/services/guard/securityGuard.js`)**:
  Deterministic multi-phase validation pipeline:
  1. Object structure & prototype pollution check
  2. Protocol integrity & replay/timestamp skew detection
  3. Strict origin validation (mitigates spoofing & subdomain confusion)
  4. BOLA / IDOR / session integrity enforcement
  5. Parameter type safety & injection sanitization (SQLi, NoSQL, XSS, null bytes)
  6. Recipient address format & whitelist membership
  7. Amount boundaries, positive value, single transaction cap, and daily budget exhaustion checks
- **Attack Benchmark (`src/services/guard/attackCases.js`)**:
  Comprehensive benchmark suite mapping 28 attacks + 1 legitimate control across 5 OWASP API Security categories:
  - **BOLA/IDOR** (6 cases)
  - **Business Logic & Limits** (6 cases)
  - **Input Validation** (6 cases)
  - **Origin Spoofing** (5 cases)
  - **Protocol Integrity** (5 cases)
  - **Legitimate Control** (1 case)
- **Audit Engine (`src/services/evaluator/auditEngine.js`)**:
  Executes automated security evaluations, producing real-time pass/fail metrics, category breakdowns, **100% detection rate**, and **100 security score**.

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/demo-login` - Instant JWT generation for the pre-seeded demo operator account.
- `POST /api/auth/login` - Standard email/password authentication.
- `GET  /api/auth/me` - Authenticated operator profile and balance.

### Gateway (`/api/gateway`)
- `POST /api/gateway/inspect` - Deterministic pre-flight security inspection without moving funds.
- `POST /api/gateway/pay` - Executes payment if guard passes; blocks attacks with `403 Forbidden` and records security event.
- `GET  /api/gateway/balance` - Current mock balance and daily budget utilization.

### Audit & Policy (`/api/audit`)
- `POST   /api/audit/run` - Runs the 29-case OWASP benchmark and returns score and detection metrics.
- `GET    /api/audit/logs` - Retrieves historical security events and payment audit records.
- `DELETE /api/audit/logs` - Clears audit logs.
- `GET    /api/audit/policy` - Retrieves active security guard policy limits.
- `PUT    /api/audit/policy` - Updates guard limits and whitelists.
- `POST   /api/audit/policy/reset` - Restores factory default policy rules.

## Quick Start

### Installation
```bash
npm install
```

### Running Tests
```bash
npm test
```
Runs 53 comprehensive unit and integration tests verifying all 28 attacks are blocked and legitimate transactions succeed.

### Starting the Server
```bash
npm start
```
Server listens on `http://localhost:5000`.
