import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, LoadingSpinner } from '@/components';
import { useNotification, useDocumentTitle } from '@/hooks';
import { adminService } from '@/services';
import {
  ClipboardCheck,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Award,
  Terminal,
  Video,
  Code2
} from 'lucide-react';

export default function AdminAssessments() {
  useDocumentTitle('Candidate Assessment Records');
  const notify = useNotification();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');

  const loadAssessments = async (targetPage = page, isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await adminService.getAssessments({
        page: targetPage,
        limit: 10,
        search: search.trim() || undefined,
      });

      setAssessments(res.items || []);
      setTotalCount(res.total || 0);
      setTotalPages(res.pages || 1);
      setPage(res.page || 1);
      if (isManual) notify.success('Assessment records refreshed');
    } catch (err) {
      notify.error(err.message || 'Could not load assessments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAssessments(1);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadAssessments(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Assessment & Simulation Records</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track workplace simulations, technical problem sets, and AI mock interview scores
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          onClick={() => loadAssessments(page, true)}
          disabled={refreshing}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </Button>
      </div>

      {/* Search Bar */}
      <Card bodyClassName="p-4">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-10">
            <Input
              id="search-assessments"
              placeholder="Search by assessment title, candidate name, or email..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <Button type="submit" variant="primary" className="w-full justify-center bg-slate-900 dark:bg-red-600">
              <Search className="w-3.5 h-3.5 mr-1.5" />
              Search
            </Button>
          </div>
        </form>
      </Card>

      {/* Assessments Table */}
      <Card
        title={`Completed Candidate Assessments (${totalCount})`}
        subtitle="Practical tests and mock interview sessions"
        bodyClassName="p-0"
      >
        {loading ? (
          <div className="py-12">
            <LoadingSpinner message="Querying assessment records..." />
          </div>
        ) : assessments.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            <ClipboardCheck className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            No assessment records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Assessment Challenge</th>
                  <th className="px-6 py-3.5">Candidate User</th>
                  <th className="px-6 py-3.5">Challenge Type</th>
                  <th className="px-6 py-3.5">Target Role</th>
                  <th className="px-6 py-3.5">Candidate Score</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {assessments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                          <Terminal className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">{a.title}</p>
                          <p className="text-[10px] text-slate-400">Record: {a.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{a.user_name || 'Candidate'}</p>
                      <p className="text-[11px] text-slate-500">{a.user_email || 'candidate@ideal.edu'}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {a.assessment_type || 'Challenge'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-700 dark:text-slate-300">
                      {a.target_role || 'Junior Data Analyst'}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold ${a.score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {a.score.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant="emerald">
                        {a.status?.toUpperCase() || 'COMPLETED'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Page <span className="font-semibold text-slate-800 dark:text-slate-200">{page}</span> of{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{totalPages}</span>
            </span>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadAssessments(page - 1)}
                disabled={page <= 1}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadAssessments(page + 1)}
                disabled={page >= totalPages}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

