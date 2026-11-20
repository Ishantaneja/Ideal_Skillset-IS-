
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.database.connection import mongo_manager
from app.api import api_router


# --------------------------------------------------
# Application Lifespan
# --------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle manager for application startup and shutdown.
    """
    # Startup: Connect to MongoDB
    mongo_manager.connect()

    yield

    # Shutdown: Close MongoDB connection
    mongo_manager.close()


# --------------------------------------------------
# Initialize FastAPI Application
# --------------------------------------------------

app = FastAPI(
    title=f"{settings.PROJECT_NAME} API",
    version=settings.VERSION,
    description="Ideal SkillSet — AI Career Readiness Platform Backend API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)


# --------------------------------------------------
# CORS Configuration
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ideal-skillset-is.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# GZIP Compression
# --------------------------------------------------

app.add_middleware(
    GZipMiddleware,
    minimum_size=1000
)


# --------------------------------------------------
# API Router
# --------------------------------------------------

app.include_router(
    api_router,
    prefix=settings.API_PREFIX
)


# --------------------------------------------------
# Health Check Endpoint
# --------------------------------------------------

@app.get(
    "/api/health",
    tags=["Health"],
    summary="API Health Check"
)
async def health_check():
    """
    Check API availability and MongoDB connection status.
    """
    return {
        "status": "ok",
        "application": "Ideal SkillSet",
        "database": settings.DATABASE_NAME,
        "connected": mongo_manager.is_connected
    }


# --------------------------------------------------
# Root Endpoint
# --------------------------------------------------

@app.get(
    "/",
    tags=["Root"],
    summary="API Root"
)
async def root():
    """
    Root endpoint directing users to API documentation.
    """
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "status": "ok",
        "docs": "/docs",
        "health": f"{settings.API_PREFIX}/health"
    }
