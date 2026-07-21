from django.db import migrations, models


def populate_prediction_status(apps, schema_editor):
    Prediction = apps.get_model("predictions", "Prediction")

    Prediction.objects.all().update(status="draft")

    Prediction.objects.filter(
        is_published=False,
        scheduled_for__isnull=False,
    ).update(status="scheduled")

    Prediction.objects.filter(
        is_published=True,
    ).update(status="published")

    Prediction.objects.filter(
        locked_at__isnull=False,
    ).update(status="locked")

    Prediction.objects.exclude(
        result_status="pending",
    ).update(status="settled")

    Prediction.objects.filter(
        settled_at__isnull=False,
    ).update(status="settled")


def reverse_prediction_status(apps, schema_editor):
    Prediction = apps.get_model("predictions", "Prediction")
    Prediction.objects.all().update(status="draft")


class Migration(migrations.Migration):

    dependencies = [
        (
            "predictions",
            "0003_prediction_locked_at_prediction_published_by_and_more",
        ),
    ]

    operations = [
        migrations.AddField(
            model_name="prediction",
            name="status",
            field=models.CharField(
                choices=[
                    ("draft", "Draft"),
                    ("scheduled", "Scheduled"),
                    ("published", "Published"),
                    ("locked", "Locked"),
                    ("settled", "Settled"),
                    ("cancelled", "Cancelled"),
                ],
                default="draft",
                max_length=12,
            ),
        ),
        migrations.RunPython(
            populate_prediction_status,
            reverse_prediction_status,
        ),
    ]
