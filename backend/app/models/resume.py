from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone


class SkillItem(BaseModel):
    name: str
    category: str = "General"


class EducationItem(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    field_of_study: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    gpa: Optional[str] = None


class ExperienceItem(BaseModel):
    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    skills_used: List[str] = Field(default_factory=list)


class ProjectItem(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    technologies: List[str] = Field(default_factory=list)
    url: Optional[str] = None


class CertificationItem(BaseModel):
    name: Optional[str] = None
    issuer: Optional[str] = None
    date: Optional[str] = None
    credential_id: Optional[str] = None
    url: Optional[str] = None


class ParsedResumeData(BaseModel):
    skills: List[SkillItem] = Field(default_factory=list)
    education: List[EducationItem] = Field(default_factory=list)
    experience: List[ExperienceItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    certifications: List[CertificationItem] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# API Responses
# ---------------------------------------------------------------------------

class ResumeResponse(BaseModel):
    id: str = Field(..., description="Resume unique identifier")
    user_id: str
    original_filename: str
    file_type: str
    file_size: int
    is_active: bool = True
    uploaded_at: datetime
    updated_at: datetime
    extracted_text: Optional[str] = None
    parsed_data: ParsedResumeData = Field(default_factory=ParsedResumeData)
    parsing_status: str = "completed"
    parsing_error: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class ResumeListItem(BaseModel):
    id: str
    original_filename: str
    file_type: str
    file_size: int
    is_active: bool
    uploaded_at: datetime
    parsing_status: str
    skills_count: int = 0


class ResumeListResponse(BaseModel):
    items: List[ResumeListItem]
    total: int


# ---------------------------------------------------------------------------
# Internal Database Document
# ---------------------------------------------------------------------------

class ResumeInDB(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    original_filename: str
    file_type: str
    file_size: int
    storage_path: str
    is_active: bool = True
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    extracted_text: str = ""
    parsed_data: ParsedResumeData = Field(default_factory=ParsedResumeData)
    parsing_status: str = "completed"
    parsing_error: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


# Aliases for backward compatibility
ResumeBase = ResumeResponse
