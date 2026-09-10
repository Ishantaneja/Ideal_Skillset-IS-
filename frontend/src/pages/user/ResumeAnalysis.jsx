import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge, LoadingSpinner, ProgressBar } from '@/components';
import {
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  RefreshCw,
  Sparkles,
  GraduationCap,
  Briefcase,
  Code2,
  Award,
  Layers,
  ChevronDown,
  ChevronUp,
  FileCode,
  Check,
} from 'lucide-react';
import { useNotification, useDocumentTitle } from '@/hooks';
import { resumeService } from '@/services';

export default function ResumeAnalysis() {
  useDocumentTitle('Resume Management & Parsing');
  const notify = useNotification();
  const fileInputRef = useRef(null);

  const [resumes, setResumes] = useState([]);
  const [activeResume, setActiveResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');
  const [showRawText, setShowRawText] = useState(false);
  const [selectedSection, setSelectedSection] = useState('skills'); // 'skills', 'education', 'experience', 'projects', 'certifications'

  // Load user resumes on mount
  const loadResumes = async () => {
    try {
      setLoading(true);
      const data = await resumeService.getResumes();
      if (data && data.items) {
        setResumes(data.items);
        const currentActive = data.items.find((r) => r.is_active) || data.items[0];
        if (currentActive) {
          fetchResumeDetail(currentActive.id);
        } else {
          setActiveResume(null);
        }
      }
    } catch (err) {
      notify.error(err.message || 'Could not load resumes from server');
    } finally {
      setLoading(false);
    }
  };

  const fetchResumeDetail = async (resumeId) => {
    try {
      const detail = await resumeService.getResume(resumeId);
      setActiveResume(detail);
    } catch (err) {
      notify.error('Could not load resume details');
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Client-side extension validation
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) {
      notify.error('Unsupported file format. Please upload a PDF (.pdf) or Word (.docx) file.');
      return;
    }

    // Client-side size validation (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      notify.error('File size exceeds the 10 MB maximum limit.');
      return;
    }

    setUploading(true);
    setUploadProgress(15);
    setUploadStage('Uploading document...');

    try {
      setUploadProgress(45);
      setUploadStage('Extracting text & parsing sections...');

      const response = await resumeService.uploadResume(file, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(Math.min(percent, 85));
        }
      });

      setUploadProgress(100);
      setUploadStage('Parsing complete!');
      notify.success(`Resume '${file.name}' uploaded and parsed successfully!`);

      // Refresh list and set active
      await loadResumes();
      if (response && response.id) {
        setActiveResume(response);
      }
    } catch (err) {
      notify.error(err.message || 'Failed to upload and parse resume');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadStage('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (resumeId) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;

    try {
      await resumeService.deleteResume(resumeId);
      notify.info('Resume deleted successfully');
      loadResumes();
    } catch (err) {
      notify.error(err.message || 'Could not delete resume');
    }
  };

  const handleActivate = async (resumeId) => {
    try {
      await resumeService.activateResume(resumeId);
      notify.success('Active resume updated');
      loadResumes();
    } catch (err) {
      notify.error(err.message || 'Could not activate resume');
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading resume dashboard..." />;
  }

  const parsed = activeResume?.parsed_data || {
    skills: [],
    education: [],
    experience: [],
    projects: [],
    certifications: [],
  };

  // Group skills by category
  const skillsByCategory = (parsed.skills || []).reduce((acc, skill) => {
    const cat = skill.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill.name);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Resume Management & Parsing</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Upload PDF or DOCX resumes to extract verified skills, academic credentials, and work history.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadResumes}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => fileInputRef.current?.click()}>
            <UploadCloud className="w-4 h-4 mr-1.5" /> Upload Resume
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          />
        </div>
      </div>

      {/* Upload Dropzone & Progress */}
      {uploading ? (
        <Card className="bg-brand-50/50 dark:bg-brand-950/40 border-dashed border-2 border-brand-300 dark:border-brand-700 p-8 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto animate-pulse">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{uploadStage}</h3>
            <ProgressBar value={uploadProgress} color="brand" showLabel={false} />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Please wait while the file is uploaded, scanned, and parsed.</p>
          </div>
        </Card>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 rounded-2xl p-6 text-center cursor-pointer transition-colors group shadow-xs"
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/60 text-slate-500 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 flex items-center justify-center transition-colors">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                <span className="text-brand-600 dark:text-brand-400 underline">Click to upload</span> or drag & drop resume
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">PDF or DOCX • Maximum file size 10 MB</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      {activeResume ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Active Document Card & Version History */}
          <div className="lg:col-span-4 space-y-6">
            {/* Active Resume Card */}
            <Card title="Active Resume Document">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="p-2.5 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="overflow-hidden flex-1">
                    <div className="flex items-center space-x-1.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={activeResume.original_filename}>
                        {activeResume.original_filename}
                      </h4>
                      {activeResume.is_active && <Badge variant="emerald">Active</Badge>}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {(activeResume.file_size / 1024).toFixed(1)} KB • {activeResume.file_type.toUpperCase()}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      Uploaded: {new Date(activeResume.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-200/80 dark:border-slate-700/80 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mr-1" />
                    Status: <span className="font-semibold text-slate-700 dark:text-slate-300 ml-1 capitalize">{activeResume.parsing_status}</span>
                  </span>
                  <button
                    onClick={() => setShowRawText(!showRawText)}
                    className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold flex items-center text-[11px]"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    {showRawText ? 'Hide Text' : 'View Text'}
                  </button>
                </div>
              </div>

              {/* Extracted Text Drawer / Accordion */}
              {showRawText && (
                <div className="mt-4 p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono max-h-64 overflow-y-auto space-y-2 border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800">
                    <span className="flex items-center">
                      <FileCode className="w-3.5 h-3.5 mr-1" /> Clean Extracted Text
                    </span>
                    <span>{activeResume.extracted_text?.length || 0} chars</span>
                  </div>
                  <pre className="whitespace-pre-wrap text-[11px] leading-relaxed">
                    {activeResume.extracted_text || 'No readable text extracted.'}
                  </pre>
                </div>
              )}
            </Card>

            {/* Resume History List */}
            {resumes.length > 1 && (
              <Card title="Resume Version History" subtitle={`${resumes.length} resumes uploaded`}>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {resumes.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                        item.id === activeResume.id
                          ? 'bg-brand-50/50 dark:bg-brand-950/50 border-brand-300 dark:border-brand-700'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div
                        className="cursor-pointer overflow-hidden flex-1 mr-2"
                        onClick={() => fetchResumeDetail(item.id)}
                      >
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{item.original_filename}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {new Date(item.uploaded_at).toLocaleDateString()} • {item.skills_count} skills
                        </p>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        {!item.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[10px] py-0.5 px-2 h-6"
                            onClick={() => handleActivate(item.id)}
                          >
                            Set Active
                          </Button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                          title="Delete Resume"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column: Structured Parsed Sections */}
          <div className="lg:col-span-8 space-y-6">
            {/* Navigation Tabs for Parsed Sections */}
            <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setSelectedSection('skills')}
                className={`flex items-center px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                  selectedSection === 'skills'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 mr-1.5" /> Skills ({parsed.skills?.length || 0})
              </button>
              <button
                onClick={() => setSelectedSection('education')}
                className={`flex items-center px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                  selectedSection === 'education'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 mr-1.5" /> Education ({parsed.education?.length || 0})
              </button>
              <button
                onClick={() => setSelectedSection('experience')}
                className={`flex items-center px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                  selectedSection === 'experience'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 mr-1.5" /> Experience ({parsed.experience?.length || 0})
              </button>
              <button
                onClick={() => setSelectedSection('projects')}
                className={`flex items-center px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                  selectedSection === 'projects'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 mr-1.5" /> Projects ({parsed.projects?.length || 0})
              </button>
              <button
                onClick={() => setSelectedSection('certifications')}
                className={`flex items-center px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                  selectedSection === 'certifications'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Award className="w-3.5 h-3.5 mr-1.5" /> Certifications ({parsed.certifications?.length || 0})
              </button>
            </div>

            {/* Section 1: Skills Display */}
            {selectedSection === 'skills' && (
              <Card
                title={`Extracted Skills (${parsed.skills?.length || 0})`}
                subtitle="Categorized technical competencies extracted from your resume"
              >
                {parsed.skills?.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">No recognized technical skills found in resume.</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(skillsByCategory).map(([category, skillList]) => (
                      <div key={category} className="space-y-1.5">
                        <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                          {category} <span className="text-slate-400 dark:text-slate-500">({skillList.length})</span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {skillList.map((skillName, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-lg font-medium shadow-2xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mr-1.5" />
                              {skillName}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Section 2: Education Display */}
            {selectedSection === 'education' && (
              <Card
                title={`Academic Background (${parsed.education?.length || 0})`}
                subtitle="Degrees, colleges, and graduation details"
              >
                {parsed.education?.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">No academic degrees parsed from document.</p>
                ) : (
                  <div className="space-y-3">
                    {parsed.education.map((edu, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{edu.degree}</h4>
                          {edu.end_date && (
                            <span className="text-slate-500 dark:text-slate-400 text-[11px] bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              {edu.start_date ? `${edu.start_date} - ${edu.end_date}` : edu.end_date}
                            </span>
                          )}
                        </div>
                        {edu.institution && (
                          <p className="text-slate-700 dark:text-slate-300 font-medium">{edu.institution}</p>
                        )}
                        {edu.field_of_study && (
                          <p className="text-slate-500 dark:text-slate-400">Major: {edu.field_of_study}</p>
                        )}
                        {edu.gpa && (
                          <p className="text-brand-600 dark:text-brand-400 font-semibold text-[11px]">GPA / Score: {edu.gpa}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Section 3: Experience Display */}
            {selectedSection === 'experience' && (
              <Card
                title={`Work Experience (${parsed.experience?.length || 0})`}
                subtitle="Employment history, job responsibilities, and technologies used"
              >
                {parsed.experience?.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">No formal employment history identified in resume.</p>
                ) : (
                  <div className="space-y-4">
                    {parsed.experience.map((exp, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{exp.job_title}</h4>
                          <span className="text-slate-500 dark:text-slate-400 text-[11px] bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {exp.start_date ? `${exp.start_date} - ${exp.end_date}` : exp.end_date}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-medium">{exp.company}</p>
                        {exp.description && (
                          <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{exp.description}</p>
                        )}
                        {exp.skills_used && exp.skills_used.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {exp.skills_used.map((s, sIdx) => (
                              <span
                                key={sIdx}
                                className="text-[10px] bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 px-2 py-0.5 rounded"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Section 4: Projects Display */}
            {selectedSection === 'projects' && (
              <Card
                title={`Projects (${parsed.projects?.length || 0})`}
                subtitle="Technical projects and practical applications"
              >
                {parsed.projects?.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">No project entries detected in resume.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {parsed.projects.map((proj, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{proj.name}</h4>
                          <p className="text-slate-600 dark:text-slate-400 text-xs mt-1 line-clamp-3">{proj.description}</p>
                        </div>
                        <div>
                          {proj.technologies && proj.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-2">
                              {proj.technologies.map((t, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded font-mono"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                          {proj.url && (
                            <a
                              href={proj.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold inline-block mt-2"
                            >
                              View Project Link →
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Section 5: Certifications Display */}
            {selectedSection === 'certifications' && (
              <Card
                title={`Certifications (${parsed.certifications?.length || 0})`}
                subtitle="Verified professional licenses and credentials"
              >
                {parsed.certifications?.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">No professional certifications found in document.</p>
                ) : (
                  <div className="space-y-3">
                    {parsed.certifications.map((cert, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-800">
                            <Award className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white">{cert.name}</h4>
                            <p className="text-slate-500 dark:text-slate-400 text-[11px]">{cert.issuer}</p>
                          </div>
                        </div>
                        {cert.url && (
                          <a
                            href={cert.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium"
                          >
                            Verify Credential →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* Empty State */
        <Card className="text-center py-12 px-6 border-dashed border-2 border-slate-200 dark:border-slate-800">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No resume uploaded yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload your resume in PDF or DOCX format to extract skills, calculate ATS readiness, and calibrate your Readiness Twin.
            </p>
            <div className="pt-2">
              <Button variant="primary" size="md" onClick={() => fileInputRef.current?.click()}>
                <UploadCloud className="w-4 h-4 mr-2" /> Upload Your First Resume
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
