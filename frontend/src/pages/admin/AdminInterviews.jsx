import React, { useState, useEffect } from 'react';
import { Card, Button, ProgressBar, ScoreCard, LoadingSpinner } from '@/components';
import { useNotification, useDocumentTitle } from '@/hooks';
import { adminService } from '@/services';
import {
  Mic,
  RefreshCw,
  Award,
  Zap,
  MessageSquare,
  Sparkles,
  AlertCircle,
  Briefcase,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';

export default function AdminInterviews() {
  useDocumentTitle('Mock Interview Analytics');
  const notify = useNotification();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);

  const loadInterviews = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await adminService.getInterviewAnalytics();
      setData(res);
      if (isManual) notify.success('Interview analytics refreshed successfully');
    } catch (err) {
      notify.error(err.message || 'Could not load interview analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, []);

  if (loading) {
    return <LoadingSpinner fullPage message="Aggregating AI mock interview simulations and sub-scores..." />;
  }

  const {
    total_interviews = 0,
    average_overall_score = 0,
    technical_score = 0,
    communication_score = 0,
    confidence_score = 0,
    problem_solving_score = 0,
    behavioral_score = 0,
    common_weaknesses = [],
    role_breakdown = {},
  } = data || {};

  const dimensions = [
    { label: 'Technical Depth', score: technical_score, color: 'brand', icon: BrainCircuit, desc: 'Domain algorithms, coding reasoning, system architectures' },
    { label: 'Problem Solving', score: problem_solving_score, color: 'primary', icon: Zap, desc: 'Analytical structured approach, edge-case consideration' },
    { label: 'Behavioral & STAR', score: behavioral_score, color: 'emerald', icon: Award, desc: 'Situation, Task, Action, Result structured storytelling' },
    { label: 'Communication Clarity', score: communication_score, color: 'amber', icon: MessageSquare, desc: 'Pacing, clarity, concise articulation without filler words' },
    { label: 'Poise & Confidence', score: confidence_score, color: 'purple', icon: Sparkles, desc: 'Response assertiveness, calm under challenging prompts' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">AI Mock Interview Analytics</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Live Voice & Simulation
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Evaluate candidate interview readiness, sub-score competencies, and common behavioral friction points
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          onClick={() => loadInterviews(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-purple-600' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          title="Overall Interview Score"
          value={`${average_overall_score.toFixed(1)}%`}
          subtitle="Across all candidate simulations"
          icon={Award}
          badge="Platform Average"
          badgeColor="brand"
        />

        <ScoreCard
          title="Technical Competency"
          value={`${technical_score.toFixed(1)}%`}
          subtitle="Coding & architecture questions"
          icon={BrainCircuit}
          badge="Strongest Area"
          badgeColor="emerald"
        />

        <ScoreCard
          title="Total Mock Sessions"
          value={total_interviews}
          subtitle="Completed AI interview rounds"
          icon={Mic}
          badge="Completed"
          badgeColor="slate"
        />

        <ScoreCard
          title="Confidence / Poise Score"
          value={`${confidence_score.toFixed(1)}%`}
          subtitle="Top growth opportunity"
          icon={Sparkles}
          badge="Needs Focus"
          badgeColor="amber"
        />
      </div>

      {/* Sub-Scores Matrix & Role Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 5-Dimension Competency Breakdown */}
        <Card className="lg:col-span-7 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-purple-500" />
                5-Dimensional Competency Performance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Aggregate performance across key hiring manager evaluation metrics
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              5 Pillars
            </span>
          </div>

          <div className="space-y-4">
            {dimensions.map((dim) => {
              const Icon = dim.icon;
              return (
                <div key={dim.label} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{dim.label}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {dim.score.toFixed(1)}%
                    </span>
                  </div>
                  <ProgressBar value={dim.score} max={100} color={dim.color} size="sm" />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{dim.desc}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Role Breakdown */}
        <Card className="lg:col-span-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
              <Briefcase className="w-4 h-4 mr-2 text-brand-500" />
              Interview Sessions by Target Role
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Volume distribution across candidate career tracks
            </p>
          </div>

          <div className="space-y-3">
            {Object.entries(role_breakdown).map(([role, count]) => {
              const pct = total_interviews > 0 ? Math.round((count / total_interviews) * 100) : 0;
              return (
                <div key={role} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200">{role}</span>
                    <span className="text-slate-500 dark:text-slate-400">{count} sessions ({pct}%)</span>
                  </div>
                  <ProgressBar value={pct} max={100} color="brand" size="xs" />
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Common Candidate Weaknesses & Remediation Guidance */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-amber-500" />
              Frequently Identified Candidate Weaknesses & Remediation Suggestions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              AI feedback patterns detected across verbal mock interview transcripts
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {common_weaknesses.length} Common Patterns
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {common_weaknesses.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                  {item.weakness}
                </span>
                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {item.category}
                </span>
              </div>

              <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Recommended Guidance: </span>
                {item.suggested_action}
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span>Observed in {item.frequency} mock interviews</span>
                <span className="font-semibold text-amber-500">Actionable Feedback</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

