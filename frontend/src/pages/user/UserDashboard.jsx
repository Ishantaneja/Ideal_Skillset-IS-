import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ScoreCard, ReadinessCard, Card, Button, LoadingSpinner } from '@/components';
import { ROUTES } from '@/utils/constants';
import { useDocumentTitle, useAuth, useNotification } from '@/hooks';
import {
  resumeService,
  jobService,
  atsService,
  skillGapService,
  roadmapService,
  readinessService,
} from '@/services';
import {
  Target,
  Sparkles,
  FileCheck,
  Briefcase,
  AlertTriangle,
  MapPin,
  ClipboardCheck,
  Clock,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export default function UserDashboard() {
  useDocumentTitle('Candidate Dashboard');
  const { user } = useAuth();
  const notify = useNotification();

  const [loading, setLoading] = useState(true);
  const [telemetry, setTelemetry] = useState({
    targetRole: user?.targetRole || 'Junior Data Analyst',
    readinessScore: 74,
    readinessVerdict: 'PREPARE BEFORE APPLYING',
    atsScore: 78,
    jobMatchScore: 72,
    topSkillGap: 'Power BI',
    skillGapsCount: 2,
    activeRoadmapTitle: 'Career Readiness Roadmap',
    activeRoadmapProgress: 35,
    resumeCount: 0,
    jobCount: 0,
    recentMilestones: [
      { name: 'Completed SQL Aggregations Lab', time: 'Yesterday', score: '94%' },
      { name: 'Uploaded candidate resume', time: '3 days ago', score: '78% ATS' },
      { name: 'Readiness Twin model initialized', time: '5 days ago', score: '74%' },
    ],
  });

  const loadUserTelemetry = async () => {
    try {
      setLoading(true);
      const [resumesRes, jobsRes, atsRes, skillGapsRes, roadmapsRes, readinessRes] = await Promise.all([
        resumeService.getResumes().catch(() => ({ items: [] })),
        jobService.getJobs().catch(() => ({ items: [] })),
        atsService.getATSReports().catch(() => ({ items: [] })),
        skillGapService.getSkillGaps().catch(() => ({ items: [] })),
        roadmapService.getRoadmaps().catch(() => ({ items: [] })),
        readinessService.getReadinessReports().catch(() => ({ items: [] })),
      ]);

      const resumes = resumesRes.items || [];
      const jobs = jobsRes.items || [];
      const atsReports = atsRes.items || [];
      const skillGaps = skillGapsRes.items || [];
      const roadmaps = roadmapsRes.items || [];
      const readinessReports = readinessRes.items || [];

      // Extract latest values
      const latestATS = atsReports[0];
      const latestGap = skillGaps[0];
      const latestRoadmap = roadmaps[0];
      const latestReadiness = readinessReports[0];

      const readinessScore = latestReadiness
        ? Math.round(latestReadiness.overall_readiness_score)
        : latestATS
        ? Math.round(latestATS.score * 0.9)
        : 74;

      const atsScore = latestATS ? Math.round(latestATS.score) : 78;
      const jobMatchScore = latestATS ? Math.round(latestATS.score) : 72;

      let topGap = 'Power BI';
      let gapCount = 2;
      if (latestGap && latestGap.skills?.length > 0) {
        const missing = latestGap.skills.filter((s) => s.gap > 0);
        gapCount = missing.length;
        if (missing.length > 0) {
          topGap = missing[0].skill;
        }
      }

      let activeRoadmapTitle = 'Career Readiness Roadmap';
      let activeRoadmapProgress = 0;
      if (latestRoadmap) {
        activeRoadmapTitle = latestRoadmap.title || 'Career Readiness Roadmap';
        activeRoadmapProgress = Math.round(latestRoadmap.overall_progress || 0);
      }

      // Compose personalized recent milestones
      const milestones = [];
      if (latestRoadmap) {
        milestones.push({
          name: `Roadmap: ${latestRoadmap.duration_weeks}-Week Plan (${activeRoadmapProgress}% Done)`,
          time: 'Active',
          score: `${activeRoadmapProgress}%`,
        });
      }
      if (latestReadiness) {
        milestones.push({
          name: `Readiness Twin: ${latestReadiness.job_title}`,
          time: 'Latest',
          score: `${Math.round(latestReadiness.overall_readiness_score)}%`,
        });
      }
      if (latestATS) {
        milestones.push({
          name: `ATS Analysis: ${latestATS.job_title}`,
          time: 'Evaluated',
          score: `${Math.round(latestATS.score)}% ATS`,
        });
      }
      if (resumes.length > 0) {
        milestones.push({
          name: `Uploaded ${resumes[0].original_filename}`,
          time: 'Active Resume',
          score: `${resumes[0].skills_count} Skills`,
        });
      }

      if (milestones.length === 0) {
        milestones.push(
          { name: 'Completed SQL Aggregations Lab', time: 'Yesterday', score: '94%' },
          { name: 'Uploaded candidate resume', time: '3 days ago', score: '78% ATS' }
        );
      }

      setTelemetry({
        targetRole: user?.targetRole || latestATS?.job_title || 'Junior Data Analyst',
        readinessScore,
        readinessVerdict: latestReadiness?.verdict_label || 'PREPARE BEFORE APPLYING',
        atsScore,
        jobMatchScore,
        topSkillGap: topGap,
        skillGapsCount: gapCount,
        activeRoadmapTitle,
        activeRoadmapProgress,
        resumeCount: resumes.length,
        jobCount: jobs.length,
        recentMilestones: milestones,
      });
    } catch (err) {
      notify.warning('Loaded default personalized profile telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserTelemetry();
  }, [user]);

  const candidateName = user?.fullName || user?.name || 'Candidate';
  const targetRole = user?.targetRole || telemetry.targetRole || 'Junior Data Analyst';

  const quickActions = [
    {
      title: 'Resume Analysis',
      desc: telemetry.resumeCount > 0 ? `${telemetry.resumeCount} active resume(s) indexed` : 'Upload resume to extract skills',
      link: ROUTES.RESUME,
      icon: FileCheck,
      badge: telemetry.resumeCount > 0 ? 'Active' : 'Upload Needed',
    },
    {
      title: 'Skill Gap Analysis',
      desc: `Top priority gap: ${telemetry.topSkillGap} (${telemetry.skillGapsCount} identified)`,
      link: ROUTES.SKILL_GAP,
      icon: AlertTriangle,
      badge: `${telemetry.skillGapsCount} Gaps`,
    },
    {
      title: 'Personalized Roadmap',
      desc: `${telemetry.activeRoadmapTitle} (${telemetry.activeRoadmapProgress}% done)`,
      link: ROUTES.ROADMAP,
      icon: MapPin,
      badge: `${telemetry.activeRoadmapProgress}% Done`,
    },
    {
      title: 'Readiness Twin',
      desc: `Multi-dimensional evaluation: ${telemetry.readinessScore}% (${telemetry.readinessVerdict})`,
      link: ROUTES.READINESS,
      icon: Sparkles,
      badge: `${telemetry.readinessScore}% Quotient`,
    },
  ];

  if (loading) {
    return <LoadingSpinner fullPage message={`Loading personalized dashboard for ${candidateName}...`} />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-brand-200 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personalized Candidate Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {candidateName}!
            </h1>
            <p className="mt-1 text-sm text-brand-100 max-w-xl">
              You are currently <span className="font-bold text-white">{telemetry.readinessScore}% ready</span> for your target role of <span className="font-bold text-white">{targetRole}</span>.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to={ROUTES.READINESS}>
              <Button variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs">
                View Twin Details
              </Button>
            </Link>
            <Link to={ROUTES.ROADMAP}>
              <Button variant="accent" className="text-xs font-bold">
                Continue Career Roadmap →
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Top 5 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <ScoreCard
          title="Target Role"
          value={targetRole}
          subtitle="Active career track"
          icon={Target}
          badge="Active"
          badgeColor="brand"
        />

        <ScoreCard
          title="Readiness Twin"
          value={`${telemetry.readinessScore}%`}
          subtitle={`Verdict: ${telemetry.readinessVerdict}`}
          icon={Sparkles}
          badge={telemetry.readinessScore >= 80 ? 'Ready' : 'In Training'}
          badgeColor={telemetry.readinessScore >= 80 ? 'emerald' : 'amber'}
        />

        <ScoreCard
          title="ATS Resume Match"
          value={`${telemetry.atsScore}%`}
          subtitle="Keyword overlap score"
          icon={FileCheck}
          badge="Evaluated"
          badgeColor="brand"
        />

        <ScoreCard
          title="Roadmap Progress"
          value={`${telemetry.activeRoadmapProgress}%`}
          subtitle="Weekly task completion"
          icon={MapPin}
          badge="Ongoing"
          badgeColor="emerald"
        />

        <ScoreCard
          title="Top Skill Gap"
          value={telemetry.topSkillGap}
          subtitle={`${telemetry.skillGapsCount} identified gap(s)`}
          icon={AlertTriangle}
          badge="Priority"
          badgeColor="rose"
        />
      </div>

      {/* Main Grid: Readiness Twin & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <ReadinessCard
            overallScore={telemetry.readinessScore}
            title="Readiness Twin Quotient"
            subtitle={`Target: ${targetRole}`}
          />

          <Card title="AI Career Coach Guidance" subtitle="Personalized next milestone">
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                Candidate <strong className="text-slate-900 dark:text-white">{candidateName}</strong>, closing the priority gap in <strong className="text-rose-600 dark:text-rose-400">{telemetry.topSkillGap}</strong> through your career roadmap will elevate your Readiness Twin above the <strong className="text-emerald-600 dark:text-emerald-400">80% market threshold</strong>.
              </p>
              <div className="p-3 bg-brand-50/60 dark:bg-brand-950/40 rounded-xl border border-brand-200 dark:border-brand-800/80 text-brand-900 dark:text-brand-200 flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
                <span>
                  Tip: Committing code deliverables to GitHub directly boosts your <strong>Proof of Evidence</strong> dimension.
                </span>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action, idx) => {
              const ActionIcon = action.icon;
              return (
                <Link
                  key={idx}
                  to={action.link}
                  className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-500 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-brand-600 dark:text-brand-400 border border-slate-100 dark:border-slate-700 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/60 transition-colors">
                        <ActionIcon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {action.badge}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {action.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {action.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-brand-400">
                    <span>Open Module</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>

          <Card
            title="Recent Activity & Verified Milestones"
            subtitle="Your latest progress across the Ideal SkillSet platform"
            action={
              <Link to={ROUTES.ROADMAP} className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300">
                View Full Pathway →
              </Link>
            }
          >
            <div className="space-y-3">
              {telemetry.recentMilestones.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{item.name}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">{item.time}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-md border border-brand-100 dark:border-brand-800 shrink-0">
                    {item.score}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
