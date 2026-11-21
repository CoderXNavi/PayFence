import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSecurity } from '../../context/SecurityContext';
import { useAuth } from '../../context/AuthContext';
import { Wallet, User, LogOut, CheckCircle2, Server, GraduationCap } from 'lucide-react';

export const Navbar = () => {
  const { walletBalance } = useSecurity();
  const { user, logout } = useAuth();
  const location = useLocation();

  const getBreadcrumb = (pathname) => {
    switch (pathname) {
      case '/':
        return { section: 'Cybersecurity Gateway', page: 'System Overview & Architecture' };
      case '/playground':
        return { section: 'Interactive Testing', page: 'Attack Simulation Bench' };
      case '/red-team':
        return { section: 'Offensive Simulation', page: 'Red Team Security Audit' };
      case '/blue-team':
        return { section: 'Defensive Policies', page: 'Blue Team Policy Guard' };
      case '/audit-logs':
        return { section: 'Telemetry & Evidence', page: 'Forensic Audit Logs' };
      default:
        return { section: 'Cybersecurity Gateway', page: 'System Overview' };
    }
  };

  const crumb = getBreadcrumb(location.pathname);

  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-sm px-6 flex items-center justify-between z-20 sticky top-0">
      {/* Left: Breadcrumbs + Academic affiliation tag */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">{crumb.section}</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-bold tracking-tight">{crumb.page}</span>
        </div>

        <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
          <GraduationCap className="w-3.5 h-3.5 text-blue-700" />
          <span>GZSCET MRSPTU Bathinda (B.Tech CSE)</span>
        </span>
      </div>

      {/* Right: Backend Server Status, Wallet Balance & Student Account */}
      <div className="flex items-center gap-3">
        {/* Backend Status Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          <Server className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-medium">Python Flask: <strong className="font-semibold text-emerald-900">Port 5000 Online</strong></span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Agent Wallet Balance */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
          <Wallet className="w-3.5 h-3.5 text-blue-700" />
          <span>
            Vault: <strong className="font-semibold font-mono text-slate-900">${walletBalance.toFixed(2)} USD</strong>
          </span>
        </div>

        {/* User Account / Sign Out */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs">
            <User className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-semibold text-slate-800 text-[11px]">
              {user?.name?.split(' ')[0] || 'Navdeep'}
            </span>
          </div>

          <button
            onClick={logout}
            title="Sign out of demo session"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
