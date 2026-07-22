from django.conf import settings

GOLD = "#D4AF37"
INK = "#070E1A"
NAVY = "#0B1220"
CARD = "#111C2E"
MUTED = "rgba(237,240,245,0.5)"
FAINT = "rgba(237,240,245,0.3)"


def _logo_url() -> str:
    return f"{settings.FRONTEND_URL}/email-logo.gif"


def _button(label: str, url: str) -> str:
    return f"""
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr>
        <td style="background:{GOLD};border-radius:6px;">
          <a href="{url}" style="display:inline-block;padding:13px 30px;font-family:Arial,Helvetica,sans-serif;
            font-size:14px;font-weight:bold;color:{INK};text-decoration:none;border-radius:6px;">{label}</a>
        </td>
      </tr>
    </table>
    """


def _base_email(*, preheader: str, body_html: str) -> str:
    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bet Lab</title>
  </head>
  <body style="margin:0;padding:0;background:{NAVY};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">{preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{NAVY};padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
            style="max-width:480px;background:{CARD};border:1px solid rgba(212,175,55,0.15);border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid rgba(212,175,55,0.08);">
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                  <tr>
                    <td style="vertical-align:middle;">
                      <img src="{_logo_url()}" width="32" height="32" alt="Bet Lab"
                        style="display:block;border-radius:7px;width:32px;height:32px;" />
                    </td>
                    <td style="padding-left:10px;vertical-align:middle;font-family:Arial,Helvetica,sans-serif;
                      font-size:20px;font-weight:bold;letter-spacing:1px;color:#ffffff;">
                      BET<span style="color:{GOLD};">LAB</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;font-family:Arial,Helvetica,sans-serif;color:#EDF0F5;">
                {body_html}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.5px;color:{FAINT};">
                  Bet Lab &middot; Football Intelligence, Refined
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""


def verification_email(link: str) -> tuple[str, str]:
    body = f"""
    <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;
      letter-spacing:2px;text-transform:uppercase;color:{GOLD};">Welcome to the Lab</p>
    <h1 style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:24px;color:#ffffff;">
      Verify your email address</h1>
    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:{MUTED};">
      One quick step to finish setting up your account and secure your access to daily prediction intelligence.</p>
    {_button("Verify Email Address", link)}
    <p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:{FAINT};">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="{link}" style="color:{GOLD};word-break:break-all;">{link}</a></p>
    <p style="margin:20px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:{FAINT};">
      If you didn't create a Bet Lab account, you can safely ignore this email.</p>
    """
    html = _base_email(
        preheader="Verify your email to finish setting up your Bet Lab account.",
        body_html=body,
    )
    text = (
        "Welcome to Bet Lab.\n\n"
        "Confirm your email address to finish setting up your account:\n"
        f"{link}\n\n"
        "If you didn't create this account, you can safely ignore this email."
    )
    return html, text


def password_reset_email(link: str) -> tuple[str, str]:
    body = f"""
    <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;
      letter-spacing:2px;text-transform:uppercase;color:{GOLD};">Account Security</p>
    <h1 style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:24px;color:#ffffff;">
      Reset your password</h1>
    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:{MUTED};">
      We received a request to reset the password on your Bet Lab account. Click below to choose a new one.</p>
    {_button("Reset Password", link)}
    <p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:{FAINT};">
      This link can only be used once. If the button doesn't work, copy and paste this link:<br/>
      <a href="{link}" style="color:{GOLD};word-break:break-all;">{link}</a></p>
    <p style="margin:20px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:{FAINT};">
      Didn't request this? You can safely ignore this email &mdash; your password won't change unless you click the link above.</p>
    """
    html = _base_email(
        preheader="Reset your Bet Lab password.",
        body_html=body,
    )
    text = (
        "We received a request to reset your Bet Lab password.\n\n"
        f"Choose a new password: {link}\n\n"
        "If you didn't request this, you can safely ignore this email."
    )
    return html, text
