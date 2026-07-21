from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("payments", "0001_initial"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="payment",
            constraint=models.CheckConstraint(
                condition=models.Q(amount__gt=0),
                name="payment_amount_greater_than_zero",
            ),
        ),
        migrations.AddConstraint(
            model_name="payment",
            constraint=models.UniqueConstraint(
                fields=("provider_reference",),
                condition=~models.Q(provider_reference=""),
                name="unique_nonempty_provider_reference",
            ),
        ),
    ]
