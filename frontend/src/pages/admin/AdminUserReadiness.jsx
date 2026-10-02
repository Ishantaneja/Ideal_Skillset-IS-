import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components';
import adminService from '@/services/adminService';
import {
  ArrowLeft,
  User,
  CheckCircle2,
  AlertTriangle,
  Target,
} from 'lucide-react';

export default function AdminUserReadiness() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [candidate, setCandidate] = useState(null);
  const [skillGapData, setSkillGapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [skillGapLoading, setSkillGapLoading] = useState(true);
  const [error, setError] = useState('');
  const [skillGapError, setSkillGapError] = useState('');

  useEffect(() => {
    const loadCandidateData = async () => {
      try {
        setLoading(true);
        setSkillGapLoading(true);

        setError('');
        setSkillGapError('');

        // -----------------------------
        // 1. LOAD READINESS DATA
        // -----------------------------
        const readinessData =
          await adminService.getUserReadiness(id);
        console.log('READINESS VERDICT:', readinessData.verdict);

        setCandidate({
          name: readinessData.name || 'Candidate',

          role:
            readinessData.role ||
            readinessData.job_title ||
            'Not specified',

          readiness: Number(
            readinessData.overall_readiness_score ?? 0
          ),

          knowledge: Number(
            readinessData.dimensions?.knowledge?.score ?? 0
          ),

          practical: Number(
            readinessData.dimensions?.practical?.score ?? 0
          ),

          evidence: Number(
            readinessData.dimensions?.evidence?.score ?? 0
          ),

          communication: Number(
            readinessData.dimensions?.communication?.score ?? 0
          ),

          professional: Number(
            readinessData.dimensions?.roadmap_progress?.score ?? 0
          ),

          verdict: readinessData.verdict || null,

          breakdown: Array.isArray(
            readinessData.breakdown_list
          )
            ? readinessData.breakdown_list
            : [],
        });

        setLoading(false);

        // -----------------------------
        // 2. LOAD SKILL GAP DATA
        // -----------------------------
        try {
          const skillGapResponse =
            await adminService.getUserSkillGaps(id);

          setSkillGapData(skillGapResponse);
        } catch (err) {
          console.error(
            'Failed to load candidate skill gaps:',
            err
          );

          setSkillGapError(
            err.message ||
            'Skill gap data is not available.'
          );
        } finally {
          setSkillGapLoading(false);
        }

      } catch (err) {
        console.error(
          'Failed to load candidate readiness:',
          err
        );

        setError(
          err.message ||
          'Failed to load candidate readiness data.'
        );

        setLoading(false);
        setSkillGapLoading(false);
      }
    };

    if (id) {
      loadCandidateData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-slate-500">
          Loading candidate readiness...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6">
        <h2 className="font-semibold text-red-700">
          Unable to load candidate readiness
        </h2>

        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-sm text-slate-500">
          No readiness data found for this candidate.
        </p>
      </div>
    );
  }

  // --------------------------------------------------
  // SKILL GAP DATA
  // --------------------------------------------------

  const skills = Array.isArray(skillGapData?.skills)
    ? skillGapData.skills
    : [];

  const strengths = skills
    .filter(
      (skill) =>
        Number(skill.current_level ?? 0) >=
        Number(skill.required_level ?? 0)
    )
    .slice(0, 5);

  const criticalGaps = skills
    .filter(
      (skill) =>
        Number(skill.gap ?? 0) > 0
    )
    .sort(
      (a, b) =>
        Number(b.priority_score ?? 0) -
        Number(a.priority_score ?? 0)
    )
    .slice(0, 5);

  const priorities = criticalGaps.slice(0, 3);

  return (
    <div className="space-y-6">

      {/* BACK */}
      <button
        onClick={() => navigate(`/admin/users/${id}`)}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Profile
      </button>

      {/* HEADER */}
      <Card>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <User className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {candidate.name}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {candidate.role}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Detailed Career Readiness Analysis
              </p>
            </div>

          </div>

          <div className="rounded-xl bg-red-50 px-7 py-4 text-center">

            <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
              Overall Readiness
            </p>

            <p className="mt-1 text-4xl font-bold text-red-600">
              {candidate.readiness}%
            </p>

            <p className="mt-1 text-xs text-red-500">
              {candidate.readiness >= 80
                ? 'Ready'
                : candidate.readiness >= 60
                ? 'Needs Improvement'
                : 'Low Readiness'}
            </p>

          </div>

        </div>
      </Card>

      {/* READINESS DIMENSIONS */}
      <Card
        title="5D Readiness Breakdown"
        subtitle="Detailed evaluation across the candidate readiness dimensions"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

          <ReadinessCard
            title="Knowledge"
            value={candidate.knowledge}
            description="Understanding of required concepts and technologies"
          />

          <ReadinessCard
            title="Practical Ability"
            value={candidate.practical}
            description="Ability to apply skills through practical work"
          />

          <ReadinessCard
            title="Evidence"
            value={candidate.evidence}
            description="Projects, certifications and demonstrable proof"
          />

          <ReadinessCard
            title="Communication"
            value={candidate.communication}
            description="Ability to explain ideas and communicate professionally"
          />

          <div className="md:col-span-2">
            <ReadinessCard
              title="Professional Readiness"
              value={candidate.professional}
              description="Overall preparedness for workplace expectations"
            />
          </div>

        </div>
      </Card>

      {/* STRENGTHS + GAPS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* STRENGTHS */}
        <Card
          title="Candidate Strengths"
          subtitle="Areas where the candidate is performing well"
        >
          <div className="space-y-3">

            {skillGapLoading ? (
              <p className="text-sm text-slate-500">
                Loading skill gap data...
              </p>
            ) : strengths.length > 0 ? (
              strengths.map((strength, index) => (
                <div
                  key={`${strength}-${index}`}
                  className="flex items-center gap-3 rounded-lg bg-emerald-50 px-4 py-3"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />

                  <span className="text-sm font-medium text-emerald-800">
                    {strength.skill || 'Strength'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                No strength data available.
              </p>
            )}

          </div>
        </Card>

        {/* CRITICAL GAPS */}
        <Card
          title="Critical Skill Gaps"
          subtitle="Priority areas affecting candidate readiness"
        >
          <div className="space-y-3">

            {skillGapLoading ? (
              <p className="text-sm text-slate-500">
                Loading skill gap data...
              </p>
            ) : criticalGaps.length > 0 ? (
              criticalGaps.map((gap, index) => (
                <div
                  key={`${gap}-${index}`}
                  className="flex items-center gap-3 rounded-lg bg-amber-50 px-4 py-3"
                >
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />

                  <span className="text-sm font-medium text-amber-800">
                    {gap.skill || 'Skill Gap'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                No critical skill gap data available.
              </p>
            )}

          </div>
        </Card>

      </div>

      {/* ADMIN VERDICT */}
      <Card
        title="Admin Readiness Verdict"
        subtitle="Platform-level interpretation of candidate readiness"
      >
        <div className="rounded-xl border border-red-100 bg-red-50 p-5">

          <div className="flex items-start gap-4">

            {/* ICON */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-red-600">
              <Target className="h-5 w-5" />
            </div>

            {/* INSIGHT CONTENT */}
            <div className="flex-1">

              {/* VERDICT */}
              <h3 className="font-semibold text-slate-900">
                {candidate.verdict?.verdict === 'prepare_first'
                  ? 'PREPARE BEFORE APPLYING'
                  : candidate.verdict?.verdict === 'ready_to_apply'
                  ? 'READY TO APPLY'
                  : candidate.verdict?.verdict === 'needs_improvement'
                  ? 'NEEDS IMPROVEMENT'
                  : candidate.verdict?.verdict || 'READINESS ASSESSMENT AVAILABLE'}
              </h3>

              {/* BUSINESS INSIGHTS */}
              <div className="mt-3 space-y-2.5 text-sm leading-6 text-slate-600">

                <p>
                  • The candidate demonstrates strong verifiable proof of skills
                  <span className="font-semibold text-slate-800">
                    {' '}({candidate.evidence}%)
                  </span>
                  , indicating substantial evidence supporting their capabilities.
                </p>

                <p>
                  • Practical readiness is currently
                  <span className="font-semibold text-slate-800">
                    {' '}{candidate.practical}%
                  </span>
                  , indicating a need for stronger hands-on application of the required skills.
                </p>

                <p>
                  • The ATS score is
                  <span className="font-semibold text-slate-800">
                    {' '}{candidate.verdict?.ats_score ?? 'N/A'}%
                  </span>
                  , while the overall Readiness Twin score is
                  <span className="font-semibold text-slate-800">
                    {' '}{candidate.verdict?.overall_readiness_score ?? candidate.readiness}%
                  </span>
                  , showing a difference between keyword matching and demonstrated readiness.
                </p>

                <p>
                  • Based on the current readiness analysis, the candidate should
                  strengthen practical, real-world proof before applying.
                </p>

              </div>

            </div>

          </div>

        </div>
      </Card>

    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* READINESS CARD */
/* -------------------------------------------------------------------------- */

function ReadinessCard({
  title,
  value,
  description,
}) {
  const safeValue = Math.max(
    0,
    Math.min(100, Number(value) || 0)
  );

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">

      <div className="flex items-center justify-between">

        <h3 className="text-sm font-semibold text-slate-800">
          {title}
        </h3>

        <span className="text-lg font-bold text-slate-900">
          {safeValue}%
        </span>

      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-red-500"
          style={{ width: `${safeValue}%` }}
        />
      </div>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>

    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* PRIORITY */
/* -------------------------------------------------------------------------- */

function Priority({
  number,
  title,
  description,
}) {
  return (
    <div className="flex gap-4 rounded-xl border border-slate-100 p-4">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-xs font-bold text-red-600">
        {number}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-800">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>

    </div>
  );
}