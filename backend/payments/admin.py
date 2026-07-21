from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "reference",
        "user",
        "plan",
        "amount",
        "currency",
        "status",
        "paid_at",
    )
    list_filter = ("status", "currency", "plan")
    search_fields = ("reference", "provider_reference", "user__email")
    readonly_fields = ("created_at", "updated_at", "paid_at")
