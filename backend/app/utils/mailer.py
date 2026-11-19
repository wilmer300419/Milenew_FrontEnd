"""Envío de correos. Sin MAIL_SERVER, el mensaje se imprime en la consola (desarrollo)."""
import smtplib
from email.message import EmailMessage

from flask import current_app


def send_mail(to, subject, body):
    cfg = current_app.config
    if not cfg.get("MAIL_SERVER"):
        current_app.logger.warning(
            "\n===== CORREO (modo desarrollo, no se envió) =====\nPara: %s\nAsunto: %s\n\n%s\n"
            "=================================================", to, subject, body,
        )
        return

    msg = EmailMessage()
    msg["From"] = cfg["MAIL_FROM"]
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)

    with smtplib.SMTP(cfg["MAIL_SERVER"], cfg["MAIL_PORT"], timeout=10) as smtp:
        if cfg.get("MAIL_USE_TLS"):
            smtp.starttls()
        if cfg.get("MAIL_USERNAME"):
            smtp.login(cfg["MAIL_USERNAME"], cfg["MAIL_PASSWORD"])
        smtp.send_message(msg)
