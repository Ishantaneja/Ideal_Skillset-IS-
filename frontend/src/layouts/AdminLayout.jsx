import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar, ThemeToggle } from '@/components';
import { useNotification, useAuth } from '@/hooks';
import { Menu, Bell, Shield } from 'lucide-react';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const notify = useNotification();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex transition-colors duration-200">
      {/* Admin Sidebar Navigation */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Admin Header */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-colors duration-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-red-600 dark:text-red-500" />
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">Admin Management Console</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 font-semibold px-2.5 py-1 rounded-full border border-red-200 dark:border-red-800">
              System Admin
            </span>

            {/* Dark/Light Mode Toggle */}
            <ThemeToggle size="sm" />

            <button
              onClick={() => notify.info('No pending system alerts')}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
            </button>

            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold flex items-center justify-center">
                {user?.initials || 'AD'}
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 hidden md:inline-block">
                {user?.name || 'Admin User'}
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
