# PayFence: Autonomous Payment Security Gateway & Guard

PayFence is an API security gateway and deterministic policy inspection engine for autonomous payment workflows and financial micro-transactions. It inspects transaction payloads before they reach downstream ledger services, blocking malicious requests that attempt to exploit API vulnerabilities, manipulate business logic, or bypass authorization checks.

The system evaluates incoming payments against five OWASP API Security categories: Broken Object Level Authorization (BOLA/IDOR), Business Logic and Limit bypasses, Input Validation flaws, Origin Spoofing, and Protocol Integrity violations.

---

## Architecture Overview

```
[ Client Application / AI Agent ]
               │
               ▼  HTTP (JSON Payload)
   ┌─────────────────────────────────────────┐
   │        PayFence Security Gateway        │
   │  (Express 5, Port 5000, Helmet, CORS)   │
   └───────────────────┬─────────────────────┘
                       │
                       ▼
   ┌─────────────────────────────────────────┐
   │       Deterministic Policy Guard        │
   │  - Schema & Type Validation             │
   │  - Amount Boundaries ($0.01 - $50.00)   │
   │  - Daily Cumulative Budget ($200.00)    │
   │  - Recipient Whitelist Verification     │
   │  - Trusted Origin Check                 │
   │  - Nonce & Signature Validation         │
   └───────────┬─────────────────┬───────────┘
               │                 │
     Violations Blocked (403)    │ Valid Transactions Approved (200)
               │                 ▼
               │       ┌────────────────────────┐
               │       │ Mock Ledger / Database │
               │       └────────────────────────┘
               ▼
   ┌─────────────────────────────────────────┐
   │           Audit & Telemetry Log         │
   │  - Timestamp, Origin, Payload Hash      │
   │  - Rejection Code, Violation Details    │
   └─────────────────────────────────────────┘
```

### Components
1. **Frontend Dashboard (`/frontend`)**: React 18 single-page application built with Vite and Tailwind CSS. Provides an Interactive Attack Playground, Red Team Automated Test Console, Blue Team Policy Viewer, and real-time Audit Logs.
2. **Backend Gateway (`/backend`)**: Express 5 REST API handling authentication, deterministic request inspection, payment simulation, and security auditing.
3. **Deterministic Guard Engine (`/backend/src/services/guard`)**: Rule-based evaluation engine enforcing numerical boundaries, cumulative daily caps, whitelists, and header integrity.
4. **Red Team Evaluation Harness (`/backend/src/services/evaluator`)**: Test runner with 28 attack vectors and 1 legitimate control transaction.
5. **Datastore (`/backend/src/models/store.js`)**: In-memory and JSON file persistence layer by default, with optional MongoDB Atlas connection.

---

## Project Structure

```
PayFence/
├── run-demo.bat                 # Windows one-click launcher
├── README.md                    # Setup and deployment documentation
├── PROJECT_REPORT_SYNOPSIS.md   # Academic project report synopsis
├── VIVA_PREPARATION_GUIDE.md    # Viva questions, pitch, and demo script
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── server.js            # Express application entry point
│   │   ├── config/              # Database and environment configuration
│   │   ├── middleware/          # JWT auth, CORS, error handling
│   │   ├── models/              # Store and data models
│   │   ├── routes/              # Auth, gateway, and audit routes
│   │   └── services/
│   │       ├── guard/           # Policy definitions and security guard
│   │       └── evaluator/       # Red team 29-vector audit engine
│   └── tests/
│       └── securityGuard.test.js # Automated verification test suite
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── vercel.json              # Vercel SPA routing configuration
    ├── index.html
    └── src/
        ├── App.jsx              # Routing and navigation shell
        ├── components/          # Navbar, Sidebar, Metric Cards
        └── pages/
            ├── AuthPage.jsx     # Login with Quick Demo Login button
            ├── Dashboard.jsx    # Metrics and security posture overview
            ├── Playground.jsx   # Interactive single-payload test runner
            ├── RedTeam.jsx      # Automated 29-test security audit runner
            ├── BlueTeam.jsx     # Configured policy rules viewer
            └── AuditLogs.jsx    # Forensic audit trail table
```

---

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- Operating System: Windows, macOS, or Linux

Verify installation:
```bash
node -v
npm -v
```

---

## Local Setup

### Option A: Windows One-Click Launcher
Double-click `run-demo.bat` in the `PayFence` root directory, or execute it from PowerShell / Command Prompt:
```cmd
cd PayFence
run-demo.bat
```
The script verifies Node.js, installs dependencies for both backend and frontend if missing, starts the backend on port 5000 and the frontend on port 5173, and opens your default browser at `http://localhost:5173`.

### Option B: Manual Installation and Execution

#### 1. Start the Backend
Open a terminal in `PayFence/backend`:
```bash
cd PayFence/backend
npm install
npm run dev
```
The backend starts on `http://localhost:5000`.

#### 2. Start the Frontend
Open a second terminal in `PayFence/frontend`:
```bash
cd PayFence/frontend
npm install
npm run dev
```
The frontend starts on `http://localhost:5173`.

#### 3. Log In to the Application
Navigate to `http://localhost:5173` in your browser. On the login page:
- Click the **Quick Demo Login** button, or enter:
  - **Email**: `admin@college.edu`
  - **Password**: `admin123`

---

## Environment Variables

### Backend (`PayFence/backend/.env`)
Create a `.env` file in `PayFence/backend` if custom configuration is required:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=payfence_super_secret_jwt_key_2026
FRONTEND_URL=http://localhost:5173
# Optional: MongoDB connection string (leave unset to use in-memory / JSON store)
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/payfence
```

### Frontend (`PayFence/frontend/.env`)
Create a `.env` file in `PayFence/frontend` if running with a remote backend:

```env
VITE_API_URL=http://localhost:5000
```
For local execution, the frontend automatically defaults to `http://localhost:5000`.

---

## Running the Security Test Suite

The backend includes a standalone test runner executing all 28 adversarial attack scenarios plus 1 legitimate control scenario:

```bash
cd PayFence/backend
npm test
```

Expected output:
- Total tests executed: 29
- Attacks blocked: 28 / 28 (100% defense rate)
- Legitimate requests approved: 1 / 1
- Zero false positives

---

## API Reference

### Authentication
- `POST /api/auth/demo-login`: Logs in using the default demo administrator account.
- `POST /api/auth/login`: Authenticates with email and password, returning a JWT token.

### Security Gateway
- `POST /api/gateway/inspect`: Pre-flight payload inspection. Evaluates policy constraints without moving funds. Returns HTTP 200 (allow) or HTTP 403 (block with violation code).
- `POST /api/gateway/pay`: Executes payment after passing policy inspection. Deducts amount from balance and updates daily spent total.

### Audit & Policies
- `GET /api/audit/policy`: Returns current policy rules (per-transaction cap, daily budget, whitelisted recipients, allowed origins).
- `GET /api/audit/logs`: Returns chronological audit records of inspected transactions.
- `POST /api/audit/run`: Triggers the complete Red Team evaluation suite (29 tests) and returns detection rate metrics.

---

## Deployment Guide

### Deploying the Frontend to Vercel

1. **Repository Setup**: Push the project to GitHub.
2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **Add New Project**.
   - Select your repository.
   - Set **Root Directory** to `PayFence/frontend`.
   - Framework Preset: **Vite**.
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Environment Variables**:
   - Add `VITE_API_URL`: set to your deployed backend URL (e.g., `https://payfence-backend.onrender.com`).
4. **Routing Support**:
   - The included `PayFence/frontend/vercel.json` contains single-page application rewrites to route all paths to `index.html`:
     ```json
     {
       "rewrites": [
         { "source": "/(.*)", "destination": "/index.html" }
       ]
     }
     ```
5. Click **Deploy**.

### Deploying the Backend to Render

1. Go to [render.com](https://render.com) and create a new **Web Service**.
2. Connect your GitHub repository.
3. Configure service settings:
   - **Root Directory**: `PayFence/backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add Environment Variables:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: Generate a 32-character random string.
   - `FRONTEND_URL`: Set to your deployed Vercel URL (e.g., `https://payfence.vercel.app`).
5. Click **Create Web Service**.

### Deploying the Backend to Railway

1. Go to [railway.app](https://railway.app) and create a new project from your GitHub repo.
2. In service settings, set **Root Directory** to `/PayFence/backend`.
3. Add environment variables:
   - `PORT`: `5000`
   - `JWT_SECRET`: your secret key
   - `FRONTEND_URL`: your frontend deployment URL
4. Railway detects Node.js and runs `npm install` followed by `npm start`.

---

## Project Scope & Academic Attribution

- **Base UI Starter Kit**: The basic wallet UI layout and color scaffolding were provided as part of the Internshala training course starter template.
- **Student Engineering Contribution**:
  - Architecture and implementation of the PayFence API cybersecurity gateway.
  - Deterministic policy enforcement engine with micro-unit integer arithmetic to prevent floating-point rounding exploits.
  - Interception logic mapping and mitigating five OWASP API Security threat categories.
  - 28 adversarial test cases covering BOLA, parameter tampering, and origin forgery.
  - Automated Red Team evaluation runner and real-time forensic audit logging.
