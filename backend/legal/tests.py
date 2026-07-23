from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

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
