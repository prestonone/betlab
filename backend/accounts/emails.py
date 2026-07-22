from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from common.email import send_email
from common.email_templates import password_reset_email, verification_email

from .tokens import email_verification_token


def _uid_for(user) -> str:
    return urlsafe_base64_encode(force_bytes(user.pk))


def send_verification_email(user) -> None:
    uid = _uid_for(user)
    token = email_verification_token.make_token(user)
    link = f"{settings.FRONTEND_URL}/?verify=1&uid={uid}&token={token}"

    html, text = verification_email(link)
    send_email(
        to=user.email,
        subject="Verify your Bet Lab email address",
        html=html,
        text=text,
    )


def send_password_reset_email(user) -> None:
    uid = _uid_for(user)
    token = default_token_generator.make_token(user)
    link = f"{settings.FRONTEND_URL}/?reset=1&uid={uid}&token={token}"

    html, text = password_reset_email(link)
    send_email(
        to=user.email,
        subject="Reset your Bet Lab password",
        html=html,
        text=text,
    )
