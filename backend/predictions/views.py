from rest_framework import viewsets

from .models import Prediction, PredictionCategory
from .serializers import PredictionCategorySerializer, PredictionSerializer


class PredictionCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PredictionCategorySerializer

    def get_queryset(self):
        return PredictionCategory.objects.filter(
            is_active=True
        ).order_by("display_order")


class PredictionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PredictionSerializer

    def get_queryset(self):
        queryset = (
            Prediction.objects
            .filter(is_published=True)
            .select_related("category", "created_by")
        )

        category_slug = self.request.query_params.get("category")
        result_status = self.request.query_params.get("status")

        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)

        if result_status:
            queryset = queryset.filter(result_status=result_status)

        return queryset
