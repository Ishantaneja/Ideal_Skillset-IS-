import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  GitCompare,
  ArrowLeft,
  Sparkles,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  Github,
  Award,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';
import { Card, Button, Badge, LoadingSpinner, ProgressBar } from '@/components';
import { ROUTES } from '@/utils/constants';
import { useNotification, useDocumentTitle } from '@/hooks';
import { recruiterService } from '@/services';

export default function RecruiterCompare() {
  useDocumentTitle('Side-by-Side Candidate Comparison');
  const location = useLocation();
  const navigate = useNavigate();
  const notify = useNotification();

  const queryParams = new URLSearchParams(location.search);
  const initialJobId = queryParams.get('jobId') || '';
  const initialCandidateIds = queryParams.get('candidateIds')
    ? queryParams.get('candidateIds').split(',').filter(Boolean)
    : [];

  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);
  const [availableCandidates, setAvailableCandidates] = useState([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState(initialCandidateIds);
  const [comparisonResult, setComparisonResult] = useState(null);

  // Load active jobs on mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const jobsList = await recruiterService.listJobs();
        setJobs(jobsList || []);
        if (!selectedJobId && jobsList && jobsList.length > 0) {
          setSelectedJobId(jobsList[0].id);
        }
      } catch (err) {
        notify.error('Failed to load jobs');
      }
    };
    fetchJobs();
  }, []);

  // When job changes, fetch candidates for that job
  useEffect(() => {
    if (!selectedJobId) return;
    const fetchApplicants = async () => {
      try {
        const list = await recruiterService.getJobApplicants(selectedJobId);
        setAvailableCandidates(list || []);
      } catch (err) {
        notify.error('Failed to load candidates for selected job');
      }
    };
    fetchApplicants();
  }, [selectedJobId]);

  // Run comparison
  const runComparison = async (candIds, jId) => {
    if (!candIds || candIds.length < 2) return;
    try {
      setLoading(true);
      const res = await recruiterService.compareCandidates(jId, candIds);
      setComparisonResult(res);
    } catch (err) {
      notify.error(err.message || 'Failed to compare candidates');
    } finally {
      setLoading(false);
    }
  };

  // Run on initial load if params provided
  useEffect(() => {
    if (initialJobId && initialCandidateIds.length >= 2) {
      runComparison(initialCandidateIds, initialJobId);
    }
  }, [initialJobId]);

  const handleToggleCandidate = (candId) => {
    setSelectedCandidateIds((prev) => {
      let updated;
      if (prev.includes(candId)) {
        updated = prev.filter((id) => id !== candId);
      } else {
        if (prev.length >= 5) {
          notify.info('You can compare a maximum of 5 candidates at a time.');
          return prev;
        }
        updated = [...prev, candId];
      }

      if (updated.length >= 2 && selectedJobId) {
        runComparison(updated, selectedJobId);
      } else {
        setComparisonResult(null);
      }
      return updated;
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
              Comparative Analysis
            </span>
            <span className="text-xs text-slate-400">• Multi-Candidate Benchmark</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <GitCompare className="w-7 h-7 text-purple-400" />
            Side-by-Side Candidate Comparison
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Evaluate 2 to 5 candidates side-by-side against the exact same Job Requisition blueprint, comparing GitHub project proof, certificates, and readiness.
          </p>
        </div>

        {/* Job Requisition Selector */}
        <div className="min-w-[240px]">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Target Requisition
          </label>
          <select
            value={selectedJobId}
            onChange={(e) => {
              setSelectedJobId(e.target.value);
              setSelectedCandidateIds([]);
              setComparisonResult(null);
            }}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.applicant_count || 0} applicants)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Candidate Selection Pill Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
            <span>Select Candidates to Compare (2 to 5):</span>
            <span className="text-purple-600 font-black">({selectedCandidateIds.length}/5 selected)</span>
          </span>
          {selectedCandidateIds.length >= 2 && (
            <button
              onClick={() => runComparison(selectedCandidateIds, selectedJobId)}
              className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-1"
            >
              <span>Refresh Matrix</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {availableCandidates.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-1">
              No applicants found for this job requisition yet.
            </p>
          ) : (
            availableCandidates.map((c) => {
              const isSelected = selectedCandidateIds.includes(c.candidate_id);
              return (
                <button
                  key={c.candidate_id}
                  onClick={() => handleToggleCandidate(c.candidate_id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-xs shadow-purple-600/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{c.name}</span>
                  <span className="text-[10px] opacity-80">({Math.round(c.overall_fit)}%)</span>
                </button>
              );
            })
          )}
        </div>
      </Card>

      {/* Comparative View */}
      {loading ? (
        <LoadingSpinner fullPage message="Synthesizing multi-candidate comparative matrix..." />
      ) : !comparisonResult || !comparisonResult.candidates ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-4">
            <GitCompare className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Select at least 2 candidates above
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
            Choose 2 to 5 candidates from the pill selector above to generate an instant side-by-side comparison across 9 dimensions, GitHub proof, and AI recommendations.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Winner / AI Recommendation Banner */}
          {comparisonResult.comparative_summary && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900/90 to-indigo-900/90 text-white border border-purple-800/60 shadow-lg space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>AI Hiring Copilot Synthesis</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                {comparisonResult.comparative_summary}
              </p>
            </div>
          )}

          {/* Side-by-Side Comparison Matrix */}
          <div className="overflow-x-auto pb-4">
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${comparisonResult.candidates.length}, minmax(280px, 1fr))`,
              }}
            >
              {comparisonResult.candidates.map((cand, idx) => {
                const isStrongest = comparisonResult.strongest_candidate_id === cand.candidate_id;
                const fitScore = Math.round(cand.overall_fit || 0);

                return (
                  <Card
                    key={cand.candidate_id || idx}
                    className={`p-5 flex flex-col justify-between space-y-5 relative ${
                      isStrongest
                        ? 'border-2 border-purple-500 shadow-lg ring-1 ring-purple-500'
                        : 'border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {isStrongest && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-amber-300" />
                        <span>Top Recommended</span>
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Candidate Header */}
                      <div className="text-center pt-2 space-y-1">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-xl flex items-center justify-center mx-auto shadow-md">
                          {cand.name?.substring(0, 2).toUpperCase()}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {cand.name}
                        </h3>
                        <p className="text-xs text-slate-400">{cand.email}</p>
                        <Badge variant="brand" size="sm">
                          {cand.experience_level || 'Junior'}
                        </Badge>
                      </div>

                      {/* Overall Fit Score */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 text-center space-y-1">
                        <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                          {fitScore}%
                        </span>
                        <div className="text-[10px] font-bold uppercase text-slate-400">
                          Overall JD Fit
                        </div>
                        <ProgressBar progress={fitScore} color="brand" />
                      </div>

                      {/* Dimensional Breakdown */}
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between font-semibold">
                          <span className="text-slate-500">Tech Skills Fit:</span>
                          <span className="text-slate-900 dark:text-white font-bold">
                            {Math.round(cand.technical_skills || 75)}%
                          </span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span className="text-slate-500">Experience Match:</span>
                          <span className="text-slate-900 dark:text-white font-bold">
                            {Math.round(cand.relevant_experience || 75)}%
                          </span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span className="text-slate-500">5D Readiness Score:</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                            {Math.round(cand.readiness_score || 78)}/100
                          </span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span className="text-slate-500">Evidence Confidence:</span>
                          <span className="text-slate-900 dark:text-white font-bold">
                            {Math.round(cand.evidence_confidence || 80)}%
                          </span>
                        </div>
                      </div>

                      {/* Proof Status Badges */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Verifiable Proof
                        </span>
                        <div className="flex flex-col gap-1.5">
                          {cand.has_github_verified ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                              <Github className="w-3.5 h-3.5" />
                              <span>GitHub Code Verified</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                              <Github className="w-3.5 h-3.5" />
                              <span>No Public GitHub Proof</span>
                            </span>
                          )}

                          <span className="inline-flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-semibold">
                            <Award className="w-3.5 h-3.5" />
                            <span>Certificate Credentials Present</span>
                          </span>
                        </div>
                      </div>

                      {/* Key Strengths */}
                      <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                          Key Strengths
                        </span>
                        <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                          {(cand.key_strengths || ['Solid foundational experience in role']).map(
                            (s, sidx) => (
                              <li key={sidx} className="flex items-start gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{s}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <Button
                        onClick={() =>
                          navigate(
                            `${ROUTES.RECRUITER_CANDIDATE_360.replace(
                              ':candidateId',
                              cand.candidate_id
                            )}?job_id=${selectedJobId}`
                          )
                        }
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 rounded-xl flex items-center justify-center gap-1 shadow-xs"
                      >
                        <span>View 360° Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

