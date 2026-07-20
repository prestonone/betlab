from rest_framework import serializers

from .models import Country


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
