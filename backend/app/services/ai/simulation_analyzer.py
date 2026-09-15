import uuid
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.models.recruiter import (
    WhatIfSimulationRequest,
    WhatIfSimulationResponse,
    JobWorkSimulation,
    WorkSimulationSubmission,
    WorkSimulationEvaluationResponse,
    SimulationScenarioType,
    JobBlueprint,
    BlueprintSkill,
    SkillImportance,
    EvaluationWeights
)

logger = logging.getLogger("uvicorn.error")


class SimulationAnalyzer:
    """
    Core AI engine for What-If Hiring Policy Simulations and Work Environment Simulations.
    """

    @classmethod
    def run_what_if_simulation(
        cls,
        job_doc: Dict[str, Any],
        applicants: List[Dict[str, Any]],
        request: WhatIfSimulationRequest
    ) -> WhatIfSimulationResponse:
        """
        Simulates relaxing or tightening job requirements without modifying the production requisition.
        """
        original_bp = job_doc.get("blueprint") or {}
        orig_crit = [s.get("name") for s in original_bp.get("critical_skills", [])]
        orig_pref = [s.get("name") for s in original_bp.get("preferred_skills", [])]
        orig_weights = job_doc.get("weights") or {
            "technical_skills": 0.35,
            "experience": 0.25,
            "practical_evidence": 0.15,
            "assessment": 0.10,
            "communication": 0.10,
            "education": 0.05
        }

        # Simulated criteria (fall back to original if not specified)
        sim_crit = request.simulated_critical_skills if request.simulated_critical_skills is not None else orig_crit
        sim_pref = request.simulated_preferred_skills if request.simulated_preferred_skills is not None else orig_pref
        sim_weights = request.simulated_weights.model_dump() if request.simulated_weights else orig_weights
        threshold = request.min_fit_threshold

        sim_crit_lower = {s.lower().strip() for s in sim_crit}
        orig_crit_lower = {s.lower().strip() for s in orig_crit}

        candidate_changes = []
        orig_shortlisted = 0
        sim_shortlisted = 0
        orig_fit_sum = 0.0
        sim_fit_sum = 0.0
        orig_cov_sum = 0.0
        sim_cov_sum = 0.0

        for app in applicants:
            cand_id = app.get("candidate_id")
            cand_name = app.get("name", "Candidate")
            cand_skills = {s.lower().strip() for s in (app.get("skills") or [])}
            orig_fit = float(app.get("overall_fit") or 70.0)
            orig_tech = float(app.get("technical_skills") or 70.0)
            orig_exp = float(app.get("relevant_experience") or 70.0)
            orig_ev = float(app.get("evidence_confidence") or 70.0)
            has_gh = app.get("has_github_verified", False)

            # 1. Original coverage & fit
            orig_matched = len(cand_skills.intersection(orig_crit_lower))
            orig_cov = (orig_matched / len(orig_crit_lower) * 100) if orig_crit_lower else 100.0
            orig_cov_sum += orig_cov
            orig_fit_sum += orig_fit
            if orig_fit >= threshold:
                orig_shortlisted += 1

            # 2. Simulated coverage & fit calculation
            sim_matched = len(cand_skills.intersection(sim_crit_lower))
            sim_cov = (sim_matched / len(sim_crit_lower) * 100) if sim_crit_lower else 100.0
            sim_cov_sum += sim_cov

            # Re-weight simulated tech score based on simulated critical coverage
            sim_tech = min(100.0, orig_tech * 0.4 + sim_cov * 0.6)

            sim_fit = (
                sim_tech * sim_weights.get("technical_skills", 0.35) +
                orig_exp * sim_weights.get("experience", 0.25) +
                (85.0 if has_gh else orig_ev) * sim_weights.get("practical_evidence", 0.15) +
                75.0 * sim_weights.get("assessment", 0.10) +
                80.0 * sim_weights.get("communication", 0.10) +
                75.0 * sim_weights.get("education", 0.05)
            )
            sim_fit = round(min(100.0, max(20.0, sim_fit)), 1)
            sim_fit_sum += sim_fit

            is_sim_shortlist = sim_fit >= threshold
            if is_sim_shortlist:
                sim_shortlisted += 1

            candidate_changes.append({
                "candidate_id": cand_id,
                "name": cand_name,
                "original_fit": orig_fit,
                "simulated_fit": sim_fit,
                "fit_delta": round(sim_fit - orig_fit, 1),
                "original_shortlisted": orig_fit >= threshold,
                "simulated_shortlisted": is_sim_shortlist,
                "status_change": "newly_shortlisted" if (is_sim_shortlist and orig_fit < threshold) else (
                    "dropped_from_shortlist" if (not is_sim_shortlist and orig_fit >= threshold) else "unchanged"
                )
            })

        total = len(applicants) or 1
        orig_avg_fit = round(orig_fit_sum / total, 1)
        sim_avg_fit = round(sim_fit_sum / total, 1)
        orig_avg_cov = round(orig_cov_sum / total, 1)
        sim_avg_cov = round(sim_cov_sum / total, 1)

        delta_shortlist = sim_shortlisted - orig_shortlisted

        if delta_shortlist > 0:
            impact = f"Expanding candidate pool by +{delta_shortlist} candidates (+{round(delta_shortlist / max(1, orig_shortlisted) * 100)}% increase in talent availability)."
            tradeoff = f"Tradeoff: Candidate pool expands from {orig_shortlisted} to {sim_shortlisted}. Average critical skill coverage shifts from {orig_avg_cov}% to {sim_avg_cov}%. Focus interview discussions on upskilling."
        elif delta_shortlist < 0:
            impact = f"Constraining candidate pool by {delta_shortlist} candidates (-{round(abs(delta_shortlist) / max(1, orig_shortlisted) * 100)}% decrease in talent availability)."
            tradeoff = f"Tradeoff: Higher selectivity with +{round(sim_avg_cov - orig_avg_cov, 1)}% higher critical skill coverage, but smaller initial interview pool."
        else:
            impact = "Neutral candidate pool volume with adjusted qualification weight balance."
            tradeoff = "Minor score recalibration without significant movement across the shortlist threshold."

        return WhatIfSimulationResponse(
            job_id=str(job_doc.get("_id") or job_doc.get("id")),
            job_title=job_doc.get("title", "Job Requisition"),
            original_pool_count=len(applicants),
            simulated_pool_count=len(applicants),
            original_shortlisted_count=orig_shortlisted,
            simulated_shortlisted_count=sim_shortlisted,
            additional_candidates_count=delta_shortlist,
            critical_skill_coverage_original=orig_avg_cov,
            critical_skill_coverage_simulated=sim_avg_cov,
            average_fit_original=orig_avg_fit,
            average_fit_simulated=sim_avg_fit,
            talent_availability_impact=impact,
            quality_tradeoff_summary=tradeoff,
            candidate_changes=candidate_changes[:20],
            is_simulated=True,
            created_at=datetime.now(timezone.utc)
        )

    @classmethod
    def generate_work_simulation(
        cls,
        job_doc: Dict[str, Any],
        candidate_doc: Dict[str, Any],
        scenario_type: SimulationScenarioType = SimulationScenarioType.PRODUCTION_INCIDENT
    ) -> JobWorkSimulation:
        """
        Generates a realistic job work environment challenge (API design, bug report, incident logs).
        """
        job_title = job_doc.get("title", "Software Engineer")
        skills = job_doc.get("required_skills", ["Python", "FastAPI", "MongoDB"])
        skills_str = ", ".join(skills[:3]) if skills else "Python, APIs, Databases"

        sim_id = f"sim_{uuid.uuid4().hex[:10]}"

        if scenario_type == SimulationScenarioType.PRODUCTION_INCIDENT:
            title = f"Production Incident Response: Latency Spike & DB Starvation in {skills_str} Service"
            context = (
                f"During peak traffic hours, the core {job_title} microservice experiences an alert storm. "
                "p99 latency has climbed from 120ms to 4,800ms, and downstream workers are throwing 504 Gateway Timeouts. "
                "The candidate must triage logs, identify the root cause, and propose immediate mitigations and architectural resilience."
            )
            logs = (
                "[2026-09-14T14:02:11.102Z] WARN pool.py: ConnectionPoolExhausted: Max connections (100) reached. Queue length: 412\n"
                "[2026-09-14T14:02:12.441Z] ERROR app.main: Timeout waiting for cursor from MongoDB collection 'User_events'\n"
                "[2026-09-14T14:02:14.892Z] CRITICAL uvicorn.error: Worker thread starvation, CPU utilization at 98.4%\n"
                "[2026-09-14T14:02:15.012Z] INFO nginx.access: GET /api/v1/analytics/realtime - 504 Gateway Time-out (4982ms)"
            )
            bug_report = (
                "Customer reports dashboard widgets failing to load. Error rate: 24.8%. "
                "Database query profiler shows full collection scan `COLLSCAN` on `User_events` sorting by `timestamp DESC` without an index."
            )
            db_behavior = "Write volume: 4,500 ops/sec. Read volume: 800 ops/sec. Memory cache hit ratio dropped from 94% to 32%."
            api_reqs = "SLA: < 200ms p95 latency. Zero data loss on uncommitted events. Graceful degradation under load."
            tasks = [
                "1. Root Cause Analysis: Identify the primary failure cascade from the provided logs and metrics.",
                "2. Immediate Mitigation: Outline tactical steps to restore service availability within 15 minutes.",
                "3. Architectural Prevention: Propose permanent schema indexing, caching, and connection pool configurations."
            ]

        elif scenario_type == SimulationScenarioType.API_DESIGN:
            title = f"Scalable Microservice API Architecture: High-Throughput Ingestion for {skills_str}"
            context = (
                f"You are tasked with designing a production-ready asynchronous API for {job_title} "
                "handling webhook deliveries from external enterprise partners with bursts of 20,000 requests/minute."
            )
            logs = "Design document required. No incident active."
            bug_report = None
            db_behavior = "Read/Write ratio: 1:10 heavy write ingestion. Queries require time-series aggregation."
            api_reqs = "Idempotency key enforcement, rate limiting (token bucket), signature verification, and dead-letter queues."
            tasks = [
                "1. API Spec: Define RESTful endpoints, request/response headers, and error codes.",
                "2. Concurrency & Queuing: Describe background queuing mechanism to buffer burst traffic.",
                "3. Reliability & Idempotency: Detail how duplicate webhook deliveries are safely handled."
            ]
        else:
            title = f"Codebase Debugging Challenge: Resolving Async Deadlocks in {skills_str}"
            context = f"A critical async concurrency bug causes intermittent deadlocks in {skills_str} workers under high load."
            logs = "[ERROR] asyncio.exceptions.TimeoutError: Task cancelled after deadlock detection."
            bug_report = "Worker processes hang indefinitely without releasing database transactions."
            db_behavior = "Uncommitted transaction locks holding rows in pending state."
            api_reqs = "Non-blocking async/await concurrency with structured timeouts."
            tasks = [
                "1. Trace where async locks are acquired without proper timeout handlers.",
                "2. Refactor the transaction lifecycle to ensure locks are always released in `finally` blocks.",
                "3. Add unit test assertions to verify deadlock prevention."
            ]

        return JobWorkSimulation(
            id=sim_id,
            job_id=str(job_doc.get("_id") or job_doc.get("id")),
            candidate_id=str(candidate_doc.get("_id") or candidate_doc.get("id")),
            title=title,
            scenario_type=scenario_type,
            difficulty="Senior",
            context_description=context,
            system_logs=logs,
            bug_report=bug_report,
            database_behavior=db_behavior,
            api_requirements=api_reqs,
            tasks_to_solve=tasks,
            evaluation_rubric={
                "technical_reasoning": 30,
                "debugging_accuracy": 25,
                "architectural_resilience": 20,
                "communication": 15,
                "decision_quality": 10
            },
            created_at=datetime.now(timezone.utc)
        )

    @classmethod
    def evaluate_work_simulation(
        cls,
        simulation: JobWorkSimulation,
        submission: WorkSimulationSubmission
    ) -> WorkSimulationEvaluationResponse:
        """
        Evaluates the candidate's simulation response text and technical decisions.
        """
        resp_text = submission.response_text.lower()
        decisions = submission.technical_decisions or []

        # Scoring heuristics based on technical keywords and structured reasoning
        tech_score = 75.0
        debug_score = 75.0
        arch_score = 75.0
        comm_score = 80.0
        decision_score = 80.0

        strengths = []
        weaknesses = []

        # Technical reasoning checks
        if any(w in resp_text for w in ["index", "indexing", "collscan", "compound index"]):
            tech_score += 8.0
            debug_score += 10.0
            strengths.append("Correctly identified database unindexed scan as the root latency bottleneck.")
        else:
            weaknesses.append("Did not explicitly prioritize database indexing to address table scan.")

        if any(w in resp_text for w in ["connection pool", "pool size", "max connections", "leak"]):
            debug_score += 8.0
            decision_score += 5.0
            strengths.append("Addressed connection pool starvation and queue overflow.")

        if any(w in resp_text for w in ["circuit breaker", "rate limit", "queue", "redis", "cache", "fallback"]):
            arch_score += 10.0
            strengths.append("Proposed resilient architectural safeguards (caching / rate-limiting / circuit breakers).")

        if any(w in resp_text for w in ["rollback", "triage", "scale", "horizontal", "mitigate", "immediate"]):
            decision_score += 8.0
            strengths.append("Demonstrated strong incident prioritization and rapid operational mitigation.")

        if len(submission.response_text) < 120:
            comm_score -= 15.0
            weaknesses.append("Response lacked sufficient depth and operational detail.")
        elif len(submission.response_text) > 400:
            comm_score += 8.0
            strengths.append("Clear, structured communication with actionable step-by-step breakdown.")

        tech_score = round(min(100.0, max(40.0, tech_score)), 1)
        debug_score = round(min(100.0, max(40.0, debug_score)), 1)
        arch_score = round(min(100.0, max(40.0, arch_score)), 1)
        comm_score = round(min(100.0, max(40.0, comm_score)), 1)
        decision_score = round(min(100.0, max(40.0, decision_score)), 1)

        practical_readiness = round(
            tech_score * 0.30 +
            debug_score * 0.25 +
            arch_score * 0.20 +
            comm_score * 0.15 +
            decision_score * 0.10,
            1
        )

        summary = (
            f"Candidate achieved a Practical Readiness score of {practical_readiness}% on the work simulation. "
            f"Demonstrated {('strong' if practical_readiness >= 80 else 'moderate')} hands-on technical reasoning and troubleshooting. "
            f"{strengths[0] if strengths else 'Covers core incident recovery principles.'}"
        )

        return WorkSimulationEvaluationResponse(
            simulation_id=submission.simulation_id,
            candidate_id=submission.candidate_id,
            job_id=submission.job_id,
            practical_readiness_score=practical_readiness,
            technical_reasoning_score=tech_score,
            debugging_score=debug_score,
            architecture_score=arch_score,
            communication_score=comm_score,
            decision_quality_score=decision_score,
            strengths=strengths,
            weaknesses=weaknesses,
            overall_summary=summary,
            created_at=datetime.now(timezone.utc)
        )


simulation_analyzer = SimulationAnalyzer()
