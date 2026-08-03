from dataclasses import dataclass

from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone

from django.conf import settings

from common.email import EmailSendError, send_batch_emails
from common.email_templates import prediction_published_email
from subscriptions.models import Subscription

from .models import Prediction, PredictionPublicationNotification


@dataclass(frozen=True)
class PublicationNotificationResult:
    sent: int = 0
    failed: int = 0
    already_sent: int = 0


def _current_member_users():
    now = timezone.now()
    accessible_subscription = Q(
        subscriptions__status=Subscription.Status.ACTIVE,
        subscriptions__expires_at__gt=now,
    ) | Q(
        subscriptions__status=Subscription.Status.GRACE,
        subscriptions__grace_ends_at__gt=now,
    )

    return (
        get_user_model()
        .objects.filter(
            accessible_subscription,
            is_active=True,
        )
        .exclude(email="")
        .order_by("pk")
        .distinct()
    )


def notify_members_prediction_published(
    prediction: Prediction,
) -> PublicationNotificationResult:
    if (
        prediction.status != Prediction.Status.PUBLISHED
        or not prediction.is_published
    ):
        raise ValueError(
            "Member notifications can only be sent for a published prediction."
        )

    html, text = prediction_published_email(prediction)
    subject = "Today's Bet Lab intelligence is now live"
    sent = 0
    failed = 0
    already_sent = 0

    pending_notifications = []

    for user in _current_member_users().iterator():
        notification, _ = PredictionPublicationNotification.objects.get_or_create(
            prediction=prediction,
            user=user,
            defaults={"email": user.email},
        )

        if notification.status == PredictionPublicationNotification.Status.SENT:
            already_sent += 1
            continue

        notification.email = user.email
        notification.attempt_count += 1
        notification.last_error = ""
        notification.save(
            update_fields=[
                "email",
                "attempt_count",
                "last_error",
                "updated_at",
            ]
        )

        pending_notifications.append(notification)

    for batch_number, start in enumerate(
        range(0, len(pending_notifications), 100),
        start=1,
    ):
        batch = pending_notifications[start : start + 100]
        emails = [
            {
                "from": settings.DEFAULT_FROM_EMAIL,
                "to": [notification.email],
                "subject": subject,
                "html": html,
                "text": text,
            }
            for notification in batch
        ]
        idempotency_key = (
            f"prediction-{prediction.pk}-publication-batch-{batch_number}-"
            f"{batch[0].user_id}-{batch[-1].user_id}"
        )

        try:
            provider_ids = send_batch_emails(
                emails=emails,
                idempotency_key=idempotency_key,
            )
        except EmailSendError as exc:
            for notification in batch:
                notification.status = (
                    PredictionPublicationNotification.Status.FAILED
                )
                notification.last_error = str(exc)[:255]
                notification.updated_at = timezone.now()
            PredictionPublicationNotification.objects.bulk_update(
                batch,
                ["status", "last_error", "updated_at"],
            )
            failed += len(batch)
            continue

        sent_at = timezone.now()
        for notification, provider_id in zip(batch, provider_ids):
            notification.status = PredictionPublicationNotification.Status.SENT
            notification.provider_id = provider_id
            notification.sent_at = sent_at
            notification.updated_at = sent_at
        PredictionPublicationNotification.objects.bulk_update(
            batch,
            ["status", "provider_id", "sent_at", "updated_at"],
        )
        sent += len(batch)

    return PublicationNotificationResult(
        sent=sent,
        failed=failed,
        already_sent=already_sent,
    )
