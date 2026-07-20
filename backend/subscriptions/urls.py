from django.urls import path

from .views import BillingProfileView, CountryListView, PlanListView

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
    path(
        "billing-profile/",
        BillingProfileView.as_view(),
        name="billing-profile",
    ),
]
