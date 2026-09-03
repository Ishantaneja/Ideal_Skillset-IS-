import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import UploadFile, HTTPException, status

from app.models.resume import (
    ResumeResponse,
    ResumeListItem,
    ResumeListResponse,
    ParsedResumeData,
)
from app.services.storage_service import storage_service
from app.services.text_extractor import text_extractor
from app.services.resume_parser import resume_parser
from app.database.connection import mongo_manager

logger = logging.getLogger("uvicorn.error")

# In-memory storage fallback for local development if MongoDB is offline
_IN_MEMORY_RESUMES: Dict[str, Dict[str, Any]] = {}


class ResumeService:
    """
    Coordinates resume uploads, file validation, text extraction,
    structured parsing, and MongoDB persistence with strict user ownership.
    """

    @classmethod
    def _doc_to_response(cls, doc: Dict[str, Any]) -> ResumeResponse:
        """
        Converts MongoDB document dictionary to Pydantic ResumeResponse model.
        """
        parsed_raw = doc.get("parsed_data", {})
        if isinstance(parsed_raw, dict):
            parsed_model = ParsedResumeData(**parsed_raw)
        elif isinstance(parsed_raw, ParsedResumeData):
            parsed_model = parsed_raw
        else:
            parsed_model = ParsedResumeData()

        return ResumeResponse(
            id=str(doc.get("_id", "")),
            user_id=str(doc.get("user_id", "")),
            original_filename=doc.get("original_filename", "resume.pdf"),
            file_type=doc.get("file_type", "pdf"),
            file_size=doc.get("file_size", 0),
            is_active=doc.get("is_active", True),
            uploaded_at=doc.get("uploaded_at", datetime.now(timezone.utc)),
            updated_at=doc.get("updated_at", datetime.now(timezone.utc)),
            extracted_text=doc.get("extracted_text", ""),
            parsed_data=parsed_model,
            parsing_status=doc.get("parsing_status", "completed"),
            parsing_error=doc.get("parsing_error")
        )

    @classmethod
    async def upload_resume(cls, file: UploadFile, current_user: Dict[str, Any]) -> ResumeResponse:
        """
        Processes resume upload:
        1. Validates format and size
        2. Saves to disk
        3. Extracts text
        4. Parses structured sections
        5. Deactivates previous resumes and stores new active record in MongoDB Resumes
        """
        user_id = str(current_user.get("id", ""))
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User session invalid. Please log in again."
            )

        original_filename = file.filename or "resume.pdf"
        content_type = file.content_type or "application/pdf"

        # Read file bytes into memory
        file_bytes = await file.read()
        file_size = len(file_bytes)

        # 1. Validate file format and size
        storage_service.validate_file(original_filename, content_type, file_size)

        # 2. Save file to storage
        storage_path, file_type, file_size = storage_service.save_file(file_bytes, original_filename)

        # 3. Extract text
        extracted_text = ""
        parsing_status = "completed"
        parsing_error = None
        try:
            extracted_text = text_extractor.extract_text(storage_path, file_type)
            if not extracted_text or len(extracted_text.strip()) < 10:
                parsing_status = "failed"
                parsing_error = "Could not extract readable text from document. Document may be scanned or empty."
        except Exception as extract_err:
            logger.error(f"Text extraction failed: {extract_err}")
            parsing_status = "failed"
            parsing_error = str(extract_err)

        # 4. Parse structured sections
        parsed_data = ParsedResumeData()
        if parsing_status == "completed":
            try:
                parsed_data = resume_parser.parse_resume(extracted_text)
            except Exception as parse_err:
                logger.error(f"Resume parsing error: {parse_err}")
                parsing_status = "partial"
                parsing_error = f"Partial parsing error: {parse_err}"

        # 5. Persist to MongoDB Resumes
        now = datetime.now(timezone.utc)
        resume_doc = {
            "user_id": user_id,
            "original_filename": original_filename,
            "file_type": file_type,
            "file_size": file_size,
            "storage_path": storage_path,
            "is_active": True,
            "uploaded_at": now,
            "updated_at": now,
            "extracted_text": extracted_text,
            "parsed_data": parsed_data.model_dump(),
            "parsing_status": parsing_status,
            "parsing_error": parsing_error,
        }

        resumes_col = mongo_manager.resumes
        doc_id_str = ""

        if resumes_col is not None:
            # Deactivate previous active resumes for this user
            try:
                resumes_col.update_many(
                    {"user_id": user_id, "is_active": True},
                    {"$set": {"is_active": False, "updated_at": now}}
                )
            except Exception as update_err:
                logger.warning(f"Could not deactivate previous resumes: {update_err}")

            # Insert new resume
            result = resumes_col.insert_one(resume_doc)
            doc_id_str = str(result.inserted_id)
            resume_doc["_id"] = result.inserted_id
        else:
            # In-memory fallback
            doc_id_str = f"res_{len(_IN_MEMORY_RESUMES) + 1}_{int(now.timestamp())}"
            resume_doc["_id"] = doc_id_str
            for r in _IN_MEMORY_RESUMES.values():
                if r.get("user_id") == user_id:
                    r["is_active"] = False
            _IN_MEMORY_RESUMES[doc_id_str] = resume_doc

        logger.info(f"Successfully processed and stored resume {doc_id_str} for user {user_id}")
        return cls._doc_to_response(resume_doc)

    @classmethod
    def get_user_resumes(cls, current_user: Dict[str, Any]) -> ResumeListResponse:
        """
        Fetches all resumes belonging to the authenticated user.
        """
        user_id = str(current_user.get("id", ""))
        resumes_col = mongo_manager.resumes
        items: List[ResumeListItem] = []

        if resumes_col is not None:
            cursor = resumes_col.find({"user_id": user_id}).sort("uploaded_at", -1)
            for doc in cursor:
                parsed = doc.get("parsed_data", {})
                skills = parsed.get("skills", []) if isinstance(parsed, dict) else []
                items.append(ResumeListItem(
                    id=str(doc.get("_id")),
                    original_filename=doc.get("original_filename", "resume.pdf"),
                    file_type=doc.get("file_type", "pdf"),
                    file_size=doc.get("file_size", 0),
                    is_active=doc.get("is_active", False),
                    uploaded_at=doc.get("uploaded_at", datetime.now(timezone.utc)),
                    parsing_status=doc.get("parsing_status", "completed"),
                    skills_count=len(skills)
                ))
        else:
            for doc in sorted(_IN_MEMORY_RESUMES.values(), key=lambda x: x.get("uploaded_at", datetime.min), reverse=True):
                if doc.get("user_id") == user_id:
                    parsed = doc.get("parsed_data", {})
                    skills = parsed.get("skills", []) if isinstance(parsed, dict) else []
                    items.append(ResumeListItem(
                        id=str(doc.get("_id")),
                        original_filename=doc.get("original_filename", "resume.pdf"),
                        file_type=doc.get("file_type", "pdf"),
                        file_size=doc.get("file_size", 0),
                        is_active=doc.get("is_active", False),
                        uploaded_at=doc.get("uploaded_at", datetime.now(timezone.utc)),
                        parsing_status=doc.get("parsing_status", "completed"),
                        skills_count=len(skills)
                    ))

        return ResumeListResponse(items=items, total=len(items))

    @classmethod
    def get_resume(cls, resume_id: str, current_user: Dict[str, Any]) -> ResumeResponse:
        """
        Fetches single resume details, verifying ownership.
        """
        user_id = str(current_user.get("id", ""))
        resumes_col = mongo_manager.resumes
        doc = None

        if resumes_col is not None:
            if ObjectId.is_valid(resume_id):
                doc = resumes_col.find_one({"_id": ObjectId(resume_id)})
            if not doc:
                doc = resumes_col.find_one({"_id": resume_id})
        else:
            doc = _IN_MEMORY_RESUMES.get(resume_id)

        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Resume '{resume_id}' not found."
            )

        # STRICT OWNERSHIP CHECK
        if str(doc.get("user_id")) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: you do not have permission to access this resume."
            )

        return cls._doc_to_response(doc)

    @classmethod
    def get_parsed_resume(cls, resume_id: str, current_user: Dict[str, Any]) -> ParsedResumeData:
        """
        Fetches only the parsed structured data for a resume.
        """
        resume = cls.get_resume(resume_id, current_user)
        return resume.parsed_data

    @classmethod
    def delete_resume(cls, resume_id: str, current_user: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deletes resume from storage and MongoDB, verifying ownership.
        """
        user_id = str(current_user.get("id", ""))
        resumes_col = mongo_manager.resumes
        doc = None

        if resumes_col is not None:
            if ObjectId.is_valid(resume_id):
                doc = resumes_col.find_one({"_id": ObjectId(resume_id)})
            if not doc:
                doc = resumes_col.find_one({"_id": resume_id})
        else:
            doc = _IN_MEMORY_RESUMES.get(resume_id)

        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Resume '{resume_id}' not found."
            )

        # STRICT OWNERSHIP CHECK
        if str(doc.get("user_id")) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: you do not have permission to delete this resume."
            )

        # Delete physical file
        storage_path = doc.get("storage_path")
        if storage_path:
            storage_service.delete_file(storage_path)

        # Delete MongoDB record
        if resumes_col is not None:
            if ObjectId.is_valid(resume_id):
                resumes_col.delete_one({"_id": ObjectId(resume_id)})
            else:
                resumes_col.delete_one({"_id": resume_id})
        else:
            _IN_MEMORY_RESUMES.pop(resume_id, None)

        return {
            "status": "success",
            "message": f"Resume '{doc.get('original_filename')}' deleted successfully.",
            "deleted_id": resume_id
        }

    @classmethod
    def set_active_resume(cls, resume_id: str, current_user: Dict[str, Any]) -> ResumeResponse:
        """
        Marks a specific resume as the active one for the user.
        """
        user_id = str(current_user.get("id", ""))
        resumes_col = mongo_manager.resumes
        now = datetime.now(timezone.utc)

        # Verify exists and belongs to user
        resume = cls.get_resume(resume_id, current_user)

        if resumes_col is not None:
            resumes_col.update_many(
                {"user_id": user_id},
                {"$set": {"is_active": False, "updated_at": now}}
            )
            if ObjectId.is_valid(resume_id):
                resumes_col.update_one(
                    {"_id": ObjectId(resume_id)},
                    {"$set": {"is_active": True, "updated_at": now}}
                )
            else:
                resumes_col.update_one(
                    {"_id": resume_id},
                    {"$set": {"is_active": True, "updated_at": now}}
                )
        else:
            for r in _IN_MEMORY_RESUMES.values():
                if r.get("user_id") == user_id:
                    r["is_active"] = (str(r.get("_id")) == resume_id)

        return cls.get_resume(resume_id, current_user)


resume_service = ResumeService()

