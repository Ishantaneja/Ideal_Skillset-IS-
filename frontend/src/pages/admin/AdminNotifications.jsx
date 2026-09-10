import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, LoadingSpinner } from '@/components';
import { useNotification, useDocumentTitle } from '@/hooks';
import { adminService } from '@/services';
import {
  Bell,
  RefreshCw,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  ShieldAlert,
  Cpu,
  Database,
  FileSearch,
  Filter
} from 'lucide-react';

export default function AdminNotifications() {
  useDocumentTitle('System Alerts & Notifications');
  const notify = useNotification();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({ items: [], unread_count: 0, total: 0 });
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const loadNotifications = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await adminService.getNotifications({ unread_only: unreadOnly });
      setData(res);
      if (isManual) notify.success('System alerts refreshed');
    } catch (err) {
      notify.error(err.message || 'Could not load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [unreadOnly]);

  const handleMarkRead = async (id) => {
    try {
      await adminService.markNotificationRead(id);
      setData((prev) => ({
        ...prev,
        unread_count: Math.max(0, prev.unread_count - 1),
        items: prev.items.map((n) => (n.id === id || id === 'all' ? { ...n, read: true } : n)),
      }));
      notify.success(id === 'all' ? 'All alerts marked as read' : 'Notification marked as read');
    } catch (err) {
      notify.error('Could not update notification status');
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            <AlertOctagon className="w-3 h-3 mr-1" /> CRITICAL
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="w-3 h-3 mr-1" /> ERROR
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-3 h-3 mr-1" /> WARNING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Info className="w-3 h-3 mr-1" /> INFO
          </span>
        );
    }
  };

  const getCategoryIcon = (category) => {
    switch (category.toUpperCase()) {
      case 'PARSING':
        return <FileSearch className="w-4 h-4 text-brand-500" />;
      case 'AI_STATUS':
        return <Cpu className="w-4 h-4 text-purple-500" />;
      case 'DATABASE':
        return <Database className="w-4 h-4 text-emerald-500" />;
      case 'SECURITY':
        return <ShieldAlert className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  const filteredItems = data.items.filter((item) => {
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">System Alerts & Notifications</h1>
            {data.unread_count > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white shadow-xs animate-pulse">
                {data.unread_count} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time administrative alerts across resume parsers, local AI health, and database connection monitors
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {data.unread_count > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              onClick={() => handleMarkRead('all')}
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              <span>Mark All Read</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            onClick={() => loadNotifications(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'PARSING', 'AI_STATUS', 'DATABASE', 'SECURITY', 'SYSTEM'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  categoryFilter === cat
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="rounded text-red-600 focus:ring-red-500"
            />
            <span>Show Unread Only</span>
          </label>
        </div>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <Card className="p-12 text-center bg-white dark:bg-slate-900">
            <LoadingSpinner message="Retrieving system alerts..." />
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card className="p-12 text-center bg-white dark:bg-slate-900 text-slate-500">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">All systems clear</p>
            <p className="text-xs text-slate-400 mt-1">No pending alerts matching the selected category filter</p>
          </Card>
        ) : (
          filteredItems.map((item) => {
            const dateStr = item.created_at ? new Date(item.created_at).toLocaleString() : 'Recently';
            return (
              <Card
                key={item.id}
                className={`p-4 border transition-all ${
                  item.read
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80'
                    : 'bg-slate-50/80 dark:bg-slate-800/60 border-red-200 dark:border-red-900/50 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </span>
                        {getSeverityBadge(item.severity)}
                        {!item.read && (
                          <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {item.message}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        Timestamp: {dateStr}
                      </span>
                    </div>
                  </div>

                  {!item.read && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleMarkRead(item.id)}
                      className="shrink-0 text-slate-500 hover:text-slate-900 dark:hover:text-white self-end sm:self-center"
                    >
                      <CheckCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                      Mark Read
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

