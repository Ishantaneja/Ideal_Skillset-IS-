import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar, ThemeToggle } from '@/components';
import { ROUTES } from '@/utils/constants';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/hooks';
import { readinessService } from '@/services';
import { Menu, Bell, Sparkles } from 'lucide-react';

export default function UserLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const notify = useNotification();
  const [readinessScore, setReadinessScore] = useState(user?.readinessScore || 74);

  useEffect(() => {
    async function loadLatestScore() {
      try {
        const reports = await readinessService.getReadinessReports();
        if (reports && reports.items && reports.items.length > 0) {
          setReadinessScore(Math.round(reports.items[0].overall_readiness_score));
        }
      } catch {
        // Fallback to user profile score
      }
    }
    loadLatestScore();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-colors duration-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Target Role:</span>
              <span className="bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 font-medium px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                {user?.targetRole || 'Junior Data Analyst'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Readiness Badge */}
            <Link
              to={ROUTES.READINESS}
              className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-brand-50 to-primary-50 dark:from-brand-950/60 dark:to-primary-950/60 hover:from-brand-100 hover:to-primary-100 dark:hover:from-brand-900/60 dark:hover:to-primary-900/60 text-brand-700 dark:text-brand-300 px-3 py-1.5 rounded-lg border border-brand-200 dark:border-brand-800 text-xs font-semibold transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Readiness: {readinessScore}%</span>
            </Link>

            {/* Dark/Light Mode Switcher */}
            <ThemeToggle size="sm" />

            {/* Notifications */}
            <button
              onClick={() => notify.info('No new notifications')}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-600 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
            </button>

            {/* User Avatar */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">
                {user?.initials || 'ID'}
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200 hidden md:inline-block">
                {user?.fullName || user?.name || 'Candidate'}
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
