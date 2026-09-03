import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Briefcase,
  Layers,
  ClipboardList,
  MessageSquareQuote,
  BarChart3,
  Settings,
  LogOut,
  LayoutDashboard,
  ArrowLeft
} from 'lucide-react';
import { ROUTES } from '@/utils/constants';
import { useNotification } from '@/hooks';

export default function AdminSidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const notify = useNotification();

  const navigation = [
    { name: 'Dashboard', href: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard },
    { name: 'Users', href: `${ROUTES.ADMIN_DASHBOARD}#users`, icon: Users },
    { name: 'Job Roles', href: `${ROUTES.ADMIN_DASHBOARD}#job-roles`, icon: Briefcase },
    { name: 'Skills', href: `${ROUTES.ADMIN_DASHBOARD}#skills`, icon: Layers },
    { name: 'Assessments', href: `${ROUTES.ADMIN_DASHBOARD}#assessments`, icon: ClipboardList },
    { name: 'Interview Questions', href: `${ROUTES.ADMIN_DASHBOARD}#interview-questions`, icon: MessageSquareQuote },
    { name: 'Analytics', href: `${ROUTES.ADMIN_DASHBOARD}#analytics`, icon: BarChart3 },
    { name: 'Settings', href: `${ROUTES.ADMIN_DASHBOARD}#settings`, icon: Settings },
  ];

  const handleLogout = () => {
    notify.info('Admin logged out');
    navigate(ROUTES.ADMIN_LOGIN);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
            <NavLink to={ROUTES.ADMIN_DASHBOARD} className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-md">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white tracking-tight text-base">Ideal Skillset</span>
                <span className="block text-[10px] uppercase font-bold text-red-400 tracking-wider">Admin Portal</span>
              </div>
            </NavLink>
          </div>

          {/* Navigation */}
          <div className="px-3 py-4 space-y-1">
            <div className="px-3 pb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Management
            </div>
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive && item.href === ROUTES.ADMIN_DASHBOARD
                        ? 'bg-slate-800 text-white font-semibold border-l-4 border-red-500 pl-2'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 mr-3 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Admin Footer & Quick Nav */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3 mb-3 px-2">
            <div className="w-9 h-9 rounded-full bg-red-950 text-red-400 font-bold flex items-center justify-center text-xs border border-red-800">
              AD
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">System Administrator</p>
              <p className="text-[11px] text-slate-400 truncate">Superuser Access</p>
            </div>
          </div>

          <div className="space-y-1">
            <NavLink
              to={ROUTES.HOME}
              className="w-full flex items-center px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white rounded-md transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-2.5 text-slate-500" />
              Public Homepage
            </NavLink>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-950/40 rounded-md transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 mr-2.5 text-red-400" />
              Admin Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

