import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException, status

from app.models.roadmap import (
    RoadmapResponse,
    RoadmapListItem,
    RoadmapListResponse,
    RoadmapWeekItem,
    RoadmapTaskItem,
    RoadmapProjectItem,
)
from app.services.roadmap_engine import roadmap_engine
from app.services.resume_service import resume_service
from app.services.job_service import job_service
from app.database.connection import mongo_manager

logger = logging.getLogger("uvicorn.error")

_IN_MEMORY_ROADMAPS: Dict[str, Dict[str, Any]] = {}


class RoadmapService:
    """
    Coordinates personalized roadmap generation, task progress tracking,
    regeneration, and MongoDB persistence.
    """

    @classmethod
    def _doc_to_response(cls, doc: Dict[str, Any]) -> RoadmapResponse:
        """
        Converts MongoDB dictionary document to Pydantic RoadmapResponse.
        """
        weeks_data = doc.get("weeks", [])
        weeks = []
        for w in weeks_data:
            tasks = [RoadmapTaskItem(**t) for t in w.get("tasks", [])]
            project = RoadmapProjectItem(**w["project"]) if w.get("project") else None
            weeks.append(RoadmapWeekItem(
                week=int(w.get("week", 1)),
                title=w.get("title", ""),
                theme=w.get("theme", ""),
                primary_skill=w.get("primary_skill", ""),
                secondary_skills=w.get("secondary_skills", []),
                goals=w.get("goals", []),
                tasks=tasks,
                project=project,
                milestone=w.get("milestone", ""),
                estimated_hours=int(w.get("estimated_hours", 15)),
                week_progress=float(w.get("week_progress", 0.0)),
                expected_readiness_impact=w.get("expected_readiness_impact", "+5% match gain")
            ))

        return RoadmapResponse(
            id=str(doc.get("_id", "")),
            user_id=str(doc.get("user_id", "")),
            resume_id=str(doc.get("resume_id", "")),
            job_id=str(doc.get("job_id", "")),
            ats_analysis_id=doc.get("ats_analysis_id"),
            skill_gap_analysis_id=doc.get("skill_gap_analysis_id"),
            title=doc.get("title", "Career Readiness Roadmap"),
            target_role=doc.get("target_role", "Target Role"),
            company_name=doc.get("company_name"),
            resume_filename=doc.get("resume_filename"),
            duration_weeks=int(doc.get("duration_weeks", 4)),
            current_ats_score=float(doc.get("current_ats_score", 0.0)),
            estimated_target_score=float(doc.get("estimated_target_score", 0.0)),
            overall_progress=float(doc.get("overall_progress", 0.0)),
            total_hours=int(doc.get("total_hours", 0)),
            completed_tasks_count=int(doc.get("completed_tasks_count", 0)),
            total_tasks_count=int(doc.get("total_tasks_count", 0)),
            weeks=weeks,
            status=doc.get("status", "active"),
            created_at=doc.get("created_at", datetime.now(timezone.utc)),
            updated_at=doc.get("updated_at", datetime.now(timezone.utc))
        )

    @classmethod
    def generate_roadmap(
        cls,
        resume_id: str,
        job_id: str,
        skill_gap_analysis_id: Optional[str],
        duration_weeks: int,
        current_user: Dict[str, Any]
    ) -> RoadmapResponse:
        """
        Generates personalized career roadmap from user inputs, verifying ownership.
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
            if skill_gap_analysis_id and ObjectId.is_valid(skill_gap_analysis_id):
                skill_gap_result = sg_col.find_one({"_id": ObjectId(skill_gap_analysis_id), "user_id": user_id})
            if not skill_gap_result:
                skill_gap_result = sg_col.find_one({"user_id": user_id, "resume_id": resume_id, "job_id": job_id})

        # 5. Run roadmap engine
        roadmap_data = roadmap_engine.generate_roadmap(
            resume_doc=resume_doc,
            job_doc=job_doc,
            ats_result=ats_result,
            skill_gap_result=skill_gap_result,
            duration_weeks=duration_weeks
        )

        now = datetime.now(timezone.utc)
        result_doc = {
            "user_id": user_id,
            "resume_id": resume_id,
            "job_id": job_id,
            "ats_analysis_id": str(ats_result.get("_id")) if ats_result else None,
            "skill_gap_analysis_id": str(skill_gap_result.get("_id")) if skill_gap_result else skill_gap_analysis_id,
            "title": roadmap_data["title"],
            "target_role": roadmap_data["target_role"],
            "company_name": roadmap_data["company_name"],
            "resume_filename": roadmap_data["resume_filename"],
            "duration_weeks": roadmap_data["duration_weeks"],
            "current_ats_score": roadmap_data["current_ats_score"],
            "estimated_target_score": roadmap_data["estimated_target_score"],
            "overall_progress": roadmap_data["overall_progress"],
            "total_hours": roadmap_data["total_hours"],
            "completed_tasks_count": roadmap_data["completed_tasks_count"],
            "total_tasks_count": roadmap_data["total_tasks_count"],
            "weeks": roadmap_data["weeks"],
            "status": "active",
            "created_at": now,
            "updated_at": now,
        }

        # Persist to MongoDB Roadmaps
        rm_col = mongo_manager.roadmaps
        if rm_col is not None:
            res = rm_col.insert_one(result_doc)
            result_doc["_id"] = res.inserted_id
        else:
            doc_id_str = f"rm_{len(_IN_MEMORY_ROADMAPS) + 1}_{int(now.timestamp())}"
            result_doc["_id"] = doc_id_str
            _IN_MEMORY_ROADMAPS[doc_id_str] = result_doc

        logger.info(f"Generated Personalized Roadmap for user {user_id} ({duration_weeks} weeks)")
        return cls._doc_to_response(result_doc)

    @classmethod
    def get_user_roadmaps(cls, current_user: Dict[str, Any]) -> RoadmapListResponse:
        """
        Lists all career roadmaps created by current user.
        """
        user_id = str(current_user.get("id", ""))
        rm_col = mongo_manager.roadmaps
        items: List[RoadmapListItem] = []

        if rm_col is not None:
            cursor = rm_col.find({"user_id": user_id}).sort("created_at", -1)
            for doc in cursor:
                items.append(RoadmapListItem(
                    id=str(doc.get("_id")),
                    resume_id=str(doc.get("resume_id")),
                    job_id=str(doc.get("job_id")),
                    title=doc.get("title", "Career Roadmap"),
                    target_role=doc.get("target_role", "Target Role"),
                    company_name=doc.get("company_name"),
                    duration_weeks=int(doc.get("duration_weeks", 4)),
                    current_ats_score=float(doc.get("current_ats_score", 0.0)),
                    estimated_target_score=float(doc.get("estimated_target_score", 0.0)),
                    overall_progress=float(doc.get("overall_progress", 0.0)),
                    created_at=doc.get("created_at", datetime.now(timezone.utc))
                ))
        else:
            for doc in sorted(_IN_MEMORY_ROADMAPS.values(), key=lambda x: x.get("created_at", datetime.min), reverse=True):
                if doc.get("user_id") == user_id:
                    items.append(RoadmapListItem(
                        id=str(doc.get("_id")),
                        resume_id=str(doc.get("resume_id")),
                        job_id=str(doc.get("job_id")),
                        title=doc.get("title", "Career Roadmap"),
                        target_role=doc.get("target_role", "Target Role"),
                        company_name=doc.get("company_name"),
                        duration_weeks=int(doc.get("duration_weeks", 4)),
                        current_ats_score=float(doc.get("current_ats_score", 0.0)),
                        estimated_target_score=float(doc.get("estimated_target_score", 0.0)),
                        overall_progress=float(doc.get("overall_progress", 0.0)),
                        created_at=doc.get("created_at", datetime.now(timezone.utc))
                    ))

        return RoadmapListResponse(items=items, total=len(items))

    @classmethod
    def get_roadmap(cls, roadmap_id: str, current_user: Dict[str, Any]) -> RoadmapResponse:
        """
        Retrieves single roadmap with strict user ownership enforcement.
        """
        user_id = str(current_user.get("id", ""))
        rm_col = mongo_manager.roadmaps
        doc = None

        if rm_col is not None:
            if ObjectId.is_valid(roadmap_id):
                doc = rm_col.find_one({"_id": ObjectId(roadmap_id)})
            if not doc:
                doc = rm_col.find_one({"_id": roadmap_id})
        else:
            doc = _IN_MEMORY_ROADMAPS.get(roadmap_id)

        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Roadmap '{roadmap_id}' not found."
            )

        if str(doc.get("user_id")) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: you do not have permission to view this roadmap."
            )

        return cls._doc_to_response(doc)

    @classmethod
    def update_task_status(
        cls,
        roadmap_id: str,
        task_id: str,
        status_value: str,
        current_user: Dict[str, Any]
    ) -> RoadmapResponse:
        """
        Updates task completion status and recalculates weekly and overall progress metrics.
        """
        user_id = str(current_user.get("id", ""))
        rm_col = mongo_manager.roadmaps
        doc = None

        if rm_col is not None:
            if ObjectId.is_valid(roadmap_id):
                doc = rm_col.find_one({"_id": ObjectId(roadmap_id)})
            if not doc:
                doc = rm_col.find_one({"_id": roadmap_id})
        else:
            doc = _IN_MEMORY_ROADMAPS.get(roadmap_id)

        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Roadmap '{roadmap_id}' not found."
            )

        if str(doc.get("user_id")) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: you do not have permission to update this roadmap."
            )

        # Find task and update status
        weeks_data = doc.get("weeks", [])
        task_found = False
        for w in weeks_data:
            for t in w.get("tasks", []):
                if t.get("id") == task_id:
                    t["status"] = status_value
                    task_found = True
                    break
            if task_found:
                break

        if not task_found:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task '{task_id}' not found in roadmap '{roadmap_id}'."
            )

        # Recalculate progress metrics
        updated_progress = roadmap_engine.recalculate_progress(weeks_data)
        doc["weeks"] = updated_progress["weeks"]
        doc["overall_progress"] = updated_progress["overall_progress"]
        doc["completed_tasks_count"] = updated_progress["completed_tasks_count"]
        doc["total_tasks_count"] = updated_progress["total_tasks_count"]
        doc["updated_at"] = datetime.now(timezone.utc)

        # Save to DB
        if rm_col is not None:
            if ObjectId.is_valid(roadmap_id):
                rm_col.update_one({"_id": ObjectId(roadmap_id)}, {"$set": doc})
            else:
                rm_col.update_one({"_id": roadmap_id}, {"$set": doc})
        else:
            _IN_MEMORY_ROADMAPS[roadmap_id] = doc

        return cls._doc_to_response(doc)

    @classmethod
    def regenerate_roadmap(
        cls,
        roadmap_id: str,
        duration_weeks: int,
        current_user: Dict[str, Any]
    ) -> RoadmapResponse:
        """
        Regenerates existing roadmap with a modified duration while preserving metadata.
        """
        # Fetch existing roadmap
        old_roadmap = cls.get_roadmap(roadmap_id, current_user)

        # Generate new plan
        return cls.generate_roadmap(
            resume_id=old_roadmap.resume_id,
            job_id=old_roadmap.job_id,
            skill_gap_analysis_id=old_roadmap.skill_gap_analysis_id,
            duration_weeks=duration_weeks,
            current_user=current_user
        )

    @classmethod
    def delete_roadmap(cls, roadmap_id: str, current_user: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deletes roadmap document from MongoDB.
        """
        user_id = str(current_user.get("id", ""))
        rm_col = mongo_manager.roadmaps
        doc = None

        if rm_col is not None:
            if ObjectId.is_valid(roadmap_id):
                doc = rm_col.find_one({"_id": ObjectId(roadmap_id)})
            if not doc:
                doc = rm_col.find_one({"_id": roadmap_id})
        else:
            doc = _IN_MEMORY_ROADMAPS.get(roadmap_id)

        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Roadmap '{roadmap_id}' not found."
            )

        if str(doc.get("user_id")) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: you do not have permission to delete this roadmap."
            )

        if rm_col is not None:
            if ObjectId.is_valid(roadmap_id):
                rm_col.delete_one({"_id": ObjectId(roadmap_id)})
            else:
                rm_col.delete_one({"_id": roadmap_id})
        else:
            _IN_MEMORY_ROADMAPS.pop(roadmap_id, None)

        return {
            "status": "success",
            "message": "Roadmap deleted successfully.",
            "deleted_id": roadmap_id
        }


roadmap_service = RoadmapService()

