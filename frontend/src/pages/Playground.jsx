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
  HelpCircle
} from 'lucide-react';

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
      const latency = Math.round(performance.now() - startTime) || res.latencyMs || 8;
      
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Interactive playground
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Real-time x402 payment header verification and deterministic security guardrails for autonomous AI agents.
        </p>
      </div>

      {/* Unified Toolbar: Categories, Scenario Selection & Test Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-xs text-slate-500 mr-2 flex items-center gap-1.5 font-medium whitespace-nowrap">
            <Layers className="w-3.5 h-3.5" />
            Category:
          </span>
          {OWASP_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Toolbar: Scenario Dropdown & Test Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <select
              value={selectedScenarioId}
              onChange={(e) => handleScenarioChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {filteredScenarios.map(sc => (
                <option key={sc.id} value={sc.id}>
                  [{sc.type === 'legitimate' ? '200 Control' : '403 Attack'}] [{sc.owaspCode.split(' - ')[0]}] {sc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSendTestPayload}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{loading ? 'Evaluating...' : 'Test payload'}</span>
            </button>
            <button
              onClick={handleResetPayload}
              title="Reset payload to default"
              className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scenario Details Banner */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
              currentScenario.type === 'legitimate' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {currentScenario.type === 'legitimate' ? 'Authorized control' : 'Attack vector'}
            </span>
            <span className="font-medium text-slate-900">{currentScenario.name}</span>
            <span className="text-slate-500 font-mono text-[11px] hidden sm:inline">({currentScenario.owaspCode})</span>
          </div>
          <div className="text-slate-500 text-xs">
            Expected verdict: <strong className={currentScenario.expectedStatus === 200 ? 'text-emerald-700 font-mono' : 'text-red-700 font-mono'}>
              {currentScenario.expectedStatus} {currentScenario.expectedAction}
            </strong>
          </div>
        </div>
      </div>

      {/* Side-by-Side Display: Left = JSON Payload, Right = Gateway Verdict Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: JSON Test Payload Editor */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col min-h-[460px]">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between rounded-t-xl">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <Code2 className="w-4 h-4 text-blue-600" />
              <span>Inbound transaction payload (JSON)</span>
            </div>
            <span className="text-xs text-slate-500">Editable test payload</span>
          </div>

          <div className="p-4 flex-1 flex flex-col min-h-0">
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
              className="w-full flex-1 min-h-[300px] p-3.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed transition-colors resize-y"
            />
            {jsonError && (
              <div className="mt-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
                {jsonError}
              </div>
            )}
            <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
              <span>Category: <strong className="text-slate-700">{currentScenario.categoryName}</strong></span>
              <span className="font-mono text-slate-500 text-[11px]">POST /api/gateway/inspect</span>
            </div>
          </div>
        </div>

        {/* Right: Gateway Verdict Panel */}
        <div className={`bg-white border rounded-xl shadow-sm flex flex-col min-h-[460px] transition-colors ${
          gatewayResponse
            ? isBlocked
              ? 'border-red-200'
              : 'border-emerald-200'
            : 'border-slate-200'
        }`}>
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between rounded-t-xl">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              {gatewayResponse ? (
                isBlocked ? (
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                )
              ) : (
                <ShieldCheck className="w-4 h-4 text-slate-400" />
              )}
              <span>Gateway verdict panel</span>
            </div>
            {gatewayResponse && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{gatewayResponse.latencyMs} ms</span>
              </div>
            )}
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between">
            {gatewayResponse ? (
              <div className="space-y-4">
                {/* HTTP Status Banner */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  isBlocked
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isBlocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {isBlocked ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-lg font-bold font-mono flex items-center gap-2">
                        <span>HTTP {gatewayResponse.statusCode || (isBlocked ? 403 : 200)}</span>
                        <span>{isBlocked ? 'Forbidden' : 'OK'}</span>
                      </div>
                      <div className="text-xs mt-0.5 font-medium opacity-80">
                        Verdict: {gatewayResponse.verdict} • Enforced by PayFence Guard
                      </div>
                    </div>
                  </div>
                </div>

                {/* Policy Rule Code & Plain English Explanation */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
                    <span>Policy rule explanation</span>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                      {gatewayResponse.ruleCode || currentScenario.id}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed font-sans">
                    {gatewayResponse.reason || currentScenario.policyRule}
                  </p>
                </div>

                {/* Attack Vector & OWASP Context */}
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-medium text-slate-800">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>OWASP API vulnerability category</span>
                  </div>
                  <p className="leading-relaxed">
                    <strong>{currentScenario.owaspCode}:</strong> {currentScenario.description}
                  </p>
                </div>

                {/* Raw Gateway Response Preview */}
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-slate-500">
                    Raw gateway response
                  </div>
                  <pre className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-mono text-xs overflow-x-auto leading-normal">
                    {JSON.stringify({
                      status: gatewayResponse.statusCode || (isBlocked ? 403 : 200),
                      verdict: gatewayResponse.verdict,
                      policyRule: gatewayResponse.ruleCode || currentScenario.id,
                      reason: gatewayResponse.reason || currentScenario.policyRule,
                      latencyMs: gatewayResponse.latencyMs
                    }, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 min-h-[320px]">
                <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-3 text-slate-400">
                  <Play className="w-5 h-5 ml-0.5 text-slate-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 mb-1">
                  Awaiting test execution
                </h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Select an attack vector from the dropdown above and click &quot;Test payload&quot; to observe the gateway&apos;s deterministic interception.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
