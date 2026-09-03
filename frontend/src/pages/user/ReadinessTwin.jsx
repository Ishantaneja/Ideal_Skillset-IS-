import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, LoadingSpinner, ProgressBar } from '@/components';
import {
  ShieldCheck,
  FileText,
  Briefcase,
  Sparkles,
  RefreshCw,
  Github,
  Globe,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  TrendingUp,
  Brain,
  Wrench,
  Award,
  MessageSquare,
  Milestone,
  Trash2,
  Building2,
  Lightbulb,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotification, useDocumentTitle } from '@/hooks';
import { resumeService, jobService, readinessService } from '@/services';
import { ROUTES } from '@/utils/constants';

export default function ReadinessTwin() {
  useDocumentTitle('Readiness Twin Competency Model');
  const notify = useNotification();

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [history, setHistory] = useState([]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [resumesRes, jobsRes, historyRes] = await Promise.all([
        resumeService.getResumes().catch(() => ({ items: [] })),
        jobService.getJobs().catch(() => ({ items: [] })),
        readinessService.getReadinessReports().catch(() => ({ items: [] })),
      ]);

      const resumeItems = resumesRes.items || [];
      const jobItems = jobsRes.items || [];
      const historyItems = historyRes.items || [];

      setResumes(resumeItems);
      setJobs(jobItems);
      setHistory(historyItems);

      const activeRes = resumeItems.find((r) => r.is_active) || resumeItems[0];
      if (activeRes) setSelectedResumeId(activeRes.id);
      if (jobItems.length > 0) setSelectedJobId(jobItems[0].id);

      if (historyItems.length > 0) {
        fetchAnalysisDetail(historyItems[0].id);
      }
    } catch (err) {
      notify.error(err.message || 'Could not load data for Readiness Twin');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysisDetail = async (analysisId) => {
    try {
      const detail = await readinessService.getReadinessReport(analysisId);
      setActiveAnalysis(detail);
    } catch (err) {
      notify.error('Could not load Readiness Twin details');
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleAnalyze = async (e) => {
    e?.preventDefault();
    if (!selectedResumeId || !selectedJobId) {
      notify.error('Please select both a resume and a target job description.');
      return;
    }

    setAnalyzing(true);
    try {
      const result = await readinessService.analyzeReadiness({
        resume_id: selectedResumeId,
        job_id: selectedJobId,
        github_url: githubUrl.trim() || undefined,
        portfolio_url: portfolioUrl.trim() || undefined,
      });
      setActiveAnalysis(result);
      notify.success('Readiness Twin synthesized across all 5 competency dimensions!');
      const updatedHistory = await readinessService.getReadinessReports().catch(() => ({ items: [] }));
      setHistory(updatedHistory.items || []);
    } catch (err) {
      notify.error(err.message || 'Failed to synthesize Readiness Twin');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteAnalysis = async (analysisId) => {
    if (!window.confirm('Delete this Readiness Twin analysis?')) return;
    try {
      await readinessService.deleteReadinessReport(analysisId);
      notify.info('Readiness Twin analysis deleted');
      if (activeAnalysis?.id === analysisId) {
        setActiveAnalysis(null);
      }
      const updatedHistory = await readinessService.getReadinessReports().catch(() => ({ items: [] }));
      setHistory(updatedHistory.items || []);
    } catch (err) {
      notify.error('Could not delete analysis');
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading AI Readiness Twin Engine..." />;
  }

  const getDimensionIcon = (name) => {
    if (name.includes('Knowledge')) return <Brain className="w-4 h-4 text-brand-600" />;
    if (name.includes('Practical')) return <Wrench className="w-4 h-4 text-purple-600" />;
    if (name.includes('Evidence')) return <Github className="w-4 h-4 text-emerald-600" />;
    if (name.includes('Communication')) return <MessageSquare className="w-4 h-4 text-blue-600" />;
    return <Milestone className="w-4 h-4 text-amber-600" />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <ShieldCheck className="w-6 h-6 text-brand-600 mr-2" /> AI Readiness Twin Model
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Synthesizes multi-source candidate evidence into a 5D quotient to answer: <em>"Can you actually perform this job?"</em>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link to={ROUTES.ROADMAP}>
            <Button variant="outline" size="sm">
              <Milestone className="w-3.5 h-3.5 mr-1" /> View Career Roadmap
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={loadInitialData}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Selectors Card */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center">
                <FileText className="w-3.5 h-3.5 mr-1 text-slate-400" /> Select Resume
              </label>
              {resumes.length === 0 ? (
                <div className="text-xs text-slate-500 p-2 border border-dashed rounded-lg bg-slate-50 flex justify-between">
                  <span>No resumes</span>
                  <Link to={ROUTES.RESUME} className="text-brand-600 font-bold hover:underline">Upload →</Link>
                </div>
              ) : (
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.original_filename} {r.is_active ? '★ (Active)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="md:col-span-5 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center">
                <Briefcase className="w-3.5 h-3.5 mr-1 text-slate-400" /> Select Target Job Description
              </label>
              {jobs.length === 0 ? (
                <div className="text-xs text-slate-500 p-2 border border-dashed rounded-lg bg-slate-50 flex justify-between">
                  <span>No jobs</span>
                  <Link to={ROUTES.JOB_ANALYSIS} className="text-brand-600 font-bold hover:underline">Analyze JD →</Link>
                </div>
              ) : (
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.job_title} {j.company_name ? `• ${j.company_name}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="md:col-span-3">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full justify-center text-xs font-bold py-2 rounded-xl"
                disabled={analyzing || !selectedResumeId || !selectedJobId}
              >
                {analyzing ? <>Synthesizing Twin...</> : <><Sparkles className="w-4 h-4 mr-1.5" /> Evaluate Readiness</>}
              </Button>
            </div>
          </div>

          {/* Optional Verifiable Proof URLs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 flex items-center">
                <Github className="w-3.5 h-3.5 mr-1 text-slate-400" /> GitHub Repository / Profile URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://github.com/username/project"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 flex items-center">
                <Globe className="w-3.5 h-3.5 mr-1 text-slate-400" /> Live Demo / Portfolio Link (Optional)
              </label>
              <input
                type="url"
                placeholder="https://my-dashboard.vercel.app"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          </div>
        </form>
      </Card>

      {/* Main Readiness Twin Dashboard */}
      {activeAnalysis ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Hero Verdict & Contrast Card */}
          <div className="lg:col-span-5 space-y-6">
            {/* Verdict Hero Card */}
            <Card className="p-6 text-center space-y-4 bg-gradient-to-b from-white to-slate-50 border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Verified Readiness Quotient</span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">{activeAnalysis.job_title}</h2>
                {activeAnalysis.company_name && (
                  <p className="text-xs text-slate-500 flex items-center justify-center mt-0.5">
                    <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" /> {activeAnalysis.company_name}
                  </p>
                )}
              </div>

              {/* Big Circular Quotient Indicator */}
              <div className="relative inline-flex items-center justify-center">
                <div
                  className={`w-36 h-36 rounded-full flex flex-col items-center justify-center border-8 shadow-inner ${
                    activeAnalysis.verdict.verdict_color === 'emerald'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                      : activeAnalysis.verdict.verdict_color === 'brand'
                      ? 'border-brand-500 bg-brand-50 text-brand-950'
                      : activeAnalysis.verdict.verdict_color === 'amber'
                      ? 'border-amber-500 bg-amber-50 text-amber-950'
                      : 'border-rose-500 bg-rose-50 text-rose-950'
                  }`}
                >
                  <span className="text-4xl font-black tracking-tight">
                    {Math.round(activeAnalysis.overall_readiness_score)}%
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                    Readiness
                  </span>
                </div>
              </div>

              {/* Verdict Badge */}
              <div>
                <span
                  className={`inline-block text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                    activeAnalysis.verdict.verdict_color === 'emerald'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : activeAnalysis.verdict.verdict_color === 'brand'
                      ? 'bg-brand-100 text-brand-800 border-brand-300'
                      : activeAnalysis.verdict.verdict_color === 'amber'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}
                >
                  {activeAnalysis.verdict.verdict_label}
                </span>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed text-left bg-white p-3 rounded-xl border border-slate-200">
                  {activeAnalysis.verdict.summary_explanation}
                </p>
              </div>
            </Card>

            {/* ATS Match vs. Real-World Readiness Comparison */}
            <Card
              title="ATS Match vs. Real-World Readiness"
              subtitle="The difference between keyword overlap and verified ability"
            >
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-400">ATS Resume Match</span>
                    <div className="text-2xl font-extrabold text-slate-800 mt-0.5">
                      {Math.round(activeAnalysis.verdict.ats_match_score)}%
                    </div>
                    <span className="text-[10px] text-slate-500">Textual Overlap</span>
                  </div>
                  <div className="p-3 bg-brand-50 rounded-xl border border-brand-200">
                    <span className="text-[10px] font-bold uppercase text-brand-700">Readiness Twin</span>
                    <div className="text-2xl font-extrabold text-brand-700 mt-0.5">
                      {Math.round(activeAnalysis.verdict.overall_readiness_score)}%
                    </div>
                    <span className="text-[10px] text-brand-600">Demonstrated Ability</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 leading-relaxed text-slate-700">
                  <p>{activeAnalysis.verdict.candid_comparison_summary}</p>
                </div>
              </div>
            </Card>

            {/* Past Analyses History */}
            <Card title="Past Readiness Analyses" subtitle={`${history.length} saved evaluations`}>
              {history.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No past analyses generated.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        item.id === activeAnalysis.id
                          ? 'bg-brand-50/60 border-brand-300 shadow-2xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className="cursor-pointer flex-1 mr-2 overflow-hidden"
                        onClick={() => fetchAnalysisDetail(item.id)}
                      >
                        <h4 className="font-bold text-slate-900 truncate">{item.job_title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          Readiness: {Math.round(item.overall_readiness_score)}% • ATS: {Math.round(item.ats_match_score)}%
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteAnalysis(item.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: 5 Dimensions & Action Matrix */}
          <div className="lg:col-span-7 space-y-6">
            {/* 5-Dimensional Breakdown */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-xs">
                5-Dimensional Competency Breakdown
              </h2>

              {activeAnalysis.breakdown_list.map((dim, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {getDimensionIcon(dim.name)}
                        <h3 className="text-sm font-bold text-slate-900">{dim.name}</h3>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            dim.status_color === 'emerald'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : dim.status_color === 'amber'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {dim.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">({dim.weight_percentage}% Weight)</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{dim.notes}</p>
                    </div>

                    <div className="text-right shrink-0 ml-4">
                      <span className="text-xl font-black text-slate-900">{Math.round(dim.score)}%</span>
                      <p className="text-[10px] text-slate-400">Target: {Math.round(dim.benchmark)}%</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        dim.status_color === 'emerald'
                          ? 'bg-emerald-500'
                          : dim.status_color === 'amber'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>

                  {/* Strengths & Gaps */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                    {dim.strengths?.length > 0 && (
                      <div className="space-y-1">
                        <strong className="text-emerald-700 font-bold block">Demonstrated Strengths:</strong>
                        <ul className="space-y-0.5 text-slate-600 list-disc list-inside">
                          {dim.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {dim.gaps?.length > 0 && (
                      <div className="space-y-1">
                        <strong className="text-rose-700 font-bold block">Key Areas for Polish:</strong>
                        <ul className="space-y-0.5 text-slate-600 list-disc list-inside">
                          {dim.gaps.map((g, i) => (
                            <li key={i}>{g}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* "Should I Apply Now?" Decision Matrix Card */}
            <Card
              title="Next Action Steps Before Applying"
              subtitle="Prioritized recommendations to maximize interview success"
              className="border-brand-200 bg-brand-50/20"
            >
              <div className="space-y-3 text-xs">
                <div className="space-y-2">
                  {activeAnalysis.verdict.top_actions_before_applying.map((action, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700 flex items-start space-x-2.5 shadow-2xs"
                    >
                      <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{action}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-200">
                  <Link to={ROUTES.ROADMAP} className="flex-1">
                    <Button variant="primary" size="md" className="w-full justify-center text-xs font-bold">
                      Open Step-by-Step Career Roadmap <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                  <Link to={ROUTES.INTERVIEW} className="flex-1">
                    <Button variant="outline" size="md" className="w-full justify-center text-xs font-bold">
                      Launch Mock Interview Simulator
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* Empty State */
        <Card className="text-center py-16 px-6 border-dashed border-2 border-slate-200">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Readiness Twin evaluation yet</h3>
            <p className="text-xs text-slate-500">
              Select an uploaded resume and target job description above to synthesize your 5-dimensional candidate competency model.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
