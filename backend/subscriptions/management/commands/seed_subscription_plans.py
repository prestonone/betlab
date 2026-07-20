from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from subscriptions.models import Country, Plan, PlanPrice


COUNTRIES = [
    {
        "name": "Nigeria",
        "iso_code": "NG",
        "default_currency": "NGN",
        "currency_symbol": "₦",
        "payment_provider": "paystack",
        "is_active": True,
        "checkout_enabled": True,
        "display_order": 10,
    },
    {
        "name": "Ghana",
        "iso_code": "GH",
        "default_currency": "GHS",
        "currency_symbol": "GH₵",
        "payment_provider": "paystack",
        "is_active": True,
        "checkout_enabled": False,
        "display_order": 20,
    },
    {
        "name": "Kenya",
        "iso_code": "KE",
        "default_currency": "KES",
        "currency_symbol": "KSh",
        "payment_provider": "paystack",
        "is_active": True,
        "checkout_enabled": False,
        "display_order": 30,
    },
    {
        "name": "South Africa",
        "iso_code": "ZA",
        "default_currency": "ZAR",
        "currency_symbol": "R",
        "payment_provider": "paystack",
        "is_active": True,
        "checkout_enabled": False,
        "display_order": 40,
    },
    {
        "name": "Côte d'Ivoire",
        "iso_code": "CI",
        "default_currency": "XOF",
        "currency_symbol": "CFA",
        "payment_provider": "paystack",
        "is_active": True,
        "checkout_enabled": False,
        "display_order": 50,
    },
]


PLANS = [
    {
        "code": "starter-pass",
        "name": "Starter Pass",
        "badge": "🥉",
        "description": (
            "Twenty-four hours of Bet Lab membership access."
        ),
        "duration_days": 1,
        "grace_period_days": 1,
        "ngn_amount": Decimal("1000.00"),
        "display_order": 10,
    },
    {
        "code": "weekly-lab",
        "name": "Weekly Lab",
        "badge": "🥈",
        "description": (
            "Seven days of Bet Lab membership access."
        ),
        "duration_days": 7,
        "grace_period_days": 3,
        "ngn_amount": Decimal("3500.00"),
        "display_order": 20,
    },
    {
        "code": "pro-lab",
        "name": "Pro Lab",
        "badge": "🥇",
        "description": (
            "Thirty days of Bet Lab membership access."
        ),
        "duration_days": 30,
        "grace_period_days": 3,
        "ngn_amount": Decimal("10000.00"),
        "display_order": 30,
    },
    {
        "code": "quarterly-elite",
        "name": "Quarterly Elite",
        "badge": "💎",
        "description": (
            "Ninety days of elite Bet Lab membership access."
        ),
        "duration_days": 90,
        "grace_period_days": 3,
        "ngn_amount": Decimal("27000.00"),
        "display_order": 40,
    },
    {
        "code": "half-year-elite",
        "name": "Half-Year Elite",
        "badge": "👑",
        "description": (
            "One hundred and eighty days of elite membership access."
        ),
        "duration_days": 180,
        "grace_period_days": 7,
        "ngn_amount": Decimal("50000.00"),
        "display_order": 50,
    },
    {
        "code": "founders-circle",
        "name": "Founder's Circle",
        "badge": "🏆",
        "description": (
            "One full year of premium Founder's Circle membership."
        ),
        "duration_days": 365,
        "grace_period_days": 7,
        "ngn_amount": Decimal("90000.00"),
        "display_order": 60,
    },
]


class Command(BaseCommand):
    help = (
        "Create or update Bet Lab countries, plans and Nigerian prices."
    )

    @transaction.atomic
    def handle(self, *args, **options):
        countries = {}

        for country_data in COUNTRIES:
            iso_code = country_data["iso_code"]
            defaults = {
                key: value
                for key, value in country_data.items()
                if key != "iso_code"
            }

            country, created = Country.objects.update_or_create(
                iso_code=iso_code,
                defaults=defaults,
            )
            countries[iso_code] = country

            action = "Created" if created else "Updated"
            self.stdout.write(
                self.style.SUCCESS(
                    f"{action} country: {country.name} — "
                    f"{country.default_currency} — "
                    f"checkout enabled: {country.checkout_enabled}"
                )
            )

        nigeria = countries["NG"]

        created_plans = 0
        updated_plans = 0

        for plan_data in PLANS:
            code = plan_data["code"]
            ngn_amount = plan_data["ngn_amount"]

            plan_defaults = {
                key: value
                for key, value in plan_data.items()
                if key not in {"code", "ngn_amount"}
            }
            plan_defaults["is_active"] = True

            plan, created = Plan.objects.update_or_create(
                code=code,
                defaults=plan_defaults,
            )

            if created:
                created_plans += 1
                action = "Created"
            else:
                updated_plans += 1
                action = "Updated"

            price, price_created = PlanPrice.objects.update_or_create(
                plan=plan,
                country=nigeria,
                currency="NGN",
                defaults={
                    "amount": ngn_amount,
                    "is_active": True,
                },
            )

            price_action = (
                "created" if price_created else "updated"
            )

            self.stdout.write(
                self.style.SUCCESS(
                    f"{action} plan: {plan} — "
                    f"NGN {price.amount:,.2f} "
                    f"({price_action} price)"
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Finished: {created_plans} plans created, "
                f"{updated_plans} plans updated."
            )
        )
