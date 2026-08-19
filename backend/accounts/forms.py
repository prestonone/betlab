import logging

from django.contrib.auth.forms import PasswordResetForm
from django.urls import reverse

from common.email import EmailSendError, send_email
from common.email_templates import password_reset_email

logger = logging.getLogger(__name__)


class AdminPasswordResetForm(PasswordResetForm):
    """Sends the admin password-reset link through the app's existing
    Resend-based email pipeline instead of Django's default EmailMessage
    send, which relies on an EMAIL_BACKEND this project doesn't configure."""

    def send_mail(
        self,
        subject_template_name,
        email_template_name,
        context,
        from_email,
        to_email,
        html_email_template_name=None,
    ):
        path = reverse(
            "password_reset_confirm",
            kwargs={"uidb64": context["uid"], "token": context["token"]},
        )
        link = f"{context['protocol']}://{context['domain']}{path}"
        html, text = password_reset_email(link)

        try:
            send_email(
                to=to_email,
                subject="Reset your Bet Lab admin password",
                html=html,
                text=text,
            )
        except EmailSendError:
            logger.exception("Could not deliver admin password reset email to %s", context["user"].pk)
