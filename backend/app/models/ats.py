from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone


# ---------------------------------------------------------------------------
# Component Match Models
# ---------------------------------------------------------------------------

class MatchedSkillItem(BaseModel):
    """
    Skill identified in both Job Description and Candidate Resume with verified evidence.
    """
    skill: str
    confidence: float = 0.95
    evidence: Optional[str] = None
    category: str = "General"


class MissingSkillItem(BaseModel):
    """
    Skill required/preferred by the job but missing from the candidate's resume.
    """
    skill: str
    importance: str = "required"  # "required" or "preferred"
    impact: str = "high"  # "high", "medium", "low"
    reason: str = "Required skill and currently missing from resume"
    potential_score_gain: float = 0.0


class SkillsMatchResult(BaseModel):
    """
    Aggregated skills comparison breakdown.
    """
    matched_required: List[MatchedSkillItem] = Field(default_factory=list)
    missing_required: List[MissingSkillItem] = Field(default_factory=list)
    matched_preferred: List[MatchedSkillItem] = Field(default_factory=list)
    missing_preferred: List[MissingSkillItem] = Field(default_factory=list)
    required_score: float = 0.0
    preferred_score: float = 0.0


class ExperienceMatchResult(BaseModel):
    """
    Seniority and years of industry practice alignment.
    """
    required_years: Optional[float] = None
    candidate_years: float = 0.0
    score: float = 0.0
    match: bool = True
    explanation: str = "Experience meets requirements."


class EducationMatchResult(BaseModel):
    """
    Academic degree and field of study alignment.
    """
    score: float = 100.0
    match: bool = True
    explanation: str = "Education aligns with target role."
    candidate_degrees: List[str] = Field(default_factory=list)
    required_degrees: List[str] = Field(default_factory=list)


class ResponsibilityMatchItem(BaseModel):
    """
    Job duty compared against candidate experience and project description.
    """
    job_responsibility: str
    resume_evidence: Optional[str] = None
    match_status: str = "strong_match"  # "strong_match", "partial_match", "missing"
    confidence: float = 0.85


class ResponsibilityMatchResult(BaseModel):
    """
    Aggregated responsibility coverage.
    """
    score: float = 0.0
    matched_count: int = 0
    total_count: int = 0
    items: List[ResponsibilityMatchItem] = Field(default_factory=list)


class KeywordMatchResult(BaseModel):
    """
    Domain and technical keyword overlap.
    """
    score: float = 0.0
    matched: List[str] = Field(default_factory=list)
    missing: List[str] = Field(default_factory=list)


class ATSScoreBreakdown(BaseModel):
    """
    Weighted breakdown across all 6 core ATS evaluation dimensions.
    """
    required_skills: float = 0.0
    preferred_skills: float = 0.0
    experience: float = 0.0
    education: float = 0.0
    responsibilities: float = 0.0
    keywords: float = 0.0


class ATSImprovementItem(BaseModel):
    """
    Truthful, actionable recommendation for candidate advancement.
    """
    title: str
    action: str
    impact_score: float = 0.0
    category: str = "Skill"
    type: str = "existing_evidence"  # "existing_evidence", "build_skill", "clarify_format"


class WhatIfItem(BaseModel):
    """
    Simulated score projection when demonstrating specific missing skills.
    """
    added_skills: List[str] = Field(default_factory=list)
    simulated_score: float = 0.0
    score_gain: float = 0.0


# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------

class ATSAnalyzeRequest(BaseModel):
    """
    Request payload to match a user's resume against an analyzed job description.
    """
    resume_id: str = Field(..., description="ID of the user's parsed resume document")
    job_id: str = Field(..., description="ID of the user's analyzed job description document")


class ATSSimulateRequest(BaseModel):
    """
    Request payload to run 'What If?' hypothetical score calculation.
    """
    resume_id: str
    job_id: str
    added_skills: List[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------

class ATSResultResponse(BaseModel):
    """
    Complete explainable ATS compatibility report.
    """
    id: str = Field(..., description="Unique ATS analysis identifier")
    user_id: str
    resume_id: str
    job_id: str
    resume_filename: Optional[str] = None
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    score: float = Field(..., description="Overall weighted ATS score (0-100)")
    label: str = Field(..., description="Match category label")
    breakdown: ATSScoreBreakdown
    skills: SkillsMatchResult
    experience: ExperienceMatchResult
    education: EducationMatchResult
    responsibilities: ResponsibilityMatchResult
    keywords: KeywordMatchResult
    top_improvements: List[ATSImprovementItem] = Field(default_factory=list)
    resume_improvements: List[ATSImprovementItem] = Field(default_factory=list)
    what_if: List[WhatIfItem] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        from_attributes = True


class ATSResultListItem(BaseModel):
    """
    Summary representation for history listing.
    """
    id: str
    resume_id: str
    job_id: str
    job_title: Optional[str] = "Target Role"
    company_name: Optional[str] = None
    resume_filename: Optional[str] = None
    score: float
    label: str
    created_at: datetime


class ATSResultListResponse(BaseModel):
    items: List[ATSResultListItem]
    total: int


# ---------------------------------------------------------------------------
# Internal Database Document
# ---------------------------------------------------------------------------

class ATSResultInDB(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    resume_id: str
    job_id: str
    resume_filename: Optional[str] = None
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    score: float
    label: str
    breakdown: Dict[str, float]
    skills: Dict[str, Any]
    experience: Dict[str, Any]
    education: Dict[str, Any]
    responsibilities: Dict[str, Any]
    keywords: Dict[str, Any]
    top_improvements: List[Dict[str, Any]] = Field(default_factory=list)
    resume_improvements: List[Dict[str, Any]] = Field(default_factory=list)
    what_if: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        from_attributes = True

