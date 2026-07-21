from rest_framework import serializers

from .models import (
    Prediction,
    PredictionCategory,
    PredictionSelection,
)


class PredictionCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PredictionCategory
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "display_order",
        ]


class PredictionSelectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PredictionSelection
        fields = [
            "id",
            "league",
            "home_team",
            "away_team",
            "market",
            "odds",
            "match_time",
            "selection_order",
            "result_status",
            "result_note",
            "settled_at",
        ]


class PredictionSerializer(serializers.ModelSerializer):
    category = PredictionCategorySerializer(read_only=True)
    selections = PredictionSelectionSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Prediction
        fields = [
            "id",
            "category",
            "title",
            "access_level",
            "analysis",
            "status",
            "result_status",
            "result_note",
            "is_published",
            "scheduled_for",
            "published_at",
            "locked_at",
            "settled_at",
            "created_at",
            "updated_at",
            "selections",
        ]
