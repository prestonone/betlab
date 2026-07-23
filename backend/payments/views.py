import hashlib
import hmac
import json
import logging
import uuid

from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from common.api import error_response, success_response
from legal.models import PolicyDocument, UserPolicyAcceptance
from legal.services import PolicyNotConfigured, has_current_acceptance, record_acceptance

from .models import Payment
from .paystack import PaystackError, initialize_transaction, verify_transaction
from .serializers import PaymentSerializer
from .services import (
    PaymentValidationError,
    amount_to_minor_units,
    get_checkout_price,
    process_verified_payment,
)


logger = logging.getLogger(__name__)


def _payment_error(message: str, status_code=status.HTTP_400_BAD_REQUEST):
    return error_response(message=message, status_code=status_code)


class InitializePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        plan_code = str(request.data.get("plan", "")).strip().lower()
        if not plan_code:
            return _payment_error("Plan is required.")

        already_acknowledged = has_current_acceptance(
            user=request.user,
            policy_type=PolicyDocument.PolicyType.REFUND_POLICY,
        )
        if not already_acknowledged:
            if not request.data.get("accepted_refund_policy"):
                return _payment_error(
                    "You must review and acknowledge the Refund and Subscription Policy before checking out."
                )
            try:
                record_acceptance(
                    user=request.user,
                    policy_type=PolicyDocument.PolicyType.REFUND_POLICY,
                    source=UserPolicyAcceptance.Source.CHECKOUT,
                    request=request,
                )
            except PolicyNotConfigured:
                logger.error("Checkout blocked: refund policy is not configured.")
                return _payment_error(
                    "Checkout is temporarily unavailable. Please try again shortly.",
                    status.HTTP_503_SERVICE_UNAVAILABLE,
                )

        try:
            plan, price = get_checkout_price(user=request.user, plan_code=plan_code)
        except PaymentValidationError as exc:
            return _payment_error(str(exc))

        reference = f"BL-{uuid.uuid4().hex.upper()}"
        payment = Payment.objects.create(
            user=request.user,
            plan=plan,
            plan_price=price,
            reference=reference,
            amount=price.amount,
            currency=price.currency,
        )
        callback_url = settings.PAYSTACK_CALLBACK_URL
        payload = {
            "email": request.user.email,
            "amount": amount_to_minor_units(price.amount),
            "currency": price.currency,
            "reference": reference,
            "callback_url": callback_url,
            "metadata": {
                "payment_id": payment.pk,
                "user_id": request.user.pk,
                "plan_code": plan.code,
            },
        }

        try:
            provider_data = initialize_transaction(payload)
        except PaystackError as exc:
            payment.status = Payment.Status.FAILED
            payment.save(update_fields=["status", "updated_at"])
            logger.warning("Paystack initialization failed for payment %s", payment.pk)
            return _payment_error(str(exc), status.HTTP_503_SERVICE_UNAVAILABLE)

        if not provider_data.get("authorization_url") or not provider_data.get("access_code"):
            payment.status = Payment.Status.FAILED
            payment.save(update_fields=["status", "updated_at"])
            logger.warning("Paystack initialization returned incomplete data for payment %s", payment.pk)
            return _payment_error(
                "The payment provider returned an incomplete checkout response.",
                status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return success_response(
            data={
                "authorization_url": provider_data.get("authorization_url"),
                "access_code": provider_data.get("access_code"),
                "reference": reference,
            },
            message="Payment initialized successfully.",
            status_code=status.HTTP_201_CREATED,
        )


class VerifyPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, reference):
        payment = (
            Payment.objects.select_related("plan", "subscription", "subscription__plan")
            .filter(reference=reference, user=request.user)
            .first()
        )
        if payment is None:
            return _payment_error("Payment was not found.", status.HTTP_404_NOT_FOUND)
        if payment.status == Payment.Status.SUCCESS:
            return success_response(
                data=PaymentSerializer(payment).data,
                message="Payment was already verified.",
            )

        try:
            provider_data = verify_transaction(reference)
            payment, activated = process_verified_payment(
                payment=payment,
                provider_data=provider_data,
            )
        except PaystackError as exc:
            logger.warning("Paystack verification failed for payment %s", payment.pk)
            return _payment_error(str(exc), status.HTTP_503_SERVICE_UNAVAILABLE)
        except PaymentValidationError as exc:
            return _payment_error(str(exc))

        if payment.status != Payment.Status.SUCCESS:
            if payment.status == Payment.Status.PENDING:
                payment = Payment.objects.select_related("plan").get(pk=payment.pk)
                return success_response(
                    data=PaymentSerializer(payment).data,
                    message="Payment confirmation is still pending.",
                    status_code=status.HTTP_202_ACCEPTED,
                )
            if payment.status == Payment.Status.ABANDONED:
                return _payment_error("Payment was abandoned or cancelled.")
            return _payment_error("The transaction was not successful.")

        payment = Payment.objects.select_related(
            "plan", "subscription", "subscription__plan"
        ).get(pk=payment.pk)
        return success_response(
            data=PaymentSerializer(payment).data,
            message=(
                "Payment verified and subscription activated."
                if activated
                else "Payment was already verified."
            ),
        )


@method_decorator(csrf_exempt, name="dispatch")
class PaystackWebhookView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        secret = settings.PAYSTACK_WEBHOOK_SECRET or settings.PAYSTACK_SECRET_KEY
        if not secret:
            logger.error("Paystack webhook received while webhook secret is unset")
            return _payment_error("Webhook is not configured.", status.HTTP_503_SERVICE_UNAVAILABLE)

        signature = request.headers.get("x-paystack-signature", "")
        expected = hmac.new(
            secret.encode("utf-8"),
            request.body,
            hashlib.sha512,
        ).hexdigest()
        if not signature or not hmac.compare_digest(signature, expected):
            return _payment_error("Invalid webhook signature.", status.HTTP_401_UNAUTHORIZED)

        try:
            event = json.loads(request.body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return _payment_error("Malformed webhook payload.")

        if event.get("event") != "charge.success":
            return success_response(message="Event ignored.")
        provider_data = event.get("data")
        if not isinstance(provider_data, dict):
            return _payment_error("Malformed webhook payload.")

        reference = str(provider_data.get("reference", ""))
        payment = Payment.objects.filter(reference=reference).first()
        if payment is None:
            logger.warning("Paystack webhook referenced an unknown payment")
            return success_response(message="Unknown payment ignored.")

        try:
            _, activated = process_verified_payment(
                payment=payment,
                provider_data=provider_data,
            )
        except PaymentValidationError:
            logger.warning("Paystack webhook validation failed for payment %s", payment.pk)
            return _payment_error("Payment validation failed.")

        return success_response(
            message=(
                "Payment processed successfully."
                if activated
                else "Payment was already processed."
            )
        )
