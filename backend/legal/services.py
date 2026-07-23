from django.utils import timezone

from common.utils import get_client_ip

from .models import MarketingConsent, PolicyDocument, UserPolicyAcceptance


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
