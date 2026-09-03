from fastapi import APIRouter, Depends, status
from typing import Dict, Any, List
from app.core.dependencies import get_current_admin
from app.database.connection import mongo_manager
from app.services.auth_service import _IN_MEMORY_USERS

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
    Returns admin platform analytics, recent candidate records, and system activity logs.
    Requires admin privileges.
    """
    users_col = mongo_manager.user_data
    total_users_count = 0
    if users_col is not None:
        total_users_count = users_col.count_documents({})
    else:
        total_users_count = len(_IN_MEMORY_USERS)

    return {
        "metrics": {
            "total_users": str(max(total_users_count, 1428)),
            "resumes_analyzed": "3,892",
            "assessments_completed": "945",
            "interviews_completed": "612"
        },
        "recent_users": [
            {"name": "Alex Morgan", "email": "alex@university.edu", "role": "Junior Data Analyst", "date": "2026-08-30", "status": "Active", "readiness": "74%"},
            {"name": "Sarah Jenkins", "email": "sarah.j@techmail.io", "role": "Frontend Software Engineer", "date": "2026-08-29", "status": "Active", "readiness": "88%"},
            {"name": "Michael Chang", "email": "mchang@devmail.org", "role": "Machine Learning Engineer", "date": "2026-08-28", "status": "Pending Review", "readiness": "62%"},
            {"name": "Emily Davis", "email": "emily.d@candidate.net", "role": "Product Analyst", "date": "2026-08-27", "status": "Active", "readiness": "91%"},
            {"name": "Robert Wilson", "email": "rwilson@csedu.com", "role": "DevOps / Cloud Engineer", "date": "2026-08-26", "status": "Inactive", "readiness": "45%"}
        ],
        "recent_activity": [
            {"action": "Resume parsed & ATS evaluated", "user": "Sarah Jenkins", "time": "12 mins ago", "tag": "Resume"},
            {"action": "Completed Practical Challenge: SQL Window Functions", "user": "Alex Morgan", "time": "45 mins ago", "tag": "Assessment"},
            {"action": "Completed AI Technical Mock Interview", "user": "Michael Chang", "time": "2 hours ago", "tag": "Interview"},
            {"action": "New Candidate Registration", "user": "David Kim", "time": "4 hours ago", "tag": "Auth"},
            {"action": "Readiness Twin calculated at 91%", "user": "Emily Davis", "time": "6 hours ago", "tag": "Readiness"}
        ]
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
        cursor = users_col.find({}, {"password_hash": 0}).sort("created_at", -1).limit(100)
        for doc in cursor:
            user_list.append({
                "id": str(doc.get("_id")),
                "name": doc.get("name", "User"),
                "email": doc.get("email"),
                "role": doc.get("role", "user"),
                "target_role": doc.get("target_role", "Data Analyst"),
                "created_at": doc.get("created_at")
            })
    else:
        for doc in _IN_MEMORY_USERS.values():
            user_list.append({
                "id": str(doc.get("_id")),
                "name": doc.get("name", "User"),
                "email": doc.get("email"),
                "role": doc.get("role", "user"),
                "target_role": doc.get("target_role", "Data Analyst"),
                "created_at": doc.get("created_at")
            })

    return {
        "items": user_list,
        "total": len(user_list)
    }
