from fastapi.testclient import TestClient
from datetime import datetime, timezone
from bson import ObjectId

from app.main import app
from app.core.security import create_access_token, hash_password
from app.services.auth_service import _IN_MEMORY_USERS
from app.database.connection import mongo_manager
from app.services.admin_service import admin_service, _IN_MEMORY_AUDIT_LOGS

client = TestClient(app)


def test_admin_system_comprehensive():
    """
    Comprehensive verification of Admin Panel Backend Authorization,
    Safeguards, CRUD Operations, Aggregations, and Audit Logging.
    """
    ts = int(datetime.now().timestamp())
    admin_email = f"admin.lead_{ts}@idealskillset.internal"
    normal_user_email = f"candidate.jane_{ts}@university.edu"
    target_candidate_email = f"candidate.bob_{ts}@university.edu"

    # 1. Create or inject Admin user
    user_col = mongo_manager.user_data
    now = datetime.now(timezone.utc)

    admin_doc = {
        "name": "Lead Admin",
        "email": admin_email,
        "password_hash": hash_password("AdminPass123!"),
        "role": "admin",
        "target_role": "Platform Administrator",
        "created_at": now,
        "updated_at": now
    }

    user_doc = {
        "name": "Jane Candidate",
        "email": normal_user_email,
        "password_hash": hash_password("CandidatePass123!"),
        "role": "user",
        "target_role": "Junior Data Analyst",
        "created_at": now,
        "updated_at": now
    }

    target_doc = {
        "name": "Bob Candidate",
        "email": target_candidate_email,
        "password_hash": hash_password("CandidatePass123!"),
        "role": "user",
        "target_role": "Frontend Software Engineer",
        "created_at": now,
        "updated_at": now
    }

    if user_col is not None:
        admin_res = user_col.insert_one(admin_doc)
        admin_id = str(admin_res.inserted_id)

        user_res = user_col.insert_one(user_doc)
        normal_user_id = str(user_res.inserted_id)

        target_res = user_col.insert_one(target_doc)
        target_candidate_id = str(target_res.inserted_id)
    else:
        admin_id = f"adm_{ts}"
        admin_doc["_id"] = admin_id
        admin_doc["id"] = admin_id
        _IN_MEMORY_USERS[admin_email] = admin_doc

        normal_user_id = f"usr_jane_{ts}"
        user_doc["_id"] = normal_user_id
        user_doc["id"] = normal_user_id
        _IN_MEMORY_USERS[normal_user_email] = user_doc

        target_candidate_id = f"usr_bob_{ts}"
        target_doc["_id"] = target_candidate_id
        target_doc["id"] = target_candidate_id
        _IN_MEMORY_USERS[target_candidate_email] = target_doc

    try:
        # Generate JWT Tokens
        admin_token = create_access_token({"sub": admin_id, "email": admin_email, "role": "admin", "name": "Lead Admin"})
        user_token = create_access_token({"sub": normal_user_id, "email": normal_user_email, "role": "user", "name": "Jane Candidate"})

        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        user_headers = {"Authorization": f"Bearer {user_token}"}

        # -------------------------------------------------------------------
        # 1. Test Unauthenticated Access (Must Return 401 Unauthorized)
        # -------------------------------------------------------------------
        resp = client.get("/api/admin/dashboard")
        assert resp.status_code == 401, f"Expected 401 for unauthenticated request, got {resp.status_code}"

        # -------------------------------------------------------------------
        # 2. Test Normal User Access (Must Return 403 Forbidden)
        # -------------------------------------------------------------------
        resp = client.get("/api/admin/dashboard", headers=user_headers)
        assert resp.status_code == 403, f"Expected 403 for candidate user, got {resp.status_code}"
        assert "administrator privileges required" in resp.json()["detail"].lower()

        # -------------------------------------------------------------------
        # 3. Test Admin Access to Dashboard (Must Return 200 OK with metrics)
        # -------------------------------------------------------------------
        resp = client.get("/api/admin/dashboard", headers=admin_headers)
        assert resp.status_code == 200, f"Expected 200 for admin, got {resp.status_code}"
        data = resp.json()
        assert "metrics" in data
        assert "total_users" in data["metrics"]
        assert data["metrics"]["total_users"] >= 1
        assert "recent_users" in data
        assert "recent_activity" in data

        # -------------------------------------------------------------------
        # 4. Test User Directory Listing & Pagination
        # -------------------------------------------------------------------
        resp = client.get("/api/admin/users?page=1&limit=2", headers=admin_headers)
        assert resp.status_code == 200
        users_data = resp.json()
        assert "items" in users_data
        assert "page" in users_data
        assert "total" in users_data
        assert len(users_data["items"]) <= 2

        # -------------------------------------------------------------------
        # 5. Test User Search & Role Filtering
        # -------------------------------------------------------------------
        resp = client.get(f"/api/admin/users?search=Jane", headers=admin_headers)
        assert resp.status_code == 200
        search_data = resp.json()
        assert len(search_data["items"]) >= 1
        assert any("Jane" in u["name"] for u in search_data["items"])

        resp_admin_only = client.get("/api/admin/users?role=admin", headers=admin_headers)
        assert resp_admin_only.status_code == 200
        admin_items = resp_admin_only.json()["items"]
        assert all(u["role"] == "admin" for u in admin_items)

        # -------------------------------------------------------------------
        # 6. Test User Details (Safe: No password_hash or secret exposure)
        # -------------------------------------------------------------------
        resp = client.get(f"/api/admin/users/{normal_user_id}", headers=admin_headers)
        assert resp.status_code == 200
        user_detail = resp.json()
        assert user_detail["id"] == normal_user_id
        assert user_detail["email"] == normal_user_email
        assert "password_hash" not in user_detail
        assert "password" not in user_detail
        assert "otp" not in user_detail

        # -------------------------------------------------------------------
        # 7. Test Safeguard: Admin cannot delete themselves
        # -------------------------------------------------------------------
        resp = client.delete(f"/api/admin/users/{admin_id}", headers=admin_headers)
        assert resp.status_code == 400
        assert "cannot delete their own account" in resp.json()["detail"].lower()

        # -------------------------------------------------------------------
        # 8. Test Role Update and Audit Logging
        # -------------------------------------------------------------------
        resp = client.put(
            f"/api/admin/users/{target_candidate_id}/role",
            json={"role": "admin"},
            headers=admin_headers
        )
        assert resp.status_code == 200
        assert resp.json()["role"] == "admin"

        # Demote target back to user
        resp = client.put(
            f"/api/admin/users/{target_candidate_id}/role",
            json={"role": "user"},
            headers=admin_headers
        )
        assert resp.status_code == 200
        assert resp.json()["role"] == "user"

        # -------------------------------------------------------------------
        # 9. Test Safeguard: Cannot demote the last remaining admin
        # -------------------------------------------------------------------
        # If this is the only admin, or test when only 1 admin remains
        total_admins = user_col.count_documents({"role": "admin"}) if user_col is not None else sum(1 for u in _IN_MEMORY_USERS.values() if u.get("role") == "admin")
        if total_admins == 1:
            resp = client.put(
                f"/api/admin/users/{admin_id}/role",
                json={"role": "user"},
                headers=admin_headers
            )
            assert resp.status_code == 400
            assert "last remaining administrator" in resp.json()["detail"].lower()

        # -------------------------------------------------------------------
        # 10. Test User Deletion
        # -------------------------------------------------------------------
        resp = client.delete(f"/api/admin/users/{target_candidate_id}", headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "success"

        # -------------------------------------------------------------------
        # 11. Test Resumes, Jobs, Assessments Listing
        # -------------------------------------------------------------------
        resp_resumes = client.get("/api/admin/resumes", headers=admin_headers)
        assert resp_resumes.status_code == 200
        assert "items" in resp_resumes.json()

        resp_jobs = client.get("/api/admin/jobs", headers=admin_headers)
        assert resp_jobs.status_code == 200
        assert "items" in resp_jobs.json()

        resp_ass = client.get("/api/admin/assessments", headers=admin_headers)
        assert resp_ass.status_code == 200
        assert "items" in resp_ass.json()

        # -------------------------------------------------------------------
        # 12. Test Readiness Analytics & Score Distribution
        # -------------------------------------------------------------------
        resp_rd = client.get("/api/admin/readiness", headers=admin_headers)
        assert resp_rd.status_code == 200
        rd_data = resp_rd.json()
        assert "average_readiness_score" in rd_data
        assert "score_distribution" in rd_data
        assert len(rd_data["score_distribution"]) >= 6

        # -------------------------------------------------------------------
        # 13. Test Skill Analytics
        # -------------------------------------------------------------------
        resp_sk = client.get("/api/admin/skills/analytics", headers=admin_headers)
        assert resp_sk.status_code == 200
        sk_data = resp_sk.json()
        assert "top_required_skills" in sk_data
        assert "top_missing_skills" in sk_data

        # -------------------------------------------------------------------
        # 14. Test Audit Logs Retrieval & Health Check
        # -------------------------------------------------------------------
        resp_audit = client.get("/api/admin/audit-logs", headers=admin_headers)
        assert resp_audit.status_code == 200
        audit_data = resp_audit.json()
        assert "items" in audit_data
        assert len(audit_data["items"]) >= 1

        resp_health = client.get("/api/admin/health", headers=admin_headers)
        assert resp_health.status_code == 200
        assert resp_health.json()["api"] == "healthy"

        # -------------------------------------------------------------------
        # 15. Test ATS Analytics
        # -------------------------------------------------------------------
        resp_ats = client.get("/api/admin/ats/analytics", headers=admin_headers)
        assert resp_ats.status_code == 200
        ats_data = resp_ats.json()
        assert "average_ats_score" in ats_data
        assert "score_distribution" in ats_data
        assert "common_missing_skills" in ats_data
        assert "problem_breakdown" in ats_data
        assert len(ats_data["score_distribution"]) >= 5

        # -------------------------------------------------------------------
        # 16. Test Assessment Analytics
        # -------------------------------------------------------------------
        resp_ass_an = client.get("/api/admin/assessments/analytics", headers=admin_headers)
        assert resp_ass_an.status_code == 200
        ass_an_data = resp_ass_an.json()
        assert "pass_rate" in ass_an_data
        assert "skill_difficulty" in ass_an_data
        assert len(ass_an_data["skill_difficulty"]) >= 3

        # -------------------------------------------------------------------
        # 17. Test Interview Analytics
        # -------------------------------------------------------------------
        resp_int = client.get("/api/admin/interviews/analytics", headers=admin_headers)
        assert resp_int.status_code == 200
        int_data = resp_int.json()
        assert "technical_score" in int_data
        assert "communication_score" in int_data
        assert "confidence_score" in int_data
        assert "common_weaknesses" in int_data

        # -------------------------------------------------------------------
        # 18. Test Roadmap Analytics
        # -------------------------------------------------------------------
        resp_rm = client.get("/api/admin/roadmaps/analytics", headers=admin_headers)
        assert resp_rm.status_code == 200
        rm_data = resp_rm.json()
        assert "total_roadmaps_generated" in rm_data
        assert "abandoned_weeks" in rm_data
        assert "task_type_breakdown" in rm_data

        # -------------------------------------------------------------------
        # 19. Test AI / Ollama Monitoring
        # -------------------------------------------------------------------
        resp_ai = client.get("/api/admin/ai/health", headers=admin_headers)
        assert resp_ai.status_code == 200
        ai_data = resp_ai.json()
        assert ai_data["ollama_status"] == "online"
        assert "llama" in ai_data["active_model"].lower()

        # -------------------------------------------------------------------
        # 20. Test Notifications & Mark Read
        # -------------------------------------------------------------------
        resp_notif = client.get("/api/admin/notifications", headers=admin_headers)
        assert resp_notif.status_code == 200
        notif_data = resp_notif.json()
        assert "items" in notif_data
        assert len(notif_data["items"]) >= 1

        first_notif_id = notif_data["items"][0]["id"]
        resp_mark = client.put(f"/api/admin/notifications/{first_notif_id}/read", headers=admin_headers)
        assert resp_mark.status_code == 200
        assert resp_mark.json()["status"] == "success"

    finally:
        # Cleanup test records
        if user_col is not None:
            user_col.delete_many({"email": {"$in": [admin_email, normal_user_email, target_candidate_email]}})
        else:
            _IN_MEMORY_USERS.pop(admin_email, None)
            _IN_MEMORY_USERS.pop(normal_user_email, None)
            _IN_MEMORY_USERS.pop(target_candidate_email, None)


