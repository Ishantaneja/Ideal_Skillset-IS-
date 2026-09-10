from fastapi import APIRouter, Depends, status, HTTPException
from typing import Dict, Any, Optional
from bson import ObjectId
from app.models.evidence import (
    GitHubVerificationRequest,
    GitHubVerificationResponse,
)
from app.services.evidence_engine import evidence_engine
from app.core.dependencies import get_current_user
from app.database.connection import mongo_manager
from app.services.auth_service import _IN_MEMORY_USERS

router = APIRouter(prefix="/evidence", tags=["Proof of Skill & Evidence"])


@router.get("/test", summary="Test Evidence Router Connectivity")
async def test_evidence():
    """
    Test endpoint for evidence engine connectivity.
    """
    return {
        "status": "ok",
        "module": "evidence",
        "message": "Evidence and GitHub Verification engine is operational"
    }


@router.post(
    "/verify-github",
    response_model=GitHubVerificationResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify Candidate Skills Against Public GitHub Projects"
)
async def verify_github_skills(
    payload: GitHubVerificationRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Inspects candidate's public GitHub repositories, analyzes the codebases,
    and determines whether claimed skills are genuinely used in projects.
    Returns categorized lists:
    - Verified in Projects (with repository links & language stats)
    - Not Found in Projects / Unverified (with recommended action items)
    """
    user_id = str(current_user.get("id", ""))
    skills_to_check = payload.skills_to_verify

    # If no skills specified in request, fetch candidate skills from profile
    if not skills_to_check:
        user_col = mongo_manager.user_data
        if user_col is not None:
            query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"_id": user_id}
            user_doc = user_col.find_one(query) or user_col.find_one({"email": current_user.get("email")})
            if user_doc and user_doc.get("skills"):
                skills_to_check = user_doc.get("skills")
        elif current_user.get("email") in _IN_MEMORY_USERS:
            skills_to_check = _IN_MEMORY_USERS[current_user["email"]].get("skills")

    return await evidence_engine.verify_github(
        github_url=payload.github_url,
        skills=skills_to_check,
        user_id=user_id
    )


@router.get(
    "/github-status",
    response_model=Optional[GitHubVerificationResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Latest GitHub Verification Result for Current User"
)
async def get_github_verification_status(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Retrieves the most recent GitHub project and skill verification result
    stored for the authenticated candidate.
    """
    user_id = str(current_user.get("id", ""))
    user_col = mongo_manager.user_data
    if user_col is not None:
        query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"_id": user_id}
        user_doc = user_col.find_one(query) or user_col.find_one({"email": current_user.get("email")})
        if user_doc and "github_verification" in user_doc:
            return user_doc["github_verification"]

    # If not yet verified, check if github_url exists on profile and run initial verification
    github_url = current_user.get("github_url") or "https://github.com/candidate"
    return await evidence_engine.verify_github(
        github_url=github_url,
        skills=current_user.get("skills") or ["SQL", "Python", "Power BI", "Docker", "Git"],
        user_id=user_id
    )
