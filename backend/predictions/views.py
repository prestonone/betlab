from rest_framework import viewsets

from subscriptions.services import has_active_membership

from .models import Prediction, PredictionCategory
from .serializers import (
    PredictionCategorySerializer,
    PredictionSerializer,
)


class PredictionCategoryViewSet(
    viewsets.ReadOnlyModelViewSet
):
    serializer_class = PredictionCategorySerializer

    def get_queryset(self):
        return PredictionCategory.objects.filter(
            is_active=True
        ).order_by("display_order", "name")


class PredictionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PredictionSerializer

    def get_queryset(self):
        queryset = (
            Prediction.objects
            .filter(is_published=True)
            .select_related(
                "category",
                "created_by",
                "published_by",
            )
            .prefetch_related("selections")
        )

        category_slug = self.request.query_params.get(
            "category"
        )
        lifecycle_status = self.request.query_params.get(
            "status"
        )
        result_status = self.request.query_params.get(
            "result"
        )
        access_level = self.request.query_params.get(
            "access"
        )

        if category_slug:
            queryset = queryset.filter(
                category__slug=category_slug
            )

        if lifecycle_status:
            queryset = queryset.filter(
                status=lifecycle_status
            )

        if result_status:
            queryset = queryset.filter(
                result_status=result_status
            )

        if access_level:
            queryset = queryset.filter(
                access_level=access_level
            )

        if not has_active_membership(self.request.user):
            queryset = queryset.filter(
                access_level=Prediction.AccessLevel.FREE
            )

        return queryset.order_by(
            "-published_at",
            "-created_at",
        )
