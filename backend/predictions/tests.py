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
