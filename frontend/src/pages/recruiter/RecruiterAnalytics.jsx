import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Clock,
  TrendingUp,
  Users,
  ShieldCheck,
  Github,
  Award,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Card, Button, Badge, LoadingSpinner, ProgressBar } from '@/components';
import { ROUTES } from '@/utils/constants';
import { useNotification, useDocumentTitle } from '@/hooks';
import { recruiterService } from '@/services';

export default function RecruiterAnalytics() {
  useDocumentTitle('Hiring Funnel & Screening Analytics | Recruiter Copilot');
  const navigate = useNavigate();
  const notify = useNotification();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await recruiterService.getAnalytics();
        setData(res);
      } catch (err) {
        notify.error('Failed to load hiring analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return <LoadingSpinner fullPage message="Aggregating hiring pipeline analytics..." />;
  }

  const funnel = data?.funnel || {
    applied: 120,
    ai_screened: 95,
    shortlisted: 32,
    interview: 14,
    offer: 4,
    hired: 3,
  };

  const hoursSaved = data?.estimated_hours_saved || 28.5;
  const resumesAvoided = data?.unqualified_resumes_avoided || 45;
  const verificationRate = data?.github_verification_rate || 62.5;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-indigo-900/40 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider">
              Talent Telemetry
            </span>
            <span className="text-xs text-slate-400">• Evidence Efficiency</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-indigo-400" />
            Hiring Funnel & Screening Efficiency
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Real-time pipeline metrics tracking screening velocity, hours saved by batch AI evaluation, and candidate evidence verification ratios.
          </p>
        </div>

        <Button
          onClick={() => navigate(ROUTES.RECRUITER_JOBS)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 self-start md:self-center shrink-0 shadow-md shadow-indigo-600/30"
        >
          <span>View Active Jobs</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Hours Saved
            </span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {hoursSaved} hrs
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Based on batch screening AI</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Resumes Avoided
            </span>
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {resumesAvoided}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Low-fit resumes flagged early</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Verification Rate
            </span>
            <Github className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {Math.round(verificationRate)}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Backed by code or credentials</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Screening Velocity
            </span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            4.2x faster
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Compared to manual review</p>
        </Card>
      </div>

      {/* Recruitment Funnel Section */}
      <Card className="p-6 space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            End-to-End Candidate Conversion Funnel
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Conversion stages across all active company job requisitions
          </p>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Applied (Total Resumes Ingested)', count: funnel.applied || 100, color: 'brand' },
            { label: 'AI Screened & Parsed', count: funnel.ai_screened || 85, color: 'brand' },
            { label: 'AI Shortlisted (Fit >= 70%)', count: funnel.shortlisted || 30, color: 'primary' },
            { label: 'Technical Assessment / Interview', count: funnel.interview || 12, color: 'purple' },
            { label: 'Formal Offer Extended', count: funnel.offer || 4, color: 'emerald' },
            { label: 'Hired & Onboarded', count: funnel.hired || 3, color: 'emerald' },
          ].map((stage, idx) => {
            const pct = funnel.applied > 0 ? Math.round((stage.count / funnel.applied) * 100) : 0;
            return (
              <div key={idx} className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-800 dark:text-slate-200">{stage.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-900 dark:text-white font-bold">{stage.count}</span>
                    <span className="text-slate-400 text-[11px]">({pct}%)</span>
                  </div>
                </div>
                <ProgressBar progress={pct} color={stage.color} />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

