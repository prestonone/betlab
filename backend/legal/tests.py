from datetime import date, timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from .models import MarketingConsent, PolicyDocument, UserPolicyAcceptance
from .services import PolicyNotConfigured, has_current_acceptance, record_acceptance, record_marketing_consent


class PolicyDocumentTests(TestCase):
    def test_current_returns_active_version(self):
        current = PolicyDocument.current(PolicyDocument.PolicyType.TERMS_OF_SERVICE)
        self.assertIsNotNone(current)
        self.assertTrue(current.is_active)

    def test_current_returns_none_when_type_not_configured(self):
        PolicyDocument.objects.filter(
            policy_type=PolicyDocument.PolicyType.COOKIE_POLICY
        ).update(is_active=False)
        self.assertIsNone(PolicyDocument.current(PolicyDocument.PolicyType.COOKIE_POLICY))

    def test_publishing_new_version_does_not_delete_old_acceptances(self):
        user = get_user_model().objects.create_user(
            username="member", email="member@example.com", password="test-password-123",
        )
        old_policy = PolicyDocument.current(PolicyDocument.PolicyType.PRIVACY_POLICY)
        record_acceptance(
            user=user,
            policy_type=PolicyDocument.PolicyType.PRIVACY_POLICY,
            source=UserPolicyAcceptance.Source.WEB_SIGNUP,
        )

        old_policy.is_active = False
        old_policy.save(update_fields=["is_active"])
        PolicyDocument.objects.create(
            policy_type=PolicyDocument.PolicyType.PRIVACY_POLICY,
            version="2.0",
            effective_date=date.today() + timedelta(days=1),
            is_active=True,
            is_material_change=True,
        )

        # The old acceptance still exists and still points at v1.0.
        acceptance = UserPolicyAcceptance.objects.get(user=user, policy=old_policy)
        self.assertEqual(acceptance.policy.version, "1.0")
        # But the user no longer has an acceptance for the *current* version.
        self.assertFalse(
            has_current_acceptance(user=user, policy_type=PolicyDocument.PolicyType.PRIVACY_POLICY)
        )


class RecordAcceptanceServiceTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="member", email="member@example.com", password="test-password-123",
        )

    def test_record_acceptance_raises_when_policy_missing(self):
        PolicyDocument.objects.filter(
            policy_type=PolicyDocument.PolicyType.DISCLAIMER
        ).delete()
        with self.assertRaises(PolicyNotConfigured):
            record_acceptance(
                user=self.user,
                policy_type=PolicyDocument.PolicyType.DISCLAIMER,
                source=UserPolicyAcceptance.Source.WEB_SIGNUP,
            )

    def test_marketing_consent_can_be_withdrawn(self):
        record_marketing_consent(user=self.user, opted_in=True, source="web_signup")
        consent = MarketingConsent.objects.get(user=self.user)
        self.assertEqual(consent.status, MarketingConsent.Status.OPTED_IN)

        record_marketing_consent(user=self.user, opted_in=False, source="account_settings")
        consent.refresh_from_db()
        self.assertEqual(consent.status, MarketingConsent.Status.OPTED_OUT)
        self.assertIsNotNone(consent.withdrawn_at)


class LegalAdminAccessTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="member", email="member@example.com", password="test-password-123",
        )
        self.staff = get_user_model().objects.create_user(
            username="staff", email="staff@example.com", password="test-password-123",
            is_staff=True,
        )
        self.superuser = get_user_model().objects.create_superuser(
            username="root", email="root@example.com", password="test-password-123",
        )
        self.policy = PolicyDocument.current(PolicyDocument.PolicyType.TERMS_OF_SERVICE)
        self.acceptance = UserPolicyAcceptance.objects.create(
            user=self.user, policy=self.policy, acceptance_source=UserPolicyAcceptance.Source.WEB_SIGNUP,
        )

    def test_anonymous_cannot_access_acceptance_admin(self):
        response = self.client.get(reverse("admin:legal_userpolicyacceptance_changelist"))
        self.assertEqual(response.status_code, 302)

    def test_ordinary_staff_cannot_delete_acceptance_history(self):
        self.client.force_login(self.staff)
        response = self.client.get(
            reverse("admin:legal_userpolicyacceptance_delete", args=[self.acceptance.pk])
        )
        # Staff (non-superuser) get a permission-denied page, not the delete confirmation.
        self.assertNotEqual(response.status_code, 200)

    def test_superuser_can_view_acceptance_admin(self):
        self.client.force_login(self.superuser)
        response = self.client.get(reverse("admin:legal_userpolicyacceptance_changelist"))
        self.assertEqual(response.status_code, 200)


class PolicyChangeLogApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_change_log_is_public_and_lists_all_versions(self):
        response = self.client.get(reverse("legal:policy-change-log"))
        self.assertEqual(response.status_code, 200)
        types = {row["policy_type"] for row in response.data["results"]} if "results" in response.data else {row["policy_type"] for row in response.data}
        self.assertIn("terms_of_service", types)

    def test_merged_documents_show_material_change_and_summary(self):
        response = self.client.get(reverse("legal:policy-change-log"))
        rows = response.data["results"] if "results" in response.data else response.data
        tos_v2 = next(r for r in rows if r["policy_type"] == "terms_of_service" and r["version"] == "2.0")
        self.assertTrue(tos_v2["is_material_change"])
        self.assertIn("Terms of Use", tos_v2["change_summary"])


class LegalContactApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    @patch("legal.views.send_email")
    def test_valid_submission_sends_email_and_succeeds(self, send_email):
        response = self.client.post(
            reverse("legal:contact"),
            {"category": "privacy_request", "name": "Jane Doe", "email": "jane@example.com", "message": "Please delete my data."},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        send_email.assert_called_once()
        self.assertEqual(send_email.call_args.kwargs["to"], "legal@betlabhq.com")

    def test_invalid_category_rejected(self):
        response = self.client.post(
            reverse("legal:contact"),
            {"category": "not-a-real-category", "name": "Jane", "email": "jane@example.com", "message": "Hi"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    @patch("legal.views.send_email")
    def test_email_provider_failure_returns_503_not_500(self, send_email):
        from common.email import EmailSendError
        send_email.side_effect = EmailSendError("boom")
        response = self.client.post(
            reverse("legal:contact"),
            {"category": "general", "name": "Jane", "email": "jane@example.com", "message": "Hi"},
            format="json",
        )
        self.assertEqual(response.status_code, 503)


class MyConsentApiTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="member", email="member@example.com", password="test-password-123",
        )
        self.client = APIClient()

    def test_requires_authentication(self):
        response = self.client.get(reverse("legal:my-consent"))
        self.assertEqual(response.status_code, 401)

    def test_returns_accepted_policies_and_marketing_status(self):
        record_acceptance(user=self.user, policy_type=PolicyDocument.PolicyType.PRIVACY_POLICY, source=UserPolicyAcceptance.Source.WEB_SIGNUP)
        record_marketing_consent(user=self.user, opted_in=True, source="web_signup")

        self.client.force_authenticate(self.user)
        response = self.client.get(reverse("legal:my-consent"))
        self.assertEqual(response.status_code, 200)
        acceptances = response.data["data"]["acceptances"]
        self.assertEqual(len(acceptances), 1)
        self.assertEqual(acceptances[0]["policy_type"], "privacy_policy")
        self.assertEqual(response.data["data"]["marketing_consent"]["status"], "opted_in")

    def test_marketing_consent_can_be_toggled(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(reverse("legal:marketing-consent"), {"opted_in": True}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(MarketingConsent.objects.get(user=self.user).status, MarketingConsent.Status.OPTED_IN)

        response = self.client.post(reverse("legal:marketing-consent"), {"opted_in": False}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(MarketingConsent.objects.get(user=self.user).status, MarketingConsent.Status.OPTED_OUT)

    def test_marketing_consent_toggle_requires_authentication(self):
        response = self.client.post(reverse("legal:marketing-consent"), {"opted_in": True}, format="json")
        self.assertEqual(response.status_code, 401)
