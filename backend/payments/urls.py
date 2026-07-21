from django.urls import path

from .views import InitializePaymentView, PaystackWebhookView, VerifyPaymentView


app_name = "payments"

urlpatterns = [
    path("initialize/", InitializePaymentView.as_view(), name="initialize"),
    path("verify/<str:reference>/", VerifyPaymentView.as_view(), name="verify"),
    path("webhook/paystack/", PaystackWebhookView.as_view(), name="paystack-webhook"),
]
