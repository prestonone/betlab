from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Min
from django.utils import timezone

from predictions.models import Prediction


class Command(BaseCommand):
    help = (
        "Lock published predictions when their earliest selection "
        "kickoff time has arrived."
    )

    def handle(self, *args, **options):
        now = timezone.now()

        due_prediction_ids = list(
            Prediction.objects.filter(
                status=Prediction.Status.PUBLISHED,
            )
            .annotate(
                earliest_match_time=Min("selections__match_time"),
            )
            .filter(
                earliest_match_time__isnull=False,
                earliest_match_time__lte=now,
            )
            .values_list("id", flat=True)
        )

        locked_count = 0

        with transaction.atomic():
            due_predictions = (
                Prediction.objects.select_for_update()
                .filter(
                    id__in=due_prediction_ids,
                    status=Prediction.Status.PUBLISHED,
                )
                .order_by("id")
            )

            for prediction in due_predictions:
                prediction.lock()
                locked_count += 1

        label = "prediction" if locked_count == 1 else "predictions"

        self.stdout.write(
            self.style.SUCCESS(
                f"Locked {locked_count} due {label}."
            )
        )
