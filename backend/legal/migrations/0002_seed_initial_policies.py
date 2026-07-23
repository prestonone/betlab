from datetime import date

from django.db import migrations


POLICY_TYPES = [
    "terms_of_service",
    "terms_of_use",
    "privacy_policy",
    "refund_policy",
    "disclaimer",
    "cookie_policy",
    "copyright_policy",
    "acceptable_use",
    "risk_disclosure",
    "responsible_gambling",
    "aml_kyc",
    "methodology",
]


def seed_policies(apps, schema_editor):
    PolicyDocument = apps.get_model("legal", "PolicyDocument")
    today = date.today()

    for policy_type in POLICY_TYPES:
        PolicyDocument.objects.get_or_create(
            policy_type=policy_type,
            version="1.0",
            defaults={"effective_date": today, "is_active": True},
        )


def noop_reverse(apps, schema_editor):
    # Intentionally not deleting - these are real records referenced by
    # UserPolicyAcceptance rows by the time anyone would reverse this.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("legal", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_policies, noop_reverse),
    ]
