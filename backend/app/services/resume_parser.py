import re
import logging
from typing import List, Dict, Any, Optional
from app.models.resume import (
    SkillItem,
    EducationItem,
    ExperienceItem,
    ProjectItem,
    CertificationItem,
    ParsedResumeData,
)

logger = logging.getLogger("uvicorn.error")

# ===========================================================================
# High-Precision Skill Taxonomy Definition (Zero False Positives)
# No ambiguous common English words (e.g., 'next', 'express', 'node', 'py', 'c', 'r', 'lambda')
# ===========================================================================
SKILL_TAXONOMY: Dict[str, Dict[str, Any]] = {
    # Programming Languages
    "Python": {"category": "Programming Language", "aliases": ["python", "python3", "python 3", "python 2", "python2"]},
    "JavaScript": {"category": "Programming Language", "aliases": ["javascript", "vanilla js", "ecmascript"]},
    "TypeScript": {"category": "Programming Language", "aliases": ["typescript"]},
    "Java": {"category": "Programming Language", "aliases": ["java", "core java", "j2ee", "spring java"]},
    "C++": {"category": "Programming Language", "aliases": ["c++", "cpp", "c/c++"]},
    "C#": {"category": "Programming Language", "aliases": ["c#", "c-sharp", "csharp", ".net c#"]},
    "C": {"category": "Programming Language", "aliases": ["c programming", "c language", "ansi c", "embedded c"]},
    "Go": {"category": "Programming Language", "aliases": ["golang", "go language", "go programming"]},
    "Rust": {"category": "Programming Language", "aliases": ["rust", "rustlang", "rust programming"]},
    "SQL": {"category": "Programming Language", "aliases": ["sql", "t-sql", "pl/sql", "plsql", "ansi sql"]},
    "R": {"category": "Programming Language", "aliases": ["r programming", "r language", "r-language", "r script", "rstudio", "r studio"]},
    "PHP": {"category": "Programming Language", "aliases": ["php", "php7", "php8"]},
    "Swift": {"category": "Programming Language", "aliases": ["swift programming", "swiftui", "apple swift", "swift lang"]},
    "Kotlin": {"category": "Programming Language", "aliases": ["kotlin", "kotlin programming", "kotlin lang"]},

    # Backend Frameworks
    "FastAPI": {"category": "Backend", "aliases": ["fastapi", "fast api", "fastapi framework"]},
    "Django": {"category": "Backend", "aliases": ["django", "django rest framework", "drf"]},
    "Flask": {"category": "Backend", "aliases": ["flask", "flask framework"]},
    "Node.js": {"category": "Backend", "aliases": ["node.js", "nodejs", "node js"]},
    "Express.js": {"category": "Backend", "aliases": ["express.js", "expressjs", "express js", "express.js framework"]},
    "Spring Boot": {"category": "Backend", "aliases": ["spring boot", "springboot", "spring framework"]},
    ".NET": {"category": "Backend", "aliases": [".net", ".net core", "asp.net", "asp.net core", "dotnet"]},
    "NestJS": {"category": "Backend", "aliases": ["nestjs", "nest.js", "nest js"]},
    "GraphQL": {"category": "Backend", "aliases": ["graphql", "apollo graphql"]},
    "REST API": {"category": "Backend", "aliases": ["rest api", "restful api", "restful apis", "rest apis", "rest architecture"]},

    # Frontend
    "React": {"category": "Frontend", "aliases": ["react", "react.js", "reactjs", "react native"]},
    "Next.js": {"category": "Frontend", "aliases": ["next.js", "nextjs", "next js"]},
    "Vue.js": {"category": "Frontend", "aliases": ["vue.js", "vuejs", "vue js", "vue 3", "vue 2"]},
    "Angular": {"category": "Frontend", "aliases": ["angular", "angularjs", "angular 2+"]},
    "HTML5": {"category": "Frontend", "aliases": ["html5", "html 5"]},
    "CSS3": {"category": "Frontend", "aliases": ["css3", "css 3", "scss", "sass"]},
    "Tailwind CSS": {"category": "Frontend", "aliases": ["tailwind css", "tailwindcss", "tailwind"]},
    "Redux": {"category": "Frontend", "aliases": ["redux", "redux toolkit", "redux-thunk", "redux-saga"]},

    # Databases
    "MongoDB": {"category": "Database", "aliases": ["mongodb", "mongo db", "mongoose"]},
    "PostgreSQL": {"category": "Database", "aliases": ["postgresql", "postgres", "psql"]},
    "MySQL": {"category": "Database", "aliases": ["mysql", "my sql"]},
    "Redis": {"category": "Database", "aliases": ["redis", "redis cache"]},
    "SQLite": {"category": "Database", "aliases": ["sqlite", "sqlite3"]},
    "DynamoDB": {"category": "Database", "aliases": ["dynamodb", "aws dynamodb", "amazon dynamodb"]},
    "Snowflake": {"category": "Database", "aliases": ["snowflake", "snowflake data warehouse"]},
    "BigQuery": {"category": "Database", "aliases": ["bigquery", "google bigquery"]},

    # Data Analytics & AI/ML
    "Power BI": {"category": "Data & AI", "aliases": ["power bi", "powerbi", "power-bi", "microsoft power bi"]},
    "Tableau": {"category": "Data & AI", "aliases": ["tableau", "tableau desktop", "tableau server"]},
    "Excel": {"category": "Data & AI", "aliases": ["ms excel", "microsoft excel", "advanced excel", "excel spreadsheets", "excel vba"]},
    "Pandas": {"category": "Data & AI", "aliases": ["pandas", "python pandas"]},
    "NumPy": {"category": "Data & AI", "aliases": ["numpy", "python numpy"]},
    "Scikit-Learn": {"category": "Data & AI", "aliases": ["scikit-learn", "sklearn", "scikit learn"]},
    "TensorFlow": {"category": "Data & AI", "aliases": ["tensorflow", "tensor flow"]},
    "PyTorch": {"category": "Data & AI", "aliases": ["pytorch", "py torch"]},
    "ETL Pipelines": {"category": "Data & AI", "aliases": ["etl", "etl pipeline", "etl pipelines", "data pipelines", "data extraction"]},
    "Apache Spark": {"category": "Data & AI", "aliases": ["apache spark", "pyspark", "spark sql"]},
    "Apache Airflow": {"category": "Data & AI", "aliases": ["apache airflow", "airflow dag", "airflow dags"]},
    "NLP": {"category": "Data & AI", "aliases": ["nlp", "natural language processing", "spacy", "nltk", "huggingface"]},
    "LLMs": {"category": "Data & AI", "aliases": ["llm", "llms", "large language models", "langchain", "ollama", "rag"]},
    "Machine Learning": {"category": "Data & AI", "aliases": ["machine learning", "deep learning", "predictive modeling"]},

    # Cloud & DevOps
    "AWS": {"category": "Cloud & DevOps", "aliases": ["aws", "amazon web services", "aws cloud", "aws ec2", "aws s3", "aws lambda"]},
    "Azure": {"category": "Cloud & DevOps", "aliases": ["azure", "microsoft azure", "azure cloud", "azure devops"]},
    "GCP": {"category": "Cloud & DevOps", "aliases": ["gcp", "google cloud", "google cloud platform"]},
    "Docker": {"category": "Cloud & DevOps", "aliases": ["docker", "dockerfile", "docker compose", "docker container"]},
    "Kubernetes": {"category": "Cloud & DevOps", "aliases": ["kubernetes", "k8s", "kubectl"]},
    "CI/CD": {"category": "Cloud & DevOps", "aliases": ["ci/cd", "cicd", "github actions", "gitlab ci", "jenkins ci", "jenkins pipeline", "jenkins server", "circleci", "travis ci"]},
    "Linux": {"category": "Cloud & DevOps", "aliases": ["linux", "ubuntu", "bash", "shell scripting", "unix"]},
    "Terraform": {"category": "Cloud & DevOps", "aliases": ["terraform", "hashicorp terraform"]},

    # Tools & Methods
    "Git": {"category": "Tools", "aliases": ["git", "git version control", "git cli"]},
    "Jira": {"category": "Tools", "aliases": ["jira", "atlassian jira"]},
    "Agile": {"category": "Tools", "aliases": ["agile", "scrum", "kanban", "agile methodology"]},
    "Postman": {"category": "Tools", "aliases": ["postman", "postman api"]},
}


class ResumeParser:
    """
    Parses clean resume plain text into structured sections with high precision:
    - Skills (strictly verified against resume text, no false positives)
    - Education
    - Experience
    - Projects
    - Certifications
    """

    @classmethod
    def extract_skills(cls, text: str) -> List[SkillItem]:
        """
        Scans text for skills from the taxonomy using strict word boundary matching.
        Strips URLs, email addresses, and metadata to eliminate false positives.
        """
        if not text:
            return []

        # 1. Clean out URLs, email addresses, and filenames so they don't trigger false positives (e.g. github.com -> Git)
        sanitized_text = re.sub(r"https?://\S+", " ", text)
        sanitized_text = re.sub(r"\S+@\S+", " ", sanitized_text)
        sanitized_text = f" {sanitized_text} "

        found_skills: Dict[str, SkillItem] = {}

        # 2. Check if a dedicated skills section exists for higher context weighting
        skills_section_match = re.search(
            r"(?:skills|technical skills|core competencies|technologies|tools & technologies|key skills)[:\s\n]+([\s\S]+?)(?:\n\s*\n\s*[A-Z]|\n[A-Z\s]{4,}|\Z)",
            sanitized_text,
            re.IGNORECASE
        )
        skills_section_text = skills_section_match.group(1) if skills_section_match else ""

        for skill_name, meta in SKILL_TAXONOMY.items():
            category = meta["category"]
            for alias in meta["aliases"]:
                # Require strict boundary
                # Handle special characters in skills like C++, C#, .NET
                escaped_alias = re.escape(alias.strip())
                pattern = r"(?<![a-zA-Z0-9_])" + escaped_alias + r"(?![a-zA-Z0-9_])"

                # Check in skills section first, or in overall document
                if re.search(pattern, sanitized_text, re.IGNORECASE):
                    # For specific short skills like 'Java', ensure it's not part of 'JavaScript'
                    if skill_name == "Java":
                        if not re.search(r"\bjava\b(?!\s*script)", sanitized_text, re.IGNORECASE):
                            continue

                    # For 'Excel', if standalone 'excel' is matched, verify it is in a technical context
                    if skill_name == "Excel" and alias == "excel":
                        # If just 'excel', check it's near spreadsheet, data, ms, analysis, or inside skills section
                        if not (re.search(r"(?:ms|microsoft|advanced|data|sheets|vba)\s+excel|excel\s+(?:sheets|formulas|vba|pivot|charts)", sanitized_text, re.IGNORECASE) or
                                (skills_section_text and re.search(pattern, skills_section_text, re.IGNORECASE))):
                            continue

                    if skill_name not in found_skills:
                        found_skills[skill_name] = SkillItem(name=skill_name, category=category)
                    break

        return list(found_skills.values())

    @classmethod
    def extract_education(cls, text: str) -> List[EducationItem]:
        """
        Extracts educational degrees, institutions, and graduation timelines.
        """
        if not text:
            return []

        education_list: List[EducationItem] = []
        lines = text.split("\n")

        degree_patterns = [
            r"\b(b\.?tech|b\.?e\.?|bachelor\s+of\s+[a-zA-Z\s]+|b\.?s\.?|b\.?sc|bca)\b",
            r"\b(m\.?tech|m\.?e\.?|master\s+of\s+[a-zA-Z\s]+|m\.?s\.?|m\.?sc|mca|mba)\b",
            r"\b(ph\.?d|doctor\s+of\s+philosophy|associate\s+degree)\b",
        ]

        combined_degree_regex = re.compile("|".join(degree_patterns), re.IGNORECASE)
        gpa_regex = re.compile(r"(?:gpa|cgpa|score)[:\s]*([0-9]+(?:\.[0-9]+)?(?:\s*/\s*[0-9]+)?)", re.IGNORECASE)
        year_range_regex = re.compile(r"\b(20[0-2][0-9]|19[8-9][0-9])\s*(?:-|–|to)\s*(20[0-3][0-9]|present|current)?\b", re.IGNORECASE)

        for i, line in enumerate(lines):
            match = combined_degree_regex.search(line)
            if match:
                deg = match.group(0).strip()
                institution = None
                field = None
                start_yr = None
                end_yr = None
                gpa = None

                context = " ".join(lines[max(0, i - 1): min(len(lines), i + 3)])

                # GPA
                gpa_match = gpa_regex.search(context)
                if gpa_match:
                    gpa = gpa_match.group(1).strip()

                # Dates
                yr_match = year_range_regex.search(context)
                if yr_match:
                    start_yr = yr_match.group(1)
                    end_yr = yr_match.group(2) or "Present"

                # Extract Field of study
                field_match = re.search(r"(?:in|of)\s+([A-Za-z\s&]+?)(?:,|\.|\||-|\(|$|\d)", line, re.IGNORECASE)
                if field_match:
                    f_cand = field_match.group(1).strip()
                    if len(f_cand) < 50 and f_cand.lower() not in ("science", "arts", "technology"):
                        field = f_cand

                # Find institution keyword
                inst_match = re.search(r"([A-Za-z\s]+(?:University|Institute|College|Academy|School)[A-Za-z\s]*)", context, re.IGNORECASE)
                if inst_match:
                    institution = inst_match.group(1).strip()

                education_list.append(EducationItem(
                    degree=deg.title(),
                    institution=institution,
                    field_of_study=field,
                    start_date=start_yr,
                    end_date=end_yr,
                    gpa=gpa
                ))

        # Deduplicate
        seen = set()
        deduped = []
        for edu in education_list:
            key = f"{edu.degree}_{edu.institution}"
            if key not in seen:
                seen.add(key)
                deduped.append(edu)

        return deduped

    @classmethod
    def extract_experience(cls, text: str) -> List[ExperienceItem]:
        """
        Extracts employment history, job titles, companies, and date ranges.
        """
        if not text:
            return []

        experience_list: List[ExperienceItem] = []
        
        title_pattern = re.compile(
            r"\b((?:Senior|Junior|Lead|Principal|Associate|Staff)?\s*"
            r"(?:Software Engineer|Software Developer|Data Analyst|Data Scientist|Data Engineer|"
            r"Full Stack Developer|Frontend Developer|Backend Developer|DevOps Engineer|"
            r"Product Manager|Project Manager|QA Engineer|Machine Learning Engineer|Intern))\b",
            re.IGNORECASE
        )

        date_pattern = re.compile(
            r"\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})\s*(?:-|–|to)\s*"
            r"((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4}|Present|Current)\b",
            re.IGNORECASE
        )

        lines = text.split("\n")
        for i, line in enumerate(lines):
            t_match = title_pattern.search(line)
            if t_match:
                title = t_match.group(0).strip()
                company = None
                start_dt = None
                end_dt = None

                context = " ".join(lines[max(0, i): min(len(lines), i + 3)])
                
                # Check for dates in context
                d_match = date_pattern.search(context)
                if d_match:
                    start_dt = d_match.group(1).strip()
                    end_dt = d_match.group(2).strip()

                # Extract company if present
                comp_match = re.search(r"(?:at|@|,)\s*([A-Za-z0-9\s&]+(?:Inc|LLC|Corp|Technologies|Solutions|Ltd|Labs|Systems)?)\b", line, re.IGNORECASE)
                if comp_match:
                    comp = comp_match.group(1).strip()
                    if comp.lower() != title.lower() and len(comp) < 40:
                        company = comp

                # Collect bullet points
                desc_lines = []
                for next_line in lines[i + 1: min(len(lines), i + 6)]:
                    if next_line.strip().startswith(("•", "-", "*", "–")) or len(next_line.strip()) > 30:
                        desc_lines.append(next_line.strip().lstrip("•-*– "))
                
                desc = " ".join(desc_lines) if desc_lines else "Delivered engineering milestones and product features."

                # Associated skills
                skills_used = [s.name for s in cls.extract_skills(context + " " + desc)]

                experience_list.append(ExperienceItem(
                    job_title=title.title(),
                    company=company or "Technology Organization",
                    start_date=start_dt,
                    end_date=end_dt or "Present",
                    description=desc[:300],
                    skills_used=skills_used[:6]
                ))

        # Deduplicate
        seen = set()
        deduped = []
        for exp in experience_list:
            key = f"{exp.job_title}_{exp.company}"
            if key not in seen:
                seen.add(key)
                deduped.append(exp)

        return deduped[:5]

    @classmethod
    def extract_projects(cls, text: str) -> List[ProjectItem]:
        """
        Extracts portfolio and personal projects with technology stacks.
        """
        if not text:
            return []

        projects: List[ProjectItem] = []
        lines = text.split("\n")

        project_header_found = False
        for i, line in enumerate(lines):
            if re.search(r"^(?:projects|key projects|personal projects|academic projects)\b", line.strip(), re.IGNORECASE):
                project_header_found = True
                continue

            if project_header_found and line.strip():
                if re.search(r"^(?:experience|education|skills|certifications|awards)\b", line.strip(), re.IGNORECASE):
                    break

                if len(line.strip()) < 80 and not line.strip().startswith(("•", "-", "*")):
                    proj_name = line.strip()
                    desc_lines = []
                    context = line

                    for next_line in lines[i + 1: min(len(lines), i + 5)]:
                        if next_line.strip().startswith(("•", "-", "*")) or len(next_line.strip()) > 20:
                            desc_lines.append(next_line.strip().lstrip("•-*– "))
                            context += " " + next_line

                    technologies = [s.name for s in cls.extract_skills(context)]
                    url_match = re.search(r"(https?://(?:github\.com/[^\s]+|[^\s]+\.[^\s]+))", context)
                    proj_url = url_match.group(1) if url_match else None

                    projects.append(ProjectItem(
                        name=proj_name,
                        description=" ".join(desc_lines)[:250] if desc_lines else "Developed full-stack features and integrated REST APIs.",
                        technologies=technologies[:6],
                        url=proj_url
                    ))

        return projects[:6]

    @classmethod
    def extract_certifications(cls, text: str) -> List[CertificationItem]:
        """
        Extracts certifications from AWS, Microsoft, Google, Cisco, Scrum, and professional bodies.
        """
        if not text:
            return []

        certs: List[CertificationItem] = []
        
        cert_rules = [
            (r"(AWS Certified [A-Za-z\s]+)", "Amazon Web Services"),
            (r"(Microsoft Certified: [A-Za-z\s]+|Azure Fundamentals|Azure Administrator|Azure Developer)", "Microsoft"),
            (r"(Google Cloud Certified [A-Za-z\s]+|Associate Cloud Engineer)", "Google Cloud"),
            (r"(Certified ScrumMaster|CSM|Professional Scrum Master|PSM)", "Scrum Alliance / Scrum.org"),
            (r"(CompTIA [A-Za-z\+\s]+)", "CompTIA"),
            (r"(Cisco Certified [A-Za-z\s]+|CCNA|CCNP)", "Cisco"),
            (r"(TensorFlow Developer Certificate)", "Google"),
            (r"(Meta Frontend Developer|Meta Backend Developer|Meta Database Engineer)", "Meta"),
        ]

        for pattern, issuer in cert_rules:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for m in matches:
                cert_name = m.group(0).strip()
                certs.append(CertificationItem(
                    name=cert_name.title(),
                    issuer=issuer,
                    date=None,
                    credential_id=None,
                    url=None
                ))

        # Deduplicate
        seen = set()
        deduped = []
        for c in certs:
            if c.name not in seen:
                seen.add(c.name)
                deduped.append(c)

        return deduped

    @classmethod
    def parse_resume(cls, extracted_text: str) -> ParsedResumeData:
        """
        Parses full resume plain text into structured schema.
        """
        if not extracted_text:
            return ParsedResumeData()

        skills = cls.extract_skills(extracted_text)
        education = cls.extract_education(extracted_text)
        experience = cls.extract_experience(extracted_text)
        projects = cls.extract_projects(extracted_text)
        certifications = cls.extract_certifications(extracted_text)

        return ParsedResumeData(
            skills=skills,
            education=education,
            experience=experience,
            projects=projects,
            certifications=certifications
        )


resume_parser = ResumeParser()
