import logging
from typing import List, Dict, Any, Optional
from app.models.recruiter import (
    CandidateEvaluation,
    ComparisonCandidateColumn,
    CandidateComparisonResponse
)

logger = logging.getLogger("uvicorn.error")


class CandidateRanker:
    """
    Explainable AI Candidate Ranking and Side-by-Side Comparison Engine.
    Provides transparent sorting, multi-attribute filtering, and comparison matrices.
    """

    @classmethod
    def rank_candidates(
        cls,
        evaluations: List[CandidateEvaluation],
        candidate_profiles: Dict[str, Dict[str, Any]],
        sort_by: str = "overall_fit",
        order: str = "desc"
    ) -> List[Dict[str, Any]]:
        """
        Ranks evaluations with clear 'Why?' explainability bullets.
        """
        ranked = []
        for ev in evaluations:
            cand = candidate_profiles.get(ev.candidate_id, {})
            name = cand.get("name", "Candidate")
            role = cand.get("target_role", "Engineer")
            gh_url = cand.get("github_url", "")

            # Build explainable "Why this rank?" justification
            why_bullets = []
            if ev.scores.overall_fit >= 85.0:
                why_bullets.append(f"Top tier overall fit ({ev.scores.overall_fit:.0f}%) with high role readiness")
            if ev.scores.technical_skills >= 80.0:
                why_bullets.append(f"Verified technical capability ({ev.scores.technical_skills:.0f}%)")
            if ev.scores.evidence_confidence >= 80.0:
                why_bullets.append(f"High evidence confidence ({ev.scores.evidence_confidence:.0f}%) from verified code & portfolio")
            if ev.missing_skills:
                why_bullets.append(f"Gap notes: requires onboarding in {', '.join(ev.missing_skills[:2])}")
            if ev.unverified_skills:
                why_bullets.append(f"Skills needing verification: {', '.join(ev.unverified_skills[:2])}")

            ranked.append({
                "candidate_id": ev.candidate_id,
                "name": name,
                "target_role": role,
                "email": cand.get("email", ""),
                "location": cand.get("location", "Remote"),
                "github_url": gh_url,
                "has_github_verified": bool(cand.get("github_verification") or gh_url),
                "overall_fit": ev.scores.overall_fit,
                "technical_skills": ev.scores.technical_skills,
                "relevant_experience": ev.scores.relevant_experience,
                "practical_evidence": ev.scores.practical_evidence,
                "evidence_confidence": ev.scores.evidence_confidence,
                "assessment_score": ev.scores.assessment_performance,
                "interview_score": ev.scores.interview_performance,
                "role_readiness": ev.scores.role_readiness,
                "recommended_action": ev.recommended_action.value if hasattr(ev.recommended_action, "value") else str(ev.recommended_action),
                "key_strengths": ev.strengths[:3],
                "key_concerns": ev.concerns[:3],
                "missing_skills": ev.missing_skills,
                "unverified_skills": ev.unverified_skills,
                "ramp_up": ev.estimated_ramp_up,
                "why_rank": why_bullets or ["Meets baseline qualification criteria."]
            })

        # Sorting
        reverse = (order.lower() == "desc")
        key_map = {
            "overall_fit": lambda x: x["overall_fit"],
            "technical_skills": lambda x: x["technical_skills"],
            "experience": lambda x: x["relevant_experience"],
            "evidence_confidence": lambda x: x["evidence_confidence"],
            "assessment_score": lambda x: x["assessment_score"],
            "interview_score": lambda x: x["interview_score"],
            "role_readiness": lambda x: x["role_readiness"],
        }
        sort_fn = key_map.get(sort_by, lambda x: x["overall_fit"])
        ranked.sort(key=sort_fn, reverse=reverse)

        return ranked

    @classmethod
    def compare_candidates(
        cls,
        evaluations: List[CandidateEvaluation],
        candidate_profiles: Dict[str, Dict[str, Any]],
        job_id: str,
        job_title: str
    ) -> CandidateComparisonResponse:
        """
        Builds side-by-side comparison matrix for 2 to 5 candidates.
        """
        columns: List[ComparisonCandidateColumn] = []
        for ev in evaluations:
            cand = candidate_profiles.get(ev.candidate_id, {})
            name = cand.get("name", "Candidate")
            target_role = cand.get("target_role", "Engineer")

            # Strong skills from verifications
            strong_skills = [
                v.skill for v in ev.verifications
                if v.status in ["verified", "supported"]
            ][:4]

            columns.append(ComparisonCandidateColumn(
                candidate_id=ev.candidate_id,
                name=name,
                target_role=target_role,
                overall_fit=ev.scores.overall_fit,
                technical_skills=ev.scores.technical_skills,
                experience=ev.scores.relevant_experience,
                evidence_confidence=ev.scores.evidence_confidence,
                assessment=ev.scores.assessment_performance,
                interview=ev.scores.interview_performance,
                role_readiness=ev.scores.role_readiness,
                recommended_action=ev.recommended_action.value if hasattr(ev.recommended_action, "value") else str(ev.recommended_action),
                strong_skills=strong_skills,
                missing_skills=ev.missing_skills[:3],
                ramp_up=ev.estimated_ramp_up
            ))

        # Find strongest candidate
        strongest = max(columns, key=lambda c: c.overall_fit, default=None)
        strongest_id = strongest.candidate_id if strongest else None

        if strongest and len(columns) > 1:
            second_strongest = sorted(columns, key=lambda c: c.overall_fit, reverse=True)[1]
            diff = strongest.overall_fit - second_strongest.overall_fit
            comparative_summary = (
                f"{strongest.name} emerges as the strongest candidate ({strongest.overall_fit:.0f}% Overall Fit) "
                f"due to superior evidence confidence ({strongest.evidence_confidence:.0f}%) and solid practical competency. "
                f"Compared to {second_strongest.name} ({second_strongest.overall_fit:.0f}%), {strongest.name} "
                f"exhibits fewer unverified core competencies and requires shorter onboarding ramp-up ({strongest.ramp_up})."
            )
        elif strongest:
            comparative_summary = f"{strongest.name} demonstrates a strong match ({strongest.overall_fit:.0f}%) for the {job_title} role."
        else:
            comparative_summary = "No candidates available for comparison."

        return CandidateComparisonResponse(
            job_id=job_id,
            job_title=job_title,
            candidates=columns,
            comparative_summary=comparative_summary,
            strongest_candidate_id=strongest_id
        )


candidate_ranker = CandidateRanker()

