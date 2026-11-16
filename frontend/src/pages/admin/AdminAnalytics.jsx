
import React, { useEffect, useState } from 'react';
import {
  Users,
  FileText,
  BrainCircuit,
  ClipboardList,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { adminService } from '@/services';

const metricCards = [
  {
    key: 'total_candidates',
    title: 'Total Candidates',
    icon: Users,
    color: 'blue',
  },
  {
    key: 'total_resumes',
    title: 'Total Resumes',
    icon: FileText,
    color: 'purple',
  },
  {
    key: 'total_ats_analyses',
    title: 'ATS Analyses',
    icon: BrainCircuit,
    color: 'indigo',
  },
  {
    key: 'total_assessments',
    title: 'Total Assessments',
    icon: ClipboardList,
    color: 'orange',
  },
  {
    key: 'active_assessments',
    title: 'Active Assessments',
    icon: CheckCircle,
    color: 'green',
  },
  {
    key: 'total_attempts',
    title: 'Total Attempts',
    icon: Clock,
    color: 'cyan',
  },
  {
    key: 'completed_attempts',
    title: 'Completed Attempts',
    icon: Target,
    color: 'emerald',
  },
  {
    key: 'total_readiness_reports',
    title: 'Readiness Reports',
    icon: TrendingUp,
    color: 'pink',
  },
];

const colorStyles = {
  blue: 'bg-blue-50 text-blue-600',
  purple: 'bg-purple-50 text-purple-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  orange: 'bg-orange-50 text-orange-600',
  green: 'bg-green-50 text-green-600',
  cyan: 'bg-cyan-50 text-cyan-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  pink: 'bg-pink-50 text-pink-600',
};

function CandidateGrowthChart({ data = [] }) {
  const maxCandidates = Math.max(
    ...data.map((item) => item.candidates),
    1
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">
        Candidate Growth
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Monthly candidate registrations.
      </p>

      {data.length === 0 ? (
        <p className="mt-8 text-center text-sm text-slate-400">
          No registration data available yet.
        </p>
      ) : (
        <div className="mt-8 flex h-56 items-end gap-6 overflow-x-auto border-b border-slate-200 px-2">
          {data.map((item, index) => (
            <div
              key={`${item.month}-${index}`}
              className="flex min-w-16 flex-1 flex-col items-center justify-end"
            >
              <span className="mb-2 text-sm font-semibold text-slate-700">
                {item.candidates}
              </span>

              <div
                className="w-full max-w-16 rounded-t-lg bg-blue-500 transition-all hover:bg-blue-600"
                style={{
                  height: `${Math.max(
                    (item.candidates / maxCandidates) * 160,
                    8
                  )}px`,
                }}
              />

              <span className="mt-3 whitespace-nowrap text-xs text-slate-500">
                {item.month}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlatformActivityChart({ analytics }) {
  const activities = [
    { label: 'Resumes Uploaded', value: analytics.total_resumes ?? 0, color: '#A855F7' },
    { label: 'ATS Analyses', value: analytics.total_ats_analyses ?? 0, color: '#3B82F6' },
    { label: 'Assessment Attempts', value: analytics.total_attempts ?? 0, color: '#F97316' },
    { label: 'Readiness Reports', value: analytics.total_readiness_reports ?? 0, color: '#10B981' },
  ];

  const total = activities.reduce((sum, item) => sum + item.value, 0);

  let currentAngle = 0;

  const gradient = activities.map((item) => {
    const start = currentAngle;
    const angle = total > 0 ? (item.value / total) * 360 : 0;
    currentAngle += angle;

    return `${item.color} ${start}deg ${currentAngle}deg`;
  }).join(', ');

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">
        Platform Activity
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Distribution of platform activities.
      </p>

      <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row">
        <div
          className="h-48 w-48 shrink-0 rounded-full"
          style={{
            background: total > 0
              ? `conic-gradient(${gradient})`
              : '#E2E8F0',
          }}
        />

        <div className="w-full space-y-4">
          {activities.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-slate-600">
                  {item.label}
                </span>
              </div>

              <span className="text-sm font-bold text-slate-900">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await adminService.getAnalyticsOverview();
      setAnalytics(data);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Failed to load analytics.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Analytics Overview
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor platform performance and candidate activity.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <RefreshCw className="mx-auto h-7 w-7 animate-spin text-red-600" />
          <p className="mt-3 text-sm text-slate-500">
            Loading analytics from database...
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-700">
            Unable to load analytics
          </p>
          <p className="mt-1 text-sm text-red-600">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-3 text-sm font-semibold text-red-700 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Analytics Cards */}
      {!loading && !error && analytics && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {metricCards.map((metric) => {
              const Icon = metric.icon;

              return (
                <div
                  key={metric.key}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">
                      {metric.title}
                    </p>

                    <div className={`rounded-lg p-2.5 ${colorStyles[metric.color]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <p className="mt-4 text-3xl font-bold text-slate-900">
                    {analytics[metric.key] ?? 0}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <CandidateGrowthChart
              data={analytics.candidate_growth || []}
            />

            <PlatformActivityChart analytics={analytics} />
          </div>

          {/* Assessment Summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Assessment Activity
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Overview of candidate assessment participation.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <p className="text-sm text-slate-500">Total Attempts</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {analytics.total_attempts ?? 0}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Completed Attempts</p>
                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  {analytics.completed_attempts ?? 0}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Active Assessments</p>
                <p className="mt-2 text-2xl font-bold text-blue-600">
                  {analytics.active_assessments ?? 0}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
