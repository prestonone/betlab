from collections.abc import Callable
from dataclasses import dataclass

from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from common.email import EmailSendError, send_batch_emails
from common.utils import get_client_ip

from .models import MarketingConsent, MarketingEmailSend, PolicyDocument, UserPolicyAcceptance
from .tokens import unsubscribe_token


class PolicyNotConfigured(Exception):
    """Raised when a required policy has no active PolicyDocument version.
    This should never happen once seed_legal_policies has been run, but we
    fail loudly rather than silently create a user with a missing consent
    record."""


def record_acceptance(*, user, policy_type: str, source: str, request=None) -> UserPolicyAcceptance:
    policy = PolicyDocument.current(policy_type)
    if policy is None:
        raise PolicyNotConfigured(f"No active PolicyDocument for '{policy_type}'.")

    return UserPolicyAcceptance.objects.create(
        user=user,
        policy=policy,
        acceptance_source=source,
        ip_address=get_client_ip(request) if request is not None else None,
        user_agent=(request.META.get("HTTP_USER_AGENT", "")[:1000] if request is not None else ""),
    )


def has_current_acceptance(*, user, policy_type: str) -> bool:
    policy = PolicyDocument.current(policy_type)
    if policy is None:
        return False
    return UserPolicyAcceptance.objects.filter(user=user, policy=policy).exists()


def record_marketing_consent(*, user, opted_in: bool, source: str, request=None) -> MarketingConsent:
    consent, _ = MarketingConsent.objects.get_or_create(user=user)
    now = timezone.now()

    if opted_in:
        consent.status = MarketingConsent.Status.OPTED_IN
        consent.consented_at = now
        consent.source = source
    else:
        consent.status = MarketingConsent.Status.OPTED_OUT
        consent.withdrawn_at = now if consent.consented_at else consent.withdrawn_at

    current_privacy = PolicyDocument.current(PolicyDocument.PolicyType.PRIVACY_POLICY)
    consent.notice_version = current_privacy.version if current_privacy else ""
    if request is not None:
        consent.ip_address = get_client_ip(request)
        consent.user_agent = request.META.get("HTTP_USER_AGENT", "")[:1000]
    consent.save()
    return consent


def record_registration_consent(
    *,
    user,
    accepted_terms: bool,
    acknowledged_privacy: bool,
    confirmed_age_and_risk: bool,
    marketing_consent: bool,
    request=None,
) -> None:
    """Record every acceptance implied by the registration form. Called
    inside the same atomic transaction as user creation, so a
    PolicyNotConfigured failure rolls the whole registration back."""

    if accepted_terms:
        record_acceptance(user=user, policy_type=PolicyDocument.PolicyType.TERMS_OF_SERVICE, source=UserPolicyAcceptance.Source.WEB_SIGNUP, request=request)
        record_acceptance(user=user, policy_type=PolicyDocument.PolicyType.TERMS_OF_USE, source=UserPolicyAcceptance.Source.WEB_SIGNUP, request=request)

    if acknowledged_privacy:
        record_acceptance(user=user, policy_type=PolicyDocument.PolicyType.PRIVACY_POLICY, source=UserPolicyAcceptance.Source.WEB_SIGNUP, request=request)

    if confirmed_age_and_risk:
        record_acceptance(user=user, policy_type=PolicyDocument.PolicyType.RISK_DISCLOSURE, source=UserPolicyAcceptance.Source.WEB_SIGNUP, request=request)
        record_acceptance(user=user, policy_type=PolicyDocument.PolicyType.DISCLAIMER, source=UserPolicyAcceptance.Source.WEB_SIGNUP, request=request)

    record_marketing_consent(user=user, opted_in=marketing_consent, source="web_signup", request=request)


def build_unsubscribe_url(user) -> str:
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = unsubscribe_token.make_token(user)
    return f"{settings.FRONTEND_URL}/unsubscribe?uid={uid}&token={token}"


def marketing_campaign_recipients():
    """Active users who have explicitly opted into marketing communications."""
    return (
        get_user_model()
        .objects.filter(
            marketing_consent__status=MarketingConsent.Status.OPTED_IN,
            is_active=True,
        )
        .exclude(email="")
        .order_by("pk")
        .distinct()
    )


@dataclass(frozen=True)
class MarketingCampaignResult:
    total_recipients: int = 0
    sent: int = 0
    failed: int = 0
    already_sent: int = 0


def send_marketing_campaign_email(
    *,
    campaign: str,
    subject: str,
    build_email: Callable[[str], tuple[str, str]],
) -> MarketingCampaignResult:
    """Send a one-off marketing email to every opted-in recipient, tracked
    per (campaign, user) so a re-run after a partial failure only retries
    what didn't already succeed. `build_email` receives that recipient's
    personalized unsubscribe URL and must return (html, text)."""

    total_recipients = 0
    sent = 0
    failed = 0
    already_sent = 0

    pending = []

    for user in marketing_campaign_recipients().iterator():
        total_recipients += 1
        notification, _ = MarketingEmailSend.objects.get_or_create(
            campaign=campaign,
            user=user,
            defaults={"email": user.email},
        )

        if notification.status == MarketingEmailSend.Status.SENT:
            already_sent += 1
            continue

        notification.email = user.email
        notification.attempt_count += 1
        notification.last_error = ""
        notification.save(
            update_fields=["email", "attempt_count", "last_error", "updated_at"]
        )

        pending.append((notification, user))

    for batch_number, start in enumerate(range(0, len(pending), 100), start=1):
        batch = pending[start : start + 100]
        emails = []
        for notification, user in batch:
            html, text = build_email(build_unsubscribe_url(user))
            emails.append(
                {
                    "from": settings.DEFAULT_FROM_EMAIL,
                    "to": [notification.email],
                    "subject": subject,
                    "html": html,
                    "text": text,
                }
            )
        idempotency_key = (
            f"{campaign}-batch-{batch_number}-"
            f"{batch[0][0].user_id}-{batch[-1][0].user_id}"
        )

        try:
            provider_ids = send_batch_emails(
                emails=emails,
                idempotency_key=idempotency_key,
            )
        except EmailSendError as exc:
            for notification, _user in batch:
                notification.status = MarketingEmailSend.Status.FAILED
                notification.last_error = str(exc)[:255]
                notification.updated_at = timezone.now()
            MarketingEmailSend.objects.bulk_update(
                [notification for notification, _user in batch],
                ["status", "last_error", "updated_at"],
            )
            failed += len(batch)
            continue

        sent_at = timezone.now()
        for (notification, _user), provider_id in zip(batch, provider_ids):
            notification.status = MarketingEmailSend.Status.SENT
            notification.provider_id = provider_id
            notification.sent_at = sent_at
            notification.updated_at = sent_at
        MarketingEmailSend.objects.bulk_update(
            [notification for notification, _user in batch],
            ["status", "provider_id", "sent_at", "updated_at"],
        )
        sent += len(batch)

    return MarketingCampaignResult(
        total_recipients=total_recipients,
        sent=sent,
        failed=failed,
        already_sent=already_sent,
    )
