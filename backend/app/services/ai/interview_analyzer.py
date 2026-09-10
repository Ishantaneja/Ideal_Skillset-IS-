import re
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from app.models.recruiter import InterviewSummaryResponse

logger = logging.getLogger("uvicorn.error")


class InterviewAnalyzer:
    """
    AI Interview Summarizer & Feedback Analyzer.
    Parses interviewer notes/transcripts to produce structured dimension scores,
    identified strengths, concerns, and interview recommendations.
    """

    @classmethod
    def analyze_interview_feedback(
        cls,
        candidate_id: str,
        job_id: str,
        notes: str,
        technical_score: float = 80.0,
        communication_score: float = 80.0,
        problem_solving_score: float = 80.0
    ) -> InterviewSummaryResponse:
        """
        Synthesizes notes and score inputs into structured interview telemetry.
        """
        strengths: List[str] = []
        concerns: List[str] = []

        notes_lower = notes.lower()

        # Keyword heuristics for extracting strengths and concerns
        positive_keywords = {
            "Architecture & Design": ["architecture", "clean design", "solid understanding", "scalable", "well structured"],
            "Clear Communication": ["articulate", "concise", "clear explanation", "good communicator", "structured"],
            "Practical Debugging": ["strong debugging", "troubleshoot", "root cause", "practical experience", "hands-on"],
            "Domain Depth": ["expert", "deep knowledge", "proficient", "strong python", "strong backend"]
        }

        negative_keywords = {
            "Gaps in Infrastructure/DevOps": ["weak docker", "kubernetes depth", "unclear deployment", "limited cloud"],
            "Communication Structure": ["rambling", "hesitant", "vague", "needed prompting", "surface level"],
            "System Scale Exposure": ["limited scale", "small dataset", "junior mindset", "lacks production exposure"]
        }

        for category, words in positive_keywords.items():
            if any(w in notes_lower for w in words):
                strengths.append(category)

        for category, words in negative_keywords.items():
            if any(w in notes_lower for w in words):
                concerns.append(category)

        if not strengths:
            strengths = ["Solid conceptual fundamentals", "Good problem-solving engagement"]
        if not concerns:
            concerns = ["Minor domain tool familiarization needed"]

        # Calculate composite role readiness score from interview
        role_readiness = round(
            0.40 * technical_score +
            0.35 * problem_solving_score +
            0.25 * communication_score,
            1
        )

        # Recommendation logic
        if role_readiness >= 82.0 and technical_score >= 75.0:
            recommendation = "PROCEED TO FINAL ROUND"
        elif role_readiness >= 70.0:
            recommendation = "HOLD FOR REVIEW / SECOND OPINION"
        else:
            recommendation = "DO NOT PROCEED (BELOW BENCHMARK)"

        return InterviewSummaryResponse(
            candidate_id=candidate_id,
            job_id=job_id,
            technical_score=technical_score,
            problem_solving_score=problem_solving_score,
            communication_score=communication_score,
            role_readiness_score=role_readiness,
            strengths=strengths[:4],
            concerns=concerns[:3],
            recommendation=recommendation,
            created_at=datetime.now(timezone.utc)
        )


interview_analyzer = InterviewAnalyzer()

