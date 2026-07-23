from django.conf import settings
from django.db import models
from django.utils import timezone


class PredictionCategory(models.Model):
    class Color(models.TextChoices):
        GOLD = "gold", "Gold"
        EMERALD = "emerald", "Emerald"
        VIOLET = "violet", "Violet"
        BLUE = "blue", "Blue"
        ROSE = "rose", "Rose"

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    color = models.CharField(
        max_length=10,
        choices=Color.choices,
        default=Color.GOLD,
        help_text="Accent colour used for this category's badge and card highlight on the frontend.",
    )
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "name"]
        verbose_name_plural = "Prediction categories"

    def __str__(self) -> str:
        return self.name


class Prediction(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SCHEDULED = "scheduled", "Scheduled"
        PUBLISHED = "published", "Published"
        LOCKED = "locked", "Locked"
        SETTLED = "settled", "Settled"
        CANCELLED = "cancelled", "Cancelled"

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

    status = models.CharField(
        max_length=12,
        choices=Status.choices,
        default=Status.DRAFT,
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

    @property
    def is_editable(self) -> bool:
        return (
            self.status
            in {
                self.Status.DRAFT,
                self.Status.SCHEDULED,
                self.Status.PUBLISHED,
            }
            and self.locked_at is None
        )

    @property
    def is_locked(self) -> bool:
        return self.status == self.Status.LOCKED

    @property
    def is_settled(self) -> bool:
        return self.status == self.Status.SETTLED

    def schedule(self, scheduled_for) -> None:
        if self.status not in {
            self.Status.DRAFT,
            self.Status.SCHEDULED,
        }:
            raise ValueError(
                f"Cannot schedule a prediction with status '{self.status}'."
            )

        if scheduled_for <= timezone.now():
            raise ValueError("Scheduled publication time must be in the future.")

        self.status = self.Status.SCHEDULED
        self.scheduled_for = scheduled_for
        self.is_published = False
        self.published_at = None
        self.published_by = None

        self.save(
            update_fields=[
                "status",
                "scheduled_for",
                "is_published",
                "published_at",
                "published_by",
                "updated_at",
            ]
        )

    def publish(self, user=None) -> None:
        if self.status in {
            self.Status.LOCKED,
            self.Status.SETTLED,
            self.Status.CANCELLED,
        }:
            raise ValueError(
                f"Cannot publish a prediction with status '{self.status}'."
            )

        now = timezone.now()

        self.status = self.Status.PUBLISHED
        self.is_published = True
        self.scheduled_for = None

        if self.published_at is None:
            self.published_at = now

        if user is not None:
            self.published_by = user

        self.save(
            update_fields=[
                "status",
                "is_published",
                "scheduled_for",
                "published_at",
                "published_by",
                "updated_at",
            ]
        )

    def lock(self) -> None:
        if self.status == self.Status.LOCKED:
            return

        if self.status != self.Status.PUBLISHED:
            raise ValueError(
                f"Cannot lock a prediction with status '{self.status}'."
            )

        self.status = self.Status.LOCKED
        self.locked_at = timezone.now()

        self.save(
            update_fields=[
                "status",
                "locked_at",
                "updated_at",
            ]
        )

    def settle(self, result_status, note="") -> None:
        valid_results = {
            self.ResultStatus.WON,
            self.ResultStatus.LOST,
            self.ResultStatus.VOID,
        }

        if self.status != self.Status.LOCKED:
            raise ValueError(
                f"Cannot settle a prediction with status '{self.status}'."
            )

        if result_status not in valid_results:
            raise ValueError(
                "Settlement result must be won, lost, or void."
            )

        self.status = self.Status.SETTLED
        self.result_status = result_status
        self.result_note = note
        self.settled_at = timezone.now()

        self.save(
            update_fields=[
                "status",
                "result_status",
                "result_note",
                "settled_at",
                "updated_at",
            ]
        )

    def recalculate_result(self) -> str:
        selection_results = list(
            self.selections.values_list(
                "result_status",
                flat=True,
            )
        )

        if not selection_results:
            return self.ResultStatus.PENDING

        if self.ResultStatus.PENDING in selection_results:
            if self.status == self.Status.SETTLED:
                self.status = self.Status.LOCKED
                self.result_status = self.ResultStatus.PENDING
                self.result_note = ""
                self.settled_at = None

                self.save(
                    update_fields=[
                        "status",
                        "result_status",
                        "result_note",
                        "settled_at",
                        "updated_at",
                    ]
                )

            return self.ResultStatus.PENDING

        if self.ResultStatus.LOST in selection_results:
            calculated_result = self.ResultStatus.LOST
        elif all(
            result == self.ResultStatus.VOID
            for result in selection_results
        ):
            calculated_result = self.ResultStatus.VOID
        else:
            calculated_result = self.ResultStatus.WON

        if self.status == self.Status.LOCKED:
            self.settle(calculated_result)
        elif self.status == self.Status.SETTLED:
            self.result_status = calculated_result

            self.save(
                update_fields=[
                    "result_status",
                    "updated_at",
                ]
            )
        else:
            raise ValueError(
                "Prediction results can only be calculated while "
                "the prediction is locked or settled."
            )

        return calculated_result

    def cancel(self) -> None:
        if self.status not in {
            self.Status.DRAFT,
            self.Status.SCHEDULED,
        }:
            raise ValueError(
                f"Cannot cancel a prediction with status '{self.status}'."
            )

        self.status = self.Status.CANCELLED
        self.is_published = False
        self.scheduled_for = None
        self.published_at = None
        self.published_by = None

        self.save(
            update_fields=[
                "status",
                "is_published",
                "scheduled_for",
                "published_at",
                "published_by",
                "updated_at",
            ]
        )


class PredictionSelection(models.Model):
    class ResultStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        WON = "won", "Won"
        LOST = "lost", "Lost"
        VOID = "void", "Void"

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

    result_status = models.CharField(
        max_length=20,
        choices=ResultStatus.choices,
        default=ResultStatus.PENDING,
    )
    result_note = models.TextField(blank=True)
    settled_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["selection_order", "match_time"]

    def __str__(self) -> str:
        return (
            f"{self.home_team} vs {self.away_team} — {self.market}"
        )

    @property
    def is_settled(self) -> bool:
        return self.result_status != self.ResultStatus.PENDING

    def settle(self, result_status, note="") -> None:
        valid_results = {
            self.ResultStatus.WON,
            self.ResultStatus.LOST,
            self.ResultStatus.VOID,
        }

        if self.prediction.status != Prediction.Status.LOCKED:
            raise ValueError(
                "Selections can only be settled when their "
                "prediction is locked."
            )

        if result_status not in valid_results:
            raise ValueError(
                "Selection result must be won, lost, or void."
            )

        self.result_status = result_status
        self.result_note = note
        self.settled_at = timezone.now()

        self.save(
            update_fields=[
                "result_status",
                "result_note",
                "settled_at",
            ]
        )

        self.prediction.recalculate_result()

    def reset_result(self) -> None:
        if self.prediction.status not in {
            Prediction.Status.LOCKED,
            Prediction.Status.SETTLED,
        }:
            raise ValueError(
                "Selection results can only be reset when their "
                "prediction is locked or settled."
            )

        self.result_status = self.ResultStatus.PENDING
        self.result_note = ""
        self.settled_at = None

        self.save(
            update_fields=[
                "result_status",
                "result_note",
                "settled_at",
            ]
        )

        self.prediction.recalculate_result()
