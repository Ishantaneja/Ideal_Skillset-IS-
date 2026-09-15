import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Search,
  Users,
  UploadCloud,
  FileCheck,
  ChevronRight,
  Sparkles,
  MapPin,
  Clock,
  DollarSign,
  Filter,
  X,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Card, Button, Badge, LoadingSpinner, Input, Select } from '@/components';
import { ROUTES } from '@/utils/constants';
import { useNotification, useDocumentTitle } from '@/hooks';
import { recruiterService } from '@/services';

export default function RecruiterJobs() {
  useDocumentTitle('Job Requisitions | Recruiter Copilot');
  const navigate = useNavigate();
  const notify = useNotification();

  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create Job Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    department: 'Engineering',
    location: 'Remote',
    employment_type: 'Full-time',
    experience_level: 'Mid-Level',
    required_experience: '3-5 years',
    salary_range: '$120,000 - $150,000',
    description: '',
    required_skills: '',
    preferred_skills: '',
  });

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await recruiterService.listJobs();
      setJobs(data || []);
    } catch (err) {
      notify.error(err.message || 'Failed to fetch job requisitions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      notify.warning('Please provide at least a Job Title and Job Description');
      return;
    }

    try {
      setCreating(true);
      const reqSkills = formData.required_skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const prefSkills = formData.preferred_skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        title: formData.title.trim(),
        department: formData.department.trim(),
        location: formData.location.trim(),
        employment_type: formData.employment_type,
        experience_level: formData.experience_level,
        required_experience: formData.required_experience,
        salary_range: formData.salary_range.trim() || undefined,
        description: formData.description.trim(),
        required_skills: reqSkills,
        preferred_skills: prefSkills,
      };

      const newJob = await recruiterService.createJob(payload);
      notify.success('Job requisition created with AI Blueprint!');
      setShowCreateModal(false);
      setFormData({
        title: '',
        department: 'Engineering',
        location: 'Remote',
        employment_type: 'Full-time',
        experience_level: 'Mid-Level',
        required_experience: '3-5 years',
        salary_range: '$120,000 - $150,000',
        description: '',
        required_skills: '',
        preferred_skills: '',
      });
      // Refresh list and optionally redirect
      loadJobs();
    } catch (err) {
      notify.error(err.message || 'Failed to create job requisition');
    } finally {
      setCreating(false);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (j.department && j.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (j.required_skills && j.required_skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalApplicants = jobs.reduce((acc, j) => acc + (j.applicant_count || 0), 0);
  const totalShortlisted = jobs.reduce((acc, j) => acc + (j.shortlisted_count || 0), 0);
  const activeJobsCount = jobs.filter((j) => j.status === 'active').length;

  if (loading && jobs.length === 0) {
    return <LoadingSpinner fullPage message="Loading Job Requisitions..." />;
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl border border-indigo-900/40 text-white shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider">
              Talent Acquisition
            </span>
            <span className="text-xs text-slate-400">• Evidence-Based Screening</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-7 h-7 text-indigo-400" />
            Job Requisitions & AI Blueprints
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Create requisitions to automatically generate structured AI Job Blueprints, batch upload candidate resumes, and verify skills against GitHub code and certifications.
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-3 px-5 rounded-xl flex items-center space-x-2 shadow-lg shadow-indigo-600/30 self-start md:self-center shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Requisition</span>
        </Button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Jobs
            </span>
            <Briefcase className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {activeJobsCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Open hiring requisitions</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Applicants
            </span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {totalApplicants}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Resumes ingested across jobs</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              AI Shortlisted
            </span>
            <FileCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {totalShortlisted}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Met critical JD benchmarks</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              AI Blueprints
            </span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {jobs.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">9-dimension scoring active</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, department, or skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Job Requisitions List */}
      {filteredJobs.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {jobs.length === 0 ? 'No job requisitions yet' : 'No matching jobs found'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
            {jobs.length === 0
              ? 'Create your first job requisition with a Job Description to begin batch resume screening and skill verification.'
              : 'Try clearing your search term or changing the status filter.'}
          </p>
          {jobs.length === 0 && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-5 py-2.5 rounded-xl inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Job Requisition</span>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.map((job) => {
            const blueprint = job.blueprint;
            const criticalSkills = blueprint?.critical_skills || [];
            const highSkills = blueprint?.high_priority_skills || [];

            return (
              <Card
                key={job.id}
                className="flex flex-col justify-between border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all shadow-xs hover:shadow-lg rounded-2xl overflow-hidden group"
              >
                <div className="p-6 space-y-4">
                  {/* Top line: status & created date */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          job.status === 'active'
                            ? 'emerald'
                            : job.status === 'draft'
                            ? 'slate'
                            : 'rose'
                        }
                        size="sm"
                      >
                        {job.status.toUpperCase()}
                      </Badge>
                      <span className="text-[11px] text-slate-400">
                        {job.department || 'Engineering'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Title & metadata */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {job.location || 'Remote'}
                      </span>
                      <span>•</span>
                      <span>{job.employment_type || 'Full-time'}</span>
                      <span>•</span>
                      <span>{job.required_experience || '3+ years'}</span>
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

                  {/* AI Blueprint Snapshot */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-750 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        AI Blueprint Critical Skills:
                      </span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                        {criticalSkills.length} Required
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {criticalSkills.slice(0, 4).map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-100/70 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                        >
                          {s.name}
                        </span>
                      ))}
                      {highSkills.slice(0, 2).map((s, idx) => (
                        <span
                          key={`h-${idx}`}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          {s.name}
                        </span>
                      ))}
                      {criticalSkills.length + highSkills.length > 6 && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] text-slate-400">
                          +{criticalSkills.length + highSkills.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pipeline Metrics */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-center">
                      <div className="text-lg font-black text-indigo-700 dark:text-indigo-300">
                        {job.applicant_count || 0}
                      </div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Applicants Screened
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-center">
                      <div className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                        {job.shortlisted_count || 0}
                      </div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Shortlisted Matches
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => navigate(ROUTES.RECRUITER_JOB_DETAIL.replace(':jobId', job.id))}
                    className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
                  >
                    <span>Blueprint & Settings</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => navigate(ROUTES.RECRUITER_JOB_CANDIDATES.replace(':jobId', job.id))}
                      className="text-xs py-2 px-3 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                    >
                      <Users className="w-3.5 h-3.5 mr-1.5" />
                      <span>Pipeline</span>
                    </Button>

                    <Button
                      onClick={() =>
                        navigate(`${ROUTES.RECRUITER_JOB_CANDIDATES.replace(':jobId', job.id)}?upload=true`)
                      }
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-xs shadow-indigo-600/30"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Batch Upload</span>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Job Requisition Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Post New Job Requisition
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    AI will automatically analyze the JD and synthesize an evidence-based blueprint
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateJob} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Job Requisition Title <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Senior Backend Python & FastAPI Developer"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Department
                  </label>
                  <Input
                    type="text"
                    placeholder="Engineering / Data / Product"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Location
                  </label>
                  <Input
                    type="text"
                    placeholder="Remote / San Francisco / Hybrid"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Employment Type
                  </label>
                  <select
                    value={formData.employment_type}
                    onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Experience Level
                  </label>
                  <select
                    value={formData.experience_level}
                    onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Junior">Junior (0-2 yrs)</option>
                    <option value="Mid-Level">Mid-Level (3-5 yrs)</option>
                    <option value="Senior">Senior (5-8 yrs)</option>
                    <option value="Lead / Staff">Lead / Staff (8+ yrs)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Salary Range
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. $130,000 - $160,000"
                    value={formData.salary_range}
                    onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Critical Required Skills (comma-separated)
                </label>
                <Input
                  type="text"
                  placeholder="Python, FastAPI, Docker, MongoDB, REST APIs"
                  value={formData.required_skills}
                  onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
                />
                <span className="text-[10px] text-slate-400">
                  AI will cross-check candidate GitHub repositories & certificates against these skills.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Job Description (JD) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Paste the full job description, role objectives, key deliverables, and technical stack details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs py-2 px-4 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 px-5 rounded-xl flex items-center gap-2"
                >
                  {creating ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Synthesizing Blueprint...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Create & Generate Blueprint</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

