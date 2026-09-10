from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone


class RoadmapTaskItem(BaseModel):
    """
    Individual actionable learning, practice, project, or evidence milestone task.
    """
    id: str = Field(..., description="Unique task identifier within the roadmap")
    title: str = Field(..., description="Actionable title of the task")
    type: str = Field("learning", description="learning | practice | project | evidence | assessment | interview | resume | portfolio")
    skill: str = Field(..., description="Target technical or soft skill")
    estimated_hours: int = Field(2, description="Estimated hour budget")
    status: str = Field("not_started", description="not_started | in_progress | completed")
    why_it_matters: str = Field(..., description="Rationale connecting task to job readiness")
    expected_outcome: str = Field(..., description="Concrete capability demonstrated upon completion")
    related_job_req: Optional[str] = None
    ats_impact: Optional[str] = None


class RoadmapProjectItem(BaseModel):
    """
    Real-world business project tailored to target role.
    """
    title: str
    description: str
    skills: List[str] = Field(default_factory=list)
    tools: List[str] = Field(default_factory=list)
    dataset_or_input: str = "Standard public benchmark dataset or company simulated data"
    expected_output: str = "Production-quality deliverables with documented README"
    evidence_to_produce: str = "GitHub repository link, live demo, or dashboard screenshot"
    estimated_hours: int = 8
    portfolio_value: str = "High - directly proves hands-on ability for target role"


class RoadmapWeekItem(BaseModel):
    """
    Structured weekly learning and execution plan.
    """
    week: int
    title: str
    theme: str
    primary_skill: str
    secondary_skills: List[str] = Field(default_factory=list)
    goals: List[str] = Field(default_factory=list)
    tasks: List[RoadmapTaskItem] = Field(default_factory=list)
    project: Optional[RoadmapProjectItem] = None
    milestone: str
    estimated_hours: int = 15
    week_progress: float = 0.0
    expected_readiness_impact: str = "+3-5% estimated match boost"


# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------

class RoadmapGenerateRequest(BaseModel):
    """
    Request to generate personalized career readiness roadmap.
    """
    resume_id: str
    job_id: str
    skill_gap_analysis_id: Optional[str] = None
    duration_weeks: Optional[int] = Field(4, description="1, 2, 4, 6, 8, or 12 weeks")


class RoadmapTaskUpdateRequest(BaseModel):
    """
    Request to update task completion status.
    """
    status: str = Field(..., description="not_started | in_progress | completed")


class RoadmapRegenerateRequest(BaseModel):
    """
    Request to regenerate roadmap with modified duration.
    """
    duration_weeks: Optional[int] = Field(4, description="Duration in weeks (1, 2, 4, 6, 8, 12)")


# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------

class RoadmapResponse(BaseModel):
    """
    Complete personalized roadmap response.
    """
    id: str = Field(..., description="Unique roadmap identifier")
    user_id: str
    resume_id: str
    job_id: str
    ats_analysis_id: Optional[str] = None
    skill_gap_analysis_id: Optional[str] = None
    title: str
    target_role: str
    company_name: Optional[str] = None
    resume_filename: Optional[str] = None
    duration_weeks: int = 4
    current_ats_score: float = 0.0
    estimated_target_score: float = 0.0
    overall_progress: float = 0.0
    total_hours: int = 0
    completed_tasks_count: int = 0
    total_tasks_count: int = 0
    weeks: List[RoadmapWeekItem] = Field(default_factory=list)
    status: str = "active"
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class RoadmapListItem(BaseModel):
    """
    Summary representation for history listing.
    """
    id: str
    resume_id: str
    job_id: str
    title: str
    target_role: str
    company_name: Optional[str] = None
    duration_weeks: int
    current_ats_score: float
    estimated_target_score: float
    overall_progress: float
    created_at: datetime


class RoadmapListResponse(BaseModel):
    items: List[RoadmapListItem]
    total: int


# ---------------------------------------------------------------------------
# Internal Database Document
# ---------------------------------------------------------------------------

class RoadmapInDB(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    resume_id: str
    job_id: str
    ats_analysis_id: Optional[str] = None
    skill_gap_analysis_id: Optional[str] = None
    title: str
    target_role: str
    company_name: Optional[str] = None
    resume_filename: Optional[str] = None
    duration_weeks: int = 4
    current_ats_score: float = 0.0
    estimated_target_score: float = 0.0
    overall_progress: float = 0.0
    total_hours: int = 0
    completed_tasks_count: int = 0
    total_tasks_count: int = 0
    weeks: List[Dict[str, Any]] = Field(default_factory=list)
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

