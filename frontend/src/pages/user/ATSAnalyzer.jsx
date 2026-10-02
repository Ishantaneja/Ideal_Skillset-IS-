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
  Wand2,
  Copy,
  Download,
  Check,
  Edit3,
  X,
  FileCheck,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useNotification, useDocumentTitle } from '@/hooks';
import { resumeService, jobService, atsService } from '@/services';
import { ROUTES } from '@/utils/constants';

export default function ATSAnalyzer() {
  useDocumentTitle('Explainable ATS Matcher');
  const notify = useNotification();
  const location = useLocation();

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

  // Resume Tailoring Studio State
  const [tailoring, setTailoring] = useState(false);
  const [tailoredResult, setTailoredResult] = useState(null);
  const [tailoredText, setTailoredText] = useState('');
  const [showTailorModal, setShowTailorModal] = useState(false);
  const [savingTailored, setSavingTailored] = useState(false);
  const [tailorTab, setTailorTab] = useState('overview'); // 'overview' | 'bullets' | 'editor' | 'diff'
  const [saveTitle, setSaveTitle] = useState('');
  const [setActiveOnSave, setSetActiveOnSave] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [originalResumeText, setOriginalResumeText] = useState('');

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

      // Check router state or auto-select active resume & first job
      const stateResumeId = location.state?.selectedResumeId;
      const stateJobId = location.state?.selectedJobId;

      if (stateResumeId && resumeItems.some((r) => r.id === stateResumeId)) {
        setSelectedResumeId(stateResumeId);
      } else {
        const activeRes = resumeItems.find((r) => r.is_active) || resumeItems[0];
        if (activeRes) setSelectedResumeId(activeRes.id);
      }

      if (stateJobId && jobItems.some((j) => j.id === stateJobId)) {
        setSelectedJobId(stateJobId);
      } else if (jobItems.length > 0) {
        setSelectedJobId(jobItems[0].id);
      }

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

  const handleStartTailoring = async () => {
    const rId = selectedResumeId || activeReport?.resume_id;
    const jId = selectedJobId || activeReport?.job_id;

    if (!rId || !jId) {
      notify.error('Please select both a resume and a job description to tailor your resume.');
      return;
    }

    try {
      setTailoring(true);
      // Fetch original resume text for side-by-side comparison
      const [tailorRes, origDoc] = await Promise.all([
        atsService.tailorResume(rId, jId),
        resumeService.getResume(rId).catch(() => null),
      ]);

      setTailoredResult(tailorRes);
      setTailoredText(tailorRes.tailored_resume_text || '');
      setOriginalResumeText(origDoc?.extracted_text || '');
      setSaveTitle(`Tailored - ${tailorRes.job_title || 'Optimized'}`);
      setTailorTab('overview');
      setShowTailorModal(true);
      notify.success(`Resume tailored! Projected ATS score improved by +${tailorRes.score_gain}%`);
    } catch (err) {
      notify.error(err.message || 'Failed to tailor resume for this job description');
    } finally {
      setTailoring(false);
    }
  };

  const handleSaveTailored = async (setActive = true) => {
    if (!tailoredResult || !tailoredText.trim()) return;

    try {
      setSavingTailored(true);
      const rId = selectedResumeId || activeReport?.resume_id;
      const jId = selectedJobId || activeReport?.job_id;

      const saveRes = await atsService.saveTailoredResume({
        original_resume_id: rId,
        job_id: jId,
        tailored_text: tailoredText,
        title: saveTitle.trim() || `Tailored - ${tailoredResult.job_title}`,
        set_active: setActive,
      });

      notify.success(
        setActive
          ? 'Tailored resume saved and activated as your active resume!'
          : 'Tailored resume saved to your resume library!'
      );

      // Refresh resumes and re-run ATS analysis
      const updatedResumes = await resumeService.getResumes().catch(() => ({ items: [] }));
      const items = updatedResumes.items || [];
      setResumes(items);

      if (setActive && saveRes.resume_id) {
        setSelectedResumeId(saveRes.resume_id);
        try {
          const newReport = await atsService.analyzeMatch(saveRes.resume_id, jId);
          setActiveReport(newReport);
          const updatedHistory = await atsService.getResults().catch(() => ({ items: [] }));
          setHistory(updatedHistory.items || []);
        } catch (_) {}
      }
      setShowTailorModal(false);
    } catch (err) {
      notify.error(err.message || 'Could not save tailored resume');
    } finally {
      setSavingTailored(false);
    }
  };

  const handleCopyText = async () => {
    if (!tailoredText) return;
    try {
      await navigator.clipboard.writeText(tailoredText);
      setCopied(true);
      notify.success('Tailored resume copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      notify.error('Could not copy to clipboard');
    }
  };

  const handleDownloadText = () => {
    if (!tailoredText) return;
    const blob = new Blob([tailoredText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${saveTitle || 'tailored_resume'}.txt`.replace(/[^a-zA-Z0-9_.-]/g, '_');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify.info('Tailored resume downloaded as plain text.');
  };

  const handleDownloadPdf = async () => {
    if (!tailoredText) return;
    try {
      setDownloadingPdf(true);
      await atsService.downloadTailoredPdf(tailoredText, saveTitle || 'tailored_resume');
      notify.success('ATS-compliant PDF resume downloaded successfully!');
    } catch (err) {
      notify.error(err.message || 'Could not generate PDF resume');
    } finally {
      setDownloadingPdf(false);
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

          {/* Match CTA & Tailor Action Buttons */}
          <div className="md:col-span-2 flex flex-col gap-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full justify-center text-xs font-bold py-2 rounded-xl shadow-xs"
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
            <button
              type="button"
              disabled={tailoring || !selectedResumeId || !selectedJobId}
              onClick={handleStartTailoring}
              className="w-full py-1.5 px-2 rounded-xl text-xs font-bold border border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
            >
              {tailoring ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin text-purple-600 dark:text-purple-400" />
                  Tailoring...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-600 dark:text-purple-400" />
                  ✨ Tailor Resume
                </>
              )}
            </button>
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

              {/* AI Resume Tailoring Action Callout */}
              <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-700 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                    <span>AI Resume Tailoring Studio</span>
                    <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                      Instant ATS Boost
                    </span>
                  </div>
                  <p className="text-xs text-white/85 max-w-xl leading-relaxed">
                    Auto-adapt your resume to match this position: inject missing domain keywords, rewrite bullet points with quantified STAR impact, and boost your compatibility rating.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={tailoring}
                  onClick={handleStartTailoring}
                  className="bg-white hover:bg-slate-100 text-brand-700 font-bold px-4 py-2.5 rounded-xl shadow-xs text-xs flex items-center justify-center shrink-0 whitespace-nowrap transition-transform active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  {tailoring ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin text-brand-600" /> Optimizing Resume...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5 mr-1.5 text-purple-600" /> ✨ Tailor Resume for this Job
                    </>
                  )}
                </button>
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
                {/* Quick Auto-Tailor Action Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/40 via-brand-900/30 to-slate-900 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      Auto-Apply Resume Improvements
                    </span>
                    <p className="text-slate-300 text-[11px]">
                      Don't want to rewrite manually? The AI Resume Tailoring Studio rewrites your experience bullets with STAR metrics and incorporates missing required keywords instantly.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={tailoring}
                    onClick={handleStartTailoring}
                    className="shrink-0 rounded-xl px-4 py-2 font-bold text-xs shadow-sm bg-gradient-to-r from-brand-600 to-purple-600 hover:opacity-95"
                  >
                    <Wand2 className="w-3.5 h-3.5 mr-1.5" /> Tailor Resume Now
                  </Button>
                </div>

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

      {/* AI Resume Tailoring Studio Modal */}
      {showTailorModal && tailoredResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      AI Resume Tailoring Studio
                    </h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      +{tailoredResult.score_gain}% ATS Boost
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Optimized for: <strong className="text-slate-700 dark:text-slate-300">{tailoredResult.job_title}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTailorModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close Studio"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Before vs After Score Banner */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
              <div className="flex items-center space-x-6 sm:space-x-8">
                {/* Original Baseline Score */}
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Baseline Score</span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-300">
                    {Math.round(tailoredResult.original_score)}%
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{tailoredResult.original_label}</span>
                </div>

                {/* Transformation Arrow */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold shadow-xs">
                    <TrendingUp className="w-4 h-4" />
                    <span>+{tailoredResult.score_gain}%</span>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider text-emerald-300/80 mt-1 font-semibold">AI Optimized</span>
                </div>

                {/* Optimized Score */}
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Optimized Score</span>
                  <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">
                    {Math.round(tailoredResult.optimized_score)}%
                  </div>
                  <span className="text-[10px] text-emerald-300 font-bold">{tailoredResult.optimized_label}</span>
                </div>
              </div>

              {/* Quick Pills */}
              <div className="flex flex-wrap gap-2 text-xs">
                <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span><strong>{tailoredResult.skills_added?.length || 0}</strong> Skills Added</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span><strong>{tailoredResult.rewritten_bullet_points?.length || 0}</strong> STAR Bullets</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-brand-300" />
                  <span><strong>{tailoredResult.keywords_injected?.length || 0}</strong> Keywords Injected</span>
                </div>
              </div>
            </div>

            {/* Studio Navigation Tabs */}
            <div className="px-6 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2 pt-2 bg-white dark:bg-slate-900 overflow-x-auto">
              <button
                onClick={() => setTailorTab('overview')}
                className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                  tailorTab === 'overview'
                    ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> Optimization Overview
              </button>
              <button
                onClick={() => setTailorTab('bullets')}
                className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                  tailorTab === 'bullets'
                    ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" /> STAR Bullet Rewrites ({tailoredResult.rewritten_bullet_points?.length || 0})
              </button>
              <button
                onClick={() => setTailorTab('editor')}
                className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                  tailorTab === 'editor'
                    ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" /> Full Resume Text Editor
              </button>
              <button
                onClick={() => setTailorTab('diff')}
                className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                  tailorTab === 'diff'
                    ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Side-by-Side Comparison
              </button>
            </div>

            {/* Modal Body Content (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50 dark:bg-slate-950/40">
              {/* TAB 1: OVERVIEW */}
              {tailorTab === 'overview' && (
                <div className="space-y-6">
                  {/* Dimension Improvement Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Required Skills</span>
                      <div className="flex items-baseline space-x-2 mt-1">
                        <span className="text-xs text-slate-400 line-through">
                          {Math.round(tailoredResult.original_breakdown.required_skills)}%
                        </span>
                        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                          {Math.round(tailoredResult.optimized_breakdown.required_skills)}%
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Keywords Injected</span>
                      <div className="flex items-baseline space-x-2 mt-1">
                        <span className="text-xs text-slate-400 line-through">
                          {Math.round(tailoredResult.original_breakdown.keywords)}%
                        </span>
                        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                          {Math.round(tailoredResult.optimized_breakdown.keywords)}%
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Preferred Skills</span>
                      <div className="flex items-baseline space-x-2 mt-1">
                        <span className="text-xs text-slate-400 line-through">
                          {Math.round(tailoredResult.original_breakdown.preferred_skills)}%
                        </span>
                        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                          {Math.round(tailoredResult.optimized_breakdown.preferred_skills)}%
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Responsibilities</span>
                      <div className="flex items-baseline space-x-2 mt-1">
                        <span className="text-xs text-slate-400 line-through">
                          {Math.round(tailoredResult.original_breakdown.responsibilities)}%
                        </span>
                        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                          {Math.round(tailoredResult.optimized_breakdown.responsibilities)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Optimization Explanations */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
                      <ShieldCheck className="w-4 h-4 mr-1.5 text-brand-600" />
                      Key ATS Optimizations Applied
                    </h4>
                    <div className="space-y-2">
                      {tailoredResult.tailoring_explanations?.map((exp, idx) => (
                        <div key={idx} className="flex items-start space-x-2.5 text-xs text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{exp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Incorporated Skills & Keywords */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Skills Added */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span className="flex items-center">
                          <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                          Target Skills Incorporated
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                          {tailoredResult.skills_added?.length || 0} skills
                        </span>
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {tailoredResult.skills_added?.map((s, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium"
                          >
                            + {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Keywords Injected */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span className="flex items-center">
                          <Key className="w-4 h-4 mr-1.5 text-brand-600" />
                          ATS Domain Keywords Injected
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 font-semibold">
                          {tailoredResult.keywords_injected?.length || 0} keywords
                        </span>
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {tailoredResult.keywords_injected?.map((k, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-800 dark:text-brand-300 border border-brand-200 dark:border-brand-800 font-medium"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: REWRITTEN BULLETS */}
              {tailorTab === 'bullets' && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <p className="font-semibold text-slate-900 dark:text-white flex items-center">
                      <Sparkles className="w-4 h-4 mr-1.5 text-purple-600" /> STAR (Situation, Task, Action, Result) Rewrite Engine
                    </p>
                    <p className="mt-1 text-[11px]">
                      Each bullet point has been upgraded using strong action verbs, quantifiable business metrics, and target JD keywords while preserving complete factual integrity.
                    </p>
                  </div>

                  {tailoredResult.rewritten_bullet_points?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {item.company} • {item.role}
                        </span>
                        <span className="text-[10px] bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded font-bold border border-purple-200 dark:border-purple-800">
                          STAR Upgraded
                        </span>
                      </div>

                      {/* Original Bullet */}
                      <div className="p-3 bg-red-50/50 dark:bg-red-950/30 rounded-xl border border-red-200/80 dark:border-red-900/60 text-xs">
                        <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 flex items-center mb-1">
                          <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Original Bullet Point
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 font-mono text-[11px] leading-relaxed">
                          {item.original}
                        </p>
                      </div>

                      {/* Optimized Bullet */}
                      <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs">
                        <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 flex items-center mb-1">
                          <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-600" /> ATS-Optimized Bullet Point
                        </span>
                        <p className="text-emerald-950 dark:text-emerald-200 font-medium leading-relaxed text-xs">
                          {item.optimized}
                        </p>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                        {item.action_verb_used && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                            Verb: {item.action_verb_used}
                          </span>
                        )}
                        {item.metric_added && (
                          <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-900">
                            Metric: {item.metric_added}
                          </span>
                        )}
                        {item.keywords_included?.map((kw, kidx) => (
                          <span
                            key={kidx}
                            className="px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold"
                          >
                            JD Key: {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: RESUME EDITOR */}
              {tailorTab === 'editor' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center">
                      <Edit3 className="w-3.5 h-3.5 mr-1" />
                      ATS-Standard Typography & Layout (Clean, Single-Column Format)
                    </span>
                    <div className="flex items-center space-x-3">
                      <span>{tailoredText.length} characters • {tailoredText.split('\n').length} lines</span>
                      <button
                        onClick={() => setTailoredText(tailoredResult.tailored_resume_text || '')}
                        className="text-brand-600 dark:text-brand-400 hover:underline text-[11px] font-semibold"
                      >
                        Reset to AI Version
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={18}
                    value={tailoredText}
                    onChange={(e) => setTailoredText(e.target.value)}
                    className="w-full p-4 font-mono text-xs leading-relaxed border border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-inner"
                    placeholder="Tailored resume text..."
                  />
                </div>
              )}

              {/* TAB 4: SIDE-BY-SIDE DIFF */}
              {tailorTab === 'diff' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Original */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
                      <span>Original Resume Extracted Text</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Score: {Math.round(tailoredResult.original_score)}%
                      </span>
                    </div>
                    <pre className="p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-[11px] font-mono whitespace-pre-wrap max-h-[500px] overflow-y-auto leading-relaxed text-slate-700 dark:text-slate-300">
                      {originalResumeText || 'Original resume text not available.'}
                    </pre>
                  </div>

                  {/* Right: Tailored */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400 px-1">
                      <span className="flex items-center">
                        <Sparkles className="w-3.5 h-3.5 mr-1" /> Tailored & Optimized Resume
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        Score: {Math.round(tailoredResult.optimized_score)}%
                      </span>
                    </div>
                    <pre className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-[11px] font-mono whitespace-pre-wrap max-h-[500px] overflow-y-auto leading-relaxed text-slate-900 dark:text-slate-100">
                      {tailoredText}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Save Resume Title & Active Checkbox */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                  type="text"
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="Resume Title"
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500 w-64 font-medium"
                />
                <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={setActiveOnSave}
                    onChange={(e) => setSetActiveOnSave(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <span>Set as Active Resume Document</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center transition-colors"
                  title="Copy Text to Clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Text
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={downloadingPdf}
                  onClick={handleDownloadPdf}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl border border-red-200 dark:border-red-800/80 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 flex items-center transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
                  title="Download ATS-Compliant PDF Resume"
                >
                  {downloadingPdf ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin text-red-600" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 mr-1.5 text-red-600 dark:text-red-400" />
                      Download PDF
                      <span className="ml-1.5 text-[9px] font-extrabold bg-red-600 text-white px-1.5 py-0.2 rounded uppercase">
                        PDF
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadText}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center transition-colors"
                  title="Download .txt File"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Download .txt
                </button>

                <Button
                  variant="primary"
                  size="sm"
                  disabled={savingTailored}
                  onClick={() => handleSaveTailored(setActiveOnSave)}
                  className="rounded-xl px-4 py-2 font-bold text-xs shadow-md bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:opacity-95"
                >
                  {savingTailored ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4 mr-1.5" /> Save & Apply Tailored Resume
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

