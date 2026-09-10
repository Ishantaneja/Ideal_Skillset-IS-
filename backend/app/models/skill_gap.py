from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone


class SkillEvidenceItem(BaseModel):
    """
    Evidence statements from candidate resume and target job requisition.
    """
    resume: List[str] = Field(default_factory=list)
    job: List[str] = Field(default_factory=list)


class SkillGapItem(BaseModel):
    """
    Detailed intelligent gap evaluation for a specific technical or soft skill.
    """
    skill: str
    normalized_skill: str
    category: str = "General"
    importance: str = "high"  # "critical", "high", "medium", "low"
    required: bool = True
    preferred: bool = False

    current_level: int = 0  # 0=None, 1=Beginner, 2=Basic, 3=Intermediate, 4=Advanced, 5=Expert
    current_level_label: str = "None"

    required_level: int = 3  # Target expected level
    required_level_label: str = "Intermediate"

    gap: int = 3  # required_level - current_level
    gap_label: str = "Large"  # "No Gap", "Small", "Medium", "Large"

    job_frequency: float = 0.5  # 0.0 to 1.0 (appearance density in JD)
    ats_impact: float = 0.0  # Estimated points boost in ATS compatibility

    learning_effort: str = "medium"  # "low", "medium", "high"
    estimated_learning_hours: int = 30

    priority_score: float = Field(..., description="Deterministic priority ranking score (0.0 to 10.0)")
    priority_label: str = "High"  # "Critical", "High", "Medium", "Low"

    reason: str = "Required skill for this role."
    recommended_action: str = "Build hands-on practice projects."
    recommended_topics: List[str] = Field(default_factory=list)
    evidence: SkillEvidenceItem = Field(default_factory=SkillEvidenceItem)


class SkillGapOverallSummary(BaseModel):
    """
    High-level metrics summarizing the candidate's preparedness for the target role.
    """
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    total_skills: int = 0
    matched_skills_count: int = 0
    missing_skills_count: int = 0
    current_ats_score: float = 0.0
    potential_ats_score: float = 0.0


# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------

class SkillGapAnalyzeRequest(BaseModel):
    """
    Request to execute intelligent skill gap analysis.
    """
    resume_id: str = Field(..., description="ID of the user's parsed resume")
    job_id: str = Field(..., description="ID of the user's analyzed job description")


class SkillGapSimulateRequest(BaseModel):
    """
    Request to simulate readiness score when leveling up specific skills.
    """
    analysis_id: Optional[str] = None
    resume_id: Optional[str] = None
    job_id: Optional[str] = None
    improved_skills: Dict[str, int] = Field(
        default_factory=dict,
        description="Map of skill name to target level (1-5)"
    )


# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------

class SkillGapAnalysisResponse(BaseModel):
    """
    Complete intelligent skill gap report answering what to learn first.
    """
    id: str = Field(..., description="Unique skill gap analysis identifier")
    user_id: str
    resume_id: str
    job_id: str
    job_title: Optional[str] = "Target Role"
    company_name: Optional[str] = None
    resume_filename: Optional[str] = None
    overall_gap_summary: SkillGapOverallSummary
    skills: List[SkillGapItem] = Field(default_factory=list)
    recommended_learning_order: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class SkillGapListItem(BaseModel):
    """
    Summary representation for history listing.
    """
    id: str
    resume_id: str
    job_id: str
    job_title: Optional[str] = "Target Role"
    company_name: Optional[str] = None
    critical_gaps_count: int = 0
    total_gaps_count: int = 0
    current_ats_score: float = 0.0
    potential_ats_score: float = 0.0
    created_at: datetime


class SkillGapListResponse(BaseModel):
    items: List[SkillGapListItem]
    total: int


# ---------------------------------------------------------------------------
# Database Document
# ---------------------------------------------------------------------------

class SkillGapInDB(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    resume_id: str
    job_id: str
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    resume_filename: Optional[str] = None
    overall_gap_summary: Dict[str, Any]
    skills: List[Dict[str, Any]] = Field(default_factory=list)
    recommended_learning_order: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

