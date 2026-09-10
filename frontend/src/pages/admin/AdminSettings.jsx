import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, LoadingSpinner, Select } from '@/components';
import { useNotification, useDocumentTitle } from '@/hooks';
import { adminService } from '@/services';
import {
  Settings,
  Activity,
  Database,
  Server,
  Cpu,
  ShieldCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Clock
} from 'lucide-react';

export default function AdminSettings() {
  useDocumentTitle('System Settings & Audit Log');
  const notify = useNotification();

  const [loadingHealth, setLoadingHealth] = useState(true);
  const [health, setHealth] = useState(null);

  const [loadingLogs, setLoadingLogs] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actionFilter, setActionFilter] = useState('all');

  const loadHealth = async () => {
    try {
      setLoadingHealth(true);
      const res = await adminService.getHealth();
      setHealth(res);
    } catch (err) {
      notify.error(err.message || 'Could not load system health');
    } finally {
      setLoadingHealth(false);
    }
  };

  const loadLogs = async (targetPage = page, isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoadingLogs(true);

      const res = await adminService.getAuditLogs({
        page: targetPage,
        limit: 10,
        action: actionFilter !== 'all' ? actionFilter : undefined,
      });

      setLogs(res.items || []);
      setTotalCount(res.total || 0);
      setTotalPages(res.pages || 1);
      setPage(res.page || 1);
      if (isManual) notify.success('Audit trail refreshed');
    } catch (err) {
      notify.error(err.message || 'Could not load audit logs');
    } finally {
      setLoadingLogs(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHealth();
    loadLogs(1);
  }, [actionFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">System Settings & Audit Trail</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Platform diagnostics, service connection health, and immutable administrative audit logs
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          onClick={() => {
            loadHealth();
            loadLogs(page, true);
          }}
          disabled={refreshing}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh All'}</span>
        </Button>
      </div>

      {/* System Health Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card bodyClassName="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">FastAPI Backend</p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                  {health?.api || 'Operational'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card bodyClassName="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">MongoDB Database</p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-bold text-slate-900 dark:text-white capitalize truncate max-w-[130px]">
                  {health?.database_name || 'ideal_skillsetdb'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card bodyClassName="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">AI / Evaluation Engine</p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                  {health?.ai_service || 'Available'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card bodyClassName="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Environment</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 capitalize">
                {health?.environment || 'Production'} v{health?.version || '1.0.0'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Audit Log Stream */}
      <Card
        title={`Administrative Audit Trail (${totalCount})`}
        subtitle="Immutable security logs tracking all administrative actions"
        action={
          <div className="w-48">
            <Select
              id="action-filter"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Log Actions' },
                { value: 'USER_VIEW', label: 'Candidate Views' },
                { value: 'ROLE_CHANGE', label: 'Role Changes' },
                { value: 'USER_DELETE', label: 'User Deletions' },
              ]}
            />
          </div>
        }
        bodyClassName="p-0"
      >
        {loadingLogs ? (
          <div className="py-12">
            <LoadingSpinner message="Querying audit trail..." />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            <ShieldAlert className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            No audit records matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Action Executed</th>
                  <th className="px-6 py-3.5">Administrator</th>
                  <th className="px-6 py-3.5">Target Entity</th>
                  <th className="px-6 py-3.5">Details</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-slate-900 dark:text-white">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {l.action}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-700 dark:text-slate-300 font-medium">{l.admin_email}</td>
                    <td className="px-6 py-3.5">
                      <span className="capitalize font-medium text-slate-600 dark:text-slate-400">{l.target_type}:</span>{' '}
                      <span className="font-mono text-[11px] text-slate-500">{l.target_id || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 max-w-xs truncate font-mono text-[11px]">
                      {JSON.stringify(l.metadata || {})}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString()}
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
                onClick={() => loadLogs(page - 1)}
                disabled={page <= 1}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadLogs(page + 1)}
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

