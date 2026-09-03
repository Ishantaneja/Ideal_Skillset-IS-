from fastapi import APIRouter, Depends, status
from typing import Dict, Any, List, Optional
from app.core.dependencies import get_current_user
from app.database.connection import mongo_manager

router = APIRouter(prefix="/assessment", tags=["Practical Assessment"])

ROLE_CHALLENGES = {
    "Data Analyst": [
        {
            "id": "da_01",
            "title": "Cohort Retention & LTV Analysis (SQL)",
            "difficulty": "Intermediate",
            "timeLimit": "45 mins",
            "status": "Ready",
            "description": "Write complex SQL queries calculating monthly cohort retention rates and Customer Lifetime Value from raw transactional database tables.",
            "topics": ["Self JOIN", "Date Arithmetic", "Window Functions (ROW_NUMBER, LAG)"]
        },
        {
            "id": "da_02",
            "title": "Power BI Executive Dashboard & DAX Simulation",
            "difficulty": "Intermediate",
            "timeLimit": "60 mins",
            "status": "Ready",
            "description": "Model star schema relationships and implement custom DAX measures for Year-over-Year sales growth and dynamic drill-down.",
            "topics": ["DAX CALCULATE", "Time Intelligence", "Data Modeling"]
        },
        {
            "id": "da_03",
            "title": "Automated Multi-Source ETL Pipeline (Python)",
            "difficulty": "Advanced",
            "timeLimit": "50 mins",
            "status": "Ready",
            "description": "Extract raw CSV and JSON records, clean missing values with Pandas, and compute KPI summary matrices.",
            "topics": ["Python", "Pandas", "Data Cleaning", "Automation"]
        }
    ],
    "Software Engineer": [
        {
            "id": "se_01",
            "title": "Production REST API with JWT Auth & Caching (FastAPI)",
            "difficulty": "Intermediate",
            "timeLimit": "60 mins",
            "status": "Ready",
            "description": "Design secure RESTful endpoints with Pydantic V2 request validation, JWT authentication, and Redis response caching.",
            "topics": ["FastAPI", "Python", "JWT", "Redis", "REST Design"]
        },
        {
            "id": "se_02",
            "title": "Database Query Optimization & Indexing (PostgreSQL)",
            "difficulty": "Advanced",
            "timeLimit": "45 mins",
            "status": "Ready",
            "description": "Analyze slow execution plans with EXPLAIN ANALYZE and apply compound and partial indexes to achieve <10ms latency.",
            "topics": ["SQL Optimization", "PostgreSQL", "B-Tree Indexes", "Query Planning"]
        },
        {
            "id": "se_03",
            "title": "Containerized Microservice Stack (Docker Compose)",
            "difficulty": "Intermediate",
            "timeLimit": "45 mins",
            "status": "Ready",
            "description": "Write multi-stage Dockerfiles and docker-compose.yml to orchestrate a backend API, database, and Redis cache.",
            "topics": ["Docker", "Docker Compose", "Healthchecks", "Linux"]
        }
    ],
    "Machine Learning Engineer": [
        {
            "id": "ml_01",
            "title": "Predictive Churn Model & Evaluation (Scikit-Learn)",
            "difficulty": "Advanced",
            "timeLimit": "60 mins",
            "status": "Ready",
            "description": "Train Random Forest and XGBoost classifiers, optimize hyperparameters with GridSearch, and evaluate ROC-AUC curves.",
            "topics": ["Scikit-Learn", "Feature Engineering", "Model Evaluation", "XGBoost"]
        },
        {
            "id": "ml_02",
            "title": "High-Throughput ML Inference API (FastAPI)",
            "difficulty": "Intermediate",
            "timeLimit": "45 mins",
            "status": "Ready",
            "description": "Load serialized .joblib model artifacts and expose low-latency prediction endpoints with batch request support.",
            "topics": ["FastAPI", "Model Serving", "Batch Inference", "NumPy"]
        }
    ],
    "Frontend Developer": [
        {
            "id": "fe_01",
            "title": "Interactive Analytics Dashboard (React & Tailwind)",
            "difficulty": "Intermediate",
            "timeLimit": "60 mins",
            "status": "Ready",
            "description": "Build responsive dashboard widgets with custom hook state management, optimistic UI updates, and dark mode support.",
            "topics": ["React", "Custom Hooks", "Tailwind CSS", "Chart.js"]
        },
        {
            "id": "fe_02",
            "title": "Accessible Form & Real-Time Validation",
            "difficulty": "Intermediate",
            "timeLimit": "40 mins",
            "status": "Ready",
            "description": "Implement accessible WCAG compliant form controls with client-side validation and debounced server lookup.",
            "topics": ["React", "Accessibility (a11y)", "Forms", "TypeScript"]
        }
    ]
}


@router.get("/test", summary="Test Assessment Router")
async def test_assessment():
    return {
        "status": "ok",
        "module": "assessment",
        "message": "Assessment router is operational"
    }


@router.get(
    "/challenges",
    summary="Get Personalized Practical Challenges"
)
async def get_challenges(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Returns practical scenario-based challenges tailored to the candidate's target role and skill gaps.
    """
    user_id = str(current_user.get("id", ""))
    target_role = current_user.get("target_role", "Data Analyst")

    # Match role key
    matched_role = "Data Analyst"
    for role_key in ROLE_CHALLENGES.keys():
        if role_key.lower() in target_role.lower():
            matched_role = role_key
            break

    challenges = ROLE_CHALLENGES.get(matched_role, ROLE_CHALLENGES["Data Analyst"])

    # Pull latest readiness practical score if available
    practical_score = 75.0
    rd_col = mongo_manager.readiness
    if rd_col is not None:
        latest_rd = rd_col.find_one({"user_id": user_id}, sort=[("created_at", -1)])
        if latest_rd:
            practical_score = latest_rd.get("dimensions", {}).get("practical", {}).get("score", 75.0)

    return {
        "target_role": target_role,
        "practical_score": round(practical_score, 1),
        "challenges": challenges
    }
