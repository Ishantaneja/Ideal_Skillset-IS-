import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookmarkCheck,
  Search,
  Download,
  Trash2,
  ExternalLink,
  MapPin,
  Briefcase,
  Github,
  Sparkles,
  ArrowLeft,
  Mail,
  X,
} from 'lucide-react';
import { Card, Button, Badge, LoadingSpinner, ProgressBar } from '@/components';
import { ROUTES } from '@/utils/constants';
import { useNotification, useDocumentTitle } from '@/hooks';
import { recruiterService } from '@/services';

export default function RecruiterShortlist() {
  useDocumentTitle('Shortlisted Candidate Talent');
  const notify = useNotification();

  const [loading, setLoading] = useState(true);
  const [shortlisted, setShortlisted] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [candidateDetail, setCandidateDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchShortlist = async () => {
    setLoading(true);
    try {
      const data = await recruiterService.getShortlist();
      setShortlisted(data.items || []);
    } catch (err) {
      notify.error('Could not load shortlisted talent');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShortlist();
  }, []);

  const handleRemoveShortlist = async (candidateId, e) => {
    e?.stopPropagation();
    try {
      await recruiterService.toggleShortlist(candidateId);
      notify.info('Candidate removed from shortlist');
      setShortlisted((prev) => prev.filter((c) => c.id !== candidateId));
    } catch (err) {
      notify.error('Could not remove candidate');
    }
  };

  const handleExportCSV = () => {
    if (shortlisted.length === 0) {
      notify.info('No candidates in shortlist to export');
      return;
    }

    const headers = ['Name', 'Email', 'Target Role', 'Readiness Score', 'GitHub Proof Score', 'Location', 'Skills'];
    const rows = shortlisted.map((c) => [
      `"${c.name}"`,
      `"${c.email}"`,
      `"${c.target_role}"`,
      c.readiness_score,
      c.github_proof_score || 0,
      `"${c.location || ''}"`,
      `"${(c.skills || []).join(', ')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shortlisted_candidates_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify.success('Shortlist CSV exported successfully');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center">
            <BookmarkCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-2" />
            Shortlisted Talent Pipeline ({shortlisted.length})
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pre-vetted candidates saved for active hiring requisitions and outreach.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={shortlisted.length === 0}
            className="text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Export CSV
          </Button>
          <Link to={ROUTES.RECRUITER_CANDIDATES}>
            <Button variant="primary" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold">
              <Search className="w-3.5 h-3.5 mr-1" />
              Discover More Talent
            </Button>
          </Link>
        </div>
      </div>

      {/* Shortlist Table / Grid */}
      {loading ? (
        <LoadingSpinner message="Loading shortlisted candidate pipeline..." />
      ) : shortlisted.length === 0 ? (
        <Card className="text-center py-16 px-4 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-500 flex items-center justify-center mx-auto">
            <BookmarkCheck className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Your shortlist is currently empty</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Browse the candidate discovery talent pool and click the bookmark icon to save high-readiness candidates to your pipeline.
          </p>
          <div className="pt-2">
            <Link to={ROUTES.RECRUITER_CANDIDATES}>
              <Button variant="primary" size="sm" className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs">
                Search Candidates →
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {shortlisted.map((candidate) => (
            <div
              key={candidate.id}
              onClick={() => handleOpenCandidateModal(candidate.id)}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="flex items-center space-x-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-base flex items-center justify-center shrink-0">
                  {candidate.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                      {candidate.name}
                    </h3>
                    <Badge variant="emerald">Verified</Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center mt-0.5 truncate">
                    <Briefcase className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                    {candidate.target_role} • {candidate.email}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {candidate.skills?.slice(0, 5).map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800 justify-between md:justify-end">
                <div className="text-right">
                  <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {Math.round(candidate.readiness_score)}%
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Readiness Score</span>
                </div>

                <div className="text-right pl-3 border-l border-slate-200 dark:border-slate-700">
                  <div className="text-base font-black text-indigo-600 dark:text-indigo-400">
                    {candidate.github_proof_score ? `${Math.round(candidate.github_proof_score)}%` : 'Verified'}
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">GitHub Code</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleRemoveShortlist(candidate.id, e)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                  title="Remove from shortlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Candidate Dossier Modal */}
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
                    <Badge variant="emerald">Shortlisted Talent</Badge>
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

            {/* 5D Competencies */}
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

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="danger"
                className="flex-1 justify-center text-xs font-bold"
                onClick={() => {
                  handleRemoveShortlist(candidateDetail.candidate.id);
                  setSelectedCandidateId(null);
                }}
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Remove from Shortlist
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

