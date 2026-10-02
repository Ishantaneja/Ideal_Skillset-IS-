import io
import re
import html
from typing import List, Optional
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    HRFlowable,
    KeepTogether,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER


LINKIFY_EMAIL_RE = re.compile(r"\b[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\b")
LINKIFY_URL_RE = re.compile(r"\bhttps?://[^\s<>\"\'\)]+")
LINKIFY_BARE_LINK_RE = re.compile(r"(?<!/)(?<!/)\b(?:www\.)?(?:github\.com|linkedin\.com)/[a-zA-Z0-9_.-]+(?:/[^\s<>\"\'\)]*)?")


class ResumePDFGenerator:
    """
    Generates single-column, ATS-compliant, print-perfect PDF resumes
    using standard fonts and preserved, clickable hyperlinks.
    """

    @classmethod
    def _linkify_text(cls, text: str) -> str:
        """
        Escapes XML special characters and transforms URLs and email addresses
        into clickable hyperlinks, preserving the exact original URL.
        """
        if not text:
            return ""

        # 1. Escape HTML special characters
        escaped = html.escape(text)

        def replace_email(match):
            email_addr = match.group(0)
            return f'<a href="mailto:{email_addr}" color="#2563EB"><u>{email_addr}</u></a>'

        def replace_url(match):
            url = match.group(0)
            return f'<a href="{url}" color="#2563EB"><u>{url}</u></a>'

        def replace_bare_link(match):
            domain_url = match.group(0)
            return f'<a href="https://{domain_url}" color="#2563EB"><u>{domain_url}</u></a>'

        # 2. Convert email addresses
        escaped = LINKIFY_EMAIL_RE.sub(replace_email, escaped)

        # 3. Convert full http(s) URLs
        escaped = LINKIFY_URL_RE.sub(replace_url, escaped)

        # 4. Convert bare github.com and linkedin.com (not preceded by //)
        escaped = LINKIFY_BARE_LINK_RE.sub(replace_bare_link, escaped)

        return escaped

    @classmethod
    def generate_pdf(cls, tailored_text: str, document_title: str = "Tailored Resume") -> bytes:
        """
        Parses ATS single-column plain text and compiles a high-fidelity PDF.
        """
        buffer = io.BytesIO()

        # ATS Standard Margins: 0.5 inches (36 pt)
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=36,
            title=document_title,
            author="Ideal SkillSet AI Resume Tailorer",
        )

        styles = getSampleStyleSheet()

        # Typography System
        name_style = ParagraphStyle(
            "ATS_Name",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=17,
            leading=21,
            textColor=colors.HexColor("#0F172A"),
            alignment=TA_LEFT,
        )

        target_title_style = ParagraphStyle(
            "ATS_TargetTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10.5,
            leading=14,
            textColor=colors.HexColor("#2563EB"),
            spaceAfter=2,
        )

        contact_style = ParagraphStyle(
            "ATS_Contact",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor("#475569"),
            spaceAfter=6,
        )

        section_heading_style = ParagraphStyle(
            "ATS_SectionHeading",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=13,
            textColor=colors.HexColor("#0F172A"),
            spaceBefore=8,
            spaceAfter=2,
            keepWithNext=True,
        )

        item_title_style = ParagraphStyle(
            "ATS_ItemTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=12.5,
            textColor=colors.HexColor("#1E293B"),
            spaceBefore=4,
            spaceAfter=1,
            keepWithNext=True,
        )

        duration_style = ParagraphStyle(
            "ATS_Duration",
            parent=styles["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#64748B"),
            spaceAfter=2,
            keepWithNext=True,
        )

        bullet_style = ParagraphStyle(
            "ATS_Bullet",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor("#334155"),
            leftIndent=14,
            firstLineIndent=-10,
            spaceAfter=1.5,
        )

        body_style = ParagraphStyle(
            "ATS_Body",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=12.5,
            textColor=colors.HexColor("#334155"),
            spaceAfter=3,
        )

        story = []
        raw_lines = [line.strip() for line in tailored_text.splitlines()]

        # Filter out divider lines (like --------------------)
        clean_lines = []
        for line in raw_lines:
            if re.match(r"^-{3,}$", line):
                continue
            clean_lines.append(line)

        # Header parsing (lines before first empty line or first section heading)
        line_idx = 0
        candidate_name = ""
        target_role = ""
        contact_line = ""

        # Line 0: Candidate Name
        if line_idx < len(clean_lines) and clean_lines[line_idx]:
            candidate_name = clean_lines[line_idx]
            line_idx += 1

        # Line 1: Target Role Title
        if line_idx < len(clean_lines) and clean_lines[line_idx] and not cls._is_section_header(clean_lines[line_idx]):
            target_role = clean_lines[line_idx]
            line_idx += 1

        # Line 2: Contact Line with Links
        if line_idx < len(clean_lines) and clean_lines[line_idx] and not cls._is_section_header(clean_lines[line_idx]):
            contact_line = clean_lines[line_idx]
            line_idx += 1

        # Build Header Story
        if candidate_name:
            story.append(Paragraph(html.escape(candidate_name), name_style))
        if target_role:
            story.append(Paragraph(html.escape(target_role), target_title_style))
        if contact_line:
            linked_contact = cls._linkify_text(contact_line)
            story.append(Paragraph(linked_contact, contact_style))

        story.append(HRFlowable(width="100%", thickness=1.2, color=colors.HexColor("#CBD5E1"), spaceBefore=2, spaceAfter=6))

        # Body parsing
        while line_idx < len(clean_lines):
            line = clean_lines[line_idx]
            if not line:
                line_idx += 1
                continue

            # Check if section header
            if cls._is_section_header(line):
                story.append(Paragraph(html.escape(line), section_heading_style))
                story.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#E2E8F0"), spaceBefore=1, spaceAfter=4))
                line_idx += 1
                continue

            # Check if bullet item
            if line.startswith("•") or line.startswith("-") or line.startswith("*"):
                content = line.lstrip("•-* ").strip()
                # If bullet has bold prefix (e.g. Category: list)
                if ":" in content and not content.startswith("http"):
                    prefix, rest = content.split(":", 1)
                    bullet_html = f"&bull; <b>{html.escape(prefix.strip())}:</b> {cls._linkify_text(rest.strip())}"
                else:
                    bullet_html = f"&bull; {cls._linkify_text(content)}"
                story.append(Paragraph(bullet_html, bullet_style))
                line_idx += 1
                continue

            # Check if duration line (e.g. Duration: 2022 - Present)
            if line.lower().startswith("duration:"):
                story.append(Paragraph(cls._linkify_text(line), duration_style))
                line_idx += 1
                continue

            # Check if job title / company line (contains | or uppercase job title)
            if "|" in line and len(line) < 100:
                story.append(Paragraph(cls._linkify_text(line), item_title_style))
                line_idx += 1
                continue

            # Check if repository / project URL line
            if line.lower().startswith("repository:"):
                repo_linked = cls._linkify_text(line)
                story.append(Paragraph(f"&nbsp;&nbsp;{repo_linked}", body_style))
                line_idx += 1
                continue

            # Default paragraph
            story.append(Paragraph(cls._linkify_text(line), body_style))
            line_idx += 1

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes

    @classmethod
    def _is_section_header(cls, line: str) -> bool:
        """
        Recognizes standard ATS resume section headings.
        """
        normalized = line.strip().upper()
        headers = [
            "PROFESSIONAL SUMMARY",
            "SUMMARY",
            "EXECUTIVE SUMMARY",
            "CORE COMPETENCIES & TECHNICAL SKILLS",
            "CORE COMPETENCIES",
            "TECHNICAL SKILLS",
            "SKILLS",
            "PROFESSIONAL EXPERIENCE",
            "WORK EXPERIENCE",
            "EXPERIENCE",
            "EMPLOYMENT HISTORY",
            "TECHNICAL PROJECTS & CODE REPOSITORIES",
            "PROJECTS & CODE REPOSITORIES",
            "TECHNICAL PROJECTS",
            "PROJECTS",
            "EDUCATION",
            "ACADEMIC BACKGROUND",
            "CERTIFICATIONS & CREDENTIALS",
            "CERTIFICATIONS",
            "PUBLICATIONS",
            "AWARDS",
        ]
        return normalized in headers or (normalized.isupper() and len(normalized) < 45 and not normalized.startswith("•"))


pdf_generator = ResumePDFGenerator()
