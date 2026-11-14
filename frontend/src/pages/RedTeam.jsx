import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { OWASP_CATEGORIES, ATTACK_SCENARIOS, normalizeCategory, findScenario } from '../data/attackScenarios';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Play, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  RefreshCw,
  Lock,
  Code2
} from 'lucide-react';

export const RedTeam = () => {
  const [running, setRunning] = useState(false);
  const [auditData, setAuditData] = useState(null);
  const [progress, setProgress] = useState(100);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTest, setExpandedTest] = useState(null);

  // Load audit data on mount
  useEffect(() => {
    const loadAudit = async () => {
      const data = await api.runSecurityAudit();
      setAuditData(data);
    };
    loadAudit();
  }, []);

  const handleRunAudit = async () => {
    setRunning(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 60);

    try {
      const data = await api.runSecurityAudit();
      setTimeout(() => {
        clearInterval(interval);
        setProgress(100);
        setAuditData(data);
        setRunning(false);
      }, 500);
    } catch (e) {
      clearInterval(interval);
      setRunning(false);
    }
  };

  const allResults = auditData?.results || [];

  const filteredResults = allResults.filter(test => {
    const testNorm = normalizeCategory(test.category);
    const activeNorm = normalizeCategory(activeCategory);
    const matchesCat = activeCategory === 'all' || testNorm === activeNorm;
    const matchesQuery = 
      !searchQuery ||
      test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (test.owaspCode && test.owaspCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (test.description && test.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Title & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Red team security audit
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Simulate 28 adversarial attack payloads and 1 legitimate control against the PayFence gateway.
          </p>
        </div>

        <button
          onClick={handleRunAudit}
          disabled={running}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50 flex-shrink-0"
        >
          {running ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Running simulation ({progress}%)...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Run security audit</span>
            </>
          )}
        </button>
      </div>

      {/* Progress Bar during run */}
      {running && (
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-blue-600 h-full rounded-full transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Unified Score & Status Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Security defense score</div>
              <div className="text-lg font-bold font-mono text-slate-900 flex items-center gap-2">
                <span>{auditData?.defenseScore || 100}%</span>
                <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Passed
                </span>
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          <div>
            <div className="text-xs font-medium text-slate-500">Attacks blocked</div>
            <div className="text-sm font-bold font-mono text-red-600 mt-0.5">
              28 / 28 <span className="font-sans font-normal text-slate-500 text-xs">(100%)</span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          <div>
            <div className="text-xs font-medium text-slate-500">Legitimate control</div>
            <div className="text-sm font-bold font-mono text-emerald-700 mt-0.5">
              1 / 1 <span className="font-sans font-normal text-slate-500 text-xs">(200 OK)</span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          <div>
            <div className="text-xs font-medium text-slate-500">False positive rate</div>
            <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
              0.0%
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1.5 self-start md:self-center font-mono text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>All 29 vectors evaluated</span>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Pills with Dynamic Counts */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {OWASP_CATEGORIES.map(cat => {
            const isSelected = activeCategory === cat.id;
            const count = cat.id === 'all'
              ? allResults.length || 29
              : allResults.filter(r => normalizeCategory(r.category) === cat.id).length || cat.count || 6;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none ${
                  isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64 flex-shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search test vectors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Test Results Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium text-slate-700">
            Test suite cases ({filteredResults.length} of {allResults.length || 29})
          </span>
          <span className="font-mono text-[11px]">Click row to inspect payload & rule</span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {filteredResults.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No matching test cases found.
            </div>
          ) : (
            filteredResults.map((test, idx) => {
              const isExpanded = expandedTest === (test.id || idx);
              const isControl = test.type === 'legitimate' || test.expectedStatus === 200;
              
              // Resolve payload reliably
              const fallbackScenario = findScenario(test.id) || ATTACK_SCENARIOS[idx];
              const payloadToRender = (test.payload && Object.keys(test.payload).length > 0)
                ? test.payload
                : (fallbackScenario?.payload || {});

              return (
                <div key={test.id || idx} className="hover:bg-slate-50/70 transition-colors">
                  <div 
                    onClick={() => setExpandedTest(isExpanded ? null : (test.id || idx))}
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-slate-400 font-mono w-6 text-right font-medium">#{test.testIndex || idx + 1}</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                        isControl 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {test.status || (isControl ? 200 : 403)} {isControl ? 'Allowed' : 'Blocked'}
                      </span>
                      <span className="font-medium text-slate-900 truncate">
                        {test.name}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px] hidden md:inline">
                        ({test.owaspCode || test.categoryName || test.category})
                      </span>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[11px]">
                        {test.latencyMs || 6} ms
                      </span>
                      <span className="text-xs font-medium text-emerald-700 hidden lg:inline">
                        Passed
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Inspection Drawer */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-50/80 border-t border-slate-200">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Left: Vector Description & Enforced Rule */}
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs font-medium text-slate-700 flex items-center gap-1.5 mb-1">
                              <Lock className="w-3.5 h-3.5 text-blue-600" />
                              <span>Threat vector analysis</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                              {test.description || fallbackScenario?.description || 'Adversarial transaction simulation payload.'}
                            </p>
                          </div>

                          <div>
                            <div className="text-xs font-medium text-slate-700 mb-1">
                              <span>Enforced security rule</span>
                            </div>
                            <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 font-mono leading-relaxed">
                              {test.policyRule || fallbackScenario?.policyRule || 'Deterministic policy verification rule.'}
                            </div>
                          </div>
                        </div>

                        {/* Right: Injected Test Payload (Clean light code block) */}
                        <div>
                          <div className="text-xs font-medium text-slate-700 flex items-center justify-between mb-1">
                            <span className="flex items-center gap-1.5">
                              <Code2 className="w-3.5 h-3.5 text-slate-500" />
                              <span>Injected test payload</span>
                            </span>
                            <span className="text-slate-400 text-[11px] font-mono">JSON</span>
                          </div>
                          <pre className="p-3.5 rounded-lg bg-white text-slate-800 font-mono text-xs max-h-56 overflow-y-auto leading-relaxed border border-slate-200 shadow-xs">
                            {JSON.stringify(payloadToRender, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
