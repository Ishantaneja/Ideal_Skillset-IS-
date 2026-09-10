export const APP_NAME = 'Ideal Skillset';
export const APP_TAGLINE = "Know where you stand. Know what to improve. Know when you're ready.";

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_RESUMES: '/admin/resumes',
  ADMIN_JOBS: '/admin/jobs',
  ADMIN_ATS: '/admin/ats',
  ADMIN_SKILLS: '/admin/skills',
  ADMIN_READINESS: '/admin/readiness',
  ADMIN_ASSESSMENTS: '/admin/assessments',
  ADMIN_INTERVIEWS: '/admin/interviews',
  ADMIN_ROADMAPS: '/admin/roadmaps',
  ADMIN_AI: '/admin/ai',
  ADMIN_AUDIT_LOGS: '/admin/audit-logs',
  ADMIN_NOTIFICATIONS: '/admin/notifications',
  ADMIN_SETTINGS: '/admin/settings',
  RECRUITER_LOGIN: '/recruiter/login',
  RECRUITER_SIGNUP: '/recruiter/signup',
  RECRUITER_DASHBOARD: '/recruiter',
  RECRUITER_CANDIDATES: '/recruiter/candidates',
  RECRUITER_SHORTLIST: '/recruiter/shortlist',
  USER_DASHBOARD: '/dashboard',
  RESUME: '/resume',
  JOB_ANALYSIS: '/job-analysis',
  ATS: '/ats',
  SKILL_GAP: '/skill-gap',
  ROADMAP: '/roadmap',
  ASSESSMENT: '/assessment',
  INTERVIEW: '/interview',
  READINESS: '/readiness',
  PROFILE: '/profile',
};

export const DEFAULT_TARGET_ROLES = [
  'Junior Data Analyst',
  'Frontend Software Engineer',
  'Backend Python Developer',
  'Full Stack Developer',
  'Machine Learning Engineer',
  'DevOps / Cloud Engineer',
  'Product Analyst',
];

export const READINESS_DIMENSIONS = [
  { key: 'knowledge', label: 'Knowledge', benchmark: 80, color: 'brand' },
  { key: 'practical', label: 'Practical Ability', benchmark: 75, color: 'primary' },
  { key: 'evidence', label: 'Proof of Skill', benchmark: 70, color: 'amber' },
  { key: 'communication', label: 'Communication', benchmark: 70, color: 'emerald' },
  { key: 'professional', label: 'Professional Readiness', benchmark: 80, color: 'brand' },
];
