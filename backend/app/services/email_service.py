"""
Service d'envoi d'e-mails.
En mode dev (SMTP_USER vide) : affiche le lien dans les logs au lieu d'envoyer.
En production : configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD dans .env
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger(__name__)


def send_reset_email(to_email: str, reset_link: str) -> None:
    subject = "Réinitialisation de votre mot de passe — Legacy"
    html = f"""
    <div style="font-family: Inter, sans-serif; max-width: 480px; margin: auto; padding: 40px 32px; background: #fff; border: 1px solid #E5E7EB; border-radius: 12px;">
      <img src="{settings.FRONTEND_URL}/Logo.png" alt="Legacy" width="48" style="display:block;margin:0 auto 16px;"/>
      <h2 style="text-align:center;color:#1B4D2E;font-family:Georgia,serif;letter-spacing:3px;font-size:20px;margin:0 0 24px;">LEGACY</h2>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Vous avez demandé la réinitialisation de votre mot de passe.<br/>
        Cliquez sur le bouton ci-dessous — ce lien est valable <strong>1 heure</strong>.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="{reset_link}" style="display:inline-block;padding:13px 32px;background:#1B4D2E;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
          Réinitialiser mon mot de passe
        </a>
      </div>
      <p style="color:#9CA3AF;font-size:12px;text-align:center;margin:0;">
        Si vous n'avez pas fait cette demande, ignorez simplement cet e-mail.
      </p>
    </div>
    """

    # Mode développement : log le lien si SMTP non configuré
    if not settings.SMTP_USER:
        logger.warning("=" * 60)
        logger.warning("📧 [DEV MODE] Lien de réinitialisation pour %s :", to_email)
        logger.warning(reset_link)
        logger.warning("=" * 60)
        return

    # Mode production : envoi SMTP réel
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = settings.EMAIL_FROM
        msg["To"]      = to_email
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, to_email, msg.as_string())

        logger.info("Email de réinitialisation envoyé à %s", to_email)
    except Exception as e:
        logger.error("Erreur envoi email à %s : %s", to_email, e)
        raise
