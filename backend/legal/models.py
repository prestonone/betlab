from django.conf import settings
from django.db import models


class PolicyDocument(models.Model):
    """A versioned legal/policy document. Content itself is rendered on the
    frontend; this model exists to track which version of each policy is
    currently the one users must accept, and to let acceptances reference an
    immutable version."""

    class PolicyType(models.TextChoices):
        TERMS_OF_SERVICE = "terms_of_service", "Terms of Service"
        TERMS_OF_USE = "terms_of_use", "Terms of Use"
        PRIVACY_POLICY = "privacy_policy", "Privacy Policy"
        REFUND_POLICY = "refund_policy", "Refund and Subscription Policy"
        DISCLAIMER = "disclaimer", "Disclaimer and Responsible Use Policy"
        COOKIE_POLICY = "cookie_policy", "Cookie Policy"
        COPYRIGHT_POLICY = "copyright_policy", "Copyright and Intellectual Property Policy"
        ACCEPTABLE_USE = "acceptable_use", "Acceptable Use Policy"
        RISK_DISCLOSURE = "risk_disclosure", "Risk Disclosure Statement"
        RESPONSIBLE_GAMBLING = "responsible_gambling", "Responsible Gambling Statement"
        AML_KYC = "aml_kyc", "AML/KYC Statement"
        METHODOLOGY = "methodology", "Prediction Methodology"

    policy_type = models.CharField(
        max_length=32,
        choices=PolicyType.choices,
        help_text="Which policy this version belongs to.",
    )
    version = models.CharField(
        max_length=20,
        help_text="Human-readable version, e.g. '1.0'.",
    )
    effective_date = models.DateField(
        help_text="The date this version takes effect / was published.",
    )
    is_active = models.BooleanField(
        default=True,
        help_text=(
            "Whether this is the current required version for its policy_type. "
            "Only one version per policy_type should be active at a time."
        ),
    )
    is_material_change = models.BooleanField(
        default=False,
        help_text="Whether this version introduces changes significant enough to require existing users to re-accept.",
    )
    content_hash = models.CharField(
        max_length=64,
        blank=True,
        help_text="Optional integrity hash of the published content for this version.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["policy_type", "-effective_date"]
        constraints = [
            models.UniqueConstraint(
                fields=["policy_type", "version"],
                name="unique_policy_type_version",
            ),
        ]
        indexes = [
            models.Index(fields=["policy_type", "is_active"]),
        ]

    def __str__(self) -> str:
        return f"{self.get_policy_type_display()} v{self.version}"

    @classmethod
    def current(cls, policy_type: str) -> "PolicyDocument | None":
        """Return the currently-active version for a given policy type."""
        return (
            cls.objects.filter(policy_type=policy_type, is_active=True)
            .order_by("-effective_date")
            .first()
        )


class UserPolicyAcceptance(models.Model):
    """An append-only, auditable record that a user accepted a specific
    version of a specific policy. Never update or delete these in normal
    application flow - accepting a new version creates a new row."""

    class Source(models.TextChoices):
        WEB_SIGNUP = "web_signup", "Web signup"
        MOBILE_SIGNUP = "mobile_signup", "Mobile signup"
        CHECKOUT = "checkout", "Checkout"
        POLICY_UPDATE = "policy_update", "Policy update reacceptance"
        ADMIN = "admin", "Admin action"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="policy_acceptances",
    )
    policy = models.ForeignKey(
        PolicyDocument,
        on_delete=models.PROTECT,
        related_name="acceptances",
    )
    accepted = models.BooleanField(default=True)
    accepted_at = models.DateTimeField(auto_now_add=True)
    acceptance_source = models.CharField(
        max_length=32,
        choices=Source.choices,
        default=Source.WEB_SIGNUP,
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-accepted_at"]
        indexes = [
            models.Index(fields=["user", "policy"]),
            models.Index(fields=["policy", "accepted_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.user} accepted {self.policy} at {self.accepted_at:%Y-%m-%d}"


class MarketingConsent(models.Model):
    """Current marketing-communication consent state for a user. Unlike
    UserPolicyAcceptance this is a live current-state record (one per user),
    since consent can be withdrawn at any time."""

    class Status(models.TextChoices):
        OPTED_IN = "opted_in", "Opted in"
        OPTED_OUT = "opted_out", "Opted out"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="marketing_consent",
    )
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.OPTED_OUT,
    )
    consented_at = models.DateTimeField(null=True, blank=True)
    withdrawn_at = models.DateTimeField(null=True, blank=True)
    source = models.CharField(max_length=32, blank=True)
    notice_version = models.CharField(max_length=20, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.user}: {self.status}"
