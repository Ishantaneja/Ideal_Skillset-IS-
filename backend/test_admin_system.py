from fastapi.testclient import TestClient
from datetime import datetime, timezone
from bson import ObjectId

from app.main import app
from app.core.security import create_access_token, hash_password
from app.services.auth_service import _IN_MEMORY_USERS
from app.database.connection import mongo_manager

client = TestClient(app)


def test_admin_portal_comprehensive():
    """
    Comprehensive verification of Overridden Admin Portal Backend:
    - Route connectivity (/admin/test)
    - Admin authorization & permission enforcement
    - Overview metrics and recent activity (/admin/overview)
    - User list (/admin/users)
    - Job role creation, listing, updating, duplicate prevention (/admin/job-roles)
    - Active job roles public endpoint (/jobs/roles)
    - Candidate deactivation and reactivation (/admin/users/{id}/deactivate, activate)
    - User logout (/auth/logout)
    """
    mongo_manager.connect()
    ts = int(datetime.now().timestamp())
    admin_email = f"admin.lead_{ts}@idealskillset.internal"
    candidate_email = f"candidate.jane_{ts}@university.edu"

    # 1. Prepare Admin & Candidate Documents
    user_col = mongo_manager.user_data
    now = datetime.now(timezone.utc)

    admin_doc = {
        "name": "Lead Admin",
        "email": admin_email,
        "password_hash": hash_password("AdminPass123!"),
        "role": "admin",
        "target_role": "Platform Administrator",
        "is_active": True,
        "is_online": True,
        "created_at": now,
        "updated_at": now
    }

    candidate_doc = {
        "name": "Jane Candidate",
        "email": candidate_email,
        "password_hash": hash_password("CandidatePass123!"),
        "role": "user",
        "target_role": "Junior Data Analyst",
        "is_active": True,
        "is_online": False,
        "created_at": now,
        "updated_at": now
    }

    if user_col is not None:
        admin_res = user_col.insert_one(admin_doc)
        admin_id = str(admin_res.inserted_id)
        cand_res = user_col.insert_one(candidate_doc)
        cand_id = str(cand_res.inserted_id)
    else:
        admin_id = f"admin_{ts}"
        admin_doc["_id"] = admin_id
        _IN_MEMORY_USERS[admin_email] = admin_doc
        cand_id = f"cand_{ts}"
        candidate_doc["_id"] = cand_id
        _IN_MEMORY_USERS[candidate_email] = candidate_doc

    admin_token = create_access_token({"sub": admin_id, "email": admin_email, "role": "admin"})
    cand_token = create_access_token({"sub": cand_id, "email": candidate_email, "role": "user"})

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    cand_headers = {"Authorization": f"Bearer {cand_token}"}

    # 2. Public connectivity check
    r_test = client.get("/api/admin/test")
    assert r_test.status_code == 200
    assert r_test.json().get("status") == "ok"

    # 3. Access control: Normal user forbidden on admin endpoints
    r_forbidden = client.get("/api/admin/overview", headers=cand_headers)
    assert r_forbidden.status_code == 403

    # Unauthenticated forbidden / unauthorized
    r_unauth = client.get("/api/admin/overview")
    assert r_unauth.status_code in [401, 403]

    # 4. Admin Overview
    r_overview = client.get("/api/admin/overview", headers=admin_headers)
    assert r_overview.status_code == 200
    data_overview = r_overview.json()
    assert "metrics" in data_overview
    assert "total_users" in data_overview["metrics"]
    assert "recent_users" in data_overview
    assert "recent_activity" in data_overview

    # 5. List Users
    r_users = client.get("/api/admin/users", headers=admin_headers)
    assert r_users.status_code == 200
    users_data = r_users.json()
    assert "items" in users_data
    assert "total" in users_data

    # 6. Job Roles Management
    role_name = f"ML Engineer {ts}"
    new_role = {
        "name": role_name,
        "description": "Develop and deploy ML models",
        "experience": "2+ years",
        "skills": "Python, PyTorch, Docker",
        "status": "Active"
    }

    # Create job role
    r_create_role = client.post("/api/admin/job-roles", json=new_role, headers=admin_headers)
    assert r_create_role.status_code == 201
    created_role = r_create_role.json().get("job_role", {})
    assert created_role.get("name") == role_name
    job_role_id = created_role.get("id")

    # Prevent duplicate job role creation
    r_dup_role = client.post("/api/admin/job-roles", json=new_role, headers=admin_headers)
    assert r_dup_role.status_code == 409

    # List job roles (Admin)
    r_roles = client.get("/api/admin/job-roles", headers=admin_headers)
    assert r_roles.status_code == 200
    roles_list = r_roles.json().get("items", [])
    assert any(r.get("name") == role_name for r in roles_list)

    # Public active job roles
    r_pub_roles = client.get("/api/jobs/roles")
    assert r_pub_roles.status_code == 200
    pub_roles = r_pub_roles.json().get("items", [])
    assert any(r.get("name") == role_name for r in pub_roles)

    # Update job role
    if job_role_id:
        update_payload = {
            "name": f"{role_name} Senior",
            "description": "Lead and deploy enterprise ML models",
            "experience": "5+ years",
            "skills": "Python, PyTorch, Kubernetes",
            "status": "Active"
        }
        r_update = client.put(f"/api/admin/job-roles/{job_role_id}", json=update_payload, headers=admin_headers)
        assert r_update.status_code == 200
        assert r_update.json().get("job_role", {}).get("name") == f"{role_name} Senior"

    # 7. Candidate Deactivation & Reactivation
    r_deact = client.post(f"/api/admin/users/{cand_id}/deactivate", headers=admin_headers)
    assert r_deact.status_code == 200
    assert r_deact.json().get("status") == "success"

    # Login attempt by deactivated candidate should return 403
    r_cand_login = client.post("/api/auth/login", json={"email": candidate_email, "password": "CandidatePass123!"})
    assert r_cand_login.status_code == 403

    # Reactivate candidate
    r_react = client.post(f"/api/admin/users/{cand_id}/activate", headers=admin_headers)
    assert r_react.status_code == 200
    assert r_react.json().get("status") == "success"

    # Login attempt by reactivated candidate succeeds
    r_cand_login2 = client.post("/api/auth/login", json={"email": candidate_email, "password": "CandidatePass123!"})
    assert r_cand_login2.status_code == 200

    # 8. User Logout
    r_logout = client.post("/api/auth/logout", headers=cand_headers)
    assert r_logout.status_code == 200
    assert r_logout.json().get("status") == "success"

    # Clean up test documents if in MongoDB
    if user_col is not None:
        try:
            if ObjectId.is_valid(admin_id):
                user_col.delete_one({"_id": ObjectId(admin_id)})
            if ObjectId.is_valid(cand_id):
                user_col.delete_one({"_id": ObjectId(cand_id)})
            if mongo_manager.job_roles is not None and job_role_id and ObjectId.is_valid(job_role_id):
                mongo_manager.job_roles.delete_one({"_id": ObjectId(job_role_id)})
        except Exception:
            pass
