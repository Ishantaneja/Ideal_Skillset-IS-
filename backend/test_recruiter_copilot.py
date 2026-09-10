import io
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone
from bson import ObjectId

from app.main import app
from app.core.security import create_access_token, hash_password
from app.database.connection import mongo_manager
from app.services.auth_service import _IN_MEMORY_USERS

client = TestClient(app)


def test_recruiter_copilot_full_flow():
    """
    Comprehensive test for Recruiter AI Hiring Copilot:
    1. Register recruiters for Company Alpha and Company Beta (Multi-tenancy isolation)
    2. Company Alpha creates a Job and verifies AI Job Blueprint generation & editing
    3. Batch upload multiple resumes for the job & verify multi-dimensional screening
    4. Verify Candidate 360° view, evidence verification, consistency checks, and 'Why Interview?'
    5. Test side-by-side Candidate Comparison (2-5 candidates)
    6. Generate AI Assessment and submit results
    7. Generate AI Interview Guide and summarize notes
    8. Advance pipeline stage and record hiring decision
    9. Verify Recruiter Command Center Dashboard and Screening Efficiency analytics
    10. Enforce strict company isolation (Company Beta recruiter cannot access Company Alpha's job)
    """
    mongo_manager.connect()
    ts = int(datetime.now().timestamp())

    # --- 1. Register Recruiter Alpha and Recruiter Beta ---
    alpha_email = f"alpha.recruiter_{ts}@alpha-tech.io"
    beta_email = f"beta.recruiter_{ts}@beta-corp.com"

    res_alpha = client.post("/api/auth/recruiter/signup", json={
        "name": "Alice Alpha",
        "email": alpha_email,
        "password": "Password123!",
        "company_name": f"Alpha Systems {ts}"
    })
    assert res_alpha.status_code == 201
    alpha_token = res_alpha.json()["access_token"]
    alpha_headers = {"Authorization": f"Bearer {alpha_token}"}

    res_beta = client.post("/api/auth/recruiter/signup", json={
        "name": "Bob Beta",
        "email": beta_email,
        "password": "Password123!",
        "company_name": f"Beta Dynamics {ts}"
    })
    assert res_beta.status_code == 201
    beta_token = res_beta.json()["access_token"]
    beta_headers = {"Authorization": f"Bearer {beta_token}"}

    # --- 2. Create Job & AI Blueprint ---
    job_payload = {
        "title": "Senior Backend Developer",
        "description": "Develop scalable REST APIs in Python using FastAPI, MongoDB, Docker, and Redis.",
        "responsibilities": [
            "Build secure FastAPI microservices",
            "Optimize MongoDB queries and aggregation pipelines",
            "Deploy containerized applications with Docker"
        ],
        "required_experience": "3-5 years",
        "location": "San Francisco, CA / Hybrid",
        "employment_type": "Full-time",
        "salary_range": "$130,000 - $160,000",
        "required_skills": ["Python", "FastAPI", "MongoDB", "Docker"],
        "preferred_skills": ["Redis", "AWS"]
    }
    job_res = client.post("/api/recruiter/jobs", json=job_payload, headers=alpha_headers)
    assert job_res.status_code == 201
    job_data = job_res.json()
    job_id = job_data["id"]
    assert job_data["title"] == "Senior Backend Developer"
    assert "blueprint" in job_data
    bp = job_data["blueprint"]
    assert len(bp["critical_skills"]) >= 2
    assert any(s["name"] == "Python" for s in bp["critical_skills"])
    assert any(s["name"] == "FastAPI" for s in bp["critical_skills"])

    # Update Job Blueprint
    bp["summary"] = "Customized lead engineering blueprint."
    update_res = client.put(f"/api/recruiter/jobs/{job_id}", json={"blueprint": bp}, headers=alpha_headers)
    assert update_res.status_code == 200
    assert update_res.json()["blueprint"]["summary"] == "Customized lead engineering blueprint."

    # --- 3. Batch Upload Multiple Resumes ---
    resume_1 = (
        "John Doe\n"
        "Email: john.doe@example.com\n"
        "Title: Senior Backend Developer\n"
        "Experience: 4 years building production APIs in Python and FastAPI. Optimized MongoDB aggregation.\n"
        "Skills: Python, FastAPI, MongoDB, Docker, REST APIs, Git\n"
        "Projects: Built scalable microservice handling 10k req/sec with Docker and Redis.\n"
    )
    resume_2 = (
        "Jane Smith\n"
        "Email: jane.smith@example.com\n"
        "Title: Full Stack Engineer\n"
        "Experience: 2 years developing React frontends and Node.js APIs.\n"
        "Skills: JavaScript, React, HTML5, CSS3, Tailwind CSS\n"
        "Projects: Created responsive analytics dashboard in React.\n"
    )

    files = [
        ("files", ("john_doe_resume.txt", io.BytesIO(resume_1.encode("utf-8")), "text/plain")),
        ("files", ("jane_smith_resume.txt", io.BytesIO(resume_2.encode("utf-8")), "text/plain")),
    ]
    upload_res = client.post(f"/api/recruiter/jobs/{job_id}/upload-resumes", files=files, headers=alpha_headers)
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
    upload_data = upload_res.json()
    assert upload_data["successfully_ingested"] == 2
    cand_1_id = upload_data["ingested_candidates"][0]["candidate_id"]
    cand_2_id = upload_data["ingested_candidates"][1]["candidate_id"]

    # --- 4. Verify Applicant Screening List & Scores ---
    applicants_res = client.get(f"/api/recruiter/jobs/{job_id}/candidates", headers=alpha_headers)
    assert applicants_res.status_code == 200
    applicants = applicants_res.json()
    assert len(applicants) >= 2

    # John Doe should match higher than Jane Smith for Backend Python
    john_app = next(a for a in applicants if "john.doe" in a["email"])
    jane_app = next(a for a in applicants if "jane.smith" in a["email"])
    assert john_app["overall_fit"] > jane_app["overall_fit"]
    assert john_app["recommended_action"] in ["STRONG MATCH", "INTERVIEW", "VERIFY SKILLS"]

    # --- 5. Verify Candidate 360° View ---
    c360_res = client.get(f"/api/recruiter/candidates/{cand_1_id}/360?job_id={job_id}", headers=alpha_headers)
    assert c360_res.status_code == 200
    c360 = c360_res.json()
    assert "candidate" in c360
    assert "evaluation" in c360
    assert "hiring_recommendation" in c360
    eval_data = c360["evaluation"]
    assert len(eval_data["verifications"]) >= 2
    assert "why_interview" in eval_data
    assert len(eval_data["why_interview"]) >= 2
    assert "why_not_interview" in eval_data

    # --- 6. Candidate Comparison Matrix (2 Candidates) ---
    compare_res = client.post("/api/recruiter/compare", json={
        "candidate_ids": [cand_1_id, cand_2_id],
        "job_id": job_id
    }, headers=alpha_headers)
    assert compare_res.status_code == 200
    comp_data = compare_res.json()
    assert len(comp_data["candidates"]) == 2
    assert comp_data["strongest_candidate_id"] == cand_1_id
    assert "comparative_summary" in comp_data

    # --- 7. AI Assessment Generation & Submission ---
    asm_res = client.post(f"/api/recruiter/assessments/generate?candidate_id={cand_1_id}&job_id={job_id}", headers=alpha_headers)
    assert asm_res.status_code == 200
    asm_data = asm_res.json()
    assert len(asm_data["questions"]) >= 3
    asm_id = asm_data["id"]

    submit_asm = client.post("/api/recruiter/assessments/submit", json={
        "assessment_id": asm_id,
        "candidate_id": cand_1_id,
        "job_id": job_id,
        "score": 92.5,
        "section_scores": {"Core Programming & Python": 95.0, "API Design & Routing": 90.0},
        "interviewer_notes": "Demonstrated deep mastery of asyncio and FastAPI dependency injection."
    }, headers=alpha_headers)
    assert submit_asm.status_code == 200

    # --- 8. AI Interview Generation & Summary ---
    int_res = client.post(f"/api/recruiter/interviews/generate?candidate_id={cand_1_id}&job_id={job_id}", headers=alpha_headers)
    assert int_res.status_code == 200
    int_data = int_res.json()
    assert len(int_data["technical_questions"]) >= 2
    assert len(int_data["behavioral_questions"]) >= 2

    sum_res = client.post("/api/recruiter/interviews/summarize", json={
        "candidate_id": cand_1_id,
        "job_id": job_id,
        "interviewer_notes": "Candidate explained clean microservice architecture with excellent debugging methodology and clear communication.",
        "technical_score": 90.0,
        "communication_score": 88.0,
        "problem_solving_score": 92.0
    }, headers=alpha_headers)
    assert sum_res.status_code == 200
    summary = sum_res.json()
    assert summary["recommendation"] == "PROCEED TO FINAL ROUND"

    # --- 9. Advance Stage & Record Decision ---
    stage_res = client.post(f"/api/recruiter/candidates/{cand_1_id}/stage?job_id={job_id}", json={
        "stage": "interview",
        "notes": "Passed technical screening with high confidence."
    }, headers=alpha_headers)
    assert stage_res.status_code == 200
    assert stage_res.json()["current_stage"] == "interview"

    dec_res = client.post(f"/api/recruiter/candidates/{cand_1_id}/decision", json={
        "job_id": job_id,
        "candidate_id": cand_1_id,
        "action": "OFFER",
        "reason": "Strongest technical match with verified production code and high interview score.",
        "supporting_evidence": "92% assessment, verified Python & FastAPI code.",
        "next_step": "Extend formal written offer letter."
    }, headers=alpha_headers)
    assert dec_res.status_code == 200

    # --- 10. Recruiter Dashboard & Analytics ---
    dash_res = client.get("/api/recruiter/dashboard", headers=alpha_headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["open_roles"] >= 1
    assert dash_data["total_applicants"] >= 2
    assert dash_data["estimated_screening_time_saved_hours"] > 0
    assert "screening_time_note" in dash_data

    analytics_res = client.get("/api/recruiter/analytics", headers=alpha_headers)
    assert analytics_res.status_code == 200
    analytics_data = analytics_res.json()
    assert len(analytics_data["pipeline_funnel"]) >= 4

    # --- 11. Strict Multi-Tenant Isolation ---
    # Recruiter Beta should NOT be able to access Recruiter Alpha's job
    beta_access = client.get(f"/api/recruiter/jobs/{job_id}", headers=beta_headers)
    assert beta_access.status_code == 404, f"Expected 404 for unauthorized company access, got {beta_access.status_code}"

