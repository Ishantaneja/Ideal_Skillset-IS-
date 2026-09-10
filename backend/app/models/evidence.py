from pydantic import BaseModel, Field, ConfigDict, HttpUrl
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone


class GitHubRepoItem(BaseModel):
    """
    Representation of an analyzed GitHub repository.
    """
    name: str = Field(..., description="Repository name")
    description: Optional[str] = Field(default="", description="Repository description")
    html_url: str = Field(..., description="Public GitHub repository URL")
    stars: int = Field(default=0, description="Star count")
    forks: int = Field(default=0, description="Fork count")
    primary_language: Optional[str] = Field(default=None, description="Primary detected language")
    languages: Dict[str, int] = Field(default_factory=dict, description="Language byte breakdown")
    topics: List[str] = Field(default_factory=list, description="Repository tags/topics")
    detected_skills: List[str] = Field(default_factory=list, description="Extracted skills and technologies")
    updated_at: Optional[str] = None


class SkillProjectVerification(BaseModel):
    """
    Verification status of a specific candidate skill against GitHub projects.
    """
    skill: str = Field(..., description="Skill name (e.g. Python, SQL, Docker, React)")
    is_used_in_projects: bool = Field(..., description="True if proven in GitHub repositories, False otherwise")
    status: str = Field(..., description="'verified' or 'unverified'")
    confidence: float = Field(default=0.0, description="Confidence score (0-100)")
    matched_repositories: List[str] = Field(default_factory=list, description="List of repository names containing this skill")
    evidence_details: str = Field(default="", description="Summary of code evidence found")
    recommendation: Optional[str] = Field(default=None, description="Actionable suggestion if unverified")


class GitHubVerificationRequest(BaseModel):
    """
    Request schema to trigger GitHub repository and skill analysis.
    """
    github_url: str = Field(..., description="Candidate GitHub profile URL or username")
    skills_to_verify: Optional[List[str]] = Field(default=None, description="Optional custom list of skills to test")


class GitHubVerificationResponse(BaseModel):
    """
    Comprehensive result of GitHub project and skill verification.
    """
    username: str
    github_url: str
    avatar_url: Optional[str] = None
    public_repos_count: int = 0
    total_stars: int = 0
    proof_score: float = Field(..., description="Verifiable code evidence score (0-100)")
    verification_verdict: str = Field("Strong Proof of Work", description="Evaluation verdict label")
    verified_skills_count: int = 0
    unverified_skills_count: int = 0
    verified_skills: List[SkillProjectVerification] = Field(default_factory=list)
    unverified_skills: List[SkillProjectVerification] = Field(default_factory=list)
    repositories: List[GitHubRepoItem] = Field(default_factory=list)
    summary: str = Field(default="")
    verified_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

