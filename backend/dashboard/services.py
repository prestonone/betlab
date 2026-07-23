"""Aggregation logic for the Django Admin operations dashboard.

Every count here is computed from real data. Nothing is fabricated:
metrics with no real tracking source (email delivery, deployment metadata)
report a neutral "not configured" state instead of a fake number.
"""

import os
import time
from datetime import timedelta

from django.conf import settings
from django.core.cache import cache
from django.db import connection
from django.db.models import Count, F, Q, Sum
from django.urls import reverse
from django.utils import timezone

from accounts.models import User
from legal.models import PolicyDocument
from payments.models import Payment, PaymentVerificationAttempt, WebhookEvent
from predictions.models import Prediction, PredictionSelection
from subscriptions.models import Plan, Subscription

BUSINESS_METRICS_CACHE_SECONDS = 60
DB_HEALTH_CACHE_SECONDS = 15
PENDING_PAYMENT_ALERT_THRESHOLD = timedelta(hours=24)
DRAFT_APPROACHING_KICKOFF_WINDOW = timedelta(hours=2)

# The 10 policy types the current frontend/registry actually serves.
# terms_of_use and risk_disclosure remain in the PolicyType enum only for
# historical UserPolicyAcceptance rows recorded before they were merged
# into terms_of_service/disclaimer — they are intentionally excluded here.
REQUIRED_POLICY_TYPES = [
    PolicyDocument.PolicyType.TERMS_OF_SERVICE,
    PolicyDocument.PolicyType.PRIVACY_POLICY,
    PolicyDocument.PolicyType.REFUND_POLICY,
    PolicyDocument.PolicyType.DISCLAIMER,
    PolicyDocument.PolicyType.COOKIE_POLICY,
    PolicyDocument.PolicyType.COPYRIGHT_POLICY,
    PolicyDocument.PolicyType.ACCEPTABLE_USE,
    PolicyDocument.PolicyType.RESPONSIBLE_GAMBLING,
    PolicyDocument.PolicyType.AML_KYC,
    PolicyDocument.PolicyType.METHODOLOGY,
]

# A subscription counts as currently entitling access under the exact same
# rule as subscriptions.services.has_active_membership / Subscription.is_accessible:
# ACTIVE with expires_at in the future, or GRACE with grace_ends_at in the future.
def _accessible_subscription_q(now):
    return (
        Q(status=Subscription.Status.ACTIVE, expires_at__gt=now)
        | Q(status=Subscription.Status.GRACE, grace_ends_at__gt=now)
    )


def _admin_url(view_name, **params):
    url = reverse(view_name)
    if params:
        query = "&".join(f"{key}={value}" for key, value in params.items())
        url = f"{url}?{query}"
    return url


# ─── Match & Prediction Operations ─────────────────────────────────────────

def _awaiting_settlement_queryset():
    """Locked, multi-selection predictions with some (not all) selections
    resolved. Settlement auto-completes the moment the last selection is
    entered (see PredictionSelection.settle() -> recalculate_result()), so
    a locked prediction with a *fully* resolved result cannot exist at
    rest — this surfaces packages mid-way through result entry instead."""
    return (
        Prediction.objects.filter(status=Prediction.Status.LOCKED)
        .annotate(
            total_selections=Count("selections"),
            pending_selections=Count(
                "selections",
                filter=Q(selections__result_status=PredictionSelection.ResultStatus.PENDING),
            ),
        )
        .filter(pending_selections__gt=0, pending_selections__lt=F("total_selections"))
    )


def get_quick_actions():
    # Every other destination from the original spec list (today's games,
    # drafts, published, awaiting results/settlement, postponed/cancelled,
    # categories, selections, full history) is already reachable as one
    # of the cards below or as a plain link in the admin nav underneath —
    # "Add" is the one action that has no natural count/card of its own,
    # so it's the only thing that needs a dedicated button.
    return [
        {"label": "Add New Prediction", "url": _admin_url("admin:predictions_prediction_add")},
    ]


def _todays_games_url():
    today = timezone.localdate()
    return _admin_url(
        "admin:predictions_predictionselection_changelist",
        match_time__day=today.day,
        match_time__month=today.month,
        match_time__year=today.year,
    )


def get_match_operations_cards():
    today = timezone.localdate()

    games_today = PredictionSelection.objects.filter(match_time__date=today).count()
    draft = Prediction.objects.filter(status=Prediction.Status.DRAFT).count()
    published_today = Prediction.objects.filter(
        is_published=True, published_at__date=today,
    ).count()
    awaiting_result = Prediction.objects.filter(
        status=Prediction.Status.LOCKED, result_status=Prediction.ResultStatus.PENDING,
    ).count()
    awaiting_settlement = _awaiting_settlement_queryset().count()
    cancelled = Prediction.objects.filter(status=Prediction.Status.CANCELLED).count()
    recently_settled = Prediction.objects.filter(
        status=Prediction.Status.SETTLED,
        settled_at__gte=timezone.now() - timedelta(days=7),
    ).count()
    missing_info = Prediction.objects.filter(
        status__in=[Prediction.Status.SCHEDULED, Prediction.Status.PUBLISHED],
    ).filter(Q(selections__isnull=True) | Q(analysis="")).distinct().count()

    return [
        {"label": "Games Scheduled Today", "count": games_today, "url": _todays_games_url()},
        {"label": "Draft Predictions", "count": draft, "url": _admin_url("admin:predictions_prediction_changelist", status__exact=Prediction.Status.DRAFT)},
        {"label": "Published Predictions Today", "count": published_today, "url": _admin_url("admin:predictions_prediction_changelist", status__exact=Prediction.Status.PUBLISHED, published_at__day=today.day, published_at__month=today.month, published_at__year=today.year)},
        {"label": "Games Awaiting Results", "count": awaiting_result, "url": _admin_url("admin:predictions_prediction_changelist", awaiting_result="yes")},
        {"label": "Predictions Awaiting Settlement", "count": awaiting_settlement, "url": _admin_url("admin:predictions_prediction_changelist", awaiting_settlement="yes")},
        {"label": "Postponed or Cancelled Games", "count": cancelled, "url": _admin_url("admin:predictions_prediction_changelist", status__exact=Prediction.Status.CANCELLED)},
        {"label": "Recently Settled Predictions", "count": recently_settled, "url": _admin_url("admin:predictions_prediction_changelist", status__exact=Prediction.Status.SETTLED)},
        {"label": "Predictions Missing Required Information", "count": missing_info, "url": _admin_url("admin:predictions_prediction_changelist", missing_info="yes")},
    ]


def get_todays_games(limit=20):
    today = timezone.localdate()
    return (
        PredictionSelection.objects.filter(match_time__date=today)
        .select_related("prediction", "prediction__category")
        .order_by("match_time")[:limit]
    )


# ─── Business & System Overview ────────────────────────────────────────────

def _compute_business_metrics():
    now = timezone.now()
    today = timezone.localdate()
    accessible_q = _accessible_subscription_q(now)

    total_users = User.objects.count()

    active_subscribers = (
        Subscription.objects.filter(accessible_q)
        .values("user_id").distinct().count()
    )

    pending_payments = Payment.objects.filter(status=Payment.Status.PENDING).count()

    revenue_by_currency = list(
        Payment.objects.filter(
            status=Payment.Status.SUCCESS,
            paid_at__year=today.year,
            paid_at__month=today.month,
        )
        .values("currency")
        .annotate(total=Sum("amount"))
        .order_by("currency")
    )

    popular_plan = (
        Plan.objects.annotate(
            active_count=Count("subscriptions", filter=Q(subscriptions__in=(
                Subscription.objects.filter(accessible_q).values("pk")
            )))
        )
        .filter(active_count__gt=0)
        .order_by("-active_count")
        .first()
    )

    predictions_published_today = Prediction.objects.filter(
        is_published=True, published_at__date=today,
    ).count()

    failed_webhooks = WebhookEvent.objects.filter(
        processing_status__in=[
            WebhookEvent.ProcessingStatus.FAILED,
            WebhookEvent.ProcessingStatus.INVALID_SIGNATURE,
        ],
        resolved=False,
    ).count()

    failed_verifications = PaymentVerificationAttempt.objects.filter(
        status=PaymentVerificationAttempt.Status.FAILED,
        resolved=False,
    ).count()

    return {
        "total_users": total_users,
        "active_subscribers": active_subscribers,
        "pending_payments": pending_payments,
        "pending_payments_url": _admin_url("admin:payments_payment_changelist", status__exact=Payment.Status.PENDING),
        "revenue_by_currency": revenue_by_currency,
        "popular_plan": popular_plan.name if popular_plan else None,
        "popular_plan_count": getattr(popular_plan, "active_count", 0),
        "predictions_published_today": predictions_published_today,
        "failed_emails": {
            "tracked": False,
            "message": "Email delivery tracking is not configured.",
        },
        "failed_webhooks": failed_webhooks,
        "failed_webhooks_url": _admin_url("admin:payments_webhookevent_changelist", resolved__exact=0),
        "failed_verifications": failed_verifications,
        "failed_verifications_url": _admin_url("admin:payments_paymentverificationattempt_changelist", resolved__exact=0),
        "computed_at": now,
    }


def get_business_metrics():
    """Cached briefly (see BUSINESS_METRICS_CACHE_SECONDS) since these are
    reporting numbers, not the live operational workspace — a short-lived
    cache keeps repeated admin-index loads cheap without calling Paystack
    or any external provider on every render (none of these queries do)."""
    cached = cache.get("dashboard:business_metrics")
    if cached is not None:
        return cached
    metrics = _compute_business_metrics()
    cache.set("dashboard:business_metrics", metrics, BUSINESS_METRICS_CACHE_SECONDS)
    return metrics


def check_database_health():
    cached = cache.get("dashboard:db_health")
    if cached is not None:
        return cached

    started = time.monotonic()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        result = {
            "connected": True,
            "response_time_ms": round((time.monotonic() - started) * 1000, 1),
            "checked_at": timezone.now(),
        }
    except Exception:  # noqa: BLE001 — a health check must never raise
        result = {
            "connected": False,
            "response_time_ms": None,
            "checked_at": timezone.now(),
        }
    cache.set("dashboard:db_health", result, DB_HEALTH_CACHE_SECONDS)
    return result


def get_deployment_info():
    sha = os.getenv("APP_RELEASE_SHA", "")
    deployed_at = os.getenv("APP_DEPLOYED_AT", "")
    release_name = os.getenv("APP_RELEASE_NAME", "")

    if not sha and not deployed_at and not release_name:
        return {"configured": False, "message": "Deployment metadata not configured."}

    return {
        "configured": True,
        "short_sha": sha[:7] if sha else None,
        "deployed_at": deployed_at or None,
        "release_name": release_name or None,
    }


# ─── Alerts ─────────────────────────────────────────────────────────────

def get_alerts():
    now = timezone.now()
    alerts = []

    orphaned_payments = Payment.objects.filter(status=Payment.Status.SUCCESS).filter(
        Q(subscription__isnull=True)
        | ~Q(subscription__status__in=[Subscription.Status.ACTIVE, Subscription.Status.GRACE])
    ).count()
    if orphaned_payments:
        alerts.append({
            "severity": "critical",
            "description": "Successful payments without a currently active subscription.",
            "count": orphaned_payments,
            "action": "Investigate and manually activate or refund.",
            "url": _admin_url("admin:payments_payment_changelist", status__exact=Payment.Status.SUCCESS),
        })

    stale_pending = Payment.objects.filter(
        status=Payment.Status.PENDING,
        created_at__lt=now - PENDING_PAYMENT_ALERT_THRESHOLD,
    ).count()
    if stale_pending:
        alerts.append({
            "severity": "warning",
            "description": f"Payments pending for more than {PENDING_PAYMENT_ALERT_THRESHOLD.total_seconds() // 3600:.0f} hours.",
            "count": stale_pending,
            "action": "Verify manually or mark as abandoned.",
            "url": _admin_url("admin:payments_payment_changelist", status__exact=Payment.Status.PENDING),
        })

    failed_verifications = PaymentVerificationAttempt.objects.filter(
        status=PaymentVerificationAttempt.Status.FAILED, resolved=False,
    ).count()
    if failed_verifications:
        alerts.append({
            "severity": "warning",
            "description": "Unresolved failed Paystack verification attempts.",
            "count": failed_verifications,
            "action": "Review and resolve.",
            "url": _admin_url("admin:payments_paymentverificationattempt_changelist", resolved__exact=0),
        })

    failed_webhooks = WebhookEvent.objects.filter(
        processing_status__in=[WebhookEvent.ProcessingStatus.FAILED, WebhookEvent.ProcessingStatus.INVALID_SIGNATURE],
        resolved=False,
    ).count()
    if failed_webhooks:
        alerts.append({
            "severity": "warning",
            "description": "Unresolved failed webhook events.",
            "count": failed_webhooks,
            "action": "Review and resolve.",
            "url": _admin_url("admin:payments_webhookevent_changelist", resolved__exact=0),
        })

    overdue_lock = Prediction.objects.filter(
        status=Prediction.Status.PUBLISHED, selections__match_time__lt=now,
    ).distinct().count()
    if overdue_lock:
        alerts.append({
            "severity": "warning",
            "description": "Published predictions whose kick-off has passed but are not yet locked.",
            "count": overdue_lock,
            "action": "Check that the lock_due_predictions scheduled task is running.",
            "url": _admin_url("admin:predictions_prediction_changelist", status__exact=Prediction.Status.PUBLISHED),
        })

    awaiting_settlement = _awaiting_settlement_queryset().count()
    if awaiting_settlement:
        alerts.append({
            "severity": "information",
            "description": "Multi-selection predictions with some results entered but not all — finish these to auto-settle.",
            "count": awaiting_settlement,
            "action": "Complete remaining selection results.",
            "url": _admin_url("admin:predictions_prediction_changelist", awaiting_settlement="yes"),
        })

    approaching_kickoff = Prediction.objects.filter(
        status=Prediction.Status.DRAFT,
        selections__match_time__range=(now, now + DRAFT_APPROACHING_KICKOFF_WINDOW),
    ).distinct().count()
    if approaching_kickoff:
        alerts.append({
            "severity": "critical",
            "description": "Draft predictions with kick-off within 2 hours that are still unpublished.",
            "count": approaching_kickoff,
            "action": "Publish now or cancel.",
            "url": _admin_url("admin:predictions_prediction_changelist", status__exact=Prediction.Status.DRAFT),
        })

    missing_info = Prediction.objects.filter(
        status__in=[Prediction.Status.SCHEDULED, Prediction.Status.PUBLISHED],
    ).filter(Q(selections__isnull=True) | Q(analysis="")).distinct().count()
    if missing_info:
        alerts.append({
            "severity": "warning",
            "description": "Published or scheduled predictions missing selections or analysis text.",
            "count": missing_info,
            "action": "Complete required fields.",
            "url": _admin_url("admin:predictions_prediction_changelist", missing_info="yes"),
        })

    inconsistent_subs = Subscription.objects.filter(status=Subscription.Status.ACTIVE).filter(
        Q(expires_at__isnull=True) | Q(starts_at__isnull=True) | Q(expires_at__lt=F("starts_at")),
    ).count()
    if inconsistent_subs:
        alerts.append({
            "severity": "critical",
            "description": "Active subscriptions with missing or inconsistent start/expiry dates.",
            "count": inconsistent_subs,
            "action": "Review and correct manually.",
            "url": _admin_url("admin:subscriptions_subscription_changelist", status__exact=Subscription.Status.ACTIVE),
        })

    active_types = set(
        PolicyDocument.objects.filter(is_active=True, policy_type__in=REQUIRED_POLICY_TYPES)
        .values_list("policy_type", flat=True)
    )
    missing_policies = [t for t in REQUIRED_POLICY_TYPES if t not in active_types]
    if missing_policies:
        alerts.append({
            "severity": "critical",
            "description": f"Missing a current published version for: {', '.join(missing_policies)}.",
            "count": len(missing_policies),
            "action": "Publish a current version in Legal & Compliance.",
            "url": _admin_url("admin:legal_policydocument_changelist"),
        })

    if not settings.LEGAL_BUSINESS_ADDRESS or not settings.LEGAL_BUSINESS_PHONE:
        alerts.append({
            "severity": "information",
            "description": "Business address and/or phone number is not configured for legal pages.",
            "count": None,
            "action": "Set LEGAL_BUSINESS_ADDRESS / LEGAL_BUSINESS_PHONE.",
            "url": None,
        })

    if not settings.PAYSTACK_SECRET_KEY:
        alerts.append({
            "severity": "critical",
            "description": "No Paystack secret key is configured for the active PAYSTACK_MODE — checkout will fail.",
            "count": None,
            "action": "Set PAYSTACK_TEST_SECRET_KEY / PAYSTACK_LIVE_SECRET_KEY.",
            "url": None,
        })

    if not settings.RESEND_API_KEY:
        alerts.append({
            "severity": "warning",
            "description": "No email provider API key configured — verification and notification emails will fail.",
            "count": None,
            "action": "Set RESEND_API_KEY.",
            "url": None,
        })

    db_health = check_database_health()
    if not db_health["connected"]:
        alerts.append({
            "severity": "critical",
            "description": "Database health check failed.",
            "count": None,
            "action": "Investigate database connectivity immediately.",
            "url": None,
        })

    return alerts


def get_recent_admin_activity(limit=8):
    from django.contrib.admin.models import LogEntry

    return (
        LogEntry.objects.select_related("user", "content_type")
        .order_by("-action_time")[:limit]
    )
