from rest_framework import serializers

from .models import Prediction, PredictionCategory


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


class PredictionSerializer(serializers.ModelSerializer):
    category = PredictionCategorySerializer(read_only=True)

    class Meta:
        model = Prediction
        fields = [
            "id",
            "category",
            "league",
            "home_team",
            "away_team",
            "market",
            "odds",
            "confidence_score",
            "confidence_level",
            "access_level",
            "match_time",
            "analysis",
            "result_status",
            "result_note",
            "is_published",
            "published_at",
            "created_at",
            "updated_at",
        ]
