from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.crypto import constant_time_compare
from django.utils.http import base36_to_int

# Independent of settings.PASSWORD_RESET_TIMEOUT (which must keep governing
# real password resets). Unsubscribe links need to stay valid far longer
# than a password reset link, since a recipient may open a marketing email
# weeks after it was sent.
UNSUBSCRIBE_TOKEN_TIMEOUT = 60 * 24 * 60 * 60  # 60 days


class UnsubscribeTokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        # Deliberately excludes any mutable consent state: clicking the same
        # link twice within the window must keep verifying, not fail because
        # the first click already flipped MarketingConsent.status.
        return f"{user.pk}{timestamp}"

    def check_token(self, user, token):
        """Same as PasswordResetTokenGenerator.check_token, except the
        expiry window is UNSUBSCRIBE_TOKEN_TIMEOUT instead of the global
        settings.PASSWORD_RESET_TIMEOUT."""
        if not (user and token):
            return False

        try:
            ts_b36, _ = token.split("-")
        except ValueError:
            return False

        try:
            ts = base36_to_int(ts_b36)
        except ValueError:
            return False

        for secret in [self.secret, *self.secret_fallbacks]:
            if constant_time_compare(
                self._make_token_with_timestamp(user, ts, secret),
                token,
            ):
                break
        else:
            return False

        if (self._num_seconds(self._now()) - ts) > UNSUBSCRIBE_TOKEN_TIMEOUT:
            return False

        return True


unsubscribe_token = UnsubscribeTokenGenerator()
