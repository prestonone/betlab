from django.core.management.base import BaseCommand, CommandError

from accounts.models import User
from common.email import EmailSendError, send_email
from common.email_templates import NEW_SEASON_EMAIL_SUBJECT, new_season_email
from legal.services import (
    build_unsubscribe_url,
    marketing_campaign_recipients,
    send_marketing_campaign_email,
)

CAMPAIGN_KEY = "new_season_2026"


class Command(BaseCommand):
    help = (
        "One-off send of the 'new season' marketing email to users who have "
        "opted into marketing. Requires exactly one of --dry-run, "
        "--test-send, or --send."
    )

    def add_arguments(self, parser):
        mode = parser.add_mutually_exclusive_group(required=True)
        mode.add_argument(
            "--dry-run",
            action="store_true",
            help="Print who would receive the email. Sends nothing.",
        )
        mode.add_argument(
            "--test-send",
            metavar="EMAIL",
            help="Send the real templated email to one existing user's address, ignoring their consent status. Writes no tracking rows.",
        )
        mode.add_argument(
            "--send",
            action="store_true",
            help="Send the real campaign to every opted-in recipient.",
        )
        parser.add_argument(
            "--yes",
            action="store_true",
            help="Skip the interactive headcount confirmation for --send (non-interactive use only).",
        )

    def handle(self, *args, **options):
        if options["dry_run"]:
            self._dry_run()
        elif options["test_send"]:
            self._test_send(options["test_send"])
        elif options["send"]:
            self._send(skip_confirmation=options["yes"])

    def _dry_run(self):
        recipients = list(marketing_campaign_recipients())
        self.stdout.write(f"Would send campaign '{CAMPAIGN_KEY}' to {len(recipients)} recipient(s).")
        for user in recipients[:10]:
            self.stdout.write(f"  - {user.email}")
        if len(recipients) > 10:
            self.stdout.write(f"  ... and {len(recipients) - 10} more")
        self.stdout.write(self.style.SUCCESS("Dry run complete. No emails were sent."))

    def _test_send(self, email: str):
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist as exc:
            raise CommandError(f"No user found with email '{email}'.") from exc

        unsubscribe_url = build_unsubscribe_url(user)
        html, text = new_season_email(unsubscribe_url=unsubscribe_url)

        try:
            send_email(to=user.email, subject=NEW_SEASON_EMAIL_SUBJECT, html=html, text=text)
        except EmailSendError as exc:
            raise CommandError(f"Test send failed: {exc}") from exc

        self.stdout.write(self.style.SUCCESS(f"Test email sent to {user.email}."))
        self.stdout.write(f"Unsubscribe URL: {unsubscribe_url}")

    def _send(self, *, skip_confirmation: bool):
        count = marketing_campaign_recipients().count()

        if count == 0:
            self.stdout.write(self.style.WARNING("No opted-in recipients. Nothing to send."))
            return

        self.stdout.write(f"About to send campaign '{CAMPAIGN_KEY}' to {count} opted-in recipient(s).")

        if not skip_confirmation:
            typed = input(f"Type {count} to confirm this headcount and proceed: ").strip()
            if typed != str(count):
                self.stdout.write(self.style.WARNING("Confirmation did not match. Aborted, nothing sent."))
                return

        result = send_marketing_campaign_email(
            campaign=CAMPAIGN_KEY,
            subject=NEW_SEASON_EMAIL_SUBJECT,
            build_email=lambda unsubscribe_url: new_season_email(unsubscribe_url=unsubscribe_url),
        )

        summary = (
            f"Campaign '{CAMPAIGN_KEY}' complete: {result.sent} sent, "
            f"{result.failed} failed, {result.already_sent} already sent "
            f"(of {result.total_recipients} recipients)."
        )
        if result.failed:
            self.stdout.write(self.style.WARNING(summary))
            self.stdout.write("Check the MarketingEmailSend admin list filtered to status=failed.")
        else:
            self.stdout.write(self.style.SUCCESS(summary))
