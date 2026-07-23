from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class BetLabUserAdmin(UserAdmin):
    list_display = (
        "username",
        "email",
        "is_email_verified",
        "is_staff",
        "is_active",
        "date_joined",
    )
    list_filter = UserAdmin.list_filter + ("is_email_verified",)
    search_fields = ("username", "email")
    ordering = ("-date_joined",)