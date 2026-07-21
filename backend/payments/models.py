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
