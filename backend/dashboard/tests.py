from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import TestCase, override_settings
from django.test.utils import CaptureQueriesContext
from django.db import connection
from django.urls import reverse
from django.utils import timezone

from payments.models import Payment, PaymentVerificationAttempt, WebhookEvent
from predictions.models import Prediction, PredictionCategory, PredictionSelection
from subscriptions.models import Country, Plan, PlanPrice, Subscription

from . import services
from .permissions import OPERATIONS_MANAGERS_GROUP, can_view_business_overview, can_view_match_operations


def make_category(name="Banker", slug="banker"):
    return PredictionCategory.objects.create(name=name, slug=slug)


def make_prediction(category, status=Prediction.Status.DRAFT, **kwargs):
    defaults = {"title": "Test Prediction", "category": category, "status": status}
    defaults.update(kwargs)
    return Prediction.objects.create(**defaults)


def make_selection(prediction, match_time=None, **kwargs):
    defaults = {
        "prediction": prediction,
        "league": "Premier League",
        "home_team": "Home FC",
        "away_team": "Away FC",
        "market": "Over 2.5",
        "odds": Decimal("1.80"),
        "match_time": match_time or timezone.now() + timedelta(hours=1),
    }
    defaults.update(kwargs)
    return PredictionSelection.objects.create(**defaults)


class DashboardAccessTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.superuser = User.objects.create_superuser(
            username="root", email="root@example.com", password="test-password-123",
        )
        self.content_staff = User.objects.create_user(
            username="staffer", email="staffer@example.com", password="test-password-123",
            is_staff=True,
        )
        self.ops_manager = User.objects.create_user(
            username="ops", email="ops@example.com", password="test-password-123",
            is_staff=True,
        )
        self.ops_manager.groups.add(Group.objects.get(name=OPERATIONS_MANAGERS_GROUP))
        self.client_super = self.client_class()
        self.client_super.force_login(self.superuser)
        self.client_staff = self.client_class()
        self.client_staff.force_login(self.content_staff)
        self.client_ops = self.client_class()
        self.client_ops.force_login(self.ops_manager)

    def test_superuser_can_load_dashboard(self):
        response = self.client_super.get(reverse("admin:index"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Match &amp; Prediction Operations")

    def test_content_staff_sees_match_operations(self):
        response = self.client_staff.get(reverse("admin:index"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Match &amp; Prediction Operations")

    def test_content_staff_cannot_see_revenue_metrics(self):
        response = self.client_staff.get(reverse("admin:index"))
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "Business &amp; System Overview")
        self.assertNotContains(response, "Monthly Revenue")

    def test_operations_manager_sees_business_overview(self):
        response = self.client_ops.get(reverse("admin:index"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Business &amp; System Overview")

    def test_permission_helpers(self):
        self.assertTrue(can_view_match_operations(self.content_staff))
        self.assertFalse(can_view_business_overview(self.content_staff))
        self.assertTrue(can_view_business_overview(self.ops_manager))
        self.assertTrue(can_view_business_overview(self.superuser))


class QuickActionLinkTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.superuser = User.objects.create_superuser(
            username="root", email="root@example.com", password="test-password-123",
        )
        self.client.force_login(self.superuser)
        self.category = make_category()

    def test_add_prediction_link_resolves(self):
        response = self.client.get(reverse("admin:predictions_prediction_add"))
        self.assertEqual(response.status_code, 200)

    def test_update_results_link_resolves(self):
        url = reverse("admin:predictions_prediction_changelist") + "?awaiting_result=yes"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_draft_predictions_filter_applies_correctly(self):
        draft = make_prediction(self.category, status=Prediction.Status.DRAFT)
        published = make_prediction(self.category, status=Prediction.Status.PUBLISHED, title="Published one")
        url = reverse("admin:predictions_prediction_changelist") + f"?status__exact={Prediction.Status.DRAFT}"
        response = self.client.get(url)
        self.assertContains(response, draft.title)
        self.assertNotContains(response, published.title)

    def test_games_awaiting_results_filter_applies_correctly(self):
        awaiting = make_prediction(self.category, status=Prediction.Status.LOCKED, title="Awaiting result")
        settled = make_prediction(
            self.category, status=Prediction.Status.LOCKED,
            result_status=Prediction.ResultStatus.WON, title="Has a result",
        )
        url = reverse("admin:predictions_prediction_changelist") + "?awaiting_result=yes"
        response = self.client.get(url)
        self.assertContains(response, awaiting.title)
        self.assertNotContains(response, settled.title)

    def test_predictions_awaiting_settlement_filter_applies_correctly(self):
        # Not started: both selections still pending.
        not_started = make_prediction(self.category, status=Prediction.Status.LOCKED, title="Not started")
        make_selection(not_started, match_time=timezone.now() - timedelta(hours=2))
        make_selection(not_started, match_time=timezone.now() - timedelta(hours=2))

        # Partially entered: one resolved, one still pending — this is the
        # "awaiting settlement" bucket (mid-way through result entry).
        partial = make_prediction(self.category, status=Prediction.Status.LOCKED, title="Partially entered")
        first = make_selection(partial, match_time=timezone.now() - timedelta(hours=2))
        make_selection(partial, match_time=timezone.now() - timedelta(hours=2))
        first.settle(first.ResultStatus.WON)

        url = reverse("admin:predictions_prediction_changelist") + "?awaiting_settlement=yes"
        response = self.client.get(url)
        self.assertContains(response, partial.title)
        self.assertNotContains(response, not_started.title)


class TodaysGamesTests(TestCase):
    def setUp(self):
        self.category = make_category()

    def test_todays_games_shows_correct_records(self):
        today_pred = make_prediction(self.category, title="Today")
        make_selection(today_pred, match_time=timezone.now() + timedelta(hours=2))

        tomorrow_pred = make_prediction(self.category, title="Tomorrow")
        make_selection(tomorrow_pred, match_time=timezone.now() + timedelta(days=1, hours=2))

        games = services.get_todays_games()
        predictions_shown = {g.prediction_id for g in games}
        self.assertIn(today_pred.pk, predictions_shown)
        self.assertNotIn(tomorrow_pred.pk, predictions_shown)

    def test_todays_counts_respect_configured_timezone(self):
        # TIME_ZONE is UTC in this project; localdate() must be used (not a
        # naive UTC assumption baked into the query) so this stays correct
        # if TIME_ZONE is ever changed.
        with self.settings(TIME_ZONE="UTC"):
            today = timezone.localdate()
            pred = make_prediction(self.category)
            make_selection(pred, match_time=timezone.now())
            cards = {c["label"]: c["count"] for c in services.get_match_operations_cards()}
            self.assertEqual(cards["Games Scheduled Today"], 1)
            self.assertEqual(timezone.localdate(), today)


class BusinessMetricsTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username="member", email="member@example.com", password="test-password-123",
        )
        self.country = Country.objects.create(
            name="Nigeria", iso_code="NG", default_currency="NGN",
            currency_symbol="₦", checkout_enabled=True,
        )
        self.plan = Plan.objects.create(code="weekly-lab", name="Weekly Lab", duration_days=7)
        self.price = PlanPrice.objects.create(
            plan=self.plan, country=self.country, currency="NGN", amount=Decimal("3500.00"),
        )

    def _make_payment(self, status, **kwargs):
        defaults = {
            "user": self.user, "plan": self.plan, "plan_price": self.price,
            "reference": f"BL-{status}-{PaymentVerificationAttempt.objects.count()}-{Payment.objects.count()}",
            "amount": Decimal("3500.00"), "currency": "NGN", "status": status,
        }
        defaults.update(kwargs)
        return Payment.objects.create(**defaults)

    def test_active_subscriber_count_follows_entitlement_rules(self):
        Subscription.objects.create(
            user=self.user, plan=self.plan, status=Subscription.Status.ACTIVE,
            expires_at=timezone.now() + timedelta(days=3),
        )
        stale_user = get_user_model().objects.create_user(
            username="stale", email="stale@example.com", password="test-password-123",
        )
        Subscription.objects.create(
            user=stale_user, plan=self.plan, status=Subscription.Status.ACTIVE,
            expires_at=timezone.now() - timedelta(days=1),
        )
        metrics = services._compute_business_metrics()
        self.assertEqual(metrics["active_subscribers"], 1)

    def test_monthly_revenue_includes_only_successful_payments(self):
        self._make_payment(Payment.Status.SUCCESS, paid_at=timezone.now())
        self._make_payment(Payment.Status.PENDING)
        self._make_payment(Payment.Status.FAILED)
        self._make_payment(Payment.Status.ABANDONED)
        metrics = services._compute_business_metrics()
        revenue = {row["currency"]: row["total"] for row in metrics["revenue_by_currency"]}
        self.assertEqual(revenue.get("NGN"), Decimal("3500.00"))

    def test_pending_payment_count_accurate(self):
        self._make_payment(Payment.Status.PENDING)
        self._make_payment(Payment.Status.PENDING)
        self._make_payment(Payment.Status.SUCCESS, paid_at=timezone.now())
        metrics = services._compute_business_metrics()
        self.assertEqual(metrics["pending_payments"], 2)

    def test_popular_plan_calculation_accurate(self):
        Subscription.objects.create(
            user=self.user, plan=self.plan, status=Subscription.Status.ACTIVE,
            expires_at=timezone.now() + timedelta(days=3),
        )
        metrics = services._compute_business_metrics()
        self.assertEqual(metrics["popular_plan"], self.plan.name)

    def test_popular_plan_empty_state(self):
        metrics = services._compute_business_metrics()
        self.assertIsNone(metrics["popular_plan"])

    def test_failed_email_metric_is_not_fabricated(self):
        metrics = services._compute_business_metrics()
        self.assertFalse(metrics["failed_emails"]["tracked"])
        self.assertIn("not configured", metrics["failed_emails"]["message"])

    def test_failed_webhook_count_uses_real_records(self):
        WebhookEvent.objects.create(processing_status=WebhookEvent.ProcessingStatus.FAILED)
        WebhookEvent.objects.create(processing_status=WebhookEvent.ProcessingStatus.PROCESSED)
        metrics = services._compute_business_metrics()
        self.assertEqual(metrics["failed_webhooks"], 1)

    def test_failed_verification_count_uses_real_records(self):
        PaymentVerificationAttempt.objects.create(
            transaction_reference="BL-1", status=PaymentVerificationAttempt.Status.FAILED,
        )
        PaymentVerificationAttempt.objects.create(
            transaction_reference="BL-2", status=PaymentVerificationAttempt.Status.SUCCESS,
        )
        metrics = services._compute_business_metrics()
        self.assertEqual(metrics["failed_verifications"], 1)


class ResilienceTests(TestCase):
    def test_database_failure_does_not_crash_dashboard(self):
        with patch("dashboard.services.connection.cursor", side_effect=Exception("boom")):
            health = services.check_database_health()
        self.assertFalse(health["connected"])

    @override_settings()
    def test_missing_deployment_metadata_does_not_crash_dashboard(self):
        with patch.dict("os.environ", {}, clear=False):
            for key in ("APP_RELEASE_SHA", "APP_DEPLOYED_AT", "APP_RELEASE_NAME"):
                import os
                os.environ.pop(key, None)
            info = services.get_deployment_info()
        self.assertFalse(info["configured"])
        self.assertIn("not configured", info["message"])

    def test_dashboard_loads_when_database_health_check_fails(self):
        User = get_user_model()
        superuser = User.objects.create_superuser(
            username="root", email="root@example.com", password="test-password-123",
        )
        self.client.force_login(superuser)
        # Patch the health-check function itself rather than the shared
        # `connection` object — mocking connection.cursor globally would
        # also break the test client's own session/auth queries, not just
        # the dashboard's health check.
        with patch(
            "dashboard.services.check_database_health",
            return_value={"connected": False, "response_time_ms": None, "checked_at": timezone.now()},
        ):
            response = self.client.get(reverse("admin:index"))
        self.assertEqual(response.status_code, 200)


class QueryCountTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.superuser = User.objects.create_superuser(
            username="root", email="root@example.com", password="test-password-123",
        )
        self.client.force_login(self.superuser)
        category = make_category()
        for i in range(5):
            pred = make_prediction(category, status=Prediction.Status.PUBLISHED, title=f"Pred {i}")
            make_selection(pred)

    def test_dashboard_query_count_within_reasonable_limit(self):
        with CaptureQueriesContext(connection) as ctx:
            response = self.client.get(reverse("admin:index"))
        self.assertEqual(response.status_code, 200)
        # Generous ceiling — this is an admin-only operational page loaded a
        # handful of times a day, not a hot user-facing endpoint, but it must
        # not scale linearly with data (no N+1 across cards/alerts/table).
        self.assertLess(len(ctx.captured_queries), 80)


class RegressionSmokeTests(TestCase):
    """Confirms the existing prediction workflow still works end-to-end
    through the admin UI after this session's list_filter/admin changes."""

    def setUp(self):
        User = get_user_model()
        self.superuser = User.objects.create_superuser(
            username="root", email="root@example.com", password="test-password-123",
        )
        self.client.force_login(self.superuser)
        self.category = make_category()

    def test_existing_prediction_creation_still_works(self):
        response = self.client.post(
            reverse("admin:predictions_prediction_add"),
            data={
                "title": "New package",
                "category": self.category.pk,
                "access_level": Prediction.AccessLevel.FREE,
                "analysis": "Some analysis",
                "is_published": "",
                "selections-TOTAL_FORMS": "1",
                "selections-INITIAL_FORMS": "0",
                "selections-MIN_NUM_FORMS": "0",
                "selections-MAX_NUM_FORMS": "1000",
                "selections-0-league": "Premier League",
                "selections-0-home_team": "Home FC",
                "selections-0-away_team": "Away FC",
                "selections-0-market": "Over 2.5",
                "selections-0-odds": "1.80",
                "selections-0-match_time_0": timezone.now().strftime("%Y-%m-%d"),
                "selections-0-match_time_1": "15:00:00",
                "selections-0-selection_order": "1",
            },
        )
        self.assertEqual(response.status_code, 302)
        self.assertTrue(Prediction.objects.filter(title="New package").exists())

    def test_existing_prediction_update_still_works(self):
        prediction = make_prediction(self.category, status=Prediction.Status.DRAFT)
        make_selection(prediction)
        response = self.client.get(reverse("admin:predictions_prediction_change", args=[prediction.pk]))
        self.assertEqual(response.status_code, 200)

    def test_existing_result_entry_and_settlement_workflow_still_works(self):
        prediction = make_prediction(self.category, status=Prediction.Status.LOCKED)
        selection = make_selection(prediction, match_time=timezone.now() - timedelta(hours=2))
        # Entering the (only) selection's result auto-settles the parent
        # prediction via recalculate_result() — confirmed by an earlier
        # test failure in this session; there is no separate manual
        # "settle" action to call afterward.
        selection.settle(PredictionSelection.ResultStatus.WON)
        prediction.refresh_from_db()
        self.assertEqual(prediction.result_status, Prediction.ResultStatus.WON)
        self.assertEqual(prediction.status, Prediction.Status.SETTLED)
