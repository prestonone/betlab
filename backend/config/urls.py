from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import include, path

from accounts.admin_forms import RememberMeAdminAuthenticationForm
from accounts.forms import AdminPasswordResetForm

admin.site.site_header = "Bet Lab Admin"
admin.site.site_title = "Bet Lab Admin"
admin.site.index_title = "Operations"
admin.site.login_form = RememberMeAdminAuthenticationForm

urlpatterns = [
    # Admin "forgot password" flow - must precede admin/ so these paths
    # resolve before admin.site.urls, and named to match the auth views'
    # own default success_url reverse() lookups (password_reset_done,
    # password_reset_complete).
    path(
        "admin/password_reset/",
        auth_views.PasswordResetView.as_view(form_class=AdminPasswordResetForm),
        name="admin_password_reset",
    ),
    path(
        "admin/password_reset/done/",
        auth_views.PasswordResetDoneView.as_view(),
        name="password_reset_done",
    ),
    path(
        "admin/reset/<uidb64>/<token>/",
        auth_views.PasswordResetConfirmView.as_view(),
        name="password_reset_confirm",
    ),
    path(
        "admin/reset/done/",
        auth_views.PasswordResetCompleteView.as_view(),
        name="password_reset_complete",
    ),
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.legacy_urls")),
    path("api/", include("predictions.urls")),
    # Versioned public API
    path("api/v1/", include("config.api_v1_urls")),
]
