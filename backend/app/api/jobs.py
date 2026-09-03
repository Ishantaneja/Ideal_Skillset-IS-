from fastapi import APIRouter, Depends, UploadFile, File, status
from typing import Dict, Any
from app.models.job import (
    JobAnalyzeRequest,
    JobResponse,
    JobListResponse,
)
from app.services.job_service import job_service
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/jobs", tags=["Job Description Analysis"])


@router.get("/test", summary="Test Jobs Router")
async def test_jobs():
    """
    Verifies jobs router connectivity.
    """
    return {
        "status": "ok",
        "module": "jobs",
        "message": "Jobs analysis router is operational"
    }


@router.post(
    "/analyze",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Analyze Pasted Job Description"
)
async def analyze_job_text(
    payload: JobAnalyzeRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Analyzes pasted raw job description text.
    Extracts job info, required/preferred skills, experience, education, responsibilities, and qualifications.
    Stores structured document in MongoDB Jobs collection.
    """
    return job_service.analyze_text(payload.text, current_user)


@router.post(
    "/upload",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload & Analyze Job Description Document"
)
async def upload_and_analyze_job(
    file: UploadFile = File(..., description="Job description document in PDF or DOCX format (Max 10 MB)"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Uploads a JD document (PDF/DOCX), extracts text, parses structured requirements,
    and stores result in MongoDB Jobs collection.
    """
    return await job_service.upload_and_analyze(file, current_user)


@router.get(
    "",
    response_model=JobListResponse,
    status_code=status.HTTP_200_OK,
    summary="List User Analyzed Jobs"
)
async def list_jobs(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns all job descriptions analyzed by the authenticated user.
    """
    return job_service.get_user_jobs(current_user)


@router.get(
    "/market/summary",
    status_code=status.HTTP_200_OK,
    summary="Get Job Market Summary"
)
async def get_market_summary(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns market demand benchmarks for the candidate target role.
    """
    target_role = current_user.get("target_role", "Junior Data Analyst")
    return {
        "target_role": target_role,
        "market_demand": "High (4,800+ Openings)",
        "avg_salary": "$72,500 / yr",
        "top_required_skills": ["SQL", "Power BI", "Python", "Data Visualization", "Excel"],
        "recommended_work_mode": "Hybrid / Remote",
    }


@router.get(
    "/{job_id}",
    response_model=JobResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Job Analysis Detail"
)
async def get_job_detail(
    job_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Retrieves full details of a specific job description analysis.
    Enforces user ownership.
    """
    return job_service.get_job(job_id, current_user)


@router.delete(
    "/{job_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Job Analysis"
)
async def delete_job_analysis(
    job_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Deletes a job description document from MongoDB.
    Enforces user ownership.
    """
    return job_service.delete_job(job_id, current_user)


@router.post(
    "/{job_id}/reanalyze",
    response_model=JobResponse,
    status_code=status.HTTP_200_OK,
    summary="Re-analyze Job Description"
)
async def reanalyze_job(
    job_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Re-runs the parsing pipeline on the existing raw text of a job description.
    """
    return job_service.reanalyze_job(job_id, current_user)
