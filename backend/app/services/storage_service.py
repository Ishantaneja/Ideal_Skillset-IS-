import os
import uuid
import logging
from typing import Tuple
from fastapi import UploadFile, HTTPException, status

logger = logging.getLogger("uvicorn.error")

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain",
    "application/octet-stream",  # Fallback for some Windows browsers
}

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "resumes"))


class StorageService:
    """
    File storage abstraction managing resume uploads, validation, and lifecycle.
    Prevents path traversal and isolates binary files from the database.
    """
    def __init__(self, base_dir: str = UPLOAD_DIR):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)

    def validate_file(self, filename: str, content_type: str, file_size: int):
        """
        Validates resume file format, content-type, and size limits.
        """
        ext = os.path.splitext(filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Only PDF (.pdf) and Word (.docx) documents are supported."
            )

        if content_type and content_type.lower() not in ALLOWED_MIME_TYPES:
            logger.warning(f"Unusual MIME type '{content_type}' for extension '{ext}' - allowing extension match.")

        if file_size > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds maximum upload limit of 10 MB (File size: {file_size / (1024*1024):.2f} MB)."
            )

        if file_size <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty."
            )

    def save_file(self, file_bytes: bytes, original_filename: str) -> Tuple[str, str, int]:
        """
        Saves resume file to disk with a sanitized UUID filename.
        Returns: (storage_path, file_type, file_size)
        """
        file_size = len(file_bytes)
        ext = os.path.splitext(original_filename)[1].lower()
        file_type = ext.lstrip(".").lower()

        # Sanitize filename to prevent directory traversal
        unique_name = f"{uuid.uuid4().hex}{ext}"
        target_path = os.path.join(self.base_dir, unique_name)

        try:
            with open(target_path, "wb") as f:
                f.write(file_bytes)
            return target_path, file_type, file_size
        except Exception as e:
            logger.error(f"Failed to write resume to disk at '{target_path}': {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not save uploaded resume to server storage."
            )

    def delete_file(self, storage_path: str):
        """
        Safely removes file from storage.
        """
        if storage_path and os.path.exists(storage_path):
            try:
                os.remove(storage_path)
                logger.info(f"Deleted resume file from disk: {storage_path}")
            except Exception as e:
                logger.warning(f"Could not delete file at '{storage_path}': {e}")


storage_service = StorageService()
