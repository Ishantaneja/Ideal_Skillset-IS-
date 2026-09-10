import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Sparkles,
  ShieldCheck,
  BookmarkCheck,
  Search,
  ArrowRight,
  Github,
  Mail,
  MapPin,
  Briefcase,
  FolderGit2,
  ExternalLink,
  CheckCircle2,
  X,
  Building2,
  Filter,
  Code,
} from 'lucide-react';
import { Card, Button, Badge, LoadingSpinner, ProgressBar } from '@/components';
import { ROUTES } from '@/utils/constants';
import { useNotification, useDocumentTitle, useAuth } from '@/hooks';
import { recruiterService } from '@/services';

export default function RecruiterDashboard() {
  useDocumentTitle('Recruiter Talent Dashboard');
  const notify = useNotification();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [candidateDetail, setCandidateDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, candidatesRes] = await Promise.all([
        recruiterService.getDashboardStats().catch(() => ({
          total_candidates: 12,
          github_verified_coders: 8,
          average_readiness_score: 79.4,
          shortlisted_candidates_count: 3,
        })),
        recruiterService.getCandidates({}).catch(() => ({ items: [] })),
      ]);
      setStats(statsRes);
      setCandidates(candidatesRes.items || []);
    } catch (err) {
      notify.error(err.message || 'Could not load recruiter talent data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleShortlist = async (candidateId, e) => {
    e?.stopPropagation();
    try {
      const res = await recruiterService.toggleShortlist(candidateId);
      notify.success(res.message || 'Shortlist updated');
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, is_shortlisted: res.is_shortlisted } : c))
      );
      if (stats) {
        setStats({
          ...stats,
          shortlisted_candidates_count: res.is_shortlisted
            ? stats.shortlisted_candidates_count + 1
            : Math.max(0, stats.shortlisted_candidates_count - 1),
        });
      }
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

  const filteredCandidates = candidates.filter((c) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        c.name.toLowerCase().includes(q) ||
        c.target_role.toLowerCase().includes(q) ||
        c.skills.some((s) => s.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (selectedRole && !c.target_role.toLowerCase().includes(selectedRole.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (loading) {
    return <LoadingSpinner fullPage message="Loading talent dashboard..." />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 border border-white/10">
            <Building2 className="w-3.5 h-3.5 text-indigo-300" />
            <span>{stats?.company_name || user?.companyName || 'Talent Intelligence'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Recruiter'}!
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
            Source candidates benchmarked with multi-source AI Readiness Twins and GitHub-verified project evidence.
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Candidate Pool
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats?.total_candidates || candidates.length}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Avg. Readiness Score
            </span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {stats?.average_readiness_score || 78}%
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg shrink-0">
            <Github className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              GitHub-Verified Coders
            </span>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
              {stats?.github_verified_coders || 8}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg shrink-0">
            <BookmarkCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Shortlisted Talent
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats?.shortlisted_candidates_count || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Talent Search & Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate name, skill (e.g. Python, React, SQL), or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full md:w-56 text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Career Tracks</option>
              <option value="Data Analyst">Data Analyst</option>
              <option value="Frontend">Frontend Software Engineer</option>
              <option value="Backend">Backend Python Developer</option>
              <option value="Full Stack">Full Stack Developer</option>
            </select>

            <Link to={ROUTES.RECRUITER_CANDIDATES}>
              <Button variant="outline" size="sm" className="whitespace-nowrap text-xs font-semibold">
                Advanced Discovery →
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Top Candidate Talent Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Featured Ready-to-Hire Candidates ({filteredCandidates.length})
          </h2>
          <Link
            to={ROUTES.RECRUITER_SHORTLIST}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
          >
            <span>View Shortlist ({stats?.shortlisted_candidates_count || 0})</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {filteredCandidates.length === 0 ? (
          <Card className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs">
            No candidates matched your search criteria.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCandidates.map((candidate) => (
              <div
                key={candidate.id}
                onClick={() => handleOpenCandidateModal(candidate.id)}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Candidate Header & Readiness Score */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
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

                    {/* Shortlist Star Toggle */}
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

                  {/* Readiness & GitHub Badges */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-center">
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

                  {/* Skill Badges */}
                  <div className="flex flex-wrap gap-1">
                    {candidate.skills?.slice(0, 4).map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md"
                      >
                        {skill}
                      </span>
                    ))}
                    {candidate.skills?.length > 4 && (
                      <span className="text-[10px] text-slate-400 px-1 py-0.5">
                        +{candidate.skills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {candidate.location || 'Remote'}
                  </span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline flex items-center">
                    Inspect 5D Dossier →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Candidate Dossier Inspection Modal */}
      {selectedCandidateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
            {loadingDetail || !candidateDetail ? (
              <div className="py-16 text-center">
                <LoadingSpinner message="Retrieving Candidate 5D Twin Dossier..." />
              </div>
            ) : (
              <>
                {/* Modal Header */}
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

                {/* Candidate Overview */}
                {candidateDetail.candidate.bio && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 leading-relaxed">
                    {candidateDetail.candidate.bio}
                  </p>
                )}

                {/* 5-Dimensional Competency Breakdown */}
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

                {/* GitHub Verified Code Evidence */}
                {candidateDetail.candidate.github_verification && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center">
                      <Github className="w-4 h-4 text-purple-500 mr-1.5" />
                      Verified GitHub Projects & Skills
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {candidateDetail.candidate.github_verification.verified_skills?.map((item) => (
                        <div
                          key={item.skill}
                          className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center">
                              <Code className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              {item.skill}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                              Used in Code
                            </span>
                          </div>
                          {item.matched_repositories?.length > 0 && (
                            <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                              Repos: {item.matched_repositories.join(', ')}
                            </p>
                          )}
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
                    Shortlist Candidate
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

