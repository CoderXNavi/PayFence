/**
 * Comprehensive Diagnostic Regression Test Suite
 * Covers the 3 exact symptoms reported:
 * 1. Missing payload in /api/audit/run results
 * 2. ID/Index mismatch between backend cases and frontend scenarios
 * 3. Empty category filtering in RedTeam UI (0 of 29 cases)
 */

import { ATTACK_CASES } from '../backend/src/services/guard/attackCases.js';
import { ATTACK_SCENARIOS, OWASP_CATEGORIES, normalizeCategory } from '../frontend/src/data/attackScenarios.js';

let failed = false;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failed = true;
  } else {
    console.log(`✓ PASS: ${message}`);
  }
}

console.log('=== PAYFENCE DIAGNOSTIC TEST SUITE ===\n');

// 1. Backend Endpoint Payload Test
console.log('[Test 1] Verifying Backend /api/audit/run payload emission...');
try {
  const res = await fetch('http://localhost:5000/api/audit/run', { method: 'POST' });
  if (!res.ok) {
    assert(false, `Backend returned HTTP ${res.status}`);
  } else {
    const data = await res.json();
    const results = data.results || [];
    assert(results.length === 29, `Expected 29 results from backend, got ${results.length}`);
    
    const missingPayloads = results.filter(r => !r.payload || Object.keys(r.payload).length === 0);
    assert(missingPayloads.length === 0, `All 29 backend results must have non-empty payload (found ${missingPayloads.length} missing)`);
  }
} catch (e) {
  assert(false, `Could not connect to backend: ${e.message}`);
}

// 2. Scenario Alignment & Fallback Test
console.log('\n[Test 2] Verifying 1:1 ID and category alignment between backend and frontend...');
assert(ATTACK_CASES.length === ATTACK_SCENARIOS.length, `Counts match (${ATTACK_CASES.length} vs ${ATTACK_SCENARIOS.length})`);

for (let i = 0; i < ATTACK_CASES.length; i++) {
  const bCase = ATTACK_CASES[i];
  const bNormCat = normalizeCategory(bCase.category);
  
  // Test direct ID lookup as performed in api.js:
  // s.id.toLowerCase() === bCase.id.toLowerCase()
  const exactMatch = ATTACK_SCENARIOS.find(s => s.id.toLowerCase() === bCase.id.toLowerCase());
  assert(!!exactMatch, `Backend case '${bCase.id}' must have exact matching ID in frontend ATTACK_SCENARIOS`);
  
  if (exactMatch) {
    const sNormCat = normalizeCategory(exactMatch.category);
    assert(bNormCat === sNormCat, `Category must match for '${bCase.id}': backend '${bNormCat}' vs frontend '${sNormCat}'`);
    assert(!!exactMatch.payload && Object.keys(exactMatch.payload).length > 0, `Frontend scenario '${exactMatch.id}' has non-empty payload`);
  }
}

// 3. Category Normalization Consistency Test
console.log('\n[Test 3] Verifying category normalization for all tabs...');
for (const cat of OWASP_CATEGORIES) {
  if (cat.id === 'all') continue;
  const normalized = normalizeCategory(cat.name);
  assert(normalized === cat.id, `OWASP tab name '${cat.name}' normalizes to '${cat.id}' (got '${normalized}')`);
}

console.log('\n=======================================');
await new Promise(r => setTimeout(r, 100));
if (failed) {
  console.error('❌ SUITE FAILED - BUGS DETECTED');
  process.exit(1);
} else {
  console.log('✅ ALL DIAGNOSTIC ASSERTIONS PASSED');
  process.exit(0);
}
