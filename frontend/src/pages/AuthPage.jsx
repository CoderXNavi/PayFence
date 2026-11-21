import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, Zap, CheckCircle2, ShieldAlert, GraduationCap, Building2 } from 'lucide-react';

export const AuthPage = () => {
  const { login, demoLogin, loading, error } = useAuth();
  const [email, setEmail] = useState('admin@college.edu');
  const [password, setPassword] = useState('admin123');
  const [authError, setAuthError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    try {
      await login(email, password);
    } catch (err) {
      setAuthError(err.message || 'Authentication failed');
    }
  };

  const handleQuickDemo = async () => {
    setAuthError(null);
    try {
      await demoLogin();
    } catch (err) {
      setAuthError(err.message || 'Demo login failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8 relative">
      <div className="w-full max-w-lg relative z-10 space-y-6">
        {/* Academic Header Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold">
            <GraduationCap className="w-4 h-4 text-blue-700" />
            <span>B.Tech CSE Summer Training Project (5th Sem)</span>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Giani Zail Singh Campus College of Engineering &amp; Technology (GZSCET)
            <div className="text-slate-400 text-[11px]">Maharaja Ranjit Singh Punjab Technical University (MRSPTU), Bathinda</div>
          </div>
        </div>

        {/* Brand Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
          <div className="text-center space-y-1.5 border-b border-slate-100 pb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-700 text-white shadow-sm mb-2">
              <Shield className="w-6 h-6 stroke-[2.4]" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              PayFence Security Gateway
            </h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Deterministic x402 payment header verification &amp; cyber defense perimeter for autonomous AI agent transactions.
            </p>
          </div>

          {/* Quick Demo Hero Button for Viva Examiners */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-blue-900">
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-blue-700 fill-blue-700" />
                Examiner One-Click Access
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-200/70 text-blue-800">
                Viva Ready
              </span>
            </div>

            <button
              onClick={handleQuickDemo}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Launch Demo Session (admin@college.edu)</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <p className="text-[11px] text-center text-slate-500">
              Auto-authenticates with student demo context: <strong>Navdeep Kaur (240280105)</strong>
            </p>
          </div>

          {/* Regular Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200" />
              <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Or Sign In Manually
              </span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            {(authError || error) && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{authError || error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">College Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
            >
              Sign In
            </button>
          </form>

          {/* Student Attribution Footer */}
          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500 space-y-1">
            <div className="font-semibold text-slate-800">
              Submitted By: Navdeep Kaur (Roll No: 240280105)
            </div>
            <div className="text-[11px] text-slate-400">
              Department of Computer Science &amp; Engineering | GZSCET MRSPTU Bathinda
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
