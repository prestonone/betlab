from django.db import models


class Announcement(models.Model):
    """A site-wide banner shown to logged-in users on the dashboard.
    Admin-editable so staff can turn it on/off without a deploy. At most
    one should be is_active at a time; the API serves the most recently
    created active row if more than one is somehow left on."""

    title = models.CharField(max_length=200)
    body = models.CharField(max_length=500)
    cta_label = models.CharField(max_length=50, blank=True)
    cta_url = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({'active' if self.is_active else 'inactive'})"
