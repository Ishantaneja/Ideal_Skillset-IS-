from fastapi import APIRouter, Depends, status
from typing import Dict, Any, Optional
from app.models.roadmap import (
    RoadmapGenerateRequest,
    RoadmapTaskUpdateRequest,
    RoadmapRegenerateRequest,
    RoadmapResponse,
    RoadmapListResponse,
)
from app.services.roadmap_service import roadmap_service
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/roadmaps", tags=["Personalized Career Roadmap"])


@router.get("/test", summary="Test Roadmap Router")
async def test_roadmap():
    """
    Verifies Roadmap router connectivity.
    """
    return {
        "status": "ok",
        "module": "roadmaps",
        "message": "Personalized Career Roadmap router is operational"
    }


@router.post(
    "/generate",
    response_model=RoadmapResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate Personalized Career Roadmap"
)
async def generate_roadmap(
    payload: RoadmapGenerateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Generates an adaptive, week-by-week personalized career readiness roadmap
    based on the candidate's resume, target job description, ATS score, and skill gaps.
    """
    return roadmap_service.generate_roadmap(
        resume_id=payload.resume_id,
        job_id=payload.job_id,
        skill_gap_analysis_id=payload.skill_gap_analysis_id,
        duration_weeks=payload.duration_weeks or 4,
        current_user=current_user
    )


@router.get(
    "",
    response_model=RoadmapListResponse,
    status_code=status.HTTP_200_OK,
    summary="List User's Roadmaps"
)
async def list_user_roadmaps(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Lists all career roadmaps created by the authenticated user.
    """
    return roadmap_service.get_user_roadmaps(current_user)


@router.get(
    "/{roadmap_id}",
    response_model=RoadmapResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Roadmap Details"
)
async def get_roadmap(
    roadmap_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Retrieves full details of a specific career roadmap. Enforces user ownership.
    """
    return roadmap_service.get_roadmap(roadmap_id, current_user)


@router.patch(
    "/{roadmap_id}/tasks/{task_id}",
    response_model=RoadmapResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Roadmap Task Completion Status"
)
async def update_task_status(
    roadmap_id: str,
    task_id: str,
    payload: RoadmapTaskUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Updates the status of a specific task (not_started | in_progress | completed)
    and dynamically recalculates weekly and overall progress metrics.
    """
    return roadmap_service.update_task_status(
        roadmap_id=roadmap_id,
        task_id=task_id,
        status_value=payload.status,
        current_user=current_user
    )


@router.post(
    "/{roadmap_id}/regenerate",
    response_model=RoadmapResponse,
    status_code=status.HTTP_200_OK,
    summary="Regenerate Roadmap Duration"
)
async def regenerate_roadmap(
    roadmap_id: str,
    payload: RoadmapRegenerateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Regenerates an existing roadmap with a modified duration while preserving metadata.
    """
    return roadmap_service.regenerate_roadmap(
        roadmap_id=roadmap_id,
        duration_weeks=payload.duration_weeks or 4,
        current_user=current_user
    )


@router.delete(
    "/{roadmap_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Roadmap"
)
async def delete_roadmap(
    roadmap_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Deletes a career roadmap from MongoDB. Enforces user ownership.
    """
    return roadmap_service.delete_roadmap(roadmap_id, current_user)
