from django.contrib import admin

from .models import (
    Prediction,
    PredictionCategory,
    PredictionSelection,
)


@admin.register(PredictionCategory)
class PredictionCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "display_order")
    list_editable = ("is_active", "display_order")
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("display_order", "name")


class PredictionSelectionInline(admin.TabularInline):
    model = PredictionSelection
    extra = 1
    fields = (
        "league",
        "home_team",
        "away_team",
        "market",
        "odds",
        "match_time",
        "selection_order",
    )


@admin.register(Prediction)
class PredictionAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "category",
        "access_level",
        "result_status",
        "is_published",
        "created_at",
    )

    list_filter = (
        "category",
        "access_level",
        "result_status",
        "is_published",
    )

    search_fields = (
        "title",
        "analysis",
        "selections__home_team",
        "selections__away_team",
    )

    ordering = ("-created_at",)
    autocomplete_fields = ("category", "created_by")
    inlines = [PredictionSelectionInline]


@admin.register(PredictionSelection)
class PredictionSelectionAdmin(admin.ModelAdmin):
    list_display = (
        "prediction",
        "home_team",
        "away_team",
        "league",
        "market",
        "odds",
        "match_time",
    )

    list_filter = ("league", "match_time")
    search_fields = ("home_team", "away_team", "market")
