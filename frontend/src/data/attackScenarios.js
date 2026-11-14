export const OWASP_CATEGORIES = [
  { id: 'all', name: 'All Categories', description: 'Complete 16-test x402 security suite', count: 16 },
  { id: 'bola', name: 'BOLA / IDOR', description: 'Broken Object Level Authorization & Account Isolation', count: 3 },
  { id: 'business_logic', name: 'Business Logic & Limits', description: 'x402 Transaction Caps & Daily Budget Safeguards', count: 3 },
  { id: 'input_validation', name: 'Input Validation', description: 'Sanitization, SQLi, XSS & Parameter Type Safeguards', count: 3 },
  { id: 'origin_spoofing', name: 'Origin Spoofing', description: 'CORS, Phishing Paywalls & Origin Authentication', count: 3 },
  { id: 'protocol_integrity', name: 'Protocol Integrity', description: 'x402 Signatures, Replay Prevention & Whitelisting', count: 4 },
];

export const normalizeCategory = (cat) => {
  if (!cat) return '';
  const s = String(cat).toLowerCase().replace(/[\s\/\-_&]/g, '');
  if (s.includes('bola') || s.includes('idor')) return 'bola';
  if (s.includes('logic') || s.includes('limit')) return 'business_logic';
  if (s.includes('input') || s.includes('valid')) return 'input_validation';
  if (s.includes('origin') || s.includes('spoof') || s.includes('ssrf')) return 'origin_spoofing';
  if (s.includes('protocol') || s.includes('whitelist') || s.includes('replay') || s.includes('control')) return 'protocol_integrity';
  return s;
};

export const findScenario = (idOrIndex) => {
  if (typeof idOrIndex === 'number') {
    return ATTACK_SCENARIOS[idOrIndex];
  }
  if (!idOrIndex) return null;
  const target = String(idOrIndex).toLowerCase().replace(/[^a-z0-9]/g, '');
  return ATTACK_SCENARIOS.find(s => {
    const sId = s.id.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (sId === target) return true;
    if (s.aliasIds && s.aliasIds.some(a => a.toLowerCase().replace(/[^a-z0-9]/g, '') === target)) return true;
    return false;
  }) || null;
};

export const ATTACK_SCENARIOS = [
  // =========================================================================
  // Category 1: BOLA / IDOR (3 vectors)
  // =========================================================================
  {
    id: 'bola-01',
    aliasIds: ['BOLA-01', 'bola-01'],
    name: 'Unauthorized Account ID Tampering (IDOR)',
    category: 'bola',
    categoryName: 'BOLA / IDOR',
    type: 'attack',
    severity: 'CRITICAL',
    owaspCode: 'API1:2023 - Broken Object Level Authorization',
    description: "Agent attempts to debit payment from another user's account_id ('victim_acc_9921').",
    payload: {
      account_id: 'victim_acc_9921',
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 25.00,
      currency: 'USD',
      origin: 'https://app.payfence.io',
      x402_header: {
        protocol: 'x402',
        version: '1.0',
        client: 'ai-agent'
      }
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: "Account ID 'victim_acc_9921' does not match authenticated user account context."
  },
  {
    id: 'bola-02',
    aliasIds: ['BOLA-02', 'bola-02'],
    name: 'Cross-Tenant Wallet Drain Attempt',
    category: 'bola',
    categoryName: 'BOLA / IDOR',
    type: 'attack',
    severity: 'CRITICAL',
    owaspCode: 'API1:2023 - Broken Object Level Authorization',
    description: 'Unauthorized sourceAccount vault parameter referencing another tenant partition.',
    payload: {
      sourceAccount: 'vault_tenant_beta_009',
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 35.00,
      currency: 'USD',
      origin: 'https://app.payfence.io'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: "Source vault 'vault_tenant_beta_009' belongs to another tenant partition."
  },
  {
    id: 'bola-03',
    aliasIds: ['BOLA-03', 'bola-03'],
    name: 'Admin Role Privilege Escalation',
    category: 'bola',
    categoryName: 'BOLA / IDOR',
    type: 'attack',
    severity: 'HIGH',
    owaspCode: 'API5:2023 - Broken Function Level Authorization',
    description: 'Payload body injects role: "admin" and isAdmin: true to bypass policy limits.',
    payload: {
      role: 'admin',
      isAdmin: true,
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 40.00,
      currency: 'USD',
      origin: 'https://app.payfence.io'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: "Privilege escalation detected: role parameter 'admin' cannot be supplied in payment payload."
  },

  // =========================================================================
  // Category 2: Business Logic & Limits (3 vectors)
  // =========================================================================
  {
    id: 'logic-01',
    aliasIds: ['LOGIC-01', 'logic-01'],
    name: 'x402 Overpayment Attack ($750 > $50 Cap)',
    category: 'business_logic',
    categoryName: 'Business Logic & Limits',
    type: 'attack',
    severity: 'CRITICAL',
    owaspCode: 'API4:2023 - Unrestricted Resource Consumption',
    description: 'Malicious upstream paywall demands $750.00, far exceeding the hard $50.00 per-transaction cap.',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 750.00,
      currency: 'USD',
      origin: 'https://app.payfence.io',
      x402_header: {
        demand: 750.00
      }
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Amount $750.00 exceeds configured hard per-transaction cap ($50.00).'
  },
  {
    id: 'logic-02',
    aliasIds: ['LOGIC-02', 'logic-02'],
    name: 'Daily Budget Exhaustion Attack (> $200 Limit)',
    category: 'business_logic',
    categoryName: 'Business Logic & Limits',
    type: 'attack',
    severity: 'HIGH',
    owaspCode: 'API4:2023 - Unrestricted Resource Consumption',
    description: 'Cumulative spend reaches $185.00; requesting $45.00 exceeds the $200.00 daily safety budget.',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 45.00,
      currency: 'USD',
      origin: 'https://app.payfence.io'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Cumulative daily spend ($230.00) exceeds daily budget limit ($200.00). Current spent today: $185.00.'
  },
  {
    id: 'logic-03',
    aliasIds: ['LOGIC-03', 'logic-03'],
    name: 'Negative or Zero Amount Exploit',
    category: 'business_logic',
    categoryName: 'Business Logic & Limits',
    type: 'attack',
    severity: 'HIGH',
    owaspCode: 'API4:2023 - Business Logic Flaw',
    description: 'Payload sends negative amount (-50.00) attempting balance inversion and ledger corruption.',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: -50.00,
      currency: 'USD',
      origin: 'https://app.payfence.io'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Payment amount must be greater than zero. Received: -50.0'
  },

  // =========================================================================
  // Category 3: Input Validation (3 vectors)
  // =========================================================================
  {
    id: 'input-01',
    aliasIds: ['INPUT-01', 'input-01'],
    name: 'SQL Injection in x402 Payment Memo/Recipient',
    category: 'input_validation',
    categoryName: 'Input Validation',
    type: 'attack',
    severity: 'CRITICAL',
    owaspCode: 'API8:2023 - Security Misconfiguration / Injection',
    description: 'Payload contains SQL meta-characters and injection clauses in payment parameters.',
    payload: {
      recipient: "0x71C8451C3343344Fc4534664634234567890abcd' OR '1'='1 --",
      amount: 10.00,
      currency: 'USD',
      origin: 'https://app.payfence.io',
      memo: "' OR '1'='1 --"
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: "SQL injection signature detected in payment parameters (' OR '1'='1 --)."
  },
  {
    id: 'input-02',
    aliasIds: ['INPUT-02', 'input-02'],
    name: 'Cross-Site Scripting (XSS) in Payment Metadata',
    category: 'input_validation',
    categoryName: 'Input Validation',
    type: 'attack',
    severity: 'HIGH',
    owaspCode: 'API8:2023 - Input Sanitization',
    description: "Malicious agent submits `<script>alert('hack')</script>` inside transaction memo.",
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 15.00,
      currency: 'USD',
      origin: 'https://app.payfence.io',
      memo: "<script>alert('hack')</script>"
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: "Cross-site scripting (XSS) payload detected in payment metadata (<script> tags)."
  },
  {
    id: 'input-03',
    aliasIds: ['INPUT-03', 'input-03'],
    name: 'Parameter Type Confusion (String as Amount)',
    category: 'input_validation',
    categoryName: 'Input Validation',
    type: 'attack',
    severity: 'MEDIUM',
    owaspCode: 'API8:2023 - Lack of Input Validation',
    description: "Amount is provided as string '100_USD' instead of a numeric float to exploit weak type coercions.",
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: '100_USD',
      currency: 'USD',
      origin: 'https://app.payfence.io'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Amount parameter must be a numeric value, received string.'
  },

  // =========================================================================
  // Category 4: Origin Spoofing (3 vectors)
  // =========================================================================
  {
    id: 'origin-01',
    aliasIds: ['ORIGIN-01', 'origin-01'],
    name: 'Untrusted Phishing Paywall Origin',
    category: 'origin_spoofing',
    categoryName: 'Origin Spoofing',
    type: 'attack',
    severity: 'HIGH',
    owaspCode: 'API7:2023 - Server-Side Request Forgery / Origin Spoofing',
    description: "Payment invocation comes from unauthorized external origin 'https://evil-paywall-bot.xyz'.",
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 20.00,
      currency: 'USD',
      origin: 'https://evil-paywall-bot.xyz'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: "Caller origin 'https://evil-paywall-bot.xyz' is not authorized in security policy whitelist."
  },
  {
    id: 'origin-02',
    aliasIds: ['ORIGIN-02', 'origin-02'],
    name: 'Subdomain Spoofing Attack',
    category: 'origin_spoofing',
    categoryName: 'Origin Spoofing',
    type: 'attack',
    severity: 'HIGH',
    owaspCode: 'API7:2023 - Server-Side Request Forgery / Origin Spoofing',
    description: "Attacker creates 'https://app.payfence.io.attacker.com' attempting suffix origin confusion.",
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 25.00,
      currency: 'USD',
      origin: 'https://app.payfence.io.attacker.com'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: "Caller origin 'https://app.payfence.io.attacker.com' is not authorized in security policy whitelist."
  },
  {
    id: 'origin-03',
    aliasIds: ['ORIGIN-03', 'origin-03'],
    name: 'Missing or Null Origin Header',
    category: 'origin_spoofing',
    categoryName: 'Origin Spoofing',
    type: 'attack',
    severity: 'MEDIUM',
    owaspCode: 'API7:2023 - Missing Security Headers',
    description: "Request originates from an unverified or sandboxed 'null' origin.",
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 10.00,
      currency: 'USD',
      origin: 'null'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Sandboxed null origin is strictly prohibited from executing payments.'
  },

  // =========================================================================
  // Category 5: Protocol Integrity (3 attacks + 1 control)
  // =========================================================================
  {
    id: 'proto-01',
    aliasIds: ['PROTO-01', 'proto-01'],
    name: 'x402 Replay Attack (Expired Timestamp)',
    category: 'protocol_integrity',
    categoryName: 'Protocol Integrity',
    type: 'attack',
    severity: 'CRITICAL',
    owaspCode: 'API10:2023 - Unsafe Consumption of APIs',
    description: 'Replaying an expired x402 payment header with timestamp exceeding the 5-minute skew tolerance.',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 15.00,
      currency: 'USD',
      origin: 'https://app.payfence.io',
      timestamp: 1600000000000,
      x402_header: {
        nonce: 'nonce_expired_8812',
        timestamp: 1600000000000
      }
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Transaction timestamp exceeds maximum allowable time skew (>300s window). Possible x402 replay attack intercepted.'
  },
  {
    id: 'proto-02',
    aliasIds: ['PROTO-02', 'proto-02'],
    name: 'Tampered x402 Payment Signature',
    category: 'protocol_integrity',
    categoryName: 'Protocol Integrity',
    type: 'attack',
    severity: 'CRITICAL',
    owaspCode: 'API2:2023 - Broken Authentication',
    description: 'Attacker modifies in-flight payment amount but provides an invalid/tampered cryptographic signature.',
    payload: {
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 20.00,
      currency: 'USD',
      origin: 'https://app.payfence.io',
      signature: 'tampered_sig_deadbeef',
      x402_header: {
        signature: 'tampered_sig_deadbeef'
      }
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Cryptographic signature verification failed or x402 header was tampered.'
  },
  {
    id: 'proto-03',
    aliasIds: ['PROTO-03', 'proto-03'],
    name: 'Unwhitelisted Rogue Recipient Wallet',
    category: 'protocol_integrity',
    categoryName: 'Protocol Integrity',
    type: 'attack',
    severity: 'HIGH',
    owaspCode: 'API10:2023 - Unsafe Consumption of APIs',
    description: "Attempting payment to an unknown non-whitelisted wallet address '0xDeadBeef0000000000000000000000000000dEaD'.",
    payload: {
      recipient: '0xDeadBeef0000000000000000000000000000dEaD',
      amount: 30.00,
      currency: 'USD',
      origin: 'https://app.payfence.io'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: "Recipient address '0xDeadBeef0000000000000000000000000000dEaD' is not in the approved vendor whitelist."
  },
  {
    id: 'ctrl-01',
    aliasIds: ['control-01', 'ctrl-01', 'CTRL-01'],
    name: 'Legitimate x402 Agent Micropayment',
    category: 'protocol_integrity',
    categoryName: 'Protocol Integrity',
    type: 'legitimate',
    severity: 'LOW',
    owaspCode: 'API10:2023 - Control Benchmark',
    description: 'Standard legitimate autonomous payment under $50.00 to a whitelisted vendor with authentic origin.',
    payload: {
      account_id: 'usr_demo_01',
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 12.50,
      currency: 'USD',
      origin: 'https://app.payfence.io',
      userId: 'usr_demo_01',
      memo: 'x402 AI Agent inference token subscription batch #41',
      timestamp: Date.now(),
      x402_header: {
        protocol: 'x402',
        version: '1.0',
        payment_scheme: 'exact',
        client: 'autonomous-agent-v1',
        signature: 'sig_valid_x402_ed25519_verified_token_9942'
      }
    },
    expectedStatus: 200,
    expectedAction: 'APPROVED',
    policyRule: 'Payment validated successfully: within limits, whitelisted recipient, verified origin and x402 header.'
  }
];
