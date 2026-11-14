import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSecurity } from '../../context/SecurityContext';
import { useAuth } from '../../context/AuthContext';
import { Wallet, User, LogOut } from 'lucide-react';

export const Navbar = () => {
  const { walletBalance } = useSecurity();
  const { user, logout } = useAuth();
  const location = useLocation();

  const getBreadcrumb = (pathname) => {
    switch (pathname) {
      case '/':
        return { section: 'Security Gateway', page: 'Overview' };
      case '/playground':
        return { section: 'Security Gateway', page: 'Playground' };
      case '/red-team':
        return { section: 'Security Gateway', page: 'Red Team' };
      case '/blue-team':
        return { section: 'Security Gateway', page: 'Blue Team' };
      case '/audit-logs':
        return { section: 'Security Gateway', page: 'Audit Logs' };
      default:
        return { section: 'Security Gateway', page: 'Overview' };
    }
  };

  const crumb = getBreadcrumb(location.pathname);

  return (
    <header className="h-[52px] border-b border-slate-200 bg-white/95 backdrop-blur-sm px-6 flex items-center justify-between z-20 sticky top-0">
      {/* Left: Clean breadcrumb / section title */}
      <div className="flex items-center gap-2 text-xs font-medium">
        <span className="text-slate-500">{crumb.section}</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-semibold">{crumb.page}</span>
      </div>

      {/* Right: Compact wallet pill & user profile / sign out */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <Wallet className="w-3.5 h-3.5 text-slate-500" />
          <span>
            Balance: <strong className="font-semibold font-mono text-slate-900">${walletBalance.toFixed(2)} USD</strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
          <div
            className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600"
            title={user?.email || 'demo@payfence.io'}
          >
            <User className="w-3.5 h-3.5" />
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
