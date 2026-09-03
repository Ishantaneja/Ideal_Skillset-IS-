import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from '@/components';
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
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-800">Target Role:</span>
              <span className="bg-brand-50 text-brand-700 font-medium px-2 py-0.5 rounded-full border border-brand-200">
                {user?.targetRole || 'Junior Data Analyst'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to={ROUTES.READINESS}
              className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-brand-50 to-primary-50 hover:from-brand-100 hover:to-primary-100 text-brand-700 px-3 py-1.5 rounded-lg border border-brand-200 text-xs font-semibold transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Readiness: {readinessScore}%</span>
            </Link>

            <button
              onClick={() => notify.info('No new notifications')}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-600 rounded-full ring-2 ring-white"></span>
            </button>

            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">
                {user?.initials || 'ID'}
              </div>
              <span className="text-xs font-medium text-slate-700 hidden md:inline-block">
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
