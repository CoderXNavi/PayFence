import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, Zap, CheckCircle2, ShieldAlert } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Subtle light background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand & Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-600 text-white shadow-sm mb-4">
            <Shield className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            PayFence
          </h1>
          <p className="text-sm font-medium text-blue-700 mt-1">
            AI payment security gateway
          </p>
          <p className="text-xs text-slate-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
            Deterministic policy enforcement and autonomous API defense perimeter
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
          {/* Quick Demo Login Hero Button */}
          <div className="mb-6 pb-6 border-b border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-2.5">
              <span className="flex items-center gap-1.5 text-slate-800 font-semibold">
                <Zap className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
                Viva examiner one-click access
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Instant access
              </span>
            </div>
            <button
              onClick={handleQuickDemo}
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-2 shadow-sm transition-colors active:scale-[0.99] disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Quick Demo Login (admin@college.edu)</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
            <p className="text-xs text-center text-slate-500 mt-2.5">
              Preconfigured credentials:{' '}
              <span className="font-mono text-slate-700 font-medium">admin@college.edu</span> /{' '}
              <span className="font-mono text-slate-700 font-medium">admin123</span>
            </p>
          </div>

          {/* Regular Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {(authError || error) && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{authError || error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Operator email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@college.edu"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Security password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-sm border border-slate-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign in with credentials'}</span>
            </button>
          </form>

          {/* Academic Viva Verification Notice */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>OWASP API Security Top 10 testbed ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
