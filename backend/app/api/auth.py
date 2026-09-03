from fastapi import APIRouter, Depends, status
from app.models.user import (
    SignupRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import auth_service
from app.core.dependencies import get_current_user
from typing import Dict, Any

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/test", summary="Test Auth Router")
async def test_auth():
    """
    Test endpoint to verify auth routing connectivity.
    """
    return {
        "status": "ok",
        "module": "auth",
        "message": "Auth router is operational"
    }


@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="User Registration"
)
async def signup(user_in: SignupRequest):
    """
    Registers a new candidate user into the MongoDB User_data collection.
    - Password is securely hashed with bcrypt.
    - Role is strictly defaulted to 'user'.
    - Generates signed JWT access token.
    """
    return auth_service.register_user(user_in)


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="User Login"
)
async def login(login_data: LoginRequest):
    """
    Authenticates user credentials against the User_data collection and returns JWT access token.
    """
    return auth_service.authenticate_user(login_data)


@router.post(
    "/admin/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Admin Login"
)
async def admin_login(login_data: LoginRequest):
    """
    Authenticates administrator credentials.
    Rejects normal candidate users with 403 Forbidden.
    """
    return auth_service.authenticate_admin(login_data)


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Current User Profile"
)
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Fetches the profile of the currently authenticated user using JWT Bearer token.
    Requires: `Authorization: Bearer <JWT_TOKEN>`
    """
    return auth_service.get_user_profile(current_user)
