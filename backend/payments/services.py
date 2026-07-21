from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from subscriptions.models import BillingProfile, Plan, PlanPrice, Subscription
from subscriptions.services import activate_or_extend_subscription

from .models import Payment


class PaymentValidationError(Exception):
    pass


def amount_to_minor_units(amount: Decimal) -> int:
    return int(amount * 100)


def get_checkout_price(*, user, plan_code: str) -> tuple[Plan, PlanPrice]:
    profile = (
        BillingProfile.objects.select_related("country")
        .filter(user=user)
        .first()
    )
    if profile is None:
        raise PaymentValidationError("Select your billing country before subscribing.")
    if not profile.country.checkout_enabled:
        raise PaymentValidationError("Checkout is not available in your billing country.")

    plan = Plan.objects.filter(code__iexact=plan_code, is_active=True).first()
    if plan is None:
        raise PaymentValidationError("The selected plan is unavailable.")

    price = PlanPrice.objects.filter(
        plan=plan,
        country=profile.country,
        currency=profile.country.default_currency,
        is_active=True,
    ).first()
    if price is None:
        raise PaymentValidationError("The selected plan has no active local price.")
    if price.amount <= 0:
        raise PaymentValidationError("The selected plan price is invalid.")

    return plan, price


def _safe_metadata(data: dict) -> dict:
    return {
        "channel": data.get("channel"),
        "gateway_response": data.get("gateway_response"),
    }


@transaction.atomic
def process_verified_payment(*, payment: Payment, provider_data: dict) -> tuple[Payment, bool]:
    payment = (
        Payment.objects.select_for_update()
        .select_related("user", "plan", "plan_price")
        .get(pk=payment.pk)
    )
    if payment.status == Payment.Status.SUCCESS:
        return payment, False

    provider_reference = str(provider_data.get("reference", ""))
    if provider_reference != payment.reference:
        raise PaymentValidationError("The transaction reference is invalid.")
    if provider_data.get("status") != "success":
        provider_status = str(provider_data.get("status", "failed"))
        if provider_status in {"pending", "ongoing", "processing"}:
            payment.provider_metadata = _safe_metadata(provider_data)
            payment.save(update_fields=["provider_metadata", "updated_at"])
            return payment, False
        payment.status = Payment.Status.ABANDONED if provider_status == "abandoned" else Payment.Status.FAILED
        payment.provider_metadata = _safe_metadata(provider_data)
        payment.save(update_fields=["status", "provider_metadata", "updated_at"])
        return payment, False

    try:
        provider_amount = int(provider_data.get("amount"))
    except (TypeError, ValueError) as exc:
        raise PaymentValidationError("The transaction amount is invalid.") from exc
    if provider_amount != amount_to_minor_units(payment.amount):
        raise PaymentValidationError("The transaction amount does not match the selected plan.")
    if str(provider_data.get("currency", "")).upper() != payment.currency:
        raise PaymentValidationError("The transaction currency does not match the selected plan.")

    subscription = activate_or_extend_subscription(
        user=payment.user,
        plan=payment.plan,
        source=Subscription.Source.PAYSTACK,
    )
    payment.subscription = subscription
    payment.provider_reference = provider_reference
    payment.status = Payment.Status.SUCCESS
    payment.provider_metadata = _safe_metadata(provider_data)
    payment.paid_at = timezone.now()
    payment.save(update_fields=[
        "subscription",
        "provider_reference",
        "status",
        "provider_metadata",
        "paid_at",
        "updated_at",
    ])

    profile = BillingProfile.objects.select_for_update().get(user=payment.user)
    if not profile.country_locked:
        profile.country_locked = True
        profile.save(update_fields=["country_locked", "updated_at"])

    return payment, True
