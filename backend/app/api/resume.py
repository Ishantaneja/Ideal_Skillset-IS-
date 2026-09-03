from fastapi import APIRouter, Depends, UploadFile, File, status
from typing import Dict, Any
from app.models.resume import (
    ResumeResponse,
    ResumeListResponse,
    ParsedResumeData,
)
from app.services.resume_service import resume_service
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/resumes", tags=["Resume Management & Parsing"])


@router.get("/test", summary="Test Resume Router")
async def test_resume():
    """
    Verifies resume router connectivity.
    """
    return {
        "status": "ok",
        "module": "resumes",
        "message": "Resume management router is operational"
    }


@router.post(
    "/upload",
    response_model=ResumeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload & Parse Resume"
)
async def upload_resume(
    file: UploadFile = File(..., description="Resume document in PDF or DOCX format (Max 10 MB)"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Uploads a resume document (PDF/DOCX), validates format and size,
    extracts plain text, parses structured sections (Skills, Education, Experience,
    Projects, Certifications), and saves metadata into MongoDB Resumes collection.
    """
    return await resume_service.upload_resume(file, current_user)


@router.get(
    "",
    response_model=ResumeListResponse,
    status_code=status.HTTP_200_OK,
    summary="List User Resumes"
)
async def list_resumes(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns the list of all resumes uploaded by the authenticated user.
    """
    return resume_service.get_user_resumes(current_user)


@router.get(
    "/{resume_id}",
    response_model=ResumeResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Resume Details"
)
async def get_resume_detail(
    resume_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Retrieves full details of a specific resume, including extracted text preview and parsed sections.
    Enforces user ownership.
    """
    return resume_service.get_resume(resume_id, current_user)


@router.get(
    "/{resume_id}/parsed",
    response_model=ParsedResumeData,
    status_code=status.HTTP_200_OK,
    summary="Get Parsed Resume Sections"
)
async def get_parsed_resume(
    resume_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Returns only the structured parsed sections (skills, education, experience, projects, certifications).
    """
    return resume_service.get_parsed_resume(resume_id, current_user)


@router.delete(
    "/{resume_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Resume"
)
async def delete_resume(
    resume_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Deletes the resume file from storage and removes the document from MongoDB.
    Enforces user ownership.
    """
    return resume_service.delete_resume(resume_id, current_user)


@router.put(
    "/{resume_id}/activate",
    response_model=ResumeResponse,
    status_code=status.HTTP_200_OK,
    summary="Set Active Resume"
)
async def set_active_resume(
    resume_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Marks a specific resume as the primary/active document for ATS and Job Matching.
    """
    return resume_service.set_active_resume(resume_id, current_user)
