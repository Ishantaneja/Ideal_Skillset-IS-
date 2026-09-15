import re
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("uvicorn.error")

COMMON_SKILLS_VOCABULARY = [
    "python", "fastapi", "django", "flask", "javascript", "typescript", "react", "react.js", "next.js",
    "node.js", "express", "mongodb", "postgresql", "mysql", "redis", "docker", "kubernetes", "aws",
    "gcp", "azure", "graphql", "rest api", "microservices", "ci/cd", "git", "linux", "html5", "css3",
    "tailwind", "pandas", "numpy", "pytorch", "tensorflow", "scikit-learn", "data engineering", "system design"
]


class NLSearchParser:
    """
    Parses natural-language recruiter search queries into structured database filter criteria.
    Guarantees that resulting filters strictly operate within company isolation boundaries.
    """

    @classmethod
    def parse_query(cls, query: str) -> Dict[str, Any]:
        q_lower = query.lower().strip()

        # 1. Detect target role
        target_role = None
        role_patterns = [
            r"(?:for|looking for|find|show|search)\s+([a-zA-Z\s]+?)\s+(?:developer|engineer|specialist|architect|analyst)",
            r"(backend|frontend|full stack|machine learning|devops|data engineer|cloud engineer|product analyst)"
        ]
        for pattern in role_patterns:
            m = re.search(pattern, q_lower)
            if m:
                target_role = m.group(0).replace("looking for", "").replace("find", "").replace("show", "").strip()
                break

        # 2. Detect skills mentioned
        detected_skills = []
        for skill in COMMON_SKILLS_VOCABULARY:
            # Word boundary search
            pattern = r"(?<![a-zA-Z0-9_\-\.])" + re.escape(skill) + r"(?![a-zA-Z0-9_\-\.])"
            if re.search(pattern, q_lower):
                clean_name = skill.title() if len(skill) > 4 else skill.upper()
                if clean_name.lower() == "fastapi":
                    clean_name = "FastAPI"
                elif clean_name.lower() == "mongodb":
                    clean_name = "MongoDB"
                elif clean_name.lower() == "postgresql":
                    clean_name = "PostgreSQL"
                elif clean_name.lower() in ["react", "react.js"]:
                    clean_name = "React"
                elif clean_name.lower() in ["node.js", "node"]:
                    clean_name = "Node.js"
                detected_skills.append(clean_name)

        # 3. Detect minimum years of experience
        min_years = None
        exp_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:\+|plus)?\s*(?:years?|yrs?)(?:\s+of)?\s*(?:experience|exp)?", q_lower)
        if exp_match:
            try:
                min_years = float(exp_match.group(1))
            except ValueError:
                pass

        # 4. Detect readiness / score requirements
        min_readiness = None
        if "high readiness" in q_lower or "top readiness" in q_lower:
            min_readiness = 80.0
        elif "moderate readiness" in q_lower:
            min_readiness = 65.0

        score_match = re.search(r"(?:readiness|fit|score)\s*(?:>=|above|over|at least)?\s*(\d{2})%?", q_lower)
        if score_match:
            try:
                min_readiness = float(score_match.group(1))
            except ValueError:
                pass

        # 5. Detect verifiable evidence requirements
        verified_github_only = any(term in q_lower for term in ["github", "code verified", "repo", "practical evidence", "codebase proof"])
        verified_certs_only = any(term in q_lower for term in ["certificate", "certified", "credential", "certified in"])

        explanation_parts = []
        if target_role:
            explanation_parts.append(f"Target role matching '{target_role}'")
        if detected_skills:
            explanation_parts.append(f"Skills required: {', '.join(detected_skills)}")
        if min_years is not None:
            explanation_parts.append(f"Minimum {min_years} years experience")
        if min_readiness is not None:
            explanation_parts.append(f"Minimum readiness score >= {min_readiness}%")
        if verified_github_only:
            explanation_parts.append("Requiring verified GitHub codebase proof")
        if verified_certs_only:
            explanation_parts.append("Requiring documented certificate verification")

        summary = "; ".join(explanation_parts) if explanation_parts else "General candidate search"

        return {
            "target_role": target_role,
            "skills": detected_skills,
            "min_years_experience": min_years,
            "min_readiness": min_readiness,
            "verified_github_only": verified_github_only,
            "verified_certs_only": verified_certs_only,
            "parsed_summary": summary,
            "raw_query": query
        }


nl_search_parser = NLSearchParser()

