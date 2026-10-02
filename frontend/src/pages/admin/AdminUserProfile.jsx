import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components';
import {
  ArrowLeft,
  User,
  Mail,
  Briefcase,
  Calendar,
  FileText,
  Brain,
  Map,
  ClipboardCheck,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function AdminUserProfile() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Temporary frontend data.
  // Real MongoDB data will be connected later.
  const candidate = {
    name: 'Radhe Shyam',
    email: 'radhe1234@gmail.com',
    role: 'Machine Learning Engineer',
    registered: '11 Sep 2026',
    status: 'Active',

    ats: 78,
    readiness: 62,
    roadmap: 48,

    knowledge: 78,
    practical: 51,
    evidence: 43,
    communication: 69,
    professional: 67,

    skills: [
      'Python',
      'SQL',
      'Machine Learning',
      'Pandas',
      'TensorFlow',
    ],

    skillGaps: [
      'MLOps',
      'Docker',
      'Cloud',
    ],

    resumeUploaded: true,
    assessmentCompleted: true,
    interviewCompleted: true,
  };

  return (
    <div className="space-y-6">

      {/* BACK */}
      <button
        onClick={() => navigate('/admin/users')}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </button>

      {/* HEADER */}
      <Card>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
              <User className="h-7 w-7" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">
                  {candidate.name}
                </h1>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {candidate.status}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">

                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  {candidate.email}
                </span>

                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  {candidate.role}
                </span>

                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Registered {candidate.registered}
                </span>

              </div>
            </div>

          </div>

          <div className="rounded-xl bg-red-50 px-6 py-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-red-500">
              Overall Readiness
            </p>

            <p className="mt-1 text-3xl font-bold text-red-700">
              {candidate.readiness}%
            </p>
          </div>

        </div>
      </Card>

      {/* OVERVIEW METRICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <OverviewMetric
          label="ATS Score"
          value={`${candidate.ats}%`}
          description="Resume compatibility"
        />

        <OverviewMetric
          label="Readiness"
          value={`${candidate.readiness}%`}
          description="Overall career readiness"
          highlight
        />

        <OverviewMetric
          label="Roadmap Progress"
          value={`${candidate.roadmap}%`}
          description="Career roadmap completion"
        />

      </div>

      {/* READINESS TWIN */}
      <Card
        title="Readiness Twin"
        subtitle="Five-dimensional candidate readiness assessment"
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          <ReadinessMetric
            label="Knowledge"
            value={candidate.knowledge}
          />

          <ReadinessMetric
            label="Practical"
            value={candidate.practical}
          />

          <ReadinessMetric
            label="Evidence"
            value={candidate.evidence}
          />

          <ReadinessMetric
            label="Communication"
            value={candidate.communication}
          />

          <div className="md:col-span-2">
            <ReadinessMetric
              label="Professional Readiness"
              value={candidate.professional}
            />
          </div>

        </div>
      </Card>

      {/* SKILLS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        <Card
          title="Current Skills"
          subtitle="Skills identified from candidate evidence"
        >
          <div className="flex flex-wrap gap-2">
            {candidate.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700"
              >
                ✓ {skill}
              </span>
            ))}
          </div>
        </Card>

        <Card
          title="Skill Gaps"
          subtitle="Priority areas requiring improvement"
        >
          <div className="flex flex-wrap gap-2">
            {candidate.skillGaps.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700"
              >
                <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                {skill}
              </span>
            ))}
          </div>
        </Card>

      </div>

      {/* CAREER PROGRESS */}
      <Card
        title="Career Progress"
        subtitle="Candidate activity across the platform"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatusCard
            icon={FileText}
            title="Resume"
            status="Uploaded"
            completed={candidate.resumeUploaded}
          />

          <StatusCard
            icon={Map}
            title="Roadmap"
            status={`${candidate.roadmap}% Complete`}
            completed={candidate.roadmap > 0}
          />

          <StatusCard
            icon={ClipboardCheck}
            title="Assessment"
            status={
              candidate.assessmentCompleted
                ? 'Completed'
                : 'Pending'
            }
            completed={candidate.assessmentCompleted}
          />

          <StatusCard
            icon={MessageSquare}
            title="Interview"
            status={
              candidate.interviewCompleted
                ? 'Completed'
                : 'Pending'
            }
            completed={candidate.interviewCompleted}
          />

        </div>
      </Card>

      {/* ADMIN ACTIONS */}
      <Card title="Admin Actions">
        <div className="flex flex-wrap gap-3">

          <ActionButton
            icon={FileText}
            label="View Resume"
          />

          <ActionButton
            icon={Brain}
            label="View Readiness"
          />

          <ActionButton
            icon={ClipboardCheck}
            label="View Assessment"
          />

          <ActionButton
            icon={MessageSquare}
            label="View Interview"
          />

        </div>
      </Card>

    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* OVERVIEW METRIC */
/* -------------------------------------------------------------------------- */

function OverviewMetric({
  label,
  value,
  description,
  highlight = false,
}) {
  return (
    <Card>
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-3xl font-bold ${
          highlight
            ? 'text-red-600'
            : 'text-slate-900'
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </Card>
  );
}


/* -------------------------------------------------------------------------- */
/* READINESS METRIC */
/* -------------------------------------------------------------------------- */

function ReadinessMetric({ label, value }) {
  return (
    <div>

      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">
          {label}
        </span>

        <span className="text-sm font-bold text-slate-700">
          {value}%
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-red-500 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>

    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* STATUS CARD */
/* -------------------------------------------------------------------------- */

function StatusCard({
  icon: Icon,
  title,
  status,
  completed,
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">

      <div className="flex items-center justify-between">

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-500">
          <Icon className="h-4 w-4" />
        </div>

        {completed && (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        )}

      </div>

      <p className="mt-3 text-sm font-medium text-slate-700">
        {title}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {status}
      </p>

    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* ACTION BUTTON */
/* -------------------------------------------------------------------------- */

function ActionButton({ icon: Icon, label }) {
  return (
    <button
      onClick={() => alert(`${label} will be connected later.`)}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}