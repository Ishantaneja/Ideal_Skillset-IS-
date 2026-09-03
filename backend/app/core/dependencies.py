from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
from bson import ObjectId
from app.core.security import decode_access_token
from app.models.user import UserRole
from app.database.connection import mongo_manager

# Configure HTTPBearer scheme so Swagger UI displays the Authorize button
security_scheme = HTTPBearer(auto_error=False)


async def get_current_token_payload(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Dict[str, Any]:
    """
    Extract and validate JWT token payload from Authorization Bearer header.
    Returns 401 Unauthorized if missing, malformed, or expired.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


async def get_current_user(
    payload: Dict[str, Any] = Depends(get_current_token_payload)
) -> Dict[str, Any]:
    """
    Resolves the authenticated user from the database (User_data collection).
    Returns user details (id, name, email, role).
    """
    user_id = payload.get("sub")
    email = payload.get("email")

    if not user_id and not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token: missing user identifier",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 1. Query from MongoDB User_data collection
    users_col = mongo_manager.user_data
    user_doc = None

    if users_col is not None:
        # Try finding by ObjectId if valid
        if user_id and ObjectId.is_valid(user_id):
            user_doc = users_col.find_one({"_id": ObjectId(user_id)})
        # Or find by email
        if not user_doc and email:
            user_doc = users_col.find_one({"email": email.lower().strip()})

    if user_doc:
        return {
            "id": str(user_doc.get("_id")),
            "name": user_doc.get("name", "User"),
            "email": user_doc.get("email"),
            "role": user_doc.get("role", UserRole.USER),
            "target_role": user_doc.get("target_role", "Junior Data Analyst"),
            "created_at": user_doc.get("created_at"),
            "updated_at": user_doc.get("updated_at"),
        }

    # Fallback to token claims if DB connection is offline during development
    return {
        "id": str(user_id or "usr_unknown"),
        "name": payload.get("name", "User"),
        "email": email or "",
        "role": payload.get("role", UserRole.USER),
        "target_role": payload.get("target_role", "Junior Data Analyst"),
        "created_at": None,
        "updated_at": None,
    }


async def require_user(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Ensures that the request is made by an authenticated user or admin.
    """
    return current_user


async def require_admin(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Verifies that the authenticated user possesses the 'admin' role.
    Returns 403 Forbidden for non-admin accounts.
    """
    if current_user.get("role") != UserRole.ADMIN and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: administrator privileges required",
        )
    return current_user


# Alias for backward compatibility
get_current_admin = require_admin
