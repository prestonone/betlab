from datetime import timedelta
from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from .models import Prediction, PredictionCategory


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
