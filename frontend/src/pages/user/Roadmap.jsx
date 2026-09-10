import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, LoadingSpinner, ProgressBar } from '@/components';
import {
  Map,
  FileText,
  Briefcase,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BookOpen,
  CodeXml,
  FolderGit2,
  ShieldCheck,
  MessageSquare,
  Award,
  RefreshCw,
  Trash2,
  ArrowRight,
  Filter,
  Check,
  Building2,
  Flame,
  Layers,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotification, useDocumentTitle } from '@/hooks';
import { resumeService, jobService, skillGapService, roadmapService } from '@/services';
import { ROUTES } from '@/utils/constants';

export default function Roadmap() {
  useDocumentTitle('Personalized Career Roadmap');
  const notify = useNotification();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [history, setHistory] = useState([]);

  // Expanded weeks state (by week number)
  const [expandedWeeks, setExpandedWeeks] = useState({ 1: true });

  // Selected Task Modal state
  const [selectedTask, setSelectedTask] = useState(null);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  // Task type filter
  const [taskTypeFilter, setTaskTypeFilter] = useState('all'); // 'all' | 'learning' | 'practice' | 'project' | 'evidence' | 'interview'

  // Load initial user resumes, jobs, and existing roadmaps
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [resumesRes, jobsRes, historyRes] = await Promise.all([
        resumeService.getResumes().catch(() => ({ items: [] })),
        jobService.getJobs().catch(() => ({ items: [] })),
        roadmapService.getRoadmaps().catch(() => ({ items: [] })),
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
        fetchRoadmapDetail(historyItems[0].id);
      }
    } catch (err) {
      notify.error(err.message || 'Could not load data for career roadmap');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoadmapDetail = async (roadmapId) => {
    try {
      const detail = await roadmapService.getRoadmap(roadmapId);
      setActiveRoadmap(detail);
      // Auto expand week 1
      setExpandedWeeks({ 1: true });
    } catch (err) {
      notify.error('Could not load roadmap details');
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleGenerateRoadmap = async (e) => {
    e?.preventDefault();
    if (!selectedResumeId || !selectedJobId) {
      notify.error('Please select both a resume and a job description.');
      return;
    }

    setGenerating(true);
    try {
      const result = await roadmapService.generateRoadmap({
        resume_id: selectedResumeId,
        job_id: selectedJobId,
        duration_weeks: durationWeeks,
      });
      setActiveRoadmap(result);
      setExpandedWeeks({ 1: true });
      notify.success(`Generated personalized ${durationWeeks}-week career roadmap!`);
      const updatedHistory = await roadmapService.getRoadmaps().catch(() => ({ items: [] }));
      setHistory(updatedHistory.items || []);
    } catch (err) {
      notify.error(err.message || 'Failed to generate career roadmap');
    } finally {
      setGenerating(false);
    }
  };

  const handleTaskStatusToggle = async (taskId, currentStatus) => {
    let nextStatus = 'in_progress';
    if (currentStatus === 'not_started') nextStatus = 'in_progress';
    else if (currentStatus === 'in_progress') nextStatus = 'completed';
    else nextStatus = 'not_started';

    setUpdatingTaskId(taskId);
    try {
      const updated = await roadmapService.updateTaskStatus(activeRoadmap.id, taskId, nextStatus);
      setActiveRoadmap(updated);
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, status: nextStatus });
      }
      if (nextStatus === 'completed') {
        notify.success('Task marked completed! Progress updated.');
      }
    } catch (err) {
      notify.error('Could not update task status');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleSetTaskStatusExplicit = async (taskId, newStatus) => {
    setUpdatingTaskId(taskId);
    try {
      const updated = await roadmapService.updateTaskStatus(activeRoadmap.id, taskId, newStatus);
      setActiveRoadmap(updated);
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }
      notify.success(`Task status set to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      notify.error('Could not update task status');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleDeleteRoadmap = async (roadmapId) => {
    if (!window.confirm('Delete this career roadmap?')) return;
    try {
      await roadmapService.deleteRoadmap(roadmapId);
      notify.info('Roadmap deleted');
      if (activeRoadmap?.id === roadmapId) {
        setActiveRoadmap(null);
      }
      const updatedHistory = await roadmapService.getRoadmaps().catch(() => ({ items: [] }));
      setHistory(updatedHistory.items || []);
    } catch (err) {
      notify.error('Could not delete roadmap');
    }
  };

  const toggleWeekExpand = (weekNum) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekNum]: !prev[weekNum],
    }));
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading Career Readiness Roadmap Engine..." />;
  }

  const getTaskIcon = (type) => {
    switch (type) {
      case 'learning':
        return <BookOpen className="w-3.5 h-3.5 text-brand-600" />;
      case 'practice':
        return <CodeXml className="w-3.5 h-3.5 text-amber-600" />;
      case 'project':
        return <FolderGit2 className="w-3.5 h-3.5 text-purple-600" />;
      case 'evidence':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />;
      case 'interview':
        return <MessageSquare className="w-3.5 h-3.5 text-rose-600" />;
      case 'resume':
        return <FileText className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return <Award className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const getTaskBadge = (type) => {
    switch (type) {
      case 'learning':
        return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">Learning</span>;
      case 'practice':
        return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">Practice</span>;
      case 'project':
        return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">Project</span>;
      case 'evidence':
        return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Evidence</span>;
      case 'interview':
        return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">Interview</span>;
      default:
        return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">{type}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Map className="w-6 h-6 text-brand-600 mr-2" /> Personalized Career Roadmap
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Weekly actionable learning, practice exercises, real-world projects, and mock interviews to achieve job readiness.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link to={ROUTES.INTERVIEW}>
            <Button variant="outline" size="sm">
              <MessageSquare className="w-3.5 h-3.5 mr-1" /> Practice Mock Interview
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={loadInitialData}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Selectors Card */}
      <Card className="shadow-sm">
        <form onSubmit={handleGenerateRoadmap} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center">
                <FileText className="w-3.5 h-3.5 mr-1 text-slate-400" /> Select Resume
              </label>
              {resumes.length === 0 ? (
                <div className="text-xs text-slate-500 dark:text-slate-400 p-2 border border-dashed rounded-lg bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 flex justify-between">
                  <span>No resumes</span>
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
                      {r.original_filename} {r.is_active ? '★ (Active)' : ''}
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
                  <span>No jobs</span>
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

            <div className="md:col-span-3">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full justify-center text-xs font-bold py-2 rounded-xl"
                disabled={generating || !selectedResumeId || !selectedJobId}
              >
                {generating ? <>Building Roadmap...</> : <><Sparkles className="w-4 h-4 mr-1.5" /> Generate Roadmap</>}
              </Button>
            </div>
          </div>

          {/* Duration Selector Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center mr-1">
              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" /> Roadmap Duration:
            </span>
            {[
              { weeks: 1, label: '1 Week Sprint' },
              { weeks: 2, label: '2 Weeks' },
              { weeks: 4, label: '4 Weeks (Standard)' },
              { weeks: 6, label: '6 Weeks' },
              { weeks: 8, label: '8 Weeks' },
              { weeks: 12, label: '12 Weeks (Comprehensive)' },
            ].map((d) => (
              <button
                key={d.weeks}
                type="button"
                onClick={() => setDurationWeeks(d.weeks)}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  durationWeeks === d.weeks
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </form>
      </Card>

      {/* Main Roadmap Dashboard */}
      {activeRoadmap ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar: Metrics & Past Roadmaps */}
          <div className="lg:col-span-4 space-y-6">
            {/* Top Readiness Score Card */}
            <Card title="Readiness Progression" subtitle="Projected career match improvement">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Current Match</span>
                    <div className="text-2xl font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                      {Math.round(activeRoadmap.current_ats_score)}%
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Target Match</span>
                    <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">
                      {Math.round(activeRoadmap.estimated_target_score)}%
                    </div>
                  </div>
                </div>

                {/* Overall Progress */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Overall Completion</span>
                    <span className="font-extrabold text-brand-700 dark:text-brand-300">
                      {Math.round(activeRoadmap.overall_progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-brand-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${activeRoadmap.overall_progress}%` }}
                    />
                  </div>
                </div>

                {/* Task Breakdown Counter */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-slate-700 dark:text-slate-300 flex justify-between">
                    <span>Completed Tasks</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {activeRoadmap.completed_tasks_count} / {activeRoadmap.total_tasks_count}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-slate-700 dark:text-slate-300 flex justify-between">
                    <span>Total Hours</span>
                    <span className="font-bold text-slate-900 dark:text-white">~{activeRoadmap.total_hours} hrs</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Past Roadmaps History */}
            <Card title="Past Roadmaps" subtitle={`${history.length} saved plans`}>
              {history.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No past roadmaps generated.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        item.id === activeRoadmap.id
                          ? 'bg-brand-50/60 dark:bg-brand-950/60 border-brand-300 dark:border-brand-700 shadow-2xs'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <div
                        className="cursor-pointer flex-1 mr-2 overflow-hidden"
                        onClick={() => fetchRoadmapDetail(item.id)}
                      >
                        <h4 className="font-bold text-slate-900 dark:text-white truncate">{item.title}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {item.duration_weeks} Weeks • {Math.round(item.overall_progress)}% Done
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteRoadmap(item.id)}
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

          {/* Right Column: Weekly Breakdown Timeline */}
          <div className="lg:col-span-8 space-y-6">
            {/* Top Target Role Banner */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Target Role Roadmap</span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{activeRoadmap.target_role}</h2>
                {activeRoadmap.company_name && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center mt-0.5">
                    <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" /> {activeRoadmap.company_name}
                  </p>
                )}
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-xs text-right shrink-0">
                <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Potential Readiness</span>
                <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                  {Math.round(activeRoadmap.estimated_target_score)}% Target Match
                </div>
              </div>
            </div>

            {/* Task Type Filters */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center mr-1">
                <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" /> Filter Tasks:
              </span>
              {[
                { type: 'all', label: 'All Tasks' },
                { type: 'learning', label: 'Learning' },
                { type: 'practice', label: 'Practice' },
                { type: 'project', label: 'Projects' },
                { type: 'evidence', label: 'Evidence' },
                { type: 'interview', label: 'Interviews' },
              ].map((f) => (
                <button
                  key={f.type}
                  onClick={() => setTaskTypeFilter(f.type)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    taskTypeFilter === f.type
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Weekly Accordions */}
            <div className="space-y-4">
              {activeRoadmap.weeks.map((week) => {
                const isExpanded = !!expandedWeeks[week.week];
                const filteredTasks = (week.tasks || []).filter((t) => {
                  if (taskTypeFilter === 'all') return true;
                  return t.type === taskTypeFilter;
                });

                const isWeekComplete = week.week_progress >= 100;

                return (
                  <div
                    key={week.week}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all"
                  >
                    {/* Accordion Header */}
                    <div
                      onClick={() => toggleWeekExpand(week.week)}
                      className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors border-b border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex items-center space-x-3 flex-1 mr-4">
                        <div
                          className={`w-9 h-9 rounded-xl font-extrabold text-sm flex items-center justify-center shrink-0 ${
                            isWeekComplete
                              ? 'bg-emerald-600 text-white'
                              : week.week_progress > 0
                              ? 'bg-brand-600 text-white animate-pulse'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {isWeekComplete ? <Check className="w-5 h-5" /> : `W${week.week}`}
                        </div>

                        <div className="overflow-hidden">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{week.title}</h3>
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded shrink-0">
                              ~{week.estimated_hours}h
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{week.theme}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 shrink-0">
                        {/* Progress Bar for Week */}
                        <div className="hidden sm:flex flex-col items-end w-28">
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                            {Math.round(week.week_progress)}% Complete
                          </span>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className="bg-brand-600 h-full rounded-full"
                              style={{ width: `${week.week_progress}%` }}
                            />
                          </div>
                        </div>

                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Accordion Body */}
                    {isExpanded && (
                      <div className="p-4 sm:p-6 space-y-6 bg-slate-50/40 dark:bg-slate-950/40">
                        {/* Weekly Goals */}
                        {week.goals?.length > 0 && (
                          <div className="space-y-1.5 text-xs">
                            <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider">Weekly Goals:</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {week.goals.map((g, i) => (
                                <div key={i} className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800/90 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                                  <span>{g}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tasks Checklist */}
                        <div className="space-y-2">
                          <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider">Weekly Action Tasks:</h4>
                          {filteredTasks.length === 0 ? (
                            <p className="text-xs text-slate-400 dark:text-slate-500 italic bg-white dark:bg-slate-800/90 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                              No tasks match the selected type filter for this week.
                            </p>
                          ) : (
                            filteredTasks.map((task) => {
                              const isTaskCompleted = task.status === 'completed';
                              const isTaskInProgress = task.status === 'in_progress';
                              const isUpdating = updatingTaskId === task.id;

                              return (
                                <div
                                  key={task.id}
                                  className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                                    isTaskCompleted
                                      ? 'bg-emerald-50/40 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80'
                                      : isTaskInProgress
                                      ? 'bg-brand-50/50 dark:bg-brand-950/50 border-brand-200 dark:border-brand-800/80'
                                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                                  }`}
                                >
                                  {/* Task checkbox + Title + Badges */}
                                  <div className="flex items-start space-x-3 flex-1">
                                    <button
                                      disabled={isUpdating}
                                      onClick={() => handleTaskStatusToggle(task.id, task.status)}
                                      className="mt-0.5 shrink-0 focus:outline-none"
                                      title="Toggle status: Not Started → In Progress → Completed"
                                    >
                                      {isTaskCompleted ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                      ) : isTaskInProgress ? (
                                        <div className="w-5 h-5 rounded-full border-2 border-brand-600 flex items-center justify-center">
                                          <div className="w-2.5 h-2.5 bg-brand-600 rounded-full animate-pulse" />
                                        </div>
                                      ) : (
                                        <Circle className="w-5 h-5 text-slate-300 hover:text-brand-600" />
                                      )}
                                    </button>

                                    <div className="space-y-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className={`font-bold ${isTaskCompleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                          {task.title}
                                        </span>
                                        {getTaskBadge(task.type)}
                                        <span className="text-[10px] text-slate-400 flex items-center">
                                          <Clock className="w-3 h-3 mr-1" /> {task.estimated_hours}h
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-500 leading-relaxed">
                                        {task.why_it_matters}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex items-center space-x-2 shrink-0 sm:self-center">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs text-brand-600 font-bold"
                                      onClick={() => setSelectedTask(task)}
                                    >
                                      Details →
                                    </Button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Weekly Real-World Project Card */}
                        {week.project && (
                          <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50/40 rounded-xl border border-purple-200 text-xs space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-purple-900 flex items-center">
                                <FolderGit2 className="w-4 h-4 text-purple-600 mr-1.5" /> Hands-On Project: {week.project.title}
                              </span>
                              <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                                ~{week.project.estimated_hours}h
                              </span>
                            </div>

                            <p className="text-slate-700 leading-relaxed">{week.project.description}</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-purple-100 text-[11px]">
                              <div>
                                <strong className="text-purple-950">Expected Output: </strong>
                                <span className="text-slate-600">{week.project.expected_output}</span>
                              </div>
                              <div>
                                <strong className="text-purple-950">Evidence to Produce: </strong>
                                <span className="text-slate-600">{week.project.evidence_to_produce}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Weekly Milestone Badge */}
                        <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Award className="w-4 h-4 text-amber-500 shrink-0" />
                            <div>
                              <span className="font-bold text-slate-800 dark:text-slate-200">Weekly Milestone: </span>
                              <span className="text-slate-600 dark:text-slate-400">{week.milestone}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 shrink-0">
                            {week.expected_readiness_impact}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <Card className="text-center py-16 px-6 border-dashed border-2 border-slate-200 dark:border-slate-800">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
              <Map className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No career roadmap generated yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select an uploaded resume and analyzed job description above, choose your preferred timeframe, and click <strong>"Generate Roadmap"</strong> to construct your personalized step-by-step career readiness plan.
            </p>
          </div>
        </Card>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Roadmap Task Details</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedTask.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-2">
                  {getTaskIcon(selectedTask.type)}
                  <span className="font-bold text-slate-900 dark:text-white">{selectedTask.skill}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getTaskBadge(selectedTask.type)}
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">~{selectedTask.estimated_hours}h</span>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white">Why This Matters:</h4>
                <p className="text-slate-600 dark:text-slate-300 bg-brand-50/40 dark:bg-brand-950/40 p-3 rounded-xl border border-brand-200 dark:border-brand-800 leading-relaxed">
                  {selectedTask.why_it_matters}
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white">Expected Capability Outcome:</h4>
                <p className="text-slate-600 dark:text-slate-300 bg-emerald-50/40 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 leading-relaxed">
                  {selectedTask.expected_outcome}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 text-[11px]">
                <div>
                  <strong className="text-slate-700 dark:text-slate-300">Related Job Requirement: </strong>
                  <span className="text-slate-600 dark:text-slate-400">{selectedTask.related_job_req}</span>
                </div>
                <div>
                  <strong className="text-slate-700 dark:text-slate-300">Estimated Match Impact: </strong>
                  <span className="text-brand-700 dark:text-brand-400 font-bold">{selectedTask.ats_impact}</span>
                </div>
              </div>

              {/* Status Update Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-700 dark:text-slate-300">Set Task Status:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleSetTaskStatusExplicit(selectedTask.id, 'not_started')}
                    className={`py-2 rounded-xl font-bold border transition-colors ${
                      selectedTask.status === 'not_started'
                        ? 'bg-slate-800 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-700'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    Not Started
                  </button>
                  <button
                    onClick={() => handleSetTaskStatusExplicit(selectedTask.id, 'in_progress')}
                    className={`py-2 rounded-xl font-bold border transition-colors ${
                      selectedTask.status === 'in_progress'
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => handleSetTaskStatusExplicit(selectedTask.id, 'completed')}
                    className={`py-2 rounded-xl font-bold border transition-colors ${
                      selectedTask.status === 'completed'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    Completed ✓
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="primary" size="sm" onClick={() => setSelectedTask(null)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
