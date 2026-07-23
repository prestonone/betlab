from django.contrib import admin

from .models import Payment, PaymentVerificationAttempt, WebhookEvent


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


@admin.action(description="Mark selected events as resolved")
def mark_webhook_events_resolved(modeladmin, request, queryset):
    updated = queryset.update(resolved=True)
    modeladmin.message_user(request, f"Marked {updated} webhook event(s) as resolved.")


@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    list_display = (
        "provider",
        "event_type",
        "external_reference",
        "processing_status",
        "resolved",
        "received_at",
    )
    list_filter = ("processing_status", "resolved", "provider")
    search_fields = ("external_reference", "event_type", "failure_reason")
    readonly_fields = ("provider", "event_type", "external_reference", "processing_status",
                       "failure_reason", "received_at", "processed_at", "retry_count")
    date_hierarchy = "received_at"
    actions = [mark_webhook_events_resolved]

    def has_add_permission(self, request):
        return False


@admin.action(description="Mark selected attempts as resolved")
def mark_verification_attempts_resolved(modeladmin, request, queryset):
    updated = queryset.update(resolved=True)
    modeladmin.message_user(request, f"Marked {updated} verification attempt(s) as resolved.")


@admin.register(PaymentVerificationAttempt)
class PaymentVerificationAttemptAdmin(admin.ModelAdmin):
    list_display = (
        "transaction_reference",
        "payment",
        "provider",
        "status",
        "resolved",
        "attempted_at",
    )
    list_filter = ("status", "resolved", "provider")
    search_fields = ("transaction_reference", "payment__user__email", "failure_reason")
    readonly_fields = ("payment", "transaction_reference", "provider", "status",
                       "response_code", "failure_reason", "attempted_at")
    autocomplete_fields = ("payment",)
    date_hierarchy = "attempted_at"
    actions = [mark_verification_attempts_resolved]

    def has_add_permission(self, request):
        return False
