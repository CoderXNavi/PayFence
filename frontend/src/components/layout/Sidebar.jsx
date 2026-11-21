import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Shield, 
  LayoutDashboard, 
  PlaySquare, 
  Flame, 
  ShieldCheck, 
  ScrollText,
  GraduationCap,
  Award,
  CheckCircle2
} from 'lucide-react';

const NAV_ITEMS = [
  {
    to: '/',
    label: 'System Overview',
    subtitle: 'Architecture, metrics & OWASP status',
    icon: LayoutDashboard,
  },
  {
    to: '/playground',
    label: 'Attack Testing Bench',
    subtitle: 'Interactive x402 6-layer pipeline',
    icon: PlaySquare,
  },
  {
    to: '/red-team',
    label: 'Red Team Security Audit',
    subtitle: '16-case penetration test suite',
    icon: Flame,
  },
  {
    to: '/blue-team',
    label: 'Blue Team Policy Guard',
    subtitle: 'Spending caps, CORS & whitelists',
    icon: ShieldCheck,
  },
  {
    to: '/audit-logs',
    label: 'Forensic Audit Logs',
    subtitle: 'Immutable inspection history',
    icon: ScrollText,
  },
];

export const Sidebar = () => {
  return (
    <aside className="w-72 border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0 select-none z-30 justify-between">
      {/* Top Half: Brand & Navigation */}
      <div className="flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="h-16 border-b border-slate-200 px-5 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-700 flex items-center justify-center shadow-sm text-white">
              <Shield className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-slate-900 leading-tight">
                PayFence
              </div>
              <div className="text-[11px] font-medium text-slate-500">
                AI Payment Security Gateway
              </div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-blue-100/70 text-blue-800 border border-blue-200">
            Python
          </span>
        </div>

        {/* Navigation Section */}
        <div className="p-4 space-y-1.5">
          <div className="px-3 py-1 text-[11px] font-bold tracking-wider uppercase text-slate-400">
            Cybersecurity Modules
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `group flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`w-5 h-5 mt-0.5 shrink-0 transition-transform ${
                          isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-700'
                        }`}
                      />
                      <div className="min-w-0">
                        <div
                          className={`text-xs font-semibold leading-snug ${
                            isActive ? 'text-white' : 'text-slate-800'
                          }`}
                        >
                          {item.label}
                        </div>
                        <div
                          className={`text-[11px] truncate mt-0.5 ${
                            isActive ? 'text-blue-100' : 'text-slate-500'
                          }`}
                        >
                          {item.subtitle}
                        </div>
                      </div>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Half: Student & University Attribution Card */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-800">
              <GraduationCap className="w-3.5 h-3.5 text-blue-700" />
              Student Project
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              B.Tech CSE
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex items-baseline justify-between">
              <span className="text-slate-500 text-[11px]">Developer:</span>
              <strong className="text-slate-900 font-semibold">Navdeep Kaur</strong>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-slate-500 text-[11px]">Roll No:</span>
              <span className="font-mono font-semibold text-slate-800 text-[11px]">240280105</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-slate-500 text-[11px]">Semester:</span>
              <span className="text-slate-700 font-medium">3rd Year / 5th Sem</span>
            </div>
            <div className="pt-1.5 border-t border-slate-100 text-[10px] leading-tight text-slate-500">
              <span className="font-semibold text-slate-700">GZSCET, MRSPTU Bathinda</span>
              <div className="text-blue-700 font-medium mt-0.5">Internshala Summer Training</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
