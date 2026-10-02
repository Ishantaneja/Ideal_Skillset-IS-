import re
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException, status

from app.models.ats import (
    ATSResultResponse,
    ATSResultListItem,
    ATSResultListResponse,
    ATSScoreBreakdown,
    SkillsMatchResult,
    ExperienceMatchResult,
    EducationMatchResult,
    ResponsibilityMatchResult,
    KeywordMatchResult,
    ATSImprovementItem,
    WhatIfItem,
    ResumeTailorRequest,
    ResumeTailorResponse,
    SaveTailoredResumeRequest,
    SaveTailoredResumeResponse,
    ResumePDFRequest,
)
from app.services.ats_engine import ats_engine, ATS_WEIGHTS
from app.services.resume_service import resume_service, _IN_MEMORY_RESUMES
from app.services.job_service import job_service
from app.services.ai.resume_tailorer import resume_tailorer
from app.services.pdf_generator import pdf_generator
from app.services.resume_parser import resume_parser
from app.services.jd_parser import jd_parser
from app.services.storage_service import storage_service
from app.database.connection import mongo_manager

logger = logging.getLogger("uvicorn.error")

# In-memory storage fallback for local development if MongoDB is offline
_IN_MEMORY_ATS_RESULTS: Dict[str, Dict[str, Any]] = {}


class ATSService:
    """
    Service layer coordinating resume-to-job ATS compatibility analysis,
    verifying user ownership of inputs, and managing persistence in MongoDB ATS_results.
    """

    @classmethod
    def _doc_to_response(cls, doc: Dict[str, Any]) -> ATSResultResponse:
        """
        Converts MongoDB document dictionary to Pydantic ATSResultResponse model.
        """
        return ATSResultResponse(
            id=str(doc.get("_id", "")),
            user_id=str(doc.get("user_id", "")),
            resume_id=str(doc.get("resume_id", "")),
            job_id=str(doc.get("job_id", "")),
            resume_filename=doc.get("resume_filename"),
            job_title=doc.get("job_title"),
            company_name=doc.get("company_name"),
            score=float(doc.get("score", 0.0)),
            label=doc.get("label", "Moderate Match"),
            breakdown=ATSScoreBreakdown(**doc.get("breakdown", {})),
            skills=SkillsMatchResult(**doc.get("skills", {})),
            experience=ExperienceMatchResult(**doc.get("experience", {})),
            education=EducationMatchResult(**doc.get("education", {})),
            responsibilities=ResponsibilityMatchResult(**doc.get("responsibilities", {})),
            keywords=KeywordMatchResult(**doc.get("keywords", {})),
            top_improvements=[ATSImprovementItem(**ti) for ti in doc.get("top_improvements", [])],
            resume_improvements=[ATSImprovementItem(**ri) for ri in doc.get("resume_improvements", [])],
            what_if=[WhatIfItem(**wi) for wi in doc.get("what_if", [])],
            created_at=doc.get("created_at", datetime.now(timezone.utc)),
            updated_at=doc.get("updated_at", datetime.now(timezone.utc))
        )

    @classmethod
    def analyze_match(
        cls,
        resume_id: str,
        job_id: str,
        current_user: Dict[str, Any]
    ) -> ATSResultResponse:
        """
        Executes full ATS matching between user's resume and job description.
        Enforces strict ownership on both input documents.
        """
        user_id = str(current_user.get("id", ""))
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User session invalid. Please log in again."
            )

        # 1. Fetch resume and verify ownership
        resume_resp = resume_service.get_resume(resume_id, current_user)
        resume_doc = {
            "parsed_data": resume_resp.parsed_data.model_dump(),
            "extracted_text": resume_resp.extracted_text,
            "original_filename": resume_resp.original_filename,
        }

        # 2. Fetch job and verify ownership
        job_resp = job_service.get_job(job_id, current_user)
        job_doc = {
            "job_info": job_resp.job_info.model_dump(),
            "requirements": job_resp.requirements.model_dump(),
            "raw_text": job_resp.raw_text,
        }

        # 3. Run matching engine
        analysis_data = ats_engine.analyze(resume_doc, job_doc)

        # 4. Prepare MongoDB document
        now = datetime.now(timezone.utc)
        result_doc = {
            "user_id": user_id,
            "resume_id": resume_id,
            "job_id": job_id,
            "resume_filename": analysis_data["resume_filename"],
            "job_title": analysis_data["job_title"],
            "company_name": analysis_data["company_name"],
            "score": analysis_data["score"],
            "label": analysis_data["label"],
            "breakdown": analysis_data["breakdown"],
            "skills": analysis_data["skills"],
            "experience": analysis_data["experience"],
            "education": analysis_data["education"],
            "responsibilities": analysis_data["responsibilities"],
            "keywords": analysis_data["keywords"],
            "top_improvements": analysis_data["top_improvements"],
            "resume_improvements": analysis_data["resume_improvements"],
            "what_if": analysis_data["what_if"],
            "created_at": now,
            "updated_at": now,
        }

        # 5. Persist to MongoDB ATS_results
        ats_col = mongo_manager.ats_results
        if ats_col is not None:
            res = ats_col.insert_one(result_doc)
            result_doc["_id"] = res.inserted_id
        else:
            doc_id_str = f"ats_{len(_IN_MEMORY_ATS_RESULTS) + 1}_{int(now.timestamp())}"
            result_doc["_id"] = doc_id_str
            _IN_MEMORY_ATS_RESULTS[doc_id_str] = result_doc

        logger.info(f"Successfully generated ATS report for user {user_id} (Score: {result_doc['score']})")
        return cls._doc_to_response(result_doc)

    @classmethod
    def get_user_results(cls, current_user: Dict[str, Any]) -> ATSResultListResponse:
        """
        Retrieves all ATS matching reports belonging to the user.
        """
        user_id = str(current_user.get("id", ""))
        ats_col = mongo_manager.ats_results
        items: List[ATSResultListItem] = []

        if ats_col is not None:
            cursor = ats_col.find(
                {"user_id": user_id},
                projection={
                    "_id": 1,
                    "resume_id": 1,
                    "job_id": 1,
                    "job_title": 1,
                    "company_name": 1,
                    "resume_filename": 1,
                    "score": 1,
                    "label": 1,
                    "created_at": 1,
                }
            ).sort("created_at", -1)
            for doc in cursor:
                items.append(ATSResultListItem(
                    id=str(doc.get("_id")),
                    resume_id=str(doc.get("resume_id")),
                    job_id=str(doc.get("job_id")),
                    job_title=doc.get("job_title") or "Target Role",
                    company_name=doc.get("company_name"),
                    resume_filename=doc.get("resume_filename"),
                    score=float(doc.get("score", 0.0)),
                    label=doc.get("label", "Moderate Match"),
                    created_at=doc.get("created_at", datetime.now(timezone.utc))
                ))
        else:
            for doc in sorted(_IN_MEMORY_ATS_RESULTS.values(), key=lambda x: x.get("created_at", datetime.min), reverse=True):
                if doc.get("user_id") == user_id:
                    items.append(ATSResultListItem(
                        id=str(doc.get("_id")),
                        resume_id=str(doc.get("resume_id")),
                        job_id=str(doc.get("job_id")),
                        job_title=doc.get("job_title") or "Target Role",
                        company_name=doc.get("company_name"),
                        resume_filename=doc.get("resume_filename"),
                        score=float(doc.get("score", 0.0)),
                        label=doc.get("label", "Moderate Match"),
                        created_at=doc.get("created_at", datetime.now(timezone.utc))
                    ))

        return ATSResultListResponse(items=items, total=len(items))

    @classmethod
    def get_result(cls, result_id: str, current_user: Dict[str, Any]) -> ATSResultResponse:
        """
        Retrieves single ATS report, enforcing strict user ownership.
        """
        user_id = str(current_user.get("id", ""))
        ats_col = mongo_manager.ats_results
        doc = None

        if ats_col is not None:
            if ObjectId.is_valid(result_id):
                doc = ats_col.find_one({"_id": ObjectId(result_id)})
            if not doc:
                doc = ats_col.find_one({"_id": result_id})
        else:
            doc = _IN_MEMORY_ATS_RESULTS.get(result_id)

        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"ATS analysis result '{result_id}' not found."
            )

        # STRICT OWNERSHIP VERIFICATION
        if str(doc.get("user_id")) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: you do not have permission to view this ATS analysis."
            )

        return cls._doc_to_response(doc)

    @classmethod
    def delete_result(cls, result_id: str, current_user: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deletes ATS report document from MongoDB.
        """
        user_id = str(current_user.get("id", ""))
        ats_col = mongo_manager.ats_results
        doc = None

        if ats_col is not None:
            if ObjectId.is_valid(result_id):
                doc = ats_col.find_one({"_id": ObjectId(result_id)})
            if not doc:
                doc = ats_col.find_one({"_id": result_id})
        else:
            doc = _IN_MEMORY_ATS_RESULTS.get(result_id)

        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"ATS analysis result '{result_id}' not found."
            )

        # STRICT OWNERSHIP VERIFICATION
        if str(doc.get("user_id")) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: you do not have permission to delete this ATS analysis."
            )

        if ats_col is not None:
            if ObjectId.is_valid(result_id):
                ats_col.delete_one({"_id": ObjectId(result_id)})
            else:
                ats_col.delete_one({"_id": result_id})
        else:
            _IN_MEMORY_ATS_RESULTS.pop(result_id, None)

        return {
            "status": "success",
            "message": "ATS analysis report deleted successfully.",
            "deleted_id": result_id
        }

    @classmethod
    def simulate_score(
        cls,
        resume_id: str,
        job_id: str,
        added_skills: List[str],
        current_user: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Simulates score projection when adding hypothetical verified skills.
        """
        # Fetch base analysis
        base_result = cls.analyze_match(resume_id, job_id, current_user)
        base_score = base_result.score

        # Check which added skills are in missing required or preferred
        missing_req = {m.skill.lower(): m for m in base_result.skills.missing_required}
        missing_pref = {m.skill.lower(): m for m in base_result.skills.missing_preferred}

        total_gain = 0.0
        applied_skills = []

        for skill in added_skills:
            s_lower = skill.lower()
            if s_lower in missing_req:
                gain = missing_req[s_lower].potential_score_gain
                total_gain += gain
                applied_skills.append({"skill": missing_req[s_lower].skill, "type": "required", "gain": gain})
            elif s_lower in missing_pref:
                gain = missing_pref[s_lower].potential_score_gain
                total_gain += gain
                applied_skills.append({"skill": missing_pref[s_lower].skill, "type": "preferred", "gain": gain})

        simulated_score = min(100.0, round(base_score + total_gain, 1))

        return {
            "base_score": base_score,
            "simulated_score": simulated_score,
            "score_gain": round(total_gain, 1),
            "applied_skills": applied_skills,
            "simulated_label": ats_engine.get_match_label(simulated_score)
        }

    @classmethod
    def tailor_resume(
        cls,
        payload: ResumeTailorRequest,
        current_user: Dict[str, Any]
    ) -> ResumeTailorResponse:
        """
        Synthesizes an ATS-tailored resume specifically aligned with the target JD,
        calculating deterministic before/after scores, skills added, and rewritten bullet points.
        """
        user_id = str(current_user.get("id", ""))
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User session invalid. Please log in again."
            )

        # 1. Fetch baseline resume and verify ownership
        resume_resp = resume_service.get_resume(payload.resume_id, current_user)
        resume_doc = {
            "parsed_data": resume_resp.parsed_data.model_dump(),
            "extracted_text": resume_resp.extracted_text,
            "original_filename": resume_resp.original_filename,
        }

        # 2. Fetch target job or parse raw text
        if payload.job_id:
            job_resp = job_service.get_job(payload.job_id, current_user)
            job_doc = {
                "job_info": job_resp.job_info.model_dump(),
                "requirements": job_resp.requirements.model_dump(),
                "raw_text": job_resp.raw_text,
            }
        elif payload.job_text and len(payload.job_text.strip()) > 30:
            job_info, requirements = jd_parser.parse_job_description(payload.job_text)
            job_doc = {
                "job_info": job_info.model_dump(),
                "requirements": requirements.model_dump(),
                "raw_text": payload.job_text,
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either job_id or valid job_text must be provided to tailor the resume."
            )

        # 3. Tailor resume using AI engine
        return resume_tailorer.tailor_resume(
            resume_doc=resume_doc,
            job_doc=job_doc,
            target_skills=payload.target_skills,
            focus_areas=payload.focus_areas,
        )

    @classmethod
    def save_tailored_resume(
        cls,
        payload: SaveTailoredResumeRequest,
        current_user: Dict[str, Any]
    ) -> SaveTailoredResumeResponse:
        """
        Saves the tailored resume as an official resume record, optionally activates it,
        and re-runs ATS evaluation against the target job.
        """
        user_id = str(current_user.get("id", ""))
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User session invalid. Please log in again."
            )

        # 1. Verify original resume ownership
        resume_service.get_resume(payload.original_resume_id, current_user)

        # 2. Parse tailored text into structured schema
        tailored_parsed = resume_parser.parse_resume(payload.tailored_text)

        now = datetime.now(timezone.utc)
        clean_title = payload.title or f"Tailored Resume ({now.strftime('%b %d, %Y')})"
        clean_filename = f"{re.sub(r'[^a-zA-Z0-9_]+', '_', clean_title.lower()).strip('_')}.txt"

        # 3. Save text file to disk
        file_bytes = payload.tailored_text.encode("utf-8")
        storage_path, file_type, file_size = storage_service.save_file(file_bytes, clean_filename)

        resume_doc = {
            "user_id": user_id,
            "original_filename": clean_filename,
            "file_type": "txt",
            "file_size": file_size,
            "storage_path": storage_path,
            "is_active": payload.set_active,
            "uploaded_at": now,
            "updated_at": now,
            "extracted_text": payload.tailored_text,
            "parsed_data": tailored_parsed.model_dump(),
            "parsing_status": "completed",
            "parsing_error": None,
            "is_tailored": True,
            "source_resume_id": payload.original_resume_id,
            "target_job_id": payload.job_id
        }

        resumes_col = mongo_manager.resumes
        users_col = mongo_manager.user_data
        new_resume_id = ""

        if resumes_col is not None:
            if payload.set_active:
                try:
                    resumes_col.update_many(
                        {"user_id": user_id, "is_active": True},
                        {"$set": {"is_active": False, "updated_at": now}}
                    )
                except Exception as deact_err:
                    logger.warning(f"Could not deactivate previous resumes: {deact_err}")
            res = resumes_col.insert_one(resume_doc)
            new_resume_id = str(res.inserted_id)
            resume_doc["_id"] = res.inserted_id
        else:
            new_resume_id = f"res_{len(_IN_MEMORY_RESUMES) + 1}_{int(now.timestamp())}"
            resume_doc["_id"] = new_resume_id
            if payload.set_active:
                for r in _IN_MEMORY_RESUMES.values():
                    if r.get("user_id") == user_id:
                        r["is_active"] = False
            _IN_MEMORY_RESUMES[new_resume_id] = resume_doc

        # 4. If target job provided, re-evaluate ATS match and store in ATS_results
        ats_score = 88.0
        if payload.job_id:
            try:
                ats_res = cls.analyze_match(new_resume_id, payload.job_id, current_user)
                ats_score = ats_res.score
            except Exception as match_err:
                logger.warning(f"Could not auto-run ATS match on saved tailored resume: {match_err}")

        # 5. Update user's telemetry in User_data if active
        if payload.set_active:
            if users_col is not None and ObjectId.is_valid(user_id):
                users_col.update_one(
                    {"_id": ObjectId(user_id)},
                    {"$set": {"ats_score": round(ats_score), "updated_at": now}}
                )
            from app.services.auth_service import _IN_MEMORY_USERS
            for u in _IN_MEMORY_USERS.values():
                if str(u.get("_id")) == user_id or u.get("email") == current_user.get("email"):
                    u["ats_score"] = round(ats_score)

        return SaveTailoredResumeResponse(
            resume_id=new_resume_id,
            original_resume_id=payload.original_resume_id,
            title=clean_title,
            ats_score=ats_score,
            is_active=payload.set_active,
            message="Tailored resume saved and set as active profile resume."
        )

    @classmethod
    def generate_tailored_pdf(
        cls,
        payload: ResumePDFRequest,
        current_user: Dict[str, Any]
    ) -> bytes:
        """
        Compiles tailored resume text into an ATS-compliant, single-column PDF
        preserving all hyperlinks intact.
        """
        user_id = str(current_user.get("id", ""))
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User session invalid. Please log in again."
            )
        doc_title = payload.title or "Tailored_Resume"
        return pdf_generator.generate_pdf(payload.tailored_text, doc_title)


ats_service = ATSService()

