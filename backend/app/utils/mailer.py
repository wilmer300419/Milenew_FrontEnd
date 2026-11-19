"""Envío de correos. Sin MAIL_SERVER, el mensaje se imprime en la consola (desarrollo)."""
import smtplib
from email.message import EmailMessage

from flask import current_app


def code_email_html(name, intro, code, minutes):
    """Correo con el código, con la estética de Milenew (HTML simple y compatible)."""
    return f"""<!doctype html><html lang="es"><body style="margin:0;background:#060607;padding:32px 16px;
font-family:Inter,Segoe UI,Roboto,Arial,sans-serif;color:#f1efea">
<table role="presentation" width="100%" style="max-width:460px;margin:0 auto;background:#111113;
border:1px solid #232326;border-radius:20px"><tr><td style="padding:28px">
<div style="font-weight:700;font-size:18px">Milenew</div>
<p style="color:#9a9790;font-size:14px;margin:18px 0 6px">Hola {name},</p>
<p style="font-size:15px;margin:0 0 18px">{intro}</p>
<div style="font-family:JetBrains Mono,Menlo,monospace;font-size:30px;letter-spacing:8px;
background:#1b1b1e;border-radius:14px;padding:16px;text-align:center;color:#c6a346">{code}</div>
<p style="color:#9a9790;font-size:13px;margin:18px 0 0">Vence en {minutes} minutos.
Si no fuiste tú, ignora este correo.</p></td></tr></table></body></html>"""


def send_mail(to, subject, body, html=None):
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
    if html:
        msg.add_alternative(html, subtype="html")

    with smtplib.SMTP(cfg["MAIL_SERVER"], cfg["MAIL_PORT"], timeout=10) as smtp:
        if cfg.get("MAIL_USE_TLS"):
            smtp.starttls()
        if cfg.get("MAIL_USERNAME"):
            smtp.login(cfg["MAIL_USERNAME"], cfg["MAIL_PASSWORD"])
        smtp.send_message(msg)
