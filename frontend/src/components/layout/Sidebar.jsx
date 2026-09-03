import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  FileText,
  Briefcase,
  Layers,
  Map,
  ClipboardCheck,
  MessageSquare,
  Sparkles,
  LogOut,
  Compass,
  Target,
} from 'lucide-react';
import { ROUTES } from '@/utils/constants';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/hooks';

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const notify = useNotification();

  const navigation = [
    { name: 'Dashboard', href: ROUTES.USER_DASHBOARD, icon: LayoutDashboard },
    { name: 'My Profile', href: ROUTES.PROFILE, icon: User },
    { name: 'Resume Analysis', href: ROUTES.RESUME, icon: FileText },
    { name: 'Job Analysis', href: ROUTES.JOB_ANALYSIS, icon: Briefcase },
    { name: 'ATS Matcher', href: ROUTES.ATS, icon: Target },
    { name: 'Skill Gaps', href: ROUTES.SKILL_GAP, icon: Layers },
    { name: 'Career Roadmap', href: ROUTES.ROADMAP, icon: Map },
    { name: 'Practical Assessment', href: ROUTES.ASSESSMENT, icon: ClipboardCheck },
    { name: 'Interview Simulator', href: ROUTES.INTERVIEW, icon: MessageSquare },
    { name: 'Readiness Twin', href: ROUTES.READINESS, icon: Sparkles },
  ];

  const handleLogout = () => {
    logout();
    notify.info('Logged out successfully');
    navigate(ROUTES.LOGIN);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <NavLink to={ROUTES.USER_DASHBOARD} className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-primary-600 flex items-center justify-center text-white shadow-sm">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 tracking-tight text-base">Ideal Skillset</span>
                <span className="block text-[10px] uppercase font-semibold text-brand-600 tracking-wider">Candidate Portal</span>
              </div>
            </NavLink>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-4 space-y-1">
            <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Navigation
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
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-semibold border-l-4 border-brand-600 pl-2'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <Link
            to={ROUTES.PROFILE}
            onClick={onClose}
            className="flex items-center space-x-3 mb-3 px-2 py-1.5 rounded-lg hover:bg-white transition-colors block"
          >
            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs border border-brand-200 shrink-0">
              {user?.initials || 'ID'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-900 truncate">{user?.fullName || user?.name || 'Candidate'}</p>
              <p className="text-[11px] text-slate-500 truncate">Target: {user?.targetRole || 'Junior Data Analyst'}</p>
            </div>
          </Link>

          <div className="space-y-1">
            <NavLink
              to={ROUTES.PROFILE}
              onClick={onClose}
              className="w-full flex items-center px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white hover:text-slate-900 rounded-md transition-colors"
            >
              <User className="w-3.5 h-3.5 mr-2.5 text-slate-400" />
              Edit Profile
            </NavLink>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 mr-2.5 text-red-500" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
