from datetime import timedelta
from io import StringIO

from django.contrib.admin.sites import AdminSite
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import RequestFactory, TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from .admin import PredictionAdmin, PredictionSelectionInline
from .models import (
    Prediction,
    PredictionCategory,
    PredictionSelection,
)
from subscriptions.models import Plan, Subscription


class PredictionAccessTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="api-member",
            email="api-member@example.com",
            password="test-password-123",
        )
        category = PredictionCategory.objects.create(
            name="Access",
            slug="access",
        )
        self.free_prediction = Prediction.objects.create(
            category=category,
            title="Free pick",
            access_level=Prediction.AccessLevel.FREE,
            status=Prediction.Status.PUBLISHED,
            is_published=True,
            published_at=timezone.now(),
        )
        self.lab_prediction = Prediction.objects.create(
            category=category,
            title="Lab pick",
            access_level=Prediction.AccessLevel.LAB,
            status=Prediction.Status.PUBLISHED,
            is_published=True,
            published_at=timezone.now(),
        )
        self.client = APIClient()
        self.url = reverse("prediction-list")

    def test_anonymous_user_only_sees_free_predictions(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["title"] for item in response.data], ["Free pick"])

    def test_active_member_sees_lab_predictions(self):
        plan = Plan.objects.create(
            code="weekly-lab",
            name="Weekly Lab",
            duration_days=7,
        )
        Subscription.objects.create(
            user=self.user,
            plan=plan,
            status=Subscription.Status.ACTIVE,
            starts_at=timezone.now(),
            expires_at=timezone.now() + timedelta(days=7),
        )
        self.client.force_authenticate(self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

    def test_expired_member_only_sees_free_predictions(self):
        plan = Plan.objects.create(
            code="expired-plan",
            name="Expired",
            duration_days=1,
        )
        Subscription.objects.create(
            user=self.user,
            plan=plan,
            status=Subscription.Status.ACTIVE,
            starts_at=timezone.now() - timedelta(days=3),
            expires_at=timezone.now() - timedelta(days=2),
        )
        self.client.force_authenticate(self.user)
        response = self.client.get(self.url)
        self.assertEqual([item["title"] for item in response.data], ["Free pick"])


class ScheduledPredictionPublishingTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="publisher",
            email="publisher@example.com",
            password="test-password-123",
        )

        self.category = PredictionCategory.objects.create(
            name="Daily Tips",
            slug="daily-tips",
        )

    def create_prediction(self, **overrides):
        values = {
            "category": self.category,
            "title": "Scheduled Prediction",
            "created_by": self.user,
        }
        values.update(overrides)
        return Prediction.objects.create(**values)

    def test_future_prediction_is_not_published(self):
        prediction = self.create_prediction(
            scheduled_for=timezone.now() + timedelta(hours=1),
        )

        call_command("publish_scheduled_predictions")

        prediction.refresh_from_db()

        self.assertFalse(prediction.is_published)
        self.assertIsNone(prediction.published_at)
        self.assertIsNone(prediction.published_by)

    def test_due_prediction_is_published(self):
        prediction = self.create_prediction(
            scheduled_for=timezone.now() - timedelta(minutes=1),
        )

        output = StringIO()

        call_command(
            "publish_scheduled_predictions",
            stdout=output,
        )

        prediction.refresh_from_db()

        self.assertTrue(prediction.is_published)
        self.assertIsNotNone(prediction.published_at)
        self.assertIsNone(prediction.scheduled_for)
        self.assertIn("1 scheduled prediction", output.getvalue())

    def test_already_published_prediction_is_ignored(self):
        original_published_at = timezone.now() - timedelta(days=1)

        prediction = self.create_prediction(
            is_published=True,
            published_at=original_published_at,
            scheduled_for=timezone.now() - timedelta(minutes=1),
        )

        call_command("publish_scheduled_predictions")

        prediction.refresh_from_db()

        self.assertEqual(
            prediction.published_at,
            original_published_at,
        )

    def test_pending_prediction_has_no_settlement_timestamp(self):
        prediction = self.create_prediction(
            result_status=Prediction.ResultStatus.PENDING,
            settled_at=None,
        )

        self.assertIsNone(prediction.settled_at)

class PredictionStatusTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="status-manager",
            email="status@example.com",
            password="test-password-123",
        )
        self.category = PredictionCategory.objects.create(
            name="Status Tests",
            slug="status-tests",
        )

    def create_prediction(self, **overrides):
        values = {
            "category": self.category,
            "title": "Status Test Prediction",
            "created_by": self.user,
        }
        values.update(overrides)
        return Prediction.objects.create(**values)

    def test_new_prediction_defaults_to_draft(self):
        prediction = self.create_prediction()

        self.assertEqual(prediction.status, Prediction.Status.DRAFT)
        self.assertTrue(prediction.is_editable)
        self.assertFalse(prediction.is_locked)
        self.assertFalse(prediction.is_settled)

    def test_scheduled_prediction_is_editable(self):
        prediction = self.create_prediction(
            status=Prediction.Status.SCHEDULED,
        )

        self.assertTrue(prediction.is_editable)

    def test_published_prediction_is_editable_before_locking(self):
        prediction = self.create_prediction(
            status=Prediction.Status.PUBLISHED,
            locked_at=None,
        )

        self.assertTrue(prediction.is_editable)

    def test_locked_prediction_is_not_editable(self):
        prediction = self.create_prediction(
            status=Prediction.Status.LOCKED,
            locked_at=timezone.now(),
        )

        self.assertFalse(prediction.is_editable)
        self.assertTrue(prediction.is_locked)

    def test_settled_prediction_is_not_editable(self):
        prediction = self.create_prediction(
            status=Prediction.Status.SETTLED,
            settled_at=timezone.now(),
        )

        self.assertFalse(prediction.is_editable)
        self.assertTrue(prediction.is_settled)

    def test_cancelled_prediction_is_not_editable(self):
        prediction = self.create_prediction(
            status=Prediction.Status.CANCELLED,
        )

        self.assertFalse(prediction.is_editable)

class PredictionLifecycleMethodTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="lifecycle-manager",
            email="lifecycle@example.com",
            password="test-password-123",
        )
        self.category = PredictionCategory.objects.create(
            name="Lifecycle Tests",
            slug="lifecycle-tests",
        )

    def create_prediction(self, **overrides):
        values = {
            "category": self.category,
            "title": "Lifecycle Test Prediction",
            "created_by": self.user,
        }
        values.update(overrides)
        return Prediction.objects.create(**values)

    def test_schedule_moves_draft_to_scheduled(self):
        prediction = self.create_prediction()
        scheduled_for = timezone.now() + timedelta(hours=2)

        prediction.schedule(scheduled_for)
        prediction.refresh_from_db()

        self.assertEqual(
            prediction.status,
            Prediction.Status.SCHEDULED,
        )
        self.assertEqual(prediction.scheduled_for, scheduled_for)
        self.assertFalse(prediction.is_published)
        self.assertIsNone(prediction.published_at)

    def test_schedule_rejects_past_time(self):
        prediction = self.create_prediction()

        with self.assertRaisesMessage(
            ValueError,
            "Scheduled publication time must be in the future.",
        ):
            prediction.schedule(
                timezone.now() - timedelta(minutes=1)
            )

    def test_publish_moves_draft_to_published(self):
        prediction = self.create_prediction()

        prediction.publish(self.user)
        prediction.refresh_from_db()

        self.assertEqual(
            prediction.status,
            Prediction.Status.PUBLISHED,
        )
        self.assertTrue(prediction.is_published)
        self.assertIsNotNone(prediction.published_at)
        self.assertEqual(prediction.published_by, self.user)
        self.assertIsNone(prediction.scheduled_for)

    def test_publish_preserves_original_publication_time(self):
        published_at = timezone.now() - timedelta(hours=1)
        prediction = self.create_prediction(
            status=Prediction.Status.PUBLISHED,
            is_published=True,
            published_at=published_at,
        )

        prediction.publish(self.user)
        prediction.refresh_from_db()

        self.assertEqual(prediction.published_at, published_at)

    def test_lock_moves_published_prediction_to_locked(self):
        prediction = self.create_prediction(
            status=Prediction.Status.PUBLISHED,
            is_published=True,
            published_at=timezone.now(),
        )

        prediction.lock()
        prediction.refresh_from_db()

        self.assertEqual(
            prediction.status,
            Prediction.Status.LOCKED,
        )
        self.assertIsNotNone(prediction.locked_at)
        self.assertTrue(prediction.is_published)

    def test_draft_prediction_cannot_be_locked(self):
        prediction = self.create_prediction()

        with self.assertRaisesMessage(
            ValueError,
            "Cannot lock a prediction with status 'draft'.",
        ):
            prediction.lock()

    def test_settle_moves_locked_prediction_to_settled(self):
        prediction = self.create_prediction(
            status=Prediction.Status.LOCKED,
            is_published=True,
            published_at=timezone.now() - timedelta(hours=2),
            locked_at=timezone.now() - timedelta(hours=1),
        )

        prediction.settle(
            Prediction.ResultStatus.WON,
            note="All selections won.",
        )
        prediction.refresh_from_db()

        self.assertEqual(
            prediction.status,
            Prediction.Status.SETTLED,
        )
        self.assertEqual(
            prediction.result_status,
            Prediction.ResultStatus.WON,
        )
        self.assertEqual(
            prediction.result_note,
            "All selections won.",
        )
        self.assertIsNotNone(prediction.settled_at)

    def test_settle_rejects_pending_result(self):
        prediction = self.create_prediction(
            status=Prediction.Status.LOCKED,
            locked_at=timezone.now(),
        )

        with self.assertRaisesMessage(
            ValueError,
            "Settlement result must be won, lost, or void.",
        ):
            prediction.settle(Prediction.ResultStatus.PENDING)

    def test_cancel_moves_scheduled_prediction_to_cancelled(self):
        prediction = self.create_prediction(
            status=Prediction.Status.SCHEDULED,
            scheduled_for=timezone.now() + timedelta(hours=1),
        )

        prediction.cancel()
        prediction.refresh_from_db()

        self.assertEqual(
            prediction.status,
            Prediction.Status.CANCELLED,
        )
        self.assertFalse(prediction.is_published)
        self.assertIsNone(prediction.scheduled_for)
        self.assertIsNone(prediction.published_at)

    def test_published_prediction_cannot_be_cancelled(self):
        prediction = self.create_prediction(
            status=Prediction.Status.PUBLISHED,
            is_published=True,
            published_at=timezone.now(),
        )

        with self.assertRaisesMessage(
            ValueError,
            "Cannot cancel a prediction with status 'published'.",
        ):
            prediction.cancel()

class AutomaticPredictionLockingTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_superuser(
            username="locking-admin",
            email="locking@example.com",
            password="test-password-123",
        )
        self.category = PredictionCategory.objects.create(
            name="Automatic Locking",
            slug="automatic-locking",
        )

    def create_prediction(self, **overrides):
        values = {
            "category": self.category,
            "title": "Automatic Locking Prediction",
            "created_by": self.user,
            "status": Prediction.Status.PUBLISHED,
            "is_published": True,
            "published_at": timezone.now() - timedelta(hours=2),
        }
        values.update(overrides)
        return Prediction.objects.create(**values)

    def create_selection(self, prediction, match_time):
        return PredictionSelection.objects.create(
            prediction=prediction,
            league="Premier League",
            home_team="Home Team",
            away_team="Away Team",
            market="Home Win",
            odds="1.80",
            match_time=match_time,
            selection_order=1,
        )

    def test_due_published_prediction_is_locked(self):
        prediction = self.create_prediction()
        self.create_selection(
            prediction,
            timezone.now() - timedelta(minutes=1),
        )
        output = StringIO()

        call_command(
            "lock_due_predictions",
            stdout=output,
        )

        prediction.refresh_from_db()

        self.assertEqual(
            prediction.status,
            Prediction.Status.LOCKED,
        )
        self.assertIsNotNone(prediction.locked_at)
        self.assertIn(
            "Locked 1 due prediction.",
            output.getvalue(),
        )

    def test_future_prediction_is_not_locked(self):
        prediction = self.create_prediction()
        self.create_selection(
            prediction,
            timezone.now() + timedelta(hours=1),
        )

        call_command("lock_due_predictions")

        prediction.refresh_from_db()

        self.assertEqual(
            prediction.status,
            Prediction.Status.PUBLISHED,
        )
        self.assertIsNone(prediction.locked_at)

    def test_draft_prediction_is_not_locked(self):
        prediction = self.create_prediction(
            status=Prediction.Status.DRAFT,
            is_published=False,
            published_at=None,
        )
        self.create_selection(
            prediction,
            timezone.now() - timedelta(minutes=5),
        )

        call_command("lock_due_predictions")

        prediction.refresh_from_db()

        self.assertEqual(
            prediction.status,
            Prediction.Status.DRAFT,
        )
        self.assertIsNone(prediction.locked_at)

    def test_prediction_without_selections_is_not_locked(self):
        prediction = self.create_prediction()

        call_command("lock_due_predictions")

        prediction.refresh_from_db()

        self.assertEqual(
            prediction.status,
            Prediction.Status.PUBLISHED,
        )
        self.assertIsNone(prediction.locked_at)

    def test_locked_prediction_is_read_only_in_admin(self):
        prediction = self.create_prediction(
            status=Prediction.Status.LOCKED,
            locked_at=timezone.now(),
        )

        request = RequestFactory().get("/")
        request.user = self.user

        prediction_admin = PredictionAdmin(
            Prediction,
            AdminSite(),
        )
        inline_admin = PredictionSelectionInline(
            Prediction,
            AdminSite(),
        )

        readonly_fields = prediction_admin.get_readonly_fields(
            request,
            prediction,
        )

        self.assertIn("title", readonly_fields)
        self.assertIn("status", readonly_fields)
        self.assertFalse(
            prediction_admin.has_delete_permission(
                request,
                prediction,
            )
        )
        self.assertFalse(
            inline_admin.has_add_permission(
                request,
                prediction,
            )
        )
        self.assertFalse(
            inline_admin.has_delete_permission(
                request,
                prediction,
            )
        )
        self.assertEqual(
            inline_admin.get_extra(
                request,
                prediction,
            ),
            0,
        )

class SelectionSettlementEngineTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="settlement-manager",
            email="settlement@example.com",
            password="test-password-123",
        )
        self.category = PredictionCategory.objects.create(
            name="Settlement Tests",
            slug="settlement-tests",
        )

    def create_prediction(self, **overrides):
        values = {
            "category": self.category,
            "title": "Settlement Test Prediction",
            "created_by": self.user,
            "status": Prediction.Status.LOCKED,
            "is_published": True,
            "published_at": timezone.now() - timedelta(hours=2),
            "locked_at": timezone.now() - timedelta(hours=1),
        }
        values.update(overrides)
        return Prediction.objects.create(**values)

    def create_selection(
        self,
        prediction,
        selection_order=1,
        **overrides,
    ):
        values = {
            "prediction": prediction,
            "league": "Premier League",
            "home_team": f"Home Team {selection_order}",
            "away_team": f"Away Team {selection_order}",
            "market": "Home Win",
            "odds": "1.80",
            "match_time": timezone.now() - timedelta(hours=1),
            "selection_order": selection_order,
        }
        values.update(overrides)
        return PredictionSelection.objects.create(**values)

    def test_new_selection_defaults_to_pending(self):
        prediction = self.create_prediction()
        selection = self.create_selection(prediction)

        self.assertEqual(
            selection.result_status,
            PredictionSelection.ResultStatus.PENDING,
        )
        self.assertFalse(selection.is_settled)
        self.assertIsNone(selection.settled_at)

    def test_selection_can_be_settled_as_won(self):
        prediction = self.create_prediction()
        selection = self.create_selection(prediction)

        selection.settle(
            PredictionSelection.ResultStatus.WON,
            note="Home team won.",
        )
        selection.refresh_from_db()
        prediction.refresh_from_db()

        self.assertEqual(
            selection.result_status,
            PredictionSelection.ResultStatus.WON,
        )
        self.assertEqual(
            selection.result_note,
            "Home team won.",
        )
        self.assertTrue(selection.is_settled)
        self.assertIsNotNone(selection.settled_at)
        self.assertEqual(
            prediction.status,
            Prediction.Status.SETTLED,
        )
        self.assertEqual(
            prediction.result_status,
            Prediction.ResultStatus.WON,
        )

    def test_selection_rejects_pending_settlement(self):
        prediction = self.create_prediction()
        selection = self.create_selection(prediction)

        with self.assertRaisesMessage(
            ValueError,
            "Selection result must be won, lost, or void.",
        ):
            selection.settle(
                PredictionSelection.ResultStatus.PENDING
            )

    def test_selection_cannot_be_settled_before_locking(self):
        prediction = self.create_prediction(
            status=Prediction.Status.PUBLISHED,
            locked_at=None,
        )
        selection = self.create_selection(prediction)

        with self.assertRaisesMessage(
            ValueError,
            (
                "Selections can only be settled when their "
                "prediction is locked."
            ),
        ):
            selection.settle(
                PredictionSelection.ResultStatus.WON
            )

    def test_prediction_remains_pending_until_all_selections_settle(self):
        prediction = self.create_prediction()
        first = self.create_selection(prediction, 1)
        second = self.create_selection(prediction, 2)

        first.settle(PredictionSelection.ResultStatus.WON)
        prediction.refresh_from_db()

        self.assertEqual(
            prediction.status,
            Prediction.Status.LOCKED,
        )
        self.assertEqual(
            prediction.result_status,
            Prediction.ResultStatus.PENDING,
        )
        self.assertIsNone(prediction.settled_at)

        second.settle(PredictionSelection.ResultStatus.WON)
        prediction.refresh_from_db()

        self.assertEqual(
            prediction.status,
            Prediction.Status.SETTLED,
        )
        self.assertEqual(
            prediction.result_status,
            Prediction.ResultStatus.WON,
        )
        self.assertIsNotNone(prediction.settled_at)

    def test_any_lost_selection_makes_prediction_lost(self):
        prediction = self.create_prediction()
        first = self.create_selection(prediction, 1)
        second = self.create_selection(prediction, 2)

        first.settle(PredictionSelection.ResultStatus.WON)
        second.settle(PredictionSelection.ResultStatus.LOST)
        prediction.refresh_from_db()

        self.assertEqual(
            prediction.result_status,
            Prediction.ResultStatus.LOST,
        )
        self.assertEqual(
            prediction.status,
            Prediction.Status.SETTLED,
        )

    def test_all_void_selections_make_prediction_void(self):
        prediction = self.create_prediction()
        first = self.create_selection(prediction, 1)
        second = self.create_selection(prediction, 2)

        first.settle(PredictionSelection.ResultStatus.VOID)
        second.settle(PredictionSelection.ResultStatus.VOID)
        prediction.refresh_from_db()

        self.assertEqual(
            prediction.result_status,
            Prediction.ResultStatus.VOID,
        )
        self.assertEqual(
            prediction.status,
            Prediction.Status.SETTLED,
        )

    def test_won_and_void_selections_make_prediction_won(self):
        prediction = self.create_prediction()
        first = self.create_selection(prediction, 1)
        second = self.create_selection(prediction, 2)

        first.settle(PredictionSelection.ResultStatus.WON)
        second.settle(PredictionSelection.ResultStatus.VOID)
        prediction.refresh_from_db()

        self.assertEqual(
            prediction.result_status,
            Prediction.ResultStatus.WON,
        )

    def test_reset_result_reopens_settled_prediction(self):
        prediction = self.create_prediction()
        first = self.create_selection(prediction, 1)
        second = self.create_selection(prediction, 2)

        first.settle(PredictionSelection.ResultStatus.WON)
        second.settle(PredictionSelection.ResultStatus.WON)

        prediction.refresh_from_db()
        self.assertEqual(
            prediction.status,
            Prediction.Status.SETTLED,
        )

        second.reset_result()
        second.refresh_from_db()
        prediction.refresh_from_db()

        self.assertEqual(
            second.result_status,
            PredictionSelection.ResultStatus.PENDING,
        )
        self.assertEqual(second.result_note, "")
        self.assertIsNone(second.settled_at)
        self.assertEqual(
            prediction.status,
            Prediction.Status.LOCKED,
        )
        self.assertEqual(
            prediction.result_status,
            Prediction.ResultStatus.PENDING,
        )
        self.assertIsNone(prediction.settled_at)

    def test_prediction_without_selections_remains_pending(self):
        prediction = self.create_prediction()

        result = prediction.recalculate_result()
        prediction.refresh_from_db()

        self.assertEqual(
            result,
            Prediction.ResultStatus.PENDING,
        )
        self.assertEqual(
            prediction.status,
            Prediction.Status.LOCKED,
        )
        self.assertEqual(
            prediction.result_status,
            Prediction.ResultStatus.PENDING,
        )
