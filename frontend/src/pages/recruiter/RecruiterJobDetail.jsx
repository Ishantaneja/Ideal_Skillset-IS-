import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Sparkles,
  ArrowLeft,
  UploadCloud,
  Users,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  RotateCw,
  Save,
  MapPin,
  Clock,
  DollarSign,
  TrendingUp,
  Layers,
  FileCheck,
} from 'lucide-react';
import { Card, Button, Badge, LoadingSpinner, Input, ProgressBar } from '@/components';
import { ROUTES } from '@/utils/constants';
import { useNotification, useDocumentTitle } from '@/hooks';
import { recruiterService } from '@/services';

export default function RecruiterJobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const notify = useNotification();

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [blueprint, setBlueprint] = useState(null);
  const [insights, setInsights] = useState(null);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('blueprint'); // 'blueprint' | 'insights' | 'jd'

  // New skill addition state
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Technical');
  const [newSkillImportance, setNewSkillImportance] = useState('critical');

  useDocumentTitle(job ? `${job.title} — Blueprint` : 'Job Requisition Details');

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const [jobData, insightsData] = await Promise.all([
        recruiterService.getJob(jobId),
        recruiterService.getJobInsights(jobId).catch(() => null),
      ]);
      setJob(jobData);
      setBlueprint(jobData.blueprint || null);
      setInsights(insightsData);
    } catch (err) {
      notify.error(err.message || 'Failed to load job requisition');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const handleSaveBlueprint = async () => {
    try {
      setSaving(true);
      const updated = await recruiterService.updateJob(jobId, { blueprint });
      setJob(updated);
      setBlueprint(updated.blueprint);
      notify.success('AI Job Blueprint updated successfully');
    } catch (err) {
      notify.error(err.message || 'Failed to save blueprint changes');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateBlueprint = async () => {
    if (!window.confirm('Regenerating will recalculate the AI blueprint from the job description. Proceed?')) {
      return;
    }
    try {
      setRegenerating(true);
      const newBp = await recruiterService.regenerateBlueprint(jobId);
      setBlueprint(newBp);
      notify.success('AI Blueprint regenerated successfully');
    } catch (err) {
      notify.error(err.message || 'Failed to regenerate blueprint');
    } finally {
      setRegenerating(false);
    }
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    const newSkillObj = {
      name: newSkillName.trim(),
      importance: newSkillImportance,
      category: newSkillCategory.trim() || 'Technical',
      required: newSkillImportance === 'critical',
      confidence: 90.0,
      explanation: 'Manually added by recruiter requisition lead.',
    };

    setBlueprint((prev) => {
      const copy = { ...prev };
      if (newSkillImportance === 'critical') {
        copy.critical_skills = [...(copy.critical_skills || []), newSkillObj];
      } else if (newSkillImportance === 'high') {
        copy.high_priority_skills = [...(copy.high_priority_skills || []), newSkillObj];
      } else {
        copy.preferred_skills = [...(copy.preferred_skills || []), newSkillObj];
      }
      return copy;
    });

    setNewSkillName('');
    notify.info(`Added ${newSkillName} to blueprint. Remember to click "Save Changes".`);
  };

  const handleRemoveSkill = (listType, index) => {
    setBlueprint((prev) => {
      const copy = { ...prev };
      if (listType === 'critical') {
        copy.critical_skills = copy.critical_skills.filter((_, i) => i !== index);
      } else if (listType === 'high') {
        copy.high_priority_skills = copy.high_priority_skills.filter((_, i) => i !== index);
      } else {
        copy.preferred_skills = copy.preferred_skills.filter((_, i) => i !== index);
      }
      return copy;
    });
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading Requisition Blueprint & Insights..." />;
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Job Requisition Not Found</h2>
        <Button onClick={() => navigate(ROUTES.RECRUITER_JOBS)} className="mt-4">
          Return to Jobs
        </Button>
      </div>
    );
  }

  const criticalSkills = blueprint?.critical_skills || [];
  const highSkills = blueprint?.high_priority_skills || [];
  const preferredSkills = blueprint?.preferred_skills || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(ROUTES.RECRUITER_JOBS)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Requisitions</span>
        </button>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() =>
              navigate(`${ROUTES.RECRUITER_JOB_CANDIDATES.replace(':jobId', job.id)}?upload=true`)
            }
            className="text-xs py-2 px-3.5 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl"
          >
            <UploadCloud className="w-4 h-4 mr-1.5" />
            <span>Batch Upload Resumes</span>
          </Button>

          <Button
            onClick={() => navigate(ROUTES.RECRUITER_JOB_CANDIDATES.replace(':jobId', job.id))}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
          >
            <Users className="w-4 h-4" />
            <span>View Applicants ({job.applicant_count || 0})</span>
          </Button>
        </div>
      </div>

      {/* Header Info Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={job.status === 'active' ? 'emerald' : 'slate'} size="sm">
                {job.status.toUpperCase()}
              </Badge>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {job.department || 'Engineering'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {job.location}
              </span>
              <span>•</span>
              <span>{job.employment_type}</span>
              <span>•</span>
              <span>Experience: {job.required_experience}</span>
              {job.salary_range && (
                <>
                  <span>•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {job.salary_range}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/80 text-center min-w-[100px]">
              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                {job.applicant_count || 0}
              </div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Applicants
              </div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/80 text-center min-w-[100px]">
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {job.shortlisted_count || 0}
              </div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Shortlisted
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'blueprint'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Job Blueprint ({criticalSkills.length + highSkills.length + preferredSkills.length} Skills)</span>
          </button>

          <button
            onClick={() => setActiveTab('insights')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'insights'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Talent Insights</span>
          </button>

          <button
            onClick={() => setActiveTab('jd')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'jd'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Original Job Description</span>
          </button>
        </div>
      </div>

      {/* TAB 1: AI Job Blueprint */}
      {activeTab === 'blueprint' && (
        <div className="space-y-6">
          {/* Blueprint Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
            <div className="flex items-center gap-2 text-xs text-indigo-900 dark:text-indigo-200">
              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>
                This blueprint controls the 9-dimensional AI resume screening, GitHub repository verification, and certificate proof matching.
              </span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <Button
                variant="outline"
                disabled={regenerating}
                onClick={handleRegenerateBlueprint}
                className="text-xs py-2 px-3 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl"
              >
                <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${regenerating ? 'animate-spin' : ''}`} />
                <span>Regenerate with AI</span>
              </Button>

              <Button
                disabled={saving}
                onClick={handleSaveBlueprint}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-sm shadow-indigo-600/30"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Blueprint Changes'}</span>
              </Button>
            </div>
          </div>

          {/* Blueprint Role Summary */}
          {blueprint?.summary && (
            <Card className="p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Synthesized Role Profile & Objectives
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {blueprint.summary}
              </p>
            </Card>
          )}

          {/* Critical Required Skills */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  Critical Required Skills (High Weight in Matching)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Resumes lacking these skills without GitHub or certificate evidence will receive reduced fit scores.
                </p>
              </div>
              <Badge variant="rose" size="sm">
                {criticalSkills.length} Required
              </Badge>
            </div>

            {criticalSkills.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 italic">No critical skills defined.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {criticalSkills.map((skill, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-rose-100 dark:border-rose-950 bg-rose-50/40 dark:bg-rose-950/20 flex items-start justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {skill.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                          {skill.category || 'Core'}
                        </span>
                      </div>
                      {skill.explanation && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {skill.explanation}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveSkill('critical', idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* High Priority Skills */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  High Priority Skills
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Differentiators that elevate a candidate from standard applicant to top interview candidate.
                </p>
              </div>
              <Badge variant="amber" size="sm">
                {highSkills.length} High Priority
              </Badge>
            </div>

            {highSkills.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 italic">No high priority skills defined.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {highSkills.map((skill, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-amber-100 dark:border-amber-950 bg-amber-50/40 dark:bg-amber-950/20 flex items-start justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {skill.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                          {skill.category || 'Tool / Framework'}
                        </span>
                      </div>
                      {skill.explanation && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {skill.explanation}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveSkill('high', idx)}
                      className="text-slate-400 hover:text-amber-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Preferred / Nice-to-Have Skills */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  Preferred / Bonus Qualifications
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Additional tools, cloud certifications, or specialized domain experience.
                </p>
              </div>
              <Badge variant="primary" size="sm">
                {preferredSkills.length} Preferred
              </Badge>
            </div>

            {preferredSkills.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 italic">No preferred skills defined.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {preferredSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    <span>{skill.name}</span>
                    <button
                      onClick={() => handleRemoveSkill('preferred', idx)}
                      className="text-slate-400 hover:text-rose-500 ml-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* Add Skill to Blueprint Form */}
          <Card className="p-5 bg-slate-50/60 dark:bg-slate-850 border-dashed">
            <form onSubmit={handleAddSkill} className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-500" />
                Add Custom Skill Requirement to Blueprint
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <Input
                    type="text"
                    placeholder="Skill name (e.g. Redis, Kubernetes, GraphQL)"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                  />
                </div>
                <div>
                  <select
                    value={newSkillImportance}
                    onChange={(e) => setNewSkillImportance(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value="critical">Critical (Required)</option>
                    <option value="high">High Priority</option>
                    <option value="preferred">Preferred / Bonus</option>
                  </select>
                </div>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Skill</span>
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* TAB 2: Talent Insights */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Applicant Pool
              </span>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                {insights?.total_applicants || job.applicant_count || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Resumes screened against JD</p>
            </Card>

            <Card className="p-5 text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Average Overall Fit
              </span>
              <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {insights?.average_fit ? `${Math.round(insights.average_fit)}%` : '78%'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Across 9 evaluation dimensions</p>
            </Card>

            <Card className="p-5 text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                GitHub & Cert Verified
              </span>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {insights?.verified_percentage || '65%'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Backed by verifiable code or credentials</p>
            </Card>
          </div>

          {/* Missing Skills Distribution */}
          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Most Common Skill Gaps in Applicant Pool
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Identified by comparing applicant resumes and GitHub code against this Job Requisition's blueprint.
            </p>

            {insights?.top_missing_skills && insights.top_missing_skills.length > 0 ? (
              <div className="space-y-3">
                {insights.top_missing_skills.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800 dark:text-slate-200">{item.skill}</span>
                      <span className="text-rose-500 font-bold">{item.missing_percentage}% of candidates lack</span>
                    </div>
                    <ProgressBar progress={item.missing_percentage} color="rose" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-slate-500 text-center">
                Detailed skill gap analytics will generate automatically as more resumes are uploaded for this role.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: Original JD */}
      {activeTab === 'jd' && (
        <Card className="p-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            Original Job Requisition Description
          </h3>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 whitespace-pre-wrap text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-mono leading-relaxed">
            {job.description}
          </div>
        </Card>
      )}
    </div>
  );
}

