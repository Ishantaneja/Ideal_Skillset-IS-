import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone
from bson import ObjectId

from app.main import app
from app.core.security import create_access_token, hash_password
from app.services.auth_service import _IN_MEMORY_USERS
from app.database.connection import mongo_manager
from app.services.github_verifier import github_verifier
from app.services.readiness_engine import readiness_engine

client = TestClient(app)


def test_github_username_extraction():
    """Test URL and handle sanitization."""
    assert github_verifier.extract_username("https://github.com/octocat") == "octocat"
    assert github_verifier.extract_username("https://github.com/octocat/Spoon-Knife") == "octocat"
    assert github_verifier.extract_username("http://github.com/torvalds/") == "torvalds"
    assert github_verifier.extract_username("@johndoe") == "johndoe"
    assert github_verifier.extract_username("johndoe") == "johndoe"
    assert github_verifier.extract_username("") == ""
    assert github_verifier.extract_username(None) == ""


def test_github_repo_skill_detection():
    """Test technology and keyword detection across repo properties."""
    sample_repo = {
        "name": "sales-dashboard-fastapi",
        "description": "Interactive data visualization dashboard built with React, FastAPI, and PostgreSQL with Docker.",
        "language": "Python",
        "languages": {"Python": 120000, "TypeScript": 85000, "SQL": 15000},
        "topics": ["fastapi", "react", "docker", "data-analysis", "postgresql"],
        "html_url": "https://github.com/testuser/sales-dashboard-fastapi",
        "stargazers_count": 12,
        "forks_count": 3,
    }

    detected = github_verifier.detect_skills_in_repo(sample_repo)
    detected_lower = [s.lower() for s in detected]

    assert "python" in detected_lower
    assert "fastapi" in detected_lower
    assert "react" in detected_lower
    assert "docker" in detected_lower
    assert "postgresql" in detected_lower
    assert "sql" in detected_lower


def test_github_verification_endpoint_and_flow():
    """Test full verification flow via authenticated API."""
    mongo_manager.connect()
    ts = int(datetime.now().timestamp())
    candidate_email = f"candidate.gh_{ts}@university.edu"
    user_col = mongo_manager.user_data
    now = datetime.now(timezone.utc)

    user_doc = {
        "name": "Alex Developer",
        "email": candidate_email,
        "password_hash": hash_password("CandidatePass123!"),
        "role": "user",
        "target_role": "Data Engineer / Python Developer",
        "github_url": "https://github.com/alexdev",
        "skills": ["Python", "FastAPI", "Docker", "Kubernetes", "PyTorch", "Rust"],
        "created_at": now,
        "updated_at": now,
    }

    if user_col is not None:
        user_res = user_col.insert_one(user_doc)
        user_id = str(user_res.inserted_id)
    else:
        user_id = f"user_{ts}"
        user_doc["_id"] = user_id
        _IN_MEMORY_USERS[candidate_email] = user_doc

    token = create_access_token({"sub": user_id, "email": candidate_email, "role": "user"})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Trigger GitHub Verification
    response = client.post(
        "/api/evidence/verify-github",
        json={
            "github_url": "https://github.com/octocat",
            "skills_to_verify": ["Python", "Git", "React", "Docker", "UnusedBlockchainSkill"],
        },
        headers=headers,
    )
    assert response.status_code == 200, f"Error: {response.text}"
    data = response.json()

    assert data["username"] == "octocat"
    assert "verified_skills" in data
    assert "unverified_skills" in data
    assert "proof_score" in data
    assert "verification_verdict" in data
    assert len(data["repositories"]) > 0

    # Ensure verified_skills have is_used_in_projects == True
    for vs in data["verified_skills"]:
        assert vs["is_used_in_projects"] is True
        assert vs["status"] == "verified"
        assert len(vs["matched_repositories"]) > 0

    # Ensure unverified_skills have is_used_in_projects == False
    for us in data["unverified_skills"]:
        assert us["is_used_in_projects"] is False
        assert us["status"] == "unverified"
        assert len(us["matched_repositories"]) == 0
        assert "recommendation" in us

    # 2. Retrieve Status via GET
    status_res = client.get("/api/evidence/github-status", headers=headers)
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["username"] == "octocat"
    assert status_data["proof_score"] == data["proof_score"]

    # Cleanup
    if user_col is not None and ObjectId.is_valid(user_id):
        user_col.delete_one({"_id": ObjectId(user_id)})
    if candidate_email in _IN_MEMORY_USERS:
        del _IN_MEMORY_USERS[candidate_email]


def test_readiness_evidence_calculation():
    """Verify evidence calculation reflects GitHub project proof."""
    resume_doc = {
        "extracted_text": "Experienced Python Engineer building REST APIs and data pipelines using SQL and Docker. Increased efficiency by 30% handling 50k requests.",
        "skills": ["Python", "SQL", "Docker", "FastAPI", "Rust"],
    }

    # Case 1: Without GitHub
    dim_no_gh = readiness_engine.calculate_evidence(resume_doc, github_url=None, portfolio_url=None)
    assert dim_no_gh.score < 60.0
    assert any("No public GitHub" in gap for gap in dim_no_gh.gaps)

    # Case 2: With GitHub
    dim_with_gh = readiness_engine.calculate_evidence(
        resume_doc,
        github_url="https://github.com/octocat",
        portfolio_url="https://octocat.dev",
    )
    assert dim_with_gh.score >= 70.0
    assert any("Verified in GitHub projects" in s for s in dim_with_gh.strengths)
