"""Shared utility helpers for Bet Lab."""


def get_client_ip(request) -> str | None:
    """Best-effort client IP, trusting Render's X-Forwarded-For (the only
    proxy this app runs behind in production). Takes the first address in
    the chain, which is the original client."""
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")

