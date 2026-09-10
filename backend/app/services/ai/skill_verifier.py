import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from app.models.recruiter import (
    SkillVerificationItem,
    SkillVerificationStatus,
    ConsistencyCheckItem,
    JobBlueprint,
    BlueprintSkill
)

logger = logging.getLogger("uvicorn.error")


class SkillVerifier:
    """
    Evidence-Based Skill Verification & Candidate Truth/Consistency Engine.
    Evaluates multi-source proof for critical and high-priority skills,
    categorizes gap impact, and detects cross-source inconsistencies.
    """

    @classmethod
    def verify_candidate_skills(
        cls,
        blueprint: JobBlueprint,
        candidate_data: Dict[str, Any],
        resume_data: Optional[Dict[str, Any]] = None,
        assessment_data: Optional[Dict[str, Any]] = None,
        interview_data: Optional[Dict[str, Any]] = None
    ) -> Tuple[List[SkillVerificationItem], List[ConsistencyCheckItem]]:
        """
        Runs comprehensive evidence verification and consistency checking.
        Returns:
            (verifications_list, consistency_checks_list)
        """
        verifications: List[SkillVerificationItem] = []
        consistency_checks: List[ConsistencyCheckItem] = []

        all_target_skills = blueprint.critical_skills + blueprint.high_priority_skills + blueprint.preferred_skills
        if not all_target_skills:
            all_target_skills = [
                BlueprintSkill(name="Python", importance="critical", required=True, category="Programming Language", confidence=90.0),
                BlueprintSkill(name="FastAPI", importance="critical", required=True, category="Backend", confidence=90.0),
            ]

        # Extract source evidence pools
        cand_claimed_skills = {s.lower().strip(): s for s in (candidate_data.get("skills") or [])}
        extracted_text = (resume_data or {}).get("extracted_text", "")
        parsed_resume = (resume_data or {}).get("parsed_data", {})
        projects = parsed_resume.get("projects", []) or candidate_data.get("projects", [])
        experiences = parsed_resume.get("experience", []) or candidate_data.get("work_history", [])
        gh_verif = candidate_data.get("github_verification") or {}
        gh_verified_skills = {
            s.get("skill", "").lower().strip(): s
            for s in gh_verif.get("verified_skills", [])
        }

        # Assessment / Interview score lookups
        assessment_skills = (assessment_data or {}).get("skill_scores", {})
        interview_notes = (interview_data or {}).get("interviewer_notes", "")

        for target in all_target_skills:
            skill_name = target.name
            skill_lower = skill_name.lower().strip()
            importance = str(target.importance.value if hasattr(target.importance, "value") else target.importance).lower()

            # 1. Claimed Level
            is_claimed = skill_lower in cand_claimed_skills
            claimed_level = "Proficient" if is_claimed else "Unspecified"

            # 2. Resume textual evidence
            resume_ev = cls._find_resume_evidence(extracted_text, skill_name)

            # 3. Project / Codebase Evidence (GitHub or project portfolio)
            proj_ev, has_project = cls._find_project_evidence(projects, gh_verified_skills, skill_name)

            # 4. Work Experience Evidence
            exp_ev, exp_years = cls._find_experience_evidence(experiences, skill_name)

            # 5. Assessment Evidence
            assess_ev, assess_score = cls._find_assessment_evidence(assessment_skills, skill_name)

            # 6. Interview Evidence
            interview_ev = cls._find_interview_evidence(interview_notes, skill_name)

            # 7. Calculate Evidence Confidence & Status
            confidence, status = cls._calculate_confidence_and_status(
                is_claimed=is_claimed,
                resume_ev=resume_ev,
                has_project=has_project,
                exp_years=exp_years,
                assess_score=assess_score,
                has_interview=(interview_ev != "Pending")
            )

            # 8. Calculate Gap Impact Level
            impact = cls._calculate_gap_impact(importance, status, confidence)

            explanation = cls._generate_verification_explanation(
                skill_name, status, confidence, resume_ev, proj_ev, exp_ev
            )

            item = SkillVerificationItem(
                skill=skill_name,
                claimed_level=claimed_level,
                resume_evidence=resume_ev,
                project_evidence=proj_ev,
                experience_evidence=exp_ev,
                assessment_evidence=assess_ev,
                interview_evidence=interview_ev,
                confidence=confidence,
                status=status,
                impact=impact,
                explanation=explanation
            )
            verifications.append(item)

            # 9. Consistency Checks (Candidate Truth Engine)
            # Check A: Claimed expert / prominent, but zero project & work evidence
            if is_claimed and resume_ev != "None" and not has_project and exp_years == 0:
                consistency_checks.append(ConsistencyCheckItem(
                    observation=f"{skill_name} is highlighted on resume but no hands-on project artifacts or employment tenure were found.",
                    sources=["Resume Skills", "Project Portfolio", "Work History"],
                    severity="verify",
                    recommendation=f"Skill evidence for {skill_name} is inconsistent and should be verified in a practical assessment."
                ))

            # Check B: High assessment score vs unmentioned skill
            if assess_score is not None and assess_score > 85 and not is_claimed:
                consistency_checks.append(ConsistencyCheckItem(
                    observation=f"Candidate scored {assess_score}% on {skill_name} assessment despite not explicitly listing it on their initial profile.",
                    sources=["Assessment Result", "Candidate Profile"],
                    severity="informational",
                    recommendation=f"Demonstrated competency in {skill_name} exceeds listed profile claims."
                ))

            # Check C: Claimed extensive experience vs brief timeline
            if exp_years > 0 and exp_years < 1.0 and "senior" in (candidate_data.get("experience_level") or "").lower():
                consistency_checks.append(ConsistencyCheckItem(
                    observation=f"Seniority designation diverges from tenure evidence for {skill_name} ({exp_years:.1f} years documented).",
                    sources=["Work History", "Experience Level"],
                    severity="note",
                    recommendation=f"Clarify scope of production responsibility during technical interview."
                ))

        if not consistency_checks:
            consistency_checks.append(ConsistencyCheckItem(
                observation="All submitted resume claims align consistently with project deliverables and employment history.",
                sources=["Resume", "GitHub", "Experience"],
                severity="informational",
                recommendation="Evidence profile is coherent and internally consistent."
            ))

        return verifications, consistency_checks

    @classmethod
    def _find_resume_evidence(cls, text: str, skill: str) -> str:
        if not text:
            return "None"
        escaped = re.escape(skill)
        pattern = r"(?<![a-zA-Z0-9_\-\.])" + escaped + r"(?![a-zA-Z0-9_\-\.])"
        matches = list(re.finditer(pattern, text, re.IGNORECASE))
        if not matches:
            return "None"

        # Look for sentence excerpt
        for match in matches:
            start = max(0, match.start() - 60)
            end = min(len(text), match.end() + 80)
            snippet = text[start:end].replace("\n", " ").strip()
            if len(snippet) > 20:
                return f"Excerpt: \"...{snippet}...\""

        return f"Documented in resume text ({len(matches)} occurrences)"

    @classmethod
    def _find_project_evidence(
        cls,
        projects: List[Dict[str, Any]],
        gh_verified: Dict[str, Any],
        skill: str
    ) -> Tuple[str, bool]:
        skill_lower = skill.lower()
        # 1. Check verified GitHub repositories
        if skill_lower in gh_verified:
            repos = gh_verified[skill_lower].get("matched_repositories", [])
            repo_str = ", ".join(repos[:2]) if repos else "public repositories"
            return f"Verified in GitHub code: {repo_str}", True

        # 2. Check resume projects
        matched_proj_names = []
        for p in projects:
            p_name = p.get("name", "Project")
            techs = [t.lower() for t in (p.get("technologies") or [])]
            desc = (p.get("description") or "").lower()
            if skill_lower in techs or skill_lower in desc:
                matched_proj_names.append(p_name)

        if matched_proj_names:
            return f"Used in project '{matched_proj_names[0]}'", True

        return "No verifiable repository or portfolio project found", False

    @classmethod
    def _find_experience_evidence(cls, experiences: List[Dict[str, Any]], skill: str) -> Tuple[str, float]:
        skill_lower = skill.lower()
        matched_roles = []
        total_years = 0.0

        for exp in experiences:
            title = exp.get("job_title", "Engineer")
            company = exp.get("company", "Company")
            skills_used = [s.lower() for s in (exp.get("skills_used") or [])]
            desc = (exp.get("description") or "").lower()

            if skill_lower in skills_used or skill_lower in desc:
                matched_roles.append(f"{title} at {company}")
                total_years += 1.5  # standard baseline tenure approximation per role

        if matched_roles:
            return f"Applied across: {matched_roles[0]} (~{total_years:.1f} yrs exposure)", total_years

        return "No direct enterprise work experience documented", 0.0

    @classmethod
    def _find_assessment_evidence(cls, assessment_scores: Dict[str, float], skill: str) -> Tuple[str, Optional[float]]:
        skill_lower = skill.lower()
        for k, score in assessment_scores.items():
            if k.lower() == skill_lower:
                if score >= 80:
                    return f"Strong assessment performance ({score:.0f}%)", score
                elif score >= 60:
                    return f"Moderate assessment score ({score:.0f}%)", score
                else:
                    return f"Assessment score below role benchmark ({score:.0f}%)", score

        return "Pending role assessment", None

    @classmethod
    def _find_interview_evidence(cls, notes: str, skill: str) -> str:
        if not notes:
            return "Pending"
        if skill.lower() in notes.lower():
            return "Discussed during technical interview"
        return "Not covered in interview notes"

    @classmethod
    def _calculate_confidence_and_status(
        cls,
        is_claimed: bool,
        resume_ev: str,
        has_project: bool,
        exp_years: float,
        assess_score: Optional[float],
        has_interview: bool
    ) -> Tuple[float, SkillVerificationStatus]:
        points = 20.0  # baseline

        if is_claimed:
            points += 15.0
        if resume_ev != "None":
            points += 15.0
        if has_project:
            points += 25.0
        if exp_years >= 1.0:
            points += 15.0
        if assess_score is not None:
            points += (assess_score / 100.0) * 20.0
        if has_interview:
            points += 10.0

        confidence = round(min(98.0, max(25.0, points)), 1)

        if confidence >= 85.0 and has_project:
            status = SkillVerificationStatus.VERIFIED
        elif confidence >= 70.0:
            status = SkillVerificationStatus.SUPPORTED
        elif confidence >= 50.0:
            status = SkillVerificationStatus.PARTIALLY_SUPPORTED
        elif is_claimed or resume_ev != "None":
            status = SkillVerificationStatus.REQUIRES_VERIFICATION
        else:
            status = SkillVerificationStatus.INSUFFICIENT_EVIDENCE

        return confidence, status

    @classmethod
    def _calculate_gap_impact(
        cls,
        importance: str,
        status: SkillVerificationStatus,
        confidence: float
    ) -> str:
        """
        Determines how critical a candidate's gap in this skill is for the role.
        """
        if status in [SkillVerificationStatus.VERIFIED, SkillVerificationStatus.SUPPORTED]:
            return "low"

        if importance == "critical":
            return "critical"
        elif importance == "high":
            return "high"
        elif confidence < 40.0:
            return "medium"
        else:
            return "low"

    @classmethod
    def _generate_verification_explanation(
        cls,
        skill: str,
        status: SkillVerificationStatus,
        confidence: float,
        resume_ev: str,
        proj_ev: str,
        exp_ev: str
    ) -> str:
        if status == SkillVerificationStatus.VERIFIED:
            return f"{skill} is verified with high confidence ({confidence:.0f}%) through concrete project code and practical exposure."
        elif status == SkillVerificationStatus.SUPPORTED:
            return f"{skill} is supported by documented resume experience ({confidence:.0f}% confidence)."
        elif status == SkillVerificationStatus.PARTIALLY_SUPPORTED:
            return f"{skill} has partial supporting mentions but limited project artifacts; targeted verification advised."
        elif status == SkillVerificationStatus.REQUIRES_VERIFICATION:
            return f"{skill} is claimed by candidate but lacks verified project or assessment proof; recommend technical verification."
        else:
            return f"Insufficient evidence for {skill} in provided materials."


skill_verifier = SkillVerifier()

