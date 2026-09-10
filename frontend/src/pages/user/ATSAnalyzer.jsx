import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, LoadingSpinner, ProgressBar } from '@/components';
import {
  Target,
  FileText,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Star,
  Clock,
  GraduationCap,
  ListChecks,
  Key,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Trash2,
  ChevronRight,
  ShieldCheck,
  PlusCircle,
  HelpCircle,
  ArrowRight,
  Building2,
  Layers,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotification, useDocumentTitle } from '@/hooks';
import { resumeService, jobService, atsService } from '@/services';
import { ROUTES } from '@/utils/constants';

export default function ATSAnalyzer() {
  useDocumentTitle('Explainable ATS Matcher');
  const notify = useNotification();

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [activeReport, setActiveReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('skills'); // 'skills' | 'exp_edu' | 'responsibilities' | 'keywords' | 'improvements' | 'what_if'

  // Interactive What-If simulation state
  const [simulatedSkills, setSimulatedSkills] = useState([]);
  const [simulatedResult, setSimulatedResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  // Load user resumes, jobs, and previous ATS reports
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [resumesRes, jobsRes, historyRes] = await Promise.all([
        resumeService.getResumes().catch(() => ({ items: [] })),
        jobService.getJobs().catch(() => ({ items: [] })),
        atsService.getResults().catch(() => ({ items: [] })),
      ]);

      const resumeItems = resumesRes.items || [];
      const jobItems = jobsRes.items || [];
      const historyItems = historyRes.items || [];

      setResumes(resumeItems);
      setJobs(jobItems);
      setHistory(historyItems);

      // Auto-select active resume & first job if available
      const activeRes = resumeItems.find((r) => r.is_active) || resumeItems[0];
      if (activeRes) setSelectedResumeId(activeRes.id);
      if (jobItems.length > 0) setSelectedJobId(jobItems[0].id);

      // Load latest ATS report if available
      if (historyItems.length > 0) {
        fetchReportDetail(historyItems[0].id);
      }
    } catch (err) {
      notify.error(err.message || 'Could not load data for ATS matcher');
    } finally {
      setLoading(false);
    }
  };

  const fetchReportDetail = async (reportId) => {
    try {
      const detail = await atsService.getResult(reportId);
      setActiveReport(detail);
      setSimulatedSkills([]);
      setSimulatedResult(null);
    } catch (err) {
      notify.error('Could not load ATS report details');
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleRunAnalysis = async (e) => {
    e?.preventDefault();
    if (!selectedResumeId || !selectedJobId) {
      notify.error('Please select both a resume and a job description to analyze compatibility.');
      return;
    }

    setAnalyzing(true);
    try {
      const result = await atsService.analyzeMatch(selectedResumeId, selectedJobId);
      setActiveReport(result);
      setSimulatedSkills([]);
      setSimulatedResult(null);
      notify.success('ATS compatibility report generated successfully!');
      // Refresh history list
      const updatedHistory = await atsService.getResults().catch(() => ({ items: [] }));
      setHistory(updatedHistory.items || []);
    } catch (err) {
      notify.error(err.message || 'Failed to generate ATS compatibility report');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this ATS analysis report?')) return;
    try {
      await atsService.deleteResult(reportId);
      notify.info('ATS report deleted');
      if (activeReport?.id === reportId) {
        setActiveReport(null);
      }
      const updatedHistory = await atsService.getResults().catch(() => ({ items: [] }));
      setHistory(updatedHistory.items || []);
    } catch (err) {
      notify.error(err.message || 'Could not delete ATS report');
    }
  };

  const handleToggleSimulationSkill = async (skillName) => {
    let updated;
    if (simulatedSkills.includes(skillName)) {
      updated = simulatedSkills.filter((s) => s !== skillName);
    } else {
      updated = [...simulatedSkills, skillName];
    }
    setSimulatedSkills(updated);

    if (updated.length === 0) {
      setSimulatedResult(null);
      return;
    }

    try {
      setSimulating(true);
      const res = await atsService.simulateScore(activeReport.resume_id, activeReport.job_id, updated);
      setSimulatedResult(res);
    } catch (err) {
      notify.error('Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading Explainable ATS Engine..." />;
  }

  // Helper for score badge colors
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 65) return 'text-brand-700 bg-brand-50 border-brand-200';
    if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  const getProgressColor = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 65) return 'bg-brand-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Target className="w-6 h-6 text-brand-600 mr-2" /> Explainable ATS Compatibility
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic, multi-factor matching comparing your structured resume against job requirements with verified evidence.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadInitialData}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Selectors Bar */}
      <Card className="shadow-sm">
        <form onSubmit={handleRunAnalysis} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Resume Selector */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center">
              <FileText className="w-3.5 h-3.5 mr-1 text-slate-400" /> Select Resume
            </label>
            {resumes.length === 0 ? (
              <div className="text-xs text-slate-500 dark:text-slate-400 p-2 border border-dashed rounded-lg bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span>No resumes uploaded yet</span>
                <Link to={ROUTES.RESUME} className="text-brand-600 dark:text-brand-400 font-bold hover:underline">
                  Upload Resume →
                </Link>
              </div>
            ) : (
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.original_filename} {r.is_active ? '★ (Active Document)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Job Selector */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center">
              <Briefcase className="w-3.5 h-3.5 mr-1 text-slate-400" /> Select Target Job Description
            </label>
            {jobs.length === 0 ? (
              <div className="text-xs text-slate-500 dark:text-slate-400 p-2 border border-dashed rounded-lg bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span>No jobs analyzed yet</span>
                <Link to={ROUTES.JOB_ANALYSIS} className="text-brand-600 dark:text-brand-400 font-bold hover:underline">
                  Analyze JD →
                </Link>
              </div>
            ) : (
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.job_title} {j.company_name ? `• ${j.company_name}` : ''} ({j.required_skills_count} req skills)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Match CTA Button */}
          <div className="md:col-span-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full justify-center text-xs font-bold py-2 rounded-xl"
              disabled={analyzing || !selectedResumeId || !selectedJobId}
            >
              {analyzing ? (
                <>Computing Match...</>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-1.5" /> Analyze Match
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Main Results Dashboard */}
      {activeReport ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* History Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card title="Previous ATS Reports" subtitle={`${history.length} saved matching comparisons`}>
              {history.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">No previous matching analyses.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                        item.id === activeReport.id
                          ? 'bg-brand-50/60 dark:bg-brand-950/60 border-brand-300 dark:border-brand-700 shadow-2xs'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <div
                        className="cursor-pointer overflow-hidden flex-1 mr-2"
                        onClick={() => fetchReportDetail(item.id)}
                      >
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-slate-900 dark:text-white truncate">{item.job_title}</h4>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getScoreColor(item.score)}`}>
                            {Math.round(item.score)}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {item.company_name || 'Target Role'} • {item.resume_filename}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteReport(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                        title="Delete ATS Report"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Central Scoring Weights Card */}
            <Card title="ATS Dimension Weights" subtitle="Deterministic, transparent scoring formula">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Required Technical Skills</span>
                  <span className="font-bold text-slate-900">35%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Experience Alignment</span>
                  <span className="font-bold text-slate-900">20%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Job Deliverables / Responsibilities</span>
                  <span className="font-bold text-slate-900">15%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Preferred Bonus Skills</span>
                  <span className="font-bold text-slate-900">10%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Education & Degree Alignment</span>
                  <span className="font-bold text-slate-900">10%</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 font-medium">Domain & Technical Keywords</span>
                  <span className="font-bold text-slate-900">10%</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Detailed Match Report */}
          <div className="lg:col-span-8 space-y-6">
            {/* Top Score Banner */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{activeReport.job_title}</h2>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${getScoreColor(activeReport.score)}`}>
                      {activeReport.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    {activeReport.company_name && (
                      <span className="flex items-center font-semibold text-slate-700 dark:text-slate-300">
                        <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" /> {activeReport.company_name}
                      </span>
                    )}
                    <span className="flex items-center">
                      <FileText className="w-3.5 h-3.5 mr-1 text-slate-400" /> Matched with: {activeReport.resume_filename}
                    </span>
                  </div>
                </div>

                {/* Score Number Badge */}
                <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0 text-center">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">ATS Match Score</span>
                    <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      {Math.round(activeReport.score)}
                      <span className="text-base font-normal text-slate-400">/100</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6 Dimension Breakdown Bars */}
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="flex justify-between mb-1 text-[11px]">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Required Skills (35%)</span>
                    <span className="font-bold text-slate-900 dark:text-white">{Math.round(activeReport.breakdown.required_skills)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${getProgressColor(activeReport.breakdown.required_skills)}`}
                      style={{ width: `${activeReport.breakdown.required_skills}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 text-[11px]">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Preferred Skills (10%)</span>
                    <span className="font-bold text-slate-900 dark:text-white">{Math.round(activeReport.breakdown.preferred_skills)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${getProgressColor(activeReport.breakdown.preferred_skills)}`}
                      style={{ width: `${activeReport.breakdown.preferred_skills}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 text-[11px]">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Experience (20%)</span>
                    <span className="font-bold text-slate-900 dark:text-white">{Math.round(activeReport.breakdown.experience)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${getProgressColor(activeReport.breakdown.experience)}`}
                      style={{ width: `${activeReport.breakdown.experience}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 text-[11px]">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Education (10%)</span>
                    <span className="font-bold text-slate-900 dark:text-white">{Math.round(activeReport.breakdown.education)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${getProgressColor(activeReport.breakdown.education)}`}
                      style={{ width: `${activeReport.breakdown.education}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 text-[11px]">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Responsibilities (15%)</span>
                    <span className="font-bold text-slate-900 dark:text-white">{Math.round(activeReport.breakdown.responsibilities)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${getProgressColor(activeReport.breakdown.responsibilities)}`}
                      style={{ width: `${activeReport.breakdown.responsibilities}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 text-[11px]">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Keywords (10%)</span>
                    <span className="font-bold text-slate-900 dark:text-white">{Math.round(activeReport.breakdown.keywords)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${getProgressColor(activeReport.breakdown.keywords)}`}
                      style={{ width: `${activeReport.breakdown.keywords}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setActiveTab('skills')}
                className={`flex items-center px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                  activeTab === 'skills' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Target className="w-3.5 h-3.5 mr-1.5" /> Skills Match ({activeReport.skills.matched_required.length}/{activeReport.skills.matched_required.length + activeReport.skills.missing_required.length})
              </button>

              <button
                onClick={() => setActiveTab('exp_edu')}
                className={`flex items-center px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                  activeTab === 'exp_edu' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5 mr-1.5" /> Experience & Education
              </button>

              <button
                onClick={() => setActiveTab('responsibilities')}
                className={`flex items-center px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                  activeTab === 'responsibilities' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5 mr-1.5" /> Responsibilities ({activeReport.responsibilities.matched_count}/{activeReport.responsibilities.total_count})
              </button>

              <button
                onClick={() => setActiveTab('keywords')}
                className={`flex items-center px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                  activeTab === 'keywords' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Key className="w-3.5 h-3.5 mr-1.5" /> Keywords ({activeReport.keywords.matched.length})
              </button>

              <button
                onClick={() => setActiveTab('improvements')}
                className={`flex items-center px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                  activeTab === 'improvements' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Honest Recommendations ({activeReport.top_improvements.length})
              </button>

              <button
                onClick={() => setActiveTab('what_if')}
                className={`flex items-center px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                  activeTab === 'what_if' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> What-If Simulator
              </button>
            </div>

            {/* TAB 1: SKILLS MATCH */}
            {activeTab === 'skills' && (
              <div className="space-y-6">
                {/* Matched Required Skills */}
                <Card
                  title={`Matched Required Skills (${activeReport.skills.matched_required.length})`}
                  subtitle="Verified mandatory competencies found in your resume with excerpted evidence"
                >
                  {activeReport.skills.matched_required.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No required skills matched.</p>
                  ) : (
                    <div className="space-y-3">
                      {activeReport.skills.matched_required.map((m, idx) => (
                        <div key={idx} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-900 flex items-center">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1.5" /> {m.skill}
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                              {m.category}
                            </span>
                          </div>
                          {m.evidence && (
                            <p className="text-slate-600 text-[11px] italic pl-5">
                              "{m.evidence}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Missing Required Skills */}
                <Card
                  title={`Missing Required Skills (${activeReport.skills.missing_required.length})`}
                  subtitle="Mandatory position prerequisites currently not represented in your resume"
                >
                  {activeReport.skills.missing_required.length === 0 ? (
                    <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-800 font-semibold flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                      Congratulations! You match 100% of the required technical skills for this position.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeReport.skills.missing_required.map((miss, idx) => (
                        <div key={idx} className="p-3 bg-red-50/40 rounded-xl border border-red-200 text-xs flex items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-red-900 flex items-center">
                              <AlertTriangle className="w-4 h-4 text-red-500 mr-1.5 shrink-0" /> {miss.skill}
                            </span>
                            <p className="text-[11px] text-slate-600 pl-5">{miss.reason}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-1 rounded border border-brand-200">
                              +{miss.potential_score_gain} pts gain
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Preferred Skills */}
                <Card
                  title={`Preferred & Bonus Skills (${activeReport.skills.matched_preferred.length} matched, ${activeReport.skills.missing_preferred.length} missing)`}
                  subtitle="Beneficial qualifications that enhance candidate ranking"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Matched Preferred */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-700">Matched Preferred</h4>
                      {activeReport.skills.matched_preferred.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">None matched</p>
                      ) : (
                        activeReport.skills.matched_preferred.map((p, idx) => (
                          <div key={idx} className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-xs font-semibold text-amber-900 flex items-center">
                            <Star className="w-3.5 h-3.5 text-amber-500 mr-1.5" /> {p.skill}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Missing Preferred */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-700">Missing Preferred</h4>
                      {activeReport.skills.missing_preferred.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">None missing</p>
                      ) : (
                        activeReport.skills.missing_preferred.map((p, idx) => (
                          <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                            <span>{p.skill}</span>
                            <span className="text-[10px] text-slate-400">+{p.potential_score_gain} pts</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* TAB 2: EXPERIENCE & EDUCATION */}
            {activeTab === 'exp_edu' && (
              <div className="space-y-6">
                {/* Experience Match */}
                <Card title="Experience & Seniority Evaluation" subtitle="Comparison of industry years against role requirements">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-brand-600" />
                        <span className="font-bold text-slate-900 text-sm">Experience Compatibility</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${activeReport.experience.match ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                        {activeReport.experience.match ? '✓ Meets Requirement' : '⚠ Seniority Gap'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-200 text-center">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Job Requirement</p>
                        <p className="text-base font-extrabold text-slate-900 mt-0.5">
                          {activeReport.experience.required_years ? `${activeReport.experience.required_years}+ years` : 'Entry-Level'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Candidate Experience</p>
                        <p className="text-base font-extrabold text-slate-900 mt-0.5">
                          {activeReport.experience.candidate_years} years
                        </p>
                      </div>
                    </div>

                    <p className="text-slate-600 leading-relaxed">
                      {activeReport.experience.explanation}
                    </p>
                  </div>
                </Card>

                {/* Education Match */}
                <Card title="Education & Academic Alignment" subtitle="Degree levels and field of study verification">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4 text-brand-600" />
                        <span className="font-bold text-slate-900 text-sm">Academic Prerequisite</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${activeReport.education.match ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                        {activeReport.education.match ? '✓ Aligned' : 'Discipline Gap'}
                      </span>
                    </div>

                    <p className="text-slate-600 leading-relaxed">
                      {activeReport.education.explanation}
                    </p>
                  </div>
                </Card>
              </div>
            )}

            {/* TAB 3: RESPONSIBILITIES */}
            {activeTab === 'responsibilities' && (
              <Card
                title={`Responsibility Deliverables (${activeReport.responsibilities.matched_count}/${activeReport.responsibilities.total_count} covered)`}
                subtitle="Verification of day-to-day job duties against your project and work history deliverables"
              >
                {activeReport.responsibilities.items.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No specific responsibility deliverables specified in this JD.</p>
                ) : (
                  <div className="space-y-3">
                    {activeReport.responsibilities.items.map((resp, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border text-xs space-y-2 ${
                          resp.match_status === 'strong_match'
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : resp.match_status === 'partial_match'
                            ? 'bg-amber-50/40 border-amber-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-900 flex items-start">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0 mr-2 mt-0.5">
                              {idx + 1}
                            </span>
                            {resp.job_responsibility}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                              resp.match_status === 'strong_match'
                                ? 'bg-emerald-100 text-emerald-800'
                                : resp.match_status === 'partial_match'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {resp.match_status === 'strong_match' ? 'Strong Match' : resp.match_status === 'partial_match' ? 'Partial Match' : 'Missing Evidence'}
                          </span>
                        </div>

                        <div className="pl-7 text-[11px] text-slate-600 border-t border-slate-200/60 pt-2">
                          <span className="font-semibold text-slate-700">Resume Evidence: </span>
                          <span className="italic">{resp.resume_evidence}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* TAB 4: KEYWORDS */}
            {activeTab === 'keywords' && (
              <Card title="Domain & Technical Keywords" subtitle="Analysis of industry terminology and technology keyword density">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Matched Keywords */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700">Matched Keywords ({activeReport.keywords.matched.length})</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {activeReport.keywords.matched.map((kw, idx) => (
                        <span key={idx} className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                          ✓ {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Keywords */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700">Missing Keywords ({activeReport.keywords.missing.length})</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {activeReport.keywords.missing.map((kw, idx) => (
                        <span key={idx} className="text-[11px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* TAB 5: HONEST RECOMMENDATIONS */}
            {activeTab === 'improvements' && (
              <div className="space-y-6">
                <Card
                  title="High Priority Skills to Develop"
                  subtitle="Prioritized list of missing mandatory requirements ranked by score impact"
                >
                  <div className="space-y-3">
                    {activeReport.top_improvements.map((imp, idx) => (
                      <div key={idx} className="p-4 bg-brand-50/40 rounded-xl border border-brand-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-brand-900">{imp.title}</h4>
                          <span className="text-[10px] font-bold text-brand-700 bg-brand-100 px-2 py-0.5 rounded">
                            +{imp.impact_score} pts potential
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{imp.action}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card
                  title="Ethical Resume Improvements"
                  subtitle="Actionable guidance to make existing verified deliverables and evidence more visible"
                >
                  <div className="space-y-3">
                    {activeReport.resume_improvements.map((imp, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <h4 className="font-bold text-slate-900">{imp.title}</h4>
                        <p className="text-slate-600 leading-relaxed">{imp.action}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* TAB 6: WHAT-IF SIMULATOR */}
            {activeTab === 'what_if' && (
              <Card
                title="Interactive 'What-If?' Score Simulator"
                subtitle="Select missing skills you plan to acquire or demonstrate to see mathematically projected score improvements"
              >
                <div className="space-y-6">
                  {/* Projected Score Header */}
                  <div className="p-6 bg-gradient-to-r from-brand-900 to-slate-900 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-200">Current Score</span>
                      <div className="text-2xl font-bold">{Math.round(activeReport.score)} / 100</div>
                      <p className="text-xs text-slate-300 mt-1">
                        Select skills below to simulate legitimate additions to your verified skillset.
                      </p>
                    </div>

                    <ArrowRight className="w-6 h-6 text-brand-400 hidden sm:block" />

                    <div className="sm:text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Projected Score</span>
                      <div className="text-3xl font-extrabold text-emerald-400">
                        {simulatedResult ? Math.round(simulatedResult.simulated_score) : Math.round(activeReport.score)}
                        <span className="text-base font-normal text-white">/100</span>
                      </div>
                      {simulatedResult && (
                        <p className="text-xs text-emerald-300 font-bold mt-1">
                          +{simulatedResult.score_gain} pts gain ({simulatedResult.simulated_label})
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Missing Skills Selector */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-700">Available Missing Skills to Simulate:</h4>
                    {activeReport.skills.missing_required.length === 0 && activeReport.skills.missing_preferred.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No missing skills to simulate for this role.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeReport.skills.missing_required.map((m, idx) => {
                          const isChecked = simulatedSkills.includes(m.skill);
                          return (
                            <label
                              key={idx}
                              onClick={() => handleToggleSimulationSkill(m.skill)}
                              className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-brand-50/70 dark:bg-brand-950/70 border-brand-300 dark:border-brand-700 shadow-2xs'
                                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                                />
                                <div>
                                  <span className="font-bold text-slate-900 dark:text-white">{m.skill}</span>
                                  <span className="ml-2 text-[10px] text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-950/60 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-900">
                                    Required
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-brand-700 dark:text-brand-300 bg-brand-100/60 dark:bg-brand-900/60 px-2 py-0.5 rounded">
                                +{m.potential_score_gain} pts
                              </span>
                            </label>
                          );
                        })}

                        {activeReport.skills.missing_preferred.map((m, idx) => {
                          const isChecked = simulatedSkills.includes(m.skill);
                          return (
                            <label
                              key={`pref_${idx}`}
                              onClick={() => handleToggleSimulationSkill(m.skill)}
                              className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-brand-50/70 dark:bg-brand-950/70 border-brand-300 dark:border-brand-700 shadow-2xs'
                                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                                />
                                <div>
                                  <span className="font-bold text-slate-900 dark:text-white">{m.skill}</span>
                                  <span className="ml-2 text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-900">
                                    Preferred
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                                +{m.potential_score_gain} pts
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* Empty State */
        <Card className="text-center py-16 px-6 border-dashed border-2 border-slate-200">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Target className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No ATS match report selected</h3>
            <p className="text-xs text-slate-500">
              Select an uploaded resume and analyzed job description above, then click <strong>"Analyze Match"</strong> to generate an explainable compatibility breakdown.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

