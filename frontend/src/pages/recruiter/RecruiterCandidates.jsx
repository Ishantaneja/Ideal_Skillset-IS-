import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Users,
  Sparkles,
  Github,
  BookmarkCheck,
  MapPin,
  Briefcase,
  ExternalLink,
  Code,
  X,
} from 'lucide-react';
import { Card, Button, Badge, LoadingSpinner, ProgressBar } from '@/components';
import { useNotification, useDocumentTitle } from '@/hooks';
import { recruiterService } from '@/services';

export default function RecruiterCandidates() {
  useDocumentTitle('Talent Discovery & Candidate Search');
  const notify = useNotification();

  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [minReadiness, setMinReadiness] = useState('');
  const [verifiedGithubOnly, setVerifiedGithubOnly] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [candidateDetail, setCandidateDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (targetRole) params.target_role = targetRole;
      if (minReadiness) params.min_readiness = parseFloat(minReadiness);
      if (verifiedGithubOnly) params.verified_github_only = true;

      const data = await recruiterService.getCandidates(params);
      setCandidates(data.items || []);
    } catch (err) {
      notify.error('Failed to fetch candidate pool');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [targetRole, minReadiness, verifiedGithubOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCandidates();
  };

  const handleToggleShortlist = async (candidateId, e) => {
    e?.stopPropagation();
    try {
      const res = await recruiterService.toggleShortlist(candidateId);
      notify.success(res.message || 'Shortlist updated');
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, is_shortlisted: res.is_shortlisted } : c))
      );
    } catch (err) {
      notify.error('Could not update shortlist');
    }
  };

  const handleOpenCandidateModal = async (candidateId) => {
    setSelectedCandidateId(candidateId);
    setLoadingDetail(true);
    try {
      const detail = await recruiterService.getCandidateDetail(candidateId);
      setCandidateDetail(detail);
    } catch (err) {
      notify.error('Could not load candidate details');
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center">
          <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-2" />
          Candidate Talent Discovery
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Search, benchmark, and evaluate candidate readiness across multi-source evidence.
        </p>
      </div>

      {/* Filter Controls Card */}
      <Card className="p-5">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-4 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, skill, or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Target Role Dropdown */}
            <div className="md:col-span-3">
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Career Tracks</option>
                <option value="Data Analyst">Data Analyst</option>
                <option value="Frontend">Frontend Software Engineer</option>
                <option value="Backend">Backend Python Developer</option>
                <option value="Full Stack">Full Stack Developer</option>
                <option value="Machine Learning">Machine Learning Engineer</option>
              </select>
            </div>

            {/* Minimum Readiness Threshold */}
            <div className="md:col-span-3">
              <select
                value={minReadiness}
                onChange={(e) => setMinReadiness(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Readiness Levels</option>
                <option value="80">Ready to Apply (80%+)</option>
                <option value="70">Competitive (70%+)</option>
                <option value="60">Developing (60%+)</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2">
              <Button type="submit" variant="primary" size="md" className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-xs font-bold py-2 rounded-xl">
                Filter Talent
              </Button>
            </div>
          </div>

          {/* Secondary Filters */}
          <div className="flex items-center space-x-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedGithubOnly}
                onChange={(e) => setVerifiedGithubOnly(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center">
                <Github className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Verified GitHub Projects Only
              </span>
            </label>
          </div>
        </form>
      </Card>

      {/* Candidate Discovery Grid */}
      {loading ? (
        <LoadingSpinner message="Searching candidate pool..." />
      ) : candidates.length === 0 ? (
        <Card className="text-center py-16 text-slate-500 dark:text-slate-400 text-xs">
          No candidates match the specified criteria. Try broadening your filters.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((candidate) => (
            <div
              key={candidate.id}
              onClick={() => handleOpenCandidateModal(candidate.id)}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                      {candidate.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {candidate.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center mt-0.5">
                        <Briefcase className="w-3 h-3 mr-1 text-slate-400" />
                        {candidate.target_role}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleToggleShortlist(candidate.id, e)}
                    className={`p-2 rounded-xl transition-colors ${
                      candidate.is_shortlisted
                        ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-amber-500'
                    }`}
                    title={candidate.is_shortlisted ? 'Remove from Shortlist' : 'Add to Shortlist'}
                  >
                    <BookmarkCheck className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
                    <span className="text-[9px] font-bold uppercase text-emerald-800 dark:text-emerald-300">
                      Readiness Twin
                    </span>
                    <div className="text-base font-black text-emerald-700 dark:text-emerald-300">
                      {Math.round(candidate.readiness_score)}%
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60">
                    <span className="text-[9px] font-bold uppercase text-indigo-800 dark:text-indigo-300">
                      GitHub Evidence
                    </span>
                    <div className="text-base font-black text-indigo-700 dark:text-indigo-300">
                      {candidate.github_proof_score ? `${Math.round(candidate.github_proof_score)}%` : 'Verified'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {candidate.skills?.slice(0, 4).map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {candidate.location || 'Remote'}
                </span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline flex items-center">
                  View Full Dossier →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Candidate Modal */}
      {selectedCandidateId && candidateDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                  {candidateDetail.candidate.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {candidateDetail.candidate.name}
                    </h2>
                    <Badge variant="emerald">Verified Candidate</Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {candidateDetail.candidate.target_role} • {candidateDetail.candidate.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCandidateId(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 5D Readiness Twin Breakdown */}
            {candidateDetail.readiness_twin && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center">
                    <Sparkles className="w-4 h-4 text-indigo-500 mr-1.5" />
                    5-Dimensional AI Readiness Twin
                  </h3>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {Math.round(candidateDetail.readiness_twin.overall_readiness_score)}% Overall Score
                  </span>
                </div>

                <div className="space-y-2.5">
                  {candidateDetail.readiness_twin.breakdown_list?.map((dim, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-slate-800 dark:text-slate-200">{dim.name}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{Math.round(dim.score)}%</span>
                      </div>
                      <ProgressBar value={dim.score} max={100} variant={dim.status_color || 'emerald'} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="primary"
                className="flex-1 justify-center bg-indigo-600 hover:bg-indigo-700 text-xs font-bold"
                onClick={() => handleToggleShortlist(candidateDetail.candidate.id)}
              >
                <BookmarkCheck className="w-4 h-4 mr-1.5" />
                Toggle Shortlist
              </Button>
              {candidateDetail.candidate.github_url && (
                <a
                  href={candidateDetail.candidate.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full justify-center text-xs font-bold">
                    <Github className="w-4 h-4 mr-1.5" />
                    View Public GitHub
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

