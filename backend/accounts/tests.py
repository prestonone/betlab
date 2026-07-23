from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from legal.models import MarketingConsent, PolicyDocument, UserPolicyAcceptance


class AuthenticationApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def _valid_payload(self, **overrides):
        payload = {
            "username": "new-member",
            "email": "member@example.com",
            "password": "strong-test-password-123",
            "password_confirm": "strong-test-password-123",
            "accepted_terms": True,
            "acknowledged_privacy": True,
            "confirmed_age_and_risk": True,
        }
        payload.update(overrides)
        return payload

    def test_registration_returns_tokens_and_normalizes_email(self):
        response = self.client.post(
            reverse("accounts:register"),
            {
                "username": "new-member",
                "email": "MEMBER@EXAMPLE.COM",
                "password": "strong-test-password-123",
                "password_confirm": "strong-test-password-123",
                "accepted_terms": True,
                "acknowledged_privacy": True,
                "confirmed_age_and_risk": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertIn("access", response.data)
        self.assertEqual(response.data["user"]["email"], "member@example.com")

    def test_registration_records_policy_acceptances_and_marketing_opt_out_by_default(self):
        response = self.client.post(
            reverse("accounts:register"), self._valid_payload(), format="json",
        )
        self.assertEqual(response.status_code, 201)
        user = get_user_model().objects.get(email="member@example.com")

        accepted_types = set(
            UserPolicyAcceptance.objects.filter(user=user).values_list("policy__policy_type", flat=True)
        )
        self.assertEqual(
            accepted_types,
            {
                PolicyDocument.PolicyType.TERMS_OF_SERVICE,
                PolicyDocument.PolicyType.TERMS_OF_USE,
                PolicyDocument.PolicyType.PRIVACY_POLICY,
                PolicyDocument.PolicyType.RISK_DISCLOSURE,
                PolicyDocument.PolicyType.DISCLAIMER,
            },
        )
        for acceptance in UserPolicyAcceptance.objects.filter(user=user):
            self.assertEqual(acceptance.acceptance_source, UserPolicyAcceptance.Source.WEB_SIGNUP)
            self.assertIsNotNone(acceptance.accepted_at)
            self.assertEqual(acceptance.policy.version, "1.0")

        consent = MarketingConsent.objects.get(user=user)
        self.assertEqual(consent.status, MarketingConsent.Status.OPTED_OUT)

    def test_registration_records_marketing_opt_in_when_requested(self):
        response = self.client.post(
            reverse("accounts:register"),
            self._valid_payload(marketing_consent=True),
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        user = get_user_model().objects.get(email="member@example.com")
        consent = MarketingConsent.objects.get(user=user)
        self.assertEqual(consent.status, MarketingConsent.Status.OPTED_IN)
        self.assertIsNotNone(consent.consented_at)

    def test_registration_fails_when_terms_not_accepted(self):
        response = self.client.post(
            reverse("accounts:register"),
            self._valid_payload(accepted_terms=False),
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("accepted_terms", response.data)
        self.assertFalse(get_user_model().objects.filter(email="member@example.com").exists())

    def test_registration_fails_when_privacy_not_acknowledged(self):
        response = self.client.post(
            reverse("accounts:register"),
            self._valid_payload(acknowledged_privacy=False),
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("acknowledged_privacy", response.data)
        self.assertFalse(get_user_model().objects.filter(email="member@example.com").exists())

    def test_registration_fails_when_age_and_risk_not_confirmed(self):
        response = self.client.post(
            reverse("accounts:register"),
            self._valid_payload(confirmed_age_and_risk=False),
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("confirmed_age_and_risk", response.data)
        self.assertFalse(get_user_model().objects.filter(email="member@example.com").exists())

    def test_registration_fails_when_mandatory_consent_missing_entirely(self):
        payload = self._valid_payload()
        del payload["accepted_terms"]
        response = self.client.post(reverse("accounts:register"), payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("accepted_terms", response.data)

    def test_registration_blocked_when_required_policy_not_configured(self):
        PolicyDocument.objects.filter(
            policy_type=PolicyDocument.PolicyType.TERMS_OF_SERVICE
        ).update(is_active=False)

        response = self.client.post(
            reverse("accounts:register"), self._valid_payload(), format="json",
        )
        self.assertEqual(response.status_code, 503)
        self.assertFalse(get_user_model().objects.filter(email="member@example.com").exists())

    def test_login_and_protected_current_user(self):
        get_user_model().objects.create_user(
            username="member",
            email="member@example.com",
            password="strong-test-password-123",
        )
        login = self.client.post(
            reverse("accounts:login"),
            {"email": "member@example.com", "password": "strong-test-password-123"},
            format="json",
        )
        self.assertEqual(login.status_code, 200)
        anonymous = self.client.get(reverse("accounts:current-user"))
        self.assertEqual(anonymous.status_code, 401)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        current = self.client.get(reverse("accounts:current-user"))
        self.assertEqual(current.status_code, 200)
        self.assertEqual(current.data["email"], "member@example.com")
