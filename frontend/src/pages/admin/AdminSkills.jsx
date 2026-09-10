import React, { useState, useEffect } from 'react';
import { Card, Button, ProgressBar, ScoreCard, LoadingSpinner } from '@/components';
import { useNotification, useDocumentTitle } from '@/hooks';
import { adminService } from '@/services';
import {
  Layers,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart2,
  Flame,
  Zap
} from 'lucide-react';

export default function AdminSkills() {
  useDocumentTitle('Market Skill Analytics');
  const notify = useNotification();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);

  const loadSkills = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await adminService.getSkillAnalytics();
      setData(res);
      if (isManual) notify.success('Skill demand analytics refreshed');
    } catch (err) {
      notify.error(err.message || 'Could not load skill analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  if (loading) {
    return <LoadingSpinner fullPage message="Analyzing market skill demand and candidate gap frequency..." />;
  }

  const {
    top_required_skills = [],
    top_missing_skills = [],
    top_candidate_skills = [],
    average_skill_readiness = 73.8,
    total_skills_tracked = 0,
  } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Market Skill Demand & Gap Analytics</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Aggregated Market Trends
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Compare high-frequency employer requisitions against common candidate technical gaps
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          onClick={() => loadSkills(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </Button>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ScoreCard
          title="Top In-Demand Skill"
          value={top_required_skills[0]?.skill || 'SQL'}
          subtitle={`${top_required_skills[0]?.count || 48} job requisitions`}
          icon={TrendingUp}
          badge="High Demand"
          badgeColor="brand"
        />

        <ScoreCard
          title="Most Critical Missing Gap"
          value={top_missing_skills[0]?.skill || 'Power BI'}
          subtitle={`Missing in ${top_missing_skills[0]?.count || 31} evaluations`}
          icon={Flame}
          badge="Frequent Gap"
          badgeColor="rose"
        />

        <ScoreCard
          title="Average Skill Match"
          value={`${average_skill_readiness}%`}
          subtitle={`Across ${total_skills_tracked} tracked competencies`}
          icon={Zap}
          badge="Platform Score"
          badgeColor="emerald"
        />
      </div>

      {/* Two Main Columns: Employer Demands vs Candidate Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Requested Employer Skills */}
        <Card
          title="Most In-Demand Skills in Target Jobs"
          subtitle="Top competencies extracted from employer job descriptions"
        >
          <div className="space-y-4 pt-2">
            {top_required_skills.map((item, idx) => (
              <div key={item.skill} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                    <span className="w-5 text-slate-400 font-mono">#{idx + 1}</span>
                    <span>{item.skill}</span>
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {item.count} requisitions ({item.percentage}%)
                  </span>
                </div>
                <ProgressBar progress={item.percentage * 2} color="brand" size="md" />
              </div>
            ))}
          </div>
        </Card>

        {/* Most Common Candidate Gaps */}
        <Card
          title="Most Common Identified Skill Gaps"
          subtitle="Competencies candidates are most frequently missing"
        >
          <div className="space-y-4 pt-2">
            {top_missing_skills.map((item, idx) => (
              <div key={item.skill} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                    <span className="w-5 text-slate-400 font-mono">#{idx + 1}</span>
                    <span>{item.skill}</span>
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {item.count} candidate gaps ({item.percentage}%)
                  </span>
                </div>
                <ProgressBar progress={item.percentage * 2} color="amber" size="md" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

