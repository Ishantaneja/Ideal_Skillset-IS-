from fastapi import APIRouter, Depends, status
from typing import Dict, Any
from app.models.user import UserProfileUpdate, UserProfileResponse
from app.services.user_service import user_service
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["User Profile"])


@router.get(
    "/me",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Authenticated User Profile"
)
async def get_my_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Fetches the comprehensive profile of the authenticated candidate.
    """
    return user_service.get_profile(current_user)


@router.put(
    "/me",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Authenticated User Profile"
)
async def update_my_profile(
    profile_in: UserProfileUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Updates profile fields (phone, location, education, target role, skills, links) in MongoDB User_data.
    """
    return user_service.update_profile(current_user, profile_in)


@router.get(
    "/profile",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Candidate Profile (Alias)"
)
async def get_profile_alias(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Alias endpoint for retrieving authenticated candidate profile.
    """
    return user_service.get_profile(current_user)


@router.put(
    "/profile",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Candidate Profile (Alias)"
)
async def update_profile_alias(
    profile_in: UserProfileUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Alias endpoint for updating authenticated candidate profile.
    """
    return user_service.update_profile(current_user, profile_in)

