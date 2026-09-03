from pydantic import BaseModel, Field
from typing import List, Optional


class SkillBase(BaseModel):
    name: str
    category: str  # e.g., "Programming Language", "Framework", "Database", "Soft Skill"
    aliases: List[str] = []


class SkillInDB(SkillBase):
    id: Optional[str] = Field(default=None, alias="_id")

