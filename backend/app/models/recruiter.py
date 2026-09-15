from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timezone
from enum import Enum


class ApplicationStage(str, Enum):
    APPLIED = "applied"
    AI_SCREENED = "ai_screened"
    SHORTLISTED = "shortlisted"
    ASSESSMENT = "assessment"
    INTERVIEW = "interview"
    FINAL_REVIEW = "final_review"
    OFFER = "offer"
    HIRED = "hired"
    REJECTED = "rejected"


class NextActionRecommendation(str, Enum):
    STRONG_MATCH = "STRONG MATCH"
    INTERVIEW = "INTERVIEW"
    ASSESSMENT_FIRST = "ASSESSMENT FIRST"
    VERIFY_SKILLS = "VERIFY SKILLS"
    BORDERLINE = "BORDERLINE"
    LOW_MATCH = "LOW MATCH"


class SkillVerificationStatus(str, Enum):
    VERIFIED = "verified"
    SUPPORTED = "supported"
    PARTIALLY_SUPPORTED = "partially supported"
    INSUFFICIENT_EVIDENCE = "insufficient evidence"
    REQUIRES_VERIFICATION = "requires verification"


class SkillImportance(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    PREFERRED = "preferred"


# ---------------------------------------------------------------------------
# Job Blueprint Models
# ---------------------------------------------------------------------------

class BlueprintSkill(BaseModel):
    name: str
    category: str = "Technical"
    importance: SkillImportance = SkillImportance.HIGH
    required: bool = True
    confidence: float = 90.0
    explanation: str = ""


class JobBlueprint(BaseModel):
    role_title: str
    critical_skills: List[BlueprintSkill] = Field(default_factory=list)
    high_priority_skills: List[BlueprintSkill] = Field(default_factory=list)
    preferred_skills: List[BlueprintSkill] = Field(default_factory=list)
    experience_requirements: List[str] = Field(default_factory=list)
    behavioral_competencies: List[str] = Field(default_factory=list)
    summary: str = ""
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class EvaluationWeights(BaseModel):
    technical_skills: float = 0.35
    experience: float = 0.25
    practical_evidence: float = 0.15
    assessment: float = 0.10
    communication: float = 0.10
    education: float = 0.05


class RecruiterJobCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    description: str = Field(..., min_length=10)
    responsibilities: Optional[List[str]] = Field(default_factory=list)
    required_experience: Optional[str] = Field(default="2-4 years")
    location: Optional[str] = Field(default="Remote / Flexible")
    employment_type: Optional[str] = Field(default="Full-time")
    salary_range: Optional[str] = None
    required_skills: Optional[List[str]] = Field(default_factory=list)
    preferred_skills: Optional[List[str]] = Field(default_factory=list)
    weights: Optional[EvaluationWeights] = None


class RecruiterJobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    responsibilities: Optional[List[str]] = None
    required_experience: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    salary_range: Optional[str] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    status: Optional[str] = None  # active, paused, closed
    blueprint: Optional[JobBlueprint] = None
    weights: Optional[EvaluationWeights] = None


class RecruiterJobResponse(BaseModel):
    id: str
    company_id: str
    recruiter_id: str
    title: str
    description: str
    responsibilities: List[str] = Field(default_factory=list)
    required_experience: str = ""
    location: str = "Remote"
    employment_type: str = "Full-time"
    salary_range: Optional[str] = None
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    status: str = "active"
    blueprint: Optional[JobBlueprint] = None
    weights: Optional[EvaluationWeights] = None
    applicant_count: int = 0
    shortlisted_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


# ---------------------------------------------------------------------------
# Skill Verification & Consistency Engine Models
# ---------------------------------------------------------------------------

class SkillVerificationItem(BaseModel):
    skill: str
    claimed_level: str = "Proficient"
    resume_evidence: str = "None"
    project_evidence: str = "None"
    github_evidence: str = "None"
    certificate_evidence: str = "None"
    experience_evidence: str = "None"
    assessment_evidence: str = "None"
    interview_evidence: str = "None"
    confidence: float = 75.0
    status: SkillVerificationStatus = SkillVerificationStatus.SUPPORTED
    impact: str = "medium"  # critical, high, medium, low
    explanation: str = ""


class ConsistencyCheckItem(BaseModel):
    observation: str
    sources: List[str] = Field(default_factory=list)
    severity: str = "informational"  # informational, note, verify
    recommendation: str = "Skill evidence is inconsistent and should be verified."


# ---------------------------------------------------------------------------
# Candidate Evaluation Models
# ---------------------------------------------------------------------------

class CandidateEvaluationScores(BaseModel):
    overall_fit: float = 0.0
    technical_skills: float = 0.0
    relevant_experience: float = 0.0
    practical_evidence: float = 0.0
    assessment_performance: float = 0.0
    interview_performance: float = 0.0
    education: float = 0.0
    role_readiness: float = 0.0
    evidence_confidence: float = 0.0


class CandidateSuccessMilestone(BaseModel):
    period: str  # "0-30 days", "31-60 days", "61-90 days"
    risk_level: str = "low"  # low, medium, high
    focus_area: str = ""
    recommendation: str = ""


class CandidateUpskillFit(BaseModel):
    current_fit: float = 0.0
    potential_fit_after_training: float = 0.0
    target_skill: str = ""
    estimated_training_effort: str = "Moderate"  # Low, Moderate, Substantial
    projected_ramp_up_weeks: int = 3


class CandidateEvaluation(BaseModel):
    id: Optional[str] = None
    candidate_id: str
    job_id: str
    scores: CandidateEvaluationScores = Field(default_factory=CandidateEvaluationScores)
    strengths: List[str] = Field(default_factory=list)
    concerns: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    unverified_skills: List[str] = Field(default_factory=list)
    recommended_action: NextActionRecommendation = NextActionRecommendation.VERIFY_SKILLS
    why_interview: List[str] = Field(default_factory=list)
    why_not_interview: List[str] = Field(default_factory=list)
    verifications: List[SkillVerificationItem] = Field(default_factory=list)
    consistency_checks: List[ConsistencyCheckItem] = Field(default_factory=list)
    summary_explanation: str = ""
    estimated_ramp_up: str = "2-4 weeks"
    milestones: List[CandidateSuccessMilestone] = Field(default_factory=list)
    upskill_fit: Optional[CandidateUpskillFit] = None
    evaluation_version: str = "v1.0"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ---------------------------------------------------------------------------
# Candidate Profile & Application Models
# ---------------------------------------------------------------------------

class NormalizedCandidateProfile(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = ""
    location: Optional[str] = ""
    experience_level: Optional[str] = "Junior"
    years_of_experience: Optional[float] = 0.0
    target_role: Optional[str] = "Software Engineer"
    skills: List[str] = Field(default_factory=list)
    education: Optional[str] = ""
    projects: List[Dict[str, Any]] = Field(default_factory=list)
    work_history: List[Dict[str, Any]] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    github_url: Optional[str] = ""
    portfolio_url: Optional[str] = ""
    linkedin_url: Optional[str] = ""


class CandidateApplicationItem(BaseModel):
    application_id: str
    candidate_id: str
    job_id: str
    name: str
    email: str
    location: str = "Remote"
    experience_level: str = "Junior"
    current_stage: ApplicationStage = ApplicationStage.APPLIED
    applied_at: datetime
    resume_id: Optional[str] = None
    overall_fit: float = 0.0
    technical_skills: float = 0.0
    relevant_experience: float = 0.0
    evidence_confidence: float = 0.0
    readiness_score: float = 0.0
    recommended_action: NextActionRecommendation = NextActionRecommendation.VERIFY_SKILLS
    key_strengths: List[str] = Field(default_factory=list)
    key_concerns: List[str] = Field(default_factory=list)
    has_github_verified: bool = False
    has_cert_verified: bool = False
    is_shortlisted: bool = False


# ---------------------------------------------------------------------------
# Comparison Models
# ---------------------------------------------------------------------------

class CandidateComparisonRequest(BaseModel):
    candidate_ids: List[str] = Field(..., min_length=2, max_length=5)
    job_id: str


class ComparisonCandidateColumn(BaseModel):
    candidate_id: str
    name: str
    target_role: str
    overall_fit: float
    technical_skills: float
    experience: float
    evidence_confidence: float
    assessment: float
    interview: float
    role_readiness: float
    recommended_action: str
    strong_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    ramp_up: str = ""


class CandidateComparisonResponse(BaseModel):
    job_id: str
    job_title: str
    candidates: List[ComparisonCandidateColumn]
    comparative_summary: str
    strongest_candidate_id: Optional[str] = None


# ---------------------------------------------------------------------------
# Assessment Models
# ---------------------------------------------------------------------------

class AssessmentQuestion(BaseModel):
    id: str
    section: str  # API Design, Python, Database Design, Debugging, Problem Solving
    question: str
    difficulty: str = "Medium"
    skill_targeted: str
    type: str = "scenario"  # scenario, coding, multiple_choice
    options: Optional[List[str]] = None
    correct_option_index: Optional[int] = None
    evaluation_criteria: str = ""


class GeneratedAssessment(BaseModel):
    id: str
    job_id: str
    candidate_id: str
    role_title: str
    sections: List[str] = Field(default_factory=list)
    questions: List[AssessmentQuestion] = Field(default_factory=list)
    target_skills: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AssessmentSubmissionRequest(BaseModel):
    assessment_id: str
    candidate_id: str
    job_id: str
    score: float = Field(..., ge=0, le=100)
    section_scores: Dict[str, float] = Field(default_factory=dict)
    interviewer_notes: Optional[str] = ""


# ---------------------------------------------------------------------------
# Interview Models
# ---------------------------------------------------------------------------

class InterviewQuestion(BaseModel):
    id: str
    category: str  # technical, behavioral
    question: str
    purpose: str
    star_focus: Optional[str] = None  # Situation, Task, Action, Result
    target_skill_or_competency: str
    evaluation_rubric: str = ""


class GeneratedInterviewPlan(BaseModel):
    id: str
    job_id: str
    candidate_id: str
    role_title: str
    technical_questions: List[InterviewQuestion] = Field(default_factory=list)
    behavioral_questions: List[InterviewQuestion] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class InterviewSummaryRequest(BaseModel):
    interview_id: Optional[str] = None
    candidate_id: str
    job_id: str
    interviewer_notes: str = Field(..., min_length=10)
    technical_score: float = Field(default=80.0, ge=0, le=100)
    communication_score: float = Field(default=80.0, ge=0, le=100)
    problem_solving_score: float = Field(default=80.0, ge=0, le=100)


class InterviewSummaryResponse(BaseModel):
    candidate_id: str
    job_id: str
    technical_score: float
    problem_solving_score: float
    communication_score: float
    role_readiness_score: float
    strengths: List[str] = Field(default_factory=list)
    concerns: List[str] = Field(default_factory=list)
    recommendation: str  # PROCEED TO FINAL ROUND, HOLD, REJECT
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ---------------------------------------------------------------------------
# Pipeline & Hiring Decision Models
# ---------------------------------------------------------------------------

class UpdateStageRequest(BaseModel):
    stage: ApplicationStage
    notes: Optional[str] = ""


class HiringDecisionCreate(BaseModel):
    job_id: str
    candidate_id: str
    action: str = Field(..., description="OFFER, HIRE, REJECT, HOLD, ADVANCE")
    reason: str = Field(..., min_length=5)
    supporting_evidence: Optional[str] = ""
    next_step: Optional[str] = ""


# ---------------------------------------------------------------------------
# Dashboard, Analytics & Insights Models
# ---------------------------------------------------------------------------

class RecruiterDashboardResponse(BaseModel):
    company_name: str
    recruiter_name: str
    open_roles: int = 0
    total_applicants: int = 0
    ai_screened: int = 0
    ai_shortlisted: int = 0
    interviews: int = 0
    offers: int = 0
    estimated_screening_time_saved_hours: float = 0.0
    screening_time_note: str = "Screening time saved is estimated based on an average manual review time of 3.5 minutes per resume."
    active_jobs: List[Dict[str, Any]] = Field(default_factory=list)
    shortlisted_candidates: List[Dict[str, Any]] = Field(default_factory=list)
    candidates_requiring_verification: List[Dict[str, Any]] = Field(default_factory=list)
    pipeline_breakdown: Dict[str, int] = Field(default_factory=dict)
    skill_shortage_insights: List[Dict[str, Any]] = Field(default_factory=list)
    recent_activity: List[Dict[str, Any]] = Field(default_factory=list)


class JobInsightsResponse(BaseModel):
    job_id: str
    job_title: str
    total_applicants: int = 0
    strong_match_count: int = 0
    potential_match_count: int = 0
    needs_verification_count: int = 0
    low_match_count: int = 0
    top_missing_skills: List[Dict[str, Any]] = Field(default_factory=list)
    average_fit_score: float = 0.0


class RecruiterAnalyticsResponse(BaseModel):
    total_applicants: int = 0
    screened_applicants: int = 0
    shortlisted_count: int = 0
    shortlist_rate: float = 0.0
    assessment_completion_count: int = 0
    interview_count: int = 0
    offers_count: int = 0
    hires_count: int = 0
    rejected_count: int = 0
    average_fit_score: float = 0.0
    average_assessment_score: float = 0.0
    estimated_resumes_avoided: int = 0
    estimated_time_saved_hours: float = 0.0
    pipeline_funnel: List[Dict[str, Any]] = Field(default_factory=list)
    common_skill_gaps: List[Dict[str, Any]] = Field(default_factory=list)


class RecruiterSettings(BaseModel):
    company_name: str
    recruiter_name: str
    email: str
    minutes_saved_per_resume: float = 3.5
    default_role_title: str = "Software Engineer"
    allow_ai_screening: bool = True


# ---------------------------------------------------------------------------
# What-If & Policy Simulation Models
# ---------------------------------------------------------------------------

class WhatIfSimulationRequest(BaseModel):
    job_id: str
    simulated_critical_skills: Optional[List[str]] = None
    simulated_preferred_skills: Optional[List[str]] = None
    simulated_required_experience_years: Optional[float] = None
    simulated_weights: Optional[EvaluationWeights] = None
    min_fit_threshold: float = 70.0


class WhatIfSimulationResponse(BaseModel):
    job_id: str
    job_title: str
    original_pool_count: int
    simulated_pool_count: int
    original_shortlisted_count: int
    simulated_shortlisted_count: int
    additional_candidates_count: int
    critical_skill_coverage_original: float
    critical_skill_coverage_simulated: float
    average_fit_original: float
    average_fit_simulated: float
    talent_availability_impact: str
    quality_tradeoff_summary: str
    candidate_changes: List[Dict[str, Any]] = Field(default_factory=list)
    is_simulated: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ---------------------------------------------------------------------------
# Job Work Simulation Models
# ---------------------------------------------------------------------------

class SimulationScenarioType(str, Enum):
    DEBUGGING = "debugging"
    API_DESIGN = "api_design"
    SYSTEM_ARCHITECTURE = "system_architecture"
    PRODUCTION_INCIDENT = "production_incident"
    DATA_PIPELINE = "data_pipeline"


class JobWorkSimulation(BaseModel):
    id: str
    job_id: str
    candidate_id: str
    title: str
    scenario_type: SimulationScenarioType = SimulationScenarioType.PRODUCTION_INCIDENT
    difficulty: str = "Senior"
    context_description: str
    system_logs: Optional[str] = None
    bug_report: Optional[str] = None
    database_behavior: Optional[str] = None
    api_requirements: Optional[str] = None
    tasks_to_solve: List[str] = Field(default_factory=list)
    evaluation_rubric: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WorkSimulationSubmission(BaseModel):
    simulation_id: str
    candidate_id: str
    job_id: str
    response_text: str
    technical_decisions: Optional[List[str]] = Field(default_factory=list)
    code_snippets: Optional[str] = ""


class WorkSimulationEvaluationResponse(BaseModel):
    simulation_id: str
    candidate_id: str
    job_id: str
    practical_readiness_score: float
    technical_reasoning_score: float
    debugging_score: float
    architecture_score: float
    communication_score: float
    decision_quality_score: float
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    overall_summary: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ---------------------------------------------------------------------------
# AI Recruiter Agent Models
# ---------------------------------------------------------------------------

class AgentWorkflowState(str, Enum):
    PLANNING = "planning"
    EXECUTING = "executing"
    WAITING = "waiting"
    COMPLETED = "completed"
    FAILED = "failed"


class AgentToolCall(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)
    result_summary: str = ""
    status: str = "success"  # success, error
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AgentRunRequest(BaseModel):
    prompt: str = Field(..., min_length=3)
    job_id: Optional[str] = None
    max_steps: int = 8


class AgentRunResponse(BaseModel):
    run_id: str
    company_id: str
    recruiter_id: str
    request_prompt: str
    state: AgentWorkflowState
    tools_executed: List[AgentToolCall] = Field(default_factory=list)
    action_plan: List[str] = Field(default_factory=list)
    final_recommendation: str
    data_payload: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    completed_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Search & Feedback Models
# ---------------------------------------------------------------------------

class NLSearchRequest(BaseModel):
    query: str = Field(..., min_length=3)
    job_id: Optional[str] = None


class CapabilitySearchRequest(BaseModel):
    capability: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    min_confidence: float = 60.0
    min_fit: Optional[float] = None
    must_have_github: bool = False
    must_have_certs: bool = False
    stage: Optional[str] = None
    job_id: Optional[str] = None


class RecruiterFeedbackCreate(BaseModel):
    candidate_id: str
    job_id: str
    evaluation_id: Optional[str] = None
    agreed_with_ai: Optional[bool] = True
    actual_outcome: Optional[str] = None
    feedback_type: str = "helpful"  # helpful, not_helpful, incorrect, needs_review
    feedback_notes: Optional[str] = ""
    comment: Optional[str] = ""
    calibration_tags: List[str] = Field(default_factory=list)


class ScreeningJobResponse(BaseModel):
    job_id: str
    status: str = "completed"  # queued, processing, completed, failed, needs_review
    total_resumes: int = 0
    processed_resumes: int = 0
    processed_count: int = 0
    successful_resumes: int = 0
    completed_count: int = 0
    needs_review_count: int = 0
    failed_resumes: int = 0
    failed_count: int = 0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


