import React, { useState, useEffect } from 'react';
import { Card, Button, ProgressBar, ScoreCard, LoadingSpinner } from '@/components';
import { useNotification, useDocumentTitle } from '@/hooks';
import { adminService } from '@/services';
import {
  Sparkles,
  RefreshCw,
  Brain,
  Wrench,
  Award,
  MessageSquare,
  Milestone,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart3,
  TrendingUp
} from 'lucide-react';

export default function AdminReadiness() {
  useDocumentTitle('Platform Readiness Twin Analytics');
  const notify = useNotification();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  const loadAnalytics = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await adminService.getReadinessAnalytics();
      setAnalytics(res);
      if (isManual) notify.success('Readiness Twin analytics refreshed');
    } catch (err) {
      notify.error(err.message || 'Could not load readiness analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return <LoadingSpinner fullPage message="Aggregating Readiness Twin competency metrics..." />;
  }

  const {
    total_analyses = 0,
    average_readiness_score = 75,
    average_knowledge_score = 78,
    average_practical_score = 72,
    average_evidence_score = 68,
    average_communication_score = 81,
    average_roadmap_score = 74,
    score_distribution = [],
    verdict_distribution = {},
  } = analytics || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Platform Readiness Twin Analytics</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              5-Dimension Aggregations
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Aggregate competency scores, candidate readiness score distributions, and application verdict ratios
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          onClick={() => loadAnalytics(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </Button>
      </div>

      {/* 5 Core Dimension Averages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <ScoreCard
          title="Overall Readiness"
          value={`${average_readiness_score}%`}
          subtitle={`Across ${total_analyses} analyses`}
          icon={Sparkles}
          badge="Platform Avg"
          badgeColor="brand"
        />

        <ScoreCard
          title="Knowledge Score"
          value={`${average_knowledge_score}%`}
          subtitle="Theoretical grounding"
          icon={Brain}
          badge="80% Target"
          badgeColor="emerald"
        />

        <ScoreCard
          title="Practical Ability"
          value={`${average_practical_score}%`}
          subtitle="Hands-on skills"
          icon={Wrench}
          badge="75% Target"
          badgeColor="brand"
        />

        <ScoreCard
          title="Proof of Evidence"
          value={`${average_evidence_score}%`}
          subtitle="Projects & Repos"
          icon={Award}
          badge="70% Target"
          badgeColor="amber"
        />

        <ScoreCard
          title="Communication"
          value={`${average_communication_score}%`}
          subtitle="Interview articulation"
          icon={MessageSquare}
          badge="75% Target"
          badgeColor="emerald"
        />
      </div>

      {/* Score Distribution Histogram & Application Decision Ratios */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Readiness Score Distribution Histogram */}
        <div className="lg:col-span-7">
          <Card
            title="Candidate Readiness Score Distribution"
            subtitle="Histogram breakdown across score tiers"
          >
            <div className="space-y-4 pt-2">
              {score_distribution.map((bucket) => (
                <div key={bucket.range_label} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Score Tier {bucket.range_label}%
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {bucket.count} candidates ({bucket.percentage}%)
                    </span>
                  </div>
                  <ProgressBar
                    progress={bucket.percentage}
                    color={
                      bucket.range_label === '90-100' || bucket.range_label === '80-89'
                        ? 'emerald'
                        : bucket.range_label === '70-79' || bucket.range_label === '60-69'
                        ? 'brand'
                        : 'amber'
                    }
                    size="md"
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Verdict Breakdown */}
        <div className="lg:col-span-5">
          <Card
            title="Application Verdict Ratios"
            subtitle="Candid 'Should I Apply Now?' decision outcomes"
          >
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">READY TO APPLY</p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Exceeds market benchmark (80%+)</p>
                  </div>
                </div>
                <span className="text-xl font-extrabold text-emerald-900 dark:text-emerald-300">
                  {verdict_distribution['READY TO APPLY'] || 0}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="text-xs font-bold text-amber-950 dark:text-amber-200">PREPARE BEFORE APPLYING</p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">Minor gaps in practical evidence</p>
                  </div>
                </div>
                <span className="text-xl font-extrabold text-amber-900 dark:text-amber-300">
                  {verdict_distribution['PREPARE BEFORE APPLYING'] || 0}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  <div>
                    <p className="text-xs font-bold text-rose-950 dark:text-rose-200">DO NOT APPLY YET</p>
                    <p className="text-[11px] text-rose-700 dark:text-rose-400">Critical missing prerequisites (&lt;60%)</p>
                  </div>
                </div>
                <span className="text-xl font-extrabold text-rose-900 dark:text-rose-300">
                  {verdict_distribution['DO NOT APPLY YET'] || 0}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

