from django.contrib import admin

from .models import (
    BillingProfile,
    Country,
    Plan,
    PlanPrice,
    Subscription,
)


@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "iso_code",
        "default_currency",
        "currency_symbol",
        "payment_provider",
        "is_active",
        "checkout_enabled",
        "display_order",
    )
    list_editable = (
        "is_active",
        "checkout_enabled",
        "display_order",
    )
    list_filter = (
        "is_active",
        "checkout_enabled",
        "payment_provider",
    )
    search_fields = (
        "name",
        "iso_code",
        "default_currency",
    )
    ordering = ("display_order", "name")


class PlanPriceInline(admin.TabularInline):
    model = PlanPrice
    extra = 0
    autocomplete_fields = ("country",)


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = (
        "display_name",
        "code",
        "duration_days",
        "grace_period_days",
        "is_active",
        "display_order",
    )
    list_editable = (
        "is_active",
        "display_order",
    )
    list_filter = ("is_active",)
    search_fields = ("name", "code", "description")
    ordering = ("display_order", "name")
    inlines = (PlanPriceInline,)

    @admin.display(description="Plan")
    def display_name(self, obj: Plan) -> str:
        return str(obj)


@admin.register(PlanPrice)
class PlanPriceAdmin(admin.ModelAdmin):
    list_display = (
        "plan",
        "country",
        "currency",
        "amount",
        "is_active",
    )
    list_editable = (
        "amount",
        "is_active",
    )
    list_filter = (
        "country",
        "currency",
        "is_active",
    )
    search_fields = (
        "plan__name",
        "plan__code",
        "country__name",
        "currency",
    )
    autocomplete_fields = (
        "plan",
        "country",
    )
    ordering = (
        "country__display_order",
        "plan__display_order",
    )


@admin.register(BillingProfile)
class BillingProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "country",
        "country_locked",
        "created_at",
    )
    list_filter = (
        "country",
        "country_locked",
    )
    search_fields = (
        "user__email",
        "user__username",
        "country__name",
    )
    autocomplete_fields = (
        "user",
        "country",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "plan",
        "status",
        "source",
        "starts_at",
        "expires_at",
        "grace_ends_at",
        "auto_renew",
    )
    list_filter = (
        "status",
        "source",
        "plan",
        "auto_renew",
    )
    search_fields = (
        "user__email",
        "user__username",
        "recipient_email",
        "internal_note",
    )
    autocomplete_fields = (
        "user",
        "plan",
        "gifted_by",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )
    date_hierarchy = "created_at"
