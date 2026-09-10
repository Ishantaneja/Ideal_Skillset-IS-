from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone


class JobInfo(BaseModel):
    """
    Metadata about the job position.
    """
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    location: Optional[str] = None
    work_mode: Optional[str] = None  # Remote, Hybrid, On-site
    employment_type: Optional[str] = None  # Full-time, Part-time, Contract, Internship


class SkillRequirement(BaseModel):
    """
    Identified technical or soft skill with categorization and normalization.
    """
    name: str
    normalized_name: str
    category: str = "General"
    importance: str = "required"  # "required" or "preferred"


class ExperienceRequirement(BaseModel):
    """
    Years of experience requirement.
    """
    minimum_years: Optional[float] = None
    maximum_years: Optional[float] = None
    description: Optional[str] = None


class EducationRequirement(BaseModel):
    """
    Academic degree and field of study requirement.
    """
    degree: Optional[str] = None
    fields: List[str] = Field(default_factory=list)
    required: bool = True


class JobRequirements(BaseModel):
    """
    Structured breakdown of requirements extracted from the JD.
    """
    required_skills: List[SkillRequirement] = Field(default_factory=list)
    preferred_skills: List[SkillRequirement] = Field(default_factory=list)
    experience: ExperienceRequirement = Field(default_factory=ExperienceRequirement)
    education: List[EducationRequirement] = Field(default_factory=list)
    responsibilities: List[str] = Field(default_factory=list)
    qualifications: List[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------

class JobAnalyzeRequest(BaseModel):
    """
    Request schema for analyzing raw pasted job description text.
    """
    text: str = Field(..., min_length=10, description="Raw job description text")

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 10:
            raise ValueError("Job description text is too short to analyze.")
        return cleaned


# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------

class JobResponse(BaseModel):
    """
    Complete structured representation of an analyzed job description.
    """
    id: str = Field(..., description="Unique job identifier")
    user_id: str
    source_type: str = "text"  # "text" or "file"
    original_filename: Optional[str] = None
    raw_text: str
    job_info: JobInfo = Field(default_factory=JobInfo)
    requirements: JobRequirements = Field(default_factory=JobRequirements)
    analysis_status: str = "completed"
    analysis_error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class JobListItem(BaseModel):
    """
    Summary representation for job history listing.
    """
    id: str
    job_title: Optional[str] = "Untitled Position"
    company_name: Optional[str] = None
    location: Optional[str] = None
    work_mode: Optional[str] = None
    required_skills_count: int = 0
    source_type: str = "text"
    created_at: datetime


class JobListResponse(BaseModel):
    items: List[JobListItem]
    total: int


# ---------------------------------------------------------------------------
# Internal Database Document
# ---------------------------------------------------------------------------

class JobInDB(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    source_type: str = "text"
    original_filename: Optional[str] = None
    raw_text: str
    job_info: JobInfo = Field(default_factory=JobInfo)
    requirements: JobRequirements = Field(default_factory=JobRequirements)
    analysis_status: str = "completed"
    analysis_error: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


# Backward compatibility aliases
JobBase = JobResponse
