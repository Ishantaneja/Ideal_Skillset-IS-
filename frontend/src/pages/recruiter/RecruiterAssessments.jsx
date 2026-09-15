import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Award,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Code2,
  HelpCircle,
  Layers,
  Send,
  Check,
  RotateCw,
  FileCheck,
} from 'lucide-react';
import { Card, Button, Badge, LoadingSpinner, ProgressBar, Input } from '@/components';
import { ROUTES } from '@/utils/constants';
import { useNotification, useDocumentTitle } from '@/hooks';
import { recruiterService } from '@/services';

export default function RecruiterAssessments() {
  useDocumentTitle('AI Gap-Adaptive Assessments | Recruiter Copilot');
  const location = useLocation();
  const navigate = useNavigate();
  const notify = useNotification();

  const queryParams = new URLSearchParams(location.search);
  const initialJobId = queryParams.get('jobId') || '';
  const initialCandidateId = queryParams.get('candidateId') || '';

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(initialCandidateId);

  const [generatedAssessment, setGeneratedAssessment] = useState(null);
  const [submittedScore, setSubmittedScore] = useState('');
  const [interviewerNotes, setInterviewerNotes] = useState('');
  const [submissionResult, setSubmissionResult] = useState(null);

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

  const handleGenerate = async () => {
    if (!selectedCandidateId || !selectedJobId) {
      notify.warning('Please select both a Job Requisition and a Candidate.');
      return;
    }

    try {
      setGenerating(true);
      const res = await recruiterService.generateAssessment(selectedCandidateId, selectedJobId);
      setGeneratedAssessment(res);
      setSubmissionResult(null);
      notify.success('Role & Gap-Adaptive Assessment Generated!');
    } catch (err) {
      notify.error(err.message || 'Failed to generate assessment');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmitResults = async (e) => {
    e.preventDefault();
    if (!generatedAssessment || !submittedScore) {
      notify.warning('Please provide a candidate score.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        assessment_id: generatedAssessment.id || `asm_${Date.now()}`,
        candidate_id: selectedCandidateId,
        job_id: selectedJobId,
        score: parseFloat(submittedScore),
        interviewer_notes: interviewerNotes.trim(),
      };

      const res = await recruiterService.submitAssessment(payload);
      setSubmissionResult(res);
      notify.success('Assessment evaluation submitted! Skill verifications updated.');
    } catch (err) {
      notify.error(err.message || 'Failed to submit assessment results');
    } finally {
      setSubmitting(false);
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
      <div className="p-6 rounded-3xl bg-slate-900 border border-purple-900/40 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30 uppercase tracking-wider">
              Technical Evaluation
            </span>
            <span className="text-xs text-slate-400">• Gap-Adaptive Testing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <Award className="w-7 h-7 text-purple-400" />
            AI Role & Gap-Adaptive Assessment
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Generates custom technical challenges and problem-solving scenarios specifically targeting unverified skills or high-priority JD requirements.
          </p>
        </div>
      </div>

      {/* Target Requisition & Candidate Selector Card */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Configure Assessment Target
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
            onClick={handleGenerate}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/30"
          >
            {generating ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Synthesizing Adaptive Challenge...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Adaptive Assessment</span>
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Generated Assessment Preview */}
      {generatedAssessment && (
        <div className="space-y-6 animate-fadeIn">
          <Card className="p-6 space-y-4 border-indigo-200 dark:border-indigo-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-500">
                  Custom Generated Test
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {generatedAssessment.title || 'Technical Skill Verification Assessment'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="brand" size="sm">
                  {generatedAssessment.estimated_minutes || 45} mins
                </Badge>
                <Badge variant="slate" size="sm">
                  {generatedAssessment.difficulty || 'Intermediate'}
                </Badge>
              </div>
            </div>

            {/* Target Skills */}
            {generatedAssessment.target_skills && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Skills Evaluated:</span>
                {generatedAssessment.target_skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Assessment Questions ({generatedAssessment.questions?.length || 0})
              </h4>

              {(generatedAssessment.questions || []).map((q, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      Question {idx + 1} • {q.type?.toUpperCase() || 'PRACTICAL'}
                    </span>
                    <span className="text-[10px] text-slate-400">{q.skill}</span>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {q.prompt || q.question}
                  </p>

                  {/* Options if Multiple Choice */}
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, oidx) => (
                        <div
                          key={oidx}
                          className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
                        >
                          <span className="font-bold mr-2 text-slate-400">
                            {String.fromCharCode(65 + oidx)}.
                          </span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Starter code if coding challenge */}
                  {q.starter_code && (
                    <div className="p-3 bg-slate-900 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto">
                      <pre>{q.starter_code}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Submission & Grading Form */}
          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-500" />
              Record Candidate Assessment Results
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Enter the candidate's test score to automatically update their evidence verification status and 5D readiness quotient.
            </p>

            <form onSubmit={handleSubmitResults} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Candidate Score (%) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    required
                    placeholder="e.g. 88"
                    value={submittedScore}
                    onChange={(e) => setSubmittedScore(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Reviewer Notes / Feedback
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Strong algorithmic logic, clean API design, verified hands-on proficiency."
                    value={interviewerNotes}
                    onChange={(e) => setInterviewerNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-sm shadow-emerald-600/30"
                >
                  <Check className="w-4 h-4" />
                  <span>{submitting ? 'Submitting...' : 'Record & Verify Score'}</span>
                </Button>
              </div>
            </form>

            {/* Submission confirmation */}
            {submissionResult && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 font-medium">
                {submissionResult.message || 'Candidate assessment verified and saved successfully!'}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

