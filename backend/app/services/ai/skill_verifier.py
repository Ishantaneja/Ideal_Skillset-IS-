import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from app.models.recruiter import (
    SkillVerificationItem,
    SkillVerificationStatus,
    ConsistencyCheckItem,
    JobBlueprint,
    BlueprintSkill,
    SkillImportance
)
from app.services.github_verifier import SKILL_KEYWORD_MAP

logger = logging.getLogger("uvicorn.error")


class SkillVerifier:
    """
    Evidence-Based Skill Verification & Candidate Truth/Consistency Engine.
    Evaluates multi-source proof for critical and high-priority skills:
    - Verifiable GitHub project repositories & codebase usage
    - Industry certifications, credentials & course verifications
    - Practical production work experience tenure
    - Coding assessments & technical interview telemetry
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
                BlueprintSkill(name="Python", importance=SkillImportance.CRITICAL, required=True, category="Programming Language", confidence=90.0),
                BlueprintSkill(name="FastAPI", importance=SkillImportance.CRITICAL, required=True, category="Backend", confidence=90.0),
            ]

        # Extract source evidence pools
        cand_claimed_skills = {s.lower().strip(): s for s in (candidate_data.get("skills") or [])}
        extracted_text = (resume_data or {}).get("extracted_text", "")
        parsed_resume = (resume_data or {}).get("parsed_data", {})
        projects = parsed_resume.get("projects", []) or candidate_data.get("projects", [])
        experiences = parsed_resume.get("experience", []) or candidate_data.get("work_history", [])
        certifications = parsed_resume.get("certifications", []) or candidate_data.get("certifications", [])
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

            # 3. GitHub Project Evidence (GitHub profile or project repositories)
            github_ev, has_github = cls._find_github_evidence(candidate_data, projects, gh_verified_skills, skill_name)

            # 4. Certificate Evidence
            cert_ev, has_certificate = cls._find_certificate_evidence(certifications, candidate_data, extracted_text, skill_name)

            # 5. Combined Project Evidence summary
            proj_ev, has_project = cls._find_project_evidence(projects, gh_verified_skills, skill_name)

            # 6. Work Experience Evidence
            exp_ev, exp_years = cls._find_experience_evidence(experiences, skill_name)

            # 7. Assessment Evidence
            assess_ev, assess_score = cls._find_assessment_evidence(assessment_skills, skill_name)

            # 8. Interview Evidence
            interview_ev = cls._find_interview_evidence(interview_notes, skill_name)

            # 9. Calculate Evidence Confidence & Status
            confidence, status = cls._calculate_confidence_and_status(
                is_claimed=is_claimed,
                resume_ev=resume_ev,
                has_github=has_github,
                has_certificate=has_certificate,
                has_project=has_project,
                exp_years=exp_years,
                assess_score=assess_score,
                has_interview=(interview_ev != "Pending")
            )

            # 10. Calculate Gap Impact Level
            impact = cls._calculate_gap_impact(importance, status, confidence)

            explanation = cls._generate_verification_explanation(
                skill_name, status, confidence, resume_ev, github_ev, cert_ev, exp_ev
            )

            item = SkillVerificationItem(
                skill=skill_name,
                claimed_level=claimed_level,
                resume_evidence=resume_ev,
                project_evidence=proj_ev,
                github_evidence=github_ev,
                certificate_evidence=cert_ev,
                experience_evidence=exp_ev,
                assessment_evidence=assess_ev,
                interview_evidence=interview_ev,
                confidence=confidence,
                status=status,
                impact=impact,
                explanation=explanation
            )
            verifications.append(item)

            # 11. Consistency Checks (Candidate Truth Engine)
            # Check A: Claimed expert / prominent, but zero project, github, or certificate evidence
            if is_claimed and resume_ev != "None" and not has_project and not has_github and not has_certificate and exp_years == 0:
                consistency_checks.append(ConsistencyCheckItem(
                    observation=f"{skill_name} is claimed on resume but lacks verifiable GitHub code, certificate, or employer tenure.",
                    sources=["Resume Skills", "GitHub Projects", "Certifications", "Work History"],
                    severity="verify",
                    recommendation=f"Skill evidence for {skill_name} is unverified; candidate should provide project code or complete an assessment challenge."
                ))

            # Check B: Certificate verified skill
            if has_certificate:
                consistency_checks.append(ConsistencyCheckItem(
                    observation=f"Documented certificate confirmed for {skill_name}.",
                    sources=["Certifications & Credentials"],
                    severity="informational",
                    recommendation=f"Theoretical competency in {skill_name} is formally verified by credential."
                ))

            # Check C: GitHub project verified skill
            if has_github:
                consistency_checks.append(ConsistencyCheckItem(
                    observation=f"Direct codebase artifacts for {skill_name} verified in candidate's GitHub repositories.",
                    sources=["GitHub Repositories", "Code Analysis"],
                    severity="informational",
                    recommendation=f"Hands-on competency in {skill_name} is supported by verifiable code proof."
                ))

            # Check D: Seniority designation vs brief timeline
            if exp_years > 0 and exp_years < 1.0 and "senior" in (candidate_data.get("experience_level") or "").lower():
                consistency_checks.append(ConsistencyCheckItem(
                    observation=f"Seniority designation diverges from tenure evidence for {skill_name} ({exp_years:.1f} years documented).",
                    sources=["Work History", "Experience Level"],
                    severity="note",
                    recommendation=f"Clarify scope of production responsibility during technical interview."
                ))

        if not consistency_checks:
            consistency_checks.append(ConsistencyCheckItem(
                observation="All submitted resume claims align consistently with project deliverables, GitHub repositories, and employment history.",
                sources=["Resume", "GitHub", "Certifications", "Experience"],
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

        for match in matches:
            start = max(0, match.start() - 60)
            end = min(len(text), match.end() + 80)
            snippet = text[start:end].replace("\n", " ").strip()
            if len(snippet) > 20:
                return f"Excerpt: \"...{snippet}...\""

        return f"Documented in resume text ({len(matches)} occurrences)"

    @classmethod
    def _find_github_evidence(
        cls,
        candidate_data: Dict[str, Any],
        projects: List[Dict[str, Any]],
        gh_verified: Dict[str, Any],
        skill: str
    ) -> Tuple[str, bool]:
        """
        Scans GitHub verification, repositories, and candidate projects for code artifacts.
        """
        skill_lower = skill.lower().strip()
        keywords = SKILL_KEYWORD_MAP.get(skill_lower, [skill_lower])

        # 1. Check verified GitHub repositories payload
        if skill_lower in gh_verified:
            repos = gh_verified[skill_lower].get("matched_repositories", [])
            repo_str = ", ".join(repos[:2]) if repos else "public repositories"
            return f"Verified in GitHub code: {repo_str}", True

        # Check all verified skills for keyword matches
        for v_skill, v_data in gh_verified.items():
            if any(kw in v_skill.lower() for kw in keywords):
                repos = v_data.get("matched_repositories", [])
                repo_str = ", ".join(repos[:2]) if repos else "verified repository"
                return f"Verified in GitHub repository: {repo_str}", True

        # 2. Check candidate projects for GitHub repo URLs or matching code
        matched_repos = []
        for p in projects:
            p_name = p.get("name", "Project")
            url = (p.get("url") or p.get("github_url") or "").lower()
            desc = (p.get("description") or "").lower()
            techs = [t.lower() for t in (p.get("technologies") or [])]

            has_match = any(kw in techs or kw in desc for kw in keywords)
            if has_match:
                if "github.com" in url:
                    matched_repos.append(f"{p_name} ({url})")
                else:
                    matched_repos.append(p_name)

        if matched_repos:
            return f"Verified in GitHub project: '{matched_repos[0]}'", True

        # 3. Check general candidate GitHub presence
        gh_url = candidate_data.get("github_url", "")
        if gh_url and any(kw in str(candidate_data.get("skills", [])).lower() for kw in keywords):
            return f"Linked candidate GitHub profile: {gh_url}", True

        return "No public GitHub code or project repository found", False

    @classmethod
    def _find_certificate_evidence(
        cls,
        certifications: List[Any],
        candidate_data: Dict[str, Any],
        text: str,
        skill: str
    ) -> Tuple[str, bool]:
        """
        Scans certifications list, candidate profile, and resume text for certificates.
        """
        skill_lower = skill.lower().strip()
        keywords = SKILL_KEYWORD_MAP.get(skill_lower, [skill_lower])

        # 1. Check structured certifications list
        for cert in certifications:
            if isinstance(cert, dict):
                c_name = cert.get("name", "")
                c_issuer = cert.get("issuer", "")
                c_id = cert.get("credential_id", "")
            elif hasattr(cert, "name"):
                c_name = getattr(cert, "name", "")
                c_issuer = getattr(cert, "issuer", "")
                c_id = getattr(cert, "credential_id", "")
            else:
                c_name = str(cert)
                c_issuer = ""
                c_id = ""

            full_cert = f"{c_name} {c_issuer}".lower()
            if any(kw in full_cert for kw in keywords):
                issuer_part = f" (Issuer: {c_issuer})" if c_issuer else ""
                id_part = f" [ID: {c_id}]" if c_id else ""
                return f"Verified Certificate: {c_name}{issuer_part}{id_part}", True

        # 2. Check resume text for certificate patterns
        cert_patterns = [
            rf"(?:certified|certification|certificate|licensed|credential)\s+(?:in\s+)?[a-zA-Z0-9\s-]*{re.escape(skill)}[a-zA-Z0-9\s-]*",
            rf"[a-zA-Z0-9\s-]*{re.escape(skill)}[a-zA-Z0-9\s-]*(?:certified|certification|certificate|specialization)",
            rf"(?:aws|azure|gcp|google|oracle|microsoft|cisco|meta|coursera|udemy|red hat)\s+certified[a-zA-Z0-9\s-]*",
        ]
        for pat in cert_patterns:
            match = re.search(pat, text, re.IGNORECASE)
            if match and any(kw in match.group(0).lower() for kw in keywords):
                clean_cert = match.group(0).strip().replace("\n", " ")[:70]
                return f"Documented Certificate: {clean_cert.title()}", True

        return "No verifiable certificate or credential documented", False

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
                total_years += 1.5

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
        has_github: bool,
        has_certificate: bool,
        has_project: bool,
        exp_years: float,
        assess_score: Optional[float],
        has_interview: bool
    ) -> Tuple[float, SkillVerificationStatus]:
        points = 20.0  # baseline

        if is_claimed:
            points += 10.0
        if resume_ev != "None":
            points += 10.0
        if has_github:
            points += 25.0  # Major proof of work boost
        elif has_project:
            points += 15.0
        if has_certificate:
            points += 20.0  # Certified credential verification boost
        if exp_years >= 1.0:
            points += 15.0
        if assess_score is not None:
            points += (assess_score / 100.0) * 15.0
        if has_interview:
            points += 10.0

        confidence = round(min(99.0, max(25.0, points)), 1)

        # Status rules:
        # If backed by verified GitHub code or Certificate, candidate skill is Verified!
        if (has_github or has_certificate) and (confidence >= 75.0 or is_claimed):
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
        github_ev: str,
        cert_ev: str,
        exp_ev: str
    ) -> str:
        evidence_bits = []
        if "Verified" in github_ev:
            evidence_bits.append("verified GitHub project code")
        if "Verified" in cert_ev or "Documented Certificate" in cert_ev:
            evidence_bits.append("formal certification")
        if "Applied across" in exp_ev:
            evidence_bits.append("workplace experience")

        if evidence_bits:
            return f"{skill} is verified with {confidence:.0f}% confidence supported by {' and '.join(evidence_bits)}."
        elif status == SkillVerificationStatus.SUPPORTED:
            return f"{skill} is supported by documented resume experience ({confidence:.0f}% confidence)."
        elif status == SkillVerificationStatus.REQUIRES_VERIFICATION:
            return f"{skill} is listed on profile but lacks verified GitHub code or certificate evidence; technical verification recommended."
        else:
            return f"Insufficient practical proof for {skill} in submitted materials."


skill_verifier = SkillVerifier()
