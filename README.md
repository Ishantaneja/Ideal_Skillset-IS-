# Ideal SkillSet — AI-Powered Career Readiness Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018%20+%20Vite-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248.svg?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **"Don't just measure whether your resume matches a job description. Prove whether you are actually ready to perform that job."**

---

## 📌 Executive Summary

**Ideal SkillSet** is an end-to-end AI career readiness platform that bridges the critical divide between **resume keyword matching (ATS)** and **verifiable real-world job competency (Readiness Twin)**.

Traditional ATS engines only evaluate text overlap between resumes and job requisitions. Ideal SkillSet takes candidate preparation further by diagnosing skill gaps, generating adaptive multi-week roadmaps with real-world projects, simulating scenario assessments, and computing a **5-Dimensional AI Readiness Twin Quotient**.

---

## 🏗️ System Architecture & Candidate Journey

```
 CANDIDATE RESUME               TARGET JOB REQUISITION
   (PDF / DOCX)                   (Text / PDF / DOCX)
        \                                  /
         \                                /
          ↓                              ↓
 ┌─────────────────┐            ┌─────────────────┐
 │  Resume Parser  │            │   JD Analyzer   │
 └────────┬────────┘            └────────┬────────┘
          │                              │
          └───────────────┬──────────────┘
                          ↓
        ┌───────────────────────────────────┐
        │       Explainable ATS Engine      │
        │   (6-Dimension Scoring Formula)   │
        └─────────────────┬─────────────────┘
                          ↓
        ┌───────────────────────────────────┐
        │    Intelligent Skill Gap Engine   │
        │ (Level Estimation & Priority Rank)│
        └─────────────────┬─────────────────┘
                          ↓
        ┌───────────────────────────────────┐
        │   Personalized Career Roadmap     │
        │ (1-12 Weeks: Practice + Projects) │
        └─────────────────┬─────────────────┘
                          ↓
   ┌──────────────────────┼──────────────────────┐
   ↓                      ↓                      ↓
Practical Coding     AI Technical Mock    Verifiable Proof
  Simulations            Interview          (GitHub Links)
   \                      |                      /
    \                     |                     /
     └────────────────────┼────────────────────┘
                          ↓
        ┌───────────────────────────────────┐
        │      5D AI READINESS TWIN         │
        │  Knowledge • Practical • Evidence │
        │   Communication • Roadmap Progress│
        └─────────────────┬─────────────────┘
                          ↓
        ┌───────────────────────────────────┐
        │     "SHOULD I APPLY NOW?"         │
        │    Candid Application Verdict     │
        └───────────────────────────────────┘
```

---

## 🚀 Core Features & Modules

### 1. 🔐 Authentication & Role-Based Access Control
- JWT Bearer token authentication with bcrypt password hashing.
- Dual-role authorization: **Candidate (`user`)** and **Administrator (`admin`)**.
- Protected API routes and route-guard middleware on the React client.

### 2. 📄 Multi-Format Resume Extraction & Skill Taxonomy
- Supports `.pdf`, `.docx`, and `.txt` file uploads.
- Precision taxonomy categorizing technical competencies, programming languages, databases, cloud platforms, and methodologies.
- Structured extraction of work experience, education history, and portfolio project records.

### 3. 💼 Job Description Requisition Analyzer
- Ingests pasted job text or uploaded job description files.
- Identifies mandatory vs. preferred technical skills, seniority level, education requirements, and core responsibilities.

### 4. 🎯 Explainable ATS & Resume-to-Job Matcher
- **Deterministic 6-Dimension ATS Formula**:
  $$\text{ATS Score} = 35\% \text{ (Req Skills)} + 10\% \text{ (Pref Skills)} + 20\% \text{ (Experience)} + 10\% \text{ (Education)} + 15\% \text{ (Responsibilities)} + 10\% \text{ (Keywords)}$$
- Verifiable resume evidence excerpts with line-by-line justification.
- Interactive **"What-If" ATS Score Simulator**.

### 5. 🔍 Intelligent Skill Gap Analysis
- Conservative level estimation ($0 = \text{None}$ to $5 = \text{Expert}$) based on candidate evidence.
- Deterministic priority formula ranking gaps based on urgency, ATS impact, and job mention frequency:
  $$\text{Priority Score} = \min\left(10.0, \text{round}\left(w_{\text{imp}} + \left(\frac{\text{gap}}{4.0}\right) \cdot 3.0 + \left(\frac{\text{ATS Impact}}{12.0}\right) \cdot 2.5 + f_{\text{job}} \cdot 1.5, 1\right)\right)$$
- Curated practice topics and dependency-aware learning sequence (e.g. Python before ML, SQL before Power BI).

### 6. 🗺️ Personalized Multi-Week Career Roadmap
- Adaptive scheduling supporting **1, 2, 4, 6, 8, or 12 weeks** ($\sim 15\text{--}20\text{ hours/week}$).
- Multi-type tasks: `learning`, `practice`, `project`, `evidence`, `assessment`, `interview`, `resume`.
- Role-specific portfolio projects with dataset inputs, expected deliverables, and evidence to produce.
- Interactive task completion checkboxes with live progress recalculation (`PATCH /api/roadmaps/{id}/tasks/{taskId}`).
- Final-week readiness review with resume updates and mock interview practice.

### 7. 💻 Practical Job Simulations Sandbox
- Role-specific coding and scenario challenges (SQL window functions, FastAPI REST APIs, Docker Compose, ML inference pipelines).
- Real-time practical score evaluation.

### 8. 🎙️ AI Mock Interview Simulator
- Role-tailored behavioral and technical interview questions.
- Structured **STAR Method** hints and real-time communication delivery telemetry.

### 9. 🛡️ 5-Dimensional AI Readiness Twin Competency Model
- Evaluates candidate preparedness across 5 distinct dimensions:
  1. **Knowledge & Concept Mastery ($25\%$)**
  2. **Practical Execution Ability ($30\%$)**
  3. **Verifiable Proof of Evidence ($25\%$)** *(GitHub code repositories, deployed dashboards)*
  4. **Communication & Professional Delivery ($10\%$)**
  5. **Roadmap Progression Execution ($10\%$)**
- **ATS vs. Readiness Contrast**: Unmasks the "Keyword Match Illusion" (when a resume matches textually but lacks hands-on proof).
- **Application Decision Matrix**: `READY TO APPLY`, `COMPETITIVE`, `PREPARE BEFORE APPLYING`, `DO NOT APPLY YET`.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend API** | FastAPI (Python 3.11+), Pydantic v2, PyMongo, Uvicorn, Python-Docx, PyPDF |
| **Frontend UI** | React 18, Vite, Tailwind CSS, Lucide React, Axios, React Router v6 |
| **Database** | MongoDB (`ideal_skillsetdb`), PyMongo connection manager with automatic compound indexing |
| **AI Layer** | Ollama service abstraction with 100% deterministic fallback (app works completely offline) |
| **Security** | JWT (HS256), Passlib (Bcrypt), Strict User Ownership Enforcement, CORS Middleware |

---

## 📂 Project Structure

```
Ideal Skillset/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI REST Routers (auth, users, resume, jobs, ats, skills, roadmap, readiness, admin)
│   │   ├── core/            # Security, JWT tokens, Settings & Dependencies
│   │   ├── database/        # MongoDB connection manager & index initialization
│   │   ├── models/          # Pydantic Schemas & MongoDB Document Models
│   │   ├── services/        # Business Logic & AI Engines (ATS, Gap, Roadmap, Readiness)
│   │   └── main.py          # FastAPI application entrypoint & middleware
│   ├── uploads/             # Isolated local file storage for uploaded resumes
│   ├── requirements.txt     # Python backend dependencies
│   ├── run.py               # Uvicorn startup script
│   └── .env.example         # Backend environment template
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components (ScoreCard, ReadinessCard, ProgressBar, Sidebar, etc.)
│   │   ├── context/         # AuthContext & NotificationContext
│   │   ├── layouts/         # UserLayout & AdminLayout
│   │   ├── pages/           # React views (UserDashboard, ResumeAnalysis, ATSAnalyzer, Roadmap, ReadinessTwin...)
│   │   ├── services/        # Axios API client modules
│   │   └── routes/          # Protected & Public routing
│   ├── package.json         # Node dependencies
│   └── .env.example         # Frontend environment template
├── .gitignore               # Comprehensive Git ignore rules
└── README.md                # Project documentation
```

---

## ⚙️ Installation & Setup Guide

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & `npm`
- **MongoDB** (Local instance on `localhost:27017` or MongoDB Atlas URI)

---

### 2. Backend Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create and activate a virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Configure environment variables
copy .env.example .env    # On Windows
cp .env.example .env      # On macOS/Linux

# 5. Start the FastAPI development server
python run.py
```

- **Backend API URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

---

### 3. Frontend Setup

```bash
# 1. Open a new terminal and navigate to frontend directory
cd frontend

# 2. Install npm dependencies
npm install

# 3. Configure environment variables
copy .env.example .env    # On Windows
cp .env.example .env      # On macOS/Linux

# 4. Start the Vite development server
npm run dev
```

- **Candidate Web Application**: `http://localhost:5173`

---

## 🔑 Default Credentials

### 1. System Administrator
- **Email**: `admin@idealskillset.com`
- **Password**: `Admin1234!`
- **Role**: `admin`
- **Portal**: `/admin/login`

### 2. Candidate User
- Create a new candidate account via the **Sign Up** page (`/signup`) or register via the API.

---

## 🧪 Testing & Verification

Run the comprehensive integration test suite to verify all modules:

```bash
cd backend
.\venv\Scripts\python -c "
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
res = client.get('/api/health')
print('Health Check Status:', res.json())
"
```

To run a production frontend build check:

```bash
cd frontend
npm run build
```

---

## 🔒 Security & Best Practices

- **Never commit `.env` files** containing sensitive JWT secrets or database connection strings to public repositories.
- Candidate files uploaded to `backend/uploads/` are strictly ignored by `.gitignore`.
- All user-specific database queries enforce ownership checks (`user_id == current_user["id"]`).

---

## 📄 License

This project is licensed under the **MIT License**.