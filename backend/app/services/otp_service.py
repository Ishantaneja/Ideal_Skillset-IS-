import secrets
import hashlib
import hmac
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from bson import ObjectId
from fastapi import HTTPException, status

from app.core.security import get_password_hash, create_access_token
from app.models.user import (
    SignupOTPRequest,
    SignupOTPResponse,
    VerifyOTPRequest,
    ResendOTPRequest,
    SignupSuccessResponse,
    UserResponse,
    UserRole
)
from app.database.connection import mongo_manager
from app.services.email_service import EmailService
from app.services.auth_service import _IN_MEMORY_USERS

logger = logging.getLogger("uvicorn.error")

# Fallback in-memory OTP store when MongoDB is offline during local dev/testing
_IN_MEMORY_SIGNUP_OTPS: Dict[str, Dict[str, Any]] = {}


class OTPService:
    """
    Handles cryptographically secure OTP generation, SHA-256 salted hashing,
    10-minute expiration enforcement, brute-force attempt limits, 60s cooldowns,
    and post-verification user creation in User_data.
    """

    OTP_EXPIRY_MINUTES = 10
    MAX_VERIFY_ATTEMPTS = 5
    RESEND_COOLDOWN_SECONDS = 60

    @classmethod
    def generate_otp(cls) -> str:
        """
        Generates a cryptographically secure 6-digit numeric OTP (100000 - 999999)
        using Python's secrets module.
        """
        return str(secrets.randbelow(900000) + 100000)

    @classmethod
    def hash_otp(cls, otp: str, salt: str) -> str:
        """
        Hashes the 6-digit OTP using SHA-256 with a unique cryptographic salt.
        Plaintext OTP is never stored.
        """
        combined = f"{salt}:{otp}".encode("utf-8")
        return hashlib.sha256(combined).hexdigest()

    @classmethod
    def request_signup_otp(cls, request_data: SignupOTPRequest) -> SignupOTPResponse:
        """
        Validates candidate signup credentials, checks email uniqueness,
        generates and hashes a 6-digit OTP with a 10-minute expiry, stores it,
        and dispatches the verification code via EmailService.
        """
        email_normalized = str(request_data.email).lower().strip()
        now = datetime.now(timezone.utc)

        # 1. Ensure email does not already exist in User_data
        users_col = mongo_manager.user_data
        if users_col is not None:
            existing_user = users_col.find_one({"email": email_normalized})
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An account with this email already exists. Please log in instead.",
                )
        elif email_normalized in _IN_MEMORY_USERS:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists. Please log in instead.",
            )

        # 2. Check for active cooldown on existing OTP record
        otp_col = mongo_manager.signup_otps
        existing_otp_doc = None
        if otp_col is not None:
            existing_otp_doc = otp_col.find_one({"email": email_normalized})
        else:
            existing_otp_doc = _IN_MEMORY_SIGNUP_OTPS.get(email_normalized)

        if existing_otp_doc and existing_otp_doc.get("last_sent_at"):
            last_sent = existing_otp_doc.get("last_sent_at")
            if last_sent.tzinfo is None:
                last_sent = last_sent.replace(tzinfo=timezone.utc)
            elapsed = (now - last_sent).total_seconds()
            if elapsed < cls.RESEND_COOLDOWN_SECONDS:
                remaining = int(cls.RESEND_COOLDOWN_SECONDS - elapsed)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Please wait {remaining} seconds before requesting another verification code.",
                )

        # 3. Hash candidate password securely
        password_hash = get_password_hash(request_data.password)

        # 4. Generate cryptographically secure OTP & hash
        plain_otp = cls.generate_otp()
        otp_salt = secrets.token_hex(16)
        otp_hash = cls.hash_otp(plain_otp, otp_salt)
        expires_at = now + timedelta(minutes=cls.OTP_EXPIRY_MINUTES)

        otp_document = {
            "email": email_normalized,
            "otp_hash": otp_hash,
            "otp_salt": otp_salt,
            "signup_data": {
                "name": request_data.name.strip(),
                "password_hash": password_hash,
                "target_role": request_data.target_role or "Junior Data Analyst",
            },
            "expires_at": expires_at,
            "created_at": now,
            "used": False,
            "attempts": 0,
            "max_attempts": cls.MAX_VERIFY_ATTEMPTS,
            "last_sent_at": now,
        }

        # 5. Save/upsert OTP document in MongoDB (or in-memory store)
        if otp_col is not None:
            otp_col.update_one(
                {"email": email_normalized},
                {"$set": otp_document},
                upsert=True
            )
        else:
            _IN_MEMORY_SIGNUP_OTPS[email_normalized] = otp_document

        # 6. Deliver OTP to candidate email
        try:
            EmailService.send_signup_otp(
                to_email=email_normalized,
                otp=plain_otp,
                name=request_data.name.strip()
            )
        except Exception as exc:
            logger.error(f"Failed to deliver verification email to {email_normalized}: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send verification email. Please check your email configuration or try again later.",
            )

        return SignupOTPResponse(
            message="Verification code sent to your email.",
            email=email_normalized,
            expires_in=cls.OTP_EXPIRY_MINUTES * 60
        )

    @classmethod
    def verify_signup_otp(cls, verify_data: VerifyOTPRequest) -> SignupSuccessResponse:
        """
        Validates the submitted 6-digit OTP against the stored hash, verifies
        expiration and attempts, and creates the candidate in User_data upon success.
        """
        email_normalized = str(verify_data.email).lower().strip()
        user_otp = str(verify_data.otp).strip()
        now = datetime.now(timezone.utc)

        # 1. Fetch OTP record
        otp_col = mongo_manager.signup_otps
        otp_doc = None
        if otp_col is not None:
            otp_doc = otp_col.find_one({"email": email_normalized})
        else:
            otp_doc = _IN_MEMORY_SIGNUP_OTPS.get(email_normalized)

        if not otp_doc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No pending verification code found for this email. Please request a new code.",
            )

        if otp_doc.get("used", False):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This verification code has already been used. Please request a new code.",
            )

        # 2. Check 10-minute expiration
        expires_at = otp_doc.get("expires_at")
        if expires_at:
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if now >= expires_at:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="OTP has expired. Please request a new OTP.",
                )

        # 3. Check brute force attempt limit
        attempts = otp_doc.get("attempts", 0)
        max_attempts = otp_doc.get("max_attempts", cls.MAX_VERIFY_ATTEMPTS)
        if attempts >= max_attempts:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many incorrect attempts. Please request a new OTP.",
            )

        # 4. Verify OTP hash with salt
        otp_salt = otp_doc.get("otp_salt", "")
        expected_hash = otp_doc.get("otp_hash", "")
        computed_hash = cls.hash_otp(user_otp, otp_salt)

        if not hmac.compare_digest(computed_hash, expected_hash):
            new_attempts = attempts + 1
            if otp_col is not None:
                otp_col.update_one(
                    {"email": email_normalized},
                    {"$set": {"attempts": new_attempts}}
                )
            else:
                _IN_MEMORY_SIGNUP_OTPS[email_normalized]["attempts"] = new_attempts

            if new_attempts >= max_attempts:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many incorrect attempts. Please request a new OTP.",
                )

            remaining = max_attempts - new_attempts
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid verification code. {remaining} attempt(s) remaining.",
            )

        # 5. Mark OTP as used
        if otp_col is not None:
            otp_col.update_one(
                {"email": email_normalized},
                {"$set": {"used": True}}
            )
        else:
            _IN_MEMORY_SIGNUP_OTPS[email_normalized]["used"] = True

        # 6. Create User in User_data
        signup_data = otp_doc.get("signup_data", {})
        users_col = mongo_manager.user_data

        user_doc = {
            "name": signup_data.get("name", "User"),
            "email": email_normalized,
            "password_hash": signup_data.get("password_hash"),
            "role": UserRole.USER.value,  # Strictly candidate user role
            "target_role": signup_data.get("target_role", "Junior Data Analyst"),
            "created_at": now,
            "updated_at": now,
        }

        user_id_str = ""
        if users_col is not None:
            # Check for collision before insert
            if users_col.find_one({"email": email_normalized}):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An account with this email already exists.",
                )
            res = users_col.insert_one(user_doc)
            user_id_str = str(res.inserted_id)
        else:
            if email_normalized in _IN_MEMORY_USERS:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An account with this email already exists.",
                )
            user_id_str = f"usr_{len(_IN_MEMORY_USERS) + 1}_{int(now.timestamp())}"
            user_doc["_id"] = user_id_str
            _IN_MEMORY_USERS[email_normalized] = user_doc

        # 7. Generate JWT access token for seamless immediate login
        token_payload = {
            "sub": user_id_str,
            "email": email_normalized,
            "name": user_doc["name"],
            "role": UserRole.USER.value,
            "target_role": user_doc["target_role"],
        }
        token = create_access_token(token_payload)

        user_response = UserResponse(
            id=user_id_str,
            name=user_doc["name"],
            email=email_normalized,
            role=UserRole.USER.value,
            created_at=now,
            updated_at=now
        )

        return SignupSuccessResponse(
            message="Email verified successfully. Account created.",
            user=user_response,
            access_token=token,
            token_type="bearer"
        )

    @classmethod
    def resend_signup_otp(cls, resend_data: ResendOTPRequest) -> SignupOTPResponse:
        """
        Resends a fresh 6-digit verification OTP to the candidate's email,
        enforcing the 60-second cooldown and refreshing the 10-minute expiry window.
        """
        email_normalized = str(resend_data.email).lower().strip()
        now = datetime.now(timezone.utc)

        # 1. Verify user does not already exist
        users_col = mongo_manager.user_data
        if users_col is not None and users_col.find_one({"email": email_normalized}):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists. Please log in.",
            )
        elif email_normalized in _IN_MEMORY_USERS:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists. Please log in.",
            )

        # 2. Check existing OTP document
        otp_col = mongo_manager.signup_otps
        otp_doc = None
        if otp_col is not None:
            otp_doc = otp_col.find_one({"email": email_normalized})
        else:
            otp_doc = _IN_MEMORY_SIGNUP_OTPS.get(email_normalized)

        if not otp_doc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No pending signup request found for this email. Please register again.",
            )

        # 3. Enforce 60-second resend cooldown
        last_sent = otp_doc.get("last_sent_at")
        if last_sent:
            if last_sent.tzinfo is None:
                last_sent = last_sent.replace(tzinfo=timezone.utc)
            elapsed = (now - last_sent).total_seconds()
            if elapsed < cls.RESEND_COOLDOWN_SECONDS:
                remaining = int(cls.RESEND_COOLDOWN_SECONDS - elapsed)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Please wait {remaining} seconds before requesting another OTP.",
                )

        # 4. Generate fresh OTP, reset attempts and expiration
        plain_otp = cls.generate_otp()
        otp_salt = secrets.token_hex(16)
        otp_hash = cls.hash_otp(plain_otp, otp_salt)
        expires_at = now + timedelta(minutes=cls.OTP_EXPIRY_MINUTES)

        updated_fields = {
            "otp_hash": otp_hash,
            "otp_salt": otp_salt,
            "expires_at": expires_at,
            "used": False,
            "attempts": 0,
            "last_sent_at": now,
        }

        if otp_col is not None:
            otp_col.update_one(
                {"email": email_normalized},
                {"$set": updated_fields}
            )
        else:
            _IN_MEMORY_SIGNUP_OTPS[email_normalized].update(updated_fields)

        # 5. Deliver new OTP
        candidate_name = otp_doc.get("signup_data", {}).get("name", "Candidate")
        try:
            EmailService.send_signup_otp(
                to_email=email_normalized,
                otp=plain_otp,
                name=candidate_name
            )
        except Exception as exc:
            logger.error(f"Failed to resend verification email to {email_normalized}: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send verification email. Please try again later.",
            )

        return SignupOTPResponse(
            message="A new verification code has been sent to your email.",
            email=email_normalized,
            expires_in=cls.OTP_EXPIRY_MINUTES * 60
        )

