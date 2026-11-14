/**
 * PayFence Audit & Security Policy Routes
 * Endpoints:
 * - POST   /run: Triggers OWASP 29-case benchmark audit engine
 * - GET    /logs: Retrieves historical security guard & transaction audit logs
 * - DELETE /logs: Clears audit logs
 * - GET    /policy: Retrieves active security policy rules and caps
 * - PUT    /policy: Updates security policy parameters
 * - POST   /policy/reset: Restores default policy values
 */

import express from 'express';
import { runAudit } from '../services/evaluator/auditEngine.js';
import { 
  getPolicy, 
  updatePolicy, 
  resetPolicy, 
  getAuditLogs, 
  clearAuditLogs, 
  addAuditLog 
} from '../models/store.js';

const router = express.Router();

/**
 * POST /api/audit/run
 * Executes the 29-case test benchmark (28 attacks + 1 control) and returns complete metrics.
 */
router.post('/run', (req, res) => {
  const activePolicy = getPolicy();
  const auditReport = runAudit({ policy: activePolicy });

  // Record audit execution in system logs
  addAuditLog({
    action: 'AUDIT_RUN',
    allowed: auditReport.summary.allPassed,
    category: 'System Audit',
    violationCode: null,
    reason: `Audit executed: ${auditReport.summary.attacksBlocked}/${auditReport.summary.attackCasesCount} attacks blocked (${auditReport.summary.detectionRate}% detection rate), Score: ${auditReport.summary.securityScore}/100`,
    details: {
      summary: auditReport.summary,
      categoryBreakdown: auditReport.categoryBreakdown,
      totalDurationMs: auditReport.totalDurationMs
    }
  });

  return res.status(200).json({
    success: true,
    summary: auditReport.summary,
    categoryBreakdown: auditReport.categoryBreakdown,
    results: auditReport.results,
    executedAt: auditReport.executedAt,
    totalDurationMs: auditReport.totalDurationMs
  });
});

/**
 * GET /api/audit/logs
 * Retrieves security audit events and payment logs.
 */
router.get('/logs', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const category = req.query.category || undefined;
  
  let allowed = undefined;
  if (req.query.allowed === 'true') allowed = true;
  if (req.query.allowed === 'false') allowed = false;

  const logsData = getAuditLogs({ limit, offset, category, allowed });

  return res.status(200).json({
    success: true,
    ...logsData
  });
});

/**
 * DELETE /api/audit/logs
 * Clears historical audit logs.
 */
router.delete('/logs', (req, res) => {
  clearAuditLogs();
  return res.status(200).json({
    success: true,
    message: 'Audit logs cleared successfully'
  });
});

/**
 * GET /api/audit/policy
 * Returns the currently active guard policy and limits.
 */
router.get('/policy', (req, res) => {
  const policy = getPolicy();
  return res.status(200).json({
    success: true,
    policy
  });
});

/**
 * PUT /api/audit/policy
 * Updates policy limits, whitelist, and security parameters.
 */
router.put('/policy', (req, res) => {
  const updates = req.body || {};
  const updatedPolicy = updatePolicy('default', updates);

  addAuditLog({
    action: 'POLICY_UPDATE',
    allowed: true,
    category: 'Configuration',
    reason: 'Security policy updated by administrator',
    details: { updates }
  });

  return res.status(200).json({
    success: true,
    message: 'Security policy updated successfully',
    policy: updatedPolicy
  });
});

/**
 * POST /api/audit/policy/reset
 * Restores security policy to factory defaults.
 */
router.post('/policy/reset', (req, res) => {
  const reset = resetPolicy('default');

  addAuditLog({
    action: 'POLICY_RESET',
    allowed: true,
    category: 'Configuration',
    reason: 'Security policy restored to standard factory defaults'
  });

  return res.status(200).json({
    success: true,
    message: 'Security policy reset to default',
    policy: reset
  });
});

export default router;
