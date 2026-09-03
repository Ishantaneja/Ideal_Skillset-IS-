import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from app.models.skill_gap import (
    SkillGapItem,
    SkillEvidenceItem,
    SkillGapOverallSummary,
)
from app.services.ats_engine import ats_engine, ATS_WEIGHTS

logger = logging.getLogger("uvicorn.error")

# Level label mappings
LEVEL_LABELS = {
    0: "None",
    1: "Beginner",
    2: "Basic",
    3: "Intermediate",
    4: "Advanced",
    5: "Expert",
}

GAP_LABELS = {
    0: "No Gap",
    1: "Small",
    2: "Medium",
    3: "Large",
    4: "Large",
    5: "Large",
}

# Curated practical topics for common technology skill gaps
SKILL_TOPICS_CATALOG: Dict[str, List[str]] = {
    "SQL": ["Complex Multi-Table Joins", "Common Table Expressions (CTEs)", "Window Functions (ROW_NUMBER, RANK, NTILE)", "Subqueries & Aggregations", "Query Optimization & Indexing"],
    "Python": ["Object-Oriented Design & Modules", "Data Structures & Iterators", "Decorators & Context Managers", "Async IO & Concurrent Execution", "Unit Testing with PyTest"],
    "FastAPI": ["Pydantic V2 Request Validation", "FastAPI Dependency Injection", "JWT Bearer Authentication", "Async Database Sessions", "Auto-generated OpenAPI Documentation"],
    "Power BI": ["Star Schema Data Modeling", "DAX Formulas (CALCULATE, RELATED, FILTER)", "Power Query M Transformations", "Interactive Executive Dashboards", "Row-Level Security (RLS)"],
    "Tableau": ["Calculated Fields & LOD Expressions", "Dual-Axis Charts & Trend Lines", "Data Blending & Extracts", "Storytelling Dashboards", "Parameters & Interactive Filters"],
    "Docker": ["Optimized Dockerfile Multi-Stage Builds", "Docker Compose Multi-Container Stacks", "Volume Persistence & Networking", "Environment Variables & Secrets", "Image Size Reduction"],
    "PostgreSQL": ["Relational Schema Architecture", "B-Tree & GIN Indexes", "JSONB Querying & Indexing", "ACID Transactions & Locks", "Database Migrations with Alembic"],
    "AWS": ["Amazon S3 Object Storage", "EC2 Virtual Server Configuration", "AWS Lambda Serverless Functions", "IAM Security Roles & Policies", "CloudWatch Monitoring & Logs"],
    "React": ["Custom Hooks & State Encapsulation", "Context API State Management", "Performance Memoization (useMemo, useCallback)", "Client-Side Routing with React Router", "Component Composition"],
    "MongoDB": ["Document Schema Modeling", "Aggregation Pipelines ($group, $lookup, $unwind)", "Compound & TTL Indexes", "Replica Sets & Read Preferences", "PyMongo Async Driver Operations"],
    "Redis": ["In-Memory Caching Strategies", "Cache Invalidation Patterns", "Pub/Sub Messaging", "Distributed Locks", "TTL Expiration Management"],
    "Machine Learning": ["Data Preprocessing & Feature Engineering", "Supervised Learning (Regression, Random Forest, XGBoost)", "Model Evaluation (Cross-Validation, ROC-AUC)", "Hyperparameter Tuning with GridSearch", "Model Packaging & Deployment"],
    "Pandas": ["DataFrame Filtering & GroupBy Operations", "Merge, Join & Concatenation", "Handling Missing Data & Outliers", "Time-Series Indexing & Resampling", "Vectorized Performance Operations"],
    "Git": ["Interactive Rebasing & Squashing", "Feature Branching & Pull Requests", "Merge Conflict Resolution", "Git Hooks Automation", "Tagging & Release Versioning"],
    "CI/CD": ["Automated Testing Pipelines", "GitHub Actions Workflow Configuration", "Build Artifact Creation", "Continuous Deployment to Staging", "Environment Secret Management"],
    "JavaScript": ["ES6+ Modern Syntax & Destructuring", "Promises, Async/Await & Event Loop", "DOM Manipulation & Events", "Fetch API & Axios Integration", "Modular Code Architecture"],
    "TypeScript": ["Strict Type Interfaces & Types", "Generics & Utility Types", "Union & Intersection Types", "Type Narrowing & Guards", "tsconfig Compilation Options"],
}


class SkillGapEngine:
    """
    Evaluates candidate preparedness for a target job role, calculating
    current vs required proficiency, gap size, ATS impact, priority ranking,
    and structured learning sequences.
    """

    @classmethod
    def estimate_current_level(
        cls,
        skill_name: str,
        resume_doc: Dict[str, Any]
    ) -> Tuple[int, List[str]]:
        """
        Conservatively estimates candidate current proficiency (0 to 5) based on
        verified evidence in resume experience, projects, and skills sections.
        """
        parsed_data = resume_doc.get("parsed_data", {})
        skills_list = parsed_data.get("skills", [])
        experiences = parsed_data.get("experience", [])
        projects = parsed_data.get("projects", [])
        raw_text = resume_doc.get("extracted_text", "")

        norm_target = skill_name.lower().strip()
        matched_in_skills = any(s.get("name", "").lower() == norm_target for s in skills_list)

        evidence_quotes: List[str] = []
        pattern = r"(?<![a-zA-Z0-9_])" + re.escape(skill_name) + r"(?![a-zA-Z0-9_])"

        # Check in experiences
        exp_mentions = 0
        for exp in experiences:
            desc = exp.get("description", "")
            title = exp.get("job_title", "")
            comp = exp.get("company", "")
            if desc and re.search(pattern, desc, re.IGNORECASE):
                exp_mentions += 1
                evidence_quotes.append(f"{title} at {comp}: {desc[:140]}...")

        # Check in projects
        proj_mentions = 0
        for proj in projects:
            desc = proj.get("description", "")
            name = proj.get("name", "")
            techs = proj.get("technologies", [])
            tech_matched = any(t.lower() == norm_target for t in techs)
            if (desc and re.search(pattern, desc, re.IGNORECASE)) or tech_matched:
                proj_mentions += 1
                evidence_quotes.append(f"Project '{name}': {desc[:140] if desc else 'Utilized ' + skill_name}...")

        # Evaluate level based on evidence depth
        if exp_mentions >= 2 or (exp_mentions >= 1 and proj_mentions >= 1):
            level = 4  # Advanced (multiple production roles/projects)
        elif exp_mentions == 1:
            level = 3  # Intermediate (practical industry deliverable)
        elif proj_mentions >= 1:
            level = 2  # Basic (portfolio project)
        elif matched_in_skills or re.search(pattern, raw_text, re.IGNORECASE):
            level = 1  # Beginner (listed in skills, no deep deliverable described)
            evidence_quotes.append("Listed under candidate technical competencies.")
        else:
            level = 0  # None (not present)

        return level, evidence_quotes[:2]

    @classmethod
    def estimate_required_level(
        cls,
        skill_name: str,
        job_doc: Dict[str, Any],
        is_required: bool
    ) -> Tuple[int, List[str]]:
        """
        Determines target proficiency level (1 to 5) based on job description context.
        """
        job_reqs = job_doc.get("requirements", {})
        job_info = job_doc.get("job_info", {})
        job_raw = job_doc.get("raw_text", "")
        job_title = job_info.get("job_title", "")

        job_quotes: List[str] = []
        pattern = r"(?<![a-zA-Z0-9_])" + re.escape(skill_name) + r"(?![a-zA-Z0-9_])"

        # Search for JD sentences mentioning this skill
        sentences = re.split(r"(?<=[.!?\n])\s+", job_raw)
        for s in sentences:
            s_clean = s.strip().lstrip("•-*–> ")
            if len(s_clean) > 15 and re.search(pattern, s_clean, re.IGNORECASE):
                job_quotes.append(s_clean[:140])

        context_text = " ".join(job_quotes).lower() if job_quotes else job_raw.lower()
        title_lower = job_title.lower()

        is_senior_role = any(w in title_lower for w in ["senior", "lead", "principal", "staff", "architect"])
        is_expert_text = any(w in context_text for w in ["expert", "deep understanding", "advanced", "architect", "5+ years", "extensive"])
        is_strong_text = any(w in context_text for w in ["strong", "proficient", "3+ years", "hands-on", "mastery"])

        if is_required:
            if is_senior_role or is_expert_text:
                req_level = 4  # Advanced
            elif is_strong_text:
                req_level = 3  # Intermediate
            else:
                req_level = 3  # Standard required level is Intermediate
        else:
            # Preferred skill
            if is_strong_text:
                req_level = 3
            else:
                req_level = 2  # Basic for preferred

        return req_level, job_quotes[:2]

    @classmethod
    def calculate_importance(
        cls,
        is_required: bool,
        job_frequency: float,
        is_core_role_skill: bool
    ) -> str:
        """
        Categorizes skill importance into 'critical', 'high', 'medium', or 'low'.
        """
        if is_required:
            if job_frequency >= 0.35 or is_core_role_skill:
                return "critical"
            return "high"
        else:
            if job_frequency >= 0.25:
                return "medium"
            return "low"

    @classmethod
    def calculate_priority_score(
        cls,
        importance: str,
        gap: int,
        ats_impact: float,
        job_frequency: float
    ) -> Tuple[float, str]:
        """
        Computes transparent deterministic priority score (0.0 to 10.0).
        """
        imp_weights = {
            "critical": 3.2,
            "high": 2.2,
            "medium": 1.2,
            "low": 0.5,
        }
        base_imp = imp_weights.get(importance, 1.0)

        if gap == 0:
            # Mastered skill - low priority for learning
            score = round(max(0.5, base_imp * 0.3), 1)
            return score, "Low"

        # Multi-factor priority formula
        # Component 1: Importance weight (up to 3.2 pts)
        # Component 2: Gap size (up to 3.0 pts for gap=4)
        # Component 3: ATS impact (up to 2.5 pts)
        # Component 4: Job frequency (up to 1.3 pts)
        gap_score = (min(gap, 4) / 4.0) * 3.0
        ats_score = min(2.5, (ats_impact / 12.0) * 2.5)
        freq_score = min(1.3, job_frequency * 1.5)

        total = base_imp + gap_score + ats_score + freq_score
        final_score = round(min(10.0, max(1.0, total)), 1)

        if final_score >= 8.5:
            label = "Critical"
        elif final_score >= 7.0:
            label = "High"
        elif final_score >= 5.0:
            label = "Medium"
        else:
            label = "Low"

        return final_score, label

    @classmethod
    def estimate_learning_hours(
        cls,
        skill_name: str,
        category: str,
        gap: int
    ) -> Tuple[str, int]:
        """
        Estimates learning curve effort and realistic hour budget.
        """
        if gap == 0:
            return "low", 0

        # Base hours by category
        base_hours_map = {
            "Data & AI": 35,
            "Cloud & DevOps": 30,
            "Backend": 25,
            "Programming Language": 25,
            "Database": 20,
            "Frontend": 20,
            "Tools": 10,
        }
        base = base_hours_map.get(category, 20)

        # Gap multipliers
        multipliers = {1: 0.6, 2: 1.0, 3: 1.5, 4: 2.0, 5: 2.5}
        mult = multipliers.get(gap, 1.0)
        total_hours = int(round(base * mult))

        if total_hours <= 20:
            effort = "low"
        elif total_hours <= 45:
            effort = "medium"
        else:
            effort = "high"

        return effort, total_hours

    @classmethod
    def generate_recommended_action(
        cls,
        skill_name: str,
        current_level: int,
        required_level: int,
        category: str
    ) -> str:
        """
        Generates concrete, actionable advice for closing this specific skill gap.
        """
        curr_label = LEVEL_LABELS.get(current_level, "None")
        req_label = LEVEL_LABELS.get(required_level, "Intermediate")

        if current_level == 0:
            return f"Build fundamental mastery of {skill_name} from scratch to {req_label} level. Start with core syntax and implement a portfolio-ready demonstration project."
        elif current_level < required_level:
            return f"Elevate your {skill_name} expertise from {curr_label} to {req_label}. Focus on advanced architectural patterns, optimization, and document your results in project deliverables."
        else:
            return f"Your {skill_name} proficiency currently meets or exceeds the required {req_label} benchmark. Maintain active knowledge by continuing hands-on application."

    @classmethod
    def generate_learning_sequence(
        cls,
        gaps: List[SkillGapItem]
    ) -> List[str]:
        """
        Sorts skills into a pedagogically sound sequence taking foundational dependencies into account.
        (e.g., Python before Machine Learning, SQL before Power BI/Tableau).
        """
        # Dependencies table: prerequisite -> dependent
        dependencies = {
            "Machine Learning": ["Python", "Pandas", "NumPy"],
            "Power BI": ["SQL"],
            "Tableau": ["SQL"],
            "FastAPI": ["Python"],
            "Django": ["Python"],
            "Next.js": ["React", "JavaScript"],
            "Kubernetes": ["Docker"],
        }

        # Filter to missing / gap skills
        actionable_gaps = [g for g in gaps if g.gap > 0]
        # Sort primarily by priority_score descending
        sorted_gaps = sorted(actionable_gaps, key=lambda x: x.priority_score, reverse=True)
        ordered_skills = [g.skill for g in sorted_gaps]

        # Re-order based on foundational dependencies
        for dep_skill, prereqs in dependencies.items():
            if dep_skill in ordered_skills:
                dep_idx = ordered_skills.index(dep_skill)
                for prereq in prereqs:
                    if prereq in ordered_skills:
                        prereq_idx = ordered_skills.index(prereq)
                        if prereq_idx > dep_idx:
                            # Move prerequisite before dependent
                            ordered_skills.remove(prereq)
                            ordered_skills.insert(dep_idx, prereq)

        return ordered_skills

    @classmethod
    def analyze_gaps(
        cls,
        resume_doc: Dict[str, Any],
        job_doc: Dict[str, Any],
        existing_ats_result: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes full multi-factor intelligent skill gap analysis.
        """
        job_reqs = job_doc.get("requirements", {})
        job_info = job_doc.get("job_info", {})
        job_req_skills = job_reqs.get("required_skills", [])
        job_pref_skills = job_reqs.get("preferred_skills", [])
        job_resps = job_reqs.get("responsibilities", [])
        total_resps = max(len(job_resps), 1)

        # 1. Reuse or calculate ATS baseline
        if existing_ats_result:
            current_ats_score = existing_ats_result.get("score", 70.0)
        else:
            ats_calc = ats_engine.analyze(resume_doc, job_doc)
            current_ats_score = ats_calc["score"]

        total_req_count = max(len(job_req_skills), 1)
        total_pref_count = max(len(job_pref_skills), 1)
        req_ats_impact_unit = round(35.0 / total_req_count, 1)
        pref_ats_impact_unit = round(10.0 / total_pref_count, 1)

        gap_items: List[SkillGapItem] = []
        critical_count = 0
        high_count = 0
        medium_count = 0
        low_count = 0
        matched_count = 0
        missing_count = 0

        # Process Required Skills
        for s in job_req_skills:
            skill_name = s.get("name", "")
            category = s.get("category", "General")

            # Calculate job frequency
            mentions = sum(1 for r in job_resps if re.search(r"(?<![a-zA-Z0-9_])" + re.escape(skill_name) + r"(?![a-zA-Z0-9_])", r, re.IGNORECASE))
            job_frequency = round(min(1.0, (mentions + 1) / total_resps), 2)

            curr_level, resume_ev = cls.estimate_current_level(skill_name, resume_doc)
            req_level, job_ev = cls.estimate_required_level(skill_name, job_doc, is_required=True)
            gap = max(0, req_level - curr_level)

            if gap == 0:
                matched_count += 1
                ats_impact = 0.0
            else:
                missing_count += 1
                ats_impact = req_ats_impact_unit

            importance = cls.calculate_importance(is_required=True, job_frequency=job_frequency, is_core_role_skill=bool(mentions > 0))
            priority_score, priority_label = cls.calculate_priority_score(importance, gap, ats_impact, job_frequency)
            effort, hours = cls.estimate_learning_hours(skill_name, category, gap)
            action = cls.generate_recommended_action(skill_name, curr_level, req_level, category)
            topics = SKILL_TOPICS_CATALOG.get(skill_name, [f"{skill_name} Foundations", f"{skill_name} Project Deliverables", f"{skill_name} Best Practices"])

            # Count importance
            if importance == "critical":
                critical_count += 1
            elif importance == "high":
                high_count += 1
            elif importance == "medium":
                medium_count += 1
            else:
                low_count += 1

            gap_items.append(SkillGapItem(
                skill=skill_name,
                normalized_skill=skill_name.lower().replace(" ", "-"),
                category=category,
                importance=importance,
                required=True,
                preferred=False,
                current_level=curr_level,
                current_level_label=LEVEL_LABELS.get(curr_level, "None"),
                required_level=req_level,
                required_level_label=LEVEL_LABELS.get(req_level, "Intermediate"),
                gap=gap,
                gap_label=GAP_LABELS.get(gap, "Medium"),
                job_frequency=job_frequency,
                ats_impact=ats_impact,
                learning_effort=effort,
                estimated_learning_hours=hours,
                priority_score=priority_score,
                priority_label=priority_label,
                reason=f"Mandatory requirement for {job_info.get('job_title', 'this position')}." if gap > 0 else "Verified required competency.",
                recommended_action=action,
                recommended_topics=topics,
                evidence=SkillEvidenceItem(resume=resume_ev, job=job_ev)
            ))

        # Process Preferred Skills
        for s in job_pref_skills:
            skill_name = s.get("name", "")
            category = s.get("category", "General")

            mentions = sum(1 for r in job_resps if re.search(r"(?<![a-zA-Z0-9_])" + re.escape(skill_name) + r"(?![a-zA-Z0-9_])", r, re.IGNORECASE))
            job_frequency = round(min(1.0, (mentions + 1) / total_resps), 2)

            curr_level, resume_ev = cls.estimate_current_level(skill_name, resume_doc)
            req_level, job_ev = cls.estimate_required_level(skill_name, job_doc, is_required=False)
            gap = max(0, req_level - curr_level)

            if gap == 0:
                matched_count += 1
                ats_impact = 0.0
            else:
                missing_count += 1
                ats_impact = pref_ats_impact_unit

            importance = cls.calculate_importance(is_required=False, job_frequency=job_frequency, is_core_role_skill=False)
            priority_score, priority_label = cls.calculate_priority_score(importance, gap, ats_impact, job_frequency)
            effort, hours = cls.estimate_learning_hours(skill_name, category, gap)
            action = cls.generate_recommended_action(skill_name, curr_level, req_level, category)
            topics = SKILL_TOPICS_CATALOG.get(skill_name, [f"{skill_name} Overview", f"{skill_name} Usage Patterns"])

            if importance == "critical":
                critical_count += 1
            elif importance == "high":
                high_count += 1
            elif importance == "medium":
                medium_count += 1
            else:
                low_count += 1

            gap_items.append(SkillGapItem(
                skill=skill_name,
                normalized_skill=skill_name.lower().replace(" ", "-"),
                category=category,
                importance=importance,
                required=False,
                preferred=True,
                current_level=curr_level,
                current_level_label=LEVEL_LABELS.get(curr_level, "None"),
                required_level=req_level,
                required_level_label=LEVEL_LABELS.get(req_level, "Basic"),
                gap=gap,
                gap_label=GAP_LABELS.get(gap, "Small"),
                job_frequency=job_frequency,
                ats_impact=ats_impact,
                learning_effort=effort,
                estimated_learning_hours=hours,
                priority_score=priority_score,
                priority_label=priority_label,
                reason=f"Bonus competency for {job_info.get('job_title', 'this role')}." if gap > 0 else "Verified bonus skill.",
                recommended_action=action,
                recommended_topics=topics,
                evidence=SkillEvidenceItem(resume=resume_ev, job=job_ev)
            ))

        # Sort items by priority_score descending
        sorted_gaps = sorted(gap_items, key=lambda x: x.priority_score, reverse=True)

        # Generate recommended learning sequence
        learning_order = cls.generate_learning_sequence(sorted_gaps)

        # Calculate potential ATS score if all gaps are closed
        total_missing_impact = sum(g.ats_impact for g in sorted_gaps if g.gap > 0)
        potential_ats_score = min(100.0, round(current_ats_score + total_missing_impact, 1))

        summary = SkillGapOverallSummary(
            critical=critical_count,
            high=high_count,
            medium=medium_count,
            low=low_count,
            total_skills=len(sorted_gaps),
            matched_skills_count=matched_count,
            missing_skills_count=missing_count,
            current_ats_score=current_ats_score,
            potential_ats_score=potential_ats_score
        )

        return {
            "overall_gap_summary": summary.model_dump(),
            "skills": [g.model_dump() for g in sorted_gaps],
            "recommended_learning_order": learning_order,
            "job_title": job_info.get("job_title") or "Target Role",
            "company_name": job_info.get("company_name"),
            "resume_filename": resume_doc.get("original_filename") or "Resume.pdf",
        }


gap_engine = SkillGapEngine()
