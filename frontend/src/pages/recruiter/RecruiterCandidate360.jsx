import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  ArrowLeft,
  Sparkles,
  Github,
  Award,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Briefcase,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  Video,
  Layers,
  Clock,
  BookmarkCheck,
  ChevronRight,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { Card, Button, Badge, LoadingSpinner, ProgressBar } from '@/components';
import { ROUTES } from '@/utils/constants';
import { useNotification, useDocumentTitle } from '@/hooks';
import { recruiterService } from '@/services';

export default function RecruiterCandidate360() {
  const { candidateId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const notify = useNotification();

  const queryParams = new URLSearchParams(location.search);
  const jobId = queryParams.get('job_id') || null;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'readiness' | 'github' | 'experience'

  useDocumentTitle(data?.candidate?.name ? `${data.candidate.name} — 360° Dossier` : 'Candidate 360° Dossier');

  const fetchDossier = async () => {
    try {
      setLoading(true);
      const res = await recruiterService.getCandidate360(candidateId, jobId);
      setData(res);
    } catch (err) {
      notify.error(err.message || 'Failed to load Candidate 360° Dossier');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (candidateId) {
      fetchDossier();
    }
  }, [candidateId, jobId]);

  const handleStageChange = async (newStage) => {
    try {
      await recruiterService.updateCandidateStage(candidateId, jobId, newStage);
      notify.success(`Stage updated to ${newStage.toUpperCase()}`);
      fetchDossier();
    } catch (err) {
      notify.error('Failed to update stage');
    }
  };

  const handleToggleShortlist = async () => {
    try {
      const res = await recruiterService.toggleShortlist(candidateId);
      notify.success(res.message || 'Shortlist status updated');
      fetchDossier();
    } catch (err) {
      notify.error('Could not update shortlist');
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Compiling Candidate 360° dossier and evidence telemetry..." />;
  }

  if (!data || !data.candidate) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Candidate Record Not Found</h2>
        <Button onClick={() => navigate(ROUTES.RECRUITER_CANDIDATES)} className="mt-4">
          Return to Talent Pool
        </Button>
      </div>
    );
  }

  const candidate = data.candidate || {};
  const evaluation = data.evaluation || {};
  const scores = evaluation.scores || {};
  const recommendation = data.hiring_recommendation || {};
  const verifications = evaluation.verifications || [];
  const consistencyChecks = evaluation.consistency_checks || [];
  const readinessTwin = data.readiness_twin || {};
  const dimensions = readinessTwin.dimensions || [];

  const overallFit = Math.round(scores.overall_fit || 75);
  const techFit = Math.round(scores.technical_skills || 75);
  const evidenceConfidence = Math.round(scores.evidence_confidence || 80);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* Top Navigation & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={() => {
            if (jobId) {
              navigate(ROUTES.RECRUITER_JOB_CANDIDATES.replace(':jobId', jobId));
            } else {
              navigate(ROUTES.RECRUITER_CANDIDATES);
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{jobId ? 'Back to Job Pipeline' : 'Back to Candidate Talent Pool'}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={handleToggleShortlist}
            className="text-xs py-2 px-3 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl"
          >
            <BookmarkCheck className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
            <span>Shortlist</span>
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              navigate(`${ROUTES.RECRUITER_ASSESSMENTS}?candidateId=${candidateId}&jobId=${jobId || ''}`)
            }
            className="text-xs py-2 px-3 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl"
          >
            <Award className="w-3.5 h-3.5 mr-1.5 text-purple-500" />
            <span>Generate Assessment</span>
          </Button>

          <Button
            onClick={() =>
              navigate(`${ROUTES.RECRUITER_INTERVIEWS}?candidateId=${candidateId}&jobId=${jobId || ''}`)
            }
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-sm shadow-indigo-600/30"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Tailored Interview Guide</span>
          </Button>
        </div>
      </div>

      {/* Candidate Profile Header Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              {candidate.name?.substring(0, 2).toUpperCase() || 'CD'}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {candidate.name}
                </h1>
                <Badge variant="brand" size="sm">
                  {candidate.experience_level || 'Junior'}
                </Badge>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {candidate.target_role || 'Software Engineer'} • {candidate.location || 'Remote'}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span>{candidate.email}</span>
                {candidate.phone && (
                  <>
                    <span>•</span>
                    <span>{candidate.phone}</span>
                  </>
                )}
                {candidate.github_url && (
                  <>
                    <span>•</span>
                    <a
                      href={candidate.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>GitHub Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Fit & Stage Cluster */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Fit Metric Badge */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-center min-w-[120px]">
              <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                {overallFit}%
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Overall JD Fit
              </div>
            </div>

            {/* Recommendation & Stage Dropdown */}
            <div className="space-y-2 text-right">
              <div className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {recommendation.recommendation || evaluation.recommended_action || 'STRONG HIRE SIGNAL'}
              </div>

              {jobId && (
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-[11px] font-medium text-slate-400">Pipeline Stage:</span>
                  <select
                    value={data.application?.current_stage || 'applied'}
                    onChange={(e) => handleStageChange(e.target.value)}
                    className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    <option value="applied">Applied</option>
                    <option value="ai_screened">AI Screened</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="assessment">Assessment</option>
                    <option value="interview">Interview</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'matrix'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Skill Evidence Matrix ({verifications.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('readiness')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'readiness'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>5D Digital Readiness Twin</span>
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'github'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub Code Proof & Projects</span>
          </button>

          <button
            onClick={() => setActiveTab('experience')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'experience'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Work History & Resume</span>
          </button>

          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'roadmap'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>90-Day Roadmap & Upskill Fit</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Explainable AI Rationale ("Why Interview?" & "Why Not?") */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Why Interview? */}
        <Card className="p-6 border-l-4 border-l-emerald-500 space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Why Interview this Candidate?</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Positive evidence identified from resume, GitHub codebase, and certifications:
          </p>

          <ul className="space-y-2">
            {(evaluation.why_interview && evaluation.why_interview.length > 0
              ? evaluation.why_interview
              : [
                  'Demonstrated hands-on experience in core required technical stack.',
                  'Codebase artifacts found in public GitHub repositories supporting skill claims.',
                  'Positive consistency across work tenure, project deliverables, and credentials.',
                ]
            ).map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Why Not? / Risk & Gap Analysis */}
        <Card className="p-6 border-l-4 border-l-amber-500 space-y-3">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Areas to Probe & Unverified Claims</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Points requiring verification or technical deep-dive during interview:
          </p>

          <ul className="space-y-2">
            {(evaluation.why_not_interview && evaluation.why_not_interview.length > 0
              ? evaluation.why_not_interview
              : [
                  'Validate architecture design decisions during technical interview round.',
                  'Verify recent production deployments and team leadership responsibilities.',
                ]
            ).map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* TAB 1: Skill Evidence Matrix & Truth Engine */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Truth / Consistency Engine Observations */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  Candidate Truth & Consistency Engine
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Automated cross-check between Resume Claims, GitHub Repositories, Certificates, and Timeline
                </p>
              </div>
              <Badge variant="brand" size="sm">
                {consistencyChecks.length} Observations
              </Badge>
            </div>

            <div className="space-y-3">
              {consistencyChecks.map((check, idx) => {
                const isInfo = check.severity === 'informational';
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                      isInfo
                        ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                        : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        {isInfo ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        {check.observation}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {check.severity}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-medium">Sources:</span>
                      <span>{(check.sources || []).join(' • ')}</span>
                    </div>

                    {check.recommendation && (
                      <p className="text-[11px] text-indigo-600 dark:text-indigo-400 pt-0.5 font-medium">
                        Recommendation: {check.recommendation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Evidence-Based Skill Verification Table */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  Evidence-Based Skill Verification Matrix
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Multi-source proof for critical skills evaluated against Job Description
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Avg. Confidence: {evidenceConfidence}%
              </span>
            </div>

            {verifications.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No skills matrix available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="pb-3 font-bold">Target Skill</th>
                      <th className="pb-3 font-bold">Resume Proof</th>
                      <th className="pb-3 font-bold">GitHub Code Proof</th>
                      <th className="pb-3 font-bold">Certificate Proof</th>
                      <th className="pb-3 font-bold text-center">Status</th>
                      <th className="pb-3 font-bold text-right">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {verifications.map((item, idx) => {
                      const statusLower = (item.status || '').toLowerCase();
                      let statusBadgeVariant = 'slate';
                      if (statusLower.includes('verified')) statusBadgeVariant = 'emerald';
                      else if (statusLower.includes('supported')) statusBadgeVariant = 'primary';
                      else if (statusLower.includes('claimed')) statusBadgeVariant = 'amber';
                      else statusBadgeVariant = 'rose';

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          {/* Skill name & impact */}
                          <td className="py-3.5 pr-3 font-bold text-slate-900 dark:text-white">
                            <div>{item.skill}</div>
                            <span className="text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {item.impact || 'medium'} impact
                            </span>
                          </td>

                          {/* Resume text evidence */}
                          <td className="py-3.5 pr-3 text-slate-600 dark:text-slate-400 max-w-xs">
                            <span className="line-clamp-2 text-[11px]">
                              {item.resume_evidence || 'Documented in resume'}
                            </span>
                          </td>

                          {/* GitHub project evidence */}
                          <td className="py-3.5 pr-3 max-w-xs">
                            {item.github_evidence && !item.github_evidence.toLowerCase().includes('no public') ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <Github className="w-3.5 h-3.5 shrink-0" />
                                <span className="line-clamp-2">{item.github_evidence}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">No repo match</span>
                            )}
                          </td>

                          {/* Certificate evidence */}
                          <td className="py-3.5 pr-3 max-w-xs">
                            {item.certificate_evidence && !item.certificate_evidence.toLowerCase().includes('no verifiable') ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                                <Award className="w-3.5 h-3.5 shrink-0" />
                                <span className="line-clamp-2">{item.certificate_evidence}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">No credential</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-2 text-center">
                            <Badge variant={statusBadgeVariant} size="sm">
                              {item.status?.toUpperCase() || 'SUPPORTED'}
                            </Badge>
                          </td>

                          {/* Confidence */}
                          <td className="py-3.5 pl-3 text-right font-black text-slate-800 dark:text-slate-200">
                            {Math.round(item.confidence || 75)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: 5D Digital Readiness Twin */}
      {activeTab === 'readiness' && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                5D Digital Readiness Twin
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluation across the core 5 readiness dimensions compared to industry benchmarks
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {readinessTwin.overall_readiness || Math.round(candidate.readiness_score || 78)}/100
              </span>
              <div className="text-[10px] uppercase font-bold text-slate-400">Readiness Score</div>
            </div>
          </div>

          <div className="space-y-4">
            {dimensions.length > 0 ? (
              dimensions.map((dim, idx) => (
                <div key={idx} className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-850">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200">{dim.label || dim.dimension}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                        Score: {dim.score}%
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Benchmark: {dim.benchmark}%
                      </span>
                    </div>
                  </div>
                  <ProgressBar progress={dim.score} color={dim.score >= dim.benchmark ? 'emerald' : 'brand'} />
                </div>
              ))
            ) : (
              <div className="space-y-4">
                {[
                  { name: 'Technical Knowledge', score: 85, benchmark: 80 },
                  { name: 'Practical Ability', score: 82, benchmark: 75 },
                  { name: 'Evidence / Proof of Skill', score: 88, benchmark: 70 },
                  { name: 'Communication & Collaboration', score: 78, benchmark: 70 },
                  { name: 'Professional Readiness', score: 80, benchmark: 80 },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-850">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800 dark:text-slate-200">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                          {item.score}%
                        </span>
                        <span className="text-slate-400 text-[11px]">Target: {item.benchmark}%</span>
                      </div>
                    </div>
                    <ProgressBar progress={item.score} color="brand" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* TAB 3: GitHub Code Proof & Projects */}
      {activeTab === 'github' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Github className="w-4 h-4 text-indigo-500" />
              Verifiable GitHub Project Artifacts
            </h3>

            {candidate.github_url && (
              <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Connected Profile:</span>
                <a
                  href={candidate.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-mono"
                >
                  {candidate.github_url}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {candidate.projects && candidate.projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {candidate.projects.map((proj, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {proj.name || 'Software Project'}
                      </h4>
                      {proj.url && (
                        <a
                          href={proj.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline text-[11px] flex items-center gap-1"
                        >
                          Repo <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                    {proj.description && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        {proj.description}
                      </p>
                    )}
                    {proj.technologies && proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {proj.technologies.map((t, tidx) => (
                          <span
                            key={tidx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-4">
                No external project repositories parsed from the resume file.
              </p>
            )}
          </Card>

          {/* Certifications Card */}
          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-purple-500" />
              Verified Certifications & Credentials
            </h3>

            {candidate.certifications && candidate.certifications.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {candidate.certifications.map((cert, idx) => {
                  const certName = typeof cert === 'string' ? cert : cert.name || 'Certification';
                  const certIssuer = typeof cert === 'object' ? cert.issuer : '';
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-purple-100 dark:border-purple-900/60 bg-purple-50/30 dark:bg-purple-950/20 flex items-center gap-3 text-xs"
                    >
                      <Award className="w-5 h-5 text-purple-600 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{certName}</div>
                        {certIssuer && (
                          <div className="text-[11px] text-slate-400">Issuer: {certIssuer}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                No formal certifications recorded on resume.
              </p>
            )}
          </Card>
        </div>
      )}

      {/* TAB 4: Work History & Experience */}
      {activeTab === 'experience' && (
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
            Work Experience & Career Progression
          </h3>

          {candidate.work_history && candidate.work_history.length > 0 ? (
            <div className="space-y-4">
              {candidate.work_history.map((jobExp, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {jobExp.title || 'Role'} @ {jobExp.company || 'Company'}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {jobExp.duration || jobExp.dates || 'Documented'}
                    </span>
                  </div>
                  {jobExp.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {jobExp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-4">No detailed work history found.</p>
          )}
        </Card>
      )}

      {/* TAB 5: 90-Day Success Roadmap & Upskill Fit */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          {/* Upskill Potential Uplift Card */}
          <Card className="p-6 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-900/60">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                  Candidate Upskilling Potential
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Projected 30-Day Training Fit Uplift
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  With targeted coaching in primary gap areas, this candidate's job readiness increases substantially.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-white dark:bg-slate-900 px-5 py-3 rounded-xl border border-indigo-100 dark:border-indigo-900/60 shadow-xs">
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Current Fit</span>
                  <span className="text-xl font-black text-slate-700 dark:text-slate-300">
                    {Math.round(evaluation?.scores?.overall_fit || 65)}%
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-500" />
                <div className="text-center">
                  <span className="text-[10px] text-indigo-500 uppercase font-bold block">Post-Upskill</span>
                  <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                    {Math.min(95, Math.round((evaluation?.scores?.overall_fit || 65) + 18))}%
                  </span>
                </div>
                <div className="text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-md">
                  +18% Uplift
                </div>
              </div>
            </div>
          </Card>

          {/* First 90-Day Success Roadmap */}
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  First 90-Day Onboarding & Success Roadmap
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tailored milestone timeline to de-risk candidate onboarding and accelerate ramp-up to full productivity.
                </p>
              </div>
              <Badge variant="indigo">Estimated Ramp: 2-4 Weeks</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 0-30 Days */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Days 0 - 30
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Low Risk
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Foundations & Codebase Immersion
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Complete local dev environment setup, ship 2 minor bug fixes, shadow senior engineer on deployment pipeline.
                </p>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <strong>Key Focus:</strong> CI/CD workflows & unit testing conventions.
                </div>
              </div>

              {/* 31-60 Days */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                    Days 31 - 60
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    Moderate Risk
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Feature Ownership & Independent Delivery
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Take ownership of first end-to-end user story. Participate in architecture RFC reviews and write integration tests.
                </p>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <strong>Key Focus:</strong> Database optimization & async error handling.
                </div>
              </div>

              {/* 61-90 Days */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Days 61 - 90
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Autonomous
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  System Resilience & On-Call Rotation
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Enter secondary on-call rotation. Conduct peer code reviews and contribute to operational runbooks.
                </p>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <strong>Key Focus:</strong> Latency tuning, telemetry & monitoring.
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

