import hashlib
import hmac
import json
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from legal.models import PolicyDocument, UserPolicyAcceptance
from subscriptions.models import BillingProfile, Country, Plan, PlanPrice, Subscription

from .models import Payment


class PaymentApiTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="member",
            email="member@example.com",
            password="test-password-123",
        )
        self.other_user = get_user_model().objects.create_user(
            username="other",
            email="other@example.com",
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
        self.price = PlanPrice.objects.create(
            plan=self.plan,
            country=self.country,
            currency="NGN",
            amount=Decimal("3500.00"),
        )
        BillingProfile.objects.create(user=self.user, country=self.country)
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def create_payment(self, **overrides):
        values = {
            "user": self.user,
            "plan": self.plan,
            "plan_price": self.price,
            "reference": "BL-TEST-REFERENCE",
            "amount": self.price.amount,
            "currency": "NGN",
        }
        values.update(overrides)
        return Payment.objects.create(**values)

    def provider_data(self, **overrides):
        values = {
            "reference": "BL-TEST-REFERENCE",
            "status": "success",
            "amount": 350000,
            "currency": "NGN",
            "channel": "card",
            "customer": {"customer_code": "CUS_safe"},
            "authorization": {"authorization_code": "AUTH_safe"},
        }
        values.update(overrides)
        return values

    def test_initialize_requires_authentication(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(reverse("payments:initialize"), {"plan": self.plan.code})
        self.assertEqual(response.status_code, 401)

    @patch("payments.views.initialize_transaction")
    def test_initialize_calculates_amount_on_server(self, initialize):
        initialize.return_value = {
            "authorization_url": "https://checkout.paystack.test/example",
            "access_code": "access-code",
        }
        response = self.client.post(
            reverse("payments:initialize"),
            {"plan": self.plan.code, "amount": 1, "currency": "USD", "accepted_refund_policy": True},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        payload = initialize.call_args.args[0]
        self.assertEqual(payload["amount"], 350000)
        self.assertEqual(payload["currency"], "NGN")
        self.assertEqual(payload["email"], self.user.email)
        self.assertEqual(Payment.objects.get().amount, Decimal("3500.00"))

    def test_initialize_rejected_without_refund_policy_acknowledgement(self):
        response = self.client.post(
            reverse("payments:initialize"),
            {"plan": self.plan.code},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Payment.objects.exists())

    @patch("payments.views.initialize_transaction")
    def test_initialize_reuses_existing_refund_policy_acceptance(self, initialize):
        initialize.return_value = {
            "authorization_url": "https://checkout.paystack.test/example",
            "access_code": "access-code",
        }
        current_refund_policy = PolicyDocument.current(PolicyDocument.PolicyType.REFUND_POLICY)
        UserPolicyAcceptance.objects.create(
            user=self.user,
            policy=current_refund_policy,
            acceptance_source=UserPolicyAcceptance.Source.WEB_SIGNUP,
        )
        response = self.client.post(
            reverse("payments:initialize"),
            {"plan": self.plan.code},
            format="json",
        )
        self.assertEqual(response.status_code, 201)

    @patch("payments.views.verify_transaction")
    def test_successful_verification_activates_subscription(self, verify):
        payment = self.create_payment()
        verify.return_value = self.provider_data()
        response = self.client.get(reverse("payments:verify", args=[payment.reference]))
        self.assertEqual(response.status_code, 200)
        payment.refresh_from_db()
        self.assertEqual(payment.status, Payment.Status.SUCCESS)
        self.assertEqual(payment.subscription.status, Subscription.Status.ACTIVE)
        self.assertEqual(payment.subscription.plan, self.plan)
        self.user.billing_profile.refresh_from_db()
        self.assertTrue(self.user.billing_profile.country_locked)

    @patch("payments.views.verify_transaction")
    def test_failed_verification_does_not_activate(self, verify):
        payment = self.create_payment()
        verify.return_value = self.provider_data(status="failed")
        response = self.client.get(reverse("payments:verify", args=[payment.reference]))
        self.assertEqual(response.status_code, 400)
        payment.refresh_from_db()
        self.assertEqual(payment.status, Payment.Status.FAILED)
        self.assertFalse(Subscription.objects.exists())

    @patch("payments.views.verify_transaction")
    def test_pending_verification_does_not_activate(self, verify):
        payment = self.create_payment()
        verify.return_value = self.provider_data(status="pending")
        response = self.client.get(reverse("payments:verify", args=[payment.reference]))
        self.assertEqual(response.status_code, 202)
        payment.refresh_from_db()
        self.assertEqual(payment.status, Payment.Status.PENDING)
        self.assertFalse(Subscription.objects.exists())

    @patch("payments.views.verify_transaction")
    def test_abandoned_verification_is_reported_as_cancelled(self, verify):
        payment = self.create_payment()
        verify.return_value = self.provider_data(status="abandoned")
        response = self.client.get(reverse("payments:verify", args=[payment.reference]))
        self.assertEqual(response.status_code, 400)
        self.assertIn("cancelled", response.data["message"])
        self.assertFalse(Subscription.objects.exists())

    @patch("payments.views.verify_transaction")
    def test_amount_mismatch_is_rejected(self, verify):
        payment = self.create_payment()
        verify.return_value = self.provider_data(amount=1)
        response = self.client.get(reverse("payments:verify", args=[payment.reference]))
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Subscription.objects.exists())

    @patch("payments.views.verify_transaction")
    def test_currency_mismatch_is_rejected(self, verify):
        payment = self.create_payment()
        verify.return_value = self.provider_data(currency="USD")
        response = self.client.get(reverse("payments:verify", args=[payment.reference]))
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Subscription.objects.exists())

    @patch("payments.views.verify_transaction")
    def test_duplicate_verification_does_not_extend_twice(self, verify):
        payment = self.create_payment()
        verify.return_value = self.provider_data()
        first = self.client.get(reverse("payments:verify", args=[payment.reference]))
        second = self.client.get(reverse("payments:verify", args=[payment.reference]))
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(Subscription.objects.count(), 1)
        self.assertEqual(verify.call_count, 1)

    def test_user_cannot_verify_another_users_payment(self):
        payment = self.create_payment(user=self.other_user)
        response = self.client.get(reverse("payments:verify", args=[payment.reference]))
        self.assertEqual(response.status_code, 404)

    @override_settings(PAYSTACK_WEBHOOK_SECRET="webhook-test-secret")
    def test_valid_webhook_activates_and_duplicate_is_idempotent(self):
        self.create_payment()
        body = json.dumps({"event": "charge.success", "data": self.provider_data()}).encode()
        signature = hmac.new(b"webhook-test-secret", body, hashlib.sha512).hexdigest()
        url = reverse("payments:paystack-webhook")
        first = self.client.post(
            url,
            data=body,
            content_type="application/json",
            HTTP_X_PAYSTACK_SIGNATURE=signature,
        )
        second = self.client.post(
            url,
            data=body,
            content_type="application/json",
            HTTP_X_PAYSTACK_SIGNATURE=signature,
        )
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(Subscription.objects.count(), 1)

    @override_settings(PAYSTACK_WEBHOOK_SECRET="webhook-test-secret")
    def test_invalid_webhook_signature_is_rejected(self):
        response = self.client.post(
            reverse("payments:paystack-webhook"),
            data=b'{"event":"charge.success"}',
            content_type="application/json",
            HTTP_X_PAYSTACK_SIGNATURE="invalid",
        )
        self.assertEqual(response.status_code, 401)
        self.assertFalse(Subscription.objects.exists())
