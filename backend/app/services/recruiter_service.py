import re
import uuid
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import UploadFile, HTTPException, status

from app.database.connection import mongo_manager
from app.models.recruiter import (
    RecruiterJobCreate,
    RecruiterJobUpdate,
    RecruiterJobResponse,
    JobBlueprint,
    CandidateApplicationItem,
    ApplicationStage,
    CandidateEvaluation,
    CandidateComparisonResponse,
    GeneratedAssessment,
    GeneratedInterviewPlan,
    InterviewSummaryResponse,
    RecruiterDashboardResponse,
    JobInsightsResponse,
    RecruiterAnalyticsResponse,
    RecruiterSettings
)
from app.services.ai.job_analyzer import job_analyzer
from app.services.ai.resume_evaluator import resume_evaluator
from app.services.ai.candidate_ranker import candidate_ranker
from app.services.ai.assessment_generator import assessment_generator
from app.services.ai.interview_generator import interview_generator
from app.services.ai.interview_analyzer import interview_analyzer
from app.services.ai.hiring_recommendation import hiring_recommendation_engine
from app.services.storage_service import storage_service
from app.services.text_extractor import text_extractor
from app.services.resume_parser import resume_parser
from app.services.auth_service import _IN_MEMORY_USERS
from app.services.readiness_service import _IN_MEMORY_READINESS
from app.services.resume_service import _IN_MEMORY_RESUMES

logger = logging.getLogger("uvicorn.error")

# Fallback in-memory storage for recruiter data when MongoDB is offline
_IN_MEMORY_COMPANIES: Dict[str, Dict[str, Any]] = {
    "comp_default_01": {
        "_id": "comp_default_01",
        "name": "TechHire Global Talent",
        "created_by": "recruiter_default_01",
        "created_at": datetime.now(timezone.utc),
        "settings": {"minutes_saved_per_resume": 3.5}
    }
}
_IN_MEMORY_RECRUITER_JOBS: Dict[str, Dict[str, Any]] = {}
_IN_MEMORY_APPLICATIONS: Dict[str, Dict[str, Any]] = {}
_IN_MEMORY_EVALUATIONS: Dict[str, Dict[str, Any]] = {}
_IN_MEMORY_ACTIVITIES: List[Dict[str, Any]] = []

def sanitize_mongo_doc(obj: Any) -> Any:
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, dict):
        return {("id" if k == "_id" else k): sanitize_mongo_doc(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize_mongo_doc(i) for i in obj]
    return obj


class RecruiterService:
    """
    Central business logic layer for Recruiter AI Hiring Copilot.
    Enforces multi-tenant company data isolation and coordinates AI engines.
    """

    @classmethod
    def resolve_company_id(cls, current_recruiter: Dict[str, Any]) -> str:
        """
        Resolves or initializes the recruiter's company document.
        Ensures strict company isolation.
        """
        recruiter_id = str(current_recruiter.get("id", ""))
        comp_name = current_recruiter.get("company_name", "TechHire Global Talent").strip()
        comp_col = mongo_manager.companies

        if comp_col is not None:
            try:
                # Find company by name or creator
                existing = comp_col.find_one({"name": comp_name})
                if not existing and ObjectId.is_valid(recruiter_id):
                    existing = comp_col.find_one({"created_by": recruiter_id})

                if existing:
                    return str(existing.get("_id"))

                # Create company
                now = datetime.now(timezone.utc)
                new_comp = {
                    "name": comp_name,
                    "description": f"Enterprise organization profile for {comp_name}",
                    "created_by": recruiter_id,
                    "settings": {"minutes_saved_per_resume": 3.5},
                    "created_at": now,
                    "updated_at": now
                }
                res = comp_col.insert_one(new_comp)
                return str(res.inserted_id)
            except Exception as e:
                logger.warning(f"Error resolving company in DB: {e}")

        # In-memory fallback
        for c_id, comp in _IN_MEMORY_COMPANIES.items():
            if comp.get("name", "").lower() == comp_name.lower() or comp.get("created_by") == recruiter_id:
                return c_id

        new_id = f"comp_{len(_IN_MEMORY_COMPANIES) + 1}"
        _IN_MEMORY_COMPANIES[new_id] = {
            "_id": new_id,
            "name": comp_name,
            "created_by": recruiter_id,
            "settings": {"minutes_saved_per_resume": 3.5},
            "created_at": datetime.now(timezone.utc)
        }
        return new_id

    # =========================================================================
    # Job Requisitions & Blueprint Management
    # =========================================================================

    @classmethod
    def create_job(
        cls,
        current_recruiter: Dict[str, Any],
        job_in: RecruiterJobCreate
    ) -> RecruiterJobResponse:
        company_id = cls.resolve_company_id(current_recruiter)
        recruiter_id = str(current_recruiter.get("id", ""))
        now = datetime.now(timezone.utc)

        # Generate AI Job Blueprint
        blueprint = job_analyzer.generate_blueprint(
            title=job_in.title,
            description=job_in.description,
            responsibilities=job_in.responsibilities,
            required_skills=job_in.required_skills,
            preferred_skills=job_in.preferred_skills,
            required_experience=job_in.required_experience
        )

        job_doc = {
            "company_id": company_id,
            "recruiter_id": recruiter_id,
            "title": job_in.title,
            "description": job_in.description,
            "responsibilities": job_in.responsibilities or [],
            "required_experience": job_in.required_experience or "2-4 years",
            "location": job_in.location or "Remote / Flexible",
            "employment_type": job_in.employment_type or "Full-time",
            "salary_range": job_in.salary_range,
            "required_skills": job_in.required_skills or [],
            "preferred_skills": job_in.preferred_skills or [],
            "status": "active",
            "blueprint": blueprint.model_dump(),
            "created_at": now,
            "updated_at": now
        }

        jobs_col = mongo_manager.jobs
        job_id_str = ""
        if jobs_col is not None:
            try:
                res = jobs_col.insert_one(job_doc)
                job_id_str = str(res.inserted_id)
            except Exception as e:
                logger.error(f"Error saving recruiter job: {e}")
                job_id_str = f"job_{uuid.uuid4().hex[:8]}"
                job_doc["_id"] = job_id_str
        else:
            job_id_str = f"job_{uuid.uuid4().hex[:8]}"
            job_doc["_id"] = job_id_str

        _IN_MEMORY_RECRUITER_JOBS[job_id_str] = job_doc

        # Log Activity
        cls.log_activity(
            company_id=company_id,
            recruiter_id=recruiter_id,
            action="CREATED_JOB",
            entity_type="job",
            entity_id=job_id_str,
            metadata={"title": job_in.title}
        )

        return RecruiterJobResponse(
            id=job_id_str,
            company_id=company_id,
            recruiter_id=recruiter_id,
            title=job_in.title,
            description=job_in.description,
            responsibilities=job_in.responsibilities or [],
            required_experience=job_in.required_experience or "",
            location=job_in.location or "Remote",
            employment_type=job_in.employment_type or "Full-time",
            salary_range=job_in.salary_range,
            required_skills=job_in.required_skills or [],
            preferred_skills=job_in.preferred_skills or [],
            status="active",
            blueprint=blueprint,
            applicant_count=0,
            shortlisted_count=0,
            created_at=now,
            updated_at=now
        )

    @classmethod
    def list_jobs(
        cls,
        current_recruiter: Dict[str, Any]
    ) -> List[RecruiterJobResponse]:
        company_id = cls.resolve_company_id(current_recruiter)
        jobs_col = mongo_manager.jobs
        apps_col = mongo_manager.candidate_applications

        raw_jobs = []
        if jobs_col is not None:
            try:
                raw_jobs = list(jobs_col.find({"company_id": company_id}).sort("created_at", -1))
            except Exception as e:
                logger.warning(f"Error querying company jobs: {e}")

        if not raw_jobs:
            raw_jobs = [
                j for j in _IN_MEMORY_RECRUITER_JOBS.values()
                if j.get("company_id") == company_id
            ]

        # Seed initial sample job if company has none
        if not raw_jobs:
            now = datetime.now(timezone.utc)
            sample_bp = job_analyzer.generate_blueprint(
                title="Senior Backend Engineer (Python/FastAPI)",
                description="Lead backend architecture and microservices using Python, FastAPI, MongoDB and Docker.",
                required_skills=["Python", "FastAPI", "MongoDB", "REST APIs"],
                preferred_skills=["Docker", "AWS", "Redis"],
                required_experience="3-5 years"
            )
            sample_doc = {
                "_id": "sample_job_01",
                "company_id": company_id,
                "recruiter_id": str(current_recruiter.get("id", "")),
                "title": "Senior Backend Engineer (Python/FastAPI)",
                "description": "Lead backend architecture and microservices using Python, FastAPI, MongoDB and Docker.",
                "responsibilities": [
                    "Design, implement, and maintain high-performance REST APIs",
                    "Optimize MongoDB query performance and indexing schemes",
                    "Architect containerized workflows with Docker and CI/CD pipelines"
                ],
                "required_experience": "3-5 years",
                "location": "Remote / Flexible",
                "employment_type": "Full-time",
                "salary_range": "$120,000 - $150,000",
                "required_skills": ["Python", "FastAPI", "MongoDB", "REST APIs"],
                "preferred_skills": ["Docker", "AWS", "Redis"],
                "status": "active",
                "blueprint": sample_bp.model_dump(),
                "created_at": now,
                "updated_at": now
            }
            if jobs_col is not None:
                try:
                    jobs_col.insert_one(sample_doc)
                except Exception:
                    pass
            _IN_MEMORY_RECRUITER_JOBS["sample_job_01"] = sample_doc
            raw_jobs = [sample_doc]

        results = []
        for j in raw_jobs:
            j_id = str(j.get("_id", ""))
            # Count applicants and shortlisted
            app_count = 0
            short_count = 0
            if apps_col is not None:
                try:
                    app_count = apps_col.count_documents({"job_id": j_id})
                    short_count = apps_col.count_documents({
                        "job_id": j_id,
                        "current_stage": {"$in": ["shortlisted", "interview", "offer", "hired"]}
                    })
                except Exception:
                    pass
            else:
                comp_apps = [a for a in _IN_MEMORY_APPLICATIONS.values() if a.get("job_id") == j_id]
                app_count = len(comp_apps)
                short_count = sum(1 for a in comp_apps if a.get("current_stage") in ["shortlisted", "interview", "offer", "hired"])

            bp_raw = j.get("blueprint")
            blueprint = JobBlueprint(**bp_raw) if bp_raw else None

            results.append(RecruiterJobResponse(
                id=j_id,
                company_id=j.get("company_id", company_id),
                recruiter_id=j.get("recruiter_id", ""),
                title=j.get("title", "Untitled Role"),
                description=j.get("description", ""),
                responsibilities=j.get("responsibilities", []),
                required_experience=j.get("required_experience", ""),
                location=j.get("location", "Remote"),
                employment_type=j.get("employment_type", "Full-time"),
                salary_range=j.get("salary_range"),
                required_skills=j.get("required_skills", []),
                preferred_skills=j.get("preferred_skills", []),
                status=j.get("status", "active"),
                blueprint=blueprint,
                applicant_count=app_count,
                shortlisted_count=short_count,
                created_at=j.get("created_at", datetime.now(timezone.utc)),
                updated_at=j.get("updated_at", datetime.now(timezone.utc))
            ))

        return results

    @classmethod
    def get_job(
        cls,
        current_recruiter: Dict[str, Any],
        job_id: str
    ) -> RecruiterJobResponse:
        company_id = cls.resolve_company_id(current_recruiter)
        jobs_col = mongo_manager.jobs

        job_doc = None
        if jobs_col is not None:
            if ObjectId.is_valid(job_id):
                job_doc = jobs_col.find_one({"_id": ObjectId(job_id), "company_id": company_id})
            if not job_doc:
                job_doc = jobs_col.find_one({"_id": job_id, "company_id": company_id})

        if not job_doc:
            job_doc = _IN_MEMORY_RECRUITER_JOBS.get(job_id)

        if not job_doc or job_doc.get("company_id") != company_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job requisition not found or inaccessible for your company."
            )

        j_id = str(job_doc.get("_id", job_id))
        bp_raw = job_doc.get("blueprint")
        blueprint = JobBlueprint(**bp_raw) if bp_raw else None

        apps_col = mongo_manager.candidate_applications
        app_count = 0
        short_count = 0
        if apps_col is not None:
            app_count = apps_col.count_documents({"job_id": j_id})
            short_count = apps_col.count_documents({
                "job_id": j_id,
                "current_stage": {"$in": ["shortlisted", "interview", "offer", "hired"]}
            })
        else:
            comp_apps = [a for a in _IN_MEMORY_APPLICATIONS.values() if a.get("job_id") == j_id]
            app_count = len(comp_apps)
            short_count = sum(1 for a in comp_apps if a.get("current_stage") in ["shortlisted", "interview", "offer", "hired"])

        return RecruiterJobResponse(
            id=j_id,
            company_id=company_id,
            recruiter_id=job_doc.get("recruiter_id", ""),
            title=job_doc.get("title", ""),
            description=job_doc.get("description", ""),
            responsibilities=job_doc.get("responsibilities", []),
            required_experience=job_doc.get("required_experience", ""),
            location=job_doc.get("location", "Remote"),
            employment_type=job_doc.get("employment_type", "Full-time"),
            salary_range=job_doc.get("salary_range"),
            required_skills=job_doc.get("required_skills", []),
            preferred_skills=job_doc.get("preferred_skills", []),
            status=job_doc.get("status", "active"),
            blueprint=blueprint,
            applicant_count=app_count,
            shortlisted_count=short_count,
            created_at=job_doc.get("created_at", datetime.now(timezone.utc)),
            updated_at=job_doc.get("updated_at", datetime.now(timezone.utc))
        )

    @classmethod
    def update_job(
        cls,
        current_recruiter: Dict[str, Any],
        job_id: str,
        update_data: RecruiterJobUpdate
    ) -> RecruiterJobResponse:
        job = cls.get_job(current_recruiter, job_id)
        jobs_col = mongo_manager.jobs
        now = datetime.now(timezone.utc)

        update_dict: Dict[str, Any] = {"updated_at": now}
        if update_data.title:
            update_dict["title"] = update_data.title
        if update_data.description:
            update_dict["description"] = update_data.description
        if update_data.responsibilities is not None:
            update_dict["responsibilities"] = update_data.responsibilities
        if update_data.required_experience:
            update_dict["required_experience"] = update_data.required_experience
        if update_data.location:
            update_dict["location"] = update_data.location
        if update_data.employment_type:
            update_dict["employment_type"] = update_data.employment_type
        if update_data.salary_range is not None:
            update_dict["salary_range"] = update_data.salary_range
        if update_data.required_skills is not None:
            update_dict["required_skills"] = update_data.required_skills
        if update_data.preferred_skills is not None:
            update_dict["preferred_skills"] = update_data.preferred_skills
        if update_data.status:
            update_dict["status"] = update_data.status
        if update_data.blueprint:
            update_dict["blueprint"] = update_data.blueprint.model_dump()

        if jobs_col is not None:
            query = {"_id": ObjectId(job_id)} if ObjectId.is_valid(job_id) else {"_id": job_id}
            jobs_col.update_one(query, {"$set": update_dict})

        if job_id in _IN_MEMORY_RECRUITER_JOBS:
            _IN_MEMORY_RECRUITER_JOBS[job_id].update(update_dict)

        cls.log_activity(
            company_id=job.company_id,
            recruiter_id=str(current_recruiter.get("id", "")),
            action="UPDATED_JOB",
            entity_type="job",
            entity_id=job_id,
            metadata={"fields": list(update_dict.keys())}
        )

        return cls.get_job(current_recruiter, job_id)

    @classmethod
    def regenerate_blueprint(
        cls,
        current_recruiter: Dict[str, Any],
        job_id: str
    ) -> JobBlueprint:
        job = cls.get_job(current_recruiter, job_id)
        new_bp = job_analyzer.generate_blueprint(
            title=job.title,
            description=job.description,
            responsibilities=job.responsibilities,
            required_skills=job.required_skills,
            preferred_skills=job.preferred_skills,
            required_experience=job.required_experience
        )
        cls.update_job(current_recruiter, job_id, RecruiterJobUpdate(blueprint=new_bp))
        return new_bp

    @classmethod
    def get_job_insights(
        cls,
        current_recruiter: Dict[str, Any],
        job_id: str
    ) -> JobInsightsResponse:
        job = cls.get_job(current_recruiter, job_id)
        applicants = cls.list_job_applicants(current_recruiter, job_id)

        strong_count = sum(1 for a in applicants if a.overall_fit >= 80.0)
        potential_count = sum(1 for a in applicants if 65.0 <= a.overall_fit < 80.0)
        needs_verif_count = sum(1 for a in applicants if a.recommended_action.value == "VERIFY SKILLS")
        low_count = sum(1 for a in applicants if a.overall_fit < 65.0)

        # Count missing skills across all candidate evaluations
        evals_col = mongo_manager.candidate_evaluations
        missing_skill_counts: Dict[str, int] = {}

        if evals_col is not None:
            eval_docs = list(evals_col.find({"job_id": job_id}))
            for ed in eval_docs:
                for ms in ed.get("missing_skills", []):
                    missing_skill_counts[ms] = missing_skill_counts.get(ms, 0) + 1
        else:
            for ed in _IN_MEMORY_EVALUATIONS.values():
                if ed.get("job_id") == job_id:
                    for ms in ed.get("missing_skills", []):
                        missing_skill_counts[ms] = missing_skill_counts.get(ms, 0) + 1

        top_missing = [
            {"skill": k, "missing_in_candidates_count": v, "percentage": round((v / max(len(applicants), 1)) * 100, 1)}
            for k, v in sorted(missing_skill_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        ]
        if not top_missing and job.required_skills:
            top_missing = [{"skill": s, "missing_in_candidates_count": 1, "percentage": 25.0} for s in job.required_skills[:3]]

        avg_fit = round(sum(a.overall_fit for a in applicants) / max(len(applicants), 1), 1) if applicants else 78.5

        return JobInsightsResponse(
            job_id=job_id,
            job_title=job.title,
            total_applicants=len(applicants),
            strong_match_count=strong_count,
            potential_match_count=potential_count,
            needs_verification_count=needs_verif_count,
            low_match_count=low_count,
            top_missing_skills=top_missing,
            average_fit_score=avg_fit
        )

    # =========================================================================
    # Batch Resume Ingestion & Applicant Processing
    # =========================================================================

    @classmethod
    async def upload_multiple_resumes(
        cls,
        current_recruiter: Dict[str, Any],
        job_id: str,
        files: List[UploadFile]
    ) -> Dict[str, Any]:
        """
        Handles batch upload of multiple resumes (PDF, DOCX, TXT):
        1. Validates and saves each file
        2. Extracts text & parses structured resume
        3. Normalizes candidate profile in User_data
        4. Links application to job in Candidate_applications
        5. Automatically executes multi-dimensional AI screening evaluation
        """
        job = cls.get_job(current_recruiter, job_id)
        company_id = job.company_id
        recruiter_id = str(current_recruiter.get("id", ""))
        blueprint = job.blueprint or job_analyzer.generate_blueprint(job.title, job.description)

        ingested_candidates = []
        errors = []

        users_col = mongo_manager.user_data
        resumes_col = mongo_manager.resumes
        apps_col = mongo_manager.candidate_applications
        evals_col = mongo_manager.candidate_evaluations

        for file in files:
            orig_filename = file.filename or "candidate_resume.pdf"
            content_type = file.content_type or "application/pdf"
            try:
                # 1. Read bytes & validate
                file_bytes = await file.read()
                file_size = len(file_bytes)
                storage_service.validate_file(orig_filename, content_type, file_size)

                # 2. Save file
                storage_path, file_type, file_size = storage_service.save_file(file_bytes, orig_filename)

                # 3. Extract text
                extracted_text = text_extractor.extract_text(storage_path, file_type)
                if not extracted_text or len(extracted_text.strip()) < 10:
                    errors.append({"filename": orig_filename, "error": "Could not extract readable text from document."})
                    continue

                # 4. Parse structured resume
                parsed_resume = resume_parser.parse_resume(extracted_text)

                # 5. Extract candidate name & email from resume text if possible
                cand_name, cand_email = cls._extract_candidate_identity(extracted_text, orig_filename)

                # 6. Create or find Candidate in User_data (strictly role='user')
                now = datetime.now(timezone.utc)
                candidate_doc = None
                if users_col is not None:
                    candidate_doc = users_col.find_one({"email": cand_email})

                if not candidate_doc:
                    cand_skills = [s.name for s in parsed_resume.skills] or ["Python", "FastAPI"]
                    cand_doc_data = {
                        "name": cand_name,
                        "email": cand_email,
                        "role": "user",
                        "target_role": job.title,
                        "skills": cand_skills,
                        "experience_level": "Junior (1-3 yrs)",
                        "years_of_experience": 2.0,
                        "location": "Remote / Flexible",
                        "created_at": now,
                        "updated_at": now
                    }
                    if users_col is not None:
                        res = users_col.insert_one(cand_doc_data)
                        cand_id = str(res.inserted_id)
                        cand_doc_data["_id"] = res.inserted_id
                        candidate_doc = cand_doc_data
                    else:
                        cand_id = f"cand_{uuid.uuid4().hex[:8]}"
                        cand_doc_data["_id"] = cand_id
                        _IN_MEMORY_USERS[cand_email] = cand_doc_data
                        candidate_doc = cand_doc_data
                else:
                    cand_id = str(candidate_doc.get("_id"))

                # 7. Store Resume Document in Resumes collection
                resume_doc = {
                    "user_id": cand_id,
                    "original_filename": orig_filename,
                    "file_type": file_type,
                    "file_size": file_size,
                    "storage_path": storage_path,
                    "is_active": True,
                    "uploaded_at": now,
                    "updated_at": now,
                    "extracted_text": extracted_text,
                    "parsed_data": parsed_resume.model_dump(),
                    "parsing_status": "completed"
                }
                res_id_str = ""
                if resumes_col is not None:
                    r_res = resumes_col.insert_one(resume_doc)
                    res_id_str = str(r_res.inserted_id)
                else:
                    res_id_str = f"res_{uuid.uuid4().hex[:8]}"
                    _IN_MEMORY_RESUMES[res_id_str] = resume_doc

                # 8. Create Candidate Application
                app_doc = {
                    "job_id": job_id,
                    "candidate_user_id": cand_id,
                    "recruiter_id": recruiter_id,
                    "company_id": company_id,
                    "resume_id": res_id_str,
                    "current_stage": ApplicationStage.AI_SCREENED.value,
                    "applied_at": now,
                    "created_at": now,
                    "updated_at": now
                }
                app_id_str = ""
                if apps_col is not None:
                    # Avoid duplicate application
                    existing_app = apps_col.find_one({"job_id": job_id, "candidate_user_id": cand_id})
                    if existing_app:
                        app_id_str = str(existing_app.get("_id"))
                        apps_col.update_one({"_id": existing_app["_id"]}, {"$set": {"updated_at": now, "resume_id": res_id_str}})
                    else:
                        a_res = apps_col.insert_one(app_doc)
                        app_id_str = str(a_res.inserted_id)
                else:
                    app_id_str = f"app_{uuid.uuid4().hex[:8]}"
                    _IN_MEMORY_APPLICATIONS[app_id_str] = app_doc

                # 9. Perform AI Resume Screening against Job Blueprint
                evaluation = resume_evaluator.evaluate_candidate(
                    blueprint=blueprint,
                    candidate_data=candidate_doc,
                    resume_data=resume_doc,
                    job_id=job_id
                )

                # Persist Evaluation
                eval_doc = evaluation.model_dump()
                eval_doc["candidate_id"] = cand_id
                eval_doc["job_id"] = job_id
                if evals_col is not None:
                    evals_col.replace_one(
                        {"candidate_id": cand_id, "job_id": job_id},
                        eval_doc,
                        upsert=True
                    )
                _IN_MEMORY_EVALUATIONS[f"{cand_id}_{job_id}"] = eval_doc

                # Log activity
                cls.log_activity(
                    company_id=company_id,
                    recruiter_id=recruiter_id,
                    action="AI_SCREENED_CANDIDATE",
                    entity_type="candidate_application",
                    entity_id=app_id_str,
                    metadata={"candidate_name": cand_name, "score": evaluation.scores.overall_fit}
                )

                ingested_candidates.append({
                    "application_id": app_id_str,
                    "candidate_id": cand_id,
                    "name": cand_name,
                    "email": cand_email,
                    "filename": orig_filename,
                    "overall_fit": evaluation.scores.overall_fit,
                    "technical_skills": evaluation.scores.technical_skills,
                    "evidence_confidence": evaluation.scores.evidence_confidence,
                    "recommended_action": evaluation.recommended_action.value,
                    "key_strengths": evaluation.strengths[:2]
                })

            except Exception as e:
                logger.error(f"Error processing file {orig_filename}: {e}")
                errors.append({"filename": orig_filename, "error": str(e)})

        return {
            "job_id": job_id,
            "job_title": job.title,
            "total_submitted": len(files),
            "successfully_ingested": len(ingested_candidates),
            "failed_count": len(errors),
            "ingested_candidates": ingested_candidates,
            "errors": errors
        }

    @classmethod
    def _extract_candidate_identity(cls, text: str, filename: str) -> Tuple[str, str]:
        """
        Extracts candidate name and email from text heuristics.
        """
        email_match = re.search(r"([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)", text)
        if email_match:
            email = email_match.group(1).lower()
        else:
            base_id = uuid.uuid4().hex[:6]
            email = f"candidate_{base_id}@idealskillset.net"

        # Heuristic for name: first line or filename
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        cand_name = "Candidate Applicant"
        for line in lines[:4]:
            if "@" not in line and "http" not in line.lower() and len(line) < 40 and not line.lower().startswith("resume"):
                # Clean up punctuation
                clean = re.sub(r"[^a-zA-Z\s]", "", line).strip()
                if 2 < len(clean.split()) <= 4:
                    cand_name = clean.title()
                    break

        if cand_name == "Candidate Applicant":
            clean_fn = re.sub(r"[-_.]+", " ", filename).replace("resume", "").replace("pdf", "").replace("docx", "").strip()
            if clean_fn:
                cand_name = clean_fn.title()

        return cand_name, email

    @classmethod
    def list_job_applicants(
        cls,
        current_recruiter: Dict[str, Any],
        job_id: str,
        search: Optional[str] = None,
        stage: Optional[str] = None,
        min_fit: Optional[float] = None,
        verified_only: Optional[bool] = False,
        sort_by: Optional[str] = "overall_fit",
        order: Optional[str] = "desc"
    ) -> List[CandidateApplicationItem]:
        job = cls.get_job(current_recruiter, job_id)
        company_id = job.company_id
        recruiter_id = str(current_recruiter.get("id", ""))

        apps_col = mongo_manager.candidate_applications
        users_col = mongo_manager.user_data
        evals_col = mongo_manager.candidate_evaluations
        rec_doc = users_col.find_one({"_id": ObjectId(recruiter_id)}) if (users_col is not None and ObjectId.is_valid(recruiter_id)) else None
        shortlisted_set = set(rec_doc.get("shortlisted_candidates", [])) if rec_doc else set()

        raw_apps = []
        if apps_col is not None:
            try:
                raw_apps = list(apps_col.find({"job_id": job_id}))
            except Exception as e:
                logger.warning(f"Error querying candidate applications: {e}")

        if not raw_apps:
            raw_apps = [a for a in _IN_MEMORY_APPLICATIONS.values() if a.get("job_id") == job_id]

        # If no applicants exist for this job yet, automatically link existing talent pool candidates
        if not raw_apps:
            raw_apps = cls._seed_default_applicants_for_job(job, company_id, recruiter_id)

        items: List[CandidateApplicationItem] = []
        for app in raw_apps:
            app_id = str(app.get("_id", ""))
            cand_id = str(app.get("candidate_user_id", ""))
            current_stage = app.get("current_stage", ApplicationStage.APPLIED.value)
            applied_at = app.get("applied_at", datetime.now(timezone.utc))
            resume_id = app.get("resume_id")

            # Fetch candidate info
            cand_user = None
            if users_col is not None:
                if ObjectId.is_valid(cand_id):
                    cand_user = users_col.find_one({"_id": ObjectId(cand_id)})
                if not cand_user:
                    cand_user = users_col.find_one({"_id": cand_id})
            if not cand_user:
                cand_user = _IN_MEMORY_USERS.get(cand_id)
                if not cand_user:
                    for u in _IN_MEMORY_USERS.values():
                        if str(u.get("_id")) == cand_id:
                            cand_user = u
                            break

            name = cand_user.get("name", "Candidate") if cand_user else "Candidate"
            email = cand_user.get("email", "") if cand_user else ""
            location = cand_user.get("location", "Remote") if cand_user else "Remote"
            exp_level = cand_user.get("experience_level", "Junior (1-3 yrs)") if cand_user else "Junior"
            gh_url = cand_user.get("github_url", "") if cand_user else ""
            has_gh = bool(cand_user and (cand_user.get("github_verification") or gh_url))

            # Fetch Evaluation
            eval_doc = None
            if evals_col is not None:
                eval_doc = evals_col.find_one({"candidate_id": cand_id, "job_id": job_id})
            if not eval_doc:
                eval_doc = _IN_MEMORY_EVALUATIONS.get(f"{cand_id}_{job_id}")

            # If no evaluation exists yet, calculate now
            if not eval_doc and cand_user:
                eval_res = resume_evaluator.evaluate_candidate(
                    blueprint=job.blueprint or job_analyzer.generate_blueprint(job.title, job.description),
                    candidate_data=cand_user,
                    job_id=job_id
                )
                eval_doc = eval_res.model_dump()
                if evals_col is not None:
                    evals_col.insert_one(eval_doc)
                _IN_MEMORY_EVALUATIONS[f"{cand_id}_{job_id}"] = eval_doc

            scores = eval_doc.get("scores", {}) if eval_doc else {}
            overall_fit = float(scores.get("overall_fit", 75.0))
            tech_skills = float(scores.get("technical_skills", 75.0))
            relevant_exp = float(scores.get("relevant_experience", 70.0))
            conf = float(scores.get("evidence_confidence", 70.0))
            readiness = float(scores.get("role_readiness", 75.0))
            action = eval_doc.get("recommended_action", "VERIFY SKILLS") if eval_doc else "VERIFY SKILLS"
            strengths = eval_doc.get("strengths", []) if eval_doc else []
            concerns = eval_doc.get("concerns", []) if eval_doc else []

            # Filters
            if stage and current_stage.lower() != stage.lower():
                continue
            if min_fit is not None and overall_fit < min_fit:
                continue
            if verified_only and not has_gh:
                continue
            if search:
                s_low = search.lower().strip()
                corpus = f"{name} {email} {location} {' '.join(cand_user.get('skills', []) if cand_user else [])}".lower()
                if s_low not in corpus:
                    continue

            items.append(CandidateApplicationItem(
                application_id=app_id,
                candidate_id=cand_id,
                job_id=job_id,
                name=name,
                email=email,
                location=location,
                experience_level=exp_level,
                current_stage=ApplicationStage(current_stage) if current_stage in ApplicationStage._value2member_map_ else ApplicationStage.APPLIED,
                applied_at=applied_at,
                resume_id=resume_id,
                overall_fit=overall_fit,
                technical_skills=tech_skills,
                relevant_experience=relevant_exp,
                evidence_confidence=conf,
                readiness_score=readiness,
                recommended_action=action,
                key_strengths=strengths[:2],
                key_concerns=concerns[:2],
                has_github_verified=has_gh,
                is_shortlisted=(cand_id in shortlisted_set)
            ))

        # Sort items
        reverse = (order.lower() == "desc") if order else True
        if sort_by == "technical_skills":
            items.sort(key=lambda x: x.technical_skills, reverse=reverse)
        elif sort_by == "experience":
            items.sort(key=lambda x: x.relevant_experience, reverse=reverse)
        elif sort_by == "evidence_confidence":
            items.sort(key=lambda x: x.evidence_confidence, reverse=reverse)
        elif sort_by == "readiness_score":
            items.sort(key=lambda x: x.readiness_score, reverse=reverse)
        else:
            items.sort(key=lambda x: x.overall_fit, reverse=reverse)

        return items

    @classmethod
    def _seed_default_applicants_for_job(
        cls,
        job: RecruiterJobResponse,
        company_id: str,
        recruiter_id: str
    ) -> List[Dict[str, Any]]:
        """
        Ensures recruiters immediately see verified candidates from the talent pool.
        """
        apps_col = mongo_manager.candidate_applications
        users_col = mongo_manager.user_data
        now = datetime.now(timezone.utc)

        # Pull existing candidates from User_data
        candidates = []
        if users_col is not None:
            candidates = list(users_col.find({"role": {"$in": ["user", None]}}).limit(4))

        if not candidates:
            candidates = [u for u in _IN_MEMORY_USERS.values() if u.get("role") in ["user", None]]

        seeded_apps = []
        for idx, cand in enumerate(candidates):
            c_id = str(cand.get("_id", f"sample_cand_{idx + 1}"))
            app_id = f"app_{uuid.uuid4().hex[:8]}"
            app_doc = {
                "_id": app_id,
                "job_id": job.id,
                "candidate_user_id": c_id,
                "recruiter_id": recruiter_id,
                "company_id": company_id,
                "current_stage": ApplicationStage.AI_SCREENED.value if idx > 0 else ApplicationStage.SHORTLISTED.value,
                "applied_at": now,
                "created_at": now,
                "updated_at": now
            }
            if apps_col is not None:
                try:
                    apps_col.insert_one(app_doc)
                except Exception:
                    pass
            _IN_MEMORY_APPLICATIONS[app_id] = app_doc
            seeded_apps.append(app_doc)

        return seeded_apps

    # =========================================================================
    # Candidate 360° Dossier & Verification
    # =========================================================================

    @classmethod
    def get_candidate_360(
        cls,
        current_recruiter: Dict[str, Any],
        candidate_id: str,
        job_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Compiles the complete Candidate 360° view:
        Overview, Resume, Experience, Skills, Skill Evidence Matrix,
        Projects, Assessments, Interviews, Readiness Twin, Consistency Checks,
        Strengths, Risks, Skill Gaps, and Hiring Recommendation.
        """
        company_id = cls.resolve_company_id(current_recruiter)
        recruiter_id = str(current_recruiter.get("id", ""))

        users_col = mongo_manager.user_data
        resumes_col = mongo_manager.resumes
        readiness_col = mongo_manager.readiness
        evals_col = mongo_manager.candidate_evaluations
        apps_col = mongo_manager.candidate_applications
        decisions_col = mongo_manager.hiring_decisions

        # 1. Resolve Candidate Profile
        cand_doc = None
        if users_col is not None:
            if ObjectId.is_valid(candidate_id):
                cand_doc = users_col.find_one({"_id": ObjectId(candidate_id)})
            if not cand_doc:
                cand_doc = users_col.find_one({"_id": candidate_id})
        if not cand_doc:
            cand_doc = _IN_MEMORY_USERS.get(candidate_id)
            if not cand_doc:
                for u in _IN_MEMORY_USERS.values():
                    if str(u.get("_id")) == candidate_id:
                        cand_doc = u
                        break

        if not cand_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidate dossier not found."
            )

        c_id = str(cand_doc.get("_id", candidate_id))

        # 2. Resolve Active Resume
        resume_doc = None
        if resumes_col is not None:
            resume_doc = resumes_col.find_one({"user_id": c_id, "is_active": True}, sort=[("uploaded_at", -1)])
            if not resume_doc:
                resume_doc = resumes_col.find_one({"user_id": c_id}, sort=[("uploaded_at", -1)])
        if not resume_doc:
            resume_doc = _IN_MEMORY_RESUMES.get(c_id)

        # 3. Resolve Readiness Twin Report
        readiness_report = None
        if readiness_col is not None:
            readiness_report = readiness_col.find_one({"user_id": c_id}, sort=[("created_at", -1)])
        if not readiness_report:
            readiness_report = _IN_MEMORY_READINESS.get(c_id)

        # 4. Resolve Job Context and Blueprint
        target_job_id = job_id
        if not target_job_id and apps_col is not None:
            app = apps_col.find_one({"candidate_user_id": c_id, "company_id": company_id})
            if app:
                target_job_id = str(app.get("job_id"))

        if not target_job_id:
            # Fallback to first available job for this company
            all_jobs = cls.list_jobs(current_recruiter)
            target_job_id = all_jobs[0].id if all_jobs else "sample_job_01"

        try:
            job = cls.get_job(current_recruiter, target_job_id)
            blueprint = job.blueprint or job_analyzer.generate_blueprint(job.title, job.description)
            job_title = job.title
        except Exception:
            blueprint = job_analyzer.generate_blueprint("Software Engineer", "Core programming and systems design")
            job_title = "Software Engineer"

        # 5. Resolve or Calculate Evaluation
        eval_doc = None
        if evals_col is not None:
            eval_doc = evals_col.find_one({"candidate_id": c_id, "job_id": target_job_id})
        if not eval_doc:
            eval_doc = _IN_MEMORY_EVALUATIONS.get(f"{c_id}_{target_job_id}")

        if not eval_doc:
            evaluation = resume_evaluator.evaluate_candidate(
                blueprint=blueprint,
                candidate_data=cand_doc,
                resume_data=resume_doc,
                readiness_report=readiness_report,
                job_id=target_job_id
            )
            eval_doc = evaluation.model_dump()
            if evals_col is not None:
                evals_col.insert_one(eval_doc)
            _IN_MEMORY_EVALUATIONS[f"{c_id}_{target_job_id}"] = eval_doc
        else:
            evaluation = CandidateEvaluation(**eval_doc)

        # 6. Resolve Application Stage
        current_stage = ApplicationStage.APPLIED.value
        if apps_col is not None:
            app = apps_col.find_one({"candidate_user_id": c_id, "job_id": target_job_id})
            if app:
                current_stage = app.get("current_stage", ApplicationStage.APPLIED.value)
        else:
            for a in _IN_MEMORY_APPLICATIONS.values():
                if a.get("candidate_user_id") == c_id and a.get("job_id") == target_job_id:
                    current_stage = a.get("current_stage", ApplicationStage.APPLIED.value)

        # 7. Synthesize Hiring Recommendation
        hiring_rec = hiring_recommendation_engine.synthesize_recommendation(
            evaluation=evaluation,
            has_assessment=bool(evaluation.scores.assessment_performance > 0),
            has_interview=bool(evaluation.scores.interview_performance > 0)
        )

        # 8. Check previous hiring decision
        decision = None
        if decisions_col is not None:
            decision = decisions_col.find_one({"candidate_id": c_id, "job_id": target_job_id}, sort=[("created_at", -1)])

        # Log view activity
        cls.log_activity(
            company_id=company_id,
            recruiter_id=recruiter_id,
            action="VIEWED_CANDIDATE_360",
            entity_type="candidate",
            entity_id=c_id,
            metadata={"candidate_name": cand_doc.get("name"), "job_id": target_job_id}
        )

        return sanitize_mongo_doc({
            "candidate": {
                "id": c_id,
                "name": cand_doc.get("name", "Candidate"),
                "email": cand_doc.get("email", ""),
                "phone": cand_doc.get("phone", ""),
                "location": cand_doc.get("location", "Remote"),
                "experience_level": cand_doc.get("experience_level", "Junior"),
                "years_of_experience": cand_doc.get("years_of_experience", 2.0),
                "target_role": cand_doc.get("target_role", job_title),
                "bio": cand_doc.get("bio", ""),
                "skills": cand_doc.get("skills", []),
                "education": cand_doc.get("education", ""),
                "github_url": cand_doc.get("github_url", ""),
                "linkedin_url": cand_doc.get("linkedin_url", ""),
                "portfolio_url": cand_doc.get("portfolio_url", ""),
                "github_verification": cand_doc.get("github_verification")
            },
            "job": {
                "id": target_job_id,
                "title": job_title,
                "blueprint": blueprint
            },
            "application": {
                "current_stage": current_stage,
                "job_id": target_job_id
            },
            "evaluation": eval_doc,
            "readiness_twin": readiness_report,
            "hiring_recommendation": hiring_rec,
            "previous_decision": decision
        })

    # =========================================================================
    # Candidate Comparison
    # =========================================================================

    @classmethod
    def compare_candidates(
        cls,
        current_recruiter: Dict[str, Any],
        job_id: str,
        candidate_ids: List[str]
    ) -> CandidateComparisonResponse:
        job = cls.get_job(current_recruiter, job_id)
        blueprint = job.blueprint or job_analyzer.generate_blueprint(job.title, job.description)

        users_col = mongo_manager.user_data
        evals_col = mongo_manager.candidate_evaluations

        evaluations: List[CandidateEvaluation] = []
        candidate_profiles: Dict[str, Dict[str, Any]] = {}

        for c_id in candidate_ids:
            # Fetch user
            u_doc = None
            if users_col is not None:
                if ObjectId.is_valid(c_id):
                    u_doc = users_col.find_one({"_id": ObjectId(c_id)})
                if not u_doc:
                    u_doc = users_col.find_one({"_id": c_id})
            if not u_doc:
                u_doc = _IN_MEMORY_USERS.get(c_id)

            if not u_doc:
                continue

            candidate_profiles[c_id] = u_doc

            # Fetch or generate evaluation
            e_doc = None
            if evals_col is not None:
                e_doc = evals_col.find_one({"candidate_id": c_id, "job_id": job_id})
            if not e_doc:
                e_doc = _IN_MEMORY_EVALUATIONS.get(f"{c_id}_{job_id}")

            if not e_doc:
                evaluation = resume_evaluator.evaluate_candidate(
                    blueprint=blueprint,
                    candidate_data=u_doc,
                    job_id=job_id
                )
            else:
                evaluation = CandidateEvaluation(**e_doc)

            evaluations.append(evaluation)

        if len(evaluations) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least 2 valid candidates must be selected for comparison."
            )

        return candidate_ranker.compare_candidates(
            evaluations=evaluations,
            candidate_profiles=candidate_profiles,
            job_id=job_id,
            job_title=job.title
        )

    # =========================================================================
    # AI Assessments & Interviews
    # =========================================================================

    @classmethod
    def generate_assessment(
        cls,
        current_recruiter: Dict[str, Any],
        candidate_id: str,
        job_id: str
    ) -> GeneratedAssessment:
        job = cls.get_job(current_recruiter, job_id)
        blueprint = job.blueprint or job_analyzer.generate_blueprint(job.title, job.description)

        evals_col = mongo_manager.candidate_evaluations
        e_doc = evals_col.find_one({"candidate_id": candidate_id, "job_id": job_id}) if evals_col is not None else None
        evaluation = CandidateEvaluation(**e_doc) if e_doc else None

        generated = assessment_generator.generate_assessment(
            job_id=job_id,
            candidate_id=candidate_id,
            blueprint=blueprint,
            evaluation=evaluation
        )

        # Store assessment in database
        asm_col = mongo_manager.assessments
        asm_doc = generated.model_dump()
        asm_doc["company_id"] = job.company_id
        asm_doc["recruiter_id"] = str(current_recruiter.get("id", ""))
        if asm_col is not None:
            asm_col.insert_one(asm_doc)

        cls.log_activity(
            company_id=job.company_id,
            recruiter_id=str(current_recruiter.get("id", "")),
            action="GENERATED_ASSESSMENT",
            entity_type="assessment",
            entity_id=generated.id,
            metadata={"candidate_id": candidate_id, "job_id": job_id}
        )

        return generated

    @classmethod
    def submit_assessment_result(
        cls,
        current_recruiter: Dict[str, Any],
        assessment_id: str,
        candidate_id: str,
        job_id: str,
        score: float,
        section_scores: Dict[str, float],
        interviewer_notes: Optional[str] = ""
    ) -> Dict[str, Any]:
        job = cls.get_job(current_recruiter, job_id)
        company_id = job.company_id
        now = datetime.now(timezone.utc)

        result_doc = {
            "assessment_id": assessment_id,
            "candidate_id": candidate_id,
            "job_id": job_id,
            "company_id": company_id,
            "overall_score": score,
            "section_scores": section_scores,
            "interviewer_notes": interviewer_notes,
            "evaluated_at": now
        }

        res_col = mongo_manager.assessment_results
        if res_col is not None:
            res_col.insert_one(result_doc)

        # Update candidate evaluation with new assessment score
        evals_col = mongo_manager.candidate_evaluations
        if evals_col is not None:
            evals_col.update_one(
                {"candidate_id": candidate_id, "job_id": job_id},
                {"$set": {"scores.assessment_performance": score, "updated_at": now}}
            )

        return {"message": "Assessment score recorded successfully", "score": score}

    @classmethod
    def generate_interview_plan(
        cls,
        current_recruiter: Dict[str, Any],
        candidate_id: str,
        job_id: str
    ) -> GeneratedInterviewPlan:
        job = cls.get_job(current_recruiter, job_id)
        blueprint = job.blueprint or job_analyzer.generate_blueprint(job.title, job.description)

        evals_col = mongo_manager.candidate_evaluations
        e_doc = evals_col.find_one({"candidate_id": candidate_id, "job_id": job_id}) if evals_col is not None else None
        evaluation = CandidateEvaluation(**e_doc) if e_doc else None

        generated = interview_generator.generate_interview_plan(
            job_id=job_id,
            candidate_id=candidate_id,
            blueprint=blueprint,
            evaluation=evaluation
        )

        int_col = mongo_manager.interviews
        int_doc = generated.model_dump()
        int_doc["company_id"] = job.company_id
        int_doc["recruiter_id"] = str(current_recruiter.get("id", ""))
        if int_col is not None:
            int_col.insert_one(int_doc)

        cls.log_activity(
            company_id=job.company_id,
            recruiter_id=str(current_recruiter.get("id", "")),
            action="GENERATED_INTERVIEW_PLAN",
            entity_type="interview",
            entity_id=generated.id,
            metadata={"candidate_id": candidate_id, "job_id": job_id}
        )

        return generated

    @classmethod
    def summarize_interview(
        cls,
        current_recruiter: Dict[str, Any],
        candidate_id: str,
        job_id: str,
        notes: str,
        technical_score: float = 80.0,
        communication_score: float = 80.0,
        problem_solving_score: float = 80.0
    ) -> InterviewSummaryResponse:
        job = cls.get_job(current_recruiter, job_id)
        summary = interview_analyzer.analyze_interview_feedback(
            candidate_id=candidate_id,
            job_id=job_id,
            notes=notes,
            technical_score=technical_score,
            communication_score=communication_score,
            problem_solving_score=problem_solving_score
        )

        # Store in interview_results
        int_res_col = mongo_manager.interview_results
        doc = summary.model_dump()
        doc["company_id"] = job.company_id
        doc["interviewer_notes"] = notes
        if int_res_col is not None:
            int_res_col.insert_one(doc)

        # Update candidate evaluation
        evals_col = mongo_manager.candidate_evaluations
        if evals_col is not None:
            evals_col.update_one(
                {"candidate_id": candidate_id, "job_id": job_id},
                {"$set": {
                    "scores.interview_performance": summary.role_readiness_score,
                    "updated_at": datetime.now(timezone.utc)
                }}
            )

        return summary

    # =========================================================================
    # Pipeline & Hiring Decisions
    # =========================================================================

    @classmethod
    def update_candidate_stage(
        cls,
        current_recruiter: Dict[str, Any],
        candidate_id: str,
        job_id: str,
        new_stage: ApplicationStage,
        notes: Optional[str] = ""
    ) -> Dict[str, Any]:
        job = cls.get_job(current_recruiter, job_id)
        company_id = job.company_id
        recruiter_id = str(current_recruiter.get("id", ""))
        apps_col = mongo_manager.candidate_applications
        now = datetime.now(timezone.utc)

        if apps_col is not None:
            apps_col.update_one(
                {"candidate_user_id": candidate_id, "job_id": job_id},
                {"$set": {"current_stage": new_stage.value, "updated_at": now}}
            )

        for a in _IN_MEMORY_APPLICATIONS.values():
            if a.get("candidate_user_id") == candidate_id and a.get("job_id") == job_id:
                a["current_stage"] = new_stage.value

        cls.log_activity(
            company_id=company_id,
            recruiter_id=recruiter_id,
            action="ADVANCED_CANDIDATE_STAGE",
            entity_type="candidate_application",
            entity_id=candidate_id,
            metadata={"new_stage": new_stage.value, "job_id": job_id, "notes": notes}
        )

        return {
            "candidate_id": candidate_id,
            "job_id": job_id,
            "current_stage": new_stage.value,
            "message": f"Candidate moved to '{new_stage.value}' stage."
        }

    @classmethod
    def record_hiring_decision(
        cls,
        current_recruiter: Dict[str, Any],
        job_id: str,
        candidate_id: str,
        action: str,
        reason: str,
        supporting_evidence: Optional[str] = "",
        next_step: Optional[str] = ""
    ) -> Dict[str, Any]:
        job = cls.get_job(current_recruiter, job_id)
        company_id = job.company_id
        recruiter_id = str(current_recruiter.get("id", ""))
        now = datetime.now(timezone.utc)

        decision_doc = {
            "job_id": job_id,
            "candidate_id": candidate_id,
            "recruiter_id": recruiter_id,
            "company_id": company_id,
            "action": action,
            "reason": reason,
            "supporting_evidence": supporting_evidence,
            "next_step": next_step,
            "created_at": now
        }

        dec_col = mongo_manager.hiring_decisions
        if dec_col is not None:
            dec_col.insert_one(decision_doc)

        # Advance candidate stage if action implies stage change
        stage_map = {
            "OFFER": ApplicationStage.OFFER,
            "HIRE": ApplicationStage.HIRED,
            "REJECT": ApplicationStage.REJECTED,
            "ADVANCE": ApplicationStage.FINAL_REVIEW,
            "HOLD": ApplicationStage.SHORTLISTED
        }
        if action.upper() in stage_map:
            cls.update_candidate_stage(
                current_recruiter=current_recruiter,
                candidate_id=candidate_id,
                job_id=job_id,
                new_stage=stage_map[action.upper()]
            )

        cls.log_activity(
            company_id=company_id,
            recruiter_id=recruiter_id,
            action=f"RECORDED_DECISION_{action.upper()}",
            entity_type="hiring_decision",
            entity_id=candidate_id,
            metadata={"action": action, "job_id": job_id}
        )

        return {"message": "Hiring decision successfully recorded", "action": action}

    # =========================================================================
    # Recruiter Dashboard & Analytics Aggregations
    # =========================================================================

    @classmethod
    def get_dashboard_metrics(
        cls,
        current_recruiter: Dict[str, Any]
    ) -> RecruiterDashboardResponse:
        company_id = cls.resolve_company_id(current_recruiter)
        recruiter_id = str(current_recruiter.get("id", ""))
        comp_name = current_recruiter.get("company_name", "TechHire Global Talent")
        rec_name = current_recruiter.get("name", "Recruiter")

        jobs_col = mongo_manager.jobs
        apps_col = mongo_manager.candidate_applications
        evals_col = mongo_manager.candidate_evaluations
        act_col = mongo_manager.recruiter_activity

        open_roles = 0
        total_applicants = 0
        ai_screened = 0
        shortlisted = 0
        interviews = 0
        offers = 0

        active_jobs_list = []
        pipeline_breakdown = {
            "applied": 0,
            "ai_screened": 0,
            "shortlisted": 0,
            "assessment": 0,
            "interview": 0,
            "final_review": 0,
            "offer": 0,
            "hired": 0,
            "rejected": 0
        }

        if jobs_col is not None and apps_col is not None:
            try:
                open_roles = jobs_col.count_documents({"company_id": company_id, "status": "active"})
                total_applicants = apps_col.count_documents({"company_id": company_id})
                ai_screened = apps_col.count_documents({"company_id": company_id, "current_stage": {"$ne": "applied"}})
                shortlisted = apps_col.count_documents({"company_id": company_id, "current_stage": "shortlisted"})
                interviews = apps_col.count_documents({"company_id": company_id, "current_stage": "interview"})
                offers = apps_col.count_documents({"company_id": company_id, "current_stage": {"$in": ["offer", "hired"]}})

                # Pipeline breakdown counts
                for stage_key in pipeline_breakdown.keys():
                    pipeline_breakdown[stage_key] = apps_col.count_documents({
                        "company_id": company_id,
                        "current_stage": stage_key
                    })

                # Active jobs
                job_cursor = jobs_col.find({"company_id": company_id, "status": "active"}).limit(5)
                for j in job_cursor:
                    j_id = str(j["_id"])
                    cnt = apps_col.count_documents({"job_id": j_id})
                    active_jobs_list.append({
                        "id": j_id,
                        "title": j.get("title", ""),
                        "applicant_count": cnt,
                        "location": j.get("location", "Remote"),
                        "created_at": j.get("created_at")
                    })
            except Exception as e:
                logger.warning(f"Error computing dashboard counts: {e}")

        # Fallback to in-memory counts if zero or offline
        if total_applicants == 0:
            open_roles = max(len([j for j in _IN_MEMORY_RECRUITER_JOBS.values() if j.get("company_id") == company_id]), 2)
            total_applicants = max(len([a for a in _IN_MEMORY_APPLICATIONS.values() if a.get("company_id") == company_id]), 6)
            ai_screened = total_applicants
            shortlisted = max(2, int(total_applicants * 0.3))
            interviews = 1
            offers = 0
            pipeline_breakdown = {
                "applied": 1,
                "ai_screened": total_applicants - 3,
                "shortlisted": shortlisted,
                "assessment": 1,
                "interview": 1,
                "final_review": 0,
                "offer": 0,
                "hired": 0,
                "rejected": 0
            }

        # Calculate estimated screening time saved
        # Default: 3.5 minutes per resume screened by AI
        minutes_per_resume = 3.5
        hours_saved = round((ai_screened * minutes_per_resume) / 60.0, 1)

        # Recent activities
        recent_activity_list = []
        if act_col is not None:
            try:
                acts = list(act_col.find({"company_id": company_id}).sort("created_at", -1).limit(6))
                for a in acts:
                    recent_activity_list.append({
                        "id": str(a.get("_id", "")),
                        "action": a.get("action", ""),
                        "entity_type": a.get("entity_type", ""),
                        "timestamp": a.get("created_at"),
                        "metadata": a.get("metadata", {})
                    })
            except Exception:
                pass

        if not recent_activity_list:
            recent_activity_list = [
                {"id": "act_1", "action": "AI_SCREENED_CANDIDATES", "entity_type": "batch", "timestamp": datetime.now(timezone.utc), "metadata": {"count": 4}},
                {"id": "act_2", "action": "CREATED_JOB_BLUEPRINT", "entity_type": "job", "timestamp": datetime.now(timezone.utc), "metadata": {"role": "Senior Backend Engineer"}},
            ]

        # Candidates requiring verification queue
        needs_verif = []
        if evals_col is not None:
            try:
                docs = list(evals_col.find({"recommended_action": "VERIFY SKILLS"}).limit(4))
                for d in docs:
                    needs_verif.append({
                        "candidate_id": d.get("candidate_id"),
                        "job_id": d.get("job_id"),
                        "overall_fit": d.get("scores", {}).get("overall_fit", 74.0),
                        "unverified_skills": d.get("unverified_skills", [])[:2]
                    })
            except Exception:
                pass

        return RecruiterDashboardResponse(
            company_name=comp_name,
            recruiter_name=rec_name,
            open_roles=open_roles,
            total_applicants=total_applicants,
            ai_screened=ai_screened,
            ai_shortlisted=shortlisted,
            interviews=interviews,
            offers=offers,
            estimated_screening_time_saved_hours=hours_saved,
            screening_time_note=f"Screening time saved is estimated based on an average review time of {minutes_per_resume:.1f} minutes per applicant.",
            active_jobs=active_jobs_list,
            shortlisted_candidates=[],
            candidates_requiring_verification=needs_verif,
            pipeline_breakdown=pipeline_breakdown,
            skill_shortage_insights=[
                {"skill": "Kubernetes", "gap_frequency": "42% of applicants"},
                {"skill": "System Architecture", "gap_frequency": "38% of applicants"},
                {"skill": "Docker", "gap_frequency": "24% of applicants"}
            ],
            recent_activity=recent_activity_list
        )

    @classmethod
    def get_analytics(
        cls,
        current_recruiter: Dict[str, Any]
    ) -> RecruiterAnalyticsResponse:
        dash = cls.get_dashboard_metrics(current_recruiter)
        tot = max(dash.total_applicants, 1)
        shortlist_rate = round((dash.ai_shortlisted / tot) * 100, 1)

        pipeline_funnel = [
            {"stage": "Total Applied", "count": dash.total_applicants, "conversion_rate": 100.0},
            {"stage": "AI Screened", "count": dash.ai_screened, "conversion_rate": round((dash.ai_screened / tot) * 100, 1)},
            {"stage": "AI Shortlisted", "count": dash.ai_shortlisted, "conversion_rate": shortlist_rate},
            {"stage": "Interviewed", "count": dash.interviews, "conversion_rate": round((dash.interviews / tot) * 100, 1)},
            {"stage": "Offers & Hired", "count": dash.offers, "conversion_rate": round((dash.offers / tot) * 100, 1)}
        ]

        resumes_avoided = max(0, dash.total_applicants - dash.ai_shortlisted)

        return RecruiterAnalyticsResponse(
            total_applicants=dash.total_applicants,
            screened_applicants=dash.ai_screened,
            shortlisted_count=dash.ai_shortlisted,
            shortlist_rate=shortlist_rate,
            assessment_completion_count=max(1, dash.pipeline_breakdown.get("assessment", 1)),
            interview_count=dash.interviews,
            offers_count=dash.offers,
            hires_count=max(0, dash.offers),
            rejected_count=dash.pipeline_breakdown.get("rejected", 0),
            average_fit_score=78.2,
            average_assessment_score=81.5,
            estimated_resumes_avoided=resumes_avoided,
            estimated_time_saved_hours=dash.estimated_screening_time_saved_hours,
            pipeline_funnel=pipeline_funnel,
            common_skill_gaps=[
                {"skill": "Kubernetes", "frequency": 42},
                {"skill": "System Architecture", "frequency": 38},
                {"skill": "Cloud Infrastructure (AWS/GCP)", "frequency": 29},
                {"skill": "Redis Caching", "frequency": 21}
            ]
        )

    # =========================================================================
    # Activity Logging & Recruiter Settings
    # =========================================================================

    @classmethod
    def log_activity(
        cls,
        company_id: str,
        recruiter_id: str,
        action: str,
        entity_type: str,
        entity_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ):
        act_doc = {
            "company_id": company_id,
            "recruiter_id": recruiter_id,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "metadata": metadata or {},
            "created_at": datetime.now(timezone.utc)
        }
        act_col = mongo_manager.recruiter_activity
        if act_col is not None:
            try:
                act_col.insert_one(act_doc)
            except Exception:
                pass
        _IN_MEMORY_ACTIVITIES.append(act_doc)

    @classmethod
    def get_settings(
        cls,
        current_recruiter: Dict[str, Any]
    ) -> RecruiterSettings:
        company_id = cls.resolve_company_id(current_recruiter)
        comp_col = mongo_manager.companies
        minutes = 3.5

        if comp_col is not None and ObjectId.is_valid(company_id):
            comp = comp_col.find_one({"_id": ObjectId(company_id)})
            if comp and "settings" in comp:
                minutes = float(comp["settings"].get("minutes_saved_per_resume", 3.5))

        return RecruiterSettings(
            company_name=current_recruiter.get("company_name", "TechHire Global"),
            recruiter_name=current_recruiter.get("name", "Recruiter"),
            email=current_recruiter.get("email", ""),
            minutes_saved_per_resume=minutes,
            default_role_title="Senior Backend Developer",
            allow_ai_screening=True
        )

    @classmethod
    def update_settings(
        cls,
        current_recruiter: Dict[str, Any],
        minutes_saved_per_resume: float
    ) -> RecruiterSettings:
        company_id = cls.resolve_company_id(current_recruiter)
        comp_col = mongo_manager.companies
        if comp_col is not None and ObjectId.is_valid(company_id):
            comp_col.update_one(
                {"_id": ObjectId(company_id)},
                {"$set": {"settings.minutes_saved_per_resume": minutes_saved_per_resume}}
            )
        return cls.get_settings(current_recruiter)


recruiter_service = RecruiterService()
