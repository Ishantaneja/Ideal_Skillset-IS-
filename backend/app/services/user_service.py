import logging
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException, status
from app.models.user import UserProfileUpdate, UserProfileResponse, UserRole
from app.database.connection import mongo_manager

logger = logging.getLogger("uvicorn.error")

# In-memory storage fallback for local development if MongoDB is offline
_IN_MEMORY_PROFILES: Dict[str, Dict[str, Any]] = {}


class UserService:
    """
    Service layer handling user profile retrieval and updates directly from the User_data collection.
    """

    @staticmethod
    def get_profile(user_info: Dict[str, Any]) -> UserProfileResponse:
        """
        Fetches the complete profile document for the authenticated user.
        """
        user_id = str(user_info.get("id", ""))
        email = str(user_info.get("email", "")).lower().strip()
        users_col = mongo_manager.user_data

        user_doc = None
        if users_col is not None:
            if user_id and ObjectId.is_valid(user_id):
                user_doc = users_col.find_one({"_id": ObjectId(user_id)})
            if not user_doc and email:
                user_doc = users_col.find_one({"email": email})

        if not user_doc:
            user_doc = _IN_MEMORY_PROFILES.get(email) or _IN_MEMORY_PROFILES.get(user_id)

        if not user_doc:
            # Construct a default candidate profile from token claims
            return UserProfileResponse(
                id=user_id or "usr_unknown",
                name=user_info.get("name", "Candidate"),
                email=email,
                role=user_info.get("role", UserRole.USER.value),
                target_role=user_info.get("target_role", "Junior Data Analyst"),
                experience_level="Junior",
                skills=["SQL", "Python", "Excel"]
            )

        return UserProfileResponse(
            id=str(user_doc.get("_id", user_id)),
            name=user_doc.get("name", "Candidate"),
            email=user_doc.get("email", email),
            role=user_doc.get("role", UserRole.USER.value),
            phone=user_doc.get("phone", ""),
            location=user_doc.get("location", ""),
            country=user_doc.get("country", ""),
            bio=user_doc.get("bio", ""),
            education=user_doc.get("education", ""),
            degree=user_doc.get("degree", ""),
            university=user_doc.get("university", ""),
            graduation_year=user_doc.get("graduation_year"),
            experience_level=user_doc.get("experience_level", "Junior"),
            years_of_experience=user_doc.get("years_of_experience", 0.0),
            current_job_title=user_doc.get("current_job_title", ""),
            target_role=user_doc.get("target_role", "Junior Data Analyst"),
            career_interests=user_doc.get("career_interests") or [],
            skills=user_doc.get("skills") or ["SQL", "Python", "Excel"],
            github_url=user_doc.get("github_url", ""),
            linkedin_url=user_doc.get("linkedin_url", ""),
            portfolio_url=user_doc.get("portfolio_url", ""),
            created_at=user_doc.get("created_at"),
            updated_at=user_doc.get("updated_at")
        )

    @staticmethod
    def update_profile(user_info: Dict[str, Any], profile_in: UserProfileUpdate) -> UserProfileResponse:
        """
        Updates profile fields in MongoDB User_data collection and returns the updated profile.
        """
        user_id = str(user_info.get("id", ""))
        email = str(user_info.get("email", "")).lower().strip()
        users_col = mongo_manager.user_data
        now = datetime.now(timezone.utc)

        update_data = profile_in.model_dump(exclude_unset=True)
        if not update_data:
            return UserService.get_profile(user_info)

        update_data["updated_at"] = now

        if users_col is not None:
            filter_query = {}
            if user_id and ObjectId.is_valid(user_id):
                filter_query = {"_id": ObjectId(user_id)}
            elif email:
                filter_query = {"email": email}

            if filter_query:
                users_col.update_one(filter_query, {"$set": update_data})
        else:
            # Fallback in-memory
            existing = _IN_MEMORY_PROFILES.get(email, {})
            existing.update(update_data)
            existing["_id"] = user_id or "usr_dev"
            existing["email"] = email
            existing["role"] = user_info.get("role", "user")
            _IN_MEMORY_PROFILES[email] = existing

        return UserService.get_profile(user_info)


user_service = UserService()

