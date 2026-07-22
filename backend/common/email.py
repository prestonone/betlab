import json
import logging
from urllib import error, request

from django.conf import settings

logger = logging.getLogger(__name__)


class EmailSendError(Exception):
    """Raised when a transactional email could not be sent via Resend."""


def send_email(*, to: str, subject: str, html: str, text: str = "") -> None:
    if not settings.RESEND_API_KEY:
        raise EmailSendError("RESEND_API_KEY is not configured.")

    payload = {
        "from": settings.DEFAULT_FROM_EMAIL,
        "to": [to],
        "subject": subject,
        "html": html,
    }
    if text:
        payload["text"] = text

    body = json.dumps(payload).encode("utf-8")

    email_request = request.Request(
        "https://api.resend.com/emails",
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {settings.RESEND_API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "BetLab-Backend/1.0",
        },
    )

    try:
        with request.urlopen(email_request, timeout=10) as response:
            response.read()
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        logger.error("Resend request failed (%s): %s", exc.code, detail)
        raise EmailSendError("The email provider rejected the request.") from exc
    except (error.URLError, TimeoutError) as exc:
        logger.error("Resend request could not be sent: %s", exc)
        raise EmailSendError("The email provider is temporarily unavailable.") from exc
