import React, { useState } from 'react';
import { ATTACK_SCENARIOS, OWASP_CATEGORIES } from '../data/attackScenarios';
import { api } from '../services/api';
import { useSecurity } from '../context/SecurityContext';
import { 
  Play, 
  RotateCcw, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Code2,
  HelpCircle,
  ArrowRight,
  Info,
  XCircle,
  FileCode,
  GraduationCap
} from 'lucide-react';

const DEFENSE_LAYERS = [
  { id: 1, name: 'Layer 1: Identity & BOLA Guard', desc: 'Validates tenant account_id against session token' },
  { id: 2, name: 'Layer 2: Protocol & Replay Guard', desc: 'Enforces 300-sec timestamp skew & signature presence' },
  { id: 3, name: 'Layer 3: Origin & Phishing Guard', desc: 'Matches HTTP Origin hostname against whitelisted domains' },
  { id: 4, name: 'Layer 4: Recipient Wallet Guard', desc: 'Verifies vendor address against approved recipient list' },
  { id: 5, name: 'Layer 5: Spending Limits Guard', desc: 'Enforces $50.00 single-tx cap & $200.00 daily budget' },
  { id: 6, name: 'Layer 6: Deep Sanitization Guard', desc: 'Precompiled regex scanning for SQLi and XSS scripts' },
];

export const Playground = () => {
  const { incrementStats, refreshLogs } = useSecurity();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedScenarioId, setSelectedScenarioId] = useState(ATTACK_SCENARIOS[0].id);
  const [payloadText, setPayloadText] = useState(
    JSON.stringify(ATTACK_SCENARIOS[0].payload, null, 2)
  );
  const [jsonError, setJsonError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gatewayResponse, setGatewayResponse] = useState(null);

  // Filter scenarios by category
  const filteredScenarios = selectedCategory === 'all'
    ? ATTACK_SCENARIOS
    : ATTACK_SCENARIOS.filter(s => s.category === selectedCategory);

  const currentScenario = ATTACK_SCENARIOS.find(s => s.id === selectedScenarioId) || ATTACK_SCENARIOS[0];

  const handleScenarioChange = (scenarioId) => {
    setSelectedScenarioId(scenarioId);
    const sc = ATTACK_SCENARIOS.find(s => s.id === scenarioId);
    if (sc) {
      setPayloadText(JSON.stringify(sc.payload, null, 2));
      setJsonError(null);
      setGatewayResponse(null);
    }
  };

  const handleCategoryFilter = (catId) => {
    setSelectedCategory(catId);
    const firstInCat = catId === 'all' 
      ? ATTACK_SCENARIOS[0] 
      : ATTACK_SCENARIOS.find(s => s.category === catId);
    if (firstInCat) {
      handleScenarioChange(firstInCat.id);
    }
  };

  const handleResetPayload = () => {
    setPayloadText(JSON.stringify(currentScenario.payload, null, 2));
    setJsonError(null);
    setGatewayResponse(null);
  };

  const handleSendTestPayload = async () => {
    let parsedPayload;
    try {
      parsedPayload = JSON.parse(payloadText);
      setJsonError(null);
    } catch (e) {
      setJsonError('Invalid JSON formatting: ' + e.message);
      return;
    }

    setLoading(true);
    try {
      const startTime = performance.now();
      const res = await api.inspectPayload(parsedPayload, currentScenario);
      const latency = Math.round(performance.now() - startTime) || res.latencyMs || 4;
      
      const fullResponse = {
        ...res,
        latencyMs: latency,
        timestamp: new Date().toISOString()
      };

      setGatewayResponse(fullResponse);
      incrementStats(fullResponse.verdict, parsedPayload.amount);
      await refreshLogs();
    } catch (err) {
      console.error('Inspection failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const isBlocked = gatewayResponse?.statusCode === 403 || gatewayResponse?.verdict === 'BLOCKED';
  const isApproved = gatewayResponse?.statusCode === 200 || gatewayResponse?.verdict === 'APPROVED';
  const stoppedLayer = gatewayResponse?.layer || (isApproved ? 6 : null);

  // Educational teacher explanations for each scenario
  const getTeacherExplanation = (scenario) => {
    if (scenario.id === 'ctrl-01') {
      return 'Control Baseline: Demonstrates zero false positives. A valid $12.50 micropayment to an authorized vendor with fresh x402 headers passes all 6 layers and returns HTTP 200 OK.';
    }
    if (scenario.id.includes('logic-01')) {
      return 'Business Logic Flaw: Malicious paywall demands $750.00. Layer 5 checks against our $50.00 hard cap and immediately blocks it before funds leave the wallet.';
    }
    if (scenario.id.includes('logic-02')) {
      return 'Cumulative Budget Exhaustion: Agent tries paying $45.00 when daily spend is already $180.00, exceeding the $200.00 24-hour limit. Layer 5 halts execution.';
    }
    if (scenario.id.includes('logic-03')) {
      return 'Negative Amount Exploit: Attacker submits -50.00 USD to corrupt ledger balances. Layer 5 requires positive amounts ($0.01 minimum) and blocks the request.';
    }
    if (scenario.id.includes('input-01')) {
      return "SQL Injection Attack: Attacker embedded \"' OR '1'='1 --\" in the memo field. Layer 6 precompiled regular expression detects the SQL sequence and drops the payload.";
    }
    if (scenario.id.includes('input-02')) {
      return 'Stored Cross-Site Scripting (XSS): Malicious script tag in metadata designed to steal auditor cookies. Layer 6 regex sanitization blocks it.';
    }
    if (scenario.id.includes('input-03')) {
      return 'Parameter Type Confusion: Amount passed as alphanumeric string ("100_USD_NAN"). Layer 5 validates numeric float type before casting, preventing server crash.';
    }
    if (scenario.id.includes('bola-01')) {
      return 'BOLA / IDOR Tampering: Payload specifies another user\'s account_id ("victim_acc_9921"). Layer 1 compares payload with authenticated session and blocks.';
    }
    if (scenario.id.includes('bola-02')) {
      return 'Cross-Tenant Vault Drain: Payload specifies unauthorized "sourceAccount" vault. Layer 1 strictly confines debits to the authenticated tenant vault.';
    }
    if (scenario.id.includes('bola-03')) {
      return 'Privilege Escalation: Attacker injects "role: admin" in payment body to bypass limits. Layer 1 enforces role-based access control and rejects the override.';
    }
    if (scenario.id.includes('origin-01') || scenario.id.includes('origin-02')) {
      return 'Origin Spoofing & Phishing: Request sent from untrusted domain or spoofed subdomain. Layer 3 extracts clean hostname via urlparse() and verifies whitelist.';
    }
    if (scenario.id.includes('origin-03')) {
      return 'Missing/Null Origin Header: Request strips origin to bypass CORS protections. Layer 3 requires an authenticated, non-null HTTP Origin header.';
    }
    if (scenario.id.includes('proto-01')) {
      return 'Cryptographic Replay Attack: Captured payment header reused 2 hours later. Layer 2 calculates timestamp skew; since skew > 300 seconds (5 min), it is rejected.';
    }
    if (scenario.id.includes('proto-02')) {
      return 'Tampered Payment Signature: Header contains forged or dummy signature ("invalid_sig_bypass"). Layer 2 validates signature integrity.';
    }
    if (scenario.id.includes('proto-03')) {
      return 'Rogue Recipient Wallet: Rogue wallet address ("0xDeadBeef..."). Layer 4 verifies recipient address against approved vendor whitelist.';
    }
    return scenario.description;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Interactive Attack Simulation Bench
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                Viva Testing Lab
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select an adversarial vector or normal payment, inspect the JSON payload, and see in real time which of the <strong>6 Python defensive layers</strong> intercepts the attack.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
            <GraduationCap className="w-4 h-4 text-blue-700" />
            <span>Demonstrate each attack live to your teacher</span>
          </div>
        </div>
      </div>

      {/* Control Panel: Categories & Scenario Selection */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1.5 shrink-0 uppercase tracking-wider text-[11px]">
            <Layers className="w-3.5 h-3.5 text-blue-700" />
            Filter Category:
          </span>
          {OWASP_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-blue-700 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-slate-100/80 text-slate-700 hover:bg-slate-200/80 border border-slate-200/60'
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>

        {/* Scenario Dropdown & Test Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          <div className="flex-1 min-w-0">
            <select
              value={selectedScenarioId}
              onChange={(e) => handleScenarioChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-semibold focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 transition-colors"
            >
              {filteredScenarios.map(sc => (
                <option key={sc.id} value={sc.id}>
                  [{sc.type === 'legitimate' ? 'NORMAL CONTROL - 200' : 'CYBER ATTACK - 403'}] {sc.name} ({sc.categoryName})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSendTestPayload}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{loading ? 'Evaluating Python Engine...' : 'Run Security Check'}</span>
            </button>
            <button
              onClick={handleResetPayload}
              title="Reset payload to default"
              className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Teacher Viva Explanation Box (Crucial for Student) */}
        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                currentScenario.type === 'legitimate' 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}>
                {currentScenario.type === 'legitimate' ? 'Authorized Control (200)' : 'Adversarial Attack (403)'}
              </span>
              <strong className="text-slate-900 font-bold">{currentScenario.name}</strong>
            </div>
            <span className="font-mono text-slate-600 text-[11px] hidden sm:inline">
              OWASP: {currentScenario.owaspCode.split(' - ')[0]}
            </span>
          </div>

          <div className="text-slate-700 leading-relaxed font-medium pt-1">
            <span className="font-bold text-blue-900">Teacher Explanation Point: </span>
            {getTeacherExplanation(currentScenario)}
          </div>
        </div>
      </div>

      {/* Visual 6-Layer Deterministic Pipeline Tracker */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              6-Layer Deterministic Inspection Engine Execution Trace
            </h3>
            <p className="text-xs text-slate-500">
              Visual pipeline showing which layer evaluated or blocked the transaction
            </p>
          </div>
          {gatewayResponse ? (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              isBlocked 
                ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}>
              {isBlocked ? `BLOCKED AT LAYER ${gatewayResponse.layer}` : 'ALL 6 LAYERS PASSED'}
            </span>
          ) : (
            <span className="text-xs text-slate-500">Ready for evaluation</span>
          )}
        </div>

        {/* 6 Step Cards in Pipeline Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          {DEFENSE_LAYERS.map((layer) => {
            let status = 'idle'; // idle, passed, failed, halted
            if (gatewayResponse) {
              if (isApproved) {
                status = 'passed';
              } else if (stoppedLayer) {
                if (layer.id < stoppedLayer) {
                  status = 'passed';
                } else if (layer.id === stoppedLayer) {
                  status = 'failed';
                } else {
                  status = 'halted';
                }
              }
            }

            return (
              <div
                key={layer.id}
                className={`p-3 rounded-xl border text-xs flex flex-col justify-between space-y-2 transition-all ${
                  status === 'failed'
                    ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-sm ring-1 ring-rose-300'
                    : status === 'passed'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : status === 'halted'
                    ? 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-60'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] truncate">
                    {layer.name.split(':')[0]}
                  </span>
                  {status === 'passed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  {status === 'failed' && <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                  {status === 'halted' && <span className="text-[10px] text-slate-400">Skipped</span>}
                  {status === 'idle' && <span className="text-[10px] text-slate-400">Layer {layer.id}</span>}
                </div>

                <div className="text-[11px] font-semibold leading-tight line-clamp-2">
                  {layer.name.split(': ')[1]}
                </div>

                <div className="pt-1 border-t border-slate-200/50 text-[10px] font-medium">
                  {status === 'failed' ? (
                    <span className="font-bold text-rose-700">VIOLATION CAUGHT</span>
                  ) : status === 'passed' ? (
                    <span className="font-bold text-emerald-700">Check Passed</span>
                  ) : status === 'halted' ? (
                    <span className="text-slate-400">Early exit triggered</span>
                  ) : (
                    <span className="text-slate-500">Awaiting test</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side-by-Side: Left = JSON Payload, Right = Gateway Verdict */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: JSON Test Payload Editor */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col min-h-[460px]">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Code2 className="w-4 h-4 text-blue-700" />
              <span>Inbound Transaction Payload (x402 JSON)</span>
            </div>
            <span className="text-[11px] font-medium text-slate-500">Live Editable</span>
          </div>

          <div className="p-4 flex-1 flex flex-col">
            <textarea
              value={payloadText}
              rows={14}
              onChange={(e) => {
                setPayloadText(e.target.value);
                try {
                  JSON.parse(e.target.value);
                  setJsonError(null);
                } catch (err) {
                  setJsonError(err.message);
                }
              }}
              spellCheck="false"
              className="w-full flex-1 min-h-[300px] p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 leading-relaxed transition-colors resize-y"
            />
            {jsonError && (
              <div className="mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
                {jsonError}
              </div>
            )}
            <div className="mt-3 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
              <span>Category: <strong className="text-slate-800">{currentScenario.categoryName}</strong></span>
              <span className="font-mono text-slate-600 text-[11px]">POST /api/gateway/inspect</span>
            </div>
          </div>
        </div>

        {/* Right: Gateway Verdict Panel */}
        <div className={`bg-white border rounded-2xl shadow-sm flex flex-col min-h-[460px] transition-colors ${
          gatewayResponse
            ? isBlocked
              ? 'border-rose-300'
              : 'border-emerald-300'
            : 'border-slate-200'
        }`}>
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              {gatewayResponse ? (
                isBlocked ? (
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                )
              ) : (
                <ShieldCheck className="w-4 h-4 text-slate-400" />
              )}
              <span>Inspection Verdict & Telemetry</span>
            </div>
            {gatewayResponse && (
              <span className="font-mono text-[11px] text-slate-500">
                Latency: {gatewayResponse.latencyMs}ms
              </span>
            )}
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            {gatewayResponse ? (
              <div className="space-y-4">
                {/* Big Verdict Header */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  isBlocked
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">
                      {isBlocked ? 'Attack Intercepted' : 'Transaction Approved'}
                    </div>
                    <div className="text-xl font-extrabold font-mono mt-0.5">
                      HTTP {gatewayResponse.statusCode} {gatewayResponse.verdict}
                    </div>
                  </div>
                  <div className={`text-2xl font-black ${isBlocked ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {isBlocked ? '🛡️ BLOCKED' : '✅ ALLOWED'}
                  </div>
                </div>

                {/* Reason & Rule */}
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Enforced Rule
                    </span>
                    <strong className="text-slate-900 text-sm block">
                      {gatewayResponse.rule || 'Complete Security Verification'}
                    </strong>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Engine Explanation
                    </span>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {gatewayResponse.reason}
                    </p>
                  </div>

                  {gatewayResponse.violationCode && (
                    <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 text-rose-900 flex items-center justify-between">
                      <span className="font-medium text-[11px]">Machine Violation Code:</span>
                      <code className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-rose-200">
                        {gatewayResponse.violationCode}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
                <FileCode className="w-10 h-10 text-slate-300" />
                <div className="text-sm font-semibold text-slate-700">No Evaluation Triggered Yet</div>
                <p className="text-xs max-w-xs text-slate-500">
                  Click the blue <strong>"Run Security Check"</strong> button above to transmit this payload to the Python Flask backend.
                </p>
              </div>
            )}

            {/* Bottom Tip for Viva */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-700 shrink-0" />
              <span>
                Demonstration: Select <strong>"Overpayment Attack ($750)"</strong> or <strong>"SQL Injection"</strong> above to show examiners instant mitigation.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
