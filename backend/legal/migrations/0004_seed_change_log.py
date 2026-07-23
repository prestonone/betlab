from datetime import date

from django.db import migrations


def seed_change_log(apps, schema_editor):
    PolicyDocument = apps.get_model("legal", "PolicyDocument")

    PolicyDocument.objects.filter(change_summary="").update(
        change_summary="Initial publication."
    )

    merges = [
        ("terms_of_service", "2.0", "Merged the separate Terms of Use document into the Terms of Service for a single, clearer contract."),
        ("disclaimer", "2.0", "Merged the separate Risk Disclosure Statement into the Disclaimer for a single, clearer risk and responsible-use notice."),
    ]
    for policy_type, version, summary in merges:
        PolicyDocument.objects.filter(policy_type=policy_type, is_active=True).update(is_active=False)
        PolicyDocument.objects.update_or_create(
            policy_type=policy_type,
            version=version,
            defaults={
                "effective_date": date.today(),
                "is_active": True,
                "is_material_change": True,
                "change_summary": summary,
            },
        )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("legal", "0003_policydocument_change_summary"),
    ]

    operations = [
        migrations.RunPython(seed_change_log, noop_reverse),
    ]
