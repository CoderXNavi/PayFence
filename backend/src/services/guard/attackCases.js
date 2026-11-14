/**
 * PayFence Standard Attack Cases & Legitimate Control Benchmark
 * 28 targeted attack cases across 5 OWASP API Security categories + 1 legitimate control.
 */

export const OWASP_CATEGORIES = {
  BOLA_IDOR: 'BOLA/IDOR',
  BUSINESS_LOGIC: 'Business Logic & Limits',
  INPUT_VALIDATION: 'Input Validation',
  ORIGIN_SPOOFING: 'Origin Spoofing',
  PROTOCOL_INTEGRITY: 'Protocol Integrity'
};

export const ATTACK_CASES = [
  // =========================================================================
  // CATEGORY 1: BOLA / IDOR (Broken Object Level Authorization) - 6 Cases
  // =========================================================================
  {
    id: 'BOLA-01',
    name: 'Victim Account Drain via Direct User ID Tampering',
    category: OWASP_CATEGORIES.BOLA_IDOR,
    description: 'Attacker injects victim user ID to debit unauthorized account',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'BOLA_UNAUTHORIZED_USER_ID',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 25.00,
      origin: 'https://app.payfence.io',
      userId: 'usr_victim_target_999'
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 }
    }
  },
  {
    id: 'BOLA-02',
    name: 'Unauthorized Source Account Substitution (Tenant Hopping)',
    category: OWASP_CATEGORIES.BOLA_IDOR,
    description: 'Attacker targets another tenant corporate finance account',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'BOLA_UNAUTHORIZED_SOURCE_ACCOUNT',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 25.00,
      origin: 'https://app.payfence.io',
      sourceAccount: 'acc_org_enterprise_vault'
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 }
    }
  },
  {
    id: 'BOLA-03',
    name: 'Horizontal Privilege Escalation via Forged Delegation',
    category: OWASP_CATEGORIES.BOLA_IDOR,
    description: 'Attacker supplies unauthorized third-party organization delegation header',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'BOLA_CROSS_TENANT_DELEGATION',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 25.00,
      origin: 'https://app.payfence.io',
      delegatedBy: 'org_victim_corp'
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 }
    }
  },
  {
    id: 'BOLA-04',
    name: 'Forced Browsing to Internal System Admin Payment Vault',
    category: OWASP_CATEGORIES.BOLA_IDOR,
    description: 'Direct access to internal system treasury reserve object',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'BOLA_RESTRICTED_OBJECT_ACCESS',
    payload: {
      recipient: 'vault_admin_reserve',
      amount: 25.00,
      origin: 'https://app.payfence.io'
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 }
    }
  },
  {
    id: 'BOLA-05',
    name: 'Security Policy Override via Tampered Policy ID',
    category: OWASP_CATEGORIES.BOLA_IDOR,
    description: 'Attacker specifies arbitrary administrative policy ID to bypass limits',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'BOLA_POLICY_OVERRIDE_FORBIDDEN',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 25.00,
      origin: 'https://app.payfence.io',
      policyId: 'unrestricted_admin_policy'
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 }
    }
  },
  {
    id: 'BOLA-06',
    name: 'Role Impersonation in Payment Execution Context',
    category: OWASP_CATEGORIES.BOLA_IDOR,
    description: 'Attacker asserts superadmin role privilege flag in payment body',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'BOLA_PRIVILEGE_ESCALATION',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 25.00,
      origin: 'https://app.payfence.io',
      role: 'superadmin',
      isAdmin: true
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 }
    }
  },

  // =========================================================================
  // CATEGORY 2: Business Logic & Limits - 6 Cases
  // =========================================================================
  {
    id: 'LOGIC-01',
    name: 'Single Transaction Cap Bypass Attempt ($150 > $50 cap)',
    category: OWASP_CATEGORIES.BUSINESS_LOGIC,
    description: 'Attacker requests $150.00 USD exceeding the $50.00 per-transaction cap',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'EXCEEDS_PER_TX_CAP',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 150.00,
      origin: 'https://app.payfence.io'
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 },
      currentDailySpentUSD: 0.00
    }
  },
  {
    id: 'LOGIC-02',
    name: 'Daily Cumulative Budget Exhaustion ($180 spent + $40 requested > $200 cap)',
    category: OWASP_CATEGORIES.BUSINESS_LOGIC,
    description: 'Transaction exceeds remaining daily budget allowance of $200.00',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'EXCEEDS_DAILY_BUDGET',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 40.00,
      origin: 'https://app.payfence.io'
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 },
      currentDailySpentUSD: 180.00
    }
  },
  {
    id: 'LOGIC-03',
    name: 'Negative Amount Balance Inversion Attack',
    category: OWASP_CATEGORIES.BUSINESS_LOGIC,
    description: 'Attacker submits negative value to siphon or credit funds backwards',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'INVALID_AMOUNT_NON_POSITIVE',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: -50.00,
      origin: 'https://app.payfence.io'
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 }
    }
  },
  {
    id: 'LOGIC-04',
    name: 'Zero-Amount State Corruption / DoS Probe',
    category: OWASP_CATEGORIES.BUSINESS_LOGIC,
    description: 'Zero amount transaction aiming to desync accounting or state machines',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'INVALID_AMOUNT_NON_POSITIVE',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 0,
      origin: 'https://app.payfence.io'
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 }
    }
  },
  {
    id: 'LOGIC-05',
    name: 'Account Overdraft / Insufficient Mock Balance',
    category: OWASP_CATEGORIES.BUSINESS_LOGIC,
    description: 'Requested transaction exceeds current wallet balance ($45 requested with $10 balance)',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'INSUFFICIENT_BALANCE',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 45.00,
      origin: 'https://app.payfence.io'
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 10.00 }
    }
  },
  {
    id: 'LOGIC-06',
    name: 'Sub-Cent Micro-Dust Rounding Exploitation',
    category: OWASP_CATEGORIES.BUSINESS_LOGIC,
    description: 'Sub-minimum dust amount intended to bypass rounding checks',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'AMOUNT_BELOW_MINIMUM',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 0.000001,
      origin: 'https://app.payfence.io'
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 }
    }
  },

  // =========================================================================
  // CATEGORY 3: Input Validation - 6 Cases
  // =========================================================================
  {
    id: 'INPUT-01',
    name: 'SQL Injection in Recipient Address Field',
    category: OWASP_CATEGORIES.INPUT_VALIDATION,
    description: 'Classic SQL injection payload appended to recipient address',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'SQL_INJECTION_DETECTED',
    payload: {
      recipient: "0x71C8451C3343344Fc4534664634234567890abcd' OR 1=1 --",
      amount: 25.00,
      origin: 'https://app.payfence.io'
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 }
    }
  },
  {
    id: 'INPUT-02',
    name: 'NoSQL Operator Injection in Recipient Identifier',
    category: OWASP_CATEGORIES.INPUT_VALIDATION,
    description: 'NoSQL query selector object injected into recipient parameter',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'NOSQL_INJECTION_DETECTED',
    payload: {
      recipient: { $ne: null },
      amount: 25.00,
      origin: 'https://app.payfence.io'
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 }
    }
  },
  {
    id: 'INPUT-03',
    name: 'Cross-Site Scripting (XSS) in Recipient Identifier',
    category: OWASP_CATEGORIES.INPUT_VALIDATION,
    description: 'HTML script execution tag injected into recipient parameter',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'XSS_INJECTION_DETECTED',
    payload: {
      recipient: "<script>alert('xss')</script>",
      amount: 25.00,
      origin: 'https://app.payfence.io'
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 }
    }
  },
  {
    id: 'INPUT-04',
    name: 'Prototype Pollution Injection Payload',
    category: OWASP_CATEGORIES.INPUT_VALIDATION,
    description: '__proto__ injection attempt to alter global object properties',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'PROTOTYPE_POLLUTION_DETECTED',
    payload: JSON.parse('{"__proto__":{"isAdmin":true,"bypassGuard":true},"recipient":"0x71C8451C3343344Fc4534664634234567890abcd","amount":25.00,"origin":"https://app.payfence.io"}'),
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 }
    }
  },
  {
    id: 'INPUT-05',
    name: 'Extreme Integer Overflow / Unsafe Float Boundary',
    category: OWASP_CATEGORIES.INPUT_VALIDATION,
    description: 'Amount exceeds JavaScript safe integer and numeric boundaries',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'INTEGER_OVERFLOW_DETECTED',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 9007199254740992, // Number.MAX_SAFE_INTEGER + 1
      origin: 'https://app.payfence.io'
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 }
    }
  },
  {
    id: 'INPUT-06',
    name: 'Null Byte Injection / Path Truncation in Address',
    category: OWASP_CATEGORIES.INPUT_VALIDATION,
    description: 'Null byte injection to truncate or confuse recipient string validation',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'NULL_BYTE_DETECTED',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd\0drainer_wallet',
      amount: 25.00,
      origin: 'https://app.payfence.io'
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 }
    }
  },

  // =========================================================================
  // CATEGORY 4: Origin Spoofing - 5 Cases
  // =========================================================================
  {
    id: 'ORIGIN-01',
    name: 'Rogue Untrusted Origin Domain',
    category: OWASP_CATEGORIES.ORIGIN_SPOOFING,
    description: 'Request dispatched from an unauthorized attacker web domain',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'UNAUTHORIZED_ORIGIN',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 25.00,
      origin: 'https://evil-hacker.com'
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 }
    }
  },
  {
    id: 'ORIGIN-02',
    name: 'Sandboxed Null Origin Header Bypass',
    category: OWASP_CATEGORIES.ORIGIN_SPOOFING,
    description: 'Sandboxed iframe or data: URI emitting null origin header',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'NULL_ORIGIN_FORBIDDEN',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 25.00,
      origin: 'null'
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 }
    }
  },
  {
    id: 'ORIGIN-03',
    name: 'Subdomain Confusion / Suffix Collision Attack',
    category: OWASP_CATEGORIES.ORIGIN_SPOOFING,
    description: 'Attacker crafts fake subdomain app.payfence.io.attacker-controlled.net',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'UNAUTHORIZED_ORIGIN',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 25.00,
      origin: 'https://app.payfence.io.attacker-controlled.net'
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 }
    }
  },
  {
    id: 'ORIGIN-04',
    name: 'Missing / Empty Origin Header in Strict Mode',
    category: OWASP_CATEGORIES.ORIGIN_SPOOFING,
    description: 'Direct unauthorized script call omitting origin header',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'MISSING_ORIGIN_HEADER',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 25.00,
      origin: ''
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 }
    }
  },
  {
    id: 'ORIGIN-05',
    name: 'Unauthorized Port / Localhost Scheme Spoof',
    category: OWASP_CATEGORIES.ORIGIN_SPOOFING,
    description: 'Localhost origin targeting an unauthorized listening port 9999',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'UNAUTHORIZED_ORIGIN',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 25.00,
      origin: 'http://localhost:9999'
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 }
    }
  },

  // =========================================================================
  // CATEGORY 5: Protocol Integrity - 5 Cases
  // =========================================================================
  {
    id: 'PROTO-01',
    name: 'Replay Attack with Stale Expired Timestamp',
    category: OWASP_CATEGORIES.PROTOCOL_INTEGRITY,
    description: 'Transaction submitted with 1-hour stale timestamp to replay previously signed message',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'REPLAY_ATTACK_EXPIRED_TIMESTAMP',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 25.00,
      origin: 'https://app.payfence.io',
      timestamp: Date.now() - 3600000 // 1 hour ago
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 }
    }
  },
  {
    id: 'PROTO-02',
    name: 'Parameter Type Confusion (Amount as String)',
    category: OWASP_CATEGORIES.PROTOCOL_INTEGRITY,
    description: 'Amount supplied as string value instead of scalar number',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'INVALID_PARAMETER_TYPE',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 'fifty_dollars',
      origin: 'https://app.payfence.io'
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 }
    }
  },
  {
    id: 'PROTO-03',
    name: 'Parameter Type Confusion (Amount as Array)',
    category: OWASP_CATEGORIES.PROTOCOL_INTEGRITY,
    description: 'Amount passed as array to provoke type conversion flaws',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'INVALID_PARAMETER_TYPE',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: [25.00],
      origin: 'https://app.payfence.io'
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 }
    }
  },
  {
    id: 'PROTO-04',
    name: 'Cryptographic Signature Tampering / Forgery',
    category: OWASP_CATEGORIES.PROTOCOL_INTEGRITY,
    description: 'Payment signed with an invalid or tampered cryptographic signature',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'INVALID_PAYMENT_SIGNATURE',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 25.00,
      origin: 'https://app.payfence.io',
      signature: 'tampered_sig_deadbeef'
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 }
    }
  },
  {
    id: 'PROTO-05',
    name: 'Non-Whitelisted Untrusted Recipient Account',
    category: OWASP_CATEGORIES.PROTOCOL_INTEGRITY,
    description: 'Validly formatted address targeting an unapproved drainer wallet',
    isAttack: true,
    expectedAction: 'BLOCK',
    expectedViolationCode: 'RECIPIENT_NOT_WHITELISTED',
    payload: {
      recipient: '0x9999999999999999999999999999999999999999',
      amount: 25.00,
      origin: 'https://app.payfence.io'
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 }
    }
  },

  // =========================================================================
  // CONTROL: Legitimate Autonomous Payment - 1 Case
  // =========================================================================
  {
    id: 'CTRL-01',
    name: 'Legitimate Whitelisted Autonomous Payment (Control)',
    category: 'Legitimate Control',
    description: 'Fully compliant autonomous agent payment within caps to whitelisted vendor',
    isAttack: false,
    expectedAction: 'ALLOW',
    expectedViolationCode: null,
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 25.00,
      origin: 'https://app.payfence.io',
      userId: 'usr_demo_01'
    },
    context: {
      user: { id: 'usr_demo_01', balanceUSD: 500.00 },
      currentDailySpentUSD: 20.00
    }
  }
];

export function getAttackCases() {
  return JSON.parse(JSON.stringify(ATTACK_CASES));
}

export function getCasesByCategory(category) {
  return ATTACK_CASES.filter((c) => c.category === category);
}
