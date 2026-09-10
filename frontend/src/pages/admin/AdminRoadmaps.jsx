import React, { useState, useEffect } from 'react';
import { Card, Button, ProgressBar, ScoreCard, LoadingSpinner } from '@/components';
import { useNotification, useDocumentTitle } from '@/hooks';
import { adminService } from '@/services';
import {
  Map,
  RefreshCw,
  Award,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BookOpen,
  Code,
  FolderGit2,
  Cpu
} from 'lucide-react';

export default function AdminRoadmaps() {
  useDocumentTitle('Career Roadmap Analytics');
  const notify = useNotification();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);

  const loadRoadmaps = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await adminService.getRoadmapAnalytics();
      setData(res);
      if (isManual) notify.success('Roadmap analytics refreshed successfully');
    } catch (err) {
      notify.error(err.message || 'Could not load roadmap analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRoadmaps();
  }, []);

  if (loading) {
    return <LoadingSpinner fullPage message="Aggregating career roadmap completion rates and progression milestones..." />;
  }

  const {
    total_roadmaps_generated = 0,
    active_roadmaps = 0,
    completed_roadmaps = 0,
    average_completion_percentage = 0,
    abandoned_weeks = [],
    task_type_breakdown = {},
  } = data || {};

  const taskIcons = {
    'Theory & Core Concepts': BookOpen,
    'Hands-on Practical Labs': Code,
    'Portfolio Project Building': FolderGit2,
    'Mock Simulation Challenges': Cpu,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Candidate Roadmap Analytics</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Curriculum Progression
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track candidate progression velocity, weekly module drop-off points, and task type engagement
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          onClick={() => loadRoadmaps(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          title="Average Completion"
          value={`${average_completion_percentage.toFixed(1)}%`}
          subtitle="Curriculum progress velocity"
          icon={Award}
          badge="Avg Completion"
          badgeColor="brand"
        />

        <ScoreCard
          title="Active Roadmaps"
          value={active_roadmaps}
          subtitle="In-progress learning paths"
          icon={Clock}
          badge="In Progress"
          badgeColor="blue"
        />

        <ScoreCard
          title="Completed Roadmaps"
          value={completed_roadmaps}
          subtitle="100% finished roadmaps"
          icon={CheckCircle2}
          badge="Completed"
          badgeColor="emerald"
        />

        <ScoreCard
          title="Total Paths Generated"
          value={total_roadmaps_generated}
          subtitle="AI synthesized roadmaps"
          icon={Map}
          badge="Total"
          badgeColor="slate"
        />
      </div>

      {/* Drop-Off Points & Task Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Abandoned Weeks / Friction Analysis */}
        <Card className="lg:col-span-7 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
                Curriculum Friction & Abandoned Week Points
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Identified weeks where candidate engagement slows or stops
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              High Drop Rates
            </span>
          </div>

          <div className="space-y-4">
            {abandoned_weeks.map((item) => (
              <div
                key={item.week_number}
                className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 text-xs font-bold">
                      W{item.week_number}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.topic}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {item.drop_percentage}% Drop Rate
                  </span>
                </div>
                <ProgressBar value={item.drop_percentage * 3} max={100} color="rose" size="sm" />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>{item.drop_count} candidates paused at this milestone</span>
                  <span className="text-amber-500 font-medium">Needs module refinement</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Task Breakdown */}
        <Card className="lg:col-span-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-blue-500" />
              Task Type Distribution & Completion
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Volume of exercises generated across modalities
            </p>
          </div>

          <div className="space-y-3">
            {Object.entries(task_type_breakdown).map(([task, count]) => {
              const Icon = taskIcons[task] || BookOpen;
              return (
                <div
                  key={task}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      {task}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {count} tasks
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

