import uuid
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from app.models.recruiter import (
    GeneratedAssessment,
    AssessmentQuestion,
    JobBlueprint,
    CandidateEvaluation
)

logger = logging.getLogger("uvicorn.error")


class AssessmentGenerator:
    """
    Role-Specific & Gap-Adaptive Assessment Generator.
    Tailors scenario challenges and debugging questions to probe candidate unverified skills.
    """

    @classmethod
    def generate_assessment(
        cls,
        job_id: str,
        candidate_id: str,
        blueprint: JobBlueprint,
        evaluation: Optional[CandidateEvaluation] = None
    ) -> GeneratedAssessment:
        """
        Generates targeted questions based on the candidate's skill gaps and job blueprint.
        """
        role_title = blueprint.role_title
        target_skills = []

        # Focus on unverified and missing skills from evaluation if available
        if evaluation:
            target_skills.extend(evaluation.unverified_skills)
            target_skills.extend(evaluation.missing_skills)

        # Also include top critical blueprint skills
        for cs in blueprint.critical_skills:
            if cs.name not in target_skills:
                target_skills.append(cs.name)

        if not target_skills:
            target_skills = ["Python", "FastAPI", "MongoDB", "REST APIs", "System Architecture"]

        questions: List[AssessmentQuestion] = []
        sections = set()

        # Generate questions tailored to detected target skills
        for idx, skill in enumerate(target_skills[:5]):
            q_data = cls._build_question_for_skill(skill, role_title, idx + 1)
            questions.append(q_data)
            sections.add(q_data.section)

        # Add architecture / problem solving question
        arch_q = AssessmentQuestion(
            id=f"q_arch_{uuid.uuid4().hex[:6]}",
            section="System Architecture & Scaling",
            question=(
                f"You are designing a high-throughput backend service for {role_title}. "
                "How would you structure caching (e.g. Redis), asynchronous processing, "
                "and database connection pooling to handle traffic spikes gracefully?"
            ),
            difficulty="Hard",
            skill_targeted="System Architecture",
            type="scenario",
            evaluation_criteria="Evaluates separation of concerns, concurrency control, caching strategy, and resilience patterns."
        )
        questions.append(arch_q)
        sections.add("System Architecture & Scaling")

        assessment_id = f"asm_{uuid.uuid4().hex[:8]}"

        return GeneratedAssessment(
            id=assessment_id,
            job_id=job_id,
            candidate_id=candidate_id,
            role_title=role_title,
            sections=sorted(list(sections)),
            questions=questions,
            target_skills=target_skills[:5],
            created_at=datetime.now(timezone.utc)
        )

    @classmethod
    def _build_question_for_skill(cls, skill: str, role_title: str, q_num: int) -> AssessmentQuestion:
        s_low = skill.lower()

        if "python" in s_low:
            return AssessmentQuestion(
                id=f"q_{q_num}_{uuid.uuid4().hex[:6]}",
                section="Core Programming & Python",
                question=(
                    "Explain the difference between threading, multiprocessing, and asyncio in Python. "
                    "In what scenario would you choose `asyncio` over multiprocessing for an API service?"
                ),
                difficulty="Medium",
                skill_targeted=skill,
                type="scenario",
                evaluation_criteria="Candidate should identify GIL implications, I/O bound vs CPU bound concurrency, and event-loop characteristics."
            )
        elif "fastapi" in s_low or "rest" in s_low:
            return AssessmentQuestion(
                id=f"q_{q_num}_{uuid.uuid4().hex[:6]}",
                section="API Design & Routing",
                question=(
                    "Design a RESTful endpoint in FastAPI for handling bulk file uploads with schema validation. "
                    "How would you handle dependency injection for database sessions and authentication guards?"
                ),
                difficulty="Medium",
                skill_targeted=skill,
                type="coding",
                evaluation_criteria="Expects Pydantic validation schemas, Depends() usage, async route definitions, and appropriate HTTP status codes."
            )
        elif "mongo" in s_low or "database" in s_low or "sql" in s_low:
            return AssessmentQuestion(
                id=f"q_{q_num}_{uuid.uuid4().hex[:6]}",
                section="Database Design & Optimization",
                question=(
                    f"Given a slow query analyzing millions of records in {skill}, "
                    "what steps would you take to diagnose bottlenecks, examine execution plans, "
                    "and optimize compound indexing?"
                ),
                difficulty="Medium",
                skill_targeted=skill,
                type="scenario",
                evaluation_criteria="Checks knowledge of explain plans, index cardinality, aggregation pipeline stages, and memory cache limits."
            )
        elif "docker" in s_low or "k8s" in s_low or "kubernetes" in s_low or "cloud" in s_low:
            return AssessmentQuestion(
                id=f"q_{q_num}_{uuid.uuid4().hex[:6]}",
                section="DevOps & Infrastructure",
                question=(
                    f"A production service deployed with {skill} is experiencing OOM (Out of Memory) kills. "
                    "Walk through your triage process, log inspection, resource limit configurations, and health check designs."
                ),
                difficulty="Hard",
                skill_targeted=skill,
                type="scenario",
                evaluation_criteria="Looks for systematic debugging, memory profiling, container resource requests/limits, and liveness/readiness probes."
            )
        elif "react" in s_low or "frontend" in s_low:
            return AssessmentQuestion(
                id=f"q_{q_num}_{uuid.uuid4().hex[:6]}",
                section="Frontend Architecture",
                question=(
                    "How do you manage complex asynchronous application state without unnecessary re-renders in React? "
                    "Compare Context API + useReducer versus dedicated state management libraries."
                ),
                difficulty="Medium",
                skill_targeted=skill,
                type="scenario",
                evaluation_criteria="Evaluates component lifecycle, memoization (useMemo/useCallback), selector patterns, and state normalization."
            )
        else:
            return AssessmentQuestion(
                id=f"q_{q_num}_{uuid.uuid4().hex[:6]}",
                section="Practical Problem Solving",
                question=(
                    f"Describe a complex technical challenge you encountered when implementing {skill} in a production environment. "
                    "What trade-offs did you evaluate, and how did you verify your solution was reliable?"
                ),
                difficulty="Medium",
                skill_targeted=skill,
                type="scenario",
                evaluation_criteria="Probes depth of hands-on experience, trade-off analysis, and testing methodology."
            )


assessment_generator = AssessmentGenerator()

