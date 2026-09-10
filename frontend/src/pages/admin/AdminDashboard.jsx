import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ScoreCard, Card, Button, LoadingSpinner, Badge } from '@/components';
import { ROUTES } from '@/utils/constants';
import { useNotification, useDocumentTitle } from '@/hooks';
import { adminService } from '@/services';
import {
  Users,
  FileText,
  Briefcase,
  ClipboardCheck,
  Sparkles,
  Activity,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function AdminDashboard() {
  useDocumentTitle('Admin Dashboard');
  const notify = useNotification();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    metrics: {
      total_users: 0,
      total_admins: 0,
      total_resumes: 0,
      total_jobs: 0,
      total_assessments: 0,
      total_readiness_analyses: 0,
      active_users: 0,
    },
    recent_users: [],
    recent_activity: [],
  });

  const loadDashboard = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await adminService.getDashboard();
      if (res && res.metrics) {
        setData(res);
        if (isManual) notify.success('Dashboard metrics refreshed');
      }
    } catch (err) {
      notify.error(err.message || 'Could not load admin dashboard statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner fullPage message="Loading platform analytics & records..." />;
  }

  const { metrics, recent_users, recent_activity } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Admin Overview</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
              Live MongoDB
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time platform metrics, candidate telemetry, and recent administrative audit records
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>

          <Link to={ROUTES.ADMIN_USERS}>
            <Button variant="primary" size="sm" className="bg-slate-900 dark:bg-red-600 hover:bg-slate-800 dark:hover:bg-red-700">
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Manage Users
            </Button>
          </Link>
        </div>
      </div>

      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <ScoreCard
          title="Total Candidates"
          value={metrics.total_users}
          subtitle={`${metrics.total_admins} Administrators`}
          icon={Users}
          badge={`${metrics.active_users} active`}
          badgeColor="brand"
        />

        <ScoreCard
          title="Resumes Uploaded"
          value={metrics.total_resumes}
          subtitle="Parsed candidate files"
          icon={FileText}
          badge="Verified"
          badgeColor="emerald"
        />

        <ScoreCard
          title="Job Requisitions"
          value={metrics.total_jobs}
          subtitle="Analyzed descriptions"
          icon={Briefcase}
          badge="Market JDs"
          badgeColor="brand"
        />

        <ScoreCard
          title="Assessments"
          value={metrics.total_assessments}
          subtitle="Simulations & Challenges"
          icon={ClipboardCheck}
          badge="Completed"
          badgeColor="emerald"
        />

        <ScoreCard
          title="Readiness Twins"
          value={metrics.total_readiness_analyses}
          subtitle="5D Competency models"
          icon={Sparkles}
          badge="Evaluations"
          badgeColor="primary"
        />
      </div>

      {/* Main Grid: Recent Users & Recent Administrative Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Candidates Table */}
        <div className="lg:col-span-8">
          <Card
            title="Recent Candidate Registrations"
            subtitle="Most recently created candidate accounts in MongoDB User_data"
            action={
              <Link
                to={ROUTES.ADMIN_USERS}
                className="inline-flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
              >
                <span>View All Users</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            }
            bodyClassName="p-0"
          >
            {recent_users.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                No candidate records found in the database.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-3">Candidate</th>
                      <th className="px-6 py-3">Target Career Role</th>
                      <th className="px-6 py-3">Account Role</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recent_users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold flex items-center justify-center text-xs border border-brand-200 dark:border-brand-800">
                              {u.name?.substring(0, 2).toUpperCase() || 'CA'}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">{u.name}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {u.target_role || 'Junior Data Analyst'}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge variant={u.role === 'admin' ? 'rose' : 'brand'}>
                            {u.role?.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <Link
                            to={ROUTES.ADMIN_USERS}
                            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
                          >
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Recent Audit & System Activity */}
        <div className="lg:col-span-4">
          <Card
            title="Audit Trail Stream"
            subtitle="Live administrative actions"
            action={
              <Link
                to={ROUTES.ADMIN_SETTINGS}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
              >
                All Logs
              </Link>
            }
          >
            {recent_activity.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                No administrative alerts recorded yet.
              </div>
            ) : (
              <div className="flow-root">
                <ul className="-mb-6">
                  {recent_activity.map((act, idx) => (
                    <li key={act.id || idx} className="relative pb-5">
                      {idx !== recent_activity.length - 1 && (
                        <span className="absolute top-4 left-3.5 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-800" aria-hidden="true" />
                      )}
                      <div className="relative flex space-x-3 items-start">
                        <div className="h-7 w-7 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center ring-4 ring-white dark:ring-slate-900">
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                            {act.action}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            By {act.admin_email || 'Administrator'} • {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* Quick Management Shortcuts */}
          <div className="mt-6 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-900 dark:to-slate-950 rounded-2xl p-5 text-white shadow-md border border-slate-800">
            <h3 className="text-sm font-bold flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span>Platform Deep Dives</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Jump directly to analytics reports and candidate records:
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <Link
                to={ROUTES.ADMIN_READINESS}
                className="bg-slate-800/80 hover:bg-slate-700/80 p-2.5 rounded-lg border border-slate-700 flex items-center space-x-2 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span className="truncate">Readiness 5D</span>
              </Link>
              <Link
                to={ROUTES.ADMIN_SKILLS}
                className="bg-slate-800/80 hover:bg-slate-700/80 p-2.5 rounded-lg border border-slate-700 flex items-center space-x-2 transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Skill Gaps</span>
              </Link>
              <Link
                to={ROUTES.ADMIN_RESUMES}
                className="bg-slate-800/80 hover:bg-slate-700/80 p-2.5 rounded-lg border border-slate-700 flex items-center space-x-2 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">Resumes</span>
              </Link>
              <Link
                to={ROUTES.ADMIN_SETTINGS}
                className="bg-slate-800/80 hover:bg-slate-700/80 p-2.5 rounded-lg border border-slate-700 flex items-center space-x-2 transition-colors"
              >
                <Activity className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">System Health</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
