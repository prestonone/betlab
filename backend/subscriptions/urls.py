from django.urls import path

from .views import (
    ActivateTestSubscriptionView,
    BillingProfileView,
    CountryListView,
    CurrentSubscriptionView,
    PlanListView,
)

app_name = "subscriptions"

urlpatterns = [
    path(
        "current/",
        CurrentSubscriptionView.as_view(),
        name="current-subscription",
    ),
    path(
        "activate-test/",
        ActivateTestSubscriptionView.as_view(),
        name="activate-test-subscription",
    ),
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
