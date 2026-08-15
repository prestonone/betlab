import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.api import error_response, success_response
from common.email import EmailSendError, send_email

from .models import MarketingConsent, PolicyDocument, UserPolicyAcceptance
from .serializers import (
    LegalContactSerializer,
    MarketingConsentSerializer,
    MarketingConsentUpdateSerializer,
    MyPolicyAcceptanceSerializer,
    PolicyDocumentSerializer,
    UnsubscribeConfirmSerializer,
)
from .services import record_marketing_consent
from .tokens import unsubscribe_token

logger = logging.getLogger(__name__)

User = get_user_model()


def _user_from_uid(uid: str):
    try:
        pk = force_str(urlsafe_base64_decode(uid))
        return User.objects.get(pk=pk)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return None


class PolicyChangeLogView(ListAPIView):
    """Public, read-only history of every policy version ever published,
    newest first per policy type. Powers the frontend Change Log page."""

    permission_classes = [AllowAny]
    serializer_class = PolicyDocumentSerializer
    queryset = PolicyDocument.objects.all().order_by("policy_type", "-effective_date")


class LegalContactView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LegalContactSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        html = (
            f"<p><strong>Category:</strong> {serializer.get_category_label()}</p>"
            f"<p><strong>From:</strong> {data['name']} ({data['email']})</p>"
            f"<p><strong>Message:</strong></p><p>{data['message']}</p>"
        )
        text = (
            f"Category: {serializer.get_category_label()}\n"
            f"From: {data['name']} ({data['email']})\n\n"
            f"{data['message']}"
        )

        try:
            send_email(
                to=settings.LEGAL_EMAIL,
                subject=f"[Bet Lab Legal] {serializer.get_category_label()} from {data['name']}",
                html=html,
                text=text,
            )
        except EmailSendError:
            logger.exception("Could not deliver legal contact submission")
            return error_response(
                message="We could not send your message right now. Please try again shortly or email us directly.",
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return success_response(message="Your message has been sent. We aim to respond within a reasonable time.")


class MyPolicyAcceptanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        latest_by_type = {}
        for acceptance in (
            UserPolicyAcceptance.objects.filter(user=request.user)
            .select_related("policy")
            .order_by("policy__policy_type", "-accepted_at")
        ):
            latest_by_type.setdefault(acceptance.policy.policy_type, acceptance)

        acceptances = MyPolicyAcceptanceSerializer(latest_by_type.values(), many=True).data

        marketing, _ = MarketingConsent.objects.get_or_create(user=request.user)

        return success_response(data={
            "acceptances": acceptances,
            "marketing_consent": MarketingConsentSerializer(marketing).data,
        })


class MarketingConsentUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = MarketingConsentUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        consent = record_marketing_consent(
            user=request.user,
            opted_in=serializer.validated_data["opted_in"],
            source="account_settings",
            request=request,
        )

        return success_response(
            data=MarketingConsentSerializer(consent).data,
            message="Marketing preference updated.",
        )


class UnsubscribeConfirmView(APIView):
    """Public, token-authenticated unsubscribe action. Deliberately POST-only
    (no state change on GET): some email clients and corporate link
    scanners prefetch GET links inside emails before a human clicks them,
    which would silently unsubscribe people who never clicked anything.
    The frontend /unsubscribe page GETs to show a confirmation screen, then
    POSTs here to actually record the opt-out."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UnsubscribeConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = _user_from_uid(serializer.validated_data["uid"])
        token = serializer.validated_data["token"]

        if user is None or not unsubscribe_token.check_token(user, token):
            return error_response(
                message="This unsubscribe link is invalid or has expired.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        record_marketing_consent(
            user=user,
            opted_in=False,
            source="email_unsubscribe",
            request=request,
        )

        return success_response(message="You've been unsubscribed from Bet Lab marketing emails.")
