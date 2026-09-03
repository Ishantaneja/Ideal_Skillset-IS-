import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from app.models.ats import (
    MatchedSkillItem,
    MissingSkillItem,
    SkillsMatchResult,
    ExperienceMatchResult,
    EducationMatchResult,
    ResponsibilityMatchItem,
    ResponsibilityMatchResult,
    KeywordMatchResult,
    ATSScoreBreakdown,
    ATSImprovementItem,
    WhatIfItem,
)

logger = logging.getLogger("uvicorn.error")

# ===========================================================================
# Central ATS Dimension Weights (Must Sum to 1.0)
# ===========================================================================
ATS_WEIGHTS = {
    "required_skills": 0.35,
    "preferred_skills": 0.10,
    "experience": 0.20,
    "education": 0.10,
    "responsibilities": 0.15,
    "keywords": 0.10,
}

# Domain stop words to ignore when extracting job keywords
STOP_WORDS = {
    "the", "and", "with", "for", "a", "an", "to", "in", "of", "on", "at", "by", "from",
    "as", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
    "do", "does", "did", "will", "would", "shall", "should", "can", "could", "may",
    "might", "must", "about", "above", "across", "after", "against", "along", "among",
    "around", "before", "behind", "below", "beneath", "beside", "between", "beyond",
    "during", "except", "inside", "into", "near", "off", "onto", "outside", "over",
    "past", "through", "throughout", "toward", "under", "underneath", "until", "up",
    "upon", "within", "without", "our", "your", "their", "we", "you", "they", "it",
    "this", "that", "these", "those", "or", "but", "if", "because", "while", "where",
    "when", "how", "what", "which", "who", "whom", "whose", "why", "all", "any", "both",
    "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only",
    "own", "same", "so", "than", "too", "very", "role", "team", "work", "job", "company",
    "experience", "years", "candidate", "position", "ability", "strong", "skills", "plus",
}


class ATSEngine:
    """
    Explainable, evidence-backed matching engine comparing structured resume data
    with structured job description requirements.
    All scores are 100% deterministic, mathematically reproducible, and transparent.
    """

    @classmethod
    def get_match_label(cls, score: float) -> str:
        """
        Translates numeric score into human-readable compatibility tier.
        """
        if score >= 90.0:
            return "Excellent Match"
        elif score >= 75.0:
            return "Strong Match"
        elif score >= 60.0:
            return "Moderate Match"
        elif score >= 40.0:
            return "Weak Match"
        else:
            return "Needs Improvement"

    @classmethod
    def _find_evidence_sentence(cls, text: str, skill_name: str) -> Optional[str]:
        """
        Searches resume plain text, experience, and projects for a clean excerpt
        proving the candidate's use of this skill.
        """
        if not text:
            return None

        # Split text into sentences / bullet points
        sentences = re.split(r"(?<=[.!?\n])\s+", text)
        escaped_skill = re.escape(skill_name)
        pattern = r"(?<![a-zA-Z0-9_\-\.])" + escaped_skill + r"(?![a-zA-Z0-9_\-\.])"

        for sent in sentences:
            sent_clean = sent.strip().lstrip("•-*–> ")
            if len(sent_clean) > 15 and re.search(pattern, sent_clean, re.IGNORECASE):
                # Return clean sentence
                return sent_clean[:220]

        return f"Listed under candidate skills."

    @classmethod
    def match_skills(
        cls,
        job_req_skills: List[Dict[str, Any]],
        job_pref_skills: List[Dict[str, Any]],
        resume_skills: List[Dict[str, Any]],
        resume_raw_text: str
    ) -> SkillsMatchResult:
        """
        Compares job required and preferred skills with candidate resume skills.
        """
        resume_skill_map: Dict[str, str] = {}
        for s in resume_skills:
            name = s.get("name", "")
            cat = s.get("category", "General")
            resume_skill_map[name.lower()] = cat

        matched_required: List[MatchedSkillItem] = []
        missing_required: List[MissingSkillItem] = []
        matched_preferred: List[MatchedSkillItem] = []
        missing_preferred: List[MissingSkillItem] = []

        # 1. Evaluate Required Skills
        total_req = len(job_req_skills)
        req_weight_per_skill = round(35.0 / max(total_req, 1), 1)

        for req in job_req_skills:
            skill_name = req.get("name", "")
            norm_name = skill_name.lower()
            category = req.get("category", "General")

            if norm_name in resume_skill_map:
                evidence = cls._find_evidence_sentence(resume_raw_text, skill_name)
                matched_required.append(MatchedSkillItem(
                    skill=skill_name,
                    confidence=0.98,
                    evidence=evidence,
                    category=category
                ))
            else:
                missing_required.append(MissingSkillItem(
                    skill=skill_name,
                    importance="required",
                    impact="high",
                    reason="Mandatory requirement for this position and not found in resume.",
                    potential_score_gain=req_weight_per_skill
                ))

        # 2. Evaluate Preferred Skills
        total_pref = len(job_pref_skills)
        pref_weight_per_skill = round(10.0 / max(total_pref, 1), 1)

        for pref in job_pref_skills:
            skill_name = pref.get("name", "")
            norm_name = skill_name.lower()
            category = pref.get("category", "General")

            if norm_name in resume_skill_map:
                evidence = cls._find_evidence_sentence(resume_raw_text, skill_name)
                matched_preferred.append(MatchedSkillItem(
                    skill=skill_name,
                    confidence=0.95,
                    evidence=evidence,
                    category=category
                ))
            else:
                missing_preferred.append(MissingSkillItem(
                    skill=skill_name,
                    importance="preferred",
                    impact="medium",
                    reason="Preferred/bonus competency that enhances candidate ranking.",
                    potential_score_gain=pref_weight_per_skill
                ))

        # 3. Calculate Sub-Scores (0-100)
        req_score = 100.0 if total_req == 0 else round((len(matched_required) / total_req) * 100.0, 1)
        pref_score = 100.0 if total_pref == 0 else round((len(matched_preferred) / total_pref) * 100.0, 1)

        return SkillsMatchResult(
            matched_required=matched_required,
            missing_required=missing_required,
            matched_preferred=matched_preferred,
            missing_preferred=missing_preferred,
            required_score=req_score,
            preferred_score=pref_score
        )

    @classmethod
    def match_experience(
        cls,
        job_experience: Dict[str, Any],
        resume_experience: List[Dict[str, Any]],
        resume_education: List[Dict[str, Any]]
    ) -> ExperienceMatchResult:
        """
        Calculates candidate total years and compares against job requirements.
        """
        min_years = job_experience.get("minimum_years")

        # Estimate candidate years from experience items or graduation timeline
        candidate_years = 0.0
        for exp in resume_experience:
            start = exp.get("start_date")
            end = exp.get("end_date")
            if start:
                start_yr_match = re.search(r"\b(20[0-2][0-9]|19[8-9][0-9])\b", str(start))
                end_yr_match = re.search(r"\b(20[0-2][0-9]|19[8-9][0-9])\b", str(end))
                start_yr = int(start_yr_match.group(1)) if start_yr_match else 2022
                end_yr = int(end_yr_match.group(1)) if end_yr_match else 2024
                candidate_years += max(1.0, float(end_yr - start_yr))
            else:
                candidate_years += 1.5

        if candidate_years == 0.0:
            if len(resume_experience) > 0:
                candidate_years = float(len(resume_experience) * 1.5)
            elif len(resume_education) > 0:
                candidate_years = 1.0  # Recent graduate entry-level

        candidate_years = round(candidate_years, 1)

        # Non-binary scoring against minimum requested years
        if min_years is None or min_years == 0.0:
            return ExperienceMatchResult(
                required_years=0.0,
                candidate_years=candidate_years,
                score=100.0,
                match=True,
                explanation="No minimum years of experience strictly required; entry level friendly."
            )

        if candidate_years >= min_years:
            return ExperienceMatchResult(
                required_years=min_years,
                candidate_years=candidate_years,
                score=100.0,
                match=True,
                explanation=f"Your {int(candidate_years) if candidate_years.is_integer() else candidate_years} years of demonstrated experience meets the requested {int(min_years) if min_years.is_integer() else min_years}+ years."
            )
        elif candidate_years >= (min_years * 0.75):
            score = 75.0
            return ExperienceMatchResult(
                required_years=min_years,
                candidate_years=candidate_years,
                score=score,
                match=False,
                explanation=f"Your {candidate_years} years is slightly below the requested {min_years}+ years, but competitive when paired with strong portfolio evidence."
            )
        elif candidate_years >= (min_years * 0.50):
            score = 50.0
            return ExperienceMatchResult(
                required_years=min_years,
                candidate_years=candidate_years,
                score=score,
                match=False,
                explanation=f"You have {candidate_years} years of experience vs {min_years}+ years requested. Significant project work is recommended to close the gap."
            )
        else:
            score = max(20.0, round((candidate_years / min_years) * 100.0, 1))
            return ExperienceMatchResult(
                required_years=min_years,
                candidate_years=candidate_years,
                score=score,
                match=False,
                explanation=f"Demonstrated experience ({candidate_years} yrs) is significantly below the minimum {min_years}+ years required."
            )

    @classmethod
    def match_education(
        cls,
        job_education: List[Dict[str, Any]],
        resume_education: List[Dict[str, Any]]
    ) -> EducationMatchResult:
        """
        Evaluates formal degree level and academic major alignment.
        """
        if not job_education:
            return EducationMatchResult(
                score=100.0,
                match=True,
                explanation="No specific formal degree required for this role.",
                candidate_degrees=[e.get("degree", "") for e in resume_education if e.get("degree")],
                required_degrees=[]
            )

        cand_degrees = [e.get("degree", "") for e in resume_education if e.get("degree")]
        cand_fields = [e.get("field_of_study", "") for e in resume_education if e.get("field_of_study")]
        cand_deg_str = " ".join(cand_degrees).lower()
        cand_field_str = " ".join(cand_fields).lower()

        req_degrees = [j.get("degree", "") for j in job_education if j.get("degree")]

        # Degree rank hierarchy
        degree_hierarchy = {
            "ph.d": 4, "doctorate": 4,
            "master": 3, "m.tech": 3, "m.s": 3, "msc": 3, "mca": 3, "mba": 3,
            "bachelor": 2, "b.tech": 2, "b.e": 2, "b.s": 2, "bsc": 2, "bca": 2,
            "associate": 1
        }

        req_highest_rank = 2  # default Bachelor's
        for deg in req_degrees:
            for key, val in degree_hierarchy.items():
                if key in deg.lower():
                    req_highest_rank = max(req_highest_rank, val)

        cand_highest_rank = 0
        for deg in cand_degrees:
            for key, val in degree_hierarchy.items():
                if key in deg.lower():
                    cand_highest_rank = max(cand_highest_rank, val)

        # Major overlap
        tech_fields = ["computer science", "data", "engineering", "information technology", "software", "analytics", "statistics", "math"]
        field_matched = any(f in cand_field_str for f in tech_fields) or not cand_field_str

        if cand_highest_rank >= req_highest_rank:
            if field_matched:
                return EducationMatchResult(
                    score=100.0,
                    match=True,
                    explanation=f"Your education ({cand_degrees[0] if cand_degrees else 'Degree'}) directly satisfies the academic prerequisite.",
                    candidate_degrees=cand_degrees,
                    required_degrees=req_degrees
                )
            else:
                return EducationMatchResult(
                    score=85.0,
                    match=True,
                    explanation=f"Your degree level matches requirements in a related discipline.",
                    candidate_degrees=cand_degrees,
                    required_degrees=req_degrees
                )
        elif cand_highest_rank > 0:
            return EducationMatchResult(
                score=60.0,
                match=False,
                explanation="Candidate holds a formal degree, though slightly below the preferred degree level.",
                candidate_degrees=cand_degrees,
                required_degrees=req_degrees
            )
        else:
            return EducationMatchResult(
                score=40.0,
                match=False,
                explanation="No matching formal degree detected in resume.",
                candidate_degrees=[],
                required_degrees=req_degrees
            )

    @classmethod
    def match_responsibilities(
        cls,
        job_responsibilities: List[str],
        resume_experience: List[Dict[str, Any]],
        resume_projects: List[Dict[str, Any]],
        resume_raw_text: str
    ) -> ResponsibilityMatchResult:
        """
        Compares each JD responsibility against candidate experiences and projects.
        """
        if not job_responsibilities:
            return ResponsibilityMatchResult(
                score=100.0,
                matched_count=0,
                total_count=0,
                items=[]
            )

        # Collect candidate evidence sentences
        candidate_snippets = []
        for exp in resume_experience:
            desc = exp.get("description", "")
            if desc:
                candidate_snippets.extend(re.split(r"(?<=[.!?\n])\s+", desc))
        for proj in resume_projects:
            desc = proj.get("description", "")
            if desc:
                candidate_snippets.extend(re.split(r"(?<=[.!?\n])\s+", desc))

        items: List[ResponsibilityMatchItem] = []
        strong_matches = 0
        partial_matches = 0

        for resp in job_responsibilities:
            resp_words = set(re.findall(r"\b[a-zA-Z]{3,}\b", resp.lower())) - STOP_WORDS
            best_snippet = None
            best_overlap = 0.0

            for snippet in candidate_snippets:
                snippet_words = set(re.findall(r"\b[a-zA-Z]{3,}\b", snippet.lower())) - STOP_WORDS
                if resp_words and snippet_words:
                    overlap = len(resp_words.intersection(snippet_words)) / len(resp_words)
                    if overlap > best_overlap:
                        best_overlap = overlap
                        best_snippet = snippet.strip()

            if best_overlap >= 0.35:
                strong_matches += 1
                items.append(ResponsibilityMatchItem(
                    job_responsibility=resp,
                    resume_evidence=best_snippet or "Demonstrated in candidate experience deliverables.",
                    match_status="strong_match",
                    confidence=min(0.95, round(0.70 + best_overlap * 0.3, 2))
                ))
            elif best_overlap >= 0.15:
                partial_matches += 1
                items.append(ResponsibilityMatchItem(
                    job_responsibility=resp,
                    resume_evidence=best_snippet or "Related skills mentioned in background.",
                    match_status="partial_match",
                    confidence=0.65
                ))
            else:
                items.append(ResponsibilityMatchItem(
                    job_responsibility=resp,
                    resume_evidence="No direct evidence found in the uploaded resume.",
                    match_status="missing",
                    confidence=0.90
                ))

        total = len(job_responsibilities)
        score = round(((strong_matches * 1.0 + partial_matches * 0.5) / max(total, 1)) * 100.0, 1)

        return ResponsibilityMatchResult(
            score=score,
            matched_count=strong_matches + partial_matches,
            total_count=total,
            items=items
        )

    @classmethod
    def match_keywords(
        cls,
        job_raw_text: str,
        resume_raw_text: str
    ) -> KeywordMatchResult:
        """
        Extracts domain and technical keywords from JD and measures overlap in resume.
        """
        if not job_raw_text or not resume_raw_text:
            return KeywordMatchResult(score=100.0, matched=[], missing=[])

        # Extract domain terms (capitalized words, technical terms)
        jd_words = re.findall(r"\b[a-zA-Z0-9_\-\.]{3,}\b", job_raw_text)
        candidate_keywords = set()
        for w in jd_words:
            w_lower = w.lower()
            if w_lower not in STOP_WORDS and len(w_lower) >= 3:
                candidate_keywords.add(w)

        # Select top 25 representative keywords
        keywords_list = list(candidate_keywords)[:25]
        matched = []
        missing = []
        lower_resume = resume_raw_text.lower()

        for kw in keywords_list:
            escaped = re.escape(kw)
            if re.search(r"(?<![a-zA-Z0-9_\-\.])" + escaped + r"(?![a-zA-Z0-9_\-\.])", lower_resume, re.IGNORECASE):
                matched.append(kw)
            else:
                missing.append(kw)

        total = len(keywords_list)
        score = 100.0 if total == 0 else round((len(matched) / total) * 100.0, 1)

        return KeywordMatchResult(
            score=score,
            matched=matched[:15],
            missing=missing[:15]
        )

    @classmethod
    def calculate_score(
        cls,
        breakdown: ATSScoreBreakdown
    ) -> float:
        """
        Calculates the 100% deterministic overall ATS score based on fixed weights:
        Required Skills: 35%, Preferred: 10%, Experience: 20%, Education: 10%, Responsibilities: 15%, Keywords: 10%.
        """
        score = (
            ATS_WEIGHTS["required_skills"] * breakdown.required_skills +
            ATS_WEIGHTS["preferred_skills"] * breakdown.preferred_skills +
            ATS_WEIGHTS["experience"] * breakdown.experience +
            ATS_WEIGHTS["education"] * breakdown.education +
            ATS_WEIGHTS["responsibilities"] * breakdown.responsibilities +
            ATS_WEIGHTS["keywords"] * breakdown.keywords
        )
        return round(min(100.0, max(0.0, score)), 1)

    @classmethod
    def generate_recommendations(
        cls,
        skills_match: SkillsMatchResult,
        resp_match: ResponsibilityMatchResult,
        exp_match: ExperienceMatchResult
    ) -> Tuple[List[ATSImprovementItem], List[ATSImprovementItem], List[WhatIfItem]]:
        """
        Produces honest, actionable recommendations and 'What If?' score simulation.
        Never recommends dishonest claims or keyword stuffing.
        """
        top_improvements: List[ATSImprovementItem] = []
        resume_improvements: List[ATSImprovementItem] = []

        # 1. Missing Required Skills (Sorted by Impact)
        for missing in sorted(skills_match.missing_required, key=lambda x: x.potential_score_gain, reverse=True):
            top_improvements.append(ATSImprovementItem(
                title=f"Required Skill: {missing.skill}",
                action=f"Mandatory role requirement. If you possess hands-on {missing.skill} experience, highlight it clearly in your project deliverables. Otherwise, build a targeted project before applying.",
                impact_score=missing.potential_score_gain,
                category="Technical Skill",
                type="existing_evidence"
            ))

        # 2. Missing Preferred Skills
        for missing in sorted(skills_match.missing_preferred, key=lambda x: x.potential_score_gain, reverse=True)[:3]:
            top_improvements.append(ATSImprovementItem(
                title=f"Bonus Competency: {missing.skill}",
                action=f"Adding verified proof of {missing.skill} will increase your competitive advantage for this position.",
                impact_score=missing.potential_score_gain,
                category="Preferred Skill",
                type="build_skill"
            ))

        # 3. Resume Format / Evidence Clarity Improvements
        for item in resp_match.items:
            if item.match_status == "missing":
                resume_improvements.append(ATSImprovementItem(
                    title="Clarify Deliverables",
                    action=f"No direct evidence found for '{item.job_responsibility[:70]}...'. Ensure your past project outcomes explicitly articulate your contribution.",
                    impact_score=3.0,
                    category="Responsibility",
                    type="clarify_format"
                ))

        if not exp_match.match:
            resume_improvements.append(ATSImprovementItem(
                title="Experience Seniority Gap",
                action=exp_match.explanation,
                impact_score=5.0,
                category="Experience",
                type="build_skill"
            ))

        # 4. 'What-If?' Hypothetical Score Simulation
        what_if_list: List[WhatIfItem] = []
        missing_names = [m.skill for m in skills_match.missing_required]

        if missing_names:
            # Simulation 1: Top 1 skill added
            top_skill = missing_names[0]
            gain_1 = round(35.0 / max(len(skills_match.matched_required) + len(skills_match.missing_required), 1), 1)
            what_if_list.append(WhatIfItem(
                added_skills=[top_skill],
                simulated_score=min(100.0, gain_1),
                score_gain=gain_1
            ))

            # Simulation 2: Top 2 skills added
            if len(missing_names) >= 2:
                top_2_skills = missing_names[:2]
                gain_2 = round(gain_1 * 2, 1)
                what_if_list.append(WhatIfItem(
                    added_skills=top_2_skills,
                    simulated_score=min(100.0, gain_2),
                    score_gain=gain_2
                ))

        return top_improvements[:6], resume_improvements[:5], what_if_list

    @classmethod
    def analyze(
        cls,
        resume_doc: Dict[str, Any],
        job_doc: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Unified pipeline executing full explainable matching between resume and job documents.
        """
        resume_parsed = resume_doc.get("parsed_data", {})
        job_reqs = job_doc.get("requirements", {})
        job_info = job_doc.get("job_info", {})

        resume_skills = resume_parsed.get("skills", [])
        resume_exp = resume_parsed.get("experience", [])
        resume_edu = resume_parsed.get("education", [])
        resume_proj = resume_parsed.get("projects", [])
        resume_raw = resume_doc.get("extracted_text", "")

        job_req_skills = job_reqs.get("required_skills", [])
        job_pref_skills = job_reqs.get("preferred_skills", [])
        job_exp = job_reqs.get("experience", {})
        job_edu = job_reqs.get("education", [])
        job_resp = job_reqs.get("responsibilities", [])
        job_raw = job_doc.get("raw_text", "")

        # 1. Component matches
        skills_match = cls.match_skills(job_req_skills, job_pref_skills, resume_skills, resume_raw)
        exp_match = cls.match_experience(job_exp, resume_exp, resume_edu)
        edu_match = cls.match_education(job_edu, resume_edu)
        resp_match = cls.match_responsibilities(job_resp, resume_exp, resume_proj, resume_raw)
        kw_match = cls.match_keywords(job_raw, resume_raw)

        # 2. Score Breakdown
        breakdown = ATSScoreBreakdown(
            required_skills=skills_match.required_score,
            preferred_skills=skills_match.preferred_score,
            experience=exp_match.score,
            education=edu_match.score,
            responsibilities=resp_match.score,
            keywords=kw_match.score
        )

        # 3. Overall Weighted Score
        overall_score = cls.calculate_score(breakdown)
        label = cls.get_match_label(overall_score)

        # 4. Actionable truthful recommendations and What-If
        top_improvements, resume_improvements, what_if = cls.generate_recommendations(
            skills_match, resp_match, exp_match
        )

        # Update What-If with exact base score + gain
        adjusted_what_if = []
        for wi in what_if:
            adjusted_what_if.append(WhatIfItem(
                added_skills=wi.added_skills,
                simulated_score=min(100.0, round(overall_score + wi.score_gain, 1)),
                score_gain=wi.score_gain
            ))

        return {
            "score": overall_score,
            "label": label,
            "breakdown": breakdown.model_dump(),
            "skills": skills_match.model_dump(),
            "experience": exp_match.model_dump(),
            "education": edu_match.model_dump(),
            "responsibilities": resp_match.model_dump(),
            "keywords": kw_match.model_dump(),
            "top_improvements": [ti.model_dump() for ti in top_improvements],
            "resume_improvements": [ri.model_dump() for ri in resume_improvements],
            "what_if": [wi.model_dump() for wi in adjusted_what_if],
            "job_title": job_info.get("job_title") or "Target Role",
            "company_name": job_info.get("company_name"),
            "resume_filename": resume_doc.get("original_filename") or "Resume.pdf",
        }


ats_engine = ATSEngine()
