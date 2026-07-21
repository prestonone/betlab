from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from predictions.models import Prediction


class Command(BaseCommand):
    help = "Publish predictions whose scheduled publishing time has arrived."

    def handle(self, *args, **options):
        now = timezone.now()

        with transaction.atomic():
            due_predictions = Prediction.objects.select_for_update().filter(
                is_published=False,
                scheduled_for__isnull=False,
                scheduled_for__lte=now,
            )

            updated = due_predictions.update(
                is_published=True,
                published_at=now,
                scheduled_for=None,
            )

        label = "prediction" if updated == 1 else "predictions"

        self.stdout.write(
            self.style.SUCCESS(
                f"Published {updated} scheduled {label}."
            )
        )
