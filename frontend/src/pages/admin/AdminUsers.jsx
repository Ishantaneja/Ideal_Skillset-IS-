import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components';
import adminService from '@/services/adminService';
import { useDocumentTitle } from '@/hooks';
import {
  Search,
  User,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Eye,
  Brain,
  ClipboardCheck,
  Clock,
} from 'lucide-react';

const formatLastActivity = (user) => {
  if (user?.is_online) {
    return 'Online';
  }

  if (!user?.last_seen_at) {
    return 'No activity yet';
  }

  const lastSeenValue = user.last_seen_at;
  const lastSeen = new Date(
    typeof lastSeenValue === 'string' && !/[zZ]|[+-]\d{2}:\d{2}$/.test(lastSeenValue)
    ? `${lastSeenValue}Z`
    : lastSeenValue
  );

  if (Number.isNaN(lastSeen.getTime())) {
    return 'No activity yet';
  }
  const now = new Date();

  const diffMs = now - lastSeen;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) {
    return 'Just now';
  }

  if (diffMinutes < 60) {
    return `Last access: ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `Last access: ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  return `Last access: ${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
};

export default function AdminUsers() {
    const navigate = useNavigate();
  useDocumentTitle('Admin Users');

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [readinessFilter, setReadinessFilter] = useState('All Readiness');
  const [sortBy, setSortBy] = useState('Recently Registered');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await adminService.getUsers();

        const userList = Array.isArray(data?.items)
          ? data.items
          : [];

        setUsers(userList);
      } catch (err) {
        console.error('Failed to load users:', err);
        setError(err.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  /*
   * TEMPORARY FRONTEND DEMO METRICS
   * These will be replaced with real backend values later.
   */
  const getDemoMetrics = (user, index) => {
    const demoValues = [
      {
        ats: 78,
        readiness: 62,
        roadmap: 48,
        knowledge: 78,
        practical: 51,
        evidence: 43,
        communication: 69,
        professional: 67,
        skillGaps: ['MLOps', 'Docker', 'Cloud'],
        resume: true,
        assessment: true,
        interview: true,
      },
      {
        ats: 84,
        readiness: 76,
        roadmap: 72,
        knowledge: 82,
        practical: 74,
        evidence: 68,
        communication: 79,
        professional: 81,
        skillGaps: ['Advanced Power BI', 'Statistics'],
        resume: true,
        assessment: true,
        interview: true,
        lastActivity: '5 hours ago',
      },
      {
        ats: 71,
        readiness: 54,
        roadmap: 31,
        knowledge: 63,
        practical: 49,
        evidence: 38,
        communication: 66,
        professional: 59,
        skillGaps: ['System Design', 'Testing'],
        resume: true,
        assessment: false,
        interview: false,
        lastActivity: '1 day ago',
      },
    ];

    return demoValues[index % demoValues.length];
  };

  const enrichedUsers = useMemo(() => {
    return users.map((user, index) => ({
      ...user,
      demo: getDemoMetrics(user, index),
    }));
  }, [users]);

  const filteredUsers = useMemo(() => {
    const filtered = enrichedUsers.filter((user) => {
        if (user.role === 'admin') return false;
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        (user.name || '').toLowerCase().includes(searchText) ||
        (user.email || '').toLowerCase().includes(searchText) ||
        (user.target_role || '').toLowerCase().includes(searchText);

      const matchesRole =
        roleFilter === 'All Roles' ||
        (user.target_role || 'Not Set') === roleFilter;

      const matchesStatus =
        statusFilter === 'All Status' ||
        (user.status || 'Active') === statusFilter;

      const readiness = user.demo.readiness;

      const matchesReadiness =
        readinessFilter === 'All Readiness' ||
        (readinessFilter === '80%+' && readiness >= 80) ||
        (readinessFilter === '60–79%' && readiness >= 60 && readiness < 80) ||
        (readinessFilter === '40–59%' && readiness >= 40 && readiness < 60) ||
        (readinessFilter === 'Below 40%' && readiness < 40);

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus &&
        matchesReadiness
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'Highest Readiness') {
        return b.demo.readiness - a.demo.readiness;
      }

      if (sortBy === 'Lowest Readiness') {
        return a.demo.readiness - b.demo.readiness;
      }

      if (sortBy === 'Highest ATS') {
        return b.demo.ats - a.demo.ats;
      }

      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [
    enrichedUsers,
    search,
    roleFilter,
    statusFilter,
    readinessFilter,
    sortBy,
  ]);

  const roles = [
    'All Roles',
    ...new Set(
      users.map((user) => user.target_role || 'Not Set')
    ),
  ];

  const statuses = [
    'All Status',
    'Active',
    'Idle',
    'Inactive',
  ];

  const readinessOptions = [
    'All Readiness',
    '80%+',
    '60–79%',
    '40–59%',
    'Below 40%',
  ];

  const sortOptions = [
    'Recently Registered',
    'Highest Readiness',
    'Lowest Readiness',
    'Highest ATS',
  ];

  const formatDate = (date) => {
    if (!date) return 'Unknown';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return 'Unknown';
    }

    return parsed.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-slate-500">
          Loading users...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-600">
          {error}
        </p>

        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-sm font-medium text-red-700 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Users
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage registered candidates and monitor their career-readiness progress
        </p>
      </div>

      {/* SEARCH + FILTERS */}
      <Card>
        <div className="space-y-4">

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder="Search candidates by name, email or target role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

            <FilterSelect
              value={roleFilter}
              onChange={setRoleFilter}
              options={roles}
            />

            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={statuses}
            />

            <FilterSelect
              value={readinessFilter}
              onChange={setReadinessFilter}
              options={readinessOptions}
            />

            <FilterSelect
              value={sortBy}
              onChange={setSortBy}
              options={sortOptions}
            />

          </div>
        </div>
      </Card>

      {/* RESULT COUNT */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing{' '}
          <span className="font-semibold text-slate-700">
            {filteredUsers.length}
          </span>{' '}
          candidate{filteredUsers.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* USER CARDS */}
      <div className="space-y-4">

        {filteredUsers.length === 0 ? (
          <Card>
            <div className="py-12 text-center">
              <User className="mx-auto h-10 w-10 text-slate-300" />

              <p className="mt-3 font-medium text-slate-600">
                No users found
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Try changing your search or filters.
              </p>
            </div>
          </Card>
        ) : (
          filteredUsers.map((user, index) => {
            const demo = user.demo;

            const isActive =
              user.status !== 'Inactive';

            return (
              <Card key={user.id || user._id || user.email}>
                <div className="space-y-5">

                  {/* TOP USER SECTION */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    <div className="flex items-center gap-3">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                        <User className="h-5 w-5" />
                      </div>

                      <div>
                        <h2 className="font-semibold text-slate-900">
                          {user.name || 'Unknown User'}
                        </h2>

                        <p className="text-sm text-slate-500">
                          {user.email || 'No email'}
                        </p>
                      </div>

                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isActive
                            ? 'bg-emerald-500'
                            : 'bg-slate-400'
                        }`}
                      />

                      <span className="text-sm text-slate-600">
                        {user.status || 'Active'}
                      </span>
                    </div>

                  </div>

                  {/* METRIC BOXES */}
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-5">

                    <MetricBox
                      label="ATS"
                      value={`${demo.ats}%`}
                    />

                    <MetricBox
                      label="Readiness"
                      value={`${demo.readiness}%`}
                      highlight
                    />

                    <MetricBox
                      label="Resume"
                      value={demo.resume ? 'Uploaded' : 'Missing'}
                      icon={
                        demo.resume
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          : <XCircle className="h-4 w-4 text-slate-400" />
                      }
                    />

                    <MetricBox
                      label="Roadmap"
                      value={`${demo.roadmap}%`}
                    />

                    <MetricBox
                      label="Assessment"
                      value={demo.assessment ? 'Completed' : 'Pending'}
                      icon={
                        <ClipboardCheck
                          className={`h-4 w-4 ${
                            demo.assessment
                              ? 'text-emerald-500'
                              : 'text-slate-400'
                          }`}
                        />
                      }
                    />

                  </div>

                  {/* READINESS DIMENSIONS */}
                  <div className="border-t border-slate-100 pt-4">

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                      <ProgressMetric
                        label="Knowledge"
                        value={demo.knowledge}
                      />

                      <ProgressMetric
                        label="Practical"
                        value={demo.practical}
                      />

                      <ProgressMetric
                        label="Evidence"
                        value={demo.evidence}
                      />

                      <ProgressMetric
                        label="Communication"
                        value={demo.communication}
                      />

                    </div>

                  </div>

                  {/* ROLE + SKILLS */}
                  <div className="border-t border-slate-100 pt-4">

                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Target Role
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {user.target_role || 'Not set'}
                        </p>
                      </div>

                      <div className="md:max-w-[70%]">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Skill Gaps
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {demo.skillGaps.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
                            >
                              ⚠ {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>

                  {/* ACTIVITY + ACTIONS */}
                  <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 lg:flex-row lg:items-center lg:justify-between">

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span>
                          Last Activity: {formatLastActivity(user)}
                        </span>
                      </div>

                      <span className="hidden text-slate-300 sm:block">
                        •
                      </span>

                      <span>
                        Registered: {formatDate(user.created_at)}
                      </span>

                    </div>

                    <div className="flex flex-wrap items-center gap-2">

                      <button
                        onClick={() =>
                          navigate(`/admin/users/${user.id || user._id}`)
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <Eye className="h-4 w-4" />
                        View Profile
                      </button>

                      <button
                        onClick={() =>
                          navigate(`/admin/users/${user.id || user._id}/readiness`)
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                      >
                        <Brain className="h-4 w-4" />
                        View Readiness
                      </button>

                    </div>

                  </div>

                </div>
              </Card>
            );
          })
        )}

      </div>
    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* FILTER SELECT */
/* -------------------------------------------------------------------------- */

function FilterSelect({ value, onChange, options }) {
  return (
    <div className="relative">

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-9 text-sm text-slate-600 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* METRIC BOX */
/* -------------------------------------------------------------------------- */

function MetricBox({ label, value, icon, highlight = false }) {
  return (
    <div
      className={`rounded-lg p-3 ${
        highlight
          ? 'bg-red-50'
          : 'bg-slate-50'
      }`}
    >
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <div className="mt-1 flex items-center gap-1.5">

        {icon}

        <p
          className={`text-sm font-semibold ${
            highlight
              ? 'text-red-700'
              : 'text-slate-700'
          }`}
        >
          {value}
        </p>

      </div>
    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* PROGRESS METRIC */
/* -------------------------------------------------------------------------- */

function ProgressMetric({ label, value }) {
  return (
    <div>

      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm text-slate-600">
          {label}
        </span>

        <span className="text-sm font-semibold text-slate-700">
          {value}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-red-500 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>

    </div>
  );
}