/**
 * Centralized mock data store for Ideal Skillset frontend prototype
 * Decouples static UI mock data from React page components.
 */

export const MOCK_USER_PROFILE = {
  id: 'usr_101',
  fullName: 'Alex Morgan',
  initials: 'AM',
  email: 'alex.morgan@university.edu',
  targetRole: 'Junior Data Analyst',
  readinessScore: 74,
  atsScore: 78,
  jobMatchScore: 72,
  topSkillGap: 'Power BI',
};

export const MOCK_READINESS_BREAKDOWN = [
  { label: 'Knowledge', score: 82, benchmark: 80, color: 'brand', status: 'Ready', statusColor: 'emerald', notes: 'Strong theoretical grounding in data structures, relational theory, and statistical foundations.' },
  { label: 'Practical Ability', score: 71, benchmark: 75, color: 'primary', status: 'Needs Polish', statusColor: 'amber', notes: 'Passable execution on data aggregation tasks; requires additional hands-on practice in DAX & ETL.' },
  { label: 'Proof of Skill', score: 61, benchmark: 70, color: 'amber', status: 'Gap Found', statusColor: 'rose', notes: 'Resume and portfolio lack verified end-to-end dashboard links and production repository artifacts.' },
  { label: 'Communication', score: 76, benchmark: 70, color: 'emerald', status: 'Ready', statusColor: 'emerald', notes: 'Clear articulation of technical concepts and structured responses using the STAR method.' },
  { label: 'Professional Readiness', score: 83, benchmark: 80, color: 'brand', status: 'Ready', statusColor: 'emerald', notes: 'High consistency in workflow standards, Git hygiene, and collaborative documentation.' },
];

export const MOCK_SKILL_GAPS = {
  missing: [
    {
      name: 'Power BI & DAX Calculations',
      importance: 'Critical',
      importanceColor: 'rose',
      currentProficiency: 20,
      targetProficiency: 80,
      suggestedMilestone: 'Milestone 2: Data Modeling with DAX',
    },
    {
      name: 'Advanced SQL (Window Functions & CTEs)',
      importance: 'High',
      importanceColor: 'amber',
      currentProficiency: 55,
      targetProficiency: 85,
      suggestedMilestone: 'Milestone 1: Relational Query Optimization',
    },
    {
      name: 'Automated ETL Pipelines (Airflow / Prefect)',
      importance: 'Moderate',
      importanceColor: 'slate',
      currentProficiency: 30,
      targetProficiency: 70,
      suggestedMilestone: 'Milestone 4: Pipeline Automation Basics',
    },
  ],
  mastered: [
    { name: 'Python (Pandas / NumPy)', proficiency: 88 },
    { name: 'Basic SQL (SELECT, JOIN, GROUP BY)', proficiency: 92 },
    { name: 'Exploratory Data Analysis (EDA)', proficiency: 85 },
    { name: 'Version Control (Git / GitHub)', proficiency: 80 },
  ],
};

export const MOCK_ROADMAP_MILESTONES = [
  {
    id: 1,
    title: 'Milestone 1: Relational Query Optimization & Window Functions',
    status: 'completed',
    topics: ['ROW_NUMBER & DENSE_RANK', 'LAG & LEAD Analysis', 'CTEs & Subqueries'],
    duration: '4 hours',
  },
  {
    id: 2,
    title: 'Milestone 2: Power BI Data Modeling & DAX Measures',
    status: 'in_progress',
    topics: ['Star Schema vs Snowflake Schema', 'CALCULATE & Filter Context', 'Interactive Visual Dashboards'],
    duration: '6 hours',
  },
  {
    id: 3,
    title: 'Milestone 3: Practical Business Case Study Assessment',
    status: 'upcoming',
    topics: ['E-commerce Cohort Retention', 'Executive KPI Presentation'],
    duration: '3 hours',
  },
  {
    id: 4,
    title: 'Milestone 4: Mock Technical & Behavioral Interview Simulation',
    status: 'locked',
    topics: ['Live SQL coding', 'Data storytelling & Communication feedback'],
    duration: '1.5 hours',
  },
];

export const MOCK_JOB_POSTINGS = [
  {
    title: 'Junior Data Analyst',
    company: 'Apex Data Corp',
    location: 'New York, NY (Hybrid)',
    salary: '$68,000 - $82,000',
    matchScore: 82,
    skills: ['SQL', 'Python', 'Power BI', 'Excel', 'Data Visualization'],
  },
  {
    title: 'Business Intelligence Analyst',
    company: 'Metro FinTech',
    location: 'Remote',
    salary: '$75,000 - $90,000',
    matchScore: 74,
    skills: ['SQL', 'Tableau', 'DAX', 'Data Warehousing'],
  },
  {
    title: 'Associate Product Data Analyst',
    company: 'Nova Interactive',
    location: 'Austin, TX',
    salary: '$70,000 - $85,000',
    matchScore: 68,
    skills: ['Python', 'A/B Testing', 'Pandas', 'Google Analytics'],
  },
];

export const MOCK_PRACTICAL_CHALLENGES = [
  {
    title: 'Cohort Retention & LTV Analysis (SQL)',
    difficulty: 'Intermediate',
    timeLimit: '45 mins',
    status: 'Ready',
    description: 'Write complex SQL queries calculating monthly cohort retention rates from raw transactional database tables.',
    topics: ['Self JOIN', 'Date Arithmetic', 'Window Aggregations'],
  },
  {
    title: 'Power BI Executive Dashboard Simulation',
    difficulty: 'Intermediate',
    timeLimit: '60 mins',
    status: 'Ready',
    description: 'Model star schema relationships and implement DAX measures for Year-over-Year sales growth.',
    topics: ['DAX CALCULATE', 'Time Intelligence', 'Data Modeling'],
  },
  {
    title: 'Anomaly Detection in Financial Transactions',
    difficulty: 'Advanced',
    timeLimit: '50 mins',
    status: 'Locked (Requires Power BI Module)',
    description: 'Perform exploratory data analysis and isolate outlier transactions using Python Pandas & Scipy.',
    topics: ['Python', 'Z-Score Analysis', 'Data Cleaning'],
  },
];

export const MOCK_ADMIN_METRICS = {
  totalUsers: '1,428',
  resumesAnalyzed: '3,892',
  assessmentsCompleted: '945',
  interviewsCompleted: '612',
  recentUsers: [
    { name: 'Alex Morgan', email: 'alex@university.edu', role: 'Junior Data Analyst', date: '2026-08-30', status: 'Active', readiness: '74%' },
    { name: 'Sarah Jenkins', email: 'sarah.j@techmail.io', role: 'Frontend Software Engineer', date: '2026-08-29', status: 'Active', readiness: '88%' },
    { name: 'Michael Chang', email: 'mchang@devmail.org', role: 'Machine Learning Engineer', date: '2026-08-28', status: 'Pending Review', readiness: '62%' },
    { name: 'Emily Davis', email: 'emily.d@candidate.net', role: 'Product Analyst', date: '2026-08-27', status: 'Active', readiness: '91%' },
    { name: 'Robert Wilson', email: 'rwilson@csedu.com', role: 'DevOps / Cloud Engineer', date: '2026-08-26', status: 'Inactive', readiness: '45%' },
  ],
  recentActivity: [
    { action: 'Resume parsed & ATS evaluated', user: 'Sarah Jenkins', time: '12 mins ago', tag: 'Resume' },
    { action: 'Completed Practical Challenge: SQL Window Functions', user: 'Alex Morgan', time: '45 mins ago', tag: 'Assessment' },
    { action: 'Completed AI Technical Mock Interview', user: 'Michael Chang', time: '2 hours ago', tag: 'Interview' },
    { action: 'New Candidate Registration', user: 'David Kim', time: '4 hours ago', tag: 'Auth' },
    { action: 'Readiness Twin calculated at 91%', user: 'Emily Davis', time: '6 hours ago', tag: 'Readiness' },
  ],
};

