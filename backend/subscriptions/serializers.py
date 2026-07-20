from rest_framework import serializers

from .models import Country, Plan


class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = (
            "name",
            "iso_code",
            "default_currency",
            "currency_symbol",
            "checkout_enabled",
        )


class PlanSerializer(serializers.ModelSerializer):
    price = serializers.DecimalField(
        source="localized_amount",
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )
    currency = serializers.CharField(
        source="localized_currency",
        read_only=True,
    )
    currency_symbol = serializers.CharField(
        source="localized_currency_symbol",
        read_only=True,
    )

    class Meta:
        model = Plan
        fields = (
            "code",
            "name",
            "badge",
            "description",
            "duration_days",
            "grace_period_days",
            "price",
            "currency",
            "currency_symbol",
        )
