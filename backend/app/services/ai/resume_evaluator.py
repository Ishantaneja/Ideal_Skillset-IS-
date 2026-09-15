import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from app.models.recruiter import (
    CandidateEvaluation,
    CandidateEvaluationScores,
    CandidateSuccessMilestone,
    CandidateUpskillFit,
    NextActionRecommendation,
    JobBlueprint,
    SkillVerificationStatus,
)
from app.services.ai.skill_verifier import skill_verifier

logger = logging.getLogger("uvicorn.error")


class ResumeEvaluator:
    """
    Multi-Dimensional Candidate & Resume Screening Engine.
    Evaluates candidate preparedness against the Job Blueprint across 9 dimensions,
    generating explainable 'Why Interview?' and 'Why Not?' summaries.
    """

    @classmethod
    def evaluate_candidate(
        cls,
        blueprint: JobBlueprint,
        candidate_data: Dict[str, Any],
        resume_data: Optional[Dict[str, Any]] = None,
        assessment_data: Optional[Dict[str, Any]] = None,
        interview_data: Optional[Dict[str, Any]] = None,
        readiness_report: Optional[Dict[str, Any]] = None,
        job_id: str = "job_default",
        weights: Optional[Dict[str, float]] = None
    ) -> CandidateEvaluation:
        """
        Calculates multi-dimensional fit, evidence confidence, strengths, concerns,
        recommendations, and evidence matrix for a candidate/job pair.
        """
        cand_id = str(candidate_data.get("_id") or candidate_data.get("id", "cand_01"))

        # 1. Run evidence verification & consistency checks
        verifications, consistency_checks = skill_verifier.verify_candidate_skills(
            blueprint=blueprint,
            candidate_data=candidate_data,
            resume_data=resume_data,
            assessment_data=assessment_data,
            interview_data=interview_data
        )

        # 2. Technical Skills Fit
        # Weight critical skills 2x, high 1.5x, preferred 1.0x
        total_weight = 0.0
        earned_weight = 0.0
        missing_skills = []
        unverified_skills = []
        strengths = []
        concerns = []

        for v in verifications:
            weight = 2.0 if v.impact == "critical" else (1.5 if v.impact == "high" else 1.0)
            total_weight += weight

            if v.status == SkillVerificationStatus.VERIFIED:
                earned_weight += weight * 1.0
                strengths.append(f"Strong verified evidence in {v.skill}")
            elif v.status == SkillVerificationStatus.SUPPORTED:
                earned_weight += weight * 0.85
                strengths.append(f"Supported practical experience in {v.skill}")
            elif v.status == SkillVerificationStatus.PARTIALLY_SUPPORTED:
                earned_weight += weight * 0.60
                unverified_skills.append(v.skill)
            elif v.status == SkillVerificationStatus.REQUIRES_VERIFICATION:
                earned_weight += weight * 0.40
                unverified_skills.append(v.skill)
                concerns.append(f"{v.skill} is claimed but requires technical verification")
            else:
                missing_skills.append(v.skill)
                concerns.append(f"Missing documented proficiency in {v.skill}")

        tech_score = round(min(100.0, max(20.0, (earned_weight / max(total_weight, 1.0)) * 100.0)), 1)

        # 3. Relevant Experience Fit
        years_exp = float(candidate_data.get("years_of_experience") or 2.0)
        parsed_resume = (resume_data or {}).get("parsed_data", {})
        work_hist = parsed_resume.get("experience", []) or candidate_data.get("work_history", [])

        exp_score = min(100.0, max(30.0, 50.0 + len(work_hist) * 15.0 + years_exp * 5.0))

        # 4. Practical Evidence Fit
        projects = parsed_resume.get("projects", []) or candidate_data.get("projects", [])
        gh_verif = candidate_data.get("github_verification") or {}
        proof_score = float(gh_verif.get("proof_score", 0.0))
        if proof_score > 0:
            evidence_fit = proof_score
        elif candidate_data.get("github_url"):
            evidence_fit = 85.0
        elif any(v.github_evidence != "None" for v in verifications):
            evidence_fit = 85.0
        elif any(v.certificate_evidence != "None" for v in verifications):
            evidence_fit = 82.0
        elif len(projects) >= 1:
            evidence_fit = 78.0
        else:
            evidence_fit = 62.0

        # 5. Assessment Performance
        assess_score = None
        if assessment_data and "overall_score" in assessment_data:
            assess_score = float(assessment_data["overall_score"])
        elif candidate_data.get("assessment_score"):
            assess_score = float(candidate_data["assessment_score"])
        else:
            # Baseline estimation from existing candidate assessments if present
            assess_score = round(0.5 * tech_score + 0.5 * evidence_fit, 1)

        # 6. Interview Performance
        interview_score = None
        if interview_data and "overall_score" in interview_data:
            interview_score = float(interview_data["overall_score"])
        elif candidate_data.get("interview_score"):
            interview_score = float(candidate_data["interview_score"])
        else:
            interview_score = round(0.5 * tech_score + 0.5 * exp_score, 1)

        # 7. Education Fit
        edu_score = 85.0 if candidate_data.get("education") or candidate_data.get("degree") else 75.0

        # 8. Role Readiness (5D AI Readiness Twin score)
        readiness_score = float(candidate_data.get("readiness_score") or 78.0)
        if readiness_report:
            readiness_score = float(readiness_report.get("overall_readiness_score", readiness_score))

        # 9. Evidence Confidence
        conf_scores = [v.confidence for v in verifications]
        avg_confidence = round(sum(conf_scores) / max(len(conf_scores), 1), 1)

        # 10. Composite Overall Fit
        # Support custom job evaluation weights if provided; otherwise use default balanced weights
        if weights and isinstance(weights, dict):
            w_tech = weights.get("technical_skills", 0.35)
            w_exp = weights.get("experience", 0.25)
            w_ev = weights.get("practical_evidence", 0.15)
            w_asm = weights.get("assessment", 0.10)
            w_comm = weights.get("communication", 0.10)
            w_edu = weights.get("education", 0.05)
            overall_fit = round(
                w_tech * tech_score +
                w_exp * exp_score +
                w_ev * evidence_fit +
                w_asm * assess_score +
                w_comm * 80.0 +
                w_edu * edu_score,
                1
            )
        else:
            # Standard balanced composite: 30% Tech + 20% Exp + 20% Evidence + 15% Assessment + 15% Readiness
            overall_fit = round(
                0.30 * tech_score +
                0.20 * exp_score +
                0.20 * evidence_fit +
                0.15 * assess_score +
                0.15 * readiness_score,
                1
            )
        overall_fit = min(99.0, max(25.0, overall_fit))

        scores = CandidateEvaluationScores(
            overall_fit=overall_fit,
            technical_skills=tech_score,
            relevant_experience=round(exp_score, 1),
            practical_evidence=round(evidence_fit, 1),
            assessment_performance=round(assess_score, 1),
            interview_performance=round(interview_score, 1),
            education=round(edu_score, 1),
            role_readiness=round(readiness_score, 1),
            evidence_confidence=avg_confidence
        )

        # 11. Determine Recommended Action
        critical_unverified = any(v.impact == "critical" and v.status in [
            SkillVerificationStatus.REQUIRES_VERIFICATION,
            SkillVerificationStatus.INSUFFICIENT_EVIDENCE
        ] for v in verifications)

        if overall_fit >= 82.0 and not critical_unverified and avg_confidence >= 75.0:
            recommended_action = NextActionRecommendation.STRONG_MATCH
        elif overall_fit >= 72.0 and not critical_unverified:
            recommended_action = NextActionRecommendation.INTERVIEW
        elif critical_unverified or any(v.status == SkillVerificationStatus.REQUIRES_VERIFICATION for v in verifications):
            recommended_action = NextActionRecommendation.VERIFY_SKILLS
        elif overall_fit >= 60.0:
            recommended_action = NextActionRecommendation.ASSESSMENT_FIRST
        elif overall_fit >= 45.0:
            recommended_action = NextActionRecommendation.BORDERLINE
        else:
            recommended_action = NextActionRecommendation.LOW_MATCH

        # 12. "Why Should I Interview?" & "Why Not This Candidate?"
        why_interview = [
            f"Overall role compatibility is evaluated at {overall_fit:.0f}% with strong alignment to core responsibilities.",
            f"Technical proficiency is grounded in {len(strengths)} confirmed competencies ({', '.join([s.split()[-1] for s in strengths[:3]])}).",
            f"Evidence confidence stands at {avg_confidence:.0f}% across verifiable project code and work deliverables.",
            f"5D Role Readiness Twin indicates candidate is {('Ready to deliver immediately' if readiness_score >= 80 else 'competitive with minimal onboarding')}.",
        ]

        why_not_interview = []
        if missing_skills:
            why_not_interview.append(f"Missing documented exposure in {', '.join(missing_skills[:3])}.")
        if unverified_skills:
            why_not_interview.append(f"Key skill claims ({', '.join(unverified_skills[:2])}) lack verifiable project repository evidence.")
        if evidence_fit < 65.0:
            why_not_interview.append("Candidate project repository proof is limited; hands-on depth is unverified.")
        if not why_not_interview:
            why_not_interview.append("No major technical risks detected; primary consideration is compensation and team fit.")

        # Estimate ramp-up time
        if len(missing_skills) == 0 and len(unverified_skills) <= 1:
            ramp_up = "1-2 weeks (Immediate productivity)"
        elif len(missing_skills) <= 2:
            ramp_up = "3-4 weeks (Minor technology familiarization)"
        else:
            ramp_up = "6-8 weeks (Requires guided mentoring on missing tools)"

        # 13. Candidate First 90-Day Success Milestones (AI-assisted estimates)
        milestones = [
            CandidateSuccessMilestone(
                period="0-30 days",
                risk_level="low" if overall_fit >= 75 else "medium",
                focus_area=f"Onboarding, codebase orientation in {blueprint.role_title}, and developer environment setup.",
                recommendation="Pair on initial feature commits and codebase review."
            ),
            CandidateSuccessMilestone(
                period="31-60 days",
                risk_level="medium" if unverified_skills else "low",
                focus_area=f"Independent delivery on core API/architecture deliverables ({', '.join([s.name for s in blueprint.critical_skills[:2]]) if blueprint.critical_skills else 'core stack'}).",
                recommendation=f"Review architecture decisions around {unverified_skills[0] if unverified_skills else 'system integration'}."
            ),
            CandidateSuccessMilestone(
                period="61-90 days",
                risk_level="medium" if missing_skills else "low",
                focus_area="Autonomous ownership of complex production tasks and cross-team feature delivery.",
                recommendation=f"Provide training on {missing_skills[0] if missing_skills else 'advanced domain patterns'}."
            )
        ]

        # 14. Candidate Internal Upskill Fit
        top_focus = missing_skills[0] if missing_skills else (unverified_skills[0] if unverified_skills else "Advanced Architecture")
        upskill_fit = CandidateUpskillFit(
            current_fit=overall_fit,
            potential_fit_after_training=min(98.0, overall_fit + 10.0),
            target_skill=top_focus,
            estimated_training_effort="Low" if len(missing_skills) == 0 else ("Moderate" if len(missing_skills) <= 2 else "Substantial"),
            projected_ramp_up_weeks=2 if len(missing_skills) == 0 else (4 if len(missing_skills) <= 2 else 6)
        )

        summary_explanation = (
            f"Candidate achieves a {overall_fit:.0f}% overall match for {blueprint.role_title}. "
            f"{len(strengths)} key skills are verified. Recommended next action: {recommended_action.value}."
        )

        return CandidateEvaluation(
            candidate_id=cand_id,
            job_id=job_id,
            scores=scores,
            strengths=strengths[:5],
            concerns=concerns[:5],
            missing_skills=missing_skills,
            unverified_skills=unverified_skills,
            recommended_action=recommended_action,
            why_interview=why_interview,
            why_not_interview=why_not_interview,
            verifications=verifications,
            consistency_checks=consistency_checks,
            summary_explanation=summary_explanation,
            estimated_ramp_up=ramp_up,
            milestones=milestones,
            upskill_fit=upskill_fit,
            evaluation_version="v1.0",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )


resume_evaluator = ResumeEvaluator()

