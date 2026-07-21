from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from .models import BillingProfile, Country, Plan, PlanPrice, Subscription
from .services import activate_or_extend_subscription, get_current_subscription


class SubscriptionTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="member",
            email="member@example.com",
            password="test-password-123",
        )
        self.country = Country.objects.create(
            name="Nigeria",
            iso_code="NG",
            default_currency="NGN",
            currency_symbol="₦",
            checkout_enabled=True,
        )
        self.plan = Plan.objects.create(
            code="weekly-lab",
            name="Weekly Lab",
            duration_days=7,
            grace_period_days=3,
        )
        PlanPrice.objects.create(
            plan=self.plan,
            country=self.country,
            currency="NGN",
            amount=Decimal("3500.00"),
        )
        self.client = APIClient()

    def test_plan_retrieval_returns_authoritative_price(self):
        response = self.client.get(reverse("subscriptions:plan-list"), {"country": "NG"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"][0]["name"], "Weekly Lab")
        self.assertEqual(response.data["data"][0]["price"], "3500.00")

    def test_current_subscription_requires_authentication(self):
        response = self.client.get(reverse("subscriptions:current-subscription"))
        self.assertEqual(response.status_code, 401)

    def test_locked_billing_country_allows_idempotent_same_country(self):
        BillingProfile.objects.create(
            user=self.user,
            country=self.country,
            country_locked=True,
        )
        self.client.force_authenticate(self.user)
        response = self.client.post(
            reverse("subscriptions:billing-profile"),
            {"country": "NG"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)

    def test_activation_uses_plan_duration_and_extends_existing_access(self):
        first = activate_or_extend_subscription(user=self.user, plan=self.plan)
        second = activate_or_extend_subscription(user=self.user, plan=self.plan)
        self.assertGreaterEqual(second.expires_at, first.grace_ends_at + timedelta(days=7))

    def test_expired_subscription_is_not_current(self):
        subscription = Subscription.objects.create(
            user=self.user,
            plan=self.plan,
            status=Subscription.Status.ACTIVE,
            starts_at=timezone.now() - timedelta(days=10),
            expires_at=timezone.now() - timedelta(days=2),
            grace_ends_at=timezone.now() - timedelta(days=1),
        )
        self.assertIsNone(get_current_subscription(self.user))
        subscription.refresh_from_db()
        self.assertEqual(subscription.status, Subscription.Status.EXPIRED)
