import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Building2,
  BookmarkCheck,
  LayoutDashboard,
  LogOut,
  Search,
  Sparkles,
  Briefcase,
  GitCompare,
  Award,
  Video,
  BarChart3,
  Settings,
  Compass,
  Bot,
  Sliders,
} from 'lucide-react';
import { ROUTES } from '@/utils/constants';
import { useNotification, useAuth } from '@/hooks';

export default function RecruiterSidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const notify = useNotification();
  const { user, logout } = useAuth();

  const navigationItems = [
    { name: 'Command Center', href: ROUTES.RECRUITER_DASHBOARD, icon: LayoutDashboard },
    { name: 'Job Requisitions', href: ROUTES.RECRUITER_JOBS, icon: Briefcase },
    { name: 'Talent Pool', href: ROUTES.RECRUITER_CANDIDATES, icon: Search },
    { name: 'AI Recruiter Agent', href: ROUTES.RECRUITER_AGENTS, icon: Bot },
    { name: 'Simulations Studio', href: ROUTES.RECRUITER_SIMULATIONS, icon: Sliders },
    { name: 'Compare Candidates', href: ROUTES.RECRUITER_COMPARE, icon: GitCompare },
    { name: 'AI Assessments', href: ROUTES.RECRUITER_ASSESSMENTS, icon: Award },
    { name: 'AI Interviews', href: ROUTES.RECRUITER_INTERVIEWS, icon: Video },
    { name: 'Shortlisted Talent', href: ROUTES.RECRUITER_SHORTLIST, icon: BookmarkCheck },
    { name: 'Hiring Analytics', href: ROUTES.RECRUITER_ANALYTICS, icon: BarChart3 },
    { name: 'Settings', href: ROUTES.RECRUITER_SETTINGS, icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    notify.info('Signed out of recruiter portal');
    navigate(ROUTES.RECRUITER_LOGIN);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header Brand */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/70">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-black text-white tracking-tight block">
                  Recruiter Copilot
                </span>
                <span className="text-[10px] font-semibold text-indigo-400 block tracking-wider uppercase">
                  {user?.companyName || 'Ideal Skillset'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            <div className="space-y-1">
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                AI Hiring Suite
              </div>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.href === ROUTES.RECRUITER_DASHBOARD}
                    onClick={() => onClose && onClose()}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>

            {/* AI Candidate Intelligence Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-800/50 text-slate-300 text-xs space-y-2">
              <div className="flex items-center space-x-2 text-indigo-300 font-bold text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Evidence Verification</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Candidate skills are verified with GitHub code and certificates according to the JD blueprint.
              </p>
            </div>
          </div>

          {/* Footer User Info & Actions */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
            <div className="flex items-center space-x-3 p-2 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {user?.initials || 'RC'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'Recruiter'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate(ROUTES.HOME)}
                className="flex items-center justify-center space-x-1 py-2 px-2.5 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800"
                title="Home"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center space-x-1 py-2 px-2.5 rounded-lg text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors border border-rose-900/40"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
