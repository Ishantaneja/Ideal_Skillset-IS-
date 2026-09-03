from pydantic import BaseModel, EmailStr, Field, field_validator, HttpUrl
from enum import Enum
from typing import Optional, List, Any
from datetime import datetime, timezone


class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"


# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------

class SignupRequest(BaseModel):
    """
    Schema for candidate user registration.
    Strictly creates accounts with role='user'.
    """
    name: str = Field(..., min_length=2, max_length=100, description="Full candidate name")
    email: EmailStr = Field(..., description="Unique email address")
    password: str = Field(..., min_length=6, max_length=128, description="Plain text password (min 6 characters)")
    target_role: Optional[str] = Field(default="Junior Data Analyst", description="Target career role")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 2:
            raise ValueError("Name must be at least 2 characters long")
        return cleaned

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return str(v).lower().strip()


class LoginRequest(BaseModel):
    """
    Schema for user or admin authentication.
    """
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., min_length=1, description="Account password")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return str(v).lower().strip()


class AdminCreate(BaseModel):
    """
    Schema for admin bootstrapping script.
    """
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return str(v).lower().strip()


class UserProfileUpdate(BaseModel):
    """
    Schema for updating candidate user profile details.
    """
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=25)
    location: Optional[str] = Field(default=None, max_length=100)
    country: Optional[str] = Field(default=None, max_length=100)
    bio: Optional[str] = Field(default=None, max_length=1000)

    # Education
    education: Optional[str] = Field(default=None, max_length=150)
    degree: Optional[str] = Field(default=None, max_length=150)
    university: Optional[str] = Field(default=None, max_length=150)
    graduation_year: Optional[int] = Field(default=None, ge=1970, le=2040)

    # Experience & Career Goals
    experience_level: Optional[str] = Field(default=None, max_length=50) # Entry, Junior, Mid, Senior
    years_of_experience: Optional[float] = Field(default=None, ge=0, le=60)
    current_job_title: Optional[str] = Field(default=None, max_length=100)
    target_role: Optional[str] = Field(default=None, max_length=100)
    career_interests: Optional[List[str]] = Field(default=None)

    # Skills & Links
    skills: Optional[List[str]] = Field(default=None)
    github_url: Optional[str] = Field(default=None, max_length=255)
    linkedin_url: Optional[str] = Field(default=None, max_length=255)
    portfolio_url: Optional[str] = Field(default=None, max_length=255)


# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------

class UserResponse(BaseModel):
    """
    Public user representation.
    Never exposes password_hash.
    """
    id: str = Field(..., description="User unique identifier")
    name: str
    email: str
    role: str = "user"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        from_attributes = True


class UserProfileResponse(BaseModel):
    """
    Comprehensive public profile representation for candidate users.
    """
    id: str = Field(..., description="User unique identifier")
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
    career_interests: List[str] = []

    # Skills & Links
    skills: List[str] = []
    github_url: Optional[str] = ""
    linkedin_url: Optional[str] = ""
    portfolio_url: Optional[str] = ""

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        from_attributes = True


class TokenResponse(BaseModel):
    """
    Response schema returning JWT token and authenticated user details.
    """
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ---------------------------------------------------------------------------
# Database Internal Model
# ---------------------------------------------------------------------------

class UserInDB(BaseModel):
    """
    Internal database schema representing documents in User_data collection.
    """
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    email: str
    password_hash: Optional[str] = None
    role: str = "user"
    phone: Optional[str] = None
    location: Optional[str] = None
    country: Optional[str] = None
    bio: Optional[str] = None

    education: Optional[str] = None
    degree: Optional[str] = None
    university: Optional[str] = None
    graduation_year: Optional[int] = None

    experience_level: Optional[str] = None
    years_of_experience: Optional[float] = None
    current_job_title: Optional[str] = None
    target_role: Optional[str] = "Junior Data Analyst"
    career_interests: List[str] = []

    skills: List[str] = []
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None

    created_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        from_attributes = True


# Aliases for backward compatibility
UserCreate = SignupRequest
UserLogin = LoginRequest
UserBase = SignupRequest
