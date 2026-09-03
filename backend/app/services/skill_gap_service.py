import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException, status

from app.models.skill_gap import (
    SkillGapAnalysisResponse,
    SkillGapListItem,
    SkillGapListResponse,
    SkillGapItem,
    SkillGapOverallSummary,
    SkillEvidenceItem,
)
from app.services.gap_engine import gap_engine, LEVEL_LABELS, GAP_LABELS
from app.services.resume_service import resume_service
from app.services.job_service import job_service
from app.database.connection import mongo_manager

logger = logging.getLogger("uvicorn.error")

_IN_MEMORY_SKILL_GAPS: Dict[str, Dict[str, Any]] = {}


class SkillGapService:
    """
    Coordinates intelligent skill gap analysis, enforcing user ownership,
    reusing existing ATS results, and managing persistence in MongoDB Skill_gaps.
    """

    @classmethod
    def _doc_to_response(cls, doc: Dict[str, Any]) -> SkillGapAnalysisResponse:
        """
        Converts MongoDB dictionary document to Pydantic SkillGapAnalysisResponse.
        """
        raw_skills = doc.get("skills", [])
        skills = []
        for s in raw_skills:
            ev = s.get("evidence", {})
            evidence_obj = SkillEvidenceItem(
                resume=ev.get("resume", []),
                job=ev.get("job", [])
            )
            skills.append(SkillGapItem(
                skill=s.get("skill", ""),
                normalized_skill=s.get("normalized_skill", ""),
                category=s.get("category", "General"),
                importance=s.get("importance", "high"),
                required=s.get("required", True),
                preferred=s.get("preferred", False),
                current_level=int(s.get("current_level", 0)),
                current_level_label=s.get("current_level_label", "None"),
                required_level=int(s.get("required_level", 3)),
                required_level_label=s.get("required_level_label", "Intermediate"),
                gap=int(s.get("gap", 0)),
                gap_label=s.get("gap_label", "Medium"),
                job_frequency=float(s.get("job_frequency", 0.5)),
                ats_impact=float(s.get("ats_impact", 0.0)),
                learning_effort=s.get("learning_effort", "medium"),
                estimated_learning_hours=int(s.get("estimated_learning_hours", 25)),
                priority_score=float(s.get("priority_score", 5.0)),
                priority_label=s.get("priority_label", "Medium"),
                reason=s.get("reason", ""),
                recommended_action=s.get("recommended_action", ""),
                recommended_topics=s.get("recommended_topics", []),
                evidence=evidence_obj
            ))

        raw_summary = doc.get("overall_gap_summary", {})
        summary = SkillGapOverallSummary(**raw_summary)

        return SkillGapAnalysisResponse(
            id=str(doc.get("_id", "")),
            user_id=str(doc.get("user_id", "")),
            resume_id=str(doc.get("resume_id", "")),
            job_id=str(doc.get("job_id", "")),
            job_title=doc.get("job_title"),
            company_name=doc.get("company_name"),
            resume_filename=doc.get("resume_filename"),
            overall_gap_summary=summary,
            skills=skills,
            recommended_learning_order=doc.get("recommended_learning_order", []),
            created_at=doc.get("created_at", datetime.now(timezone.utc)),
            updated_at=doc.get("updated_at", datetime.now(timezone.utc))
        )

    @classmethod
    def analyze_gaps(
        cls,
        resume_id: str,
        job_id: str,
        current_user: Dict[str, Any]
    ) -> SkillGapAnalysisResponse:
        """
        Executes intelligent skill gap analysis comparing candidate resume and job requirements.
        Reuses existing ATS result if available.
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

        # 3. Check for existing ATS result in MongoDB to reuse
        ats_col = mongo_manager.ats_results
        existing_ats = None
        if ats_col is not None:
            existing_ats = ats_col.find_one({
                "user_id": user_id,
                "resume_id": resume_id,
                "job_id": job_id
            })

        # 4. Run gap analysis
        analysis_data = gap_engine.analyze_gaps(resume_doc, job_doc, existing_ats)

        # 5. Prepare MongoDB document
        now = datetime.now(timezone.utc)
        result_doc = {
            "user_id": user_id,
            "resume_id": resume_id,
            "job_id": job_id,
            "job_title": analysis_data["job_title"],
            "company_name": analysis_data["company_name"],
            "resume_filename": analysis_data["resume_filename"],
            "overall_gap_summary": analysis_data["overall_gap_summary"],
            "skills": analysis_data["skills"],
            "recommended_learning_order": analysis_data["recommended_learning_order"],
            "created_at": now,
            "updated_at": now,
        }

        # 6. Persist to MongoDB Skill_gaps
        sg_col = mongo_manager.skill_gaps
        if sg_col is not None:
            res = sg_col.insert_one(result_doc)
            result_doc["_id"] = res.inserted_id
        else:
            doc_id_str = f"sg_{len(_IN_MEMORY_SKILL_GAPS) + 1}_{int(now.timestamp())}"
            result_doc["_id"] = doc_id_str
            _IN_MEMORY_SKILL_GAPS[doc_id_str] = result_doc

        logger.info(f"Generated Skill Gap Analysis for user {user_id} on job {analysis_data['job_title']}")
        return cls._doc_to_response(result_doc)

    @classmethod
    def get_user_analyses(cls, current_user: Dict[str, Any]) -> SkillGapListResponse:
        """
        Lists all skill gap analyses generated by the user.
        """
        user_id = str(current_user.get("id", ""))
        sg_col = mongo_manager.skill_gaps
        items: List[SkillGapListItem] = []

        if sg_col is not None:
            cursor = sg_col.find({"user_id": user_id}).sort("created_at", -1)
            for doc in cursor:
                summary = doc.get("overall_gap_summary", {})
                items.append(SkillGapListItem(
                    id=str(doc.get("_id")),
                    resume_id=str(doc.get("resume_id")),
                    job_id=str(doc.get("job_id")),
                    job_title=doc.get("job_title") or "Target Role",
                    company_name=doc.get("company_name"),
                    critical_gaps_count=summary.get("critical", 0),
                    total_gaps_count=summary.get("missing_skills_count", 0),
                    current_ats_score=float(summary.get("current_ats_score", 0.0)),
                    potential_ats_score=float(summary.get("potential_ats_score", 0.0)),
                    created_at=doc.get("created_at", datetime.now(timezone.utc))
                ))
        else:
            for doc in sorted(_IN_MEMORY_SKILL_GAPS.values(), key=lambda x: x.get("created_at", datetime.min), reverse=True):
                if doc.get("user_id") == user_id:
                    summary = doc.get("overall_gap_summary", {})
                    items.append(SkillGapListItem(
                        id=str(doc.get("_id")),
                        resume_id=str(doc.get("resume_id")),
                        job_id=str(doc.get("job_id")),
                        job_title=doc.get("job_title") or "Target Role",
                        company_name=doc.get("company_name"),
                        critical_gaps_count=summary.get("critical", 0),
                        total_gaps_count=summary.get("missing_skills_count", 0),
                        current_ats_score=float(summary.get("current_ats_score", 0.0)),
                        potential_ats_score=float(summary.get("potential_ats_score", 0.0)),
                        created_at=doc.get("created_at", datetime.now(timezone.utc))
                    ))

        return SkillGapListResponse(items=items, total=len(items))

    @classmethod
    def get_analysis(cls, analysis_id: str, current_user: Dict[str, Any]) -> SkillGapAnalysisResponse:
        """
        Retrieves a single skill gap analysis with strict user ownership enforcement.
        """
        user_id = str(current_user.get("id", ""))
        sg_col = mongo_manager.skill_gaps
        doc = None

        if sg_col is not None:
            if ObjectId.is_valid(analysis_id):
                doc = sg_col.find_one({"_id": ObjectId(analysis_id)})
            if not doc:
                doc = sg_col.find_one({"_id": analysis_id})
        else:
            doc = _IN_MEMORY_SKILL_GAPS.get(analysis_id)

        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Skill gap analysis '{analysis_id}' not found."
            )

        if str(doc.get("user_id")) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: you do not have permission to view this skill gap analysis."
            )

        return cls._doc_to_response(doc)

    @classmethod
    def get_by_job(cls, job_id: str, current_user: Dict[str, Any]) -> SkillGapAnalysisResponse:
        """
        Retrieves latest skill gap analysis for a specific job.
        """
        user_id = str(current_user.get("id", ""))
        sg_col = mongo_manager.skill_gaps
        doc = None

        if sg_col is not None:
            doc = sg_col.find_one({"user_id": user_id, "job_id": job_id}, sort=[("created_at", -1)])
        else:
            for d in sorted(_IN_MEMORY_SKILL_GAPS.values(), key=lambda x: x.get("created_at", datetime.min), reverse=True):
                if d.get("user_id") == user_id and d.get("job_id") == job_id:
                    doc = d
                    break

        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No skill gap analysis found for job '{job_id}'."
            )

        return cls._doc_to_response(doc)

    @classmethod
    def get_by_resume(cls, resume_id: str, current_user: Dict[str, Any]) -> SkillGapAnalysisResponse:
        """
        Retrieves latest skill gap analysis for a specific resume.
        """
        user_id = str(current_user.get("id", ""))
        sg_col = mongo_manager.skill_gaps
        doc = None

        if sg_col is not None:
            doc = sg_col.find_one({"user_id": user_id, "resume_id": resume_id}, sort=[("created_at", -1)])
        else:
            for d in sorted(_IN_MEMORY_SKILL_GAPS.values(), key=lambda x: x.get("created_at", datetime.min), reverse=True):
                if d.get("user_id") == user_id and d.get("resume_id") == resume_id:
                    doc = d
                    break

        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No skill gap analysis found for resume '{resume_id}'."
            )

        return cls._doc_to_response(doc)

    @classmethod
    def delete_analysis(cls, analysis_id: str, current_user: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deletes a skill gap analysis record from MongoDB.
        """
        user_id = str(current_user.get("id", ""))
        sg_col = mongo_manager.skill_gaps
        doc = None

        if sg_col is not None:
            if ObjectId.is_valid(analysis_id):
                doc = sg_col.find_one({"_id": ObjectId(analysis_id)})
            if not doc:
                doc = sg_col.find_one({"_id": analysis_id})
        else:
            doc = _IN_MEMORY_SKILL_GAPS.get(analysis_id)

        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Skill gap analysis '{analysis_id}' not found."
            )

        if str(doc.get("user_id")) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: you do not have permission to delete this skill gap analysis."
            )

        if sg_col is not None:
            if ObjectId.is_valid(analysis_id):
                sg_col.delete_one({"_id": ObjectId(analysis_id)})
            else:
                sg_col.delete_one({"_id": analysis_id})
        else:
            _IN_MEMORY_SKILL_GAPS.pop(analysis_id, None)

        return {
            "status": "success",
            "message": "Skill gap analysis deleted successfully.",
            "deleted_id": analysis_id
        }

    @classmethod
    def simulate_gaps(
        cls,
        analysis_id: Optional[str],
        resume_id: Optional[str],
        job_id: Optional[str],
        improved_skills: Dict[str, int],
        current_user: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Simulates ATS and readiness improvements when candidate levels up specific skills.
        """
        if analysis_id:
            base_report = cls.get_analysis(analysis_id, current_user)
        elif resume_id and job_id:
            base_report = cls.analyze_gaps(resume_id, job_id, current_user)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Must provide either analysis_id or (resume_id and job_id)."
            )

        base_score = base_report.overall_gap_summary.current_ats_score
        total_gain = 0.0
        applied = []

        # Find matching skills in the report
        for s in base_report.skills:
            skill_name = s.skill
            if skill_name in improved_skills:
                target_level = improved_skills[skill_name]
                if target_level >= s.required_level and s.gap > 0:
                    gain = s.ats_impact
                    total_gain += gain
                    applied.append({
                        "skill": skill_name,
                        "old_level": s.current_level,
                        "target_level": target_level,
                        "gain": gain,
                        "gap_closed": True
                    })
                elif target_level > s.current_level and s.gap > 0:
                    partial_factor = (target_level - s.current_level) / max(s.gap, 1)
                    gain = round(s.ats_impact * partial_factor, 1)
                    total_gain += gain
                    applied.append({
                        "skill": skill_name,
                        "old_level": s.current_level,
                        "target_level": target_level,
                        "gain": gain,
                        "gap_closed": False
                    })

        simulated_score = min(100.0, round(base_score + total_gain, 1))

        return {
            "base_score": base_score,
            "simulated_score": simulated_score,
            "score_gain": round(total_gain, 1),
            "improved_skills_count": len(applied),
            "applied_improvements": applied,
            "simulated_label": "High Readiness" if simulated_score >= 80 else "Moderate Readiness" if simulated_score >= 60 else "Developing"
        }


skill_gap_service = SkillGapService()

