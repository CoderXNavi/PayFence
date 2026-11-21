import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSecurity } from '../context/SecurityContext';
import { 
  ScrollText, 
  Search, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Eye, 
  X,
  FileCode2,
  ShieldAlert,
  ShieldCheck,
  Server,
  Layers,
  GraduationCap
} from 'lucide-react';

export const AuditLogs = () => {
  const { recentLogs, refreshLogs } = useSecurity();
  const [logs, setLogs] = useState(recentLogs || []);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLogs(recentLogs);
  }, [recentLogs]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const refreshed = await refreshLogs();
      setLogs(refreshed);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (window.confirm('Clear all local audit logs from inspection view?')) {
      await api.clearAuditLogs();
      setLogs([]);
    }
  };

  const filteredLogs = logs.filter(log => {
    const isBlocked = log.status === 403 || log.verdict === 'BLOCKED';
    const isApproved = log.status === 200 || log.verdict === 'APPROVED';

    if (filterStatus === 'BLOCKED' && !isBlocked) return false;
    if (filterStatus === 'APPROVED' && !isApproved) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchReason = (log.reason || '').toLowerCase().includes(q);
      const matchScenario = (log.scenarioName || '').toLowerCase().includes(q);
      const matchId = (log.id || '').toLowerCase().includes(q);
      const matchRecipient = (log.recipient || '').toLowerCase().includes(q);
      const matchIp = (log.clientIp || '').toLowerCase().includes(q);
      return matchReason || matchScenario || matchId || matchRecipient || matchIp;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Action Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Forensic Audit Logs & Telemetry
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                Tamper-Resistant Ledger
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Immutable chronological record of all inbound AI agent payment attempts, cryptographic verifications, and policy blocks stored in <code>store.json</code>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Telemetry</span>
            </button>
            <button
              onClick={handleClear}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Status Filter Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === 'ALL'
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
              }`}
            >
              All Records ({logs.length})
            </button>
            <button
              onClick={() => setFilterStatus('BLOCKED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filterStatus === 'BLOCKED'
                  ? 'bg-rose-700 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Blocked Attacks (403)</span>
            </button>
            <button
              onClick={() => setFilterStatus('APPROVED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filterStatus === 'APPROVED'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Approved (200)</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search recipient, reason or IP..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 transition-colors"
            />
          </div>
        </div>

        {/* Table of Records */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Status & Verdict</th>
                <th className="py-3 px-4">Scenario / Transaction</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Policy Rule / Block Reason</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, index) => {
                  const isBlocked = log.status === 403 || log.verdict === 'BLOCKED';
                  const isApproved = log.status === 200 || log.verdict === 'APPROVED';

                  return (
                    <tr key={log.id || index} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Recent'}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isBlocked
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {isBlocked ? (
                            <>
                              <ShieldAlert className="w-3 h-3 text-rose-600" />
                              <span>403 BLOCKED</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>200 APPROVED</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 line-clamp-1">{log.scenarioName || 'Agent Payment'}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{log.id}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        ${typeof log.amount === 'number' ? log.amount.toFixed(2) : log.amount || '0.00'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px] max-w-[140px] truncate" title={log.recipient}>
                        {log.recipient || 'N/A'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={log.reason}>
                        {log.reason || 'Standard policy check'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition-all"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ScrollText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm">No matching forensic inspection records found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deep Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  selectedLog.status === 403 || selectedLog.verdict === 'BLOCKED'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  <FileCode2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Inspection Telemetry Detail
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500">{selectedLog.id}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin text-xs">
              {/* Verdict Summary Card */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                selectedLog.status === 403 || selectedLog.verdict === 'BLOCKED'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider">
                    {selectedLog.verdict || (selectedLog.status === 403 ? 'BLOCKED' : 'APPROVED')}
                  </div>
                  <div className="text-base font-bold font-mono mt-0.5">
                    HTTP {selectedLog.status}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-xs">Amount: ${typeof selectedLog.amount === 'number' ? selectedLog.amount.toFixed(2) : selectedLog.amount}</div>
                  <div className="text-[11px] font-mono opacity-80">Latency: {selectedLog.latencyMs || 2}ms</div>
                </div>
              </div>

              {/* Rule & Reason */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800">Defensive Decision:</div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-semibold text-slate-900">{selectedLog.rule || 'Deterministic Rule Evaluation'}</div>
                  <div className="text-slate-600 leading-relaxed">{selectedLog.reason}</div>
                  {selectedLog.violationCode && (
                    <div className="mt-1 text-[11px] font-mono text-rose-700 font-bold">
                      Violation Code: {selectedLog.violationCode}
                    </div>
                  )}
                </div>
              </div>

              {/* Client Telemetry */}
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Target Recipient:</span>
                  <span className="font-mono text-slate-800 font-semibold truncate block mt-0.5">
                    {selectedLog.recipient || 'N/A'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Client Origin:</span>
                  <span className="font-mono text-slate-800 font-semibold truncate block mt-0.5">
                    {selectedLog.origin || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Raw JSON Payload */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-800">Raw Intercepted Payload (JSON):</div>
                <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 scrollbar-thin">
                  {JSON.stringify(selectedLog.payload || {}, null, 2)}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
