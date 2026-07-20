from rest_framework import viewsets

from .models import Prediction, PredictionCategory
from .serializers import PredictionCategorySerializer, PredictionSerializer


class PredictionCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PredictionCategory.objects.filter(is_active=True)
    serializer_class = PredictionCategorySerializer


class PredictionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        Prediction.objects
        .filter(is_published=True)
        .select_related("category", "created_by")
    )
    serializer_class = PredictionSerializer
