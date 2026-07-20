"""Version 1 API route registry for Bet Lab."""

from django.urls import include, path


urlpatterns = [
    path("auth/", include("accounts.urls")),
    path("predictions/", include("predictions.urls")),
    path("subscriptions/", include("subscriptions.urls")),
]
