from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone


class DimensionScore(BaseModel):
    """
    Individual evaluation for one of the 5 core readiness dimensions.
    """
    name: str = Field(..., description="Dimension name (Knowledge, Practical Ability, etc.)")
    score: float = Field(..., description="Calculated dimension score (0-100)")
    benchmark: float = Field(75.0, description="Target market benchmark for role")
    weight_percentage: float = Field(25.0, description="Dimension weight in overall readiness")
    status: str = Field("Ready", description="Ready | Competitive | Needs Polish | Critical Gap")
    status_color: str = Field("emerald", description="emerald | amber | rose")
    notes: str = Field(..., description="Candid evaluation summary")
    strengths: List[str] = Field(default_factory=list)
    gaps: List[str] = Field(default_factory=list)


class ReadinessDimensions(BaseModel):
    """
    5-Dimensional Competency Model.
    """
    knowledge: DimensionScore
    practical: DimensionScore
    evidence: DimensionScore
    communication: DimensionScore
    roadmap_progress: DimensionScore


class ApplicationReadinessVerdict(BaseModel):
    """
    Candid 'Should I Apply Now?' decision matrix and ATS vs Readiness contrast.
    """
    verdict: str = Field(..., description="ready_to_apply | competitive | prepare_first | do_not_apply_yet")
    verdict_label: str = Field(..., description="READY TO APPLY | PREPARE BEFORE APPLYING | DO NOT APPLY YET")
    verdict_color: str = Field("emerald", description="emerald | brand | amber | rose")
    summary_explanation: str = Field(..., description="Executive career coach rationale")
    ats_match_score: float = Field(..., description="Resume keyword match score (0-100)")
    overall_readiness_score: float = Field(..., description="Real-world practical readiness score (0-100)")
    ats_vs_readiness_gap: float = Field(..., description="ATS score minus Readiness score")
    candid_comparison_summary: str = Field(..., description="Detailed contrast explaining keyword match vs verifiable proof")
    top_actions_before_applying: List[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------

class ReadinessTwinAnalyzeRequest(BaseModel):
    """
    Request to compute multi-dimensional AI Readiness Twin.
    """
    resume_id: str
    job_id: str
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None


# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------

class ReadinessTwinResponse(BaseModel):
    """
    Complete Readiness Twin analysis response.
    """
    id: str = Field(..., description="Unique Readiness Twin analysis identifier")
    user_id: str
    resume_id: str
    job_id: str
    job_title: str = "Target Role"
    company_name: Optional[str] = None
    resume_filename: Optional[str] = None
    overall_readiness_score: float = Field(..., description="Synthesized multi-dimensional readiness score (0-100)")
    verdict: ApplicationReadinessVerdict
    dimensions: ReadinessDimensions
    breakdown_list: List[DimensionScore] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class ReadinessTwinListItem(BaseModel):
    """
    Summary representation for history listing.
    """
    id: str
    resume_id: str
    job_id: str
    job_title: str
    company_name: Optional[str] = None
    overall_readiness_score: float
    ats_match_score: float
    verdict_label: str
    created_at: datetime


class ReadinessTwinListResponse(BaseModel):
    items: List[ReadinessTwinListItem]
    total: int


# ---------------------------------------------------------------------------
# Internal Database Document
# ---------------------------------------------------------------------------

class ReadinessTwinInDB(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    resume_id: str
    job_id: str
    job_title: str
    company_name: Optional[str] = None
    resume_filename: Optional[str] = None
    overall_readiness_score: float
    verdict: Dict[str, Any]
    dimensions: Dict[str, Any]
    breakdown_list: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

