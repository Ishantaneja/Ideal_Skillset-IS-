import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import UploadFile, HTTPException, status

from app.models.job import (
    JobResponse,
    JobListItem,
    JobListResponse,
    JobInfo,
    JobRequirements,
)
from app.services.storage_service import storage_service
from app.services.text_extractor import text_extractor
from app.services.jd_parser import jd_parser
from app.database.connection import mongo_manager

logger = logging.getLogger("uvicorn.error")

# In-memory storage fallback for local development if MongoDB is offline
_IN_MEMORY_JOBS: Dict[str, Dict[str, Any]] = {}


class JobService:
    """
    Coordinates job description analysis, file extraction,
    structured requirements parsing, and MongoDB persistence with strict user ownership.
    """

    @classmethod
    def _doc_to_response(cls, doc: Dict[str, Any]) -> JobResponse:
        """
        Converts MongoDB document dictionary to Pydantic JobResponse model.
        """
        job_info_raw = doc.get("job_info", {})
        job_info_model = JobInfo(**job_info_raw) if isinstance(job_info_raw, dict) else JobInfo()

        req_raw = doc.get("requirements", {})
        req_model = JobRequirements(**req_raw) if isinstance(req_raw, dict) else JobRequirements()

        return JobResponse(
            id=str(doc.get("_id", "")),
            user_id=str(doc.get("user_id", "")),
            source_type=doc.get("source_type", "text"),
            original_filename=doc.get("original_filename"),
            raw_text=doc.get("raw_text", ""),
            job_info=job_info_model,
            requirements=req_model,
            analysis_status=doc.get("analysis_status", "completed"),
            analysis_error=doc.get("analysis_error"),
            created_at=doc.get("created_at", datetime.now(timezone.utc)),
            updated_at=doc.get("updated_at", datetime.now(timezone.utc))
        )

    @classmethod
    def analyze_text(cls, text: str, current_user: Dict[str, Any]) -> JobResponse:
        """
        Parses pasted job description text and persists the structured document to MongoDB Jobs.
        """
        user_id = str(current_user.get("id", ""))
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User session invalid. Please log in again."
            )

        cleaned_text = text_extractor.clean_text(text)
        if len(cleaned_text) < 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job description text is too short to analyze."
            )

        # 1. Parse structured job info and requirements
        job_info, requirements = jd_parser.parse_job_description(cleaned_text)

        # 2. Persist to MongoDB Jobs
        now = datetime.now(timezone.utc)
        job_doc = {
            "user_id": user_id,
            "source_type": "text",
            "original_filename": None,
            "raw_text": cleaned_text,
            "job_info": job_info.model_dump(),
            "requirements": requirements.model_dump(),
            "analysis_status": "completed",
            "analysis_error": None,
            "created_at": now,
            "updated_at": now,
        }

        jobs_col = mongo_manager.jobs
        if jobs_col is not None:
            result = jobs_col.insert_one(job_doc)
            job_doc["_id"] = result.inserted_id
        else:
            doc_id_str = f"job_{len(_IN_MEMORY_JOBS) + 1}_{int(now.timestamp())}"
            job_doc["_id"] = doc_id_str
            _IN_MEMORY_JOBS[doc_id_str] = job_doc

        logger.info(f"Successfully analyzed and stored job for user {user_id}")
        return cls._doc_to_response(job_doc)

    @classmethod
    async def upload_and_analyze(cls, file: UploadFile, current_user: Dict[str, Any]) -> JobResponse:
        """
        Processes uploaded JD file (PDF/DOCX), extracts text, parses requirements, and stores in Jobs.
        """
        user_id = str(current_user.get("id", ""))
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User session invalid. Please log in again."
            )

        original_filename = file.filename or "job_description.pdf"
        content_type = file.content_type or "application/pdf"

        file_bytes = await file.read()
        file_size = len(file_bytes)

        # 1. Validate file format and size
        storage_service.validate_file(original_filename, content_type, file_size)

        # 2. Save temporary file to extract text
        storage_path, file_type, _ = storage_service.save_file(file_bytes, original_filename)

        # 3. Extract text
        extracted_text = ""
        analysis_status = "completed"
        analysis_error = None
        try:
            extracted_text = text_extractor.extract_text(storage_path, file_type)
            if not extracted_text or len(extracted_text.strip()) < 10:
                analysis_status = "failed"
                analysis_error = "Could not extract readable text from JD document."
        except Exception as extract_err:
            logger.error(f"JD text extraction failed: {extract_err}")
            analysis_status = "failed"
            analysis_error = str(extract_err)
        finally:
            # We don't need to keep the raw binary on disk for JDs once extracted
            storage_service.delete_file(storage_path)

        # 4. Parse requirements
        job_info = JobInfo()
        requirements = JobRequirements()
        if analysis_status == "completed":
            job_info, requirements = jd_parser.parse_job_description(extracted_text)

        # 5. Persist to MongoDB Jobs
        now = datetime.now(timezone.utc)
        job_doc = {
            "user_id": user_id,
            "source_type": "file",
            "original_filename": original_filename,
            "raw_text": extracted_text,
            "job_info": job_info.model_dump(),
            "requirements": requirements.model_dump(),
            "analysis_status": analysis_status,
            "analysis_error": analysis_error,
            "created_at": now,
            "updated_at": now,
        }

        jobs_col = mongo_manager.jobs
        if jobs_col is not None:
            result = jobs_col.insert_one(job_doc)
            job_doc["_id"] = result.inserted_id
        else:
            doc_id_str = f"job_{len(_IN_MEMORY_JOBS) + 1}_{int(now.timestamp())}"
            job_doc["_id"] = doc_id_str
            _IN_MEMORY_JOBS[doc_id_str] = job_doc

        logger.info(f"Successfully uploaded, analyzed, and stored job {original_filename} for user {user_id}")
        return cls._doc_to_response(job_doc)

    @classmethod
    def get_user_jobs(cls, current_user: Dict[str, Any]) -> JobListResponse:
        """
        Fetches all job descriptions analyzed by the authenticated user.
        """
        user_id = str(current_user.get("id", ""))
        jobs_col = mongo_manager.jobs
        items: List[JobListItem] = []

        if jobs_col is not None:
            cursor = jobs_col.find({"user_id": user_id}).sort("created_at", -1)
            for doc in cursor:
                job_info = doc.get("job_info", {})
                reqs = doc.get("requirements", {})
                req_skills = reqs.get("required_skills", []) if isinstance(reqs, dict) else []

                items.append(JobListItem(
                    id=str(doc.get("_id")),
                    job_title=job_info.get("job_title") or "Untitled Position",
                    company_name=job_info.get("company_name"),
                    location=job_info.get("location"),
                    work_mode=job_info.get("work_mode"),
                    required_skills_count=len(req_skills),
                    source_type=doc.get("source_type", "text"),
                    created_at=doc.get("created_at", datetime.now(timezone.utc))
                ))
        else:
            for doc in sorted(_IN_MEMORY_JOBS.values(), key=lambda x: x.get("created_at", datetime.min), reverse=True):
                if doc.get("user_id") == user_id:
                    job_info = doc.get("job_info", {})
                    reqs = doc.get("requirements", {})
                    req_skills = reqs.get("required_skills", []) if isinstance(reqs, dict) else []

                    items.append(JobListItem(
                        id=str(doc.get("_id")),
                        job_title=job_info.get("job_title") or "Untitled Position",
                        company_name=job_info.get("company_name"),
                        location=job_info.get("location"),
                        work_mode=job_info.get("work_mode"),
                        required_skills_count=len(req_skills),
                        source_type=doc.get("source_type", "text"),
                        created_at=doc.get("created_at", datetime.now(timezone.utc))
                    ))

        return JobListResponse(items=items, total=len(items))

    @classmethod
    def get_job(cls, job_id: str, current_user: Dict[str, Any]) -> JobResponse:
        """
        Fetches single job description analysis, verifying user ownership.
        """
        user_id = str(current_user.get("id", ""))
        jobs_col = mongo_manager.jobs
        doc = None

        if jobs_col is not None:
            if ObjectId.is_valid(job_id):
                doc = jobs_col.find_one({"_id": ObjectId(job_id)})
            if not doc:
                doc = jobs_col.find_one({"_id": job_id})
        else:
            doc = _IN_MEMORY_JOBS.get(job_id)

        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job analysis '{job_id}' not found."
            )

        # STRICT OWNERSHIP CHECK
        if str(doc.get("user_id")) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: you do not have permission to view this job description."
            )

        return cls._doc_to_response(doc)

    @classmethod
    def delete_job(cls, job_id: str, current_user: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deletes a job description document, verifying user ownership.
        """
        user_id = str(current_user.get("id", ""))
        jobs_col = mongo_manager.jobs
        doc = None

        if jobs_col is not None:
            if ObjectId.is_valid(job_id):
                doc = jobs_col.find_one({"_id": ObjectId(job_id)})
            if not doc:
                doc = jobs_col.find_one({"_id": job_id})
        else:
            doc = _IN_MEMORY_JOBS.get(job_id)

        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job analysis '{job_id}' not found."
            )

        # STRICT OWNERSHIP CHECK
        if str(doc.get("user_id")) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: you do not have permission to delete this job description."
            )

        if jobs_col is not None:
            if ObjectId.is_valid(job_id):
                jobs_col.delete_one({"_id": ObjectId(job_id)})
            else:
                jobs_col.delete_one({"_id": job_id})
        else:
            _IN_MEMORY_JOBS.pop(job_id, None)

        return {
            "status": "success",
            "message": "Job description analysis deleted successfully.",
            "deleted_id": job_id
        }

    @classmethod
    def reanalyze_job(cls, job_id: str, current_user: Dict[str, Any]) -> JobResponse:
        """
        Re-runs the parsing pipeline on the existing raw text of a job description.
        """
        job = cls.get_job(job_id, current_user)
        raw_text = job.raw_text

        job_info, requirements = jd_parser.parse_job_description(raw_text)
        now = datetime.now(timezone.utc)

        update_fields = {
            "job_info": job_info.model_dump(),
            "requirements": requirements.model_dump(),
            "updated_at": now,
        }

        jobs_col = mongo_manager.jobs
        if jobs_col is not None:
            if ObjectId.is_valid(job_id):
                jobs_col.update_one({"_id": ObjectId(job_id)}, {"$set": update_fields})
            else:
                jobs_col.update_one({"_id": job_id}, {"$set": update_fields})
        else:
            if job_id in _IN_MEMORY_JOBS:
                _IN_MEMORY_JOBS[job_id].update(update_fields)

        return cls.get_job(job_id, current_user)


job_service = JobService()

