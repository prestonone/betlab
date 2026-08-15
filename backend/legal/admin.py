from django.contrib import admin

from .models import MarketingConsent, MarketingEmailSend, PolicyDocument, UserPolicyAcceptance


@admin.register(PolicyDocument)
class PolicyDocumentAdmin(admin.ModelAdmin):
    list_display = ("policy_type", "version", "effective_date", "is_active", "is_material_change")
    list_filter = ("policy_type", "is_active", "is_material_change")
    search_fields = ("policy_type", "version")
    ordering = ("policy_type", "-effective_date")


@admin.register(UserPolicyAcceptance)
class UserPolicyAcceptanceAdmin(admin.ModelAdmin):
    list_display = ("user", "policy", "accepted", "acceptance_source", "accepted_at")
    list_filter = ("policy__policy_type", "policy__version", "acceptance_source", "accepted_at")
    search_fields = ("user__email", "user__username")
    autocomplete_fields = ("user", "policy")
    readonly_fields = ("user", "policy", "accepted", "accepted_at", "acceptance_source", "ip_address", "user_agent", "created_at")
    date_hierarchy = "accepted_at"

    def has_add_permission(self, request):
        # Acceptance records are only ever created by the application flow.
        return False

    def has_change_permission(self, request, obj=None):
        # Append-only audit trail: nobody edits history through admin.
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser


@admin.register(MarketingConsent)
class MarketingConsentAdmin(admin.ModelAdmin):
    list_display = ("user", "status", "consented_at", "withdrawn_at", "source")
    list_filter = ("status", "source")
    search_fields = ("user__email", "user__username")
    readonly_fields = ("consented_at", "withdrawn_at", "ip_address", "user_agent", "created_at", "updated_at")


@admin.register(MarketingEmailSend)
class MarketingEmailSendAdmin(admin.ModelAdmin):
    list_display = ("campaign", "email", "status", "attempt_count", "sent_at", "updated_at")
    list_filter = ("campaign", "status")
    search_fields = ("user__email", "email")
    date_hierarchy = "sent_at"
    readonly_fields = (
        "campaign",
        "user",
        "email",
        "status",
        "attempt_count",
        "provider_id",
        "last_error",
        "sent_at",
        "created_at",
        "updated_at",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser
