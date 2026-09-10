import re
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from app.models.recruiter import JobBlueprint, BlueprintSkill, SkillImportance
from app.services.resume_parser import SKILL_TAXONOMY

logger = logging.getLogger("uvicorn.error")


class JobAnalyzer:
    """
    AI Job Blueprint Generator.
    Analyzes job descriptions and requirements to generate a structured,
    reviewable and editable Job Blueprint.
    """

    @classmethod
    def generate_blueprint(
        cls,
        title: str,
        description: str,
        responsibilities: Optional[List[str]] = None,
        required_skills: Optional[List[str]] = None,
        preferred_skills: Optional[List[str]] = None,
        required_experience: Optional[str] = "2-4 years"
    ) -> JobBlueprint:
        """
        Synthesizes job title, description text, and recruiter-specified lists
        into a structured Job Blueprint.
        """
        full_text = f"{title}\n{description}\n" + "\n".join(responsibilities or [])
        detected_skills = cls._extract_skills_from_text(full_text)

        # Merge explicit required skills from recruiter
        req_set = {s.strip().lower(): s.strip() for s in (required_skills or []) if s.strip()}
        pref_set = {s.strip().lower(): s.strip() for s in (preferred_skills or []) if s.strip()}

        critical: List[BlueprintSkill] = []
        high_priority: List[BlueprintSkill] = []
        preferred: List[BlueprintSkill] = []

        seen_skills = set()

        # 1. Process explicit recruiter skills first
        for s_lower, s_orig in req_set.items():
            category = cls._get_category_for_skill(s_orig)
            # First 3-4 explicit skills are designated Critical
            if len(critical) < 4:
                critical.append(BlueprintSkill(
                    name=s_orig,
                    category=category,
                    importance=SkillImportance.CRITICAL,
                    required=True,
                    confidence=95.0,
                    explanation=f"Core technical capability required for {title}"
                ))
            else:
                high_priority.append(BlueprintSkill(
                    name=s_orig,
                    category=category,
                    importance=SkillImportance.HIGH,
                    required=True,
                    confidence=90.0,
                    explanation=f"Key requirement for daily engineering responsibilities"
                ))
            seen_skills.add(s_lower)

        for s_lower, s_orig in pref_set.items():
            if s_lower not in seen_skills:
                category = cls._get_category_for_skill(s_orig)
                preferred.append(BlueprintSkill(
                    name=s_orig,
                    category=category,
                    importance=SkillImportance.PREFERRED,
                    required=False,
                    confidence=85.0,
                    explanation=f"Preferred asset providing immediate competitive advantage"
                ))
                seen_skills.add(s_lower)

        # 2. Add detected skills from JD analysis if not already present
        for detected in detected_skills:
            d_name = detected["name"]
            d_lower = d_name.lower()
            if d_lower in seen_skills:
                continue

            category = detected["category"]
            mentions = detected["mentions"]

            if mentions >= 2 and len(critical) < 3:
                critical.append(BlueprintSkill(
                    name=d_name,
                    category=category,
                    importance=SkillImportance.CRITICAL,
                    required=True,
                    confidence=92.0,
                    explanation=f"High recurrence in description ({mentions} mentions)"
                ))
            elif len(high_priority) < 5:
                high_priority.append(BlueprintSkill(
                    name=d_name,
                    category=category,
                    importance=SkillImportance.HIGH,
                    required=True,
                    confidence=88.0,
                    explanation=f"Required for core system deliverables"
                ))
            elif len(preferred) < 6:
                preferred.append(BlueprintSkill(
                    name=d_name,
                    category=category,
                    importance=SkillImportance.PREFERRED,
                    required=False,
                    confidence=82.0,
                    explanation=f"Complementary skill for modern development workflows"
                ))
            seen_skills.add(d_lower)

        # Fallback defaults if very brief description
        if not critical:
            critical.append(BlueprintSkill(
                name="Core Engineering Fundamentals",
                category="General",
                importance=SkillImportance.CRITICAL,
                required=True,
                confidence=90.0,
                explanation="Foundational programming and architecture ability"
            ))

        # 3. Extract Experience & Behavioral Requirements
        exp_reqs = cls._extract_experience_requirements(full_text, required_experience)
        behavioral_reqs = cls._extract_behavioral_competencies(full_text)

        summary = f"Role Blueprint for {title}: focuses on {len(critical)} critical technical competencies with verifiable proof expectations."

        return JobBlueprint(
            role_title=title,
            critical_skills=critical,
            high_priority_skills=high_priority,
            preferred_skills=preferred,
            experience_requirements=exp_reqs,
            behavioral_competencies=behavioral_reqs,
            summary=summary,
            updated_at=datetime.now(timezone.utc)
        )

    @classmethod
    def _extract_skills_from_text(cls, text: str) -> List[Dict[str, Any]]:
        """
        Extracts skills from text using the strict SKILL_TAXONOMY regex.
        """
        results = []
        for canonical_name, data in SKILL_TAXONOMY.items():
            aliases = data.get("aliases", [canonical_name.lower()])
            total_matches = 0
            for alias in aliases:
                escaped = re.escape(alias)
                pattern = r"(?<![a-zA-Z0-9_\-\.])" + escaped + r"(?![a-zA-Z0-9_\-\.])"
                matches = len(re.findall(pattern, text, re.IGNORECASE))
                total_matches += matches

            if total_matches > 0:
                results.append({
                    "name": canonical_name,
                    "category": data.get("category", "Technical"),
                    "mentions": total_matches
                })

        # Sort by mentions descending
        results.sort(key=lambda x: x["mentions"], reverse=True)
        return results

    @classmethod
    def _get_category_for_skill(cls, skill_name: str) -> str:
        for canonical_name, data in SKILL_TAXONOMY.items():
            if canonical_name.lower() == skill_name.lower():
                return data.get("category", "Technical")
            if any(a.lower() == skill_name.lower() for a in data.get("aliases", [])):
                return data.get("category", "Technical")
        return "Technical"

    @classmethod
    def _extract_experience_requirements(cls, text: str, default_exp: Optional[str]) -> List[str]:
        items = []
        if default_exp:
            items.append(f"{default_exp} of practical production or project experience")

        # Check for year patterns like '3+ years', '5 years of'
        matches = re.findall(r"(\d+\+?\s*(?:-\s*\d+)?\s*years?(?:\s+of\s+[a-zA-Z0-9\s]+)?)", text, re.IGNORECASE)
        for m in matches[:2]:
            clean = m.strip()
            if len(clean) < 60 and clean not in items:
                items.append(clean)

        if not items:
            items = ["2+ years in relevant software or domain environments"]
        return items

    @classmethod
    def _extract_behavioral_competencies(cls, text: str) -> List[str]:
        competencies = []
        keywords = {
            "Problem Solving": ["problem solving", "analytical", "troubleshoot", "debug"],
            "Ownership & Initiative": ["ownership", "autonomous", "self-starter", "initiative", "lead"],
            "Cross-Functional Communication": ["communication", "collaborat", "team player", "stakeholder"],
            "System Architecture & Quality": ["clean code", "best practices", "testing", "scalab", "architecture"],
            "Agile Execution": ["agile", "scrum", "sprint", "fast-paced"]
        }
        for comp_name, kws in keywords.items():
            if any(re.search(re.escape(kw), text, re.IGNORECASE) for kw in kws):
                competencies.append(comp_name)

        if not competencies:
            competencies = ["Problem Solving", "Ownership & Initiative", "Cross-Functional Communication"]
        return competencies


job_analyzer = JobAnalyzer()

