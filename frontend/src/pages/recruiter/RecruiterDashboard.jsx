import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Sparkles,
  ShieldCheck,
  BookmarkCheck,
  Search,
  ArrowRight,
  Briefcase,
  FolderGit2,
  CheckCircle2,
  Building2,
  Clock,
  TrendingUp,
  AlertTriangle,
  Award,
  Video,
  Plus,
  BarChart3,
  GitCompare,
  UploadCloud,
  FileCheck,
} from 'lucide-react';
import { Card, Button, Badge, LoadingSpinner, ProgressBar } from '@/components';
import { ROUTES } from '@/utils/constants';
import { useNotification, useDocumentTitle, useAuth } from '@/hooks';
import { recruiterService } from '@/services';

export default function RecruiterDashboard() {
  useDocumentTitle('Recruiter Command Center');
  const navigate = useNavigate();
  const notify = useNotification();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await recruiterService.getDashboard();
      setData(res);
    } catch (err) {
      notify.error(err.message || 'Could not load command center metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner fullPage message="Loading Recruiter Command Center..." />;
  }

  const openRoles = data?.open_roles || 0;
  const totalApplicants = data?.total_applicants || 0;
  const aiScreened = data?.ai_screened || 0;
  const aiShortlisted = data?.ai_shortlisted || 0;
  const interviews = data?.interviews || 0;
  const offers = data?.offers || 0;
  const hoursSaved = data?.estimated_screening_time_saved_hours || 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-indigo-900/90 via-slate-900 to-purple-900/90 p-6 rounded-3xl border border-indigo-800/40 text-white shadow-xl shadow-indigo-950/20">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider">
              Recruiter AI Hiring Copilot
            </span>
            <span className="text-xs text-slate-400">• {data?.company_name || user?.companyName || 'Enterprise'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Recruiter Command Center
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            From resume keyword screening to verifiable job readiness with GitHub codebase and certificate proof.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => navigate(ROUTES.RECRUITER_JOBS)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center space-x-2 shadow-md shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Job</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.RECRUITER_CANDIDATES)}
            className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs py-2.5 px-4 rounded-xl flex items-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>Search Talent</span>
          </Button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase">Open Roles</span>
            <Briefcase className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{openRoles}</div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">Active requisitions</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase">Total Applied</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{totalApplicants}</div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">Candidate profiles</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase">AI Screened</span>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{aiScreened}</div>
          <p className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-1 font-semibold">100% automated</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase">Shortlisted</span>
            <BookmarkCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{aiShortlisted}</div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-semibold">High fit potential</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase">Interviews</span>
            <Video className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{interviews}</div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">In interview loop</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase">Offers & Hires</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{offers}</div>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 font-semibold">Final conversion</p>
        </div>
      </div>

      {/* Screening Time Saved Highlight Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-indigo-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">
                Screening Efficiency
              </span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md font-bold">
                ESTIMATE
              </span>
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              ~{hoursSaved} hours of manual screening saved
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {data?.screening_time_note}
            </p>
          </div>
        </div>
        <Link
          to={ROUTES.RECRUITER_ANALYTICS}
          className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center space-x-1.5 shrink-0"
        >
          <span>View Efficiency Funnel</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Two Column Grid: Active Jobs & Pipeline Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Jobs List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Active Job Requisitions
              </h2>
            </div>
            <Link
              to={ROUTES.RECRUITER_JOBS}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
            >
              <span>Manage All Jobs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {data?.active_jobs?.length > 0 ? (
              data.active_jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => navigate(`/recruiter/jobs/${job.id}/candidates`)}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 dark:text-white text-base">
                        {job.title}
                      </span>
                      <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                        Active
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-slate-500">
                      <span>{job.location}</span>
                      <span>•</span>
                      <span>AI Blueprint Verified</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-black text-slate-900 dark:text-white">
                        {job.applicant_count}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">
                        Applicants
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold rounded-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/recruiter/jobs/${job.id}/candidates`);
                      }}
                    >
                      <UploadCloud className="w-3.5 h-3.5 mr-1" />
                      Upload & Screen
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                <Briefcase className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No active job requisitions</p>
                <p className="text-xs text-slate-500 mb-4">Create your first role to start AI resume screening and skill verification.</p>
                <Button onClick={() => navigate(ROUTES.RECRUITER_JOBS)} size="sm">
                  Create Role Now
                </Button>
              </div>
            )}
          </div>

          {/* Candidates Requiring Verification Queue */}
          <div className="pt-4 space-y-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Candidates Requiring Verification ({data?.candidates_requiring_verification?.length || 0})
              </h3>
            </div>

            {data?.candidates_requiring_verification?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.candidates_requiring_verification.map((cand, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigate(`/recruiter/candidates/${cand.candidate_id}`)}
                    className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Candidate #{cand.candidate_id?.slice(-6) || idx + 1}
                      </span>
                      <span className="text-[11px] text-amber-700 dark:text-amber-400 block mt-0.5">
                        Verify: {cand.unverified_skills?.join(', ') || 'Core skill depth'}
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      {cand.overall_fit}% Fit
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                All high-fit applicants currently have their critical technical claims verified by code repositories or certificates.
              </p>
            )}
          </div>
        </div>

        {/* Right: Pipeline Funnel & Activity */}
        <div className="space-y-6">
          {/* Pipeline Stage Breakdown */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>Hiring Pipeline</span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Stage Distribution</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {Object.entries(data?.pipeline_breakdown || {}).slice(0, 6).map(([stage, count]) => {
                const total = Math.max(totalApplicants, 1);
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={stage} className="space-y-1">
                    <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                      <span className="capitalize">{stage.replace('_', ' ')}</span>
                      <span>{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Skill Shortage Radar */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
            <span className="text-sm font-bold text-slate-900 dark:text-white block">
              Talent Pool Skill Shortages
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Common missing skills across applicant pool based on job blueprint comparisons:
            </p>
            <div className="space-y-2">
              {data?.skill_shortage_insights?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.skill}</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold text-[11px]">{item.gap_frequency}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
            <span className="text-sm font-bold text-slate-900 dark:text-white block">
              Recent Recruiter Activity
            </span>
            <div className="space-y-3 text-xs">
              {data?.recent_activity?.slice(0, 4).map((act, idx) => (
                <div key={idx} className="flex items-start space-x-2.5 text-slate-600 dark:text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block capitalize">
                      {act.action?.toLowerCase().replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
