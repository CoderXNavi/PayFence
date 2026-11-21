import React, { useState } from 'react';
import { useSecurity } from '../context/SecurityContext';
import { 
  ShieldCheck, 
  DollarSign, 
  Calendar, 
  Globe, 
  Users, 
  Lock, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle2
} from 'lucide-react';

export const BlueTeam = () => {
  const { policy, updatePolicies, perTxCap, dailyBudget } = useSecurity();
  const [txCapInput, setTxCapInput] = useState(perTxCap || 50.00);
  const [dailyBudgetInput, setDailyBudgetInput] = useState(dailyBudget || 200.00);
  
  const [whitelisted, setWhitelisted] = useState(policy?.whitelistedRecipients || [
    '0x71C8451C3343344Fc4534664634234567890abcd',
    '0x250e76987d838a75310c3ab5fae533eb1f842ca8',
    'act_vendor_anthropic_api',
    'act_vendor_openai_api',
    'act_vendor_google_vertex'
  ]);
  
  const [origins, setOrigins] = useState(policy?.allowedOrigins || [
    'https://app.payfence.io',
    'http://localhost:5173',
    'http://localhost:3000',
    'https://trusted-partner.com'
  ]);

  const [newRecipient, setNewRecipient] = useState('');
  const [newOrigin, setNewOrigin] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAddRecipient = (e) => {
    e.preventDefault();
    if (!newRecipient.trim()) return;
    if (!whitelisted.includes(newRecipient.trim())) {
      setWhitelisted([...whitelisted, newRecipient.trim()]);
    }
    setNewRecipient('');
  };

  const handleRemoveRecipient = (addr) => {
    setWhitelisted(whitelisted.filter(a => a !== addr));
  };

  const handleAddOrigin = (e) => {
    e.preventDefault();
    if (!newOrigin.trim()) return;
    if (!origins.includes(newOrigin.trim())) {
      setOrigins([...origins, newOrigin.trim()]);
    }
    setNewOrigin('');
  };

  const handleRemoveOrigin = (orig) => {
    setOrigins(origins.filter(o => o !== orig));
  };

  const handleSavePolicies = async () => {
    setSaving(true);
    try {
      await updatePolicies({
        perTxCap: parseFloat(txCapInput) || 50.00,
        dailyBudget: parseFloat(dailyBudgetInput) || 200.00,
        whitelistedRecipients: whitelisted,
        allowedOrigins: origins,
        walletBalance: 500.00
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to update policies:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Save Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <span>Policy configuration</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Active defense perimeters and transaction policies enforced across all autonomous AI agent payment requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Policies updated and synchronized</span>
            </div>
          )}
          <button
            onClick={handleSavePolicies}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save policy rules'}</span>
          </button>
        </div>
      </div>

      {/* Visual Policy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Per-Transaction Cap */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Hard per-transaction cap</h3>
                <p className="text-xs text-slate-500">Maximum allowable single payment value</p>
              </div>
            </div>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Strict cap
            </span>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="txCapInput" className="text-xs font-medium text-slate-700">Cap limit (USD):</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">$</span>
                <input
                  id="txCapInput"
                  type="number"
                  min="1"
                  max="500"
                  step="1"
                  value={txCapInput}
                  onChange={(e) => setTxCapInput(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2.5 py-1 text-sm font-bold font-mono text-slate-900 bg-white border border-slate-300 rounded-md text-right focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <input
              type="range"
              min="5"
              max="200"
              step="5"
              value={txCapInput}
              onChange={(e) => setTxCapInput(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />

            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>$5.00 (Micro)</span>
              <span className="text-slate-600 font-medium">Default: $50.00</span>
              <span>$200.00 (Max)</span>
            </div>

            {/* Quick presets */}
            <div className="pt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-500 mr-1 font-medium">Presets:</span>
              {[10, 25, 50, 100].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setTxCapInput(val)}
                  className={`px-2.5 py-1 text-xs rounded-md border font-mono transition-colors ${
                    txCapInput === val
                      ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  ${val}.00
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Any autonomous agent payment exceeding this threshold (such as excessive amount payloads) will immediately trigger HTTP 403 Forbidden.
          </p>
        </div>

        {/* Card 2: Daily Cumulative Budget */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Daily spending budget</h3>
                <p className="text-xs text-slate-500">24-hour aggregate spending limit across agents</p>
              </div>
            </div>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Rolling 24h
            </span>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="dailyBudgetInput" className="text-xs font-medium text-slate-700">Daily budget (USD):</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">$</span>
                <input
                  id="dailyBudgetInput"
                  type="number"
                  min="10"
                  max="2000"
                  step="10"
                  value={dailyBudgetInput}
                  onChange={(e) => setDailyBudgetInput(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2.5 py-1 text-sm font-bold font-mono text-slate-900 bg-white border border-slate-300 rounded-md text-right focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <input
              type="range"
              min="50"
              max="1000"
              step="25"
              value={dailyBudgetInput}
              onChange={(e) => setDailyBudgetInput(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />

            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>$50.00</span>
              <span className="text-slate-600 font-medium">Default: $200.00</span>
              <span>$1,000.00</span>
            </div>

            {/* Quick presets */}
            <div className="pt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-500 mr-1 font-medium">Presets:</span>
              {[100, 200, 500, 1000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setDailyBudgetInput(val)}
                  className={`px-2.5 py-1 text-xs rounded-md border font-mono transition-colors ${
                    dailyBudgetInput === val
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  ${val}.00
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Prevents slow-drain exhaustion attacks. When cumulative daily spend exceeds this value, all further transactions are rejected.
          </p>
        </div>

        {/* Card 3: Whitelisted Recipient Accounts */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Whitelisted destination accounts</h3>
                <p className="text-xs text-slate-500">Pre-approved vendors and internal vaults</p>
              </div>
            </div>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {whitelisted.length} active
            </span>
          </div>

          {/* Add Recipient Form */}
          <form onSubmit={handleAddRecipient} className="flex gap-2">
            <input
              type="text"
              placeholder="0x... or act_vendor_id"
              value={newRecipient}
              onChange={(e) => setNewRecipient(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          {/* Recipient List */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {whitelisted.map((addr) => (
              <div key={addr} className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="text-slate-800 truncate">{addr}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveRecipient(addr)}
                  className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors ml-2"
                  title="Remove recipient"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Allowed Origins & Network Perimeter */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Allowed merchant origins</h3>
                <p className="text-xs text-slate-500">CORS and network perimeter validation</p>
              </div>
            </div>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {origins.length} domains
            </span>
          </div>

          {/* Add Origin Form */}
          <form onSubmit={handleAddOrigin} className="flex gap-2">
            <input
              type="text"
              placeholder="https://app.payfence.io"
              value={newOrigin}
              onChange={(e) => setNewOrigin(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          {/* Origins List */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {origins.map((orig) => (
              <div key={orig} className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span className="text-slate-800 truncate">{orig}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveOrigin(orig)}
                  className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors ml-2"
                  title="Remove origin"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auxiliary Policy Summary */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <Lock className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <span className="text-slate-600">
            Cryptographic Ed25519 / HMAC signatures required on all payment requests. Clock skew tolerance: <strong className="text-slate-800">300 seconds</strong>.
          </span>
        </div>
        <div className="font-mono text-xs text-slate-500">
          Sync status: <span className="text-emerald-700 font-semibold">Active deterministic mode</span>
        </div>
      </div>
    </div>
  );
};
