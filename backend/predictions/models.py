from django.conf import settings
from django.db import models


class PredictionCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "name"]
        verbose_name_plural = "Prediction categories"

    def __str__(self) -> str:
        return self.name


class Prediction(models.Model):
    class AccessLevel(models.TextChoices):
        FREE = "free", "Free"
        LAB = "lab", "Lab Access"

    class ResultStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        WON = "won", "Won"
        LOST = "lost", "Lost"
        VOID = "void", "Void"

    category = models.ForeignKey(
        PredictionCategory,
        on_delete=models.PROTECT,
        related_name="predictions",
    )

    title = models.CharField(
        max_length=150,
        help_text="Example: Monday Sure 3 or Weekend Banker",
    )

    access_level = models.CharField(
        max_length=10,
        choices=AccessLevel.choices,
        default=AccessLevel.LAB,
    )

    analysis = models.TextField(blank=True)

    result_status = models.CharField(
        max_length=10,
        choices=ResultStatus.choices,
        default=ResultStatus.PENDING,
    )

    result_note = models.CharField(max_length=255, blank=True)

    is_published = models.BooleanField(default=False)
    scheduled_for = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Optional date and time when this prediction should be published.",
    )
    published_at = models.DateTimeField(null=True, blank=True)
    locked_at = models.DateTimeField(null=True, blank=True)
    settled_at = models.DateTimeField(null=True, blank=True)

    published_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="published_predictions",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_predictions",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title


class PredictionSelection(models.Model):
    prediction = models.ForeignKey(
        Prediction,
        on_delete=models.CASCADE,
        related_name="selections",
    )

    league = models.CharField(max_length=120)
    home_team = models.CharField(max_length=120)
    away_team = models.CharField(max_length=120)

    market = models.CharField(
        max_length=150,
        help_text="Example: Home Win, Over 1.5 Goals, BTTS",
    )

    odds = models.DecimalField(max_digits=6, decimal_places=2)
    match_time = models.DateTimeField()
    selection_order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["selection_order", "match_time"]

    def __str__(self) -> str:
        return (
            f"{self.home_team} vs {self.away_team} — {self.market}"
        )
