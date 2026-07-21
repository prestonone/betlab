from rest_framework import serializers

from subscriptions.serializers import CurrentSubscriptionSerializer

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    plan_code = serializers.CharField(source="plan.code", read_only=True)
    plan_name = serializers.CharField(source="plan.name", read_only=True)
    subscription = CurrentSubscriptionSerializer(read_only=True)

    class Meta:
        model = Payment
        fields = (
            "reference",
            "provider_reference",
            "plan_code",
            "plan_name",
            "amount",
            "currency",
            "status",
            "paid_at",
            "subscription",
        )
