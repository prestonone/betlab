from django.contrib.auth.signals import user_logged_in

REMEMBER_ME_SESSION_AGE = 60 * 60 * 24 * 30  # 30 days


def extend_session_on_remember_me(sender, request, user, **kwargs):
    """Admin login only: 'remember me' is checked by default, giving a
    30-day session. Unchecking it falls back to a browser-session-only
    cookie instead. Has no effect on the JWT-based member-facing login,
    which doesn't use Django sessions."""
    if request is None:
        return

    if request.POST.get("remember_me"):
        request.session.set_expiry(REMEMBER_ME_SESSION_AGE)
    else:
        request.session.set_expiry(0)


def register_signals():
    user_logged_in.connect(extend_session_on_remember_me)
