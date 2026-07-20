from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.legacy_urls")),
    path("api/", include("predictions.urls")),
    # Versioned public API
    path("api/v1/", include("config.api_v1_urls")),
]
