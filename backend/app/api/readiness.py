from fastapi import APIRouter, Depends, status
from typing import Dict, Any, Optional
from app.models.readiness import (
    ReadinessTwinAnalyzeRequest,
    ReadinessTwinResponse,
    ReadinessTwinListResponse,
)
from app.services.readiness_service import readiness_service
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/readiness", tags=["Readiness Twin"])


@router.get("/test", summary="Test Readiness Twin Router")
async def test_readiness():
    """
    Verifies Readiness Twin router connectivity.
    """
    return {
        "status": "ok",
        "module": "readiness",
        "message": "Readiness Twin router is operational"
    }


@router.post(
    "/analyze",
    response_model=ReadinessTwinResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate 5-Dimensional Readiness Twin Analysis"
)
async def analyze_readiness(
    payload: ReadinessTwinAnalyzeRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Synthesizes candidate readiness across 5 core dimensions:
    Knowledge, Practical Ability, Proof of Evidence, Communication, and Roadmap Execution.
    Generates candid ATS vs Real-World Readiness contrast and 'Should I Apply Now?' verdict.
    """
    return readiness_service.analyze_readiness(
        resume_id=payload.resume_id,
        job_id=payload.job_id,
        github_url=payload.github_url,
        portfolio_url=payload.portfolio_url,
        current_user=current_user
    )


@router.get(
    "",
    response_model=ReadinessTwinListResponse,
    status_code=status.HTTP_200_OK,
    summary="List User's Readiness Twin Analyses"
)
async def list_user_analyses(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Lists all Readiness Twin analyses for the authenticated user.
    """
    return readiness_service.get_user_analyses(current_user)


@router.get(
    "/job/{job_id}",
    response_model=ReadinessTwinResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Latest Readiness Twin for Job"
)
async def get_by_job(
    job_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Retrieves the latest Readiness Twin evaluation for a specific job requisition.
    """
    return readiness_service.get_by_job(job_id, current_user)


@router.get(
    "/{analysis_id}",
    response_model=ReadinessTwinResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Readiness Twin Details"
)
async def get_analysis(
    analysis_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Retrieves full details of a specific Readiness Twin evaluation. Enforces user ownership.
    """
    return readiness_service.get_analysis(analysis_id, current_user)


@router.delete(
    "/{analysis_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Readiness Twin Analysis"
)
async def delete_analysis(
    analysis_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Deletes a Readiness Twin analysis from MongoDB. Enforces user ownership.
    """
    return readiness_service.delete_analysis(analysis_id, current_user)
