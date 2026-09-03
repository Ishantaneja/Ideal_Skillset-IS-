from fastapi import APIRouter, Depends, status
from typing import Dict, Any, List, Optional
from app.core.dependencies import get_current_user
from app.database.connection import mongo_manager

router = APIRouter(prefix="/interview", tags=["Interview Simulator"])

ROLE_INTERVIEW_QUESTIONS = {
    "Data Analyst": [
        {
            "id": "q_da_01",
            "category": "Behavioral & Problem Solving",
            "question": "Can you walk me through a situation where you discovered conflicting data across different business sources, and how you resolved the discrepancy?",
            "target_competency": "Data Integrity & Stakeholder Communication",
            "star_hint": "Situation: Conflicting metrics. Task: Identify root cause. Action: Cross-table SQL audit. Result: Reconciled executive numbers."
        },
        {
            "id": "q_da_02",
            "category": "Technical: SQL Optimization",
            "question": "When would you choose a Window Function over a GROUP BY aggregation, and how do you optimize multi-table analytical joins in PostgreSQL?",
            "target_competency": "Advanced Query Optimization",
            "star_hint": "Explain partition vs row grouping, ROW_NUMBER vs DENSE_RANK, and EXPLAIN query plans."
        },
        {
            "id": "q_da_03",
            "category": "Technical: Business Intelligence & DAX",
            "question": "How do you handle filter context transitions in Power BI DAX using CALCULATE, and how do you design a robust Star Schema?",
            "target_competency": "Data Modeling & BI Delivery",
            "star_hint": "Explain Fact vs Dimension tables, relationship cardinality, and calculate row-to-filter context."
        }
    ],
    "Software Engineer": [
        {
            "id": "q_se_01",
            "category": "System Design & Architecture",
            "question": "How would you design a scalable, rate-limited RESTful API with JWT authentication and Redis caching to handle 10,000 requests per second?",
            "target_competency": "Backend Architecture & Scalability",
            "star_hint": "Discuss token expiration, sliding window rate-limiting in Redis, database connection pooling, and horizontal scaling."
        },
        {
            "id": "q_se_02",
            "category": "Technical Problem Solving",
            "question": "Describe a time you diagnosed and resolved a critical production performance bottleneck or memory leak.",
            "target_competency": "Debugging & Production Readiness",
            "star_hint": "Situation: Slow endpoint. Action: Profiling, database indexing, async concurrency. Result: Reduced latency by 80%."
        }
    ],
    "Machine Learning Engineer": [
        {
            "id": "q_ml_01",
            "category": "Machine Learning Lifecycle",
            "question": "How do you evaluate when a model suffers from data leakage or overfitting, and what cross-validation strategy do you apply for time-series features?",
            "target_competency": "Model Validation & Robustness",
            "star_hint": "Discuss TimeSeriesSplit, rolling windows, feature importance tracking, and metric selection (ROC-AUC, Precision-Recall)."
        }
    ]
}


@router.get("/test", summary="Test Interview Router")
async def test_interview():
    return {
        "status": "ok",
        "module": "interview",
        "message": "Interview router is operational"
    }


@router.get(
    "/questions",
    summary="Get Personalized Mock Interview Questions"
)
async def get_questions(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Generates personalized technical and behavioral mock interview questions
    tailored to candidate's target role and background.
    """
    user_id = str(current_user.get("id", ""))
    target_role = current_user.get("target_role", "Data Analyst")

    # Match role key
    matched_role = "Data Analyst"
    for role_key in ROLE_INTERVIEW_QUESTIONS.keys():
        if role_key.lower() in target_role.lower():
            matched_role = role_key
            break

    questions = ROLE_INTERVIEW_QUESTIONS.get(matched_role, ROLE_INTERVIEW_QUESTIONS["Data Analyst"])

    # Pull latest readiness communication score if available
    comm_score = 76.0
    rd_col = mongo_manager.readiness
    if rd_col is not None:
        latest_rd = rd_col.find_one({"user_id": user_id}, sort=[("created_at", -1)])
        if latest_rd:
            comm_score = latest_rd.get("dimensions", {}).get("communication", {}).get("score", 76.0)

    return {
        "target_role": target_role,
        "communication_score": round(comm_score, 1),
        "questions": questions
    }
