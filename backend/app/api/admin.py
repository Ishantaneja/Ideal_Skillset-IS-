from datetime import datetime
from fastapi import APIRouter, Depends, status, HTTPException
from typing import Dict, Any, List
from app.core.dependencies import get_current_admin
from app.database.connection import mongo_manager
from app.services.auth_service import _IN_MEMORY_USERS
from app.services.readiness_service import _IN_MEMORY_READINESS
from app.services.resume_service import _IN_MEMORY_RESUMES
from pymongo import DESCENDING
from bson import ObjectId
import logging
from app.services.readiness_service import readiness_service
from app.services.skill_gap_service import skill_gap_service

router = APIRouter(prefix="/admin", tags=["Admin Portal"])


@router.get("/test", summary="Test Admin Router")
async def test_admin():
    return {
        "status": "ok",
        "module": "admin",
        "message": "Admin router is reachable"
    }


@router.get("/overview", summary="Admin Analytics Overview")
async def get_admin_overview(
    current_admin: Dict[str, Any] = Depends(get_current_admin)
) -> Dict[str, Any]:
    """
    Returns admin platform analytics, recent candidate records,
    and system activity logs.
    Requires admin privileges.
    """

    # MongoDB collections
    users_col = mongo_manager.user_data
    resumes_col = mongo_manager.resumes
    assessments_col = mongo_manager.assessments
    interviews_col = mongo_manager.interviews

    # ---------------------------------
    # 1. TOTAL USERS
    # ---------------------------------
    if users_col is not None:
        total_users_count = users_col.count_documents({
            "role": {"$nin": ["admin", "ADMIN"]}
        })
    else:
        total_users_count = len(_IN_MEMORY_USERS)

    # ---------------------------------
    # 2. RESUMES ANALYZED
    # ---------------------------------
    if resumes_col is not None:
        resumes_analyzed_count = resumes_col.count_documents({})
    else:
        resumes_analyzed_count = len(_IN_MEMORY_RESUMES)

    # ---------------------------------
    # 3. ASSESSMENTS COMPLETED
    # ---------------------------------
    if assessments_col is not None:
        assessments_completed_count = assessments_col.count_documents({})
    else:
        assessments_completed_count = 0

    # ---------------------------------
    # 4. INTERVIEWS COMPLETED
    # ---------------------------------
    if interviews_col is not None:
        interviews_completed_count = interviews_col.count_documents({})
    else:
        interviews_completed_count = 0

    # ---------------------------------
    # 5. RECENT USERS
    # ---------------------------------
    recent_users = []

    if users_col is not None:

        cursor = (
            users_col
            .find(
                {"role": {"$nin": ["admin", "ADMIN"]}},
                {"password_hash": 0}
            )
            .sort("created_at", DESCENDING)
            .limit(5)
        )

        for doc in cursor:

            # User ID used by Readiness collection
            user_id = str(doc.get("_id"))

            # Find latest Readiness Twin for this user
            readiness_score = None

            if mongo_manager.readiness is not None:
                readiness_doc = mongo_manager.readiness.find_one(
                    {"user_id": user_id},
                    sort=[("created_at", DESCENDING)]
                )

                if readiness_doc:
                    readiness_score = readiness_doc.get(
                        "overall_readiness_score"
                    )

            # Format readiness for frontend
            if readiness_score is not None:
                readiness_display = f"{float(readiness_score):.0f}%"
            else:
                readiness_display = "N/A"

            recent_users.append({
                "id": str(doc.get("_id")),
                "name": doc.get("name", "User"),
                "email": doc.get("email", ""),
                "role": doc.get("target_role", "Not specified"),
                "date": (
                    doc.get("created_at").strftime("%d-%m-%Y")
                    if doc.get("created_at")
                    else "Unknown"
                ),
                "status": "Active" if doc.get("is_active", True) else "Inactive",
                "readiness": readiness_display
            })

    else:

        for doc in list(_IN_MEMORY_USERS.values())[-5:]:

            user_id = str(doc.get("_id"))

            readiness_score = None

            if user_id:
                for readiness_doc in _IN_MEMORY_READINESS.values():
                    if str(readiness_doc.get("user_id")) == user_id:

                        score = readiness_doc.get(
                            "overall_readiness_score"
                        )

                        if score is not None:
                            readiness_score = score

            if readiness_score is not None:
                readiness_display = f"{float(readiness_score):.0f}%"
            else:
                readiness_display = "N/A"

            recent_users.append({
                "name": doc.get("name", "User"),
                "email": doc.get("email", ""),
                "role": doc.get("target_role", "Not specified"),
                "date": str(doc.get("created_at", "")),
                "status": "Active",
                "readiness": readiness_display
            })

    # ---------------------------------
    # 5B. LATEST REGISTRATION ACTIVITY
    # ---------------------------------
    recent_activity = []

    if users_col is not None:
        latest_user = users_col.find_one(
            {"role": {"$nin": ["admin", "ADMIN"]}},
            {"password_hash": 0},
            sort=[("created_at", DESCENDING)]
        )

        if latest_user:
            recent_activity.append({
                "action": "New Candidate Registration",
                "user": latest_user.get("name", "User"),
                "time": str(latest_user.get("created_at", "Recently")),
                "tag": "Auth"
            })

    else:
        if _IN_MEMORY_USERS:
            latest_user = max(
                _IN_MEMORY_USERS.values(),
                key=lambda x: x.get("created_at", datetime.min)
            )

            recent_activity.append({
                "action": "New Candidate Registration",
                "user": latest_user.get("name", "User"),
                "time": str(latest_user.get("created_at", "Recently")),
                "tag": "Auth"
            })

    # ---------------------------------
    # 5C. LATEST RESUME ACTIVITY
    # ---------------------------------
    if resumes_col is not None:

        latest_resume = resumes_col.find_one(
            {},
            sort=[("uploaded_at", DESCENDING)]
        )

        if latest_resume:

            resume_user_id = str(latest_resume.get("user_id", ""))

            resume_user = users_col.find_one(
                {"_id": ObjectId(resume_user_id)},
                {"name": 1}
            ) if users_col is not None and ObjectId.is_valid(resume_user_id) else None

            resume_user_name = (
                resume_user.get("name", "User")
                if resume_user
                else "User"
            )

            parsing_status = latest_resume.get(
                "parsing_status",
                "completed"
            )

            if parsing_status in ["completed", "partial"]:
                activity_action = "Resume Uploaded & Parsed"
            else:
                activity_action = "Resume Uploaded"

            recent_activity.append({
                "action": activity_action,
                "user": resume_user_name,
                "time": str(
                    latest_resume.get(
                        "uploaded_at",
                        "Recently"
                    )
                ),
                "tag": "Resume"
            })

    else:

        if _IN_MEMORY_RESUMES:

            latest_resume = max(
                _IN_MEMORY_RESUMES.values(),
                key=lambda x: x.get("uploaded_at", datetime.min)
            )

            resume_user_id = str(
                latest_resume.get("user_id", "")
            )

            resume_user_name = "User"

            if users_col is not None:
                resume_user = users_col.find_one(
                    {"_id": ObjectId(resume_user_id)},
                    {"name": 1}
                ) if ObjectId.is_valid(resume_user_id) else None

                if resume_user:
                    resume_user_name = resume_user.get(
                        "name",
                        "User"
                    )

            else:
                user_doc = _IN_MEMORY_USERS.get(resume_user_id)

                if user_doc:
                    resume_user_name = user_doc.get(
                        "name",
                        "User"
                    )

            parsing_status = latest_resume.get(
                "parsing_status",
                "completed"
            )

            if parsing_status in ["completed", "partial"]:
                activity_action = "Resume Uploaded & Parsed"
            else:
                activity_action = "Resume Uploaded"

            recent_activity.append({
                "action": activity_action,
                "user": resume_user_name,
                "time": str(
                    latest_resume.get(
                        "uploaded_at",
                        "Recently"
                    )
                ),
                "tag": "Resume"
            })

    # ---------------------------------
    # 6. RETURN ADMIN DASHBOARD DATA
    # ---------------------------------
    return {
        "metrics": {
            "total_users": f"{total_users_count:,}",
            "resumes_analyzed": f"{resumes_analyzed_count:,}",
            "assessments_completed": f"{assessments_completed_count:,}",
            "interviews_completed": f"{interviews_completed_count:,}"
        },

        "recent_users": recent_users,

        "recent_activity": recent_activity
    }


@router.get("/users", summary="List All Users (Admin)")
async def get_all_users(
    current_admin: Dict[str, Any] = Depends(get_current_admin)
) -> Dict[str, Any]:
    """
    Returns registered users list for the admin dashboard.
    Requires admin privileges.
    """
    users_col = mongo_manager.user_data
    user_list = []
    if users_col is not None:
        cursor = users_col.find({"role": {"$nin": ["admin", "ADMIN"]}}, {"password_hash": 0}).sort("created_at", -1).limit(100)
        for doc in cursor:
            user_list.append({
                "id": str(doc.get("_id")),
                "name": doc.get("name", "User"),
                "email": doc.get("email"),
                "role": doc.get("role", "user"),
                "target_role": doc.get("target_role", "Data Analyst"),
                "created_at": doc.get("created_at"),
                "is_online": doc.get("is_online", False),
                "last_seen_at": doc.get("last_seen_at")
            })
    else:
        for doc in _IN_MEMORY_USERS.values():
            if doc.get("role") in ["admin", "ADMIN"]:
                continue
            user_list.append({
                "id": str(doc.get("_id")),
                "name": doc.get("name", "User"),
                "email": doc.get("email"),
                "role": doc.get("role", "user"),
                "target_role": doc.get("target_role", "Data Analyst"),
                "created_at": doc.get("created_at"),
                "is_online": doc.get("is_online", False),
                "last_seen_at": doc.get("last_seen_at")
            })

    return {
        "items": user_list,
        "total": len(user_list)
    }

@router.get("/users/{user_id}/readiness")
async def get_user_readiness(
    user_id: str,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    # Get candidate readiness data
    readiness_data = readiness_service.get_user_latest_analysis_for_admin(user_id)

    # Get candidate information from MongoDB
    candidate_name = "Candidate"
    candidate_email = ""
    candidate_role = readiness_data.job_title or "Not specified"

    users_col = mongo_manager.user_data

    if users_col is not None and ObjectId.is_valid(user_id):
        user_doc = users_col.find_one(
            {"_id": ObjectId(user_id)},
            {
                "name": 1,
                "email": 1,
                "target_role": 1
            }
        )

        if user_doc:
            candidate_name = user_doc.get("name", "Candidate")
            candidate_email = user_doc.get("email", "")
            candidate_role = user_doc.get(
                "target_role",
                candidate_role
            )

    # Return combined admin readiness data
    return {
        "id": user_id,
        "name": candidate_name,
        "email": candidate_email,
        "role": candidate_role,

        "job_title": readiness_data.job_title,

        "overall_readiness_score": readiness_data.overall_readiness_score,

        "dimensions": {
            "knowledge": readiness_data.dimensions.knowledge.model_dump(),
            "practical": readiness_data.dimensions.practical.model_dump(),
            "evidence": readiness_data.dimensions.evidence.model_dump(),
            "communication": readiness_data.dimensions.communication.model_dump(),
            "roadmap_progress": readiness_data.dimensions.roadmap_progress.model_dump(),
        },

        "verdict": readiness_data.verdict.model_dump()
        if hasattr(readiness_data.verdict, "model_dump")
        else readiness_data.verdict,

        "breakdown_list": readiness_data.breakdown_list,
    }

@router.get("/users/{user_id}/skill-gaps")
async def get_user_skill_gaps(
    user_id: str,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    return skill_gap_service.get_user_latest_analysis_for_admin(user_id)

@router.post("/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: str,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Deactivates a candidate account.
    Only administrators can perform this action.
    """

    users_col = mongo_manager.user_data

    if users_col is None:
        raise HTTPException(
            status_code=503,
            detail="MongoDB is currently unavailable."
        )

    # Validate candidate ID
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid candidate ID."
        )

    # Find candidate
    user_doc = users_col.find_one({
        "_id": ObjectId(user_id),
        "role": {"$nin": ["admin", "ADMIN"]}
    })

    if not user_doc:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found."
        )

    # Deactivate candidate
    users_col.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "is_active": False,
                "is_online": False,
                "updated_at": datetime.utcnow()
            }
        }
    )

    return {
        "status": "success",
        "message": "Candidate account deactivated successfully.",
        "user_id": user_id
    }

@router.post("/users/{user_id}/activate")
async def activate_user(
    user_id: str,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Reactivates a candidate account.
    Only administrators can perform this action.

    Only the account status is changed.
    Candidate data remains unchanged.
    """

    users_col = mongo_manager.user_data

    if users_col is None:
        raise HTTPException(
            status_code=503,
            detail="MongoDB is currently unavailable."
        )

    # Validate candidate ID
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid candidate ID."
        )

    # Find candidate
    user_doc = users_col.find_one({
        "_id": ObjectId(user_id),
        "role": {"$nin": ["admin", "ADMIN"]}
    })

    if not user_doc:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found."
        )

    # Reactivate candidate
    # Only account status is changed.
    users_col.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "is_active": True,
                "updated_at": datetime.utcnow()
            }
        }
    )

    return {
        "status": "success",
        "message": "Candidate account activated successfully.",
        "user_id": user_id
    }

@router.post("/job-roles", status_code=status.HTTP_201_CREATED)
async def create_job_role(
    payload: Dict[str, Any],
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Creates a new job role.
    Only administrators can create job roles.
    """

    job_roles_col = mongo_manager.job_roles

    if job_roles_col is None:
        raise HTTPException(
            status_code=503,
            detail="MongoDB is currently unavailable."
        )

    name = str(payload.get("name", "")).strip()
    description = str(payload.get("description", "")).strip()
    experience = str(payload.get("experience", "")).strip()
    skills = str(payload.get("skills", "")).strip()
    role_status = str(payload.get("status", "Active")).strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Job role name is required."
        )

    if not experience:
        raise HTTPException(
            status_code=400,
            detail="Experience level is required."
        )

    if not skills:
        raise HTTPException(
            status_code=400,
            detail="At least one required skill is needed."
        )

    existing_role = job_roles_col.find_one({
        "name": {
            "$regex": f"^{name}$",
            "$options": "i"
        }
    })

    if existing_role:
        raise HTTPException(
            status_code=409,
            detail="This job role already exists."
        )

    now = datetime.utcnow()

    job_role = {
        "name": name,
        "description": description,
        "experience": experience,
        "skills": skills,
        "status": role_status,
        "created_at": now,
        "updated_at": now,
    }

    result = job_roles_col.insert_one(job_role)

    return {
        "status": "success",
        "message": "Job role created successfully.",
        "job_role": {
            "id": str(result.inserted_id),
            "name": name,
            "description": description,
            "experience": experience,
            "skills": skills,
            "status": role_status,
            "created_at": now,
            "updated_at": now,
        }
    }

@router.put("/job-roles/{job_role_id}", status_code=status.HTTP_200_OK)
async def update_job_role(
    job_role_id: str,
    payload: Dict[str, Any],
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Updates an existing job role.
    Only administrators can update job roles.
    """

    job_roles_col = mongo_manager.job_roles

    if job_roles_col is None:
        raise HTTPException(
            status_code=503,
            detail="MongoDB is currently unavailable."
        )

    # Validate Job Role ID
    if not ObjectId.is_valid(job_role_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid job role ID."
        )

    # Find existing job role
    existing_role = job_roles_col.find_one({
        "_id": ObjectId(job_role_id)
    })

    if not existing_role:
        raise HTTPException(
            status_code=404,
            detail="Job role not found."
        )

    # Get updated values
    name = str(payload.get("name", "")).strip()
    description = str(payload.get("description", "")).strip()
    experience = str(payload.get("experience", "")).strip()
    skills = str(payload.get("skills", "")).strip()
    role_status = str(
        payload.get("status", "Active")
    ).strip()

    # Validation
    if not name:
        raise HTTPException(
            status_code=400,
            detail="Job role name is required."
        )

    if not experience:
        raise HTTPException(
            status_code=400,
            detail="Experience level is required."
        )

    if not skills:
        raise HTTPException(
            status_code=400,
            detail="At least one required skill is needed."
        )

    # Check duplicate role name
    duplicate_role = job_roles_col.find_one({
        "_id": {"$ne": ObjectId(job_role_id)},
        "name": {
            "$regex": f"^{name}$",
            "$options": "i"
        }
    })

    if duplicate_role:
        raise HTTPException(
            status_code=409,
            detail="Another job role with this name already exists."
        )

    now = datetime.utcnow()

    # Update job role
    job_roles_col.update_one(
        {
            "_id": ObjectId(job_role_id)
        },
        {
            "$set": {
                "name": name,
                "description": description,
                "experience": experience,
                "skills": skills,
                "status": role_status,
                "updated_at": now
            }
        }
    )

    return {
        "status": "success",
        "message": "Job role updated successfully.",
        "job_role": {
            "id": job_role_id,
            "name": name,
            "description": description,
            "experience": experience,
            "skills": skills,
            "status": role_status,
            "updated_at": now
        }
    }

@router.get("/job-roles", status_code=status.HTTP_200_OK)
async def get_job_roles(
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Returns all job roles for the admin portal
    along with the number of active participants
    for each job role.
    """

    job_roles_col = mongo_manager.job_roles
    users_col = mongo_manager.user_data

    if job_roles_col is None:
        raise HTTPException(
            status_code=503,
            detail="MongoDB is currently unavailable."
        )

    roles = []

    cursor = job_roles_col.find({}).sort("created_at", DESCENDING)

    for doc in cursor:

        role_name = doc.get("name", "")

        # ---------------------------------
        # Count active participants
        # ---------------------------------
        active_participants = 0

        if users_col is not None and role_name:

            active_participants = users_col.count_documents({
                "target_role": role_name,
                "is_active": True,
                "role": {"$nin": ["admin", "ADMIN"]}
            })

        roles.append({
            "id": str(doc.get("_id")),
            "name": role_name,
            "description": doc.get("description", ""),
            "experience": doc.get("experience", ""),
            "skills": doc.get("skills", ""),
            "status": doc.get("status", "Active"),
            "active_participants": active_participants,
            "created_at": doc.get("created_at"),
            "updated_at": doc.get("updated_at"),
        })

    return {
        "items": roles,
        "total": len(roles)
    }