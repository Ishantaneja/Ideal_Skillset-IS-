from fastapi import APIRouter, Depends, Query, status
from typing import Dict, Any, Optional

from app.core.dependencies import require_admin
from app.services.admin_service import admin_service
from app.models.admin import (
    AdminDashboardResponse,
    AdminUserListResponse,
    AdminUserDetails,
    UserRoleUpdateRequest,
    AdminResumeListResponse,
    AdminJobListResponse,
    AdminAssessmentListResponse,
    AdminReadinessAnalyticsResponse,
    AdminSkillAnalyticsResponse,
    AdminAuditLogListResponse,
    AdminSystemHealthResponse,
    AdminATSAnalyticsResponse,
    AdminAssessmentAnalyticsResponse,
    AdminInterviewAnalyticsResponse,
    AdminRoadmapAnalyticsResponse,
    AdminAIHealthResponse,
    AdminNotificationListResponse,
)

router = APIRouter(prefix="/admin", tags=["Admin Portal"])


# ---------------------------------------------------------------------------
# Diagnostics & Health Check
# ---------------------------------------------------------------------------

@router.get(
    "/health",
    response_model=AdminSystemHealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Admin System & Environment Health"
)
async def get_admin_health(
    current_admin: Dict[str, Any] = Depends(require_admin)
):
    """
    Returns platform diagnostics, live MongoDB status, AI service readiness, and server health.
    Requires administrator privileges.
    """
    return admin_service.get_system_health()


@router.get(
    "/test",
    status_code=status.HTTP_200_OK,
    summary="Test Admin Router Connectivity"
)
async def test_admin():
    """
    Public connectivity check for admin router mount.
    """
    return {
        "status": "ok",
        "module": "admin",
        "message": "Admin router is reachable and operational"
    }


# ---------------------------------------------------------------------------
# Dashboard Analytics
# ---------------------------------------------------------------------------

@router.get(
    "/dashboard",
    response_model=AdminDashboardResponse,
    status_code=status.HTTP_200_OK,
    summary="Admin Dashboard Summary Statistics"
)
async def get_admin_dashboard(
    current_admin: Dict[str, Any] = Depends(require_admin)
):
    """
    Returns live summary metrics (users, resumes, jobs, assessments, readiness analyses)
    calculated directly from MongoDB collections, along with recent candidate registrations
    and administrative activity logs.
    """
    return admin_service.get_dashboard_stats()


@router.get(
    "/overview",
    status_code=status.HTTP_200_OK,
    summary="Admin Overview (Legacy Compatibility)"
)
async def get_admin_overview(
    current_admin: Dict[str, Any] = Depends(require_admin)
):
    """
    Backward-compatible overview endpoint returning structured platform metrics.
    """
    dash = admin_service.get_dashboard_stats()
    return {
        "metrics": {
            "total_users": str(dash.metrics.total_users),
            "resumes_analyzed": str(dash.metrics.total_resumes),
            "assessments_completed": str(dash.metrics.total_assessments),
            "interviews_completed": str(dash.metrics.total_readiness_analyses)
        },
        "recent_users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.target_role,
                "date": u.created_at.strftime("%Y-%m-%d") if u.created_at else "Recently",
                "status": "Active",
                "readiness": "78%"
            }
            for u in dash.recent_users
        ],
        "recent_activity": [
            {
                "id": a.id,
                "action": a.action,
                "user": a.admin_email or "Administrator",
                "time": a.timestamp.strftime("%b %d, %H:%M"),
                "tag": a.target_type or "System"
            }
            for a in dash.recent_activity
        ]
    }


# ---------------------------------------------------------------------------
# User Management
# ---------------------------------------------------------------------------

@router.get(
    "/users",
    response_model=AdminUserListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Registered Users with Pagination & Filters"
)
async def get_all_users(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search term for name, email, or role"),
    role: Optional[str] = Query(None, description="Filter by role: 'user', 'admin', or 'all'"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: int = Query(-1, description="Sort order: 1 for ascending, -1 for descending"),
    current_admin: Dict[str, Any] = Depends(require_admin)
):
    """
    Returns paginated list of candidate users and administrators.
    Never exposes password hashes or verification secrets.
    """
    return admin_service.get_users(
        page=page,
        limit=limit,
        search=search,
        role=role,
        sort_by=sort_by,
        sort_order=sort_order
    )


@router.get(
    "/users/{user_id}",
    response_model=AdminUserDetails,
    status_code=status.HTTP_200_OK,
    summary="Get Detailed Candidate Profile by ID"
)
async def get_user_details(
    user_id: str,
    current_admin: Dict[str, Any] = Depends(require_admin)
):
    """
    Retrieves complete candidate profile details, educational history, target role,
    and associated artifact counts.
    """
    return admin_service.get_user_details(user_id, current_admin)


@router.put(
    "/users/{user_id}/role",
    status_code=status.HTTP_200_OK,
    summary="Update User Role (User <-> Admin)"
)
async def update_user_role(
    user_id: str,
    payload: UserRoleUpdateRequest,
    current_admin: Dict[str, Any] = Depends(require_admin)
):
    """
    Modifies candidate role. Enforces safeguard preventing removal of the last administrator.
    Records administrative audit action.
    """
    return admin_service.update_user_role(user_id, payload.role, current_admin)


@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Candidate Account"
)
async def delete_user(
    user_id: str,
    current_admin: Dict[str, Any] = Depends(require_admin)
):
    """
    Deletes a candidate account. Enforces safeguard preventing self-deletion and last-admin deletion.
    Records administrative audit action.
    """
    return admin_service.delete_user(user_id, current_admin)


# ---------------------------------------------------------------------------
# Resumes Management
# ---------------------------------------------------------------------------

@router.get(
    "/resumes",
    response_model=AdminResumeListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Candidate Resumes"
)
async def get_admin_resumes(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    parsing_status: Optional[str] = Query(None),
    current_admin: Dict[str, Any] = Depends(require_admin)
):
    """
    Returns candidate uploaded resumes with metadata and owner email details.
    """
    return admin_service.get_resumes(
        page=page,
        limit=limit,
        search=search,
        parsing_status=parsing_status
    )


# ---------------------------------------------------------------------------
# Jobs Management
# ---------------------------------------------------------------------------

@router.get(
    "/jobs",
    response_model=AdminJobListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Analyzed Job Requisitions"
)
async def get_admin_jobs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    work_mode: Optional[str] = Query(None),
    current_admin: Dict[str, Any] = Depends(require_admin)
):
    """
    Returns analyzed job requisitions with company and skill requirement counts.
    """
    return admin_service.get_jobs(
        page=page,
        limit=limit,
        search=search,
        work_mode=work_mode
    )


# ---------------------------------------------------------------------------
# Assessments Management
# ---------------------------------------------------------------------------

@router.get(
    "/assessments",
    response_model=AdminAssessmentListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Practical Assessments & Simulation Records"
)
async def get_admin_assessments(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_admin: Dict[str, Any] = Depends(require_admin)
):
    """
    Returns candidate practical simulation attempts and scores.
    """
    return admin_service.get_assessments(
        page=page,
        limit=limit,
        search=search
    )


# ---------------------------------------------------------------------------
# Readiness Analytics
# ---------------------------------------------------------------------------

@router.get(
    "/readiness",
    response_model=AdminReadinessAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Platform Readiness Twin Competency Analytics"
)
async def get_admin_readiness(
    current_admin: Dict[str, Any] = Depends(require_admin)
):
    """
    Returns aggregate competency scores across all 5 dimensions and score distribution histogram.
    """
    return admin_service.get_readiness_analytics()


@router.get(
    "/readiness/analytics",
    response_model=AdminReadinessAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Platform Readiness Twin Competency Analytics (Dedicated Route)"
)
async def get_admin_readiness_analytics(
    current_admin: Dict[str, Any] = Depends(require_admin)
):
    """
    Alias dedicated route for platform Readiness Twin competency analytics.
    """
    return admin_service.get_readiness_analytics()


# ---------------------------------------------------------------------------
# ATS Analytics
# ---------------------------------------------------------------------------

@router.get(
    "/ats/analytics",
    response_model=AdminATSAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Resume ATS Analytics & Keyword Match Trends"
)
async def get_admin_ats_analytics(
    current_admin: Dict[str, Any] = Depends(require_admin)
):
    """
    Returns aggregate ATS score distribution (90-100, 75-89, 60-74, 40-59, 0-39),
    common missing skills, and structural problem breakdowns.
    """
    return admin_service.get_ats_analytics()


# ---------------------------------------------------------------------------
# Assessment Analytics
# ---------------------------------------------------------------------------

@router.get(
    "/assessments/analytics",
    response_model=AdminAssessmentAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Assessment Attempts, Pass Rates & Skill Difficulty"
)
async def get_admin_assessment_analytics(
    current_admin: Dict[str, Any] = Depends(require_admin)
):
    """
    Returns attempt counts, pass rates, completion rates, and skill difficulty matrix.
    """
    return admin_service.get_assessment_analytics()


# ---------------------------------------------------------------------------
# Interview Analytics
# ---------------------------------------------------------------------------

@router.get(
    "/interviews/analytics",
    response_model=AdminInterviewAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Mock Interview Analytics & Performance Sub-Scores"
)
async def get_admin_interview_analytics(
    current_admin: Dict[str, Any] = Depends(require_admin)
):
    """
    Returns mock interview analytics across technical, communication, confidence,
    problem solving, and behavioral sub-scores, plus common weaknesses.
    """
    return admin_service.get_interview_analytics()


# ---------------------------------------------------------------------------
# Roadmap Analytics
# ---------------------------------------------------------------------------

@router.get(
    "/roadmaps/analytics",
    response_model=AdminRoadmapAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Candidate Learning Roadmap Completion & Drop-Off Analytics"
)
async def get_admin_roadmap_analytics(
    current_admin: Dict[str, Any] = Depends(require_admin)
):
    """
    Returns roadmap generation, active/completion counts, abandoned week drop rates,
    and task type distributions.
    """
    return admin_service.get_roadmap_analytics()


# ---------------------------------------------------------------------------
# AI / Ollama Monitoring
# ---------------------------------------------------------------------------

@router.get(
    "/ai/health",
    response_model=AdminAIHealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Ollama AI Service Health & Inference Metrics"
)
async def get_admin_ai_health(
    current_admin: Dict[str, Any] = Depends(require_admin)
):
    """
    Returns Ollama connection health, active model info, total requests, failure counts,
    and average response latency.
    """
    return admin_service.get_ai_health()


# ---------------------------------------------------------------------------
# System Notifications & Alerts
# ---------------------------------------------------------------------------

@router.get(
    "/notifications",
    response_model=AdminNotificationListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Administrative System Notifications & Alerts"
)
async def get_admin_notifications(
    unread_only: bool = Query(False, description="Filter to only unread notifications"),
    current_admin: Dict[str, Any] = Depends(require_admin)
):
    """
    Returns system alerts and parsing/security notifications.
    """
    return admin_service.get_notifications(unread_only=unread_only)


@router.put(
    "/notifications/{notification_id}/read",
    status_code=status.HTTP_200_OK,
    summary="Mark Notification as Read"
)
async def mark_admin_notification_read(
    notification_id: str,
    current_admin: Dict[str, Any] = Depends(require_admin)
):
    """
    Marks a specific notification or all notifications as read.
    """
    return admin_service.mark_notification_read(notification_id)


# ---------------------------------------------------------------------------
# Skill Analytics
# ---------------------------------------------------------------------------

@router.get(
    "/skills/analytics",
    response_model=AdminSkillAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="In-Demand vs Missing Skills Market Analytics"
)
async def get_admin_skill_analytics(
    current_admin: Dict[str, Any] = Depends(require_admin)
):
    """
    Analyzes frequency of top in-demand job skills against most common candidate skill gaps.
    """
    return admin_service.get_skill_analytics()


# ---------------------------------------------------------------------------
# Administrative Audit Logs
# ---------------------------------------------------------------------------

@router.get(
    "/audit-logs",
    response_model=AdminAuditLogListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Administrative Audit Logs"
)
async def get_admin_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    action: Optional[str] = Query(None),
    current_admin: Dict[str, Any] = Depends(require_admin)
):
    """
    Returns paginated audit trail of all administrative actions.
    """
    return admin_service.get_audit_logs(
        page=page,
        limit=limit,
        action=action
    )