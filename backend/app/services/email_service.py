import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("uvicorn.error")


class EmailService:
    """
    Handles outbound email delivery for verification codes, alerts, and platform notifications.
    Supports secure SMTP with TLS/SSL, fallback error isolation, and development mock modes.
    """

    @classmethod
    def send_signup_otp(cls, to_email: str, otp: str, name: Optional[str] = None) -> bool:
        """
        Sends the 6-digit signup verification OTP to candidate's email address.
        """
        candidate_name = name or "Candidate"
        subject = "Ideal SkillSet - Verify Your Email"

        # 1. Plain text email body
        text_body = f"""Hello {candidate_name},

Your Ideal SkillSet verification code is:

{otp}

This code will expire in 10 minutes.

If you did not request this signup, you can safely ignore this email.

Best regards,
The Ideal SkillSet Team
"""

        # 2. Rich HTML email body
        html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ideal SkillSet - Verify Your Email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #1e40af, #4338ca); padding: 28px 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Ideal SkillSet</h1>
      <p style="color: #c7d2fe; margin: 4px 0 0 0; font-size: 13px;">AI-Powered Career Readiness Platform</p>
    </div>
    <div style="padding: 32px 28px; color: #1e293b;">
      <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 12px 0; color: #0f172a;">Verify Your Email Address</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
        Hello <strong>{candidate_name}</strong>,<br>
        Thank you for joining Ideal SkillSet. Use the verification code below to complete your account setup:
      </p>

      <div style="background-color: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e40af; display: inline-block;">
          {otp}
        </span>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b; font-weight: 600;">
          ⏳ Expires in 10 minutes (Single use only)
        </p>
      </div>

      <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 0 0 16px 0;">
        If you did not initiate this account creation, please ignore this email. Your email address will remain secure.
      </p>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;">
      <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
        &copy; 2026 Ideal SkillSet Inc. • Automated System Notification
      </p>
    </div>
  </div>
</body>
</html>
"""

        # 3. If SMTP is configured, attempt real email delivery
        if settings.SMTP_HOST and settings.SMTP_HOST.strip():
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
                msg["To"] = to_email

                part1 = MIMEText(text_body, "plain", "utf-8")
                part2 = MIMEText(html_body, "html", "utf-8")
                msg.attach(part1)
                msg.attach(part2)

                if settings.SMTP_PORT == 465:
                    server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
                else:
                    server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
                    if settings.SMTP_USE_TLS:
                        server.starttls()

                if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)

                server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())
                server.quit()
                logger.info(f"Successfully delivered signup OTP email to {to_email}")
                return True
            except Exception as exc:
                logger.error(f"SMTP error while sending OTP to {to_email}: {exc}")
                raise exc
        else:
            # Development Mode / Mock Email Delivery
            if settings.DEV_OTP_LOGGING:
                logger.info(f"[DEV_MODE_OTP] Verification code for {to_email}: {otp}")
            else:
                logger.info(f"[DEV_MODE] Mock email dispatch simulated for {to_email}")
            return True

