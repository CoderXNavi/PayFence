/**
 * PayFence Security Guard Comprehensive Test Suite
 * Built with Node.js Native Test Runner (node:test).
 * Verifies all 28 attacks are blocked across 5 OWASP categories,
 * legitimate control passes, and audit engine achieves 100% detection score.
 */

import { describe, it, beforeEach, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { evaluateTransaction } from '../src/services/guard/securityGuard.js';
import { ATTACK_CASES, OWASP_CATEGORIES } from '../src/services/guard/attackCases.js';
import { runAudit } from '../src/services/evaluator/auditEngine.js';
import { DEFAULT_POLICY, normalizeAmount } from '../src/services/guard/defaultPolicy.js';
import { 
  _resetStoreForTesting, 
  getUserById, 
  updateUserBalance, 
  getDailySpending, 
  recordDailySpending, 
  getPolicy, 
  addAuditLog, 
  getAuditLogs 
} from '../src/models/store.js';

describe('PayFence Autonomous Security Guard', () => {

  beforeEach(() => {
    _resetStoreForTesting();
  });

  describe('OWASP Category 1: BOLA / IDOR Protection (6 Cases)', () => {
    const bolaCases = ATTACK_CASES.filter((c) => c.category === OWASP_CATEGORIES.BOLA_IDOR);

    it('should have exactly 6 BOLA/IDOR attack test cases', () => {
      assert.equal(bolaCases.length, 6);
    });

    for (const testCase of bolaCases) {
      it(`should block ${testCase.id}: ${testCase.name}`, () => {
        const verdict = evaluateTransaction(testCase.payload, {
          ...testCase.context,
          policy: DEFAULT_POLICY
        });

        assert.equal(verdict.allowed, false, `Expected ${testCase.id} to be blocked`);
        assert.equal(verdict.action, 'BLOCK');
        assert.equal(verdict.category, OWASP_CATEGORIES.BOLA_IDOR);
        assert.equal(verdict.violationCode, testCase.expectedViolationCode);
        assert.ok(verdict.reason.length > 0);
      });
    }
  });

  describe('OWASP Category 2: Business Logic & Limits Enforcement (6 Cases)', () => {
    const logicCases = ATTACK_CASES.filter((c) => c.category === OWASP_CATEGORIES.BUSINESS_LOGIC);

    it('should have exactly 6 Business Logic & Limits attack test cases', () => {
      assert.equal(logicCases.length, 6);
    });

    for (const testCase of logicCases) {
      it(`should block ${testCase.id}: ${testCase.name}`, () => {
        const verdict = evaluateTransaction(testCase.payload, {
          ...testCase.context,
          policy: DEFAULT_POLICY
        });

        assert.equal(verdict.allowed, false, `Expected ${testCase.id} to be blocked`);
        assert.equal(verdict.action, 'BLOCK');
        assert.equal(verdict.category, OWASP_CATEGORIES.BUSINESS_LOGIC);
        assert.equal(verdict.violationCode, testCase.expectedViolationCode);
        assert.ok(verdict.reason.length > 0);
      });
    }
  });

  describe('OWASP Category 3: Input Validation & Sanitization (6 Cases)', () => {
    const inputCases = ATTACK_CASES.filter((c) => c.category === OWASP_CATEGORIES.INPUT_VALIDATION);

    it('should have exactly 6 Input Validation attack test cases', () => {
      assert.equal(inputCases.length, 6);
    });

    for (const testCase of inputCases) {
      it(`should block ${testCase.id}: ${testCase.name}`, () => {
        const verdict = evaluateTransaction(testCase.payload, {
          ...testCase.context,
          policy: DEFAULT_POLICY
        });

        assert.equal(verdict.allowed, false, `Expected ${testCase.id} to be blocked`);
        assert.equal(verdict.action, 'BLOCK');
        assert.equal(verdict.category, OWASP_CATEGORIES.INPUT_VALIDATION);
        assert.equal(verdict.violationCode, testCase.expectedViolationCode);
        assert.ok(verdict.reason.length > 0);
      });
    }
  });

  describe('OWASP Category 4: Origin Spoofing Prevention (5 Cases)', () => {
    const originCases = ATTACK_CASES.filter((c) => c.category === OWASP_CATEGORIES.ORIGIN_SPOOFING);

    it('should have exactly 5 Origin Spoofing attack test cases', () => {
      assert.equal(originCases.length, 5);
    });

    for (const testCase of originCases) {
      it(`should block ${testCase.id}: ${testCase.name}`, () => {
        const verdict = evaluateTransaction(testCase.payload, {
          ...testCase.context,
          policy: DEFAULT_POLICY
        });

        assert.equal(verdict.allowed, false, `Expected ${testCase.id} to be blocked`);
        assert.equal(verdict.action, 'BLOCK');
        assert.equal(verdict.category, OWASP_CATEGORIES.ORIGIN_SPOOFING);
        assert.equal(verdict.violationCode, testCase.expectedViolationCode);
        assert.ok(verdict.reason.length > 0);
      });
    }
  });

  describe('OWASP Category 5: Protocol Integrity & Replay Mitigation (5 Cases)', () => {
    const protoCases = ATTACK_CASES.filter((c) => c.category === OWASP_CATEGORIES.PROTOCOL_INTEGRITY);

    it('should have exactly 5 Protocol Integrity attack test cases', () => {
      assert.equal(protoCases.length, 5);
    });

    for (const testCase of protoCases) {
      it(`should block ${testCase.id}: ${testCase.name}`, () => {
        const verdict = evaluateTransaction(testCase.payload, {
          ...testCase.context,
          policy: DEFAULT_POLICY
        });

        assert.equal(verdict.allowed, false, `Expected ${testCase.id} to be blocked`);
        assert.equal(verdict.action, 'BLOCK');
        assert.equal(verdict.category, OWASP_CATEGORIES.PROTOCOL_INTEGRITY);
        assert.equal(verdict.violationCode, testCase.expectedViolationCode);
        assert.ok(verdict.reason.length > 0);
      });
    }
  });

  describe('Legitimate Control Transaction (1 Case)', () => {
    const controlCase = ATTACK_CASES.find((c) => !c.isAttack);

    it('should exist and be designated as non-attack control', () => {
      assert.ok(controlCase);
      assert.equal(controlCase.id, 'CTRL-01');
      assert.equal(controlCase.isAttack, false);
      assert.equal(controlCase.expectedAction, 'ALLOW');
    });

    it('should allow legitimate control payment within policy caps', () => {
      const verdict = evaluateTransaction(controlCase.payload, {
        ...controlCase.context,
        policy: DEFAULT_POLICY
      });

      assert.equal(verdict.allowed, true);
      assert.equal(verdict.action, 'ALLOW');
      assert.equal(verdict.violationCode, null);
      assert.equal(verdict.category, 'Legitimate Control');
      assert.equal(verdict.checks.amountValid, true);
      assert.equal(verdict.checks.perTxCapValid, true);
      assert.equal(verdict.checks.dailyBudgetValid, true);
      assert.equal(verdict.checks.recipientWhitelisted, true);
      assert.equal(verdict.checks.originValid, true);
      assert.equal(verdict.checks.authorizationValid, true);
      assert.equal(verdict.checks.balanceValid, true);
    });
  });

  describe('Audit Engine Benchmark (100% Detection & Score 100)', () => {
    it('should achieve 100% detection rate and 100 security score across all 29 cases', () => {
      const audit = runAudit({ policy: DEFAULT_POLICY });

      assert.equal(audit.summary.totalCases, 29);
      assert.equal(audit.summary.attackCasesCount, 28);
      assert.equal(audit.summary.controlCasesCount, 1);
      assert.equal(audit.summary.attacksBlocked, 28);
      assert.equal(audit.summary.attacksBypassed, 0);
      assert.equal(audit.summary.controlAllowed, 1);
      assert.equal(audit.summary.falsePositives, 0);
      assert.equal(audit.summary.detectionRate, 100.0);
      assert.equal(audit.summary.securityScore, 100);
      assert.equal(audit.summary.allPassed, true);
      assert.equal(audit.summary.verdict, 'ALL_ATTACKS_MITIGATED');

      // Verify category metrics
      for (const [catName, stats] of Object.entries(audit.categoryBreakdown)) {
        assert.equal(stats.bypassed, 0, `Category ${catName} had bypassed attacks`);
        assert.equal(stats.detectionRate, 100, `Category ${catName} detection rate was not 100%`);
      }
    });
  });

  describe('Boundary Limit Verification', () => {
    const validRecipient = '0x71C8451C3343344Fc4534664634234567890abcd';
    const validOrigin = 'https://app.payfence.io';
    const userContext = { user: { id: 'usr_demo_01', balanceUSD: 500.00 } };

    it('should ALLOW payment exactly at the per-transaction cap ($50.00)', () => {
      const verdict = evaluateTransaction({
        recipient: validRecipient,
        amount: 50.00,
        origin: validOrigin
      }, userContext);

      assert.equal(verdict.allowed, true);
      assert.equal(verdict.action, 'ALLOW');
    });

    it('should BLOCK payment exceeding per-transaction cap by $0.01 ($50.01)', () => {
      const verdict = evaluateTransaction({
        recipient: validRecipient,
        amount: 50.01,
        origin: validOrigin
      }, userContext);

      assert.equal(verdict.allowed, false);
      assert.equal(verdict.action, 'BLOCK');
      assert.equal(verdict.violationCode, 'EXCEEDS_PER_TX_CAP');
    });

    it('should ALLOW payment exactly at unit cap (500000 units)', () => {
      const verdict = evaluateTransaction({
        recipient: validRecipient,
        amount: 500000,
        unitType: 'units',
        origin: validOrigin
      }, userContext);

      assert.equal(verdict.allowed, true);
      assert.equal(verdict.action, 'ALLOW');
    });

    it('should BLOCK payment exceeding unit cap (500001 units)', () => {
      const verdict = evaluateTransaction({
        recipient: validRecipient,
        amount: 500001,
        unitType: 'units',
        origin: validOrigin
      }, userContext);

      assert.equal(verdict.allowed, false);
      assert.equal(verdict.action, 'BLOCK');
      assert.equal(verdict.violationCode, 'EXCEEDS_PER_TX_CAP');
    });

    it('should ALLOW payment reaching exactly daily budget cap ($200.00 total)', () => {
      const verdict = evaluateTransaction({
        recipient: validRecipient,
        amount: 40.00,
        origin: validOrigin
      }, {
        ...userContext,
        currentDailySpentUSD: 160.00
      });

      assert.equal(verdict.allowed, true);
      assert.equal(verdict.action, 'ALLOW');
    });

    it('should BLOCK payment when exceeding daily budget by $0.01 ($200.01 total)', () => {
      const verdict = evaluateTransaction({
        recipient: validRecipient,
        amount: 40.01,
        origin: validOrigin
      }, {
        ...userContext,
        currentDailySpentUSD: 160.00
      });

      assert.equal(verdict.allowed, false);
      assert.equal(verdict.action, 'BLOCK');
      assert.equal(verdict.violationCode, 'EXCEEDS_DAILY_BUDGET');
    });
  });

  describe('Zero-Dependency Store Operations', () => {
    it('should load pre-seeded demo user with initial $500.00 balance', () => {
      const user = getUserById('usr_demo_01');
      assert.ok(user);
      assert.equal(user.email, 'demo@payfence.io');
      assert.equal(user.balanceUSD, 500.00);
      assert.equal(user.balanceUnits, 5000000);
    });

    it('should update user balance and record spending accurately', () => {
      const updated = updateUserBalance('usr_demo_01', 475.00);
      assert.equal(updated.balanceUSD, 475.00);
      assert.equal(updated.balanceUnits, 4750000);

      const spent = recordDailySpending('usr_demo_01', 25.00);
      assert.equal(spent, 25.00);
      assert.equal(getDailySpending('usr_demo_01'), 25.00);
    });

    it('should store and retrieve audit logs', () => {
      addAuditLog({
        action: 'BLOCK',
        allowed: false,
        category: 'Test Category',
        violationCode: 'TEST_VIOLATION',
        reason: 'Testing log persistence'
      });

      const { logs, total } = getAuditLogs({ limit: 10 });
      assert.ok(total >= 1);
      assert.equal(logs[0].violationCode, 'TEST_VIOLATION');
    });
  });

  describe('HTTP API Endpoints Integration', () => {
    let server;
    let baseUrl;
    let authToken;

    before(async () => {
      await new Promise((resolve) => {
        server = app.listen(0, () => {
          const port = server.address().port;
          baseUrl = `http://127.0.0.1:${port}`;
          resolve();
        });
      });
    });

    after(() => {
      if (server) {
        server.close();
      }
    });

    it('GET /api/health should return status healthy', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, 'healthy');
      assert.ok(data.service);
    });

    it('POST /api/auth/demo-login should authenticate demo user', async () => {
      const res = await fetch(`${baseUrl}/api/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.token);
      assert.equal(data.user.id, 'usr_demo_01');
      authToken = data.token;
    });

    it('POST /api/gateway/inspect should return ALLOW for compliant payload', async () => {
      const res = await fetch(`${baseUrl}/api/gateway/inspect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
          amount: 25.00,
          origin: 'https://app.payfence.io'
        })
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.allowed, true);
      assert.equal(data.verdict, 'ALLOW');
    });

    it('POST /api/gateway/inspect should return BLOCK for over-cap transaction ($150)', async () => {
      const res = await fetch(`${baseUrl}/api/gateway/inspect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
          amount: 150.00,
          origin: 'https://app.payfence.io'
        })
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.allowed, false);
      assert.equal(data.verdict, 'BLOCK');
      assert.equal(data.violationCode, 'EXCEEDS_PER_TX_CAP');
    });

    it('POST /api/gateway/pay should block attack transaction with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/gateway/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
          amount: 99.00, // exceeds cap
          origin: 'https://app.payfence.io'
        })
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.action, 'BLOCK');
      assert.equal(data.violationCode, 'EXCEEDS_PER_TX_CAP');
    });

    it('POST /api/gateway/pay should execute legitimate payment with 200 OK', async () => {
      const res = await fetch(`${baseUrl}/api/gateway/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
          amount: 25.00,
          origin: 'https://app.payfence.io'
        })
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.action, 'ALLOW');
      assert.ok(data.txId);
      assert.equal(data.amountUSD, 25.00);
      assert.equal(data.balanceRemainingUSD, 475.00);
    });

    it('POST /api/audit/run should execute benchmark and return 100% detection', async () => {
      const res = await fetch(`${baseUrl}/api/audit/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.summary.totalCases, 29);
      assert.equal(data.summary.attacksBlocked, 28);
      assert.equal(data.summary.controlAllowed, 1);
      assert.equal(data.summary.detectionRate, 100.0);
      assert.equal(data.summary.securityScore, 100);
    });

    it('GET /api/audit/policy should return active security policy', async () => {
      const res = await fetch(`${baseUrl}/api/audit/policy`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.policy.perTxCapUSD, 50.00);
      assert.equal(data.policy.dailyBudgetUSD, 200.00);
      assert.equal(data.policy.mockBalanceUSD, 500.00);
    });
  });
});
