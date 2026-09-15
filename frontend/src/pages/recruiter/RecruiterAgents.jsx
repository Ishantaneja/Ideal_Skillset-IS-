import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Terminal,
  Cpu,
  Layers,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Search,
  FileCode2,
  Users,
  Award,
  Video
} from 'lucide-react';
import { recruiterService } from '@/services/recruiterService';
import { useNotification } from '@/hooks';
import { ROUTES } from '@/utils/constants';

const STARTER_PROMPTS = [
  'Identify top 3 candidates with verified GitHub code proof, compare them, and recommend next actions.',
  'Find candidates proficient in Python and FastAPI, generate a technical gap challenge, and prepare an interview guide.',
  'Analyze applicants for consistency between claimed resume skills and verified GitHub repositories.',
  'Discover highest-readiness talent and prepare a custom STAR behavioral interview rubric.'
];

export default function RecruiterAgents() {
  const navigate = useNavigate();
  const notify = useNotification();

  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [currentRun, setCurrentRun] = useState(null);
  const [recentRuns, setRecentRuns] = useState([]);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const data = await recruiterService.listJobs();
      setJobs(data || []);
      if (data && data.length > 0) {
        setSelectedJobId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
    }
  };

  const handleRunAgent = async (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) {
      notify.warning('Please enter an instruction prompt for the AI Agent.');
      return;
    }

    setIsRunning(true);
    setCurrentRun(null);

    try {
      const response = await recruiterService.runAgent(prompt.trim(), selectedJobId || null);
      setCurrentRun(response);
      setRecentRuns((prev) => [response, ...prev.slice(0, 4)]);
      notify.success('AI Recruiter Agent run completed successfully!');
    } catch (err) {
      console.error('Agent run failed:', err);
      notify.error(err.response?.data?.detail || 'AI Recruiter Agent run failed.');
    } finally {
      setIsRunning(false);
    }
  };

  const getStateBadge = (state) => {
    switch (state?.toLowerCase()) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Completed
          </span>
        );
      case 'executing':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 mr-1 text-blue-400 animate-spin" /> Executing
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-400" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700 text-slate-300">
            <Clock className="w-3.5 h-3.5 mr-1" /> Planning
          </span>
        );
    }
  };

  const getToolIcon = (toolName) => {
    switch (toolName) {
      case 'search_jobs':
      case 'get_job_blueprint':
        return <Layers className="w-4 h-4 text-indigo-400" />;
      case 'search_candidates':
        return <Search className="w-4 h-4 text-blue-400" />;
      case 'compare_candidates':
        return <Users className="w-4 h-4 text-purple-400" />;
      case 'generate_assessment':
        return <Award className="w-4 h-4 text-amber-400" />;
      case 'generate_interview':
        return <Video className="w-4 h-4 text-emerald-400" />;
      default:
        return <FileCode2 className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Bot className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Autonomous AI Recruiter Agent
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Delegate multi-step recruitment workflows: capability discovery, GitHub proof verification, candidate comparisons, and interview guide generation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300">
            Company Isolation: Strictly Enforced
          </span>
        </div>
      </div>

      {/* Main Agent Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Prompt Dispatcher & Transcripts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prompt Dispatcher Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <form onSubmit={handleRunAgent} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> Agent Instructions & Goals
                </label>
                <div className="w-full sm:w-64">
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="">All Requisitions (Global Context)</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} ({j.applicant_count} applicants)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Tell the AI Agent what you want to achieve (e.g., 'Find the top 3 backend candidates who have verified GitHub project evidence, compare them, and prepare a tailored STAR interview guide')..."
                  rows={4}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden resize-none transition-all"
                  disabled={isRunning}
                />
              </div>

              {/* Starter Chips */}
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-2">Quick Starter Queries:</span>
                <div className="flex flex-wrap gap-2">
                  {STARTER_PROMPTS.map((starter, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(starter)}
                      disabled={isRunning}
                      className="text-xs bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 rounded-lg px-3 py-1.5 text-left transition-colors truncate max-w-full"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isRunning || !prompt.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all cursor-pointer"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Agent Planning & Executing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      Execute Agent Workflow
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Active / Last Run Transcript */}
          {currentRun && (
            <div className="space-y-6">
              {/* Status Banner */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <Cpu className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-white">Agent Run Transcript</h3>
                      <p className="text-xs text-slate-400 font-mono">Run ID: {currentRun.run_id}</p>
                    </div>
                  </div>
                  <div>{getStateBadge(currentRun.state)}</div>
                </div>

                {/* Action Plan */}
                <div className="mb-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Step-by-Step Action Plan
                  </h4>
                  <div className="space-y-2">
                    {currentRun.action_plan?.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tools Executed */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-indigo-400" /> Authorized Tool Execution Audit ({currentRun.tools_executed?.length || 0})
                  </h4>
                  <div className="space-y-3">
                    {currentRun.tools_executed?.map((t, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs font-mono space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 font-bold text-indigo-400">
                            {getToolIcon(t.tool_name)} {t.tool_name}()
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(t.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-slate-300 font-sans">{t.result_summary}</p>
                        {t.arguments && Object.keys(t.arguments).length > 0 && (
                          <div className="text-[11px] text-slate-500 truncate">
                            Args: {JSON.stringify(t.arguments)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendation Card */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-indigo-500/30 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" /> Agent Synthesis & Recommendations
                </div>
                <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                  {currentRun.final_recommendation}
                </div>

                {/* Action Shortcuts */}
                {currentRun.data_payload?.top_candidates?.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-3">
                    <button
                      onClick={() => navigate(`/recruiter/candidates/${currentRun.data_payload.top_candidates[0].candidate_id}`)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      Open Candidate 360° Dossier <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => navigate(ROUTES.RECRUITER_COMPARE)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      Compare Shortlisted Candidates <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Agent Architecture & Recent Runs */}
        <div className="space-y-6">
          {/* Agent Capability Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" /> Authorized Tool Registry
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The Agent coordinates explicit Python tools under strict company multi-tenant isolation:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2">
                <Search className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-200 block">search_candidates</span>
                  <span className="text-slate-500">Finds talent filtered by role, fit score, and verified proof.</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2">
                <Layers className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-200 block">get_job_blueprint</span>
                  <span className="text-slate-500">Loads required competencies and critical evaluation weights.</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2">
                <Users className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-200 block">compare_candidates</span>
                  <span className="text-slate-500">Generates side-by-side competency differentiation matrix.</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2">
                <Award className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-200 block">generate_assessment</span>
                  <span className="text-slate-500">Synthesizes gap-adaptive technical challenges.</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2">
                <Video className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-200 block">generate_interview</span>
                  <span className="text-slate-500">Constructs tailored STAR behavioral and technical guides.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Runs */}
          {recentRuns.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" /> Recent Runs
              </h3>
              <div className="space-y-2">
                {recentRuns.map((run, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentRun(run)}
                    className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 cursor-pointer transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200 truncate max-w-[160px]">
                        {run.request_prompt}
                      </span>
                      {getStateBadge(run.state)}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{run.tools_executed?.length || 0} tools executed</span>
                      <span>{new Date(run.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

