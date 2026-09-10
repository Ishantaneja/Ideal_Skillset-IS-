import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { RecruiterSidebar, ThemeToggle } from '@/components';
import { useNotification, useAuth } from '@/hooks';
import { Menu, Bell, Building2, Search, BookmarkCheck } from 'lucide-react';
import { ROUTES } from '@/utils/constants';

export default function RecruiterLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const notify = useNotification();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-200">
      {/* Recruiter Sidebar Navigation */}
      <RecruiterSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Recruiter Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Recruiter Header */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-colors duration-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight hidden sm:inline-block">
                Recruiter Talent Portal
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {user?.companyName && (
              <span className="text-xs bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 hidden md:inline-block">
                {user.companyName}
              </span>
            )}

            {/* Quick Links */}
            <Link
              to={ROUTES.RECRUITER_CANDIDATES}
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hidden sm:flex items-center space-x-1"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Candidates</span>
            </Link>

            {/* Dark/Light Mode Toggle */}
            <ThemeToggle size="sm" />

            <button
              onClick={() => notify.info('No new candidate notifications')}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
            </button>

            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                {user?.initials || 'RC'}
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 hidden md:inline-block">
                {user?.name || 'Recruiter'}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

