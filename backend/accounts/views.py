import logging

from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.email import EmailSendError

from .emails import send_password_reset_email, send_verification_email
from .models import User
from .serializers import (
    EmailVerificationConfirmSerializer,
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UserSerializer,
)
from .tokens import email_verification_token

logger = logging.getLogger(__name__)


def _user_from_uid(uid: str) -> User | None:
    try:
        pk = force_str(urlsafe_base64_decode(uid))
        return User.objects.get(pk=pk)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return None


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()
        tokens = LoginSerializer.get_tokens(user)

        try:
            send_verification_email(user)
        except EmailSendError:
            logger.exception("Could not send verification email to %s", user.email)

        return Response(
            {
                **tokens,
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        tokens = serializer.get_tokens(user)

        return Response(
            {
                **tokens,
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            UserSerializer(request.user).data,
            status=status.HTTP_200_OK,
        )


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].strip().lower()
        user = User.objects.filter(email__iexact=email).first()

        if user is not None:
            try:
                send_password_reset_email(user)
            except EmailSendError:
                logger.exception("Could not send password reset email to %s", email)

        return Response(
            {"detail": "If an account exists for that email, a reset link has been sent."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = _user_from_uid(serializer.validated_data["uid"])
        token = serializer.validated_data["token"]

        if user is None or not default_token_generator.check_token(user, token):
            return Response(
                {"detail": "This reset link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])

        return Response(
            {"detail": "Your password has been reset."},
            status=status.HTTP_200_OK,
        )


class EmailVerificationConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmailVerificationConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = _user_from_uid(serializer.validated_data["uid"])
        token = serializer.validated_data["token"]

        if user is None or not email_verification_token.check_token(user, token):
            return Response(
                {"detail": "This verification link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.is_email_verified:
            user.is_email_verified = True
            user.save(update_fields=["is_email_verified"])

        return Response(
            {"detail": "Your email address has been verified."},
            status=status.HTTP_200_OK,
        )


class ResendVerificationEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.is_email_verified:
            return Response(
                {"detail": "Your email is already verified."},
                status=status.HTTP_200_OK,
            )

        try:
            send_verification_email(user)
        except EmailSendError:
            logger.exception("Could not resend verification email to %s", user.email)
            return Response(
                {"detail": "Could not send the verification email right now. Try again shortly."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {"detail": "Verification email sent."},
            status=status.HTTP_200_OK,
        )
