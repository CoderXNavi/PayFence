/**
 * PayFence Default Policy Configuration
 * Sets standard limits, balance, whitelists, and conversion rules.
 */

export const UNITS_PER_USD = 10000; // 1 USD = 10,000 micro-units ($50.00 = 500,000 units)

export const DEFAULT_POLICY = {
  policyId: 'default',
  name: 'Standard Autonomous AI Guard Policy',
  version: '1.0.0',
  description: 'Deterministic policy guard enforcing zero-trust autonomous AI payment safety',
  
  // Balances and spending limits
  mockBalanceUSD: 500.00,
  mockBalanceUnits: 5000000,
  
  perTxCapUSD: 50.00,
  perTxCapUnits: 500000,
  
  dailyBudgetUSD: 200.00,
  dailyBudgetUnits: 2000000,
  
  minTxAmountUSD: 0.01,
  minTxAmountUnits: 100,
  
  // Whitelisted accounts and entities
  whitelistedRecipients: [
    '0x71C8451C3343344Fc4534664634234567890abcd',
    '0x250e76987d838a75310c3ab5fae533eb1f842ca8',
    'rec_vendor_official'
  ],
  
  // Allowed caller origins for origin verification
  allowedOrigins: [
    'https://app.payfence.io',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://trusted-partner.com'
  ],
  
  // Protocol integrity flags
  requireOriginHeader: true,
  preventReplay: true,
  maxTimestampSkewMs: 300000 // 5 minutes (300,000 ms)
};

/**
 * Normalizes an amount into both USD and unit representations.
 * Handles inputs given either directly as USD (e.g. 25.00) or as units (e.g. 250000).
 *
 * @param {number} amount - The amount to normalize
 * @param {'USD'|'units'} [unitType='USD'] - Optional explicit unit specifier
 * @returns {{ valid: boolean, usd: number, units: number, error?: string }}
 */
export function normalizeAmount(amount, unitType = 'USD') {
  if (typeof amount !== 'number' || Number.isNaN(amount) || !Number.isFinite(amount)) {
    return { valid: false, usd: 0, units: 0, error: 'Amount must be a finite number' };
  }

  // If designated as units or clearly in micro-unit scale (> 10000 and integer)
  if (unitType === 'units' || (amount >= 10000 && Number.isInteger(amount))) {
    const usd = Number((amount / UNITS_PER_USD).toFixed(4));
    return { valid: true, usd, units: amount };
  }

  const units = Math.round(amount * UNITS_PER_USD);
  const usd = Number(amount.toFixed(2));
  return { valid: true, usd, units };
}

/**
 * Returns a cloned instance of the default policy.
 */
export function getDefaultPolicy() {
  return JSON.parse(JSON.stringify(DEFAULT_POLICY));
}
