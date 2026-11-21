import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Shield, 
  LayoutDashboard, 
  PlaySquare, 
  Flame, 
  ShieldCheck, 
  ScrollText
} from 'lucide-react';

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Overview',
    icon: LayoutDashboard,
  },
  {
    to: '/playground',
    label: 'Playground',
    icon: PlaySquare,
  },
  {
    to: '/red-team',
    label: 'Red Team',
    icon: Flame,
  },
  {
    to: '/blue-team',
    label: 'Blue Team',
    icon: ShieldCheck,
  },
  {
    to: '/audit-logs',
    label: 'Audit Logs',
    icon: ScrollText,
  },
];

export const Sidebar = () => {
  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="h-[52px] border-b border-slate-200 px-5 flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <Shield className="w-4 h-4 text-white stroke-[2.5]" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900">
            PayFence
          </span>
        </div>

        {/* Navigation Section */}
        <div className="p-4 space-y-1">
          <div className="px-3 py-1.5 text-xs font-semibold text-slate-500">
            Security operations
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
                    `group flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
};
