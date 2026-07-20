from django.db.models import F
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from common.api import error_response, success_response

from .models import BillingProfile, Country, Plan
from .serializers import (
    BillingProfileSerializer,
    CountrySerializer,
    PlanSerializer,
)


class CountryListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = CountrySerializer

    queryset = (
        Country.objects
        .filter(is_active=True)
        .order_by("display_order", "name")
    )

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        return success_response(
            data=serializer.data,
            message="Countries retrieved successfully.",
        )


class PlanListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        country_code = request.query_params.get("country", "").strip().upper()

        if not country_code:
            return error_response(
                message="Country is required.",
                errors={
                    "country": [
                        "Provide a two-letter country code, such as NG."
                    ]
                },
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        country = (
            Country.objects
            .filter(
                iso_code=country_code,
                is_active=True,
            )
            .first()
        )

        if country is None:
            return error_response(
                message="Country is not supported.",
                errors={
                    "country": [
                        f"No active country was found for code {country_code}."
                    ]
                },
                status_code=status.HTTP_404_NOT_FOUND,
            )

        plans = (
            Plan.objects
            .filter(
                is_active=True,
                prices__country=country,
                prices__is_active=True,
            )
            .annotate(
                localized_amount=F("prices__amount"),
                localized_currency=F("prices__currency"),
                localized_currency_symbol=F(
                    "prices__country__currency_symbol"
                ),
            )
            .order_by("display_order", "name")
        )

        serializer = PlanSerializer(plans, many=True)

        return success_response(
            data=serializer.data,
            message="Plans retrieved successfully.",
            meta={
                "country": country.iso_code,
                "country_name": country.name,
                "currency": country.default_currency,
                "currency_symbol": country.currency_symbol,
                "checkout_enabled": country.checkout_enabled,
            },
        )


class BillingProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = (
            BillingProfile.objects
            .select_related("country")
            .filter(user=request.user)
            .first()
        )

        if profile is None:
            return success_response(
                data=None,
                message="Billing profile not found.",
            )

        serializer = BillingProfileSerializer(profile)

        return success_response(
            data=serializer.data,
            message="Billing profile retrieved successfully.",
        )

    def post(self, request):
        country_code = str(
            request.data.get("country", "")
        ).strip().upper()

        if not country_code:
            return error_response(
                message="Country is required.",
                errors={
                    "country": [
                        "Provide a two-letter country code."
                    ]
                },
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        country = (
            Country.objects
            .filter(
                iso_code=country_code,
                is_active=True,
            )
            .first()
        )

        if country is None:
            return error_response(
                message="Country is not supported.",
                errors={
                    "country": [
                        f"No active country was found for code {country_code}."
                    ]
                },
                status_code=status.HTTP_404_NOT_FOUND,
            )

        profile, created = BillingProfile.objects.get_or_create(
            user=request.user,
            defaults={
                "country": country,
            },
        )

        if (
            not created
            and profile.country_locked
        ):
            return error_response(
                message="Country can no longer be changed.",
                errors={
                    "country": [
                        "Your billing country has been locked."
                    ]
                },
                status_code=status.HTTP_403_FORBIDDEN,
            )

        if not created:
            profile.country = country
            profile.save(update_fields=["country", "updated_at"])

        serializer = BillingProfileSerializer(profile)

        return success_response(
            data=serializer.data,
            message=(
                "Billing profile created successfully."
                if created
                else "Billing profile updated successfully."
            ),
        )
