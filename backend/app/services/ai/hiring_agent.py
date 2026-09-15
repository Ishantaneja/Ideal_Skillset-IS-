import uuid
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.models.recruiter import (
    AgentRunRequest,
    AgentRunResponse,
    AgentToolCall,
    AgentWorkflowState
)

logger = logging.getLogger("uvicorn.error")


class HiringAgent:
    """
    Autonomous AI Recruiter Agent for Ideal SkillSet.
    Orchestrates authorized tools under strict company isolation, maintains workflow state,
    and returns transparent reasoning transcripts.
    """

    @classmethod
    async def execute_agent_run(
        cls,
        current_recruiter: Dict[str, Any],
        request: AgentRunRequest,
        recruiter_service_ref: Any
    ) -> AgentRunResponse:
        company_id = recruiter_service_ref.resolve_company_id(current_recruiter)
        recruiter_id = str(current_recruiter.get("id", ""))
        run_id = f"agent_run_{uuid.uuid4().hex[:12]}"
        prompt_lower = request.prompt.lower().strip()

        tools_executed: List[AgentToolCall] = []
        action_plan: List[str] = []
        data_payload: Dict[str, Any] = {}

        # 1. Planning Phase
        action_plan.append("1. Analyze prompt intent and resolve target company requisition context.")
        action_plan.append("2. Query company talent pool and evaluate candidate evidence confidence.")
        action_plan.append("3. Execute role-specific verification and assessment / interview synthesis.")
        action_plan.append("4. Synthesize explainable recruiter recommendations and action items.")

        # Determine target job
        target_job_id = request.job_id
        if not target_job_id:
            # Find the most active company job
            jobs = recruiter_service_ref.list_jobs(current_recruiter)
            if jobs:
                target_job_id = jobs[0].id
                tools_executed.append(AgentToolCall(
                    tool_name="search_jobs",
                    arguments={"company_id": company_id},
                    result_summary=f"Discovered {len(jobs)} active jobs. Focused on '{jobs[0].title}' (ID: {jobs[0].id})."
                ))

        # Tool 1: get_job_blueprint
        job_doc = None
        if target_job_id:
            try:
                job_resp = recruiter_service_ref.get_job(current_recruiter, target_job_id)
                job_doc = job_resp.model_dump() if hasattr(job_resp, "model_dump") else job_resp
                tools_executed.append(AgentToolCall(
                    tool_name="get_job_blueprint",
                    arguments={"job_id": target_job_id},
                    result_summary=f"Loaded blueprint with {len(job_doc.get('blueprint', {}).get('critical_skills', []))} critical skills."
                ))
            except Exception as e:
                logger.warning(f"Agent could not fetch job blueprint: {e}")

        # Tool 2: search_candidates / get_pipeline
        applicants = []
        if target_job_id:
            try:
                verified_only = any(term in prompt_lower for term in ["github", "verified", "code", "proof"])
                min_fit = 70.0 if "top" in prompt_lower or "strong" in prompt_lower else None

                applicants = recruiter_service_ref.list_job_applicants(
                    current_recruiter=current_recruiter,
                    job_id=target_job_id,
                    min_fit=min_fit,
                    verified_only=verified_only
                )
                tools_executed.append(AgentToolCall(
                    tool_name="search_candidates",
                    arguments={"job_id": target_job_id, "min_fit": min_fit, "verified_only": verified_only},
                    result_summary=f"Found {len(applicants)} matching candidates within company isolation boundary."
                ))
            except Exception as e:
                logger.warning(f"Agent candidate search error: {e}")

        # Tool 3: compare_candidates if user asks for comparison or top candidates
        top_candidates = applicants[:5]
        if len(top_candidates) >= 2 and any(term in prompt_lower for term in ["compare", "why", "above", "top", "rank"]):
            try:
                cand_ids = [c.candidate_id for c in top_candidates[:3]]
                comp_res = await recruiter_service_ref.compare_candidates(
                    current_recruiter=current_recruiter,
                    comparison_in={"job_id": target_job_id, "candidate_ids": cand_ids}
                )
                data_payload["comparison"] = comp_res.model_dump() if hasattr(comp_res, "model_dump") else comp_res
                tools_executed.append(AgentToolCall(
                    tool_name="compare_candidates",
                    arguments={"candidate_ids": cand_ids, "job_id": target_job_id},
                    result_summary=f"Compared {len(cand_ids)} top candidates. Strongest: {comp_res.get('strongest_candidate_id', cand_ids[0])}."
                ))
            except Exception as e:
                logger.warning(f"Agent comparison error: {e}")

        # Tool 4: generate_assessment if requested
        if any(term in prompt_lower for term in ["assessment", "test", "quiz", "challenge"]) and top_candidates:
            try:
                cand = top_candidates[0]
                asm = recruiter_service_ref.generate_assessment(current_recruiter, cand.candidate_id, target_job_id)
                data_payload["assessment"] = asm.model_dump() if hasattr(asm, "model_dump") else asm
                tools_executed.append(AgentToolCall(
                    tool_name="generate_assessment",
                    arguments={"candidate_id": cand.candidate_id, "job_id": target_job_id},
                    result_summary=f"Synthesized gap-adaptive assessment with {len(asm.questions)} challenge questions for {cand.name}."
                ))
            except Exception as e:
                logger.warning(f"Agent assessment error: {e}")

        # Tool 5: generate_interview if requested
        if any(term in prompt_lower for term in ["interview", "questions", "guide"]) and top_candidates:
            try:
                cand = top_candidates[0]
                interview_plan = recruiter_service_ref.generate_interview_plan(current_recruiter, cand.candidate_id, target_job_id)
                data_payload["interview_plan"] = interview_plan.model_dump() if hasattr(interview_plan, "model_dump") else interview_plan
                tools_executed.append(AgentToolCall(
                    tool_name="generate_interview",
                    arguments={"candidate_id": cand.candidate_id, "job_id": target_job_id},
                    result_summary=f"Prepared tailored technical & STAR behavioral interview guide for {cand.name}."
                ))
            except Exception as e:
                logger.warning(f"Agent interview error: {e}")

        # Synthesize final recommendation
        data_payload["top_candidates"] = [c.model_dump() if hasattr(c, "model_dump") else c for c in top_candidates]

        rec_lines = []
        rec_lines.append(f"AI Recruiter Agent completed analysis for request: '{request.prompt}'.")
        if top_candidates:
            rec_lines.append(f"\nTop Candidate Identified: **{top_candidates[0].name}** (Overall Fit: {round(top_candidates[0].overall_fit)}%, Technical: {round(top_candidates[0].technical_skills)}%).")
            rec_lines.append(f"Evidence Status: {('GitHub Codebase Verified' if top_candidates[0].has_github_verified else 'Resume & Certificate Supported')}.")
            rec_lines.append(f"Recommended Next Action: **{top_candidates[0].recommended_action}**.")
            if len(top_candidates) > 1:
                rec_lines.append(f"\nRunner-up: **{top_candidates[1].name}** (Overall Fit: {round(top_candidates[1].overall_fit)}%).")
        else:
            rec_lines.append("\nNo candidates met the specific threshold criteria in this requisition. Consider running a What-If simulation to explore relaxing non-critical requirements.")

        rec_lines.append("\nActions Taken:")
        for t in tools_executed:
            rec_lines.append(f"- **{t.tool_name}**: {t.result_summary}")

        final_rec = "\n".join(rec_lines)

        response = AgentRunResponse(
            run_id=run_id,
            company_id=company_id,
            recruiter_id=recruiter_id,
            request_prompt=request.prompt,
            state=AgentWorkflowState.COMPLETED,
            tools_executed=tools_executed,
            action_plan=action_plan,
            final_recommendation=final_rec,
            data_payload=data_payload,
            created_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc)
        )

        return response


hiring_agent = HiringAgent()

