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

    class ConfidenceLevel(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        VERY_HIGH = "very_high", "Very High"

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

    league = models.CharField(max_length=120)
    home_team = models.CharField(max_length=120)
    away_team = models.CharField(max_length=120)

    market = models.CharField(
        max_length=150,
        help_text="Example: Over 2.5 Goals, Home Win, Both Teams To Score",
    )

    odds = models.DecimalField(max_digits=6, decimal_places=2)

    confidence_score = models.PositiveSmallIntegerField(
        help_text="Enter a value from 1 to 100",
    )

    confidence_level = models.CharField(
        max_length=20,
        choices=ConfidenceLevel.choices,
        default=ConfidenceLevel.HIGH,
    )

    access_level = models.CharField(
        max_length=10,
        choices=AccessLevel.choices,
        default=AccessLevel.LAB,
    )

    match_time = models.DateTimeField()
    analysis = models.TextField(blank=True)

    result_status = models.CharField(
        max_length=10,
        choices=ResultStatus.choices,
        default=ResultStatus.PENDING,
    )

    result_note = models.CharField(max_length=255, blank=True)

    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)

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
        ordering = ["-match_time", "-created_at"]

    def __str__(self) -> str:
        return f"{self.home_team} vs {self.away_team} — {self.market}"