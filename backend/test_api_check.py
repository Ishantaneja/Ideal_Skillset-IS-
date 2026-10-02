import urllib.request
import urllib.error
import json

BASE = "http://127.0.0.1:8000"

def test_req(path, method="GET", body=None, token=None):
    url = f"{BASE}{path}"
    headers = {}
    data_bytes = None
    if body is not None:
        data_bytes = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            print(f"[OK {resp.status}] {method} {path}")
            return resp.status, resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8", errors="ignore")
        print(f"[HTTP {e.code}] {method} {path} => {err_msg[:200]}")
        return e.code, err_msg
    except Exception as e:
        print(f"[FAIL] {method} {path} => {type(e).__name__}: {e}")
        return None, str(e)

print("--- Testing Core & Public Endpoints ---")
test_req("/api/health")
test_req("/api/ats/test")
test_req("/api/resumes/test")
test_req("/api/jobs/test")
test_req("/api/readiness/test")
test_req("/api/evidence/test")
test_req("/api/roadmaps/test")
test_req("/api/assessment/test")
test_req("/api/interview/test")

print("\n--- Testing Recruiter Endpoints with Token ---")
# Let's check recruiter token login or creation
from app.core.security import create_access_token
recruiter_token = create_access_token({
    "sub": "recruiter_default_01",
    "email": "recruiter@techhire.com",
    "role": "recruiter",
    "company_id": "comp_default_01"
})

test_req("/api/recruiter/dashboard", "GET", token=recruiter_token)
test_req("/api/recruiter/jobs", "GET", token=recruiter_token)
test_req("/api/recruiter/analytics", "GET", token=recruiter_token)
test_req("/api/recruiter/settings", "GET", token=recruiter_token)
test_req("/api/recruiter/agent/run", "POST", {"prompt": "List available candidates"}, token=recruiter_token)

user_token = create_access_token({
    "sub": "test_user_01",
    "email": "user@test.com",
    "role": "user"
})

print("\n--- Testing User Endpoints with Token ---")
test_req("/api/resumes", "GET", token=user_token)
test_req("/api/jobs", "GET", token=user_token)
test_req("/api/ats/results", "GET", token=user_token)
test_req("/api/readiness/analyses", "GET", token=user_token)
