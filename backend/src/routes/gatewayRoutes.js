/**
 * PayFence Autonomous Gateway Routes
 * Endpoints:
 * - POST /inspect: Deterministic security pre-flight inspection without fund execution
 * - POST /pay: Evaluates guard and securely executes authorized payments
 * - GET  /balance: Returns current mock balance and daily budget utilization
 */

import express from 'express';
import crypto from 'node:crypto';
import { evaluateTransaction } from '../services/guard/securityGuard.js';
import { 
  getPolicy, 
  getDailySpending, 
  recordDailySpending, 
  updateUserBalance, 
  addAuditLog, 
  getUserById 
} from '../models/store.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * POST /api/gateway/inspect
 * Runs deterministic security inspection against candidate transaction without fund movement.
 */
router.post('/inspect', optionalAuth, (req, res) => {
  const policy = getPolicy();
  const origin = req.body?.origin || req.headers.origin || req.headers.referer || '';
  const currentDailySpentUSD = getDailySpending(req.user.id);

  const payload = {
    ...req.body,
    origin: req.body?.origin !== undefined ? req.body.origin : origin
  };

  const context = {
    user: req.user,
    currentDailySpentUSD,
    policy,
    origin
  };

  const verdict = evaluateTransaction(payload, context);

  return res.status(200).json({
    success: true,
    inspection: verdict,
    verdict: verdict.action,
    allowed: verdict.allowed,
    category: verdict.category,
    violationCode: verdict.violationCode,
    reason: verdict.reason,
    checks: verdict.checks,
    timestamp: verdict.timestamp
  });
});

/**
 * POST /api/gateway/pay
 * Executes autonomous payment only if security guard allows.
 */
router.post('/pay', optionalAuth, (req, res) => {
  const policy = getPolicy();
  const origin = req.body?.origin !== undefined 
    ? req.body.origin 
    : (req.headers.origin || req.headers.referer || '');
  const currentDailySpentUSD = getDailySpending(req.user.id);

  const payload = {
    ...req.body,
    origin
  };

  const context = {
    user: req.user,
    currentDailySpentUSD,
    policy,
    origin
  };

  const verdict = evaluateTransaction(payload, context);

  // If blocked by security guard
  if (!verdict.allowed) {
    // Record security violation in audit log
    addAuditLog({
      action: 'BLOCK',
      allowed: false,
      category: verdict.category,
      violationCode: verdict.violationCode,
      reason: verdict.reason,
      recipient: typeof payload.recipient === 'string' ? payload.recipient : 'MALFORMED',
      amountUSD: typeof payload.amount === 'number' ? payload.amount : null,
      origin,
      userId: req.user.id,
      details: {
        checks: verdict.checks,
        payloadSummary: {
          recipient: payload.recipient,
          amount: payload.amount
        }
      }
    });

    return res.status(403).json({
      success: false,
      error: 'SECURITY_GUARD_BLOCKED',
      action: 'BLOCK',
      category: verdict.category,
      violationCode: verdict.violationCode,
      reason: verdict.reason,
      checks: verdict.checks,
      timestamp: verdict.timestamp
    });
  }

  // Payment Allowed: Execute transaction
  const amountUSD = verdict.normalizedAmount.usd;
  const txId = `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  // Update balance and daily spending
  const freshUser = getUserById(req.user.id) || req.user;
  const newBalance = Number((freshUser.balanceUSD - amountUSD).toFixed(2));
  updateUserBalance(req.user.id, newBalance);
  const updatedDailySpent = recordDailySpending(req.user.id, amountUSD);

  // Record allowed transaction in audit log
  const auditEntry = addAuditLog({
    id: txId,
    action: 'ALLOW',
    allowed: true,
    category: 'Payment Execution',
    violationCode: null,
    reason: verdict.reason,
    recipient: payload.recipient,
    amountUSD,
    origin,
    userId: req.user.id,
    details: {
      txId,
      newBalanceUSD: newBalance,
      updatedDailySpentUSD: updatedDailySpent
    }
  });

  return res.status(200).json({
    success: true,
    action: 'ALLOW',
    txId,
    recipient: payload.recipient,
    amountUSD,
    amountUnits: verdict.normalizedAmount.units,
    balanceRemainingUSD: newBalance,
    dailySpentUSD: updatedDailySpent,
    dailyBudgetUSD: policy.dailyBudgetUSD,
    timestamp: auditEntry.timestamp,
    verdict
  });
});

/**
 * GET /api/gateway/balance
 * Returns user balance and daily budget status.
 */
router.get('/balance', optionalAuth, (req, res) => {
  const user = getUserById(req.user.id) || req.user;
  const policy = getPolicy();
  const dailySpent = getDailySpending(user.id);

  return res.status(200).json({
    success: true,
    userId: user.id,
    balanceUSD: user.balanceUSD,
    balanceUnits: user.balanceUnits,
    dailySpentUSD: dailySpent,
    dailyBudgetUSD: policy.dailyBudgetUSD,
    dailyRemainingUSD: Math.max(0, Number((policy.dailyBudgetUSD - dailySpent).toFixed(2))),
    perTxCapUSD: policy.perTxCapUSD
  });
});

export default router;
