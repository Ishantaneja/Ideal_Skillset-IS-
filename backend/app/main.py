from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.database.connection import mongo_manager
from app.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle manager for application startup and shutdown events.
    """
    # Startup: Connect to MongoDB ideal_skillsetdb
    mongo_manager.connect()
    yield
    # Shutdown: Cleanly close MongoDB connection
    mongo_manager.close()


app = FastAPI(
    title=f"{settings.PROJECT_NAME} API",
    version=settings.VERSION,
    description="Ideal SkillSet — AI Career Readiness Platform Backend API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS Configuration
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount aggregated API routers under /api prefix
app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/api/health", tags=["Health"], summary="API Health Check")
async def health_check():
    """
    Health check endpoint verifying API service availability and DB status.
    """
    return {
        "status": "ok",
        "application": "Ideal SkillSet",
        "database": settings.DATABASE_NAME,
        "connected": mongo_manager.is_connected
    }


@app.get("/", tags=["Root"], summary="API Root")
async def root():
    """
    Root endpoint directing to API documentation.
    """
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "status": "ok",
        "docs": "/docs",
        "health": f"{settings.API_PREFIX}/health"
    }