import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, LoadingSpinner } from '@/components';
import { useNotification, useDocumentTitle } from '@/hooks';
import { adminService } from '@/services';
import {
  Shield,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  FileText,
  KeyRound,
  Eye,
  Trash2,
  Lock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function AdminAuditLogs() {
  useDocumentTitle('Administrative Audit Trail');
  const notify = useNotification();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logsData, setLogsData] = useState({ items: [], page: 1, limit: 20, total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);

  const loadAuditLogs = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const params = {
        page,
        limit: 20,
        action: actionFilter !== 'all' ? actionFilter : undefined,
      };

      const res = await adminService.getAuditLogs(params);
      setLogsData(res);
      if (isManual) notify.success('Audit trail refreshed');
    } catch (err) {
      notify.error(err.message || 'Could not load audit logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [page, actionFilter]);

  const getActionBadge = (action) => {
    switch (action) {
      case 'ADMIN_LOGIN':
        return <Badge variant="emerald">LOGIN</Badge>;
      case 'ROLE_CHANGE':
        return <Badge variant="purple">ROLE CHANGE</Badge>;
      case 'USER_DELETE':
        return <Badge variant="rose">USER DELETE</Badge>;
      case 'USER_VIEW':
        return <Badge variant="brand">USER INSPECTION</Badge>;
      case 'RESUME_VIEW':
        return <Badge variant="amber">RESUME VIEW</Badge>;
      case 'SETTINGS_CHANGE':
        return <Badge variant="blue">SETTINGS</Badge>;
      default:
        return <Badge variant="slate">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Administrative Audit Trail</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
              Immutable Records
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tamper-evident logs of administrative actions, candidate inspections, role changes, and system modifications
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          onClick={() => loadAuditLogs(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-red-600' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Logs'}</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Filter Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              <option value="all">All Administrative Actions</option>
              <option value="ADMIN_LOGIN">Admin Logins (ADMIN_LOGIN)</option>
              <option value="ROLE_CHANGE">Role Changes (ROLE_CHANGE)</option>
              <option value="USER_VIEW">User Profile Views (USER_VIEW)</option>
              <option value="USER_DELETE">User Deletions (USER_DELETE)</option>
              <option value="RESUME_VIEW">Resume Views (RESUME_VIEW)</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Total Logged Events: <span className="font-bold text-slate-900 dark:text-white">{logsData.total}</span>
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center">
            <LoadingSpinner message="Querying administrative audit logs..." />
          </div>
        ) : logsData.items.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Shield className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-60" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No audit records found matching query</p>
            <p className="text-xs text-slate-400 mt-1">Actions performed by system administrators will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Action Type</th>
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Target Type & ID</th>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300 font-medium">
                {logsData.items.map((log) => {
                  const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A';
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                            AD
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[180px]">
                            {log.admin_email}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {log.target_type}: {log.target_id || 'System'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setSelectedLog(log)}
                          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View Metadata
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {logsData.pages > 1 && (
          <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Page <span className="font-semibold text-slate-800 dark:text-slate-200">{page}</span> of{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{logsData.pages}</span>
            </span>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(logsData.pages, p + 1))}
                disabled={page >= logsData.pages}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Metadata Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-slate-900 dark:text-white">Audit Event Details</h3>
              </div>
              <Button variant="ghost" size="xs" onClick={() => setSelectedLog(null)}>✕</Button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700/60">
                <div>
                  <span className="text-slate-400">Action:</span>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="text-slate-400">Target Type:</span>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedLog.target_type}</p>
                </div>
                <div>
                  <span className="text-slate-400">Admin Email:</span>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedLog.admin_email}</p>
                </div>
                <div>
                  <span className="text-slate-400">Timestamp:</span>
                  <p className="font-bold text-slate-900 dark:text-white">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Sanitized Event Metadata:</span>
                <pre className="mt-1.5 p-3 rounded-lg bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-800">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setSelectedLog(null)}>Close</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

