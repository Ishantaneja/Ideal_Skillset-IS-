import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException, status

from app.models.readiness import (
    ReadinessTwinResponse,
    ReadinessTwinListItem,
    ReadinessTwinListResponse,
    ReadinessDimensions,
    DimensionScore,
    ApplicationReadinessVerdict,
)
from app.services.readiness_engine import readiness_engine
from app.services.resume_service import resume_service
from app.services.job_service import job_service
from app.database.connection import mongo_manager

logger = logging.getLogger("uvicorn.error")

_IN_MEMORY_READINESS: Dict[str, Dict[str, Any]] = {}


class ReadinessService:
    """
    Coordinates multi-source data aggregation, ownership verification,
    Readiness Twin calculations, and persistence in MongoDB Readiness collection.
    """

    @classmethod
    def _doc_to_response(cls, doc: Dict[str, Any]) -> ReadinessTwinResponse:
        """
        Converts MongoDB dictionary document to Pydantic ReadinessTwinResponse.
        """
        raw_dims = doc.get("dimensions", {})
        dimensions = ReadinessDimensions(
            knowledge=DimensionScore(**raw_dims["knowledge"]),
            practical=DimensionScore(**raw_dims["practical"]),
            evidence=DimensionScore(**raw_dims["evidence"]),
            communication=DimensionScore(**raw_dims["communication"]),
            roadmap_progress=DimensionScore(**raw_dims["roadmap_progress"])
        )

        raw_verdict = doc.get("verdict", {})
        verdict = ApplicationReadinessVerdict(**raw_verdict)

        raw_breakdown = doc.get("breakdown_list", [])
        breakdown_list = [DimensionScore(**b) for b in raw_breakdown]

        return ReadinessTwinResponse(
            id=str(doc.get("_id", "")),
            user_id=str(doc.get("user_id", "")),
            resume_id=str(doc.get("resume_id", "")),
            job_id=str(doc.get("job_id", "")),
            job_title=doc.get("job_title", "Target Role"),
            company_name=doc.get("company_name"),
            resume_filename=doc.get("resume_filename"),
            overall_readiness_score=float(doc.get("overall_readiness_score", 0.0)),
            verdict=verdict,
            dimensions=dimensions,
            breakdown_list=breakdown_list,
            created_at=doc.get("created_at", datetime.now(timezone.utc)),
            updated_at=doc.get("updated_at", datetime.now(timezone.utc))
        )

    @classmethod
    def analyze_readiness(
        cls,
        resume_id: str,
        job_id: str,
        github_url: Optional[str],
        portfolio_url: Optional[str],
        current_user: Dict[str, Any]
    ) -> ReadinessTwinResponse:
        """
        Synthesizes candidate readiness across all 5 dimensions.
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

        # 3. Check for existing ATS analysis
        ats_col = mongo_manager.ats_results
        ats_result = None
        if ats_col is not None:
            ats_result = ats_col.find_one({"user_id": user_id, "resume_id": resume_id, "job_id": job_id})

        # 4. Check for existing Skill Gap analysis
        sg_col = mongo_manager.skill_gaps
        skill_gap_result = None
        if sg_col is not None:
            skill_gap_result = sg_col.find_one({"user_id": user_id, "resume_id": resume_id, "job_id": job_id})

        # 5. Check for existing Roadmap
        rm_col = mongo_manager.roadmaps
        roadmap_doc = None
        if rm_col is not None:
            roadmap_doc = rm_col.find_one({"user_id": user_id, "resume_id": resume_id, "job_id": job_id})

        # 6. Run Readiness Twin analysis
        twin_data = readiness_engine.analyze_twin(
            resume_doc=resume_doc,
            job_doc=job_doc,
            ats_result=ats_result,
            skill_gap_result=skill_gap_result,
            roadmap_doc=roadmap_doc,
            github_url=github_url,
            portfolio_url=portfolio_url
        )

        now = datetime.now(timezone.utc)
        result_doc = {
            "user_id": user_id,
            "resume_id": resume_id,
            "job_id": job_id,
            "job_title": twin_data["job_title"],
            "company_name": twin_data["company_name"],
            "resume_filename": twin_data["resume_filename"],
            "overall_readiness_score": twin_data["overall_readiness_score"],
            "verdict": twin_data["verdict"],
            "dimensions": twin_data["dimensions"],
            "breakdown_list": twin_data["breakdown_list"],
            "created_at": now,
            "updated_at": now,
        }

        # Persist to MongoDB Readiness collection
        rd_col = mongo_manager.readiness
        if rd_col is not None:
            res = rd_col.insert_one(result_doc)
            result_doc["_id"] = res.inserted_id
        else:
            doc_id_str = f"rd_{len(_IN_MEMORY_READINESS) + 1}_{int(now.timestamp())}"
            result_doc["_id"] = doc_id_str
            _IN_MEMORY_READINESS[doc_id_str] = result_doc

        logger.info(f"Generated Readiness Twin for user {user_id} on {twin_data['job_title']} (Score: {twin_data['overall_readiness_score']}%)")
        return cls._doc_to_response(result_doc)

    @classmethod
    def get_user_analyses(cls, current_user: Dict[str, Any]) -> ReadinessTwinListResponse:
        """
        Lists all Readiness Twin analyses for current user.
        """
        user_id = str(current_user.get("id", ""))
        rd_col = mongo_manager.readiness
        items: List[ReadinessTwinListItem] = []

        if rd_col is not None:
            cursor = rd_col.find({"user_id": user_id}).sort("created_at", -1)
            for doc in cursor:
                verdict = doc.get("verdict", {})
                items.append(ReadinessTwinListItem(
                    id=str(doc.get("_id")),
                    resume_id=str(doc.get("resume_id")),
                    job_id=str(doc.get("job_id")),
                    job_title=doc.get("job_title", "Target Role"),
                    company_name=doc.get("company_name"),
                    overall_readiness_score=float(doc.get("overall_readiness_score", 0.0)),
                    ats_match_score=float(verdict.get("ats_match_score", 0.0)),
                    verdict_label=verdict.get("verdict_label", "PREPARE BEFORE APPLYING"),
                    created_at=doc.get("created_at", datetime.now(timezone.utc))
                ))
        else:
            for doc in sorted(_IN_MEMORY_READINESS.values(), key=lambda x: x.get("created_at", datetime.min), reverse=True):
                if doc.get("user_id") == user_id:
                    verdict = doc.get("verdict", {})
                    items.append(ReadinessTwinListItem(
                        id=str(doc.get("_id")),
                        resume_id=str(doc.get("resume_id")),
                        job_id=str(doc.get("job_id")),
                        job_title=doc.get("job_title", "Target Role"),
                        company_name=doc.get("company_name"),
                        overall_readiness_score=float(doc.get("overall_readiness_score", 0.0)),
                        ats_match_score=float(verdict.get("ats_match_score", 0.0)),
                        verdict_label=verdict.get("verdict_label", "PREPARE BEFORE APPLYING"),
                        created_at=doc.get("created_at", datetime.now(timezone.utc))
                    ))

        return ReadinessTwinListResponse(items=items, total=len(items))

    @classmethod
    def get_analysis(cls, analysis_id: str, current_user: Dict[str, Any]) -> ReadinessTwinResponse:
        """
        Retrieves single Readiness Twin detail with ownership check.
        """
        user_id = str(current_user.get("id", ""))
        rd_col = mongo_manager.readiness
        doc = None

        if rd_col is not None:
            if ObjectId.is_valid(analysis_id):
                doc = rd_col.find_one({"_id": ObjectId(analysis_id)})
            if not doc:
                doc = rd_col.find_one({"_id": analysis_id})
        else:
            doc = _IN_MEMORY_READINESS.get(analysis_id)

        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Readiness Twin analysis '{analysis_id}' not found."
            )

        if str(doc.get("user_id")) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: you do not have permission to view this Readiness Twin analysis."
            )

        return cls._doc_to_response(doc)

    @classmethod
    def get_by_job(cls, job_id: str, current_user: Dict[str, Any]) -> ReadinessTwinResponse:
        """
        Retrieves latest Readiness Twin for a specific job.
        """
        user_id = str(current_user.get("id", ""))
        rd_col = mongo_manager.readiness
        doc = None

        if rd_col is not None:
            doc = rd_col.find_one({"user_id": user_id, "job_id": job_id}, sort=[("created_at", -1)])
        else:
            for d in sorted(_IN_MEMORY_READINESS.values(), key=lambda x: x.get("created_at", datetime.min), reverse=True):
                if d.get("user_id") == user_id and d.get("job_id") == job_id:
                    doc = d
                    break

        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No Readiness Twin analysis found for job '{job_id}'."
            )

        return cls._doc_to_response(doc)

    @classmethod
    def delete_analysis(cls, analysis_id: str, current_user: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deletes a Readiness Twin analysis from MongoDB.
        """
        user_id = str(current_user.get("id", ""))
        rd_col = mongo_manager.readiness
        doc = None

        if rd_col is not None:
            if ObjectId.is_valid(analysis_id):
                doc = rd_col.find_one({"_id": ObjectId(analysis_id)})
            if not doc:
                doc = rd_col.find_one({"_id": analysis_id})
        else:
            doc = _IN_MEMORY_READINESS.get(analysis_id)

        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Readiness Twin analysis '{analysis_id}' not found."
            )

        if str(doc.get("user_id")) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: you do not have permission to delete this Readiness Twin analysis."
            )

        if rd_col is not None:
            if ObjectId.is_valid(analysis_id):
                rd_col.delete_one({"_id": ObjectId(analysis_id)})
            else:
                rd_col.delete_one({"_id": analysis_id})
        else:
            _IN_MEMORY_READINESS.pop(analysis_id, None)

        return {
            "status": "success",
            "message": "Readiness Twin analysis deleted successfully.",
            "deleted_id": analysis_id
        }


readiness_service = ReadinessService()

