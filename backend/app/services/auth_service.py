import logging
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.models.user import (
    SignupRequest,
    LoginRequest,
    UserResponse,
    TokenResponse,
    UserRole,
)
from app.core.security import hash_password, verify_password, create_access_token
from app.database.connection import mongo_manager

logger = logging.getLogger("uvicorn.error")

# In-memory storage fallback for local development if MongoDB service is temporarily offline
_IN_MEMORY_USERS: Dict[str, Dict[str, Any]] = {
    "admin@idealskillset.com": {
        "_id": "admin_default_01",
        "name": "System Administrator",
        "email": "admin@idealskillset.com",
        "password_hash": hash_password("Admin1234!"),
        "role": "admin",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
}


class AuthService:
    """
    Service layer handling user registration, credential verification,
    role checks, and JWT generation for the User_data collection in ideal_skillsetdb.
    """

    @staticmethod
    def register_user(user_in: SignupRequest) -> TokenResponse:
        """
        Registers a new candidate user into User_data with role='user'.
        """
        email_normalized = str(user_in.email).lower().strip()
        users_col = mongo_manager.user_data
        now = datetime.now(timezone.utc)

        # 1. Check for existing user in MongoDB User_data
        if users_col is not None:
            existing = users_col.find_one({"email": email_normalized})
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An account with this email already exists"
                )
        elif email_normalized in _IN_MEMORY_USERS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists"
            )

        # 2. Hash the password securely
        pwd_hash = hash_password(user_in.password)

        # 3. Prepare MongoDB document (Strictly role='user')
        target_role = getattr(user_in, "target_role", None) or "Junior Data Analyst"
        user_doc = {
            "name": user_in.name,
            "email": email_normalized,
            "password_hash": pwd_hash,
            "role": UserRole.USER.value,
            "target_role": target_role,
            "skills": ["SQL", "Python", "Excel"],
            "created_at": now,
            "updated_at": now,
        }

        user_id_str = ""
        if users_col is not None:
            try:
                result = users_col.insert_one(user_doc)
                user_id_str = str(result.inserted_id)
            except DuplicateKeyError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An account with this email already exists"
                )
        else:
            user_id_str = f"usr_{len(_IN_MEMORY_USERS) + 1}_{int(now.timestamp())}"
            user_doc["_id"] = user_id_str
            _IN_MEMORY_USERS[email_normalized] = user_doc

        # 4. Generate signed JWT token
        token_payload = {
            "sub": user_id_str,
            "email": email_normalized,
            "name": user_in.name,
            "role": UserRole.USER.value,
            "target_role": target_role,
        }
        token = create_access_token(token_payload)

        # 5. Return TokenResponse without password_hash
        user_response = UserResponse(
            id=user_id_str,
            name=user_in.name,
            email=email_normalized,
            role=UserRole.USER.value,
            created_at=now,
            updated_at=now
        )

        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user=user_response
        )

    @staticmethod
    def authenticate_user(login_data: LoginRequest) -> TokenResponse:
        """
        Authenticates user credentials against User_data and issues JWT.
        """
        email_normalized = str(login_data.email).lower().strip()
        users_col = mongo_manager.user_data

        user_doc = None
        if users_col is not None:
            user_doc = users_col.find_one({"email": email_normalized})
        else:
            user_doc = _IN_MEMORY_USERS.get(email_normalized)

        # Verify existence and password hash
        if not user_doc or not verify_password(login_data.password, user_doc.get("password_hash")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id = str(user_doc.get("_id", ""))
        name = user_doc.get("name", "User")
        role = user_doc.get("role", UserRole.USER.value)
        target_role = user_doc.get("target_role", "Junior Data Analyst")

        # Issue JWT
        token = create_access_token({
            "sub": user_id,
            "email": email_normalized,
            "name": name,
            "role": role,
            "target_role": target_role,
        })

        user_response = UserResponse(
            id=user_id,
            name=name,
            email=email_normalized,
            role=role,
            created_at=user_doc.get("created_at"),
            updated_at=user_doc.get("updated_at")
        )

        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user=user_response
        )

    @staticmethod
    def authenticate_admin(login_data: LoginRequest) -> TokenResponse:
        """
        Authenticates administrator credentials against User_data and verifies role=='admin'.
        Rejects normal users with 403 Forbidden.
        """
        email_normalized = str(login_data.email).lower().strip()
        users_col = mongo_manager.user_data

        user_doc = None
        if users_col is not None:
            user_doc = users_col.find_one({"email": email_normalized})
        else:
            user_doc = _IN_MEMORY_USERS.get(email_normalized)

        # Verify existence and password hash
        if not user_doc or not verify_password(login_data.password, user_doc.get("password_hash")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid administrator credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Verify administrator role
        role = user_doc.get("role", "")
        if role != UserRole.ADMIN.value and role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: user is not an administrator",
            )

        user_id = str(user_doc.get("_id", ""))
        name = user_doc.get("name", "Administrator")

        token = create_access_token({
            "sub": user_id,
            "email": email_normalized,
            "name": name,
            "role": UserRole.ADMIN.value
        })

        user_response = UserResponse(
            id=user_id,
            name=name,
            email=email_normalized,
            role=UserRole.ADMIN.value,
            created_at=user_doc.get("created_at"),
            updated_at=user_doc.get("updated_at")
        )

        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user=user_response
        )

    @staticmethod
    def get_user_profile(current_user: Dict[str, Any]) -> UserResponse:
        """
        Returns clean public profile of current user without sensitive fields.
        """
        return UserResponse(
            id=str(current_user.get("id", "")),
            name=current_user.get("name", "User"),
            email=current_user.get("email", ""),
            role=current_user.get("role", "user"),
            created_at=current_user.get("created_at"),
            updated_at=current_user.get("updated_at")
        )


auth_service = AuthService()
