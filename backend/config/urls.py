from django.contrib import admin
from django.urls import include, path

admin.site.site_header = "Bet Lab Admin"
admin.site.site_title = "Bet Lab Admin"
admin.site.index_title = "Operations"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.legacy_urls")),
    path("api/", include("predictions.urls")),
    # Versioned public API
    path("api/v1/", include("config.api_v1_urls")),
]
