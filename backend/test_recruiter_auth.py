import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone
from bson import ObjectId

from app.main import app
from app.core.security import create_access_token, hash_password
from app.services.auth_service import _IN_MEMORY_USERS
from app.database.connection import mongo_manager

client = TestClient(app)


def test_recruiter_authentication_and_portal_access():
    """
    Comprehensive verification of Recruiter authentication, role isolation,
    candidate discovery, and shortlist management.
    """
    mongo_manager.connect()
    ts = int(datetime.now().timestamp())
    recruiter_email = f"recruiter.lead_{ts}@talentcorp.com"
    candidate_email = f"candidate.mark_{ts}@university.edu"
    now = datetime.now(timezone.utc)
    user_col = mongo_manager.user_data

    # 1. Test Recruiter Registration via /api/auth/recruiter/signup
    signup_payload = {
        "name": "Sarah Jenkins",
        "email": recruiter_email,
        "password": "RecruiterPassword123!",
        "company_name": "TalentCorp Global"
    }
    signup_res = client.post("/api/auth/recruiter/signup", json=signup_payload)
    assert signup_res.status_code == 201, f"Signup failed: {signup_res.text}"
    signup_data = signup_res.json()
    assert signup_data["user"]["role"] == "recruiter"
    assert signup_data["user"]["company_name"] == "TalentCorp Global"
    assert "access_token" in signup_data
    recruiter_id = signup_data["user"]["id"]

    # 2. Test Recruiter Login via /api/auth/recruiter/login
    login_res = client.post("/api/auth/recruiter/login", json={
        "email": recruiter_email,
        "password": "RecruiterPassword123!"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    login_data = login_res.json()
    assert login_data["user"]["role"] == "recruiter"
    recruiter_token = login_data["access_token"]
    recruiter_headers = {"Authorization": f"Bearer {recruiter_token}"}

    # 3. Create a Candidate User and Test Role Isolation
    cand_doc = {
        "name": "Mark Candidate",
        "email": candidate_email,
        "password_hash": hash_password("CandidatePass123!"),
        "role": "user",
        "target_role": "Junior Data Analyst",
        "skills": ["Python", "SQL", "Power BI"],
        "github_url": "https://github.com/markdev",
        "created_at": now,
        "updated_at": now
    }
    if user_col is not None:
        cand_res = user_col.insert_one(cand_doc)
        cand_id = str(cand_res.inserted_id)
    else:
        cand_id = f"cand_{ts}"
        cand_doc["_id"] = cand_id
        _IN_MEMORY_USERS[candidate_email] = cand_doc

    cand_token = create_access_token({"sub": cand_id, "email": candidate_email, "role": "user", "name": "Mark Candidate"})
    cand_headers = {"Authorization": f"Bearer {cand_token}"}

    # A) Candidate attempting to login to Recruiter Portal must return 403 Forbidden
    cand_rec_login = client.post("/api/auth/recruiter/login", json={
        "email": candidate_email,
        "password": "CandidatePass123!"
    })
    assert cand_rec_login.status_code == 403, f"Expected 403, got {cand_rec_login.status_code}"

    # B) Candidate attempting to access Recruiter API must return 403 Forbidden
    cand_rec_api = client.get("/api/recruiter/candidates", headers=cand_headers)
    assert cand_rec_api.status_code == 403, f"Expected 403, got {cand_rec_api.status_code}"

    # C) Unauthenticated request must return 401 Unauthorized
    unauth_res = client.get("/api/recruiter/candidates")
    assert unauth_res.status_code == 401

    # 4. Test Recruiter Dashboard Metrics
    stats_res = client.get("/api/recruiter/dashboard-stats", headers=recruiter_headers)
    assert stats_res.status_code == 200, f"Stats failed: {stats_res.text}"
    stats_data = stats_res.json()
    assert "total_candidates" in stats_data
    assert "github_verified_coders" in stats_data
    assert "average_readiness_score" in stats_data
    assert stats_data["company_name"] == "TalentCorp Global"

    # 5. Test Candidate Discovery & Filtering
    cand_list_res = client.get("/api/recruiter/candidates", headers=recruiter_headers)
    assert cand_list_res.status_code == 200
    cand_list = cand_list_res.json()
    assert cand_list["total"] >= 1
    assert any(c["name"] == "Mark Candidate" or c["id"] == cand_id for c in cand_list["items"])

    # 6. Test Candidate Detail Dossier
    detail_res = client.get(f"/api/recruiter/candidate/{cand_id}", headers=recruiter_headers)
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert "candidate" in detail_data
    assert "readiness_twin" in detail_data
    assert detail_data["candidate"]["name"] == "Mark Candidate"

    # 7. Test Shortlisting Candidate
    shortlist_res = client.post(f"/api/recruiter/shortlist/{cand_id}", headers=recruiter_headers)
    assert shortlist_res.status_code == 200
    assert shortlist_res.json()["is_shortlisted"] is True

    # Retrieve shortlist
    saved_list_res = client.get("/api/recruiter/shortlist", headers=recruiter_headers)
    assert saved_list_res.status_code == 200
    saved_items = saved_list_res.json()["items"]
    assert any(c["id"] == cand_id for c in saved_items)

    # Toggle shortlist again to remove
    unshortlist_res = client.post(f"/api/recruiter/shortlist/{cand_id}", headers=recruiter_headers)
    assert unshortlist_res.status_code == 200
    assert unshortlist_res.json()["is_shortlisted"] is False

    # Cleanup test documents
    if user_col is not None:
        if ObjectId.is_valid(recruiter_id):
            user_col.delete_one({"_id": ObjectId(recruiter_id)})
        if ObjectId.is_valid(cand_id):
            user_col.delete_one({"_id": ObjectId(cand_id)})
    if recruiter_email in _IN_MEMORY_USERS:
        del _IN_MEMORY_USERS[recruiter_email]
    if candidate_email in _IN_MEMORY_USERS:
        del _IN_MEMORY_USERS[candidate_email]

