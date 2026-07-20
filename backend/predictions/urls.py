from rest_framework.routers import DefaultRouter

from .views import PredictionCategoryViewSet, PredictionViewSet


router = DefaultRouter()
router.register(
    "categories",
    PredictionCategoryViewSet,
    basename="prediction-category",
)
router.register(
    "predictions",
    PredictionViewSet,
    basename="prediction",
)

urlpatterns = router.urls
