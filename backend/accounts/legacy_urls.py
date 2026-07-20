"""Temporary backward-compatible authentication routes."""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import CurrentUserView, LoginView, RegisterView


urlpatterns = [
    path("register/", RegisterView.as_view(), name="legacy-register"),
    path("login/", LoginView.as_view(), name="legacy-login"),
    path("refresh/", TokenRefreshView.as_view(), name="legacy-token-refresh"),
    path("me/", CurrentUserView.as_view(), name="legacy-current-user"),
]
