from datetime import date

from django.core.management.base import BaseCommand

from legal.models import PolicyDocument


class Command(BaseCommand):
    help = "Create the initial v1.0 PolicyDocument row for every policy type, if missing."

    def add_arguments(self, parser):
        parser.add_argument(
            "--effective-date",
            default=None,
            help="ISO date (YYYY-MM-DD) to use as the effective date. Defaults to today.",
        )

    def handle(self, *args, **options):
        effective_date = options["effective_date"]
        effective_date = date.fromisoformat(effective_date) if effective_date else date.today()

        created = 0
        for policy_type, _label in PolicyDocument.PolicyType.choices:
            _, was_created = PolicyDocument.objects.get_or_create(
                policy_type=policy_type,
                version="1.0",
                defaults={
                    "effective_date": effective_date,
                    "is_active": True,
                },
            )
            if was_created:
                created += 1
                self.stdout.write(self.style.SUCCESS(f"Created {policy_type} v1.0"))
            else:
                self.stdout.write(f"{policy_type} v1.0 already exists")

        self.stdout.write(self.style.SUCCESS(f"Finished: {created} policy documents created."))
