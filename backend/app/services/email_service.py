"""
Service d'envoi d'e-mails.
En mode dev (SMTP_USER vide) : affiche dans les logs.
En production : configure SMTP dans .env
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger(__name__)


def _send(to_email: str, subject: str, html: str) -> None:
    if not settings.SMTP_USER:
        logger.warning("=" * 60)
        logger.warning("EMAIL [DEV] -> %s | %s", to_email, subject)
        logger.warning(html)
        logger.warning("=" * 60)
        return
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = settings.EMAIL_FROM
        msg["To"]      = to_email
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo(); server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, to_email, msg.as_string())
        logger.info("Email envoye a %s", to_email)
    except Exception as e:
        logger.error("Erreur envoi email a %s : %s", to_email, e)
        raise


def send_temp_password_email(to_email: str, temp_password: str, user_name: str = "") -> None:
    """Envoie le mot de passe temporaire a l'utilisateur."""
    subject = "Votre mot de passe temporaire, Legacy"
    html = f"""
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:auto;padding:40px 32px;background:#fff;border:1px solid #E5E7EB;border-radius:12px;">
      <h2 style="text-align:center;color:#1B4D2E;font-family:Georgia,serif;letter-spacing:3px;font-size:20px;margin:0 0 24px;">LEGACY</h2>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Bonjour{' ' + user_name if user_name else ''},<br/><br/>
        Voici votre <strong>mot de passe temporaire</strong> pour vous connecter a Legacy :
      </p>
      <div style="text-align:center;margin:28px 0;">
        <div style="display:inline-block;padding:16px 32px;background:#F3F4F6;border:2px dashed #D1D5DB;border-radius:10px;font-family:monospace;font-size:22px;font-weight:700;color:#111827;letter-spacing:3px;">
          {temp_password}
        </div>
      </div>
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Connectez-vous avec ce mot de passe, puis vous serez invite a le personnaliser immediatement.
      </p>
      <p style="color:#9CA3AF;font-size:12px;text-align:center;margin:24px 0 0;">
        Si vous n'avez pas fait cette demande, ignorez cet e-mail.
      </p>
    </div>
    """
    _send(to_email, subject, html)


def send_reset_email(to_email: str, reset_link: str) -> None:
    """Kept for compatibility, not used in new flow."""
    subject = "Reinitialisation de votre mot de passe, Legacy"
    html = f"""<div style="font-family:Inter,sans-serif;max-width:480px;margin:auto;padding:40px 32px;">
      <h2 style="color:#1B4D2E;">LEGACY</h2>
      <p>Cliquez sur ce lien pour reinitialiser votre mot de passe :</p>
      <a href="{reset_link}" style="background:#1B4D2E;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
        Reinitialiser
      </a>
    </div>"""
    _send(to_email, subject, html)
