from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone


class AssessmentBase(BaseModel):
    title: str
    difficulty: str  # "Beginner", "Intermediate", "Advanced"
    time_limit_minutes: int
    topics: List[str] = []
    instructions: str


class AssessmentInDB(AssessmentBase):
    id: Optional[str] = Field(default=None, alias="_id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

