from django.urls import path

from .views import (
    LegalContactView,
    MarketingConsentUpdateView,
    MyPolicyAcceptanceView,
    PolicyChangeLogView,
)

app_name = "legal"

urlpatterns = [
    path("policies/", PolicyChangeLogView.as_view(), name="policy-change-log"),
    path("contact/", LegalContactView.as_view(), name="contact"),
    path("my-consent/", MyPolicyAcceptanceView.as_view(), name="my-consent"),
    path("marketing-consent/", MarketingConsentUpdateView.as_view(), name="marketing-consent"),
]
