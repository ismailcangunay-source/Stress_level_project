"""
email_service.py
Sends password-reset e-mails via Resend's REST API (https://resend.com).
Falls back to printing the reset link in the logs when env vars are missing.
"""
from __future__ import annotations

import logging
import os

import httpx

logger = logging.getLogger("email_service")

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
MAIL_FROM = os.getenv("MAIL_FROM", "")
RESEND_API_URL = "https://api.resend.com/emails"


def send_password_reset_email(to_email: str, reset_link: str) -> None:
    """
    Attempts to send a password-reset e-mail.
    Never raises — logs errors silently so the endpoint always returns 200.
    """
    if not RESEND_API_KEY or not MAIL_FROM:
        logger.warning(
            "[email] RESEND_API_KEY or MAIL_FROM not configured. "
            f"Password reset link (log only): {reset_link}"
        )
        return

    html_body = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2>Şifre Sıfırlama Talebi</h2>
      <p>Aşağıdaki bağlantıya tıklayarak şifrenizi sıfırlayabilirsiniz.
         Bağlantı <strong>30 dakika</strong> içinde geçerliliğini yitirecektir.</p>
      <p>
        <a href="{reset_link}" style="
          display:inline-block;padding:12px 24px;
          background:#8b5cf6;color:#fff;border-radius:8px;
          text-decoration:none;font-weight:600">
          Şifremi Sıfırla
        </a>
      </p>
      <p style="font-size:0.85rem;color:#6b7280">
        Bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.
      </p>
    </div>
    """

    payload = {
        "from": MAIL_FROM,
        "to": [to_email],
        "subject": "StressTahmin — Şifre Sıfırlama",
        "html": html_body,
    }

    try:
        resp = httpx.post(
            RESEND_API_URL,
            headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
            json=payload,
            timeout=10,
        )
        if resp.status_code not in (200, 201):
            logger.error(f"[email] Resend API returned {resp.status_code}: {resp.text}")
        else:
            logger.info(f"[email] Reset e-mail sent to {to_email}")
    except Exception as exc:
        logger.error(f"[email] Failed to send reset e-mail: {exc}")
        # Log the link so demo testing is still possible
        logger.warning(f"[email] Reset link (log fallback): {reset_link}")
