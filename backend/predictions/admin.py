from decimal import Decimal

from django.contrib import admin
from django.db.models import Count
from django.utils import timezone
from django.utils.html import format_html

from .models import (
    Prediction,
    PredictionCategory,
    PredictionSelection,
)


@admin.register(PredictionCategory)
class PredictionCategoryAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "slug",
        "is_active",
        "display_order",
        "prediction_count",
    )
    list_editable = ("is_active", "display_order")
    list_filter = ("is_active",)
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("display_order", "name")

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.annotate(_prediction_count=Count("predictions"))

    @admin.display(description="Predictions", ordering="_prediction_count")
    def prediction_count(self, obj):
        return obj._prediction_count


class PredictionSelectionInline(admin.TabularInline):
    model = PredictionSelection
    extra = 1
    min_num = 1
    validate_min = True
    show_change_link = True

    fields = (
        "selection_order",
        "league",
        "home_team",
        "away_team",
        "market",
        "odds",
        "match_time",
    )

    ordering = ("selection_order", "match_time")


@admin.register(Prediction)
class PredictionAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "category",
        "access_badge",
        "selection_count",
        "combined_odds",
        "result_badge",
        "is_published",
        "published_at",
    )

    list_filter = (
        "category",
        "access_level",
        "result_status",
        "is_published",
        "created_at",
    )

    search_fields = (
        "title",
        "analysis",
        "result_note",
        "selections__league",
        "selections__home_team",
        "selections__away_team",
        "selections__market",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
        "published_at",
    )

    fieldsets = (
        (
            "Prediction package",
            {
                "fields": (
                    "title",
                    "category",
                    "access_level",
                )
            },
        ),
        (
            "Publishing",
            {
                "fields": (
                    "is_published",
                    "published_at",
                    "created_by",
                )
            },
        ),
        (
            "Analysis",
            {
                "fields": ("analysis",),
            },
        ),
        (
            "Result",
            {
                "fields": (
                    "result_status",
                    "result_note",
                )
            },
        ),
        (
            "System information",
            {
                "classes": ("collapse",),
                "fields": (
                    "created_at",
                    "updated_at",
                ),
            },
        ),
    )

    ordering = ("-created_at",)
    autocomplete_fields = ("category", "created_by")
    list_select_related = ("category", "created_by")
    list_per_page = 25
    date_hierarchy = "created_at"
    save_on_top = True
    inlines = [PredictionSelectionInline]

    actions = (
        "publish_predictions",
        "unpublish_predictions",
        "mark_as_won",
        "mark_as_lost",
        "mark_as_void",
        "mark_as_pending",
    )

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.prefetch_related("selections").distinct()

    def save_model(self, request, obj, form, change):
        if not obj.created_by:
            obj.created_by = request.user

        if obj.is_published and obj.published_at is None:
            obj.published_at = timezone.now()

        if not obj.is_published:
            obj.published_at = None

        super().save_model(request, obj, form, change)

    @admin.display(description="Selections")
    def selection_count(self, obj):
        return len(obj.selections.all())

    @admin.display(description="Total odds")
    def combined_odds(self, obj):
        selections = obj.selections.all()

        if not selections:
            return "—"

        total = Decimal("1.00")

        for selection in selections:
            total *= selection.odds

        return f"{total:.2f}"

    @admin.display(description="Access", ordering="access_level")
    def access_badge(self, obj):
        if obj.access_level == Prediction.AccessLevel.FREE:
            return format_html(
                '<span style="color:#047857;font-weight:700;">{}</span>',
                "FREE",
            )

        return format_html(
            '<span style="color:#b78b00;font-weight:700;">{}</span>',
            "LAB",
        )

    @admin.display(description="Result", ordering="result_status")
    def result_badge(self, obj):
        styles = {
            Prediction.ResultStatus.PENDING: ("#6b7280", "PENDING"),
            Prediction.ResultStatus.WON: ("#047857", "WON"),
            Prediction.ResultStatus.LOST: ("#b91c1c", "LOST"),
            Prediction.ResultStatus.VOID: ("#7c3aed", "VOID"),
        }

        color, label = styles[obj.result_status]

        return format_html(
            '<span style="color:{};font-weight:700;">{}</span>',
            color,
            label,
        )

    @admin.action(description="Publish selected predictions")
    def publish_predictions(self, request, queryset):
        updated = queryset.update(
            is_published=True,
            published_at=timezone.now(),
        )
        self.message_user(
            request,
            f"{updated} prediction package(s) published.",
        )

    @admin.action(description="Unpublish selected predictions")
    def unpublish_predictions(self, request, queryset):
        updated = queryset.update(
            is_published=False,
            published_at=None,
        )
        self.message_user(
            request,
            f"{updated} prediction package(s) unpublished.",
        )

    @admin.action(description="Mark selected predictions as won")
    def mark_as_won(self, request, queryset):
        updated = queryset.update(
            result_status=Prediction.ResultStatus.WON,
        )
        self.message_user(
            request,
            f"{updated} prediction package(s) marked as won.",
        )

    @admin.action(description="Mark selected predictions as lost")
    def mark_as_lost(self, request, queryset):
        updated = queryset.update(
            result_status=Prediction.ResultStatus.LOST,
        )
        self.message_user(
            request,
            f"{updated} prediction package(s) marked as lost.",
        )

    @admin.action(description="Mark selected predictions as void")
    def mark_as_void(self, request, queryset):
        updated = queryset.update(
            result_status=Prediction.ResultStatus.VOID,
        )
        self.message_user(
            request,
            f"{updated} prediction package(s) marked as void.",
        )

    @admin.action(description="Mark selected predictions as pending")
    def mark_as_pending(self, request, queryset):
        updated = queryset.update(
            result_status=Prediction.ResultStatus.PENDING,
        )
        self.message_user(
            request,
            f"{updated} prediction package(s) marked as pending.",
        )


@admin.register(PredictionSelection)
class PredictionSelectionAdmin(admin.ModelAdmin):
    list_display = (
        "prediction",
        "selection_order",
        "fixture",
        "league",
        "market",
        "odds",
        "match_time",
    )

    list_filter = (
        "league",
        "match_time",
        "prediction__category",
    )

    search_fields = (
        "prediction__title",
        "home_team",
        "away_team",
        "market",
        "league",
    )

    autocomplete_fields = ("prediction",)
    ordering = ("prediction", "selection_order", "match_time")
    date_hierarchy = "match_time"
    list_select_related = ("prediction",)

    @admin.display(description="Fixture")
    def fixture(self, obj):
        return f"{obj.home_team} vs {obj.away_team}"
