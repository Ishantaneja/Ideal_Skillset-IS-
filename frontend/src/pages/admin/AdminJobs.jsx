import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Badge, LoadingSpinner } from '@/components';
import { useNotification, useDocumentTitle } from '@/hooks';
import { adminService } from '@/services';
import {
  Briefcase,
  Search,
  Building2,
  MapPin,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Layers,
  Globe
} from 'lucide-react';

export default function AdminJobs() {
  useDocumentTitle('Analyzed Job Requisitions');
  const notify = useNotification();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState('all');

  const loadJobs = async (targetPage = page, isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await adminService.getJobs({
        page: targetPage,
        limit: 10,
        search: search.trim() || undefined,
        work_mode: workModeFilter !== 'all' ? workModeFilter : undefined,
      });

      setJobs(res.items || []);
      setTotalCount(res.total || 0);
      setTotalPages(res.pages || 1);
      setPage(res.page || 1);
      if (isManual) notify.success('Job requisition directory refreshed');
    } catch (err) {
      notify.error(err.message || 'Could not load job requisitions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadJobs(1);
  }, [workModeFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadJobs(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Analyzed Job Requisitions</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review industry job descriptions parsed for skill requirements, experience thresholds, and ATS scoring
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          onClick={() => loadJobs(page, true)}
          disabled={refreshing}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card bodyClassName="p-4">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-6">
            <Input
              id="search-jobs"
              placeholder="Search by job title, company, or location..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="sm:col-span-4">
            <Select
              id="workmode-filter"
              value={workModeFilter}
              onChange={(e) => setWorkModeFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Work Modes' },
                { value: 'remote', label: 'Remote Only' },
                { value: 'hybrid', label: 'Hybrid Only' },
                { value: 'on-site', label: 'On-site Only' },
              ]}
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

      {/* Jobs Table */}
      <Card
        title={`Analyzed Job Descriptions (${totalCount})`}
        subtitle="Market requisitions stored in MongoDB Jobs collection"
        bodyClassName="p-0"
      >
        {loading ? (
          <div className="py-12">
            <LoadingSpinner message="Querying job requisitions..." />
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            <Briefcase className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            No job requisitions found in the database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Position Title</th>
                  <th className="px-6 py-3.5">Company & Location</th>
                  <th className="px-6 py-3.5">Work Mode</th>
                  <th className="px-6 py-3.5">Required Skills</th>
                  <th className="px-6 py-3.5">Created By</th>
                  <th className="px-6 py-3.5">Analysis Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-200 dark:border-brand-800">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">{j.job_title}</p>
                          <p className="text-[10px] text-slate-400">ID: {j.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-slate-800 dark:text-slate-200 flex items-center space-x-1">
                        <Building2 className="w-3 h-3 text-slate-400 mr-1" />
                        <span>{j.company_name || 'Tech Requisition'}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 mr-1" />
                        <span>{j.location || 'United States'}</span>
                      </p>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {j.work_mode || 'Remote'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center space-x-1 text-slate-700 dark:text-slate-300 font-semibold">
                        <Layers className="w-3 h-3 text-brand-500 mr-1" />
                        {j.required_skills_count || 0} skills
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="text-slate-700 dark:text-slate-300 font-medium">{j.user_name || 'Candidate'}</p>
                      <p className="text-[11px] text-slate-400">{j.user_email || 'candidate@ideal.edu'}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant="emerald">
                        {j.analysis_status?.toUpperCase() || 'COMPLETED'}
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
                onClick={() => loadJobs(page - 1)}
                disabled={page <= 1}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadJobs(page + 1)}
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

