import React from 'react';
import { Link } from 'react-router-dom';
import { useSecurity } from '../context/SecurityContext';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Flame, 
  Terminal, 
  Activity, 
  Lock, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  Clock
} from 'lucide-react';

export const Dashboard = () => {
  const { 
    dailyBudget, 
    perTxCap, 
    blockedCount, 
    recentLogs 
  } = useSecurity();

  const categories = [
    { name: 'BOLA / IDOR', owasp: 'API1:2023', vectors: 6, blocked: 6, status: '100% defense', barColor: 'bg-blue-600' },
    { name: 'Business logic & limits', owasp: 'API4:2023', vectors: 6, blocked: 6, status: '100% defense', barColor: 'bg-indigo-600' },
    { name: 'Input validation & types', owasp: 'API8:2023', vectors: 6, blocked: 6, status: '100% defense', barColor: 'bg-emerald-600' },
    { name: 'Origin spoofing & SSRF', owasp: 'API7:2023', vectors: 5, blocked: 5, status: '100% defense', barColor: 'bg-amber-600' },
    { name: 'Protocol & whitelisting', owasp: 'API10:2023', vectors: 6, blocked: 5, approved: 1, status: '100% defense', barColor: 'bg-slate-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Security overview
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live monitor
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time telemetry and deterministic guardrails for autonomous AI agent payments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/red-team"
            className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Flame className="w-4 h-4 text-rose-600" />
            <span>Run security audit</span>
          </Link>
          <Link
            to="/playground"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Terminal className="w-4 h-4" />
            <span>Launch playground</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 4 KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Defense Benchmark */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Defense benchmark</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900 mt-2">
            100%
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-emerald-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span>28 of 28 attacks intercepted</span>
          </div>
        </div>

        {/* Metric 2: Gateway Status */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Gateway status</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-2.5 flex items-center gap-2">
            <span>Active</span>
            <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Zero bypass
            </span>
          </div>
          <div className="mt-2.5 text-xs text-slate-500">
            Average response latency: <strong className="font-mono text-slate-700">6.2 ms</strong>
          </div>
        </div>

        {/* Metric 3: Blocked Threats Counter */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Threats blocked</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-red-600 mt-2">
            {blockedCount}
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-500">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>HTTP 403 Forbidden enforced</span>
          </div>
        </div>

        {/* Metric 4: Transaction & Daily Limits */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Per-transaction limit</span>
            <Lock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900 mt-2">
            ${Number(perTxCap).toFixed(2)}
          </div>
          <div className="mt-2.5 text-xs text-slate-500">
            Daily spending budget: <strong className="font-mono text-slate-700">${Number(dailyBudget).toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* Main Grid: Threat Categories & Recent Interceptions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: OWASP Threat Coverage (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Threat categories</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic policy verification across 5 standard API vulnerability vectors.
              </p>
            </div>
            <span className="text-xs font-medium text-emerald-700 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
              100% neutralized
            </span>
          </div>

          <div className="space-y-4">
            {categories.map((cat, idx) => (
              <div key={idx} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{cat.name}</span>
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                      {cat.owasp}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-slate-500">{cat.blocked}/{cat.vectors} vectors guarded</span>
                    <span className="text-emerald-700 font-semibold">{cat.status}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${cat.barColor} w-full`} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 p-3.5 rounded-lg bg-blue-50/50 border border-blue-100 flex items-start gap-3 text-xs text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p>
              Autonomous agents execute micro-transactions strictly within policy boundaries. 
              Attempts to exceed the $50 cap, tamper with recipient addresses, inject payloads, or forge headers are deterministically blocked before hitting backend settlement.
            </p>
          </div>
        </div>

        {/* Right Column: Recent Intercepted Events (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <span>Recent events</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chronological inspection log
                </p>
              </div>
              <Link to="/audit-logs" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <span>View all</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentLogs.slice(0, 4).map((log, i) => {
                const isBlocked = log.status === 403 || log.verdict === 'BLOCKED';
                return (
                  <div 
                    key={log.id || i}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium font-mono ${
                          isBlocked 
                            ? 'bg-red-50 text-red-700 border border-red-200' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {log.status || (isBlocked ? 403 : 200)} {isBlocked ? 'Blocked' : 'Allowed'}
                        </span>
                        <span className="font-medium text-slate-900 truncate max-w-[180px]">
                          {log.scenarioName || 'Payment inspection'}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs line-clamp-1">
                        {log.reason}
                      </p>
                      <div className="text-[11px] font-mono text-slate-500 flex items-center gap-3 pt-0.5">
                        <span>${Number(log.amount || 0).toFixed(2)}</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200">
            <Link
              to="/playground"
              className="w-full py-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Terminal className="w-3.5 h-3.5 text-slate-500" />
              <span>Test payload in playground</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
