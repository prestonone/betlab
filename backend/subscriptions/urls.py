from django.urls import path

from .views import CountryListView, PlanListView

app_name = "subscriptions"

urlpatterns = [
    path(
        "countries/",
        CountryListView.as_view(),
        name="country-list",
    ),
    path(
        "plans/",
        PlanListView.as_view(),
        name="plan-list",
    ),
]
