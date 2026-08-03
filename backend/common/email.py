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


def send_batch_emails(
    *,
    emails: list[dict],
    idempotency_key: str,
) -> list[str]:
    if not settings.RESEND_API_KEY:
        raise EmailSendError("RESEND_API_KEY is not configured.")
    if not emails or len(emails) > 100:
        raise ValueError("A Resend batch must contain between 1 and 100 emails.")

    body = json.dumps(emails).encode("utf-8")
    email_request = request.Request(
        "https://api.resend.com/emails/batch",
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {settings.RESEND_API_KEY}",
            "Content-Type": "application/json",
            "Idempotency-Key": idempotency_key,
            "User-Agent": "BetLab-Backend/1.0",
        },
    )

    try:
        with request.urlopen(email_request, timeout=20) as response:
            response_data = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        logger.error("Resend batch request failed (%s): %s", exc.code, detail)
        raise EmailSendError("The email provider rejected the batch request.") from exc
    except (error.URLError, TimeoutError) as exc:
        logger.error("Resend batch request could not be sent: %s", exc)
        raise EmailSendError("The email provider is temporarily unavailable.") from exc
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        logger.error("Resend returned an invalid batch response: %s", exc)
        raise EmailSendError("The email provider returned an invalid response.") from exc

    items = response_data.get("data") if isinstance(response_data, dict) else None
    if (
        not isinstance(items, list)
        or len(items) != len(emails)
        or any(not isinstance(item, dict) or not item.get("id") for item in items)
    ):
        logger.error("Resend returned an incomplete batch response.")
        raise EmailSendError("The email provider returned an incomplete response.")

    return [str(item["id"]) for item in items]
