from rest_framework import serializers

from .models import MarketingConsent, PolicyDocument, UserPolicyAcceptance


class PolicyDocumentSerializer(serializers.ModelSerializer):
    policy_type_display = serializers.CharField(source="get_policy_type_display", read_only=True)

    class Meta:
        model = PolicyDocument
        fields = ["policy_type", "policy_type_display", "version", "effective_date", "is_active", "is_material_change", "change_summary"]


class LegalContactSerializer(serializers.Serializer):
    CATEGORY_CHOICES = [
        ("privacy_request", "Privacy Request"),
        ("legal_question", "Legal Question"),
        ("copyright_notice", "Copyright Notice"),
        ("refund_request", "Refund Request"),
        ("responsible_gambling", "Responsible Gambling"),
        ("general", "General Legal Inquiry"),
    ]

    category = serializers.ChoiceField(choices=CATEGORY_CHOICES)
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    message = serializers.CharField(max_length=5000)

    def get_category_label(self) -> str:
        return dict(self.CATEGORY_CHOICES)[self.validated_data["category"]]


class MyPolicyAcceptanceSerializer(serializers.ModelSerializer):
    policy_type = serializers.CharField(source="policy.policy_type")
    policy_type_display = serializers.CharField(source="policy.get_policy_type_display")
    version = serializers.CharField(source="policy.version")

    class Meta:
        model = UserPolicyAcceptance
        fields = ["policy_type", "policy_type_display", "version", "accepted_at", "acceptance_source"]


class MarketingConsentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketingConsent
        fields = ["status", "consented_at", "withdrawn_at"]


class MarketingConsentUpdateSerializer(serializers.Serializer):
    opted_in = serializers.BooleanField()
