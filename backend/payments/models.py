from django.conf import settings
from django.db import models


class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"
        ABANDONED = "abandoned", "Abandoned"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="payments",
    )
    plan = models.ForeignKey(
        "subscriptions.Plan",
        on_delete=models.PROTECT,
        related_name="payments",
    )
    plan_price = models.ForeignKey(
        "subscriptions.PlanPrice",
        on_delete=models.PROTECT,
        related_name="payments",
    )
    subscription = models.OneToOneField(
        "subscriptions.Subscription",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="payment",
    )
    reference = models.CharField(max_length=100, unique=True)
    provider_reference = models.CharField(
        max_length=100,
        blank=True,
        db_index=True,
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    provider_metadata = models.JSONField(default=dict, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(amount__gt=0),
                name="payment_amount_greater_than_zero",
            ),
            models.UniqueConstraint(
                fields=["provider_reference"],
                condition=~models.Q(provider_reference=""),
                name="unique_nonempty_provider_reference",
            ),
        ]
        indexes = [
            models.Index(
                fields=["user", "status"],
                name="payment_user_status_idx",
            ),
        ]

    def save(self, *args, **kwargs):
        self.currency = self.currency.upper()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.reference} — {self.currency} {self.amount}"


class WebhookEvent(models.Model):
    """Audit log of every Paystack webhook received. Stores only enough to
    diagnose delivery problems — never the raw payload or signature."""

    class ProcessingStatus(models.TextChoices):
        PROCESSED = "processed", "Processed"
        IGNORED = "ignored", "Ignored"
        FAILED = "failed", "Failed"
        INVALID_SIGNATURE = "invalid_signature", "Invalid Signature"

    provider = models.CharField(max_length=30, default="paystack")
    event_type = models.CharField(max_length=100, blank=True)
    external_reference = models.CharField(max_length=100, blank=True, db_index=True)
    processing_status = models.CharField(
        max_length=20,
        choices=ProcessingStatus.choices,
        db_index=True,
    )
    failure_reason = models.CharField(max_length=255, blank=True)
    received_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    retry_count = models.PositiveIntegerField(default=0)
    resolved = models.BooleanField(default=False)

    class Meta:
        ordering = ["-received_at"]

    def __str__(self) -> str:
        return f"{self.provider} {self.event_type or 'event'} — {self.processing_status}"


class PaymentVerificationAttempt(models.Model):
    """Audit log of Paystack transaction-verification attempts (the
    VerifyPaymentView flow). Stores only enough to diagnose failures —
    never full provider responses or secrets."""

    class Status(models.TextChoices):
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"

    payment = models.ForeignKey(
        Payment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verification_attempts",
    )
    transaction_reference = models.CharField(max_length=100, db_index=True)
    provider = models.CharField(max_length=30, default="paystack")
    status = models.CharField(max_length=20, choices=Status.choices, db_index=True)
    response_code = models.CharField(max_length=30, blank=True)
    failure_reason = models.CharField(max_length=255, blank=True)
    attempted_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-attempted_at"]

    def __str__(self) -> str:
        return f"{self.transaction_reference} — {self.status}"
