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
  CheckCircle2,
  RotateCcw,
  Info,
  Sliders,
  Wallet,
  GraduationCap
} from 'lucide-react';

export const BlueTeam = () => {
  const { policy, updatePolicies, perTxCap, dailyBudget } = useSecurity();
  const [txCapInput, setTxCapInput] = useState(perTxCap || 50.00);
  const [dailyBudgetInput, setDailyBudgetInput] = useState(dailyBudget || 200.00);
  
  const [whitelisted, setWhitelisted] = useState(policy?.whitelistedRecipients || [
    '0x71C8451C3343344Fc4534664634234567890abcd',
    '0x250e76987d838a75310c3ab5fae533eb1f842ca8',
    'rec_vendor_official'
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

  const handleResetDefaults = async () => {
    setTxCapInput(50.00);
    setDailyBudgetInput(200.00);
    const defaultRecipients = [
      '0x71C8451C3343344Fc4534664634234567890abcd',
      '0x250e76987d838a75310c3ab5fae533eb1f842ca8',
      'rec_vendor_official'
    ];
    const defaultOrigins = [
      'https://app.payfence.io',
      'http://localhost:5173',
      'http://localhost:3000',
      'https://trusted-partner.com'
    ];
    setWhitelisted(defaultRecipients);
    setOrigins(defaultOrigins);

    await updatePolicies({
      perTxCap: 50.00,
      dailyBudget: 200.00,
      whitelistedRecipients: defaultRecipients,
      allowedOrigins: defaultOrigins,
      walletBalance: 500.00
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Action Buttons */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Blue Team Security Policy & Rule Configuration
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Live Policy Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configure deterministic transaction ceilings, daily velocity budgets, and zero-trust whitelists enforced by <code>security_guard.py</code>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Reset all settings to recommended defaults ($50 cap, $200 budget)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Defaults</span>
            </button>

            <button
              onClick={handleSavePolicies}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving to store.json...' : 'Save Policy Changes'}</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {saveSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">
              Security policies updated successfully! Changes are immediately active in the Python inspection engine.
            </span>
          </div>
        )}
      </div>

      {/* Teacher Viva Helper Note */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-slate-700 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
        <div className="leading-relaxed">
          <strong className="text-blue-900 font-bold block">Viva Demonstration Tip:</strong>
          Move the <strong>"Single Transaction Cap"</strong> slider down to <strong>$20.00</strong>, click "Save Policy Changes", and then test an authorized $25.00 payment in the Playground. It will immediately be blocked with <code>PER_TX_CAP_EXCEEDED</code>, proving that the Python backend dynamically updates rules without service restarts.
        </div>
      </div>

      {/* Two Financial Limit Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Slider 1: Per-Transaction Hard Cap */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-700" />
                Rule 1: Per-Transaction Ceiling
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Single Transaction Hard Cap
              </h2>
            </div>
            <div className="text-2xl font-black font-mono text-blue-800 px-3 py-1 bg-blue-50 rounded-xl border border-blue-200">
              ${parseFloat(txCapInput).toFixed(2)}
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            The absolute maximum amount an AI agent is permitted to pay in a single x402 transaction. Directly mitigates the <strong>$750.00 Overpayment Attack</strong> (Layer 5).
          </p>

          <div className="pt-2">
            <input
              type="range"
              min="5"
              max="200"
              step="5"
              value={txCapInput}
              onChange={(e) => setTxCapInput(e.target.value)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1.5">
              <span>Min: $5.00</span>
              <span className="font-semibold text-slate-700">Recommended: $50.00</span>
              <span>Max: $200.00</span>
            </div>
          </div>
        </div>

        {/* Slider 2: Daily Velocity Budget */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-700" />
                Rule 2: Cumulative Daily Limit
              </span>
              <h2 className="text-base font-bold text-slate-900">
                24-Hour Velocity Budget
              </h2>
            </div>
            <div className="text-2xl font-black font-mono text-blue-800 px-3 py-1 bg-blue-50 rounded-xl border border-blue-200">
              ${parseFloat(dailyBudgetInput).toFixed(2)}
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Cumulative 24-hour spending ceiling. If multiple small transactions exceed this budget throughout the day, subsequent transactions are blocked (Layer 5).
          </p>

          <div className="pt-2">
            <input
              type="range"
              min="50"
              max="1000"
              step="25"
              value={dailyBudgetInput}
              onChange={(e) => setDailyBudgetInput(e.target.value)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1.5">
              <span>Min: $50.00</span>
              <span className="font-semibold text-slate-700">Recommended: $200.00</span>
              <span>Max: $1,000.00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Whitelists: Origins and Recipient Wallets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Whitelist 1: Allowed Merchant Origins */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Globe className="w-4 h-4 text-blue-700" />
                <span>Allowed Merchant Origins (CORS Whitelist)</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Rejects phishing domains (e.g. <code>evil-paywall-bot.xyz</code>) &amp; fake subdomains.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
              {origins.length} Allowed
            </span>
          </div>

          {/* Add Form */}
          <form onSubmit={handleAddOrigin} className="flex gap-2">
            <input
              type="text"
              value={newOrigin}
              onChange={(e) => setNewOrigin(e.target.value)}
              placeholder="e.g. https://api.vendor.com"
              className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          {/* List */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
            {origins.map((orig, i) => (
              <div
                key={i}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <code className="text-slate-800 font-mono text-[11px] truncate">{orig}</code>
                <button
                  onClick={() => handleRemoveOrigin(orig)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                  title="Remove origin"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Whitelist 2: Whitelisted Recipient Wallets */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Users className="w-4 h-4 text-blue-700" />
                <span>Authorized Recipient Wallets</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Rejects rogue recipient addresses (e.g. <code>0xDeadBeef...</code>) under Layer 4.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
              {whitelisted.length} Authorized
            </span>
          </div>

          {/* Add Form */}
          <form onSubmit={handleAddRecipient} className="flex gap-2">
            <input
              type="text"
              value={newRecipient}
              onChange={(e) => setNewRecipient(e.target.value)}
              placeholder="e.g. 0x71C8451C... or vendor_id"
              className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white font-mono"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          {/* List */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
            {whitelisted.map((addr, i) => (
              <div
                key={i}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <code className="text-slate-800 font-mono text-[11px] truncate">{addr}</code>
                <button
                  onClick={() => handleRemoveRecipient(addr)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                  title="Remove recipient"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
