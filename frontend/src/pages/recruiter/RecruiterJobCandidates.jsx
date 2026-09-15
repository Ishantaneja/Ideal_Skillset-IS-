import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  UploadCloud,
  Search,
  Filter,
  ArrowLeft,
  Sparkles,
  Github,
  Award,
  CheckCircle2,
  AlertTriangle,
  FileText,
  GitCompare,
  RotateCw,
  BookmarkCheck,
  ExternalLink,
  ChevronDown,
  X,
  Clock,
  ShieldCheck,
  Check,
  Layers,
} from 'lucide-react';
import { Card, Button, Badge, LoadingSpinner, ProgressBar, Input } from '@/components';
import { ROUTES } from '@/utils/constants';
import { useNotification, useDocumentTitle } from '@/hooks';
import { recruiterService } from '@/services';

export default function RecruiterJobCandidates() {
  const { jobId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const notify = useNotification();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [minFit, setMinFit] = useState('');
  const [githubOnly, setGithubOnly] = useState(false);
  const [certOnly, setCertOnly] = useState(false);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);

  // Batch Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [isRescreening, setIsRescreening] = useState(false);

  useDocumentTitle(job ? `Applicants for ${job.title}` : 'Candidate Pipeline & Batch Ingestion');

  // Check if '?upload=true' was in URL query string to open upload modal immediately
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('upload') === 'true') {
      setShowUploadModal(true);
    }
  }, [location.search]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobData, applicantsData] = await Promise.all([
        recruiterService.getJob(jobId),
        recruiterService.getJobApplicants(jobId, {
          search: search.trim() || undefined,
          stage: stageFilter || undefined,
          min_fit: minFit ? parseFloat(minFit) : undefined,
          verified_only: githubOnly ? true : undefined,
        }),
      ]);
      setJob(jobData);
      setApplicants(applicantsData || []);
    } catch (err) {
      notify.error(err.message || 'Failed to load job applicants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      loadData();
    }
  }, [jobId, stageFilter, minFit, githubOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  // Multiple File Selection Handling
  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate extensions (.pdf, .docx, .txt)
    const validExtensions = ['.pdf', '.docx', '.txt'];
    const validFiles = files.filter((f) => {
      const ext = '.' + f.name.split('.').pop().toLowerCase();
      return validExtensions.includes(ext);
    });

    if (validFiles.length < files.length) {
      notify.warning('Some files were skipped. Only .pdf, .docx, and .txt files are supported.');
    }

    setUploadFiles((prev) => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (index) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartBatchUpload = async () => {
    if (uploadFiles.length === 0) {
      notify.warning('Please select at least one resume file to upload.');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);

      const res = await recruiterService.uploadMultipleResumes(
        jobId,
        uploadFiles,
        (percent) => {
          setUploadProgress(percent);
        }
      );

      setUploadResult(res);
      notify.success(
        `Batch Ingestion Complete: ${res.successfully_ingested} resumes parsed and matched against JD!`
      );
      setUploadFiles([]);
      // Reload candidates
      loadData();
    } catch (err) {
      notify.error(err.message || 'Batch resume upload and screening failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Rescreen all applicants against latest JD blueprint
  const handleRescreenAll = async () => {
    try {
      setIsRescreening(true);
      const res = await recruiterService.screenJobApplicants(jobId);
      notify.success(res.message || 'Applicants re-screened against current blueprint');
      loadData();
    } catch (err) {
      notify.error(err.message || 'Failed to re-screen applicants');
    } finally {
      setIsRescreening(false);
    }
  };

  // Change Candidate Stage
  const handleStageChange = async (candidateId, newStage) => {
    try {
      await recruiterService.updateCandidateStage(candidateId, jobId, newStage);
      notify.success(`Moved candidate to ${newStage.replace('_', ' ').toUpperCase()}`);
      setApplicants((prev) =>
        prev.map((a) => (a.candidate_id === candidateId ? { ...a, current_stage: newStage } : a))
      );
    } catch (err) {
      notify.error('Failed to update stage');
    }
  };

  // Toggle Selection for Comparison
  const handleToggleSelectCandidate = (candId) => {
    setSelectedCandidateIds((prev) => {
      if (prev.includes(candId)) {
        return prev.filter((id) => id !== candId);
      } else {
        if (prev.length >= 5) {
          notify.info('You can compare a maximum of 5 candidates simultaneously.');
          return prev;
        }
        return [...prev, candId];
      }
    });
  };

  // Navigate to Compare Page with selected candidate IDs
  const handleProceedToCompare = () => {
    if (selectedCandidateIds.length < 2) {
      notify.warning('Please select at least 2 candidates to compare side-by-side.');
      return;
    }
    navigate(
      `${ROUTES.RECRUITER_COMPARE}?jobId=${jobId}&candidateIds=${selectedCandidateIds.join(',')}`
    );
  };

  // Filter candidates locally for certificate if requested
  const displayedApplicants = applicants.filter((c) => {
    if (certOnly) {
      // If certOnly is checked, check if candidate has any verified certificate evidence
      const hasCert =
        (c.key_strengths && c.key_strengths.some((s) => s.toLowerCase().includes('cert'))) ||
        (c.has_certificate_verified === true);
      return hasCert;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={() => navigate(ROUTES.RECRUITER_JOBS)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Requisitions</span>
        </button>

        <div className="flex items-center gap-2">
          {selectedCandidateIds.length >= 2 && (
            <Button
              onClick={handleProceedToCompare}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-sm shadow-purple-600/30 animate-pulse"
            >
              <GitCompare className="w-4 h-4" />
              <span>Compare Selected ({selectedCandidateIds.length})</span>
            </Button>
          )}

          <Button
            variant="outline"
            disabled={isRescreening}
            onClick={handleRescreenAll}
            className="text-xs py-2 px-3 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl flex items-center gap-1.5"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRescreening ? 'animate-spin' : ''}`} />
            <span>Re-Screen All</span>
          </Button>

          <Button
            onClick={() => setShowUploadModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 px-4 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/30"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Batch Upload Resumes</span>
          </Button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-indigo-900/40 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold mb-1">
            <span>{job?.department || 'Engineering'}</span>
            <span>•</span>
            <span>{job?.location || 'Remote'}</span>
            <span>•</span>
            <span>Req ID: {jobId?.substring(0, 8)}...</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {job?.title || 'Candidate Screening & Verification Pipeline'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Candidate skills matched against JD requirements and verified with GitHub project repositories and certification records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 text-center min-w-[90px]">
            <div className="text-2xl font-black text-indigo-400">{applicants.length}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Applicants</div>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 text-center min-w-[90px]">
            <div className="text-2xl font-black text-emerald-400">
              {applicants.filter((a) => a.has_github_verified).length}
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400">GitHub Verified</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate name, email, skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Stage filter */}
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200"
            >
              <option value="">All Pipeline Stages</option>
              <option value="applied">Applied</option>
              <option value="ai_screened">AI Screened</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="assessment">Assessment</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Min Fit filter */}
            <select
              value={minFit}
              onChange={(e) => setMinFit(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200"
            >
              <option value="">Any Fit %</option>
              <option value="85">85%+ (Strong Match)</option>
              <option value="70">70%+ (Good Match)</option>
              <option value="60">60%+ (Potential)</option>
            </select>

            {/* GitHub Verified Checkbox */}
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 select-none">
              <input
                type="checkbox"
                checked={githubOnly}
                onChange={(e) => setGithubOnly(e.target.checked)}
                className="w-3.5 h-3.5 text-indigo-600 rounded-sm border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
              />
              <span className="flex items-center gap-1">
                <Github className="w-3.5 h-3.5 text-indigo-500" />
                GitHub Verified
              </span>
            </label>

            {/* Certificate Verified Checkbox */}
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 select-none">
              <input
                type="checkbox"
                checked={certOnly}
                onChange={(e) => setCertOnly(e.target.checked)}
                className="w-3.5 h-3.5 text-indigo-600 rounded-sm border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
              />
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-purple-500" />
                Certificates
              </span>
            </label>

            <Button
              type="submit"
              variant="outline"
              className="text-xs py-2 px-3 border-slate-300 dark:border-slate-700 rounded-xl"
            >
              Filter
            </Button>
          </div>
        </form>
      </Card>

      {/* Candidates List / Matching Matrix */}
      {loading ? (
        <LoadingSpinner fullPage message="Screening candidate pool against JD blueprint..." />
      ) : displayedApplicants.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {applicants.length === 0 ? 'No resumes uploaded for this role yet' : 'No applicants match filters'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
            {applicants.length === 0
              ? 'Upload candidate resumes in batch (.pdf, .docx, .txt). The AI engine will parse each resume, check GitHub projects, verify certificates, and calculate the 9-dimensional JD match.'
              : 'Try resetting your filter parameters or search terms.'}
          </p>
          <Button
            onClick={() => setShowUploadModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-5 py-2.5 rounded-xl inline-flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Multiple Resumes</span>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Header row indicator */}
          <div className="hidden lg:grid grid-cols-12 gap-3 px-6 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <div className="col-span-4 flex items-center gap-2">
              <span>Candidate & Details</span>
            </div>
            <div className="col-span-2 text-center">JD Overall Fit</div>
            <div className="col-span-2 text-center">Verifiable Proof</div>
            <div className="col-span-2 text-center">Readiness Twin</div>
            <div className="col-span-2 text-right">Pipeline Stage</div>
          </div>

          {/* Candidate Cards */}
          {displayedApplicants.map((candidate) => {
            const isSelected = selectedCandidateIds.includes(candidate.candidate_id);
            const fitScore = Math.round(candidate.overall_fit || 0);

            // Fit badge variant
            let fitVariant = 'slate';
            let fitColor = 'text-slate-600 dark:text-slate-300';
            if (fitScore >= 85) {
              fitVariant = 'emerald';
              fitColor = 'text-emerald-600 dark:text-emerald-400';
            } else if (fitScore >= 70) {
              fitVariant = 'brand';
              fitColor = 'text-indigo-600 dark:text-indigo-400';
            } else if (fitScore >= 55) {
              fitVariant = 'amber';
              fitColor = 'text-amber-600 dark:text-amber-400';
            } else {
              fitVariant = 'rose';
              fitColor = 'text-rose-600 dark:text-rose-400';
            }

            return (
              <Card
                key={candidate.candidate_id}
                className={`p-4 transition-all duration-150 border ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50/20 dark:bg-purple-950/20 ring-1 ring-purple-500'
                    : 'hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 items-center">
                  {/* Column 1: Candidate Basic Info & Checkbox */}
                  <div className="col-span-4 flex items-start gap-3 w-full">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelectCandidate(candidate.candidate_id)}
                      className="mt-1 w-4 h-4 text-purple-600 rounded-sm border-slate-300 dark:border-slate-700 focus:ring-purple-500 cursor-pointer"
                      title="Select for comparison"
                    />

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            navigate(
                              `${ROUTES.RECRUITER_CANDIDATE_360.replace(
                                ':candidateId',
                                candidate.candidate_id
                              )}?job_id=${jobId}`
                            )
                          }
                          className="text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                        >
                          {candidate.name}
                        </button>
                        <Badge variant="slate" size="sm">
                          {candidate.experience_level || 'Junior'}
                        </Badge>
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span>{candidate.email}</span>
                        {candidate.location && (
                          <>
                            <span>•</span>
                            <span>{candidate.location}</span>
                          </>
                        )}
                      </div>

                      {/* Recommendation pill */}
                      <div className="pt-0.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          {candidate.recommended_action || 'EVALUATED'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: JD Match Fit Score */}
                  <div className="col-span-2 text-center w-full lg:w-auto">
                    <div className="flex flex-col items-center">
                      <span className={`text-2xl font-black ${fitColor}`}>
                        {fitScore}%
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        JD Fit Score
                      </span>
                      <div className="w-24 mt-1">
                        <ProgressBar progress={fitScore} color={fitVariant} />
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Evidence Proof Badges (GitHub & Certificates) */}
                  <div className="col-span-2 flex flex-col items-center gap-1.5 w-full lg:w-auto">
                    {/* GitHub Badge */}
                    {candidate.has_github_verified ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <Github className="w-3.5 h-3.5" />
                        <span>Code Verified</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] text-slate-400 border border-slate-200 dark:border-slate-800">
                        <Github className="w-3 h-3" />
                        <span>No Repo Proof</span>
                      </span>
                    )}

                    {/* Certificate Badge */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      <Award className="w-3.5 h-3.5" />
                      <span>Cert Evidence</span>
                    </span>
                  </div>

                  {/* Column 4: 5D Readiness Twin */}
                  <div className="col-span-2 text-center w-full lg:w-auto">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                        {Math.round(candidate.readiness_score || 75)}/100
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        5D Readiness
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Conf: {Math.round(candidate.evidence_confidence || 80)}%
                      </span>
                    </div>
                  </div>

                  {/* Column 5: Stage Dropdown & 360 Action */}
                  <div className="col-span-2 flex items-center justify-end gap-2 w-full lg:w-auto">
                    <select
                      value={candidate.current_stage || 'applied'}
                      onChange={(e) => handleStageChange(candidate.candidate_id, e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="applied">Applied</option>
                      <option value="ai_screened">AI Screened</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="assessment">Assessment</option>
                      <option value="interview">Interview</option>
                      <option value="offer">Offer</option>
                      <option value="rejected">Rejected</option>
                    </select>

                    <Button
                      onClick={() =>
                        navigate(
                          `${ROUTES.RECRUITER_CANDIDATE_360.replace(
                            ':candidateId',
                            candidate.candidate_id
                          )}?job_id=${jobId}`
                        )
                      }
                      className="text-xs py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs shrink-0"
                    >
                      360° View
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Batch Resume Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Batch Upload Multiple Resumes
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ingest 1 to 50+ candidate resumes for {job?.title || 'this role'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadResult(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Dropzone Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-300 dark:border-indigo-800 hover:border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 p-8 rounded-2xl text-center cursor-pointer transition-colors space-y-3"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Click to select multiple resumes or drag & drop here
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Accepts <span className="font-semibold text-indigo-600">.PDF</span>,{' '}
                    <span className="font-semibold text-indigo-600">.DOCX</span>, and{' '}
                    <span className="font-semibold text-indigo-600">.TXT</span> resumes in batch
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt"
                  onChange={handleFilesSelected}
                  className="hidden"
                />
              </div>

              {/* Selected Files Preview List */}
              {uploadFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Selected Files ({uploadFiles.length})</span>
                    <button
                      type="button"
                      onClick={() => setUploadFiles([])}
                      className="text-rose-500 hover:underline text-[11px]"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {uploadFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {file.name}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ingestion & Screening Explanation */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Automated Multi-Source AI Screening Pipeline:
                </p>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li>Extracts candidate experience, seniority, and claimed skills.</li>
                  <li>Cross-references GitHub project links and public code repositories.</li>
                  <li>Validates documented certificates & credentials against JD requirements.</li>
                  <li>Generates 9-dimensional match score, 'Why Interview?' rationale, and rank.</li>
                </ul>
              </div>

              {/* Progress indicator during upload */}
              {uploading && (
                <div className="space-y-1.5 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                  <div className="flex justify-between text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                    <span>Parsing and Screening Resumes...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <ProgressBar progress={uploadProgress || 50} color="brand" />
                </div>
              )}

              {/* Upload Result Preview */}
              {uploadResult && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      Successfully screened {uploadResult.successfully_ingested} of{' '}
                      {uploadResult.total_files} resumes
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Applicant records have been added to the pipeline and evaluated against the Job Blueprint.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadResult(null);
                }}
                className="text-xs py-2 px-4 rounded-xl"
              >
                Close
              </Button>
              <Button
                disabled={uploading || uploadFiles.length === 0}
                onClick={handleStartBatchUpload}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 px-5 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/30"
              >
                {uploading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Ingesting & Screening...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Upload & Screen {uploadFiles.length} Resumes</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

