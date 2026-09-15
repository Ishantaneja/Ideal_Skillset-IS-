import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Video,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileText,
  Send,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Layers,
} from 'lucide-react';
import { Card, Button, Badge, LoadingSpinner, ProgressBar } from '@/components';
import { ROUTES } from '@/utils/constants';
import { useNotification, useDocumentTitle } from '@/hooks';
import { recruiterService } from '@/services';

export default function RecruiterInterviews() {
  useDocumentTitle('AI Tailored Interview Assistant | Recruiter Copilot');
  const location = useLocation();
  const navigate = useNavigate();
  const notify = useNotification();

  const queryParams = new URLSearchParams(location.search);
  const initialJobId = queryParams.get('jobId') || '';
  const initialCandidateId = queryParams.get('candidateId') || '';

  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(initialCandidateId);

  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);

  // Interview Notes Summarizer
  const [interviewerNotes, setInterviewerNotes] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [interviewSummary, setInterviewSummary] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const list = await recruiterService.listJobs();
        setJobs(list || []);
        if (!selectedJobId && list && list.length > 0) {
          setSelectedJobId(list[0].id);
        }
      } catch (err) {
        notify.error('Failed to load jobs');
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    if (!selectedJobId) return;
    const fetchApplicants = async () => {
      try {
        const list = await recruiterService.getJobApplicants(selectedJobId);
        setCandidates(list || []);
        if (!selectedCandidateId && list && list.length > 0) {
          setSelectedCandidateId(list[0].candidate_id);
        }
      } catch (err) {
        notify.error('Failed to load applicants for job');
      }
    };
    fetchApplicants();
  }, [selectedJobId]);

  const handleGeneratePlan = async () => {
    if (!selectedCandidateId || !selectedJobId) {
      notify.warning('Please select both a Job Requisition and a Candidate.');
      return;
    }

    try {
      setGenerating(true);
      const res = await recruiterService.generateInterview(selectedCandidateId, selectedJobId);
      setGeneratedPlan(res);
      notify.success('Tailored Interview Guide generated!');
    } catch (err) {
      notify.error(err.message || 'Failed to generate interview plan');
    } finally {
      setGenerating(false);
    }
  };

  const handleSummarizeNotes = async (e) => {
    e.preventDefault();
    if (!interviewerNotes.trim()) {
      notify.warning('Please paste interviewer notes or transcript first.');
      return;
    }

    try {
      setSummarizing(true);
      const payload = {
        candidate_id: selectedCandidateId,
        job_id: selectedJobId,
        interviewer_notes: interviewerNotes.trim(),
      };

      const res = await recruiterService.summarizeInterview(payload);
      setInterviewSummary(res);
      notify.success('Interview evaluation synthesized!');
    } catch (err) {
      notify.error(err.message || 'Failed to summarize interview notes');
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (selectedJobId) {
              navigate(ROUTES.RECRUITER_JOB_CANDIDATES.replace(':jobId', selectedJobId));
            } else {
              navigate(ROUTES.RECRUITER_CANDIDATES);
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Candidate Pipeline</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-indigo-900/40 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider">
              AI Interview Assistant
            </span>
            <span className="text-xs text-slate-400">• Evidence-Driven Inquiries</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <Video className="w-7 h-7 text-indigo-400" />
            AI Tailored Interview Plan & Evaluator
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Generates tailored technical deep-dives on the candidate's verified GitHub code and STAR behavioral scenarios for the specific JD.
          </p>
        </div>
      </div>

      {/* Target Selector */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Configure Interview Target
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Select Job Requisition
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Select Candidate
            </label>
            <select
              value={selectedCandidateId}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            >
              {candidates.length === 0 ? (
                <option value="">No applicants in this job requisition</option>
              ) : (
                candidates.map((c) => (
                  <option key={c.candidate_id} value={c.candidate_id}>
                    {c.name} ({Math.round(c.overall_fit)}% JD Fit)
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            disabled={generating || !selectedCandidateId}
            onClick={handleGeneratePlan}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/30"
          >
            {generating ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Generating Question Guide...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Tailored Interview Guide</span>
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Generated Interview Guide */}
      {generatedPlan && (
        <Card className="p-6 space-y-6 animate-fadeIn border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">
                Tailored Interview Plan
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {generatedPlan.title || 'Technical & Behavioral Interview Protocol'}
              </h3>
            </div>
            <Badge variant="brand" size="sm">
              {generatedPlan.duration_minutes || 60} Minutes
            </Badge>
          </div>

          {/* Technical Questions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              Technical Stack & GitHub Codebase Deep Dives
            </h4>

            {(generatedPlan.technical_questions || []).map((tq, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {idx + 1}. {tq.question || tq.prompt}
                  </span>
                  <span className="text-[10px] font-semibold text-indigo-500">{tq.target_skill}</span>
                </div>
                {tq.evaluation_guide && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    What to listen for: {tq.evaluation_guide}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Behavioral Questions */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              STAR Behavioral & Culture Competencies
            </h4>

            {(generatedPlan.behavioral_questions || []).map((bq, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
              >
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {idx + 1}. {bq.question || bq.prompt}
                </span>
                {bq.evaluation_guide && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    Evaluation focus: {bq.evaluation_guide}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Live Notes Summarizer Section */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-500" />
          AI Interview Transcript & Notes Summarizer
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Paste interviewer notes, bullet points, or transcript. The AI will synthesize structured feedback, technical competency scoring, and a hiring recommendation.
        </p>

        <form onSubmit={handleSummarizeNotes} className="space-y-3">
          <textarea
            rows={5}
            placeholder="e.g. Candidate described their FastAPI microservice architecture clearly. Handled edge case questions well. Good communication style. Demonstrated deep understanding of async Python and Docker..."
            value={interviewerNotes}
            onChange={(e) => setInterviewerNotes(e.target.value)}
            className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={summarizing || !interviewerNotes.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 px-5 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/30"
            >
              {summarizing ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Synthesizing Feedback...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze & Summarize Feedback</span>
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Structured Summary Result */}
        {interviewSummary && (
          <div className="mt-4 p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                AI Structured Interview Evaluation
              </span>
              <Badge variant="brand" size="sm">
                Score: {interviewSummary.technical_score || 85}%
              </Badge>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              {interviewSummary.summary || interviewSummary.feedback}
            </p>

            <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                Recommended Decision:
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                {interviewSummary.recommendation || 'RECOMMEND HIRE'}
              </span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

