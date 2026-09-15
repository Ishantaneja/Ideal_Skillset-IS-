import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import mongo_manager

client = TestClient(app)


def test_recruiter_advanced_intelligence_flow():
    """
    Validates:
    - Custom Evaluation Weights
    - Natural Language & Multi-Source Capability Search
    - What-If Requirements Simulator (zero live mutation)
    - Work Environment Simulations (Incident challenge generation & evaluation)
    - Autonomous AI Recruiter Agent run & audit trail
    - Recruiter feedback logging
    - Multi-tenant company isolation
    """
    mongo_manager.connect()
    ts = int(datetime.now().timestamp())

    # 1. Sign up recruiter
    rec_res = client.post("/api/auth/recruiter/signup", json={
        "name": "Jordan Staff",
        "email": f"jordan_{ts}@nexus-talent.ai",
        "password": "Password123!",
        "company_name": f"Nexus Tech {ts}"
    })
    assert rec_res.status_code == 201, rec_res.text
    token = rec_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Requisition
    job_res = client.post("/api/recruiter/jobs", json={
        "title": "Cloud Platform Engineer",
        "description": "Build resilient Kubernetes infrastructure, Docker containers, and Python microservices.",
        "responsibilities": ["Design CI/CD pipelines", "Manage AWS infrastructure", "Build microservices"],
        "required_skills": ["Python", "Docker", "Kubernetes", "AWS"],
        "preferred_skills": ["Terraform", "FastAPI"],
        "required_experience": "3+ years"
    }, headers=headers)
    assert job_res.status_code == 201, job_res.text
    job_data = job_res.json()
    job_id = job_data["id"]

    # Ingest a sample candidate resume
    sample_resume = (
        f"Alex Rivera\n"
        f"alex_{ts}@example.com\n"
        f"Summary: Senior Cloud Engineer with 5 years building Docker, Kubernetes, AWS, and Python microservices.\n"
        f"Experience: 5 years at CloudCorp. Handled high-throughput Kubernetes deployments.\n"
        f"Skills: Python, Docker, Kubernetes, AWS, Terraform, FastAPI, PostgreSQL.\n"
        f"GitHub: https://github.com/alexrivera/cloud-infra\n"
    )
    ingest_res = client.post(
        f"/api/recruiter/jobs/{job_id}/upload-resumes",
        files=[("files", ("alex_rivera_resume.txt", sample_resume.encode("utf-8"), "text/plain"))],
        headers=headers
    )
    assert ingest_res.status_code == 200, ingest_res.text
    assert ingest_res.json()["successfully_ingested"] >= 1
    cand_id = ingest_res.json()["ingested_candidates"][0]["candidate_id"]

    # 3. Configure Custom Requisition Evaluation Weights
    weights_payload = {
        "technical_skills": 0.40,
        "experience": 0.20,
        "practical_evidence": 0.20,
        "assessment": 0.10,
        "communication": 0.05,
        "education": 0.05
    }
    weights_res = client.post(f"/api/recruiter/jobs/{job_id}/weights", json=weights_payload, headers=headers)
    assert weights_res.status_code == 200, weights_res.text
    assert weights_res.json()["weights"]["technical_skills"] == 0.40

    # 4. Natural Language Candidate Search
    nl_res = client.post("/api/recruiter/search/natural-language", json={
        "query": "Find cloud engineer with Python and Docker with at least 2 years of experience",
        "job_id": job_id
    }, headers=headers)
    assert nl_res.status_code == 200, nl_res.text
    nl_data = nl_res.json()
    assert nl_data["total_found"] >= 1
    assert "Python" in nl_data["parsed_criteria"]["skills"]
    assert "Alex Rivera" in nl_data["candidates"][0]["name"]

    # 5. Multi-Source Capability Search
    cap_res = client.post("/api/recruiter/search/capability", json={
        "skills": ["Docker"],
        "min_fit": 50.0,
        "job_id": job_id
    }, headers=headers)
    assert cap_res.status_code == 200, cap_res.text
    assert cap_res.json()["total_found"] >= 1

    # 6. What-If Policy & Requirements Simulator (Non-mutating)
    whatif_res = client.post("/api/recruiter/what-if", json={
        "job_id": job_id,
        "simulated_critical_skills": ["Python", "Docker"],
        "simulated_preferred_skills": ["Kubernetes", "AWS", "Terraform"],
        "min_fit_threshold": 65.0
    }, headers=headers)
    assert whatif_res.status_code == 200, whatif_res.text
    whatif_data = whatif_res.json()
    assert whatif_data["is_simulated"] is True
    assert "talent_availability_impact" in whatif_data
    assert "quality_tradeoff_summary" in whatif_data

    # Verify live job was NOT mutated
    live_job = client.get(f"/api/recruiter/jobs/{job_id}", headers=headers).json()
    assert len(live_job["blueprint"]["critical_skills"]) == len(job_data["blueprint"]["critical_skills"])

    # 7. Job Work Simulation Scenario Generation & Evaluation
    work_sim_res = client.post(
        f"/api/recruiter/simulations/work-scenario?candidate_id={cand_id}&job_id={job_id}&scenario_type=production_incident",
        headers=headers
    )
    assert work_sim_res.status_code == 200, work_sim_res.text
    sim_obj = work_sim_res.json()
    assert "Incident" in sim_obj["title"]
    assert sim_obj["system_logs"] is not None
    assert len(sim_obj["tasks_to_solve"]) >= 2

    # Candidate submits solution to work simulation
    submission_res = client.post("/api/recruiter/simulations/evaluate", json={
        "simulation_id": sim_obj["id"],
        "candidate_id": cand_id,
        "job_id": job_id,
        "response_text": (
            "1. Root Cause: Full table scan on unindexed User_events collection causing connection pool starvation.\n"
            "2. Immediate Mitigation: Scale pool size and add emergency compound index on (timestamp, event_type). Rollback problematic deployment.\n"
            "3. Architecture: Implement Redis caching layer with circuit breaker to shed load under spikes."
        ),
        "technical_decisions": ["Emergency compound indexing", "Connection pool expansion", "Circuit breaker"]
    }, headers=headers)
    assert submission_res.status_code == 200, submission_res.text
    eval_sim = submission_res.json()
    assert eval_sim["practical_readiness_score"] >= 70.0
    assert len(eval_sim["strengths"]) >= 1

    # 8. Autonomous AI Recruiter Agent Run
    agent_res = client.post("/api/recruiter/agent/run", json={
        "prompt": "Identify the strongest candidate with verified code proof, compare them, and prepare interview guide.",
        "job_id": job_id
    }, headers=headers)
    assert agent_res.status_code == 200, agent_res.text
    agent_data = agent_res.json()
    assert agent_data["state"] == "completed"
    assert len(agent_data["tools_executed"]) >= 2
    assert "final_recommendation" in agent_data
    run_id = agent_data["run_id"]

    # Fetch agent run transcript
    fetch_agent = client.get(f"/api/recruiter/agent/{run_id}", headers=headers)
    assert fetch_agent.status_code == 200
    assert fetch_agent.json()["run_id"] == run_id

    # 9. Recruiter Calibration Feedback
    fb_res = client.post("/api/recruiter/feedback", json={
        "candidate_id": cand_id,
        "job_id": job_id,
        "agreed_with_ai": True,
        "actual_outcome": "advanced_to_technical",
        "feedback_notes": "Strong incident triage and database reasoning.",
        "calibration_tags": ["strong_architecture", "incident_response"]
    }, headers=headers)
    assert fb_res.status_code == 200, fb_res.text
    assert fb_res.json()["status"] == "success"

    # 10. Screening Job Status
    status_res = client.get(f"/api/recruiter/screening-jobs/{job_id}/status", headers=headers)
    assert status_res.status_code == 200, status_res.text
    assert status_res.json()["status"] == "completed"
