from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone


# ---------------------------------------------------------------------------
# Dashboard Models
# ---------------------------------------------------------------------------

class AdminDashboardMetrics(BaseModel):
    total_users: int = Field(0, description="Total registered candidate accounts")
    total_admins: int = Field(0, description="Total system administrators")
    total_resumes: int = Field(0, description="Total uploaded resumes")
    total_jobs: int = Field(0, description="Total analyzed job descriptions")
    total_assessments: int = Field(0, description="Total completed assessments")
    total_readiness_analyses: int = Field(0, description="Total Readiness Twin analyses")
    active_users: int = Field(0, description="Users active recently")


class RecentUserSummary(BaseModel):
    id: str
    name: str
    email: str
    role: str = "user"
    target_role: Optional[str] = "Junior Data Analyst"
    created_at: Optional[datetime] = None


class RecentActivitySummary(BaseModel):
    id: str
    action: str
    admin_email: Optional[str] = None
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    timestamp: datetime
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AdminDashboardResponse(BaseModel):
    metrics: AdminDashboardMetrics
    recent_users: List[RecentUserSummary] = Field(default_factory=list)
    recent_activity: List[RecentActivitySummary] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


# ---------------------------------------------------------------------------
# User Management Models
# ---------------------------------------------------------------------------

class AdminUserListItem(BaseModel):
    id: str
    name: str
    email: str
    role: str = "user"
    target_role: Optional[str] = "Junior Data Analyst"
    experience_level: Optional[str] = "Junior"
    status: str = "Active"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class AdminUserListResponse(BaseModel):
    items: List[AdminUserListItem]
    page: int
    limit: int
    total: int
    pages: int

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class AdminUserDetails(BaseModel):
    """
    Detailed candidate user profile view for administrators.
    Never contains passwords, hashes, OTPs, or authentication secrets.
    """
    id: str
    name: str
    email: str
    role: str = "user"
    phone: Optional[str] = ""
    location: Optional[str] = ""
    country: Optional[str] = ""
    bio: Optional[str] = ""

    # Education
    education: Optional[str] = ""
    degree: Optional[str] = ""
    university: Optional[str] = ""
    graduation_year: Optional[int] = None

    # Experience & Goals
    experience_level: Optional[str] = "Junior"
    years_of_experience: Optional[float] = 0.0
    current_job_title: Optional[str] = ""
    target_role: Optional[str] = "Junior Data Analyst"
    career_interests: List[str] = Field(default_factory=list)

    # Skills & Links
    skills: List[str] = Field(default_factory=list)
    github_url: Optional[str] = ""
    linkedin_url: Optional[str] = ""
    portfolio_url: Optional[str] = ""

    # System Status & Metadata
    status: str = "Active"
    resumes_count: int = 0
    jobs_count: int = 0
    readiness_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class UserRoleUpdateRequest(BaseModel):
    role: str = Field(..., description="Target role: 'user' or 'admin'")


# ---------------------------------------------------------------------------
# Resumes / Jobs / Assessments Models
# ---------------------------------------------------------------------------

class AdminResumeListItem(BaseModel):
    id: str
    user_id: str
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    original_filename: str
    file_type: str
    file_size: int
    parsing_status: str = "completed"
    skills_count: int = 0
    is_active: bool = True
    uploaded_at: datetime


class AdminResumeListResponse(BaseModel):
    items: List[AdminResumeListItem]
    page: int
    limit: int
    total: int
    pages: int

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class AdminJobListItem(BaseModel):
    id: str
    user_id: str
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    job_title: str
    company_name: Optional[str] = None
    location: Optional[str] = None
    work_mode: Optional[str] = None
    required_skills_count: int = 0
    analysis_status: str = "completed"
    created_at: datetime


class AdminJobListResponse(BaseModel):
    items: List[AdminJobListItem]
    page: int
    limit: int
    total: int
    pages: int

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class AdminAssessmentListItem(BaseModel):
    id: str
    user_id: str
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    title: str
    assessment_type: str = "Technical Challenge"
    target_role: Optional[str] = None
    score: float
    status: str = "Completed"
    created_at: datetime


class AdminAssessmentListResponse(BaseModel):
    items: List[AdminAssessmentListItem]
    page: int
    limit: int
    total: int
    pages: int

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


# ---------------------------------------------------------------------------
# Readiness Analytics Models
# ---------------------------------------------------------------------------

class ReadinessDistributionBucket(BaseModel):
    range_label: str  # e.g., "0-39", "40-59", "60-69", "70-79", "80-89", "90-100"
    count: int
    percentage: float


class AdminReadinessAnalyticsResponse(BaseModel):
    total_analyses: int
    average_readiness_score: float
    average_knowledge_score: float
    average_practical_score: float
    average_evidence_score: float
    average_communication_score: float
    average_roadmap_score: float
    score_distribution: List[ReadinessDistributionBucket] = Field(default_factory=list)
    verdict_distribution: Dict[str, int] = Field(default_factory=dict)

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


# ---------------------------------------------------------------------------
# Skill Analytics Models
# ---------------------------------------------------------------------------

class SkillFrequencyItem(BaseModel):
    skill: str
    count: int
    percentage: float
    category: Optional[str] = "Technical"


class AdminSkillAnalyticsResponse(BaseModel):
    top_required_skills: List[SkillFrequencyItem] = Field(default_factory=list)
    top_missing_skills: List[SkillFrequencyItem] = Field(default_factory=list)
    top_candidate_skills: List[SkillFrequencyItem] = Field(default_factory=list)
    average_skill_readiness: float = 0.0
    total_skills_tracked: int = 0

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


# ---------------------------------------------------------------------------
# Audit Log Models
# ---------------------------------------------------------------------------

class AdminAuditLogItem(BaseModel):
    id: str
    admin_id: str
    admin_email: str
    action: str
    target_type: str
    target_id: Optional[str] = None
    timestamp: datetime
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AdminAuditLogListResponse(BaseModel):
    items: List[AdminAuditLogItem]
    page: int
    limit: int
    total: int
    pages: int

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


# ---------------------------------------------------------------------------
# System Health Models
# ---------------------------------------------------------------------------

class AdminSystemHealthResponse(BaseModel):
    api: str = "healthy"
    database: str = "healthy"
    database_name: str = "ideal_skillsetdb"
    ai_service: str = "available"
    environment: str = "production"
    version: str = "1.0.0"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


# ---------------------------------------------------------------------------
# ATS Analytics Models
# ---------------------------------------------------------------------------

class AdminATSAnalyticsResponse(BaseModel):
    total_scans: int = 0
    average_ats_score: float = 0.0
    score_distribution: List[ReadinessDistributionBucket] = Field(default_factory=list)
    common_missing_skills: List[SkillFrequencyItem] = Field(default_factory=list)
    problem_breakdown: Dict[str, int] = Field(default_factory=dict)
    average_keyword_match_rate: float = 0.0

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


# ---------------------------------------------------------------------------
# Assessment Analytics Models
# ---------------------------------------------------------------------------

class SkillDifficultyItem(BaseModel):
    skill: str
    total_attempts: int
    average_score: float
    pass_rate: float
    difficulty_rating: str = "Medium"


class AdminAssessmentAnalyticsResponse(BaseModel):
    total_attempts: int = 0
    average_score: float = 0.0
    pass_rate: float = 0.0
    completion_rate: float = 0.0
    skill_difficulty: List[SkillDifficultyItem] = Field(default_factory=list)
    assessment_type_breakdown: Dict[str, int] = Field(default_factory=dict)

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


# ---------------------------------------------------------------------------
# Interview Analytics Models
# ---------------------------------------------------------------------------

class InterviewWeaknessItem(BaseModel):
    weakness: str
    frequency: int
    category: str = "Technical"
    suggested_action: str = ""


class AdminInterviewAnalyticsResponse(BaseModel):
    total_interviews: int = 0
    average_overall_score: float = 0.0
    technical_score: float = 0.0
    communication_score: float = 0.0
    confidence_score: float = 0.0
    problem_solving_score: float = 0.0
    behavioral_score: float = 0.0
    common_weaknesses: List[InterviewWeaknessItem] = Field(default_factory=list)
    role_breakdown: Dict[str, int] = Field(default_factory=dict)

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


# ---------------------------------------------------------------------------
# Roadmap Analytics Models
# ---------------------------------------------------------------------------

class AbandonedWeekItem(BaseModel):
    week_number: int
    drop_count: int
    drop_percentage: float
    topic: str = ""


class AdminRoadmapAnalyticsResponse(BaseModel):
    total_roadmaps_generated: int = 0
    active_roadmaps: int = 0
    completed_roadmaps: int = 0
    average_completion_percentage: float = 0.0
    abandoned_weeks: List[AbandonedWeekItem] = Field(default_factory=list)
    task_type_breakdown: Dict[str, int] = Field(default_factory=dict)

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


# ---------------------------------------------------------------------------
# AI / Ollama Monitoring Models
# ---------------------------------------------------------------------------

class AdminAIHealthResponse(BaseModel):
    ollama_status: str = "online"
    active_model: str = "llama3:latest"
    total_requests: int = 0
    failure_count: int = 0
    average_latency_ms: float = 0.0
    last_heartbeat: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    system_load: str = "normal"
    model_parameters: str = "8B"
    embedding_model: str = "all-minilm:latest"

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


# ---------------------------------------------------------------------------
# Admin Notifications / Alerts Models
# ---------------------------------------------------------------------------

class AdminNotificationItem(BaseModel):
    id: str
    title: str
    message: str
    severity: str = "INFO"  # INFO, WARNING, ERROR, CRITICAL
    category: str = "SYSTEM"  # PARSING, EMAIL, AI_STATUS, DATABASE, SECURITY
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AdminNotificationListResponse(BaseModel):
    items: List[AdminNotificationItem] = Field(default_factory=list)
    unread_count: int = 0
    total: int = 0

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


