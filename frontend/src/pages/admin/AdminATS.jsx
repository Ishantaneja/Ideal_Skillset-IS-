import React, { useState, useEffect } from 'react';
import { Card, Button, ProgressBar, ScoreCard, LoadingSpinner } from '@/components';
import { useNotification, useDocumentTitle } from '@/hooks';
import { adminService } from '@/services';
import {
  Target,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  FileSearch,
  PieChart,
  Award
} from 'lucide-react';

export default function AdminATS() {
  useDocumentTitle('ATS Analytics');
  const notify = useNotification();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);

  const loadATS = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await adminService.getATSAnalytics();
      setData(res);
      if (isManual) notify.success('ATS analytics refreshed successfully');
    } catch (err) {
      notify.error(err.message || 'Could not load ATS analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadATS();
  }, []);

  if (loading) {
    return <LoadingSpinner fullPage message="Aggregating resume ATS scoring distributions and parsing trends..." />;
  }

  const {
    total_scans = 0,
    average_ats_score = 0,
    score_distribution = [],
    common_missing_skills = [],
    problem_breakdown = {},
    average_keyword_match_rate = 0,
  } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">ATS Resume Analytics</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
              Parsing Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Global ATS compatibility scores, keyword match density, and structural formatting friction points
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          onClick={() => loadATS(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-red-600' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          title="Average ATS Score"
          value={`${average_ats_score.toFixed(1)}%`}
          subtitle="Across candidate uploads"
          icon={Award}
          badge={average_ats_score >= 75 ? 'Strong Match' : 'Needs Optimization'}
          badgeColor={average_ats_score >= 75 ? 'emerald' : 'amber'}
        />

        <ScoreCard
          title="Keyword Match Density"
          value={`${average_keyword_match_rate.toFixed(1)}%`}
          subtitle="Job description alignment"
          icon={Target}
          badge="Keyword Alignment"
          badgeColor="brand"
        />

        <ScoreCard
          title="Total Resumes Evaluated"
          value={total_scans}
          subtitle="Active candidate profiles"
          icon={FileSearch}
          badge="Evaluations"
          badgeColor="slate"
        />

        <ScoreCard
          title="Primary Parser Friction"
          value="Missing Keywords"
          subtitle="65% of resume scans"
          icon={AlertTriangle}
          badge="Top Bottleneck"
          badgeColor="red"
        />
      </div>

      {/* Score Distribution & Structural Problems Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ATS Score Distribution */}
        <Card className="lg:col-span-7 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                <PieChart className="w-4 h-4 mr-2 text-red-500" />
                ATS Compatibility Distribution
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Candidate distribution across ATS passing thresholds
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              5 Tiers
            </span>
          </div>

          <div className="space-y-4">
            {score_distribution.map((bucket) => {
              const isHigh = bucket.range_label === '90-100' || bucket.range_label === '75-89';
              const isMid = bucket.range_label === '60-74';
              const color = isHigh ? 'emerald' : isMid ? 'amber' : 'rose';

              return (
                <div key={bucket.range_label} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">
                      Score Band {bucket.range_label}%
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {bucket.count} candidates ({bucket.percentage}%)
                    </span>
                  </div>
                  <ProgressBar
                    value={bucket.percentage}
                    max={100}
                    color={color}
                    size="md"
                    className="h-2.5"
                  />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Common Parser Problems */}
        <Card className="lg:col-span-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
              Common Parsing Roadblocks
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Identified resume formatting and content bottlenecks
            </p>
          </div>

          <div className="space-y-3">
            {Object.entries(problem_breakdown).map(([problem, count], idx) => (
              <div
                key={problem}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {problem}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  {count} scans
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Missing Keywords / Skills */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-brand-500" />
              Top Missing ATS Keywords & Technical Credentials
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              High-impact skills and keywords most frequently omitted from candidate resumes
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {common_missing_skills.length} Critical Items
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {common_missing_skills.map((item) => (
            <div
              key={item.skill}
              className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {item.skill}
                </span>
                <span className="text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded border border-red-200 dark:border-red-900">
                  {item.percentage}% Absent
                </span>
              </div>
              <ProgressBar
                value={item.percentage}
                max={100}
                color="rose"
                size="sm"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Omitted in {item.count} resumes</span>
                <span>High Penalty</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

