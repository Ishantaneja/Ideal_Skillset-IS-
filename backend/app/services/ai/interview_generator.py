import uuid
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from app.models.recruiter import (
    GeneratedInterviewPlan,
    InterviewQuestion,
    JobBlueprint,
    CandidateEvaluation
)

logger = logging.getLogger("uvicorn.error")


class InterviewGenerator:
    """
    AI Interview Plan Generator.
    Tailors technical and behavioral STAR questions to probe candidate skill gaps,
    resume claims, and role competencies.
    """

    @classmethod
    def generate_interview_plan(
        cls,
        job_id: str,
        candidate_id: str,
        blueprint: JobBlueprint,
        evaluation: Optional[CandidateEvaluation] = None
    ) -> GeneratedInterviewPlan:
        role_title = blueprint.role_title
        plan_id = f"int_{uuid.uuid4().hex[:8]}"

        technical_questions: List[InterviewQuestion] = []
        behavioral_questions: List[InterviewQuestion] = []

        # Target candidate gaps / unverified skills first
        gap_skills = []
        if evaluation:
            gap_skills.extend(evaluation.unverified_skills)
            gap_skills.extend(evaluation.missing_skills)

        # Fallback to critical blueprint skills
        for cs in blueprint.critical_skills:
            if cs.name not in gap_skills:
                gap_skills.append(cs.name)

        if not gap_skills:
            gap_skills = ["FastAPI", "MongoDB", "REST APIs", "Docker"]

        # 1. Technical Questions (3-4 questions)
        for idx, skill in enumerate(gap_skills[:4]):
            q_id = f"tq_{idx + 1}_{uuid.uuid4().hex[:4]}"
            technical_questions.append(InterviewQuestion(
                id=q_id,
                category="technical",
                question=f"Can you walk me through an architecture where you designed or maintained {skill}? What were the main bottlenecks you had to solve?",
                purpose=f"Probe hands-on practical depth and verify claims in {skill}",
                target_skill_or_competency=skill,
                evaluation_rubric="Look for concrete architectural details, design trade-offs, and metrics rather than surface-level definitions."
            ))

        # Add production incident handling question
        technical_questions.append(InterviewQuestion(
            id=f"tq_prod_{uuid.uuid4().hex[:4]}",
            category="technical",
            question="Describe the most challenging production bug or outage you diagnosed. How did you identify the root cause under pressure?",
            purpose="Assess real-world debugging methodology and operational maturity",
            target_skill_or_competency="Production Incident Handling",
            evaluation_rubric="Check for structured debugging mindset, use of logs/telemetry, containment strategy, and post-mortem improvements."
        ))

        # 2. Behavioral STAR Questions (3 questions)
        behavioral_topics = [
            ("Ownership", "Tell me about a project where requirements were vague or shifting. How did you take ownership and ensure successful delivery?"),
            ("Cross-Functional Communication", "Describe a time when you strongly disagreed with a product or engineering peer regarding a technical design decision. How was it resolved?"),
            ("Problem Solving Under Constraints", "Give an example of a time when you had to make a difficult trade-off between delivery speed and code perfection. What was the outcome?")
        ]

        for idx, (competency, q_text) in enumerate(behavioral_topics):
            q_id = f"bq_{idx + 1}_{uuid.uuid4().hex[:4]}"
            behavioral_questions.append(InterviewQuestion(
                id=q_id,
                category="behavioral",
                question=q_text,
                purpose=f"Evaluate behavioral competency in {competency}",
                star_focus="Situation, Task, Action, Result",
                target_skill_or_competency=competency,
                evaluation_rubric="Verify clear STAR structure: clear personal actions ('I did' vs 'we did') and measurable business impact."
            ))

        return GeneratedInterviewPlan(
            id=plan_id,
            job_id=job_id,
            candidate_id=candidate_id,
            role_title=role_title,
            technical_questions=technical_questions,
            behavioral_questions=behavioral_questions,
            created_at=datetime.now(timezone.utc)
        )


interview_generator = InterviewGenerator()

