import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge, LoadingSpinner, ProgressBar } from '@/components';
import {
  Briefcase,
  Building2,
  MapPin,
  Globe,
  Clock,
  Code2,
  CheckCircle2,
  Sparkles,
  UploadCloud,
  FileText,
  Trash2,
  RefreshCw,
  Eye,
  Plus,
  Search,
  Star,
  GraduationCap,
  ListChecks,
  ShieldCheck,
  FileCode,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { useNotification, useDocumentTitle } from '@/hooks';
import { jobService } from '@/services';

const SAMPLE_DATA_ANALYST_JD = `Job Title: Junior Data Analyst
Company: Apex Analytics Corp
Location: New York, NY (Hybrid)
Employment Type: Full-time

About Apex Analytics:
We are a premier fintech intelligence company transforming financial transaction data into actionable business insights.

Key Responsibilities:
• Build, maintain, and optimize daily executive business intelligence dashboards.
• Write efficient SQL queries to extract, transform, and aggregate data from PostgreSQL data warehouses.
• Collaborate with cross-functional teams to identify key performance metrics and data trends.
• Clean and preprocess large-scale financial transaction datasets using Python (Pandas, NumPy).
• Present quantitative findings to executive stakeholders using Power BI and Tableau.

Requirements & Qualifications:
• Bachelor's degree in Computer Science, Data Analytics, Statistics, or related technical field.
• 1-3 years of practical data analysis or business intelligence experience.
• Strong proficiency in SQL (window functions, subqueries, complex joins).
• Hands-on experience with Python for data manipulation and visualization.
• Proficiency with Power BI or Tableau.
• Strong problem-solving and communication skills.

Preferred Qualifications:
• Experience with AWS (S3, Redshift) is a strong plus.
• Familiarity with ETL pipelines and Apache Airflow.
• Knowledge of DAX formulas and data modeling.`;

export default function JobAnalysis() {
  useDocumentTitle('Job Description Analyzer');
  const notify = useNotification();
  const fileInputRef = useRef(null);

  const [inputMode, setInputMode] = useState('paste'); // 'paste' | 'upload'
  const [pasteText, setPasteText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [showRawText, setShowRawText] = useState(false);
  const [marketSummary, setMarketSummary] = useState(null);
  const [selectedTab, setSelectedTab] = useState('required_skills'); // 'required_skills' | 'preferred_skills' | 'experience' | 'education' | 'responsibilities' | 'qualifications'

  // Load user jobs & market summary on mount
  const loadJobs = async () => {
    try {
      setLoading(true);
      const [jobsData, marketData] = await Promise.all([
        jobService.getJobs().catch(() => ({ items: [] })),
        jobService.getMarketSummary().catch(() => null),
      ]);

      if (jobsData && jobsData.items) {
        setJobs(jobsData.items);
        if (jobsData.items.length > 0 && !activeJob) {
          fetchJobDetail(jobsData.items[0].id);
        }
      }
      if (marketData) {
        setMarketSummary(marketData);
      }
    } catch (err) {
      notify.error(err.message || 'Could not load job analysis data');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobDetail = async (jobId) => {
    try {
      const detail = await jobService.getJob(jobId);
      setActiveJob(detail);
    } catch (err) {
      notify.error('Could not load job details');
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleAnalyzeText = async (e) => {
    e.preventDefault();
    if (!pasteText || pasteText.trim().length < 10) {
      notify.error('Please enter a complete job description (minimum 10 characters).');
      return;
    }

    setAnalyzing(true);
    try {
      const result = await jobService.analyzeText(pasteText);
      notify.success('Job description analyzed successfully!');
      setActiveJob(result);
      setPasteText('');
      loadJobs();
    } catch (err) {
      notify.error(err.message || 'Failed to analyze job description');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) {
      notify.error('Unsupported format. Please upload a PDF (.pdf) or Word (.docx) document.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      notify.error('File size exceeds the 10 MB maximum limit.');
      return;
    }

    setAnalyzing(true);
    try {
      const result = await jobService.uploadJobFile(file);
      notify.success(`Job document '${file.name}' analyzed successfully!`);
      setActiveJob(result);
      loadJobs();
    } catch (err) {
      notify.error(err.message || 'Failed to process job document');
    } finally {
      setAnalyzing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job description analysis?')) return;

    try {
      await jobService.deleteJob(jobId);
      notify.info('Job analysis deleted');
      if (activeJob?.id === jobId) {
        setActiveJob(null);
      }
      loadJobs();
    } catch (err) {
      notify.error(err.message || 'Could not delete job analysis');
    }
  };

  const handleReanalyze = async (jobId) => {
    try {
      setAnalyzing(true);
      const updated = await jobService.reanalyzeJob(jobId);
      setActiveJob(updated);
      notify.success('Job requirements re-scanned and updated!');
    } catch (err) {
      notify.error(err.message || 'Could not re-analyze job');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading job market intelligence..." />;
  }

  const jobInfo = activeJob?.job_info || {};
  const reqs = activeJob?.requirements || {
    required_skills: [],
    preferred_skills: [],
    experience: {},
    education: [],
    responsibilities: [],
    qualifications: [],
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Job Description Analyzer</h1>
          <p className="text-xs text-slate-500 mt-1">
            Extract verified required skills, preferred competencies, experience level, and deliverables for ATS calibration.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadJobs}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setActiveJob(null);
              window.scrollTo({ top: 300, behavior: 'smooth' });
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Analyze New Job
          </Button>
        </div>
      </div>

      {/* Target Role Market Summary */}
      {marketSummary && (
        <Card className="bg-gradient-to-r from-brand-900 to-slate-900 text-white border-0 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center md:text-left">
            <div className="p-2">
              <p className="text-[11px] font-semibold uppercase text-brand-200">Target Role</p>
              <p className="text-base font-bold text-white mt-0.5">{marketSummary.target_role}</p>
            </div>
            <div className="p-2 border-t md:border-t-0 md:border-l border-slate-700/60 md:pl-4">
              <p className="text-[11px] font-semibold uppercase text-brand-200">Market Demand</p>
              <p className="text-base font-bold text-emerald-400 mt-0.5">{marketSummary.market_demand}</p>
            </div>
            <div className="p-2 border-t md:border-t-0 md:border-l border-slate-700/60 md:pl-4">
              <p className="text-[11px] font-semibold uppercase text-brand-200">Average Salary</p>
              <p className="text-base font-bold text-white mt-0.5">{marketSummary.avg_salary}</p>
            </div>
            <div className="p-2 border-t md:border-t-0 md:border-l border-slate-700/60 md:pl-4">
              <p className="text-[11px] font-semibold uppercase text-brand-200">Top Required Tech</p>
              <p className="text-xs font-medium text-slate-300 mt-1 truncate">
                {marketSummary.top_required_skills?.join(', ')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Job Input Card (Paste vs Upload) */}
      <Card title="Input Job Description" subtitle="Paste job text or upload a requisition document (PDF/DOCX)">
        <div className="space-y-4">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setInputMode('paste')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                inputMode === 'paste'
                  ? 'bg-brand-50 text-brand-700 border border-brand-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Paste JD Text
            </button>
            <button
              onClick={() => setInputMode('upload')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                inputMode === 'upload'
                  ? 'bg-brand-50 text-brand-700 border border-brand-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Upload Document (PDF / DOCX)
            </button>
          </div>

          {inputMode === 'paste' ? (
            <form onSubmit={handleAnalyzeText} className="space-y-3">
              <textarea
                rows={6}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste the full job requisition description here (including responsibilities, required skills, and qualifications)..."
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPasteText(SAMPLE_DATA_ANALYST_JD)}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-brand-600" /> Load Sample Data Analyst JD
                </Button>

                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPasteText('')}
                    disabled={!pasteText}
                  >
                    Clear
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={analyzing || !pasteText.trim()}>
                    {analyzing ? (
                      <>Analyzing JD Requirements...</>
                    ) : (
                      <>
                        <Briefcase className="w-4 h-4 mr-1.5" /> Analyze Job Description
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
              }}
              className="border-2 border-dashed border-slate-300 hover:border-brand-500 bg-white hover:bg-slate-50/50 rounded-xl p-8 text-center cursor-pointer transition-colors"
            >
              <div className="max-w-md mx-auto space-y-2">
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  <span className="text-brand-600 underline">Click to upload</span> or drag & drop JD document
                </p>
                <p className="text-xs text-slate-400">PDF or DOCX • Maximum 10 MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Main Results Layout */}
      {activeJob ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Job History Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card title="Job Analysis History" subtitle={`${jobs.length} analyzed job postings`}>
              {jobs.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No previous jobs analyzed.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {jobs.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                        item.id === activeJob.id
                          ? 'bg-brand-50/60 border-brand-300 shadow-2xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className="cursor-pointer overflow-hidden flex-1 mr-2"
                        onClick={() => fetchJobDetail(item.id)}
                      >
                        <h4 className="font-bold text-slate-900 truncate">{item.job_title}</h4>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                          <span>{item.company_name || 'Organization'}</span>
                          {item.work_mode && <span>• {item.work_mode}</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(item.created_at).toLocaleDateString()} • {item.required_skills_count} required skills
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteJob(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                        title="Delete Job Analysis"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Structured Analysis Detail */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header Job Detail Banner */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold text-slate-900">
                      {jobInfo.job_title || 'Target Job Position'}
                    </h2>
                    <Badge variant="brand">Analyzed Requisition</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                    {jobInfo.company_name && (
                      <span className="flex items-center font-semibold text-slate-700">
                        <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" /> {jobInfo.company_name}
                      </span>
                    )}
                    {jobInfo.location && (
                      <span className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" /> {jobInfo.location}
                      </span>
                    )}
                    {jobInfo.work_mode && (
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        {jobInfo.work_mode}
                      </span>
                    )}
                    {jobInfo.employment_type && (
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        {jobInfo.employment_type}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReanalyze(activeJob.id)}
                    disabled={analyzing}
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" /> Re-scan
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRawText(!showRawText)}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    {showRawText ? 'Hide Text' : 'View Raw JD'}
                  </Button>
                </div>
              </div>

              {/* Raw Text Accordion */}
              {showRawText && (
                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono max-h-60 overflow-y-auto space-y-2 border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800">
                    <span className="flex items-center">
                      <FileCode className="w-3.5 h-3.5 mr-1" /> Raw Job Description Text
                    </span>
                    <span>{activeJob.raw_text?.length || 0} characters</span>
                  </div>
                  <pre className="whitespace-pre-wrap text-[11px] leading-relaxed">
                    {activeJob.raw_text}
                  </pre>
                </div>
              )}
            </div>

            {/* Requirement Tabs */}
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setSelectedTab('required_skills')}
                className={`flex items-center px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                  selectedTab === 'required_skills'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 mr-1.5" /> Required Skills ({reqs.required_skills?.length || 0})
              </button>
              <button
                onClick={() => setSelectedTab('preferred_skills')}
                className={`flex items-center px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                  selectedTab === 'preferred_skills'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Star className="w-3.5 h-3.5 mr-1.5" /> Preferred Skills ({reqs.preferred_skills?.length || 0})
              </button>
              <button
                onClick={() => setSelectedTab('experience')}
                className={`flex items-center px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                  selectedTab === 'experience'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5 mr-1.5" /> Experience
              </button>
              <button
                onClick={() => setSelectedTab('education')}
                className={`flex items-center px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                  selectedTab === 'education'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 mr-1.5" /> Education ({reqs.education?.length || 0})
              </button>
              <button
                onClick={() => setSelectedTab('responsibilities')}
                className={`flex items-center px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                  selectedTab === 'responsibilities'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5 mr-1.5" /> Responsibilities ({reqs.responsibilities?.length || 0})
              </button>
              <button
                onClick={() => setSelectedTab('qualifications')}
                className={`flex items-center px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                  selectedTab === 'qualifications'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Qualifications ({reqs.qualifications?.length || 0})
              </button>
            </div>

            {/* Tab 1: Required Skills */}
            {selectedTab === 'required_skills' && (
              <Card
                title={`Core Required Skills (${reqs.required_skills?.length || 0})`}
                subtitle="Mandatory technical competencies extracted from requirements"
              >
                {reqs.required_skills?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No mandatory skills explicitly flagged in this JD.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {reqs.required_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center text-xs bg-brand-50 text-brand-700 border border-brand-200 px-3 py-1.5 rounded-lg font-semibold shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 mr-1.5" />
                        {skill.name}
                        <span className="ml-2 text-[10px] text-brand-500 bg-brand-100/60 px-1.5 py-0.5 rounded">
                          {skill.category}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Tab 2: Preferred Skills */}
            {selectedTab === 'preferred_skills' && (
              <Card
                title={`Preferred Skills & Bonuses (${reqs.preferred_skills?.length || 0})`}
                subtitle="Beneficial skills marked as nice-to-have or bonus credentials"
              >
                {reqs.preferred_skills?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No preferred/bonus skills detected in this requisition.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {reqs.preferred_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg font-semibold shadow-2xs"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
                        {skill.name}
                        <span className="ml-2 text-[10px] text-amber-600 bg-amber-100/60 px-1.5 py-0.5 rounded">
                          {skill.category}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Tab 3: Experience */}
            {selectedTab === 'experience' && (
              <Card title="Experience Requirements" subtitle="Seniority and years of industry practice">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-brand-600" />
                    <span className="font-bold text-slate-900 text-sm">
                      {reqs.experience?.description || 'Experience requirement not explicitly stated'}
                    </span>
                  </div>
                  {reqs.experience?.minimum_years !== null && reqs.experience?.minimum_years !== undefined && (
                    <p className="text-slate-600">
                      Minimum Experience: <strong>{reqs.experience.minimum_years} years</strong>
                      {reqs.experience.maximum_years && ` (up to ${reqs.experience.maximum_years} years)`}
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Tab 4: Education */}
            {selectedTab === 'education' && (
              <Card title="Education Requirements" subtitle="Degrees and acceptable academic disciplines">
                {reqs.education?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No formal degree requirement specified.</p>
                ) : (
                  <div className="space-y-3">
                    {reqs.education.map((edu, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 text-sm">{edu.degree}</h4>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                              edu.required
                                ? 'bg-brand-50 text-brand-700 border border-brand-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {edu.required ? 'Required' : 'Preferred'}
                          </span>
                        </div>
                        {edu.fields && edu.fields.length > 0 && (
                          <p className="text-slate-600">
                            Accepted Majors: <strong>{edu.fields.join(', ')}</strong>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Tab 5: Responsibilities */}
            {selectedTab === 'responsibilities' && (
              <Card title="Key Responsibilities" subtitle="Day-to-day deliverables and core engineering duties">
                {reqs.responsibilities?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No specific responsibility bullet points detected.</p>
                ) : (
                  <ul className="space-y-2 text-xs text-slate-700">
                    {reqs.responsibilities.map((resp, idx) => (
                      <li key={idx} className="flex items-start space-x-2.5 p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{resp}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}

            {/* Tab 6: Qualifications */}
            {selectedTab === 'qualifications' && (
              <Card title="Prerequisite Qualifications" subtitle="Fundamental candidate criteria and requirements">
                {reqs.qualifications?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No distinct qualification bullets detected.</p>
                ) : (
                  <ul className="space-y-2 text-xs text-slate-700">
                    {reqs.qualifications.map((qual, idx) => (
                      <li key={idx} className="flex items-start space-x-2.5 p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{qual}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* Empty State */
        <Card className="text-center py-12 px-6 border-dashed border-2 border-slate-200">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Briefcase className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No job descriptions analyzed yet</h3>
            <p className="text-xs text-slate-500">
              Paste or upload a job description above to see the skills, experience, education, and responsibilities required for the role.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
