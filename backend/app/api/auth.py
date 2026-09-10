from fastapi import APIRouter, Depends, status
from typing import Dict, Any
from app.models.user import (
    SignupRequest,
    RecruiterSignupRequest,
    SignupOTPRequest,
    SignupOTPResponse,
    VerifyOTPRequest,
    ResendOTPRequest,
    SignupSuccessResponse,
    LoginRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import auth_service
from app.services.otp_service import OTPService
from app.core.dependencies import get_current_user

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
    "/signup/request-otp",
    response_model=SignupOTPResponse,
    status_code=status.HTTP_200_OK,
    summary="Request Signup Email OTP Verification Code"
)
async def request_signup_otp(request_data: SignupOTPRequest):
    """
    Initiates candidate signup verification flow:
    - Validates email and password inputs.
    - Confirms email is not already registered.
    - Generates a cryptographically secure 6-digit OTP (expires in 10 minutes).
    - Hashes and securely stores OTP in MongoDB `Signup_otps`.
    - Sends verification code to candidate's email address.
    - Does NOT create the user account until OTP verification.
    """
    return OTPService.request_signup_otp(request_data)


@router.post(
    "/signup/verify-otp",
    response_model=SignupSuccessResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Verify Email OTP & Create User Account"
)
async def verify_signup_otp(verify_data: VerifyOTPRequest):
    """
    Verifies the submitted 6-digit OTP:
    - Validates OTP expiration (10 min lifetime).
    - Enforces 5-attempt brute-force threshold.
    - Marks OTP as used.
    - Creates the candidate account in `User_data` with hashed password and role='user'.
    - Issues JWT access token for immediate session authorization.
    """
    return OTPService.verify_signup_otp(verify_data)


@router.post(
    "/signup/resend-otp",
    response_model=SignupOTPResponse,
    status_code=status.HTTP_200_OK,
    summary="Resend Signup Email OTP Verification Code"
)
async def resend_signup_otp(resend_data: ResendOTPRequest):
    """
    Resends a fresh 6-digit verification OTP code:
    - Enforces 60-second cooldown period between dispatches.
    - Resets verification attempt counter to 0.
    - Refreshes 10-minute expiration window.
    """
    return OTPService.resend_signup_otp(resend_data)


@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Direct User Registration (Legacy / Backward Compatibility)"
)
async def signup(user_in: SignupRequest):
    """
    Registers a new candidate user directly into the MongoDB User_data collection.
    - Maintained for backward compatibility.
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


@router.post(
    "/recruiter/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Recruiter & Employer Login"
)
async def recruiter_login(login_data: LoginRequest):
    """
    Authenticates recruiter credentials.
    Rejects candidate accounts with 403 Forbidden.
    """
    return auth_service.authenticate_recruiter(login_data)


@router.post(
    "/recruiter/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Recruiter & Employer Registration"
)
async def recruiter_signup(recruiter_in: RecruiterSignupRequest):
    """
    Direct registration for recruiters and hiring managers.
    Sets role='recruiter' and records company name.
    """
    return auth_service.register_recruiter(recruiter_in)


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
