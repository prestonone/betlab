from django.conf import settings
from django.db import models
from django.utils import timezone


class Country(models.Model):
    name = models.CharField(max_length=100)
    iso_code = models.CharField(
        max_length=2,
        unique=True,
        help_text="ISO 3166-1 alpha-2 country code, such as NG or GH.",
    )
    default_currency = models.CharField(
        max_length=3,
        help_text="ISO 4217 currency code, such as NGN or GHS.",
    )
    currency_symbol = models.CharField(max_length=10)
    payment_provider = models.CharField(
        max_length=30,
        default="paystack",
    )

    is_active = models.BooleanField(default=True)
    checkout_enabled = models.BooleanField(
        default=False,
        help_text=(
            "Controls whether customers in this country can currently pay."
        ),
    )
    display_order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order", "name"]
        verbose_name_plural = "Countries"

    def save(self, *args, **kwargs):
        self.iso_code = self.iso_code.upper()
        self.default_currency = self.default_currency.upper()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.name} ({self.default_currency})"


class Plan(models.Model):
    code = models.SlugField(
        max_length=50,
        unique=True,
        help_text="Stable internal identifier used by the API and payment system.",
    )
    name = models.CharField(max_length=100)
    badge = models.CharField(
        max_length=10,
        blank=True,
        help_text="Optional customer-facing symbol, such as a trophy or crown.",
    )
    description = models.CharField(max_length=255, blank=True)

    duration_days = models.PositiveIntegerField()
    grace_period_days = models.PositiveIntegerField(default=3)

    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order", "name"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(duration_days__gt=0),
                name="plan_duration_days_greater_than_zero",
            ),
        ]

    def __str__(self) -> str:
        prefix = f"{self.badge} " if self.badge else ""
        return f"{prefix}{self.name}"


class PlanPrice(models.Model):
    plan = models.ForeignKey(
        Plan,
        on_delete=models.CASCADE,
        related_name="prices",
    )
    country = models.ForeignKey(
        Country,
        on_delete=models.PROTECT,
        related_name="plan_prices",
    )

    currency = models.CharField(
        max_length=3,
        help_text="ISO 4217 currency code.",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = [
            "country__display_order",
            "plan__display_order",
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["plan", "country", "currency"],
                name="unique_plan_country_currency_price",
            ),
            models.CheckConstraint(
                condition=models.Q(amount__gte=0),
                name="plan_price_amount_not_negative",
            ),
        ]

    def save(self, *args, **kwargs):
        self.currency = self.currency.upper()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return (
            f"{self.plan.name} — {self.country.name} — "
            f"{self.currency} {self.amount}"
        )


class BillingProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="billing_profile",
    )
    country = models.ForeignKey(
        Country,
        on_delete=models.PROTECT,
        related_name="billing_profiles",
    )

    country_locked = models.BooleanField(
        default=False,
        help_text=(
            "Lock after the first successful payment to prevent "
            "unauthorised regional price switching."
        ),
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.user} — {self.country.name}"


class Subscription(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACTIVE = "active", "Active"
        GRACE = "grace", "Grace Period"
        EXPIRED = "expired", "Expired"
        CANCELLED = "cancelled", "Cancelled"

    class Source(models.TextChoices):
        PAYSTACK = "paystack", "Paystack"
        COMPLIMENTARY = "complimentary", "Complimentary"
        ADMIN = "admin", "Admin"
        GIFT = "gift", "Gift"
        REFERRAL = "referral", "Referral Reward"
        LOYALTY = "loyalty", "Loyalty Reward"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscriptions",
    )
    plan = models.ForeignKey(
        Plan,
        on_delete=models.PROTECT,
        related_name="subscriptions",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    source = models.CharField(
        max_length=20,
        choices=Source.choices,
        default=Source.PAYSTACK,
    )

    starts_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
    )
    grace_ends_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
    )

    auto_renew = models.BooleanField(default=False)

    gifted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="gifted_subscriptions",
    )
    recipient_email = models.EmailField(blank=True)

    internal_note = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["user", "status"],
                name="subscription_user_status_idx",
            ),
        ]

    def __str__(self) -> str:
        return (
            f"{self.user} — {self.plan.name} — "
            f"{self.get_status_display()}"
        )

    @property
    def is_accessible(self) -> bool:
        now = timezone.now()

        if self.status == self.Status.ACTIVE:
            return (
                self.expires_at is not None
                and now < self.expires_at
            )

        if self.status == self.Status.GRACE:
            return (
                self.grace_ends_at is not None
                and now < self.grace_ends_at
            )

        return False
