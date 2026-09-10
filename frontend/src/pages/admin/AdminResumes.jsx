import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Badge, LoadingSpinner } from '@/components';
import { useNotification, useDocumentTitle } from '@/hooks';
import { adminService } from '@/services';
import {
  FileText,
  Search,
  Filter,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  Layers,
  User
} from 'lucide-react';

export default function AdminResumes() {
  useDocumentTitle('Candidate Resumes');
  const notify = useNotification();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadResumes = async (targetPage = page, isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await adminService.getResumes({
        page: targetPage,
        limit: 10,
        search: search.trim() || undefined,
        parsing_status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      setResumes(res.items || []);
      setTotalCount(res.total || 0);
      setTotalPages(res.pages || 1);
      setPage(res.page || 1);
      if (isManual) notify.success('Resume inventory refreshed');
    } catch (err) {
      notify.error(err.message || 'Could not load resumes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadResumes(1);
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadResumes(1);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Candidate Resume Inventory</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse uploaded resume documents, verify parsing statuses, and inspect candidate skill metadata
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          onClick={() => loadResumes(page, true)}
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
              id="search-resumes"
              placeholder="Search by resume filename, extension..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="sm:col-span-4">
            <Select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Parsing Statuses' },
                { value: 'completed', label: 'Completed Only' },
                { value: 'pending', label: 'Pending Only' },
                { value: 'failed', label: 'Failed Only' },
              ]}
            />
          </div>

          <div className="sm:col-span-2">
            <Button type="submit" variant="primary" className="w-full justify-center bg-slate-900 dark:bg-red-600">
              <Search className="w-3.5 h-3.5 mr-1.5" />
              Filter
            </Button>
          </div>
        </form>
      </Card>

      {/* Resumes Table */}
      <Card
        title={`Uploaded Resumes (${totalCount})`}
        subtitle="Candidate resume files stored in MongoDB Resumes collection"
        bodyClassName="p-0"
      >
        {loading ? (
          <div className="py-12">
            <LoadingSpinner message="Querying resume repository..." />
          </div>
        ) : resumes.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            No resume records found in the database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Filename</th>
                  <th className="px-6 py-3.5">Candidate User</th>
                  <th className="px-6 py-3.5">Format & Size</th>
                  <th className="px-6 py-3.5">Skills Extracted</th>
                  <th className="px-6 py-3.5">Parsing Status</th>
                  <th className="px-6 py-3.5">Upload Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {resumes.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">{r.original_filename}</p>
                          <p className="text-[10px] text-slate-400">ID: {r.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{r.user_name || 'Candidate User'}</p>
                      <p className="text-[11px] text-slate-500">{r.user_email || 'candidate@ideal.edu'}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-[11px] uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 mr-1.5">
                        {r.file_type || 'PDF'}
                      </span>
                      <span className="text-slate-500">{formatFileSize(r.file_size)}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center space-x-1 text-slate-700 dark:text-slate-300 font-semibold">
                        <Layers className="w-3 h-3 text-brand-500 mr-1" />
                        {r.skills_count || 0} skills
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant={r.parsing_status === 'completed' ? 'emerald' : 'amber'}>
                        {r.parsing_status?.toUpperCase() || 'COMPLETED'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {r.uploaded_at ? new Date(r.uploaded_at).toLocaleDateString() : 'N/A'}
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
                onClick={() => loadResumes(page - 1)}
                disabled={page <= 1}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadResumes(page + 1)}
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

