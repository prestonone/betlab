from django.urls import path

from .views import CountryListView

app_name = "subscriptions"

urlpatterns = [
    path(
        "countries/",
        CountryListView.as_view(),
        name="country-list",
    ),
]
