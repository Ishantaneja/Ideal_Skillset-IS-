import React, { useEffect, useState } from 'react';
import { ScoreCard, Card, Button } from '@/components';
import adminService from '@/services/adminService';
import { useNotification, useDocumentTitle } from '@/hooks';
import { Users, FileText, ClipboardCheck, MessageSquare, Download, Filter, UserX } from 'lucide-react';

export default function AdminDashboard() {
  useDocumentTitle('Admin Dashboard');
  const notify = useNotification();

  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deactivatingUserId, setDeactivatingUserId] = useState(null);
  const [activatingUserId, setActivatingUserId] = useState(null);

  useEffect(() => {
    const loadAdminOverview = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await adminService.getOverview();

        setAdminData(data);
      } catch (err) {
        console.error('Failed to load admin overview:', err);
        setError(err.message || 'Failed to load admin dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadAdminOverview();
  }, []);

  const totalUsers = adminData?.metrics?.total_users ?? '0';
  const resumesAnalyzed = adminData?.metrics?.resumes_analyzed ?? '0';
  const assessmentsCompleted =
    adminData?.metrics?.assessments_completed ?? '0';
  const interviewsCompleted =
    adminData?.metrics?.interviews_completed ?? '0';

  const recentUsers = adminData?.recent_users ?? [];
  const recentActivity = adminData?.recent_activity ?? [];
  const handleDeactivate = async (user) => {
    if (!user?.id) {
      notify('Candidate ID not found.', 'error');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${user.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeactivatingUserId(user.id);

      await adminService.deactivateUser(user.id);

      const updatedData = await adminService.getOverview();
      setAdminData(updatedData);

      notify(`${user.name} has been deactivated successfully.`, 'success');
    } catch (err) {
      notify(
        err?.message || 'Failed to deactivate candidate.',
        'error'
      );
    } finally {
      setDeactivatingUserId(null);
    }
  };

  const handleActivate = async (user) => {
    if (!user?.id) {
      notify('Candidate ID not found.', 'error');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to activate ${user.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActivatingUserId(user.id);

      await adminService.activateUser(user.id);

      const updatedData = await adminService.getOverview();
      setAdminData(updatedData);

      notify(`${user.name} has been activated successfully.`, 'success');
    } catch (err) {
      notify(
        err?.message || 'Failed to activate candidate.',
        'error'
      );
    } finally {
      setActivatingUserId(null);
    }
  };
  const handleExport = () => {
    notify.success('System analytics exported to CSV');
  };

  const handleFilter = () => {
    notify.info('Filter options opened');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-slate-500">
          Loading admin dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-sm text-red-600 mb-2">
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Overview</h1>
          <p className="text-xs text-slate-500 mt-1">Platform analytics, active candidate records, and system logs</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" className="bg-white" onClick={handleFilter}>
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            Filter View
          </Button>
          <Button variant="primary" size="sm" className="bg-slate-900 hover:bg-slate-800" onClick={handleExport}>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export Data
          </Button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          title="Total Users"
          value={totalUsers}
          subtitle="+12% from last month"
          icon={Users}
          badge="+18 today"
          badgeColor="brand"
        />

        <ScoreCard
          title="Resumes Analyzed"
          value={resumesAnalyzed}
          subtitle="Avg ATS Score: 76.4%"
          icon={FileText}
          badge="High volume"
          badgeColor="emerald"
        />

        <ScoreCard
          title="Assessments Completed"
          value={assessmentsCompleted}
          subtitle="Avg Score: 81.2%"
          icon={ClipboardCheck}
          badge="+24 this week"
          badgeColor="emerald"
        />

        <ScoreCard
          title="Interviews Completed"
          value={interviewsCompleted}
          subtitle="Total duration: 320 hrs"
          icon={MessageSquare}
          badge="Active"
          badgeColor="brand"
        />
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Users Table */}
        <div className="lg:col-span-8">
          <Card
            title="Recent Candidates"
            subtitle="Recently registered students and candidates"
            action={
              <button
                onClick={() => notify.info('Full candidate roster viewer')}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                View All Users
              </button>
            }
            bodyClassName="p-0"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Candidate</th>
                    <th className="px-6 py-3">Target Role</th>
                    <th className="px-6 py-3">Registered</th>
                    <th className="px-6 py-3">Readiness</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentUsers.map((u, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-slate-900">{u.name}</p>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-700">{u.role}</td>
                      <td className="px-6 py-3.5 text-slate-500">{u.date}</td>
                      <td className="px-6 py-3.5">
                        <span className="font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                          {u.readiness}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            u.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : u.status === 'Pending Review'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>

                      <td className="px-6 py-3">
                        {u.status === 'Active' ? (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(u)}
                            disabled={deactivatingUserId === u.id}
                            className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deactivatingUserId === u.id ? 'Deactivating...' : 'Deactivate'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleActivate(u)}
                            disabled={activatingUserId === u.id}
                            className="text-green-600 hover:text-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {activatingUserId === u.id ? 'Activating...' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Recent Activity Stream */}
        <div className="lg:col-span-4">
          <Card
            title="System Activity"
            subtitle="Live feed of platform events"
            action={
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            }
          >
            <div className="space-y-4">
              {recentActivity.map((act, idx) => (
                <div key={idx} className="flex items-start space-x-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-brand-600 shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-900 leading-snug">{act.action}</p>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{act.user}</span>
                      <span>{act.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

