from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient


class AuthenticationApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_registration_returns_tokens_and_normalizes_email(self):
        response = self.client.post(
            reverse("accounts:register"),
            {
                "username": "new-member",
                "email": "MEMBER@EXAMPLE.COM",
                "password": "strong-test-password-123",
                "password_confirm": "strong-test-password-123",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertIn("access", response.data)
        self.assertEqual(response.data["user"]["email"], "member@example.com")

    def test_login_and_protected_current_user(self):
        get_user_model().objects.create_user(
            username="member",
            email="member@example.com",
            password="strong-test-password-123",
        )
        login = self.client.post(
            reverse("accounts:login"),
            {"email": "member@example.com", "password": "strong-test-password-123"},
            format="json",
        )
        self.assertEqual(login.status_code, 200)
        anonymous = self.client.get(reverse("accounts:current-user"))
        self.assertEqual(anonymous.status_code, 401)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        current = self.client.get(reverse("accounts:current-user"))
        self.assertEqual(current.status_code, 200)
        self.assertEqual(current.data["email"], "member@example.com")
