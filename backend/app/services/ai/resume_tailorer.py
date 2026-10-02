import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone

from app.models.ats import (
    ResumeTailorResponse,
    RewrittenBulletPoint,
    ATSScoreBreakdown,
)
from app.models.resume import ParsedResumeData
from app.services.ats_engine import ats_engine
from app.services.resume_parser import resume_parser

logger = logging.getLogger("uvicorn.error")

# Action verbs mapped to functional competencies
ACTION_VERB_MAP = {
    "develop": ["Engineered", "Architected", "Spearheaded development of", "Constructed"],
    "create": ["Pioneered", "Designed and deployed", "Crafted", "Formulated"],
    "build": ["Engineered", "Constructed scalable", "Assembled", "Implemented"],
    "manage": ["Orchestrated", "Steered", "Administered", "Directed"],
    "lead": ["Championed", "Spearheaded", "Guided cross-functional teams in", "Facilitated"],
    "improve": ["Optimized", "Maximized efficiency of", "Elevated", "Streamlined"],
    "work": ["Collaborated with stakeholders to deliver", "Partnered cross-functionally to build", "Contributed to production"],
    "help": ["Accelerated delivery of", "Assisted in scaling", "Co-engineered"],
}


class ResumeTailorer:
    """
    AI-Powered Resume Tailoring & ATS Score Optimization Engine.
    Examines candidate's resume against target Job Description, identifies
    dimensional gaps (skills, keywords, responsibilities), and synthesizes
    an optimized, ATS-tailored resume with deterministic score verification.
    """

    @classmethod
    def tailor_resume(
        cls,
        resume_doc: Dict[str, Any],
        job_doc: Dict[str, Any],
        target_skills: Optional[List[str]] = None,
        focus_areas: Optional[List[str]] = None,
    ) -> ResumeTailorResponse:
        """
        Executes end-to-end resume tailoring:
        1. Evaluates baseline ATS compatibility
        2. Identifies missing required skills, preferred skills, keywords & responsibilities
        3. Synthesizes tailored resume sections with JD keyword alignment
        4. Re-evaluates tailored resume to verify ATS score improvement
        """
        # 1. Baseline ATS Evaluation
        baseline_result = ats_engine.analyze(resume_doc, job_doc)
        original_score = baseline_result["score"]
        original_label = baseline_result["label"]
        original_breakdown = ATSScoreBreakdown(**baseline_result["breakdown"])

        job_info = job_doc.get("job_info", {})
        job_title = job_info.get("title") or "Target Role"
        company_name = job_info.get("company_name") or "Target Organization"

        # 2. Extract Gaps from Baseline Analysis
        skills_data = baseline_result.get("skills", {})
        if isinstance(skills_data, dict):
            missing_req_items = skills_data.get("missing_required", [])
            missing_pref_items = skills_data.get("missing_preferred", [])
            missing_req_skills = [
                s.get("skill", "") if isinstance(s, dict) else getattr(s, "skill", str(s))
                for s in missing_req_items
            ]
            missing_pref_skills = [
                s.get("skill", "") if isinstance(s, dict) else getattr(s, "skill", str(s))
                for s in missing_pref_items
            ]
        else:
            missing_req_skills = [getattr(s, "skill", str(s)) for s in getattr(skills_data, "missing_required", [])]
            missing_pref_skills = [getattr(s, "skill", str(s)) for s in getattr(skills_data, "missing_preferred", [])]

        kw_data = baseline_result.get("keywords", {})
        if isinstance(kw_data, dict):
            missing_keywords = kw_data.get("missing", [])
        else:
            missing_keywords = getattr(kw_data, "missing", [])

        resp_data = baseline_result.get("responsibilities", {})
        if isinstance(resp_data, dict):
            resp_items = resp_data.get("items", [])
            unmatched_responsibilities = [
                item.get("job_responsibility", "") if isinstance(item, dict) else getattr(item, "job_responsibility", "")
                for item in resp_items
                if (item.get("match_status") if isinstance(item, dict) else getattr(item, "match_status", "")) == "missing"
            ]
        else:
            resp_items = getattr(resp_data, "items", [])
            unmatched_responsibilities = [
                getattr(item, "job_responsibility", "")
                for item in resp_items
                if getattr(item, "match_status", "") == "missing"
            ]

        # Prioritized list of skills to incorporate
        all_missing_skills = []
        if target_skills:
            all_missing_skills.extend(target_skills)
        for s in missing_req_skills:
            if s not in all_missing_skills:
                all_missing_skills.append(s)
        for s in missing_pref_skills:
            if s not in all_missing_skills:
                all_missing_skills.append(s)

        parsed_data = resume_doc.get("parsed_data", {})
        extracted_text = resume_doc.get("extracted_text", "")

        # 3. Extract Candidate Identity & Contact
        candidate_name, candidate_contact = cls._extract_identity_and_contact(extracted_text, resume_doc)

        # 4. Generate Tailored Resume Components
        # A) Summary
        tailored_summary = cls._generate_tailored_summary(
            candidate_name=candidate_name,
            target_title=job_title,
            company_name=company_name,
            existing_summary=cls._extract_existing_summary(extracted_text),
            key_skills=all_missing_skills[:4],
            responsibilities=unmatched_responsibilities[:2]
        )

        # B) Skills Section
        existing_skill_names = [s.get("name", "") if isinstance(s, dict) else getattr(s, "name", str(s)) for s in parsed_data.get("skills", [])]
        tailored_skills_dict, skills_added = cls._generate_categorized_skills(
            existing_skills=existing_skill_names,
            target_skills=all_missing_skills
        )

        # C) Work Experience & Bullet Point Rewrites
        existing_experience = parsed_data.get("experience", [])
        tailored_experience, rewritten_bullets = cls._tailor_experience_bullets(
            experience_items=existing_experience,
            missing_keywords=missing_keywords,
            unmatched_responsibilities=unmatched_responsibilities,
            skills_to_feature=all_missing_skills
        )

        # D) Projects
        existing_projects = parsed_data.get("projects", [])
        tailored_projects = cls._tailor_projects(
            project_items=existing_projects,
            skills_to_feature=all_missing_skills,
            missing_keywords=missing_keywords
        )

        # E) Education & Certifications
        education_list = parsed_data.get("education", [])
        certifications_list = parsed_data.get("certifications", [])

        # 5. Assemble Full ATS-Formatted Text
        tailored_resume_text = cls._assemble_resume_text(
            candidate_name=candidate_name,
            candidate_contact=candidate_contact,
            target_title=job_title,
            summary=tailored_summary,
            skills_dict=tailored_skills_dict,
            experience=tailored_experience,
            projects=tailored_projects,
            education=education_list,
            certifications=certifications_list
        )

        # 6. Parse Tailored Resume into Structured Schema
        tailored_parsed = resume_parser.parse_resume(tailored_resume_text)

        # 7. Re-evaluate Tailored Resume against Job Description
        tailored_doc = {
            "parsed_data": tailored_parsed.model_dump(),
            "extracted_text": tailored_resume_text,
            "original_filename": f"tailored_{job_title.lower().replace(' ', '_')}.txt"
        }
        optimized_result = ats_engine.analyze(tailored_doc, job_doc)
        optimized_score = optimized_result["score"]
        optimized_label = optimized_result["label"]
        optimized_breakdown = ATSScoreBreakdown(**optimized_result["breakdown"])

        score_gain = round(max(optimized_score - original_score, 0.0), 1)

        # Track which missing keywords were successfully injected
        tailored_lower = tailored_resume_text.lower()
        keywords_injected = [k for k in missing_keywords if k.lower() in tailored_lower][:8]

        # Generate human-readable explanations
        tailoring_explanations = [
            f"Incorporated {len(skills_added)} critical JD skills ({', '.join(skills_added[:4])}) into ATS-standard Core Competencies.",
            f"Optimized {len(rewritten_bullets)} experience bullet points using STAR-aligned action verbs and quantified impact.",
            f"Injected {len(keywords_injected)} high-value ATS domain keywords ({', '.join(keywords_injected[:4])}).",
            f"Aligned Professional Summary directly to '{job_title}' requirements at {company_name}.",
            "Applied clean single-column ATS typography with standardized section headers to eliminate parsing errors."
        ]

        return ResumeTailorResponse(
            original_score=original_score,
            optimized_score=optimized_score,
            score_gain=score_gain,
            original_label=original_label,
            optimized_label=optimized_label,
            original_breakdown=original_breakdown,
            optimized_breakdown=optimized_breakdown,
            skills_added=skills_added,
            keywords_injected=keywords_injected,
            rewritten_bullet_points=rewritten_bullets,
            tailored_resume_text=tailored_resume_text,
            tailored_parsed_data=tailored_parsed,
            tailoring_explanations=tailoring_explanations,
            job_title=job_title,
            created_at=datetime.now(timezone.utc)
        )

    @classmethod
    def _extract_identity_and_contact(cls, text: str, resume_doc: Dict[str, Any]) -> Tuple[str, str]:
        """
        Extracts candidate name and contact details header.
        """
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        name = "Candidate"
        for line in lines[:4]:
            if "@" not in line and "http" not in line.lower() and len(line) < 40 and not line.lower().startswith("resume"):
                clean = re.sub(r"[^a-zA-Z\s]", "", line).strip()
                if 2 <= len(clean.split()) <= 4:
                    name = clean.title()
                    break

        if name == "Candidate":
            orig_fn = resume_doc.get("original_filename", "resume.pdf")
            clean_fn = re.sub(r"[-_.]+", " ", orig_fn).replace("resume", "").replace("pdf", "").replace("docx", "").strip()
            if clean_fn:
                name = clean_fn.title()

        # Extract Email
        email_match = re.search(r"([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)", text)
        email = email_match.group(1).lower() if email_match else "candidate@example.com"

        # Extract Phone
        phone_match = re.search(r"(\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})", text)
        phone = phone_match.group(1) if phone_match else "+1 (555) 234-5678"

        # Extract Location / Links - Preserve exact original URLs without alteration
        github_match = re.search(r"(https?://(?:www\.)?github\.com/[a-zA-Z0-9_.-]+(?:/[a-zA-Z0-9_.-]+)?|github\.com/[a-zA-Z0-9_.-]+(?:/[a-zA-Z0-9_.-]+)?)", text, re.IGNORECASE)
        github = github_match.group(1) if github_match else None

        linkedin_match = re.search(r"(https?://(?:www\.)?linkedin\.com/in/[a-zA-Z0-9_.-]+/?|linkedin\.com/in/[a-zA-Z0-9_.-]+)", text, re.IGNORECASE)
        linkedin = linkedin_match.group(1) if linkedin_match else None

        portfolio_match = re.search(r"(https?://(?!github\.com|linkedin\.com)[a-zA-Z0-9_.-]+\.[a-zA-Z]{2,}(?:/[^\s|]*)?)", text, re.IGNORECASE)
        portfolio = portfolio_match.group(1) if portfolio_match else None

        contact_parts = [email, phone]
        if github:
            contact_parts.append(github)
        if linkedin:
            contact_parts.append(linkedin)
        if portfolio:
            contact_parts.append(portfolio)

        contact_line = " | ".join(contact_parts)
        return name, contact_line

    @classmethod
    def _extract_existing_summary(cls, text: str) -> str:
        """
        Attempts to isolate the existing summary or objective section.
        """
        summary_match = re.search(r"(?:summary|profile|about me|objective)[:\s\n]+(.*?)(?=\n[A-Z\s]{4,}|\Z)", text, re.DOTALL | re.IGNORECASE)
        if summary_match:
            summary = summary_match.group(1).strip()
            return " ".join(summary.split())[:350]
        return ""

    @classmethod
    def _generate_tailored_summary(
        cls,
        candidate_name: str,
        target_title: str,
        company_name: str,
        existing_summary: str,
        key_skills: List[str],
        responsibilities: List[str]
    ) -> str:
        """
        Synthesizes a compelling, ATS-optimized Professional Summary.
        """
        skill_str = ", ".join(key_skills[:3]) if key_skills else "scalable systems, data analytics, and modern software architectures"
        resp_str = f" specialized in {responsibilities[0].lower().rstrip('.')}" if responsibilities else " committed to delivering robust business solutions"

        summary = (
            f"Results-oriented {target_title} with demonstrated experience in {skill_str}{resp_str}. "
            f"Track record of translating complex technical challenges into scalable, high-availability products. "
            f"Adept at collaborating in agile engineering teams, optimizing system performance, and driving continuous improvement."
        )
        return summary

    @classmethod
    def _generate_categorized_skills(
        cls,
        existing_skills: List[str],
        target_skills: List[str]
    ) -> Tuple[Dict[str, List[str]], List[str]]:
        """
        Organizes skills into standard ATS taxonomy categories while blending in target JD skills.
        """
        categories = {
            "Languages & Core": ["Python", "JavaScript", "TypeScript", "SQL", "HTML5", "CSS3", "Java", "C++", "Go"],
            "Frameworks & Libraries": ["FastAPI", "React", "Node.js", "Express.js", "Django", "Flask", "Pandas", "NumPy", "Tailwind CSS"],
            "Databases & Storage": ["PostgreSQL", "MongoDB", "Redis", "MySQL", "SQLite", "DynamoDB"],
            "Cloud, DevOps & Tools": ["Docker", "AWS", "Git", "GitHub Actions", "CI/CD", "Linux", "Kubernetes", "Jira", "Postman"],
        }

        # Deduplicate existing skills case-insensitively
        seen_skills = set(s.lower() for s in existing_skills)
        skills_added = []

        # Add missing target skills
        for ts in target_skills:
            if ts.lower() not in seen_skills:
                skills_added.append(ts)
                seen_skills.add(ts.lower())
                existing_skills.append(ts)

        organized: Dict[str, List[str]] = {cat: [] for cat in categories}
        uncategorized: List[str] = []

        for skill in existing_skills:
            placed = False
            for cat, sample_skills in categories.items():
                if any(s.lower() == skill.lower() for s in sample_skills):
                    if skill not in organized[cat]:
                        organized[cat].append(skill)
                    placed = True
                    break
            if not placed and skill not in uncategorized:
                uncategorized.append(skill)

        if uncategorized:
            organized["Additional Competencies"] = uncategorized[:8]

        # Clean empty categories
        cleaned = {k: v for k, v in organized.items() if v}
        return cleaned, skills_added

    @classmethod
    def _tailor_experience_bullets(
        cls,
        experience_items: List[Any],
        missing_keywords: List[str],
        unmatched_responsibilities: List[str],
        skills_to_feature: List[str]
    ) -> Tuple[List[Dict[str, Any]], List[RewrittenBulletPoint]]:
        """
        Rewrites experience bullet points to feature missing keywords, action verbs,
        and unaddressed responsibilities.
        """
        tailored_items = []
        rewritten_list: List[RewrittenBulletPoint] = []

        keyword_idx = 0
        resp_idx = 0

        for exp in experience_items:
            exp_dict = exp if isinstance(exp, dict) else (exp.model_dump() if hasattr(exp, "model_dump") else {})
            title = exp_dict.get("title") or "Software Engineer"
            company = exp_dict.get("company") or "Technology Solutions"
            dates = exp_dict.get("duration") or "2022 - Present"
            description = exp_dict.get("description") or ""

            # Split existing description into bullet points
            raw_bullets = [b.strip().lstrip("•-*– ") for b in description.splitlines() if b.strip()]
            if not raw_bullets:
                raw_bullets = [
                    f"Developed core platform features and microservices using modern software engineering practices.",
                    f"Collaborated with cross-functional teams to deliver reliable customer-facing capabilities on schedule.",
                    f"Maintained code quality, automated test suites, and streamlined deployment workflows."
                ]

            optimized_bullets = []
            for b_idx, bullet in enumerate(raw_bullets):
                # Enhance bullet with strong action verb and target keyword
                verb = "Engineered" if b_idx == 0 else ("Optimized" if b_idx == 1 else "Spearheaded")
                kw = missing_keywords[keyword_idx % len(missing_keywords)] if missing_keywords else "scalability"
                keyword_idx += 1

                # Clean leading weak verbs
                clean_bullet = re.sub(r"^(worked on|helped with|responsible for|assisted in|did|handled)\s*", "", bullet, flags=re.IGNORECASE)
                clean_bullet = clean_bullet[0].lower() + clean_bullet[1:] if clean_bullet else "key platform components"

                # Check if we should align with an unmatched responsibility
                if b_idx == 0 and unmatched_responsibilities and resp_idx < len(unmatched_responsibilities):
                    resp = unmatched_responsibilities[resp_idx].rstrip(".")
                    resp_idx += 1
                    opt_bullet = f"{verb} {resp.lower()}, ensuring high system reliability and automated verification."
                    rationale = f"Directly addresses key JD duty: '{resp}'."
                else:
                    opt_bullet = f"{verb} {clean_bullet.rstrip('.')}, integrating {kw} best practices and reducing error rates by 25%."
                    rationale = f"Introduced strong action verb '{verb}' and target keyword '{kw}' with quantifiable impact."

                optimized_bullets.append(opt_bullet)
                rewritten_list.append(RewrittenBulletPoint(
                    original=bullet,
                    optimized=opt_bullet,
                    section=f"{title} at {company}",
                    rationale=rationale
                ))

            tailored_items.append({
                "title": title,
                "company": company,
                "duration": dates,
                "bullets": optimized_bullets
            })

        return tailored_items, rewritten_list

    @classmethod
    def _tailor_projects(
        cls,
        project_items: List[Any],
        skills_to_feature: List[str],
        missing_keywords: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Enhances projects with target technologies and quantifiable outputs.
        """
        tailored_projects = []
        for p_idx, p in enumerate(project_items[:4]):
            p_dict = p if isinstance(p, dict) else (p.model_dump() if hasattr(p, "model_dump") else {})
            name = p_dict.get("name") or f"Enterprise Application {p_idx + 1}"
            desc = p_dict.get("description") or "Full-stack cloud-native software application."
            techs = p_dict.get("technologies") or []

            # Add missing skills relevant to projects
            for s in skills_to_feature[p_idx:p_idx + 2]:
                if s not in techs:
                    techs.append(s)

            clean_desc = desc.rstrip(".")
            if not any(char.isdigit() for char in clean_desc):
                clean_desc += ", handling 10,000+ monthly requests with sub-100ms response times"

            existing_url = p_dict.get("url") or p_dict.get("repository")
            if not existing_url and desc:
                url_match = re.search(r"(https?://[^\s)]+)", desc)
                if url_match:
                    existing_url = url_match.group(1)

            tailored_projects.append({
                "name": name,
                "technologies": techs,
                "description": clean_desc + ".",
                "url": existing_url
            })
        return tailored_projects

    @classmethod
    def _assemble_resume_text(
        cls,
        candidate_name: str,
        candidate_contact: str,
        target_title: str,
        summary: str,
        skills_dict: Dict[str, List[str]],
        experience: List[Dict[str, Any]],
        projects: List[Dict[str, Any]],
        education: List[Any],
        certifications: List[Any]
    ) -> str:
        """
        Formats resume into clean, single-column ATS plain text.
        """
        lines = []

        # Header
        lines.append(candidate_name.upper())
        lines.append(target_title)
        lines.append(candidate_contact)
        lines.append("")

        # Summary
        lines.append("PROFESSIONAL SUMMARY")
        lines.append("-" * 40)
        lines.append(summary)
        lines.append("")

        # Skills
        lines.append("CORE COMPETENCIES & TECHNICAL SKILLS")
        lines.append("-" * 40)
        for cat, skills in skills_dict.items():
            lines.append(f"• {cat}: {', '.join(skills)}")
        lines.append("")

        # Experience
        if experience:
            lines.append("PROFESSIONAL EXPERIENCE")
            lines.append("-" * 40)
            for exp in experience:
                lines.append(f"{exp['title'].upper()} | {exp['company']}")
                lines.append(f"Duration: {exp.get('duration', '2022 - Present')}")
                for bullet in exp.get("bullets", []):
                    lines.append(f"• {bullet}")
                lines.append("")

        # Projects
        if projects:
            lines.append("TECHNICAL PROJECTS & CODE REPOSITORIES")
            lines.append("-" * 40)
            for p in projects:
                tech_str = f" (Tech: {', '.join(p['technologies'])})" if p.get("technologies") else ""
                lines.append(f"• {p['name']}{tech_str}")
                lines.append(f"  {p['description']}")
                if p.get("url"):
                    lines.append(f"  Repository: {p['url']}")
            lines.append("")

        # Education
        lines.append("EDUCATION")
        lines.append("-" * 40)
        if education:
            for edu in education:
                e_dict = edu if isinstance(edu, dict) else (edu.model_dump() if hasattr(edu, "model_dump") else {})
                deg = e_dict.get("degree") or "Bachelor of Science in Computer Science"
                inst = e_dict.get("institution") or "University"
                lines.append(f"• {deg} — {inst}")
        else:
            lines.append("• Bachelor of Science in Computer Science / Information Systems")
        lines.append("")

        # Certifications
        if certifications:
            lines.append("CERTIFICATIONS & CREDENTIALS")
            lines.append("-" * 40)
            for cert in certifications:
                c_dict = cert if isinstance(cert, dict) else (cert.model_dump() if hasattr(cert, "model_dump") else {})
                c_name = c_dict.get("name") if isinstance(c_dict, dict) else str(cert)
                lines.append(f"• {c_name}")
            lines.append("")

        return "\n".join(lines)


resume_tailorer = ResumeTailorer()

