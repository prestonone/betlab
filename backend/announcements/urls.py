from django.urls import path

from .views import ActiveAnnouncementView

app_name = "announcements"

urlpatterns = [
    path("active/", ActiveAnnouncementView.as_view(), name="active"),
]
