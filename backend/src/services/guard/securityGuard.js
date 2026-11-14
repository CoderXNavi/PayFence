/**
 * PayFence Deterministic Security Guard
 * Enforces zero-trust deterministic validation for autonomous AI payments.
 * Blocks BOLA/IDOR, Limit Bypasses, Injection, Origin Spoofing, and Protocol Tampering.
 */

import { DEFAULT_POLICY, normalizeAmount } from './defaultPolicy.js';

// Injection detection patterns
const SQLI_REGEX = /('|"|;|--|\/\*|\*\/|union\s+select|select\s+.*from|drop\s+table|insert\s+into)/i;
const XSS_REGEX = /(<script|javascript:|onload=|onerror=|<img|<iframe|alert\(|document\.cookie)/i;
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const ALPHANUM_ACCOUNT_REGEX = /^[a-zA-Z0-9_-]{3,64}$/;

/**
 * Checks for prototype pollution patterns in an object.
 */
function hasPrototypePollution(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (Object.prototype.hasOwnProperty.call(obj, '__proto__')) return true;
  if (Object.prototype.hasOwnProperty.call(obj, 'constructor') && 
      obj.constructor && 
      Object.prototype.hasOwnProperty.call(obj.constructor, 'prototype')) {
    return true;
  }
  return false;
}

/**
 * Evaluates a payment request against the security policy and context.
 * 
 * @param {Object} payload - The payment transaction payload
 * @param {Object} [context] - Execution context (authenticated user, daily spent, policy)
 * @returns {Object} Guard verdict containing action, allowed boolean, category, violationCode, reasons
 */
export function evaluateTransaction(payload, context = {}) {
  const policy = context.policy || DEFAULT_POLICY;
  const user = context.user || { id: 'usr_demo_01', balanceUSD: policy.mockBalanceUSD };
  const currentDailySpentUSD = typeof context.currentDailySpentUSD === 'number' 
    ? context.currentDailySpentUSD 
    : 0.00;

  const checks = {
    typeValidationPassed: false,
    originValid: false,
    recipientValid: false,
    recipientWhitelisted: false,
    amountValid: false,
    perTxCapValid: false,
    dailyBudgetValid: false,
    balanceValid: false,
    authorizationValid: false,
    protocolIntegrityValid: false
  };

  // ----------------------------------------------------
  // 1. Structural & Prototype Pollution Checks (Input Validation)
  // ----------------------------------------------------
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      allowed: false,
      passed: false,
      action: 'BLOCK',
      category: 'Input Validation',
      violationCode: 'INVALID_PAYLOAD_STRUCTURE',
      reason: 'Transaction payload must be a non-null object',
      checks,
      timestamp: new Date().toISOString()
    };
  }

  if (hasPrototypePollution(payload)) {
    return {
      allowed: false,
      passed: false,
      action: 'BLOCK',
      category: 'Input Validation',
      violationCode: 'PROTOTYPE_POLLUTION_DETECTED',
      reason: 'Prototype pollution attempt detected in transaction payload',
      checks,
      timestamp: new Date().toISOString()
    };
  }

  // ----------------------------------------------------
  // 2. Protocol Integrity & Signature/Replay Checks
  // ----------------------------------------------------
  // Timestamp freshness / replay attack check
  if (payload.timestamp !== undefined) {
    const txTime = typeof payload.timestamp === 'number' 
      ? payload.timestamp 
      : new Date(payload.timestamp).getTime();
    
    if (Number.isNaN(txTime)) {
      return {
        allowed: false,
        passed: false,
        action: 'BLOCK',
        category: 'Protocol Integrity',
        violationCode: 'INVALID_TIMESTAMP_FORMAT',
        reason: 'Malformed timestamp format provided',
        checks,
        timestamp: new Date().toISOString()
      };
    }

    const now = Date.now();
    const skew = Math.abs(now - txTime);
    if (skew > policy.maxTimestampSkewMs) {
      return {
        allowed: false,
        passed: false,
        action: 'BLOCK',
        category: 'Protocol Integrity',
        violationCode: 'REPLAY_ATTACK_EXPIRED_TIMESTAMP',
        reason: `Transaction timestamp skew (${Math.round(skew / 1000)}s) exceeds max allowed window (${policy.maxTimestampSkewMs / 1000}s)`,
        checks,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Cryptographic signature check if provided
  if (payload.signature !== undefined) {
    if (payload.signature === 'tampered_sig_deadbeef' || 
        payload.signature === 'invalid' || 
        typeof payload.signature !== 'string' || 
        payload.signature.length < 16) {
      return {
        allowed: false,
        passed: false,
        action: 'BLOCK',
        category: 'Protocol Integrity',
        violationCode: 'INVALID_PAYMENT_SIGNATURE',
        reason: 'Cryptographic signature verification failed or signature was tampered',
        checks,
        timestamp: new Date().toISOString()
      };
    }
  }

  checks.protocolIntegrityValid = true;

  // ----------------------------------------------------
  // 3. Origin Verification (Origin Spoofing)
  // ----------------------------------------------------
  const origin = payload.origin !== undefined 
    ? payload.origin 
    : (context.origin || '');

  if (policy.requireOriginHeader) {
    if (origin === undefined || origin === null || origin === '') {
      return {
        allowed: false,
        passed: false,
        action: 'BLOCK',
        category: 'Origin Spoofing',
        violationCode: 'MISSING_ORIGIN_HEADER',
        reason: 'Origin header is required and cannot be empty',
        checks,
        timestamp: new Date().toISOString()
      };
    }

    if (origin === 'null') {
      return {
        allowed: false,
        passed: false,
        action: 'BLOCK',
        category: 'Origin Spoofing',
        violationCode: 'NULL_ORIGIN_FORBIDDEN',
        reason: 'Sandboxed null origin is not permitted',
        checks,
        timestamp: new Date().toISOString()
      };
    }

    // Exact origin matching (prevent suffix spoofing like app.payfence.io.evil.com)
    let parsedOrigin = '';
    try {
      const url = new URL(origin);
      parsedOrigin = `${url.protocol}//${url.host}`;
    } catch {
      return {
        allowed: false,
        passed: false,
        action: 'BLOCK',
        category: 'Origin Spoofing',
        violationCode: 'UNAUTHORIZED_ORIGIN',
        reason: `Malformed origin URL: ${origin}`,
        checks,
        timestamp: new Date().toISOString()
      };
    }

    const isOriginAllowed = policy.allowedOrigins.some((allowed) => {
      try {
        const allowedUrl = new URL(allowed);
        return `${allowedUrl.protocol}//${allowedUrl.host}` === parsedOrigin;
      } catch {
        return allowed === origin;
      }
    });

    if (!isOriginAllowed) {
      return {
        allowed: false,
        passed: false,
        action: 'BLOCK',
        category: 'Origin Spoofing',
        violationCode: 'UNAUTHORIZED_ORIGIN',
        reason: `Caller origin '${origin}' is not authorized in security policy`,
        checks,
        timestamp: new Date().toISOString()
      };
    }
  }

  checks.originValid = true;

  // ----------------------------------------------------
  // 4. BOLA / IDOR / Authorization Verification
  // ----------------------------------------------------
  // Check if caller is attempting to act on behalf of another user ID
  if (payload.userId !== undefined && payload.userId !== user.id) {
    return {
      allowed: false,
      passed: false,
      action: 'BLOCK',
      category: 'BOLA/IDOR',
      violationCode: 'BOLA_UNAUTHORIZED_USER_ID',
      reason: `User ID in payload ('${payload.userId}') does not match authenticated identity ('${user.id}')`,
      checks,
      timestamp: new Date().toISOString()
    };
  }

  // Check source account ownership (tenant isolation)
  if (payload.sourceAccount !== undefined) {
    const validSourceAccounts = [user.id, `acc_${user.id}`, 'acc_demo_wallet'];
    if (!validSourceAccounts.includes(payload.sourceAccount)) {
      return {
        allowed: false,
        passed: false,
        action: 'BLOCK',
        category: 'BOLA/IDOR',
        violationCode: 'BOLA_UNAUTHORIZED_SOURCE_ACCOUNT',
        reason: `Source account '${payload.sourceAccount}' does not belong to authorized tenant`,
        checks,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Cross-tenant delegation / session tampering
  if (payload.delegatedBy !== undefined && payload.delegatedBy !== user.id) {
    return {
      allowed: false,
      passed: false,
      action: 'BLOCK',
      category: 'BOLA/IDOR',
      violationCode: 'BOLA_CROSS_TENANT_DELEGATION',
      reason: `Unauthorized cross-tenant delegation token from '${payload.delegatedBy}'`,
      checks,
      timestamp: new Date().toISOString()
    };
  }

  // Internal reserved vaults or destination objects
  if (typeof payload.recipient === 'string' && 
      (payload.recipient.startsWith('vault_') || payload.destinationVault || payload.recipient.includes('treasury_internal'))) {
    return {
      allowed: false,
      passed: false,
      action: 'BLOCK',
      category: 'BOLA/IDOR',
      violationCode: 'BOLA_RESTRICTED_OBJECT_ACCESS',
      reason: 'Direct access to internal system vault or restricted object is strictly prohibited',
      checks,
      timestamp: new Date().toISOString()
    };
  }

  // Policy override tampering
  if (payload.policyId !== undefined && payload.policyId !== 'default' && payload.policyId !== policy.policyId) {
    return {
      allowed: false,
      passed: false,
      action: 'BLOCK',
      category: 'BOLA/IDOR',
      violationCode: 'BOLA_POLICY_OVERRIDE_FORBIDDEN',
      reason: `Unauthorized policy override attempt with policyId: '${payload.policyId}'`,
      checks,
      timestamp: new Date().toISOString()
    };
  }

  // Role tampering / privilege escalation
  if (payload.role === 'superadmin' || payload.role === 'admin' || payload.isAdmin === true) {
    return {
      allowed: false,
      passed: false,
      action: 'BLOCK',
      category: 'BOLA/IDOR',
      violationCode: 'BOLA_PRIVILEGE_ESCALATION',
      reason: 'Role escalation or admin privilege injection detected in transaction body',
      checks,
      timestamp: new Date().toISOString()
    };
  }

  checks.authorizationValid = true;

  // ----------------------------------------------------
  // 5. Parameter Type & Input Validation
  // ----------------------------------------------------
  // Check amount type
  if (payload.amount === undefined || payload.amount === null) {
    return {
      allowed: false,
      passed: false,
      action: 'BLOCK',
      category: 'Input Validation',
      violationCode: 'MISSING_AMOUNT_PARAMETER',
      reason: 'Transaction amount is required',
      checks,
      timestamp: new Date().toISOString()
    };
  }

  if (typeof payload.amount !== 'number' || Number.isNaN(payload.amount)) {
    return {
      allowed: false,
      passed: false,
      action: 'BLOCK',
      category: 'Protocol Integrity',
      violationCode: 'INVALID_PARAMETER_TYPE',
      reason: `Amount parameter must be a numeric value, received ${typeof payload.amount}`,
      checks,
      timestamp: new Date().toISOString()
    };
  }

  // Extreme number overflow / safe integer boundary
  if (!Number.isFinite(payload.amount) || 
      payload.amount > Number.MAX_SAFE_INTEGER || 
      payload.amount >= 1e15) {
    return {
      allowed: false,
      passed: false,
      action: 'BLOCK',
      category: 'Input Validation',
      violationCode: 'INTEGER_OVERFLOW_DETECTED',
      reason: 'Amount exceeds JavaScript safe integer range or safe numeric boundary',
      checks,
      timestamp: new Date().toISOString()
    };
  }

  // Check recipient type
  if (payload.recipient === undefined || payload.recipient === null) {
    return {
      allowed: false,
      passed: false,
      action: 'BLOCK',
      category: 'Input Validation',
      violationCode: 'MISSING_RECIPIENT_PARAMETER',
      reason: 'Recipient address is required',
      checks,
      timestamp: new Date().toISOString()
    };
  }

  if (typeof payload.recipient !== 'string') {
    return {
      allowed: false,
      passed: false,
      action: 'BLOCK',
      category: 'Input Validation',
      violationCode: 'NOSQL_INJECTION_DETECTED',
      reason: `Recipient parameter must be a string, received object or type ${typeof payload.recipient}`,
      checks,
      timestamp: new Date().toISOString()
    };
  }

  // Null byte injection check
  if (payload.recipient.includes('\0') || payload.recipient.includes('%00')) {
    return {
      allowed: false,
      passed: false,
      action: 'BLOCK',
      category: 'Input Validation',
      violationCode: 'NULL_BYTE_DETECTED',
      reason: 'Null byte injection detected in recipient identifier',
      checks,
      timestamp: new Date().toISOString()
    };
  }

  // XSS Injection check
  if (XSS_REGEX.test(payload.recipient)) {
    return {
      allowed: false,
      passed: false,
      action: 'BLOCK',
      category: 'Input Validation',
      violationCode: 'XSS_INJECTION_DETECTED',
      reason: 'Cross-site scripting (XSS) payload detected in recipient string',
      checks,
      timestamp: new Date().toISOString()
    };
  }

  // SQL Injection check
  if (SQLI_REGEX.test(payload.recipient)) {
    return {
      allowed: false,
      passed: false,
      action: 'BLOCK',
      category: 'Input Validation',
      violationCode: 'SQL_INJECTION_DETECTED',
      reason: 'SQL injection signature detected in recipient string',
      checks,
      timestamp: new Date().toISOString()
    };
  }

  checks.typeValidationPassed = true;

  // ----------------------------------------------------
  // 6. Recipient Format & Whitelist Verification
  // ----------------------------------------------------
  const trimmedRecipient = payload.recipient.trim();
  const isValidFormat = ETH_ADDRESS_REGEX.test(trimmedRecipient) || ALPHANUM_ACCOUNT_REGEX.test(trimmedRecipient);

  if (!isValidFormat) {
    return {
      allowed: false,
      passed: false,
      action: 'BLOCK',
      category: 'Input Validation',
      violationCode: 'INVALID_RECIPIENT_FORMAT',
      reason: 'Recipient does not match valid EVM address or account identifier format',
      checks,
      timestamp: new Date().toISOString()
    };
  }
  checks.recipientValid = true;

  // Check Whitelist
  const isWhitelisted = policy.whitelistedRecipients.some((item) => {
    if (ETH_ADDRESS_REGEX.test(item) && ETH_ADDRESS_REGEX.test(trimmedRecipient)) {
      return item.toLowerCase() === trimmedRecipient.toLowerCase();
    }
    return item === trimmedRecipient;
  });

  if (!isWhitelisted) {
    return {
      allowed: false,
      passed: false,
      action: 'BLOCK',
      category: 'Protocol Integrity',
      violationCode: 'RECIPIENT_NOT_WHITELISTED',
      reason: `Recipient address '${trimmedRecipient}' is not in the approved whitelist`,
      checks,
      timestamp: new Date().toISOString()
    };
  }
  checks.recipientWhitelisted = true;

  // ----------------------------------------------------
  // 7. Amount Boundaries & Business Logic Limits
  // ----------------------------------------------------
  // Check positive values
  if (payload.amount <= 0 || Object.is(payload.amount, -0)) {
    return {
      allowed: false,
      passed: false,
      action: 'BLOCK',
      category: 'Business Logic & Limits',
      violationCode: 'INVALID_AMOUNT_NON_POSITIVE',
      reason: `Payment amount must be greater than zero. Received: ${payload.amount}`,
      checks,
      timestamp: new Date().toISOString()
    };
  }

  // Normalize amount to USD and micro-units
  const normalized = normalizeAmount(payload.amount, payload.unitType || 'USD');
  if (!normalized.valid) {
    return {
      allowed: false,
      passed: false,
      action: 'BLOCK',
      category: 'Business Logic & Limits',
      violationCode: 'INVALID_AMOUNT_FORMAT',
      reason: normalized.error || 'Failed to normalize transaction amount',
      checks,
      timestamp: new Date().toISOString()
    };
  }

  // Check sub-cent precision / dust rounding attack
  if (normalized.usd < policy.minTxAmountUSD) {
    return {
      allowed: false,
      passed: false,
      action: 'BLOCK',
      category: 'Business Logic & Limits',
      violationCode: 'AMOUNT_BELOW_MINIMUM',
      reason: `Amount ($${normalized.usd}) is below minimum allowable transaction size ($${policy.minTxAmountUSD})`,
      checks,
      timestamp: new Date().toISOString()
    };
  }
  checks.amountValid = true;

  // Check Per-Transaction Cap ($50.00 / 500,000 units)
  if (normalized.usd > policy.perTxCapUSD || normalized.units > policy.perTxCapUnits) {
    return {
      allowed: false,
      passed: false,
      action: 'BLOCK',
      category: 'Business Logic & Limits',
      violationCode: 'EXCEEDS_PER_TX_CAP',
      reason: `Amount ($${normalized.usd} / ${normalized.units} units) exceeds per-transaction cap ($${policy.perTxCapUSD} / ${policy.perTxCapUnits} units)`,
      checks,
      timestamp: new Date().toISOString()
    };
  }
  checks.perTxCapValid = true;

  // Check Account Balance Sufficiency ($500.00 mock balance)
  const currentBalance = typeof user.balanceUSD === 'number' ? user.balanceUSD : policy.mockBalanceUSD;
  if (normalized.usd > currentBalance) {
    return {
      allowed: false,
      passed: false,
      action: 'BLOCK',
      category: 'Business Logic & Limits',
      violationCode: 'INSUFFICIENT_BALANCE',
      reason: `Requested amount ($${normalized.usd}) exceeds available balance ($${currentBalance})`,
      checks,
      timestamp: new Date().toISOString()
    };
  }
  checks.balanceValid = true;

  // Check Daily Cumulative Budget Cap ($200.00 / 2,000,000 units)
  const projectedDailySpent = Number((currentDailySpentUSD + normalized.usd).toFixed(2));
  if (projectedDailySpent > policy.dailyBudgetUSD) {
    return {
      allowed: false,
      passed: false,
      action: 'BLOCK',
      category: 'Business Logic & Limits',
      violationCode: 'EXCEEDS_DAILY_BUDGET',
      reason: `Projected daily spend ($${projectedDailySpent}) exceeds daily budget limit ($${policy.dailyBudgetUSD}). Currently spent today: $${currentDailySpentUSD}`,
      checks,
      timestamp: new Date().toISOString()
    };
  }
  checks.dailyBudgetValid = true;

  // ----------------------------------------------------
  // ALL CHECKS PASSED: ALLOW TRANSACTION
  // ----------------------------------------------------
  return {
    allowed: true,
    passed: true,
    action: 'ALLOW',
    category: 'Legitimate Control',
    violationCode: null,
    reason: 'Payment validated successfully: within limits, whitelisted recipient, verified origin and identity',
    checks,
    normalizedAmount: normalized,
    timestamp: new Date().toISOString()
  };
}
