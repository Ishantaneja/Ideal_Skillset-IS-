from fastapi import APIRouter
from .auth import router as auth_router
from .users import router as users_router
from .admin import router as admin_router
from .resume import router as resume_router
from .jobs import router as jobs_router
from .ats import router as ats_router
from .skills import router as skills_router
from .roadmap import router as roadmap_router
from .assessment import router as assessment_router
from .interview import router as interview_router
from .readiness import router as readiness_router
from .evidence import router as evidence_router
from .recruiter import router as recruiter_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(admin_router)
api_router.include_router(recruiter_router)
api_router.include_router(resume_router)
api_router.include_router(jobs_router)
api_router.include_router(ats_router)
api_router.include_router(skills_router)
api_router.include_router(roadmap_router)
api_router.include_router(assessment_router)
api_router.include_router(interview_router)
api_router.include_router(readiness_router)
api_router.include_router(evidence_router)

__all__ = ["api_router"]
