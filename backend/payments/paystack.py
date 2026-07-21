import json
from urllib import error, request

from django.conf import settings


class PaystackError(Exception):
    """A safe, user-facing Paystack integration error."""


def _request(path: str, *, payload: dict | None = None) -> dict:
    if not settings.PAYSTACK_SECRET_KEY:
        raise PaystackError("Payment processing is not configured.")

    body = None if payload is None else json.dumps(payload).encode("utf-8")
    paystack_request = request.Request(
        f"{settings.PAYSTACK_API_URL.rstrip('/')}/{path.lstrip('/')}",
        data=body,
        headers={
            "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json",
        },
        method="POST" if payload is not None else "GET",
    )

    try:
        with request.urlopen(paystack_request, timeout=10) as response:
            result = json.loads(response.read().decode("utf-8"))
    except (error.HTTPError, error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise PaystackError("The payment provider is temporarily unavailable.") from exc

    if not result.get("status") or not isinstance(result.get("data"), dict):
        raise PaystackError("The payment provider rejected the request.")

    return result["data"]


def initialize_transaction(payload: dict) -> dict:
    return _request("transaction/initialize", payload=payload)


def verify_transaction(reference: str) -> dict:
    return _request(f"transaction/verify/{reference}")
