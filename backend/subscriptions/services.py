from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from .models import Plan, Subscription


User = get_user_model()


def refresh_subscription_status(subscription: Subscription) -> Subscription:
    """
    Update a subscription's status according to its expiry and grace dates.
    """
    now = timezone.now()
    changed_fields: list[str] = []

    if (
        subscription.status == Subscription.Status.ACTIVE
        and subscription.expires_at
        and now >= subscription.expires_at
    ):
        if subscription.grace_ends_at and now < subscription.grace_ends_at:
            subscription.status = Subscription.Status.GRACE
        else:
            subscription.status = Subscription.Status.EXPIRED

        changed_fields.append("status")

    elif (
        subscription.status == Subscription.Status.GRACE
        and subscription.grace_ends_at
        and now >= subscription.grace_ends_at
    ):
        subscription.status = Subscription.Status.EXPIRED
        changed_fields.append("status")

    if changed_fields:
        subscription.save(update_fields=[*changed_fields, "updated_at"])

    return subscription


def get_current_subscription(user: User) -> Subscription | None:
    """
    Return the user's newest accessible subscription, if one exists.
    """
    subscriptions = (
        Subscription.objects
        .filter(
            user=user,
            status__in=[
                Subscription.Status.ACTIVE,
                Subscription.Status.GRACE,
            ],
        )
        .select_related("plan")
        .order_by("-expires_at", "-created_at")
    )

    for subscription in subscriptions:
        refresh_subscription_status(subscription)

        if subscription.is_accessible:
            return subscription

    return None


def has_active_membership(user: User) -> bool:
    if not user or not user.is_authenticated:
        return False

    return get_current_subscription(user) is not None


@transaction.atomic
def activate_or_extend_subscription(
    *,
    user: User,
    plan: Plan,
    source: str = Subscription.Source.PAYSTACK,
    gifted_by: User | None = None,
    recipient_email: str = "",
    internal_note: str = "",
) -> Subscription:
    """
    Activate a new subscription or extend the user's current membership.

    When the user still has access, the new duration begins after the existing
    access ends. Otherwise it begins immediately.
    """
    now = timezone.now()
    current = get_current_subscription(user)

    if current and current.grace_ends_at and current.grace_ends_at > now:
        base_time = current.grace_ends_at
    elif current and current.expires_at and current.expires_at > now:
        base_time = current.expires_at
    else:
        base_time = now

    expires_at = base_time + timedelta(days=plan.duration_days)
    grace_ends_at = expires_at + timedelta(days=plan.grace_period_days)

    return Subscription.objects.create(
        user=user,
        plan=plan,
        status=Subscription.Status.ACTIVE,
        source=source,
        starts_at=now,
        expires_at=expires_at,
        grace_ends_at=grace_ends_at,
        gifted_by=gifted_by,
        recipient_email=recipient_email,
        internal_note=internal_note,
    )


@transaction.atomic
def grant_complimentary_access(
    *,
    user: User,
    plan: Plan,
    internal_note: str = "",
) -> Subscription:
    return activate_or_extend_subscription(
        user=user,
        plan=plan,
        source=Subscription.Source.COMPLIMENTARY,
        internal_note=internal_note,
    )
