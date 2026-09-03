import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '@/components';
import { useNotification } from '@/hooks';
import { Menu, Bell, Shield } from 'lucide-react';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const notify = useNotification();

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Admin Sidebar Navigation */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Admin Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-red-600" />
              <span className="text-sm font-bold text-slate-900 tracking-tight">Admin Management Console</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs bg-red-100 text-red-700 font-semibold px-2.5 py-1 rounded-full border border-red-200">
              System Admin
            </span>

            <button
              onClick={() => notify.info('No pending system alerts')}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white"></span>
            </button>

            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                AD
              </div>
              <span className="text-xs font-medium text-slate-700 hidden md:inline-block">Admin User</span>
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
