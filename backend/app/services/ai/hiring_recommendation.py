import logging
from typing import List, Dict, Any, Optional

from app.models.recruiter import CandidateEvaluation

logger = logging.getLogger("uvicorn.error")


class HiringRecommendationEngine:
    """
    Final Multi-Source Hiring Recommendation Layer.
    Synthesizes Resume Screening, Skill Verification, Consistency Engine,
    Assessments, and Interview results into an actionable, explainable verdict.
    """

    @classmethod
    def synthesize_recommendation(
        cls,
        evaluation: CandidateEvaluation,
        has_assessment: bool = False,
        has_interview: bool = False
    ) -> Dict[str, Any]:
        scores = evaluation.scores
        fit = scores.overall_fit
        conf = scores.evidence_confidence
        readiness = scores.role_readiness

        reasons: List[str] = []
        risks: List[str] = []
        next_step = ""
        verdict = ""

        if fit >= 88.0 and conf >= 80.0 and readiness >= 80.0:
            if has_interview:
                verdict = "STRONG HIRE SIGNAL"
                reasons.append(f"Exceptional composite fit ({fit:.0f}%) with validated hands-on code and high interview score.")
                reasons.append("All critical engineering competencies are verified with high confidence.")
                next_step = "Extend formal employment offer."
            else:
                verdict = "PROCEED"
                reasons.append(f"High overall fit ({fit:.0f}%) with strong evidence confidence ({conf:.0f}%).")
                reasons.append(f"Role readiness twin indicates candidate is competitive ({readiness:.0f}%).")
                next_step = "Schedule final round hiring manager interview."
        elif fit >= 75.0:
            if evaluation.unverified_skills:
                verdict = "VERIFY"
                reasons.append(f"Solid overall fit ({fit:.0f}%), but critical skills require verification ({', '.join(evaluation.unverified_skills[:2])}).")
                risks.append(f"Unverified claims in {', '.join(evaluation.unverified_skills[:2])}.")
                next_step = f"Conduct targeted technical deep-dive on {evaluation.unverified_skills[0]}."
            elif not has_assessment and fit < 82.0:
                verdict = "ASSESSMENT FIRST"
                reasons.append(f"Good foundational profile ({fit:.0f}%), but hands-on coding assessment is recommended to confirm practical depth.")
                next_step = "Dispatch role coding challenge."
            else:
                verdict = "INTERVIEW"
                reasons.append(f"Qualified applicant meeting core specifications ({fit:.0f}%).")
                next_step = "Invite candidate to initial technical screen."
        elif fit >= 55.0:
            verdict = "HOLD"
            reasons.append(f"Candidate meets partial requirements ({fit:.0f}%), but has notable skill gaps ({', '.join(evaluation.missing_skills[:3])}).")
            risks.append("Longer ramp-up time estimated (~6-8 weeks).")
            next_step = "Keep in talent pipeline; consider for junior or adjacent requisition."
        else:
            verdict = "LOW MATCH"
            reasons.append(f"Candidate qualifications do not currently align with critical role requirements ({fit:.0f}% fit).")
            risks.append("Fundamental competencies not documented.")
            next_step = "Send respectful rejection or suggest career readiness roadmap."

        if not risks:
            risks = ["Candidate in high market demand; offer timeline should be prioritized."]

        return {
            "recommendation": verdict,
            "overall_fit": fit,
            "evidence_confidence": conf,
            "role_readiness": readiness,
            "reasons": reasons,
            "supporting_evidence": evaluation.strengths[:3],
            "risks": risks,
            "missing_skills": evaluation.missing_skills,
            "unverified_skills": evaluation.unverified_skills,
            "next_step": next_step
        }


hiring_recommendation_engine = HiringRecommendationEngine()

