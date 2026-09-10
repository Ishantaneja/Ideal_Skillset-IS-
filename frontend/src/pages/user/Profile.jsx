import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Badge, LoadingSpinner } from '@/components';
import { useNotification, useDocumentTitle, useAuth } from '@/hooks';
import { userService, evidenceService } from '@/services';
import { DEFAULT_TARGET_ROLES } from '@/utils/constants';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  GraduationCap,
  Briefcase,
  Github,
  Linkedin,
  ExternalLink,
  Plus,
  X,
  Save,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  FolderGit2,
  Star,
  GitBranch,
  AlertCircle,
  Code,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function Profile() {
  useDocumentTitle('Candidate Profile');
  const notify = useNotification();
  const { user: authUser, setUser: setAuthUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifyingGithub, setVerifyingGithub] = useState(false);
  const [githubVerificationData, setGithubVerificationData] = useState(null);
  const [showReposList, setShowReposList] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    country: '',
    bio: '',
    education: '',
    degree: '',
    university: '',
    graduation_year: '',
    experience_level: 'Junior',
    years_of_experience: 0,
    current_job_title: '',
    target_role: DEFAULT_TARGET_ROLES[0],
    career_interests: [],
    skills: [],
    github_url: '',
    linkedin_url: '',
    portfolio_url: '',
  });

  // Load candidate profile from backend on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const data = await userService.getProfile();
        if (data) {
          setFormData({
            name: data.name || authUser?.name || '',
            email: data.email || authUser?.email || '',
            phone: data.phone || '',
            location: data.location || '',
            country: data.country || '',
            bio: data.bio || '',
            education: data.education || '',
            degree: data.degree || '',
            university: data.university || '',
            graduation_year: data.graduation_year || '',
            experience_level: data.experience_level || 'Junior',
            years_of_experience: data.years_of_experience ?? 0,
            current_job_title: data.current_job_title || '',
            target_role: data.target_role || authUser?.targetRole || DEFAULT_TARGET_ROLES[0],
            career_interests: Array.isArray(data.career_interests) ? data.career_interests : [],
            skills: Array.isArray(data.skills) && data.skills.length > 0 ? data.skills : ['SQL', 'Python', 'Excel'],
            github_url: data.github_url || '',
            linkedin_url: data.linkedin_url || '',
            portfolio_url: data.portfolio_url || '',
          });

          if (data.github_verification) {
            setGithubVerificationData(data.github_verification);
          }
        }
      } catch (err) {
        notify.warning('Could not load profile from server, using local session');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [authUser]);

  const handleVerifyGithub = async () => {
    if (!formData.github_url || !formData.github_url.trim()) {
      notify.warning('Please enter a valid GitHub profile or repository URL first.');
      return;
    }

    setVerifyingGithub(true);
    try {
      const res = await evidenceService.verifyGitHub({
        github_url: formData.github_url.trim(),
        skills_to_verify: formData.skills,
      });
      setGithubVerificationData(res);
      notify.success(`GitHub project scan complete! Verified ${res.verified_skills_count} skills across ${res.public_repos_count} repositories.`);
    } catch (err) {
      notify.error(err.message || 'Failed to verify GitHub link. Please check the URL.');
    } finally {
      setVerifyingGithub(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
        years_of_experience: formData.years_of_experience ? parseFloat(formData.years_of_experience) : 0,
      };
      const updated = await userService.updateProfile(payload);
      if (updated && setAuthUser) {
        setAuthUser((prev) => ({
          ...prev,
          name: updated.name || prev?.name,
          fullName: updated.name || prev?.fullName,
          targetRole: updated.target_role || prev?.targetRole,
        }));
      }
      notify.success('Profile updated successfully in Ideal SkillSet!');
    } catch (err) {
      notify.error(err.message || 'Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skillToRemove),
    });
  };

  const handleAddInterest = () => {
    if (newInterest.trim() && !formData.career_interests.includes(newInterest.trim())) {
      setFormData({
        ...formData,
        career_interests: [...formData.career_interests, newInterest.trim()],
      });
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interestToRemove) => {
    setFormData({
      ...formData,
      career_interests: formData.career_interests.filter((i) => i !== interestToRemove),
    });
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading candidate profile..." />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-primary-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
            {formData.name
              ? formData.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .substring(0, 2)
              : 'ID'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{formData.name || 'Candidate'}</h1>
              <Badge variant="emerald">Verified User</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formData.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
              <span className="font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800">
                Target: {formData.target_role}
              </span>
              <span className="text-slate-500 dark:text-slate-400">• {formData.experience_level} Level</span>
            </div>
          </div>
        </div>

        <div>
          <Button type="button" variant="primary" onClick={handleSave} disabled={saving} className="w-full md:w-auto">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1.5" /> Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Personal & Contact Information */}
        <Card title="Personal & Contact Information" subtitle="Basic identity and contact details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="name"
              label="Full Name"
              icon={User}
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Alex Morgan"
            />

            <Input
              id="email"
              label="Email Address (Read-only)"
              icon={Mail}
              disabled
              value={formData.email}
              placeholder="candidate@university.edu"
            />

            <Input
              id="phone"
              label="Phone Number"
              icon={Phone}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 019-2834"
            />

            <div className="grid grid-cols-2 gap-2">
              <Input
                id="location"
                label="City / State"
                icon={MapPin}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="New York, NY"
              />
              <Input
                id="country"
                label="Country"
                icon={Globe}
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="United States"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Professional Bio</label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Passionate aspiring data analyst with strong foundational skills in SQL, Python, and data visualization..."
              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </Card>

        {/* 2. Education & Academic Background */}
        <Card title="Education & Academic Background" subtitle="Degrees and institutional credentials">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="degree"
              label="Degree / Major"
              icon={GraduationCap}
              value={formData.degree}
              onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
              placeholder="B.S. in Computer Science / Information Systems"
            />

            <Input
              id="university"
              label="University / Institution"
              icon={GraduationCap}
              value={formData.university}
              onChange={(e) => setFormData({ ...formData, university: e.target.value })}
              placeholder="State University of New York"
            />

            <Input
              id="graduation_year"
              label="Graduation Year"
              type="number"
              value={formData.graduation_year}
              onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
              placeholder="2025"
            />

            <Input
              id="education"
              label="Education Summary / GPA"
              value={formData.education}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
              placeholder="Bachelor's Degree • GPA 3.8 / 4.0"
            />
          </div>
        </Card>

        {/* 3. Career Goals & Target Role */}
        <Card title="Career Objectives & Role Alignment" subtitle="Define the target role for AI Readiness Twin benchmarking">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              id="target_role"
              label="Target Career Role"
              icon={Briefcase}
              options={DEFAULT_TARGET_ROLES}
              value={formData.target_role}
              onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
            />

            <Select
              id="experience_level"
              label="Experience Level"
              options={['Entry-Level', 'Junior (1-2 yrs)', 'Mid-Level (3-5 yrs)', 'Senior (5+ yrs)']}
              value={formData.experience_level}
              onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
            />

            <Input
              id="years_of_experience"
              label="Years of Experience"
              type="number"
              step="0.5"
              value={formData.years_of_experience}
              onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value })}
              placeholder="1.5"
            />
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Career Interests & Focus Areas</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="e.g. Business Intelligence, ETL Pipelines, FinTech"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddInterest}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {formData.career_interests.map((interest, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-full font-medium"
                >
                  {interest}
                  <button
                    type="button"
                    onClick={() => handleRemoveInterest(interest)}
                    className="ml-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </Card>

        {/* 4. Skills & Competencies */}
        <Card title="Skills & Competencies" subtitle="Technical and soft skills for automated ATS and gap matching">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="e.g. SQL, Python, Power BI, DAX, Docker"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
              className="flex-1 px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Button type="button" variant="outline" size="sm" onClick={handleAddSkill}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Skill
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {formData.skills.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center text-xs bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 px-3 py-1 rounded-lg font-semibold shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 mr-1.5" />
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="ml-2 text-brand-400 hover:text-rose-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </Card>

        {/* 5. Online Proof & Portfolio Links */}
        <Card title="Proof of Skill & External Links" subtitle="Verified GitHub repositories, LinkedIn, and live project portfolios">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                id="github_url"
                label="GitHub Profile URL"
                icon={Github}
                value={formData.github_url}
                onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                placeholder="https://github.com/alexmorgan"
              />
              <div className="flex items-center justify-between mt-2">
                {formData.github_url ? (
                  <a
                    href={formData.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-[11px] text-brand-600 hover:text-brand-700"
                  >
                    <span>Preview GitHub</span> <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                ) : <span />}

                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleVerifyGithub}
                  disabled={verifyingGithub || !formData.github_url}
                  className="text-xs font-semibold bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                >
                  {verifyingGithub ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin text-brand-600" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" />
                      Verify Projects & Skills
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Input
                id="linkedin_url"
                label="LinkedIn Profile URL"
                icon={Linkedin}
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/alexmorgan"
              />
              {formData.linkedin_url && (
                <a
                  href={formData.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-[11px] text-brand-600 hover:text-brand-700 mt-1"
                >
                  <span>Preview LinkedIn</span> <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}
            </div>

            <div>
              <Input
                id="portfolio_url"
                label="Personal Portfolio Website"
                icon={Globe}
                value={formData.portfolio_url}
                onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                placeholder="https://alexmorgan.dev"
              />
              {formData.portfolio_url && (
                <a
                  href={formData.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-[11px] text-brand-600 hover:text-brand-700 mt-1"
                >
                  <span>Preview Website</span> <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}
            </div>
          </div>

          {/* GitHub Verification Analysis Report */}
          {githubVerificationData && (
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-4">
              {/* Header Summary Banner */}
              <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white border border-slate-700 shrink-0">
                    <Github className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm">@{githubVerificationData.username}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {githubVerificationData.verification_verdict}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Scanned {githubVerificationData.public_repos_count} repositories · {githubVerificationData.total_stars} stars
                    </p>
                  </div>
                </div>

                <div className="text-right sm:text-right flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                  <span className="text-[11px] text-slate-400">Proof of Evidence Score</span>
                  <span className="text-xl font-extrabold text-emerald-400">
                    {githubVerificationData.proof_score}%
                  </span>
                </div>
              </div>

              {/* Skills Verification Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Verified In Projects */}
                <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        Skills Verified in GitHub Projects ({githubVerificationData.verified_skills?.length || 0})
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                      Proven Code
                    </span>
                  </div>

                  <div className="space-y-2">
                    {githubVerificationData.verified_skills?.length > 0 ? (
                      githubVerificationData.verified_skills.map((item) => (
                        <div
                          key={item.skill}
                          className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/50 shadow-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center">
                              <Code className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mr-1.5" />
                              {item.skill}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                              Used in Projects
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.matched_repositories?.map((repo) => (
                              <span
                                key={repo}
                                className="inline-flex items-center text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                              >
                                <FolderGit2 className="w-3 h-3 mr-1 text-slate-400" />
                                {repo}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 italic">
                        No claimed skills were detected in public projects yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Not Found in Projects / Unverified */}
                <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                        Skills Not Found in Projects ({githubVerificationData.unverified_skills?.length || 0})
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                      Unverified
                    </span>
                  </div>

                  <div className="space-y-2">
                    {githubVerificationData.unverified_skills?.length > 0 ? (
                      githubVerificationData.unverified_skills.map((item) => (
                        <div
                          key={item.skill}
                          className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/50 shadow-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {item.skill}
                            </span>
                            <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded">
                              Not Used in Projects
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {item.recommendation || 'No code evidence found in public GitHub projects.'}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                        Awesome! All your claimed skills are backed by code in your GitHub repositories.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Scanned Repositories Toggle */}
              {githubVerificationData.repositories?.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowReposList(!showReposList)}
                    className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="flex items-center">
                      <FolderGit2 className="w-4 h-4 mr-2 text-brand-500" />
                      Scanned Public Repositories ({githubVerificationData.repositories.length})
                    </span>
                    {showReposList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showReposList && (
                    <div className="p-4 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 space-y-3">
                      {githubVerificationData.repositories.map((repo) => (
                        <div key={repo.name} className="pt-3 first:pt-0 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <a
                              href={repo.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center"
                            >
                              <FolderGit2 className="w-3.5 h-3.5 mr-1" />
                              {repo.name}
                              <ExternalLink className="w-3 h-3 ml-1 text-slate-400" />
                            </a>
                            <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                              {repo.primary_language && (
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {repo.primary_language}
                                </span>
                              )}
                              <span>⭐ {repo.stars}</span>
                            </div>
                          </div>
                          {repo.description && (
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {repo.description}
                            </p>
                          )}
                          {repo.detected_skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {repo.detected_skills.map((s) => (
                                <span
                                  key={s}
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-900"
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
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Submit Actions Bottom */}
        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" size="lg" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Profile Changes...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> Save Profile Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

