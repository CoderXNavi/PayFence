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
  FileCode2
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
      return matchReason || matchScenario || matchId || matchRecipient;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ScrollText className="w-6 h-6 text-blue-600" />
            <span>Forensic audit logs</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable inspection log recording all inbound agent payment attempts, cryptographic verifications, and policy blocks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh telemetry</span>
          </button>
          <button
            onClick={handleClear}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear logs</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Filters */}
        <div className="flex items-center gap-2">
          {[
            { id: 'ALL', label: `All events (${logs.length})` },
            { id: 'BLOCKED', label: `403 Blocked (${logs.filter(l => l.status === 403 || l.verdict === 'BLOCKED').length})` },
            { id: 'APPROVED', label: `200 Allowed (${logs.filter(l => l.status === 200 || l.verdict === 'APPROVED').length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === tab.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search reason, ID, or recipient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
          />
        </div>
      </div>

      {/* Chronological Inspection Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-700">
              <tr>
                <th className="py-3 px-4 font-medium">Timestamp</th>
                <th className="py-3 px-4 font-medium">Status & verdict</th>
                <th className="py-3 px-4 font-medium">Amount</th>
                <th className="py-3 px-4 font-medium">Target / Recipient</th>
                <th className="py-3 px-4 font-medium">Policy evaluation reason</th>
                <th className="py-3 px-4 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const isBlocked = log.status === 403 || log.verdict === 'BLOCKED';
                  return (
                    <tr 
                      key={log.id} 
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-medium ${
                          isBlocked
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {isBlocked ? <AlertTriangle className="w-3 h-3 flex-shrink-0" /> : <CheckCircle2 className="w-3 h-3 flex-shrink-0" />}
                          <span>{log.status || (isBlocked ? 403 : 200)} {isBlocked ? 'Blocked' : 'Allowed'}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-slate-900">
                        ${Number(log.amount || 0).toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-mono text-[11px] max-w-[150px] truncate" title={log.recipient}>
                        {log.recipient || 'N/A'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={log.reason}>
                        {log.reason || 'Standard policy evaluation'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="px-2.5 py-1 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
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
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <ScrollText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm">No matching inspection records found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Detailed Log & Payload Inspection */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedLog.status === 403 || selectedLog.verdict === 'BLOCKED'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  <FileCode2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Log inspection • <span className="font-mono text-slate-600">{selectedLog.id}</span>
                  </h3>
                  <div className="text-xs text-slate-500">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Verdict Summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500">Enforcement action</div>
                  <div className={`text-base font-bold font-mono mt-0.5 ${
                    selectedLog.status === 403 || selectedLog.verdict === 'BLOCKED' ? 'text-red-700' : 'text-emerald-700'
                  }`}>
                    HTTP {selectedLog.status || 403} {selectedLog.verdict || (selectedLog.status === 403 ? 'BLOCKED' : 'APPROVED')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-slate-500">Amount evaluated</div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                    ${Number(selectedLog.amount || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Policy Evaluation Verdict & Reason */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Policy evaluation verdict and reason
                </label>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans">
                  {selectedLog.reason}
                </div>
              </div>

              {/* Captured Telemetry & Context */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Captured telemetry and context
                </label>
                <pre className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 overflow-x-auto leading-relaxed">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition-colors shadow-sm"
              >
                Close inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
