import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from app.models.job import (
    JobInfo,
    JobRequirements,
    SkillRequirement,
    ExperienceRequirement,
    EducationRequirement,
)
from app.services.resume_parser import SKILL_TAXONOMY

logger = logging.getLogger("uvicorn.error")


class JobDescriptionParser:
    """
    Parses raw job descriptions into structured requirements:
    - Job Info (title, company, location, work mode, employment type)
    - Required Skills vs Preferred Skills
    - Experience Requirements (min/max years)
    - Education Requirements
    - Key Responsibilities
    - Qualifications
    """

    @classmethod
    def extract_job_info(cls, text: str) -> JobInfo:
        """
        Extracts title, company, location, work mode, and employment type.
        """
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        if not lines:
            return JobInfo()

        job_title = None
        company_name = None
        location = None
        work_mode = None
        employment_type = None

        # 1. Job Title Detection
        title_prefix_match = re.search(
            r"(?:job\s*title|position|role|title)[:\s-]+\s*([A-Za-z0-9\s/&\-\(\)]+?)(?:\n|$|\s{2,}|\|)",
            text,
            re.IGNORECASE
        )
        if title_prefix_match and len(title_prefix_match.group(1).strip()) < 80:
            job_title = title_prefix_match.group(1).strip()
        else:
            # Common title pattern
            common_titles_regex = re.compile(
                r"\b((?:Senior|Junior|Lead|Principal|Associate|Staff|Head\s+of)?\s*"
                r"(?:Software Engineer|Software Developer|Backend Developer|Backend Engineer|"
                r"Frontend Developer|Frontend Engineer|Full Stack Developer|Full Stack Engineer|"
                r"Data Analyst|Data Scientist|Data Engineer|Machine Learning Engineer|AI Engineer|"
                r"DevOps Engineer|Cloud Engineer|Site Reliability Engineer|Product Manager|"
                r"Project Manager|Business Intelligence Analyst|Business Analyst|QA Engineer|"
                r"Security Engineer|Systems Administrator))\b",
                re.IGNORECASE
            )
            for line in lines[:8]:
                match = common_titles_regex.search(line)
                if match:
                    job_title = match.group(0).strip()
                    break

            # Fallback to first clean short heading line
            if not job_title and len(lines[0]) < 60 and not re.search(r"(about|welcome|hiring|overview)", lines[0], re.IGNORECASE):
                job_title = lines[0]

        # 2. Company Name Detection
        company_match = re.search(
            r"(?:company|organization|client|at\s+company|about)\s*[:\-]?\s*([A-Za-z0-9\s&,\.\-]{2,40}?)(?:\n|\.|,|\s{2,}|\||\bis\b)",
            text,
            re.IGNORECASE
        )
        if company_match:
            cand = company_match.group(1).strip()
            if cand.lower() not in ("us", "you", "the role", "the team", "our company", "overview"):
                company_name = cand

        # 3. Location Detection
        loc_match = re.search(
            r"(?:location|job\s*location|based\s*in|office)[:\s-]+\s*([A-Za-z0-9\s,/\.\-]{2,50}?)(?:\n|\.|\s{2,}|\|)",
            text,
            re.IGNORECASE
        )
        if loc_match:
            location = loc_match.group(1).strip()
        else:
            # Detect common cities
            city_match = re.search(
                r"\b(New York|San Francisco|Austin|Seattle|Boston|Chicago|London|Bangalore|Bengaluru|Hyderabad|Mumbai|Delhi|Toronto|Berlin|Singapore|Sydney)\b",
                text,
                re.IGNORECASE
            )
            if city_match:
                location = city_match.group(0).strip()

        # 4. Work Mode Detection
        lower_text = text.lower()
        if re.search(r"\b(remote|100%\s*remote|work\s*from\s*home|wfh|anywhere)\b", lower_text):
            work_mode = "Remote"
        elif re.search(r"\b(hybrid|hybrid\s*remote|flexible\s*work)\b", lower_text):
            work_mode = "Hybrid"
        elif re.search(r"\b(on-site|onsite|in-office|in\s*person)\b", lower_text):
            work_mode = "On-site"

        # 5. Employment Type Detection
        if re.search(r"\b(full-time|full\s*time|permanent)\b", lower_text):
            employment_type = "Full-time"
        elif re.search(r"\b(part-time|part\s*time)\b", lower_text):
            employment_type = "Part-time"
        elif re.search(r"\b(contract|contractor|freelance|c2c)\b", lower_text):
            employment_type = "Contract"
        elif re.search(r"\b(internship|intern)\b", lower_text):
            employment_type = "Internship"

        return JobInfo(
            job_title=job_title,
            company_name=company_name,
            location=location,
            work_mode=work_mode,
            employment_type=employment_type
        )

    @classmethod
    def extract_skills_classified(cls, text: str) -> Tuple[List[SkillRequirement], List[SkillRequirement]]:
        """
        Extracts skills and classifies them into required vs preferred based on JD context.
        """
        required_skills_dict: Dict[str, SkillRequirement] = {}
        preferred_skills_dict: Dict[str, SkillRequirement] = {}

        # Strip URLs and emails
        clean_text = re.sub(r"https?://\S+", " ", text)
        clean_text = re.sub(r"\S+@\S+", " ", clean_text)
        lines = clean_text.split("\n")
        current_section = "general"  # "required", "preferred", "general"

        preferred_header_regex = re.compile(
            r"^(?:preferred|nice\s+to\s+have|plus|bonus|good\s+to\s+have|desired|optional)\b",
            re.IGNORECASE
        )
        required_header_regex = re.compile(
            r"^(?:required|requirements|must\s+have|what\s+you\s+need|key\s+skills|qualifications|basic\s+qualifications)\b",
            re.IGNORECASE
        )

        for line in lines:
            line_clean = line.strip()
            if preferred_header_regex.search(line_clean):
                current_section = "preferred"
                continue
            elif required_header_regex.search(line_clean):
                current_section = "required"
                continue
            elif re.search(r"^(?:responsibilities|about|benefits|who\s+we\s+are)\b", line_clean, re.IGNORECASE):
                current_section = "general"

            lower_line = f" {line_clean.lower()} "

            for skill_name, meta in SKILL_TAXONOMY.items():
                category = meta["category"]
                for alias in meta["aliases"]:
                    pattern = r"(?<![a-zA-Z0-9_])" + re.escape(alias.strip()) + r"(?![a-zA-Z0-9_])"
                    if re.search(pattern, lower_line, re.IGNORECASE):
                        if skill_name == "Java" and not re.search(r"\bjava\b(?!\s*script)", lower_line, re.IGNORECASE):
                            continue
                        if skill_name == "Excel" and alias == "excel" and not re.search(r"(?:ms|microsoft|advanced|data|sheets|vba|pivot|formula)\s+excel|excel\s+(?:sheets|formulas|vba|pivot|charts)", lower_line, re.IGNORECASE):
                            continue

                        # Determine requirement type
                        is_pref = (
                            current_section == "preferred" or
                            bool(re.search(r"\b(?:plus|preferred|bonus|nice\s+to\s+have|optional|advantage)\b", lower_line))
                        )

                        req_item = SkillRequirement(
                            name=skill_name,
                            normalized_name=skill_name.lower().replace(" ", "-"),
                            category=category,
                            importance="preferred" if is_pref else "required"
                        )

                        if is_pref:
                            if skill_name not in required_skills_dict and skill_name not in preferred_skills_dict:
                                preferred_skills_dict[skill_name] = req_item
                        else:
                            required_skills_dict[skill_name] = req_item
                            preferred_skills_dict.pop(skill_name, None)
                        break

        return list(required_skills_dict.values()), list(preferred_skills_dict.values())

    @classmethod
    def extract_experience(cls, text: str) -> ExperienceRequirement:
        """
        Extracts minimum and maximum years of experience required.
        """
        # Pattern 1: Range "2-5 years", "2 to 4 years"
        range_match = re.search(
            r"\b([0-9]+(?:\.[0-9]+)?)\s*(?:-|–|to)\s*([0-9]+(?:\.[0-9]+)?)\+?\s*years?(?:\s+of)?(?:\s+[\w\s]{1,40})?\s*experience\b",
            text,
            re.IGNORECASE
        )
        if range_match:
            min_yr = float(range_match.group(1))
            max_yr = float(range_match.group(2))
            return ExperienceRequirement(
                minimum_years=min_yr,
                maximum_years=max_yr,
                description=f"{int(min_yr) if min_yr.is_integer() else min_yr}-{int(max_yr) if max_yr.is_integer() else max_yr} years of experience required"
            )

        # Pattern 2: "3+ years of experience" or "3+ years of professional backend development experience"
        plus_match = re.search(
            r"\b([0-9]+(?:\.[0-9]+)?)\+?\s*years?(?:\s+of)?(?:\s+[\w\s]{1,40})?\s*experience\b",
            text,
            re.IGNORECASE
        )
        if plus_match:
            min_yr = float(plus_match.group(1))
            return ExperienceRequirement(
                minimum_years=min_yr,
                maximum_years=None,
                description=f"{int(min_yr) if min_yr.is_integer() else min_yr}+ years of experience required"
            )

        # Pattern 3: Simple "3+ years"
        simple_yr = re.search(r"\b([0-9]+(?:\.[0-9]+)?)\+?\s*years\b", text, re.IGNORECASE)
        if simple_yr:
            min_yr = float(simple_yr.group(1))
            return ExperienceRequirement(
                minimum_years=min_yr,
                maximum_years=None,
                description=f"{int(min_yr) if min_yr.is_integer() else min_yr}+ years of experience required"
            )

        # Pattern 4: Entry level / 0 years
        if re.search(r"\b(entry-level|entry\s+level|freshers?|new\s+grad|new\s+graduate)\b", text, re.IGNORECASE):
            return ExperienceRequirement(
                minimum_years=0.0,
                maximum_years=1.0,
                description="Entry level position (0-1 years of experience)"
            )

        return ExperienceRequirement(minimum_years=None, maximum_years=None, description=None)

    @classmethod
    def extract_education(cls, text: str) -> List[EducationRequirement]:
        """
        Extracts formal degree requirements and fields of study.
        """
        edu_list: List[EducationRequirement] = []

        deg_rules = [
            (r"(?:bachelor'?s|b\.?tech|b\.?e\.?|b\.?s\.?|b\.?sc|bca)", "Bachelor's Degree"),
            (r"(?:master'?s|m\.?tech|m\.?e\.?|m\.?s\.?|m\.?sc|mca|mba)", "Master's Degree"),
            (r"(?:ph\.?d|doctorate)", "Ph.D. / Doctorate"),
        ]

        # Common academic fields
        fields_found = []
        field_patterns = [
            ("Computer Science", r"\b(computer\s+science|cs)\b"),
            ("Information Technology", r"\b(information\s+technology|it)\b"),
            ("Data Science", r"\b(data\s+science|analytics)\b"),
            ("Software Engineering", r"\b(software\s+engineering)\b"),
            ("Electrical Engineering", r"\b(electrical\s+engineering|electronics)\b"),
            ("Mathematics / Statistics", r"\b(mathematics|stats|statistics)\b"),
            ("Business / Finance", r"\b(business|finance|economics)\b"),
        ]

        for name, pat in field_patterns:
            if re.search(pat, text, re.IGNORECASE):
                fields_found.append(name)

        for pattern, deg_name in deg_rules:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                is_req = not bool(re.search(r"(?:preferred|plus|bonus|desired)\b", text[max(0, match.start() - 30): match.end() + 30], re.IGNORECASE))
                edu_list.append(EducationRequirement(
                    degree=deg_name,
                    fields=fields_found[:3] if fields_found else ["Computer Science or related technical field"],
                    required=is_req
                ))

        return edu_list

    @classmethod
    def extract_responsibilities(cls, text: str) -> List[str]:
        """
        Extracts key job duty statements and deliverables.
        """
        responsibilities: List[str] = []
        lines = text.split("\n")

        in_resp_section = False
        resp_header_regex = re.compile(
            r"^(?:responsibilities|key\s+responsibilities|what\s+you'?ll\s+do|duties|role\s+overview|your\s+role)\b",
            re.IGNORECASE
        )
        end_section_regex = re.compile(
            r"^(?:requirements|qualifications|what\s+we\s+look\s+for|skills|benefits|about\s+us)\b",
            re.IGNORECASE
        )

        for line in lines:
            line_clean = line.strip()
            if not line_clean:
                continue

            if resp_header_regex.search(line_clean):
                in_resp_section = True
                continue

            if in_resp_section:
                if end_section_regex.search(line_clean):
                    break

                # Bullet points or action sentences
                if line_clean.startswith(("•", "-", "*", "–", "—", ">")) or len(line_clean) > 25:
                    cleaned_item = re.sub(r"^[•\-\*–—>\d\.\s]+", "", line_clean).strip()
                    if len(cleaned_item) > 15 and not cleaned_item.endswith(":"):
                        responsibilities.append(cleaned_item)

        # Fallback if no specific header matched: search for action verbs
        if not responsibilities:
            for line in lines:
                line_clean = line.strip()
                if line_clean.startswith(("•", "-", "*")) and re.search(r"\b(build|develop|design|lead|collaborate|implement|maintain|manage|analyze|create|deploy)\b", line_clean, re.IGNORECASE):
                    cleaned_item = re.sub(r"^[•\-\*–—>\d\.\s]+", "", line_clean).strip()
                    if len(cleaned_item) > 20:
                        responsibilities.append(cleaned_item)

        return responsibilities[:8]

    @classmethod
    def extract_qualifications(cls, text: str) -> List[str]:
        """
        Extracts qualifications and prerequisite statements.
        """
        qualifications: List[str] = []
        lines = text.split("\n")

        in_qual_section = False
        qual_header_regex = re.compile(
            r"^(?:qualifications|requirements|what\s+we'?re\s+looking\s+for|who\s+you\s+are|basic\s+qualifications|minimum\s+qualifications)\b",
            re.IGNORECASE
        )
        end_section_regex = re.compile(
            r"^(?:responsibilities|benefits|about\s+us|perks|how\s+to\s+apply)\b",
            re.IGNORECASE
        )

        for line in lines:
            line_clean = line.strip()
            if not line_clean:
                continue

            if qual_header_regex.search(line_clean):
                in_qual_section = True
                continue

            if in_qual_section:
                if end_section_regex.search(line_clean):
                    break

                if line_clean.startswith(("•", "-", "*", "–", "—", ">")) or len(line_clean) > 25:
                    cleaned_item = re.sub(r"^[•\-\*–—>\d\.\s]+", "", line_clean).strip()
                    if len(cleaned_item) > 15 and not cleaned_item.endswith(":"):
                        qualifications.append(cleaned_item)

        return qualifications[:8]

    @classmethod
    def parse_job_description(cls, raw_text: str) -> Tuple[JobInfo, JobRequirements]:
        """
        Unified parser producing structured JobInfo and JobRequirements.
        """
        if not raw_text or not raw_text.strip():
            return JobInfo(), JobRequirements()

        job_info = cls.extract_job_info(raw_text)
        req_skills, pref_skills = cls.extract_skills_classified(raw_text)
        experience = cls.extract_experience(raw_text)
        education = cls.extract_education(raw_text)
        responsibilities = cls.extract_responsibilities(raw_text)
        qualifications = cls.extract_qualifications(raw_text)

        requirements = JobRequirements(
            required_skills=req_skills,
            preferred_skills=pref_skills,
            experience=experience,
            education=education,
            responsibilities=responsibilities,
            qualifications=qualifications
        )

        return job_info, requirements


jd_parser = JobDescriptionParser()
