import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, LoadingSpinner, ProgressBar } from '@/components';
import {
  Layers,
  FileText,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Target,
  Sparkles,
  TrendingUp,
  Clock,
  ShieldCheck,
  RefreshCw,
  Trash2,
  ChevronRight,
  Sliders,
  Filter,
  Flame,
  Check,
  Info,
  Building2,
  GraduationCap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotification, useDocumentTitle } from '@/hooks';
import { resumeService, jobService, skillGapService } from '@/services';
import { ROUTES } from '@/utils/constants';

export default function SkillGap() {
  useDocumentTitle('Intelligent Skill Gap Analysis');
  const notify = useNotification();

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [activeReport, setActiveReport] = useState(null);
  const [history, setHistory] = useState([]);

  // Detail Modal / Drawer state
  const [selectedSkillDetail, setSelectedSkillDetail] = useState(null);

  // Filters & Sorting
  const [filterImportance, setFilterImportance] = useState('all'); // 'all' | 'critical' | 'high' | 'medium' | 'low'
  const [filterStatus, setFilterStatus] = useState('gaps'); // 'all' | 'gaps' | 'mastered'
  const [sortBy, setSortBy] = useState('priority'); // 'priority' | 'ats' | 'gap' | 'effort'

  // Interactive What-If Simulation
  const [simulatedSkills, setSimulatedSkills] = useState({}); // { [skillName]: targetLevel }
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  // Load user resumes, jobs, and existing skill gap reports
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [resumesRes, jobsRes, historyRes] = await Promise.all([
        resumeService.getResumes().catch(() => ({ items: [] })),
        jobService.getJobs().catch(() => ({ items: [] })),
        skillGapService.getAnalyses().catch(() => ({ items: [] })),
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
      notify.error(err.message || 'Could not load data for skill gap analysis');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysisDetail = async (analysisId) => {
    try {
      const detail = await skillGapService.getAnalysis(analysisId);
      setActiveReport(detail);
      setSimulatedSkills({});
      setSimulationResult(null);
    } catch (err) {
      notify.error('Could not load skill gap details');
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleRunAnalysis = async (e) => {
    e?.preventDefault();
    if (!selectedResumeId || !selectedJobId) {
      notify.error('Please select both a resume and a job description.');
      return;
    }

    setAnalyzing(true);
    try {
      const result = await skillGapService.analyzeGaps(selectedResumeId, selectedJobId);
      setActiveReport(result);
      setSimulatedSkills({});
      setSimulationResult(null);
      notify.success('Intelligent skill gap analysis generated!');
      const updatedHistory = await skillGapService.getAnalyses().catch(() => ({ items: [] }));
      setHistory(updatedHistory.items || []);
    } catch (err) {
      notify.error(err.message || 'Failed to analyze skill gaps');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteAnalysis = async (analysisId) => {
    if (!window.confirm('Delete this skill gap analysis report?')) return;
    try {
      await skillGapService.deleteAnalysis(analysisId);
      notify.info('Analysis deleted');
      if (activeReport?.id === analysisId) {
        setActiveReport(null);
      }
      const updatedHistory = await skillGapService.getAnalyses().catch(() => ({ items: [] }));
      setHistory(updatedHistory.items || []);
    } catch (err) {
      notify.error('Could not delete skill gap analysis');
    }
  };

  // What-If Simulation Handler
  const handleLevelChange = async (skillName, newLevel) => {
    const updated = { ...simulatedSkills, [skillName]: newLevel };
    setSimulatedSkills(updated);

    try {
      setSimulating(true);
      const res = await skillGapService.simulateGaps({
        analysis_id: activeReport.id,
        improved_skills: updated,
      });
      setSimulationResult(res);
    } catch (err) {
      notify.error('Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading Intelligent Skill Gap Engine..." />;
  }

  // Filter and Sort Skills
  let displayedSkills = (activeReport?.skills || []).filter((s) => {
    if (filterImportance !== 'all' && s.importance !== filterImportance) return false;
    if (filterStatus === 'gaps' && s.gap === 0) return false;
    if (filterStatus === 'mastered' && s.gap > 0) return false;
    return true;
  });

  displayedSkills.sort((a, b) => {
    if (sortBy === 'priority') return b.priority_score - a.priority_score;
    if (sortBy === 'ats') return b.ats_impact - a.ats_impact;
    if (sortBy === 'gap') return b.gap - a.gap;
    if (sortBy === 'effort') return b.estimated_learning_hours - a.estimated_learning_hours;
    return 0;
  });

  const getPriorityColor = (priority) => {
    if (priority >= 8.5) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (priority >= 7.0) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (priority >= 5.0) return 'bg-brand-50 text-brand-700 border-brand-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const getImportanceBadge = (importance) => {
    switch (importance) {
      case 'critical':
        return <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">Critical Priority</span>;
      case 'high':
        return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">High Importance</span>;
      case 'medium':
        return <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-brand-100 text-brand-800 border border-brand-200">Medium</span>;
      default:
        return <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">Bonus / Low</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Layers className="w-6 h-6 text-brand-600 mr-2" /> Intelligent Skill Gap Analysis
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Answers: <em>"What skills am I missing, which should I learn first, and how much will it increase my job readiness?"</em>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link to={ROUTES.ROADMAP}>
            <Button variant="primary" size="sm">
              Generate Remediation Roadmap <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={loadInitialData}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Selectors Card */}
      <Card className="shadow-sm">
        <form onSubmit={handleRunAnalysis} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center">
              <FileText className="w-3.5 h-3.5 mr-1 text-slate-400" /> Select Resume
            </label>
            {resumes.length === 0 ? (
              <div className="text-xs text-slate-500 dark:text-slate-400 p-2 border border-dashed rounded-lg bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 flex justify-between">
                <span>No resumes uploaded</span>
                <Link to={ROUTES.RESUME} className="text-brand-600 dark:text-brand-400 font-bold hover:underline">Upload →</Link>
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

          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center">
              <Briefcase className="w-3.5 h-3.5 mr-1 text-slate-400" /> Select Target Job Description
            </label>
            {jobs.length === 0 ? (
              <div className="text-xs text-slate-500 dark:text-slate-400 p-2 border border-dashed rounded-lg bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 flex justify-between">
                <span>No jobs analyzed</span>
                <Link to={ROUTES.JOB_ANALYSIS} className="text-brand-600 dark:text-brand-400 font-bold hover:underline">Analyze JD →</Link>
              </div>
            ) : (
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.job_title} {j.company_name ? `• ${j.company_name}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="md:col-span-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full justify-center text-xs font-bold py-2 rounded-xl"
              disabled={analyzing || !selectedResumeId || !selectedJobId}
            >
              {analyzing ? <>Analyzing...</> : <><Sparkles className="w-4 h-4 mr-1.5" /> Detect Gaps</>}
            </Button>
          </div>
        </form>
      </Card>

      {/* Main Analysis Output */}
      {activeReport ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Metrics & Recommended Sequence */}
          <div className="lg:col-span-4 space-y-6">
            {/* Gap Summary Card */}
            <Card title="Skill Gap Quotient" subtitle="Comparison against job requirements">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300">Mastered</span>
                    <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">{activeReport.matched_skills_count}</div>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-xl border border-amber-200 dark:border-amber-800">
                    <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300">Secondary</span>
                    <div className="text-xl font-extrabold text-amber-700 dark:text-amber-400">{activeReport.preferred_gaps_count}</div>
                  </div>
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/60 rounded-xl border border-rose-200 dark:border-rose-800">
                    <span className="text-[10px] font-bold uppercase text-rose-800 dark:text-rose-300">Critical Gaps</span>
                    <div className="text-xl font-extrabold text-rose-700 dark:text-rose-400">{activeReport.critical_gaps_count}</div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Match Percentage:</span>
                    <span className="font-bold text-brand-600 dark:text-brand-400">{Math.round(activeReport.match_percentage)}%</span>
                  </div>
                  <ProgressBar value={activeReport.match_percentage} color="brand" showLabel={false} />
                </div>
              </div>
            </Card>

            {/* Recommended Learning Sequence */}
            <Card
              title="Recommended Learning Order"
              subtitle="Pedagogically sequenced to close high-priority gaps first"
            >
              {activeReport.recommended_learning_order.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No missing skill gaps to sequence.</p>
              ) : (
                <div className="space-y-2">
                  {activeReport.recommended_learning_order.map((skillName, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between hover:border-brand-300 dark:hover:border-brand-500 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-extrabold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{skillName}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Step {idx + 1}</span>
                    </div>
                  ))}

                  <div className="pt-2">
                    <Link to={ROUTES.ROADMAP}>
                      <Button variant="outline" size="sm" className="w-full justify-center text-xs">
                        Build Step-by-Step Roadmap →
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </Card>

            {/* Previous Reports History */}
            <Card title="Past Analyses" subtitle={`${history.length} saved analyses`}>
              {history.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No past analyses.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        item.id === activeReport.id ? 'bg-brand-50/60 dark:bg-brand-950/60 border-brand-300 dark:border-brand-700 shadow-2xs' : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <div
                        className="cursor-pointer flex-1 mr-2 overflow-hidden"
                        onClick={() => fetchAnalysisDetail(item.id)}
                      >
                        <h4 className="font-bold text-slate-900 dark:text-white truncate">{item.job_title}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {item.critical_gaps_count} critical • {item.total_gaps_count} total gaps
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteAnalysis(item.id)}
                        className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-600 rounded"
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

          {/* Right Column: Ranked Skill Gaps List */}
          <div className="lg:col-span-8 space-y-6">
            {/* Top Target Role Banner */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Target Role Evaluation</span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{activeReport.job_title}</h2>
                {activeReport.company_name && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center mt-0.5">
                    <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" /> {activeReport.company_name}
                  </p>
                )}
              </div>

              {/* What-If Simulator Quick Button */}
              <div className="bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 rounded-xl p-3 flex items-center space-x-3 shrink-0">
                <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <div className="text-xs">
                  <p className="font-bold text-brand-900 dark:text-brand-200">Interactive Simulation</p>
                  <p className="text-[11px] text-brand-700 dark:text-brand-300">
                    {simulationResult ? (
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                        Projected ATS: {simulationResult.simulated_score}% (+{simulationResult.score_gain} pts)
                      </span>
                    ) : (
                      'Simulate skill upgrades below'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Filter and Sort Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-700 flex items-center">
                  <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" /> Filter:
                </span>
                <button
                  onClick={() => setFilterStatus('gaps')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    filterStatus === 'gaps' ? 'bg-brand-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  Skill Gaps ({activeReport.skills.filter((s) => s.gap > 0).length})
                </button>
                <button
                  onClick={() => setFilterStatus('mastered')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    filterStatus === 'mastered' ? 'bg-brand-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  Verified Strengths ({activeReport.skills.filter((s) => s.gap === 0).length})
                </button>
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    filterStatus === 'all' ? 'bg-brand-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  All ({activeReport.skills.length})
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center">
                  <Sliders className="w-3.5 h-3.5 mr-1 text-slate-400" /> Sort:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="priority">Priority Score (Highest First)</option>
                  <option value="ats">ATS Match Impact</option>
                  <option value="gap">Gap Size</option>
                  <option value="effort">Learning Hours</option>
                </select>
              </div>
            </div>

            {/* Ranked Skill Cards */}
            <div className="space-y-4">
              {displayedSkills.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                  No skills match the selected filter criteria.
                </div>
              ) : (
                displayedSkills.map((skill, idx) => {
                  const isSimulated = simulatedSkills[skill.skill] !== undefined;
                  const currentSimLevel = simulatedSkills[skill.skill] || skill.current_level;

                  return (
                    <Card
                      key={idx}
                      className={`transition-all hover:border-brand-300 ${
                        skill.priority_score >= 8.5 ? 'border-l-4 border-l-rose-500' : skill.priority_score >= 7.0 ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-slate-300 dark:border-l-slate-700'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Header: Rank + Name + Badges + Priority Score */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-2.5">
                            <span className="w-6 h-6 rounded-lg bg-slate-900 dark:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center shrink-0 border border-slate-700">
                              #{idx + 1}
                            </span>
                            <div>
                              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                                {skill.skill}
                                <span className="ml-2 text-[10px] text-slate-500 dark:text-slate-400 font-normal bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                  {skill.category}
                                </span>
                              </h3>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {getImportanceBadge(skill.importance)}
                            <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border ${getPriorityColor(skill.priority_score)}`}>
                              Priority: {skill.priority_score} / 10
                            </span>
                          </div>
                        </div>

                        {/* Level Progression Visualizer */}
                        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-500 font-medium">Current:</span>
                              <span className="font-bold text-slate-900">
                                {skill.current_level_label} ({skill.current_level}/5)
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-500 font-medium">Target Required:</span>
                              <span className="font-bold text-brand-700">
                                {skill.required_level_label} ({skill.required_level}/5)
                              </span>
                            </div>
                          </div>

                          {/* 5-Step Level Progress Blocks */}
                          <div className="grid grid-cols-5 gap-1.5 h-2">
                            {[1, 2, 3, 4, 5].map((levelNum) => {
                              const isFilled = levelNum <= skill.current_level;
                              const isSimFilled = levelNum <= currentSimLevel && !isFilled;
                              const isRequiredTarget = levelNum === skill.required_level;

                              let blockColor = 'bg-slate-200';
                              if (isFilled) blockColor = 'bg-slate-900';
                              else if (isSimFilled) blockColor = 'bg-emerald-500 animate-pulse';
                              else if (levelNum <= skill.required_level) blockColor = 'bg-amber-200';

                              return (
                                <div
                                  key={levelNum}
                                  className={`h-2 rounded-sm ${blockColor} relative transition-colors`}
                                  title={`Level ${levelNum}`}
                                />
                              );
                            })}
                          </div>
                        </div>

                        {/* Reason and Metadata Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 pt-1">
                          <div className="flex items-center space-x-1.5">
                            <Target className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                            <span>ATS Impact: <strong className="text-slate-900">+{skill.ats_impact} pts</strong></span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                            <span>Learning Budget: <strong className="text-slate-900 dark:text-white">~{skill.estimated_learning_hours} hrs</strong></span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                            <span>Role Density: <strong className="text-slate-900 dark:text-white">{Math.round(skill.job_frequency * 100)}% of duties</strong></span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-800/80 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                          "{skill.reason}"
                        </p>

                        {/* Action Buttons & What-If Selector */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                          {/* Simulation Level Controls */}
                          {skill.gap > 0 && (
                            <div className="flex items-center space-x-1.5 text-xs">
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center">
                                <Sparkles className="w-3 h-3 mr-1 text-brand-500 dark:text-brand-400" /> Simulate Target:
                              </span>
                              {[skill.required_level, 4].filter((v, i, a) => a.indexOf(v) === i && v > skill.current_level).map((lvl) => (
                                <button
                                  key={lvl}
                                  onClick={() => handleLevelChange(skill.skill, lvl)}
                                  className={`text-[11px] font-bold px-2 py-0.5 rounded border transition-colors ${
                                    simulatedSkills[skill.skill] === lvl
                                      ? 'bg-emerald-600 text-white border-emerald-600'
                                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                                  }`}
                                >
                                  {lvl === 3 ? 'Intermediate (3)' : lvl === 4 ? 'Advanced (4)' : `Level ${lvl}`}
                                </button>
                              ))}
                            </div>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-bold ml-auto"
                            onClick={() => setSelectedSkillDetail(skill)}
                          >
                            <BookOpen className="w-3.5 h-3.5 mr-1" /> View Practice Plan & Evidence →
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <Card className="text-center py-16 px-6 border-dashed border-2 border-slate-200 dark:border-slate-800">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No skill gap analysis selected</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select an uploaded resume and analyzed job description above, then click <strong>"Analyze Gaps"</strong> to generate your prioritized learning order.
            </p>
          </div>
        </Card>
      )}

      {/* Skill Detail Modal */}
      {selectedSkillDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Skill Gap Deep Dive</span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                  {selectedSkillDetail.skill}
                  <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {selectedSkillDetail.category}
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedSkillDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400">Priority Score</span>
                <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {selectedSkillDetail.priority_score} / 10
                </div>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">ATS Match Gain</span>
                <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">
                  +{selectedSkillDetail.ats_impact} pts
                </div>
              </div>
              <div className="p-3 bg-brand-50 dark:bg-brand-950/60 rounded-xl border border-brand-200 dark:border-brand-800">
                <span className="text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400">Learning Effort</span>
                <div className="text-lg font-extrabold text-brand-700 dark:text-brand-300 mt-0.5">
                  ~{selectedSkillDetail.estimated_learning_hours} hrs
                </div>
              </div>
            </div>

            {/* Recommended Action */}
            <div className="space-y-1.5 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-brand-600 dark:text-brand-400" /> Actionable Learning Recommendation
              </h4>
              <p className="text-slate-600 dark:text-slate-300 bg-brand-50/40 dark:bg-brand-950/40 p-3 rounded-xl border border-brand-200 dark:border-brand-800 leading-relaxed">
                {selectedSkillDetail.recommended_action}
              </p>
            </div>

            {/* Curated Practice Topics */}
            {selectedSkillDetail.recommended_topics?.length > 0 && (
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center">
                  <BookOpen className="w-4 h-4 mr-1.5 text-slate-600 dark:text-slate-400" /> Recommended Practice Curriculum
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedSkillDetail.recommended_topics.map((topic, i) => (
                    <div key={i} className="p-2 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center">
                      <span className="w-4 h-4 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-[10px] font-bold flex items-center justify-center mr-2 shrink-0 border border-brand-200 dark:border-brand-800">
                        {i + 1}
                      </span>
                      {topic}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence from Resume vs Job */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white">Verified Evidence Comparison</h4>
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Resume Evidence (Current Level: {selectedSkillDetail.current_level_label}):</span>
                  {selectedSkillDetail.evidence?.resume?.length > 0 ? (
                    selectedSkillDetail.evidence.resume.map((r, i) => (
                      <p key={i} className="text-slate-600 dark:text-slate-400 italic text-[11px]">"{r}"</p>
                    ))
                  ) : (
                    <p className="text-slate-400 dark:text-slate-500 italic text-[11px]">No demonstrated evidence found in uploaded resume.</p>
                  )}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Job Description Requirement (Target: {selectedSkillDetail.required_level_label}):</span>
                  {selectedSkillDetail.evidence?.job?.length > 0 ? (
                    selectedSkillDetail.evidence.job.map((j, i) => (
                      <p key={i} className="text-slate-600 dark:text-slate-400 italic text-[11px]">"{j}"</p>
                    ))
                  ) : (
                    <p className="text-slate-400 dark:text-slate-500 italic text-[11px]">Listed as mandatory role requirement.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="primary" size="sm" onClick={() => setSelectedSkillDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
