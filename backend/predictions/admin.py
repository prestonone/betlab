from django.contrib import admin

from .models import Prediction, PredictionCategory


@admin.register(PredictionCategory)
class PredictionCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "display_order")
    list_editable = ("is_active", "display_order")
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("display_order", "name")


@admin.register(Prediction)
class PredictionAdmin(admin.ModelAdmin):
    list_display = (
        "home_team",
        "away_team",
        "category",
        "market",
        "odds",
        "confidence_score",
        "access_level",
        "result_status",
        "is_published",
        "match_time",
    )

    list_filter = (
        "category",
        "access_level",
        "confidence_level",
        "result_status",
        "is_published",
        "league",
    )

    search_fields = (
        "home_team",
        "away_team",
        "league",
        "market",
        "analysis",
    )

    ordering = ("-match_time",)
    date_hierarchy = "match_time"
    autocomplete_fields = ("category", "created_by")