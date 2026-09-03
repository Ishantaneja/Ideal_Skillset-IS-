import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid

from app.models.roadmap import (
    RoadmapTaskItem,
    RoadmapProjectItem,
    RoadmapWeekItem,
)
from app.services.gap_engine import SKILL_TOPICS_CATALOG

logger = logging.getLogger("uvicorn.error")

# Predefined Real-World Projects Catalog matched to role profiles and skills
PROJECT_CATALOG: Dict[str, Dict[str, Any]] = {
    "SQL": {
        "title": "E-Commerce Customer Retention & Cohort SQL Analysis",
        "description": "Develop advanced SQL scripts using Window Functions, CTEs, and recursive queries to calculate Monthly Active Users (MAU), Customer Lifetime Value (LTV), and churn rates.",
        "skills": ["SQL", "PostgreSQL", "Data Modeling"],
        "tools": ["PostgreSQL", "DBeaver / pgAdmin", "GitHub"],
        "dataset_or_input": "100k+ records transactional e-commerce dataset (orders, customers, line items)",
        "expected_output": "Optimized SQL analytical scripts and cohort retention matrix report",
        "evidence_to_produce": "GitHub repository with documented schema, query benchmarks, and analytical insights README",
        "estimated_hours": 6,
        "portfolio_value": "High - Demonstrates analytical SQL optimization and business acumen"
    },
    "Power BI": {
        "title": "Executive KPI & Sales Revenue Power BI Dashboard",
        "description": "Construct an interactive executive dashboard using Star Schema modeling, custom DAX measures (CALCULATE, YoY Growth), and dynamic drill-through filters.",
        "skills": ["Power BI", "DAX", "Data Visualization", "SQL"],
        "tools": ["Power BI Desktop", "Power Query", "DAX Studio"],
        "dataset_or_input": "Multi-table ERP sales, target budget, and regional performance records",
        "expected_output": "Published interactive dashboard (.pbix) with executive summary view",
        "evidence_to_produce": "Interactive report link, screenshot portfolio artifact, and data model documentation",
        "estimated_hours": 6,
        "portfolio_value": "High - Direct proof of enterprise business intelligence delivery"
    },
    "Python": {
        "title": "Automated Data Processing & ETL Pipeline in Python",
        "description": "Architect a modular Python data pipeline that extracts dirty multi-source CSV/JSON feeds, performs vectorized transformations with Pandas, and loads structured tables.",
        "skills": ["Python", "Pandas", "NumPy", "Data Cleaning"],
        "tools": ["Python 3.11+", "Jupyter Notebook", "PyTest", "Git"],
        "dataset_or_input": "Raw real-world financial feeds with missing values and mismatched schemas",
        "expected_output": "Cleaned production dataset and automated pipeline script with unit tests",
        "evidence_to_produce": "GitHub repository with pipeline code, unit test coverage report, and EDA notebook",
        "estimated_hours": 7,
        "portfolio_value": "High - Proves production-grade data engineering capability"
    },
    "FastAPI": {
        "title": "Production-Grade RESTful Microservice with Auth & Caching",
        "description": "Build a high-performance asynchronous REST API in FastAPI with Pydantic V2 validation, JWT authentication, Redis caching, and automated Swagger documentation.",
        "skills": ["FastAPI", "Python", "JWT", "Redis", "PostgreSQL"],
        "tools": ["FastAPI", "Uvicorn", "Redis", "Docker", "Postman"],
        "dataset_or_input": "Simulated multi-tenant SaaS application backend requirements",
        "expected_output": "Fully containerized REST API endpoints with >90% test coverage",
        "evidence_to_produce": "GitHub repository with live API deployment link, OpenAPI specs, and Postman collection",
        "estimated_hours": 8,
        "portfolio_value": "Critical - Demonstrates backend engineering best practices"
    },
    "Docker": {
        "title": "Multi-Container Application Dockerization & Compose Stack",
        "description": "Containerize a full-stack web application with optimized multi-stage Dockerfiles, Docker Compose orchestrations, persistent volume mounts, and healthchecks.",
        "skills": ["Docker", "Docker Compose", "Linux", "DevOps"],
        "tools": ["Docker Engine", "Docker Compose", "Bash"],
        "dataset_or_input": "Polyglot application stack (Backend API + Database + Redis Cache + Frontend)",
        "expected_output": "Production-ready compose stack running with a single `docker compose up`",
        "evidence_to_produce": "GitHub repo with clean Dockerfiles, security scan report, and architecture diagram",
        "estimated_hours": 5,
        "portfolio_value": "High - Proves DevOps and deployment readiness"
    },
    "AWS": {
        "title": "Serverless Cloud Architecture on AWS",
        "description": "Deploy a serverless data ingestion workflow using AWS Lambda, S3 event triggers, API Gateway, and CloudWatch monitoring with least-privilege IAM roles.",
        "skills": ["AWS", "AWS Lambda", "S3", "IAM", "Cloud Architecture"],
        "tools": ["AWS Console / CLI", "Boto3 / Python", "Terraform / SAM"],
        "dataset_or_input": "Real-time webhook events simulated from external services",
        "expected_output": "Functional cloud architecture processing incoming payload events into S3",
        "evidence_to_produce": "Cloud architecture architecture diagram, IAC code repository, and CloudWatch logs proof",
        "estimated_hours": 7,
        "portfolio_value": "High - Directly satisfies cloud infrastructure requirements"
    },
    "React": {
        "title": "Responsive Enterprise Analytics SPA in React",
        "description": "Develop a responsive React dashboard featuring interactive charts, custom hook state management, optimistic UI updates, and dark/light theme switching.",
        "skills": ["React", "JavaScript", "Tailwind CSS", "REST API Integration"],
        "tools": ["Vite", "React 18+", "Tailwind CSS", "Chart.js / Recharts"],
        "dataset_or_input": "RESTful API data feed with real-time metrics",
        "expected_output": "Fast, accessible single-page web application",
        "evidence_to_produce": "Live Vercel/Netlify demo link and public GitHub repository",
        "estimated_hours": 6,
        "portfolio_value": "High - Proves frontend UI engineering capabilities"
    },
    "Machine Learning": {
        "title": "End-to-End Predictive Churn Model & API Deployment",
        "description": "Train and evaluate an ensemble classification model (Random Forest / XGBoost), tune hyperparameters, and wrap the inference pipeline in an interactive API.",
        "skills": ["Machine Learning", "Scikit-Learn", "Python", "Model Evaluation"],
        "tools": ["Scikit-Learn", "XGBoost", "FastAPI / Flask", "Jupyter"],
        "dataset_or_input": "Telecom customer churn benchmark dataset (7k+ records)",
        "expected_output": "Trained serialized model artifact (.joblib) with evaluation ROC-AUC metrics > 0.85",
        "evidence_to_produce": "GitHub repo with EDA notebook, model card, and live inference endpoint",
        "estimated_hours": 8,
        "portfolio_value": "High - Full lifecycle proof of data science deliverables"
    }
}


class RoadmapEngine:
    """
    Generates personalized, week-by-week actionable learning, practice, project,
    and interview readiness roadmaps based on prioritized skill gaps.
    """

    @classmethod
    def _create_task(
        cls,
        title: str,
        task_type: str,
        skill: str,
        hours: int,
        why: str,
        outcome: str,
        job_req: Optional[str] = None,
        ats_impact: Optional[str] = "High"
    ) -> RoadmapTaskItem:
        return RoadmapTaskItem(
            id=f"task_{uuid.uuid4().hex[:8]}",
            title=title,
            type=task_type,
            skill=skill,
            estimated_hours=hours,
            status="not_started",
            why_it_matters=why,
            expected_outcome=outcome,
            related_job_req=job_req or f"Required proficiency in {skill}",
            ats_impact=ats_impact
        )

    @classmethod
    def _get_project_for_skill(cls, skill_name: str, target_role: str) -> RoadmapProjectItem:
        proj_data = PROJECT_CATALOG.get(skill_name)
        if not proj_data:
            proj_data = {
                "title": f"Practical {skill_name} Portfolio Project",
                "description": f"Design and implement a real-world application showcasing end-to-end practical mastery of {skill_name} aligned with {target_role} deliverables.",
                "skills": [skill_name],
                "tools": [skill_name, "Git", "GitHub"],
                "dataset_or_input": "Industry standard simulation data",
                "expected_output": "Working application and clean documentation",
                "evidence_to_produce": "Public GitHub repository with README",
                "estimated_hours": 6,
                "portfolio_value": f"High - Direct evidence for {target_role}"
            }
        return RoadmapProjectItem(**proj_data)

    @classmethod
    def generate_roadmap(
        cls,
        resume_doc: Dict[str, Any],
        job_doc: Dict[str, Any],
        ats_result: Optional[Dict[str, Any]],
        skill_gap_result: Optional[Dict[str, Any]],
        duration_weeks: int = 4
    ) -> Dict[str, Any]:
        """
        Constructs a structured, personalized multi-week career roadmap.
        """
        # Constrain duration to supported options (1, 2, 4, 6, 8, 12)
        valid_durations = [1, 2, 4, 6, 8, 12]
        if duration_weeks not in valid_durations:
            duration_weeks = 4

        job_info = job_doc.get("job_info", {})
        target_role = job_info.get("job_title") or "Target Role"
        company_name = job_info.get("company_name")
        resume_filename = resume_doc.get("original_filename") or "Resume.pdf"

        # Baseline scores
        current_ats = ats_result.get("score", 70.0) if ats_result else 70.0

        # Prioritized missing skills list
        gaps_list = []
        if skill_gap_result:
            gaps_list = [s for s in skill_gap_result.get("skills", []) if s.get("gap", 0) > 0]
        if not gaps_list:
            # Fallback to job required skills
            job_req_skills = job_doc.get("requirements", {}).get("required_skills", [])
            gaps_list = [{"skill": s.get("name", "SQL"), "category": s.get("category", "General"), "gap": 2, "priority_score": 8.0, "ats_impact": 8.0, "current_level": 1} for s in job_req_skills]

        # Sort gaps primarily by priority_score descending
        sorted_gaps = sorted(gaps_list, key=lambda x: x.get("priority_score", 5.0), reverse=True)
        top_skills = [s.get("skill") for s in sorted_gaps]

        if not top_skills:
            top_skills = ["SQL", "Python", "Data Modeling"]

        weeks: List[RoadmapWeekItem] = []
        total_tasks = 0
        total_roadmap_hours = 0

        # Calculate estimated target score
        potential_gain = sum(s.get("ats_impact", 5.0) for s in sorted_gaps[:duration_weeks])
        estimated_target_score = min(100.0, round(current_ats + potential_gain, 1))

        # Generate each week's structured plan based on duration
        for w in range(1, duration_weeks + 1):
            is_final_week = (w == duration_weeks)

            if is_final_week and duration_weeks >= 2:
                # -------------------------------------------------------------
                # Final Week: Capstone Project, Interview Prep & Readiness Review
                # -------------------------------------------------------------
                primary_skill = top_skills[0] if top_skills else "Career Readiness"
                sec_skills = top_skills[1:3] if len(top_skills) > 1 else []
                week_title = f"Week {w}: Capstone Delivery & Interview Readiness"
                theme = "Comprehensive Project Polish & Mock Interview Simulation"

                goals = [
                    f"Finalize end-to-end portfolio project showcasing {primary_skill}",
                    "Update resume with quantified project achievement bullet points",
                    f"Complete technical and behavioral interview simulations for {target_role}",
                    "Recalculate verified Career Readiness Twin benchmark"
                ]

                tasks: List[RoadmapTaskItem] = [
                    cls._create_task(
                        title=f"Complete final code & documentation review for {primary_skill} project",
                        task_type="project",
                        skill=primary_skill,
                        hours=4,
                        why="Production code quality and clear documentation convince hiring managers of real-world ability.",
                        outcome="Polished GitHub repository with clean architecture and live demo.",
                        job_req=f"Demonstrated ability in {primary_skill}",
                        ats_impact="High"
                    ),
                    cls._create_task(
                        title="Draft and integrate quantified project bullets into resume",
                        task_type="resume",
                        skill=primary_skill,
                        hours=2,
                        why="Resumes with concrete metrics and evidence pass ATS and human recruiter review.",
                        outcome="Updated resume document with 2-3 new achievement bullet points.",
                        job_req="Proven track record in deliverables",
                        ats_impact="High"
                    ),
                    cls._create_task(
                        title=f"Practice 10 high-frequency {target_role} technical interview questions",
                        task_type="interview",
                        skill="Technical Communication",
                        hours=3,
                        why="Proves you can articulate architectural decisions and problem-solving under pressure.",
                        outcome="Confidently answer coding, query optimization, and system design questions.",
                        job_req=f"Core requirements for {target_role}",
                        ats_impact="Medium"
                    ),
                    cls._create_task(
                        title=f"Complete mock interview simulation on Ideal SkillSet",
                        task_type="interview",
                        skill="Interview Performance",
                        hours=2,
                        why="Live practice validates communication clarity and readiness twin benchmarks.",
                        outcome="Completed mock interview with AI feedback and scorecard.",
                        job_req="Professional readiness",
                        ats_impact="High"
                    ),
                    cls._create_task(
                        title="Upload project evidence artifacts & publish GitHub repository",
                        task_type="evidence",
                        skill=primary_skill,
                        hours=1,
                        why="Verified proof prevents recruiter skepticism and feeds your Readiness Twin.",
                        outcome="Public artifact link saved in Ideal SkillSet profile.",
                        job_req="Evidence of competency",
                        ats_impact="High"
                    )
                ]

                milestone = f"Independently complete and defend an end-to-end {primary_skill} project in a technical interview setting."
                week_project = cls._get_project_for_skill(primary_skill, target_role)

            else:
                # -------------------------------------------------------------
                # Core Skills Weeks (Week 1 to N-1)
                # -------------------------------------------------------------
                skill_idx = (w - 1) % max(len(top_skills), 1)
                primary_skill = top_skills[skill_idx]
                sec_skills = [s for s in top_skills if s != primary_skill][:2]

                # Match gap info
                current_gap_info = next((s for s in sorted_gaps if s.get("skill") == primary_skill), {})
                curr_level = current_gap_info.get("current_level", 1)

                topics = SKILL_TOPICS_CATALOG.get(primary_skill, [f"{primary_skill} Core Patterns", f"{primary_skill} Architecture", f"{primary_skill} Optimization"])
                topic_1 = topics[0] if len(topics) > 0 else f"{primary_skill} Core Architecture"
                topic_2 = topics[1] if len(topics) > 1 else f"{primary_skill} Advanced Features"
                topic_3 = topics[2] if len(topics) > 2 else f"{primary_skill} Real-World Optimization"

                week_title = f"Week {w}: Master {primary_skill} Foundations & Deliverables"
                theme = f"Intensive practical leveling in {primary_skill} for {target_role}"

                goals = [
                    f"Elevate {primary_skill} from level {curr_level} to practical proficiency",
                    f"Implement 10+ hands-on coding challenges in {topic_1}",
                    f"Build and test a real-world {primary_skill} business module"
                ]

                tasks = [
                    cls._create_task(
                        title=f"Study and implement {topic_1} in {primary_skill}",
                        task_type="learning",
                        skill=primary_skill,
                        hours=3,
                        why=f"Mandatory foundational concept frequently evaluated in {target_role} interviews.",
                        outcome=f"Clear understanding of {topic_1} syntax and design patterns.",
                        job_req=f"Proficiency in {primary_skill}",
                        ats_impact="High"
                    ),
                    cls._create_task(
                        title=f"Practice 15 hands-on challenges focused on {topic_2}",
                        task_type="practice",
                        skill=primary_skill,
                        hours=4,
                        why="Active problem solving builds muscular memory and speed.",
                        outcome=f"Independently solve complex {primary_skill} challenges without consulting documentation.",
                        job_req=f"Hands-on {primary_skill} experience",
                        ats_impact="High"
                    ),
                    cls._create_task(
                        title=f"Build and test {primary_skill} analytical module ({topic_3})",
                        task_type="project",
                        skill=primary_skill,
                        hours=5,
                        why="Translates conceptual syntax into tangible business deliverables.",
                        outcome=f"Working code module solving realistic {target_role} business problem.",
                        job_req=f"Production {primary_skill} implementation",
                        ats_impact="High"
                    ),
                    cls._create_task(
                        title=f"Document and commit {primary_skill} deliverables to GitHub",
                        task_type="evidence",
                        skill=primary_skill,
                        hours=1,
                        why="Creating verifiable evidence boosts candidate credibility and ATS ranking.",
                        outcome="Public GitHub repo commit with descriptive commit messages and README.",
                        job_req="Proof of work",
                        ats_impact="Medium"
                    ),
                    cls._create_task(
                        title=f"Complete {primary_skill} practical skill assessment check",
                        task_type="assessment",
                        skill=primary_skill,
                        hours=2,
                        why="Validates your skill progression and updates your readiness twin benchmark.",
                        outcome=f"Verified score on {primary_skill} benchmark assessment.",
                        job_req=f"Competency in {primary_skill}",
                        ats_impact="High"
                    )
                ]

                milestone = f"Achieve confident problem-solving ability in {primary_skill} ({topic_1} & {topic_2}) and deliver a working module."
                week_project = cls._get_project_for_skill(primary_skill, target_role)

            week_hours = sum(t.estimated_hours for t in tasks)
            total_roadmap_hours += week_hours
            total_tasks += len(tasks)

            weeks.append(RoadmapWeekItem(
                week=w,
                title=week_title,
                theme=theme,
                primary_skill=primary_skill,
                secondary_skills=sec_skills,
                goals=goals,
                tasks=tasks,
                project=week_project,
                milestone=milestone,
                estimated_hours=week_hours,
                week_progress=0.0,
                expected_readiness_impact=f"+{round(potential_gain / max(duration_weeks, 1), 1)}% estimated match boost"
            ))

        return {
            "title": f"{target_role} Job Readiness Roadmap ({duration_weeks} Weeks)",
            "target_role": target_role,
            "company_name": company_name,
            "resume_filename": resume_filename,
            "duration_weeks": duration_weeks,
            "current_ats_score": current_ats,
            "estimated_target_score": estimated_target_score,
            "overall_progress": 0.0,
            "total_hours": total_roadmap_hours,
            "completed_tasks_count": 0,
            "total_tasks_count": total_tasks,
            "weeks": [w.model_dump() for w in weeks],
            "status": "active"
        }

    @classmethod
    def recalculate_progress(cls, weeks_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Recalculates per-week progress and overall roadmap progress based on task statuses.
        """
        total_tasks = 0
        completed_tasks = 0

        for w in weeks_data:
            w_tasks = w.get("tasks", [])
            w_total = len(w_tasks)
            w_completed = sum(1 for t in w_tasks if t.get("status") == "completed")
            w_in_progress = sum(1 for t in w_tasks if t.get("status") == "in_progress")

            # In progress counts as 0.5
            w_score = (w_completed * 1.0 + w_in_progress * 0.5) / max(w_total, 1) * 100.0
            w["week_progress"] = round(w_score, 1)

            total_tasks += w_total
            completed_tasks += w_completed

        overall_pct = round((completed_tasks / max(total_tasks, 1)) * 100.0, 1)

        return {
            "overall_progress": overall_pct,
            "completed_tasks_count": completed_tasks,
            "total_tasks_count": total_tasks,
            "weeks": weeks_data
        }


roadmap_engine = RoadmapEngine()
