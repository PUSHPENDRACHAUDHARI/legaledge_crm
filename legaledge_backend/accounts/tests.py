from django.db import IntegrityError
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import CustomUser
from .serializers import UserSerializer


@override_settings(ALLOWED_HOSTS=["testserver", "localhost", "127.0.0.1"])
class LoginApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            email="admin@legaledge.in",
            name="Admin User",
            password="Admin@123",
            role="admin",
            is_staff=True,
            is_superuser=True,
        )
        self.manager = CustomUser.objects.create_user(
            email="manager@legaledge.in",
            name="Manager User",
            password="Manager@123",
            role="manager",
            team_id="team_02",
        )

    def test_login_returns_tokens_for_valid_credentials(self):
        response = self.client.post(
            "/api/auth/login/",
            {"email": "admin@legaledge.in", "password": "Admin@123"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], "admin@legaledge.in")

    def test_login_returns_400_for_invalid_password(self):
        response = self.client.post(
            "/api/auth/login/",
            {"email": "admin@legaledge.in", "password": "wrongpass"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"], "Invalid email or password. Please try again.")

    def test_model_rejects_case_variant_duplicate_email(self):
        duplicate = CustomUser(
            email="Admin@legaledge.in",
            name="Duplicate Admin",
            role="admin",
            is_staff=True,
            is_superuser=True,
        )
        duplicate.set_password("Admin@123")
        with self.assertRaises(IntegrityError):
            duplicate.save()

    def test_signup_rejects_case_variant_duplicate_email(self):
        response = self.client.post(
            "/api/auth/signup/",
            {
                "email": "Admin@LegalEdge.in",
                "name": "Another Admin",
                "password": "Admin@123",
                "confirm_password": "Admin@123",
                "role": "admin",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data["errors"])

    def test_signup_rejects_duplicate_mobile_number(self):
        CustomUser.objects.create_user(
            email="manager@legaledge.in",
            name="Manager User",
            password="Manager@123",
            role="manager",
            mobile_number="9876543210",
        )

        response = self.client.post(
            "/api/auth/signup/",
            {
                "email": "new.user@legaledge.in",
                "name": "New User",
                "mobile_number": "9876543210",
                "password": "User@123",
                "confirm_password": "User@123",
                "role": "user",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("mobile_number", response.data["errors"])

    def test_user_serializer_allows_same_email_and_mobile_for_self_update(self):
        self.user.mobile_number = "9999999999"
        self.user.save()

        serializer = UserSerializer(
            self.user,
            data={"email": "Admin@LegalEdge.in", "mobile_number": "9999999999", "name": self.user.name},
            partial=True,
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_user_serializer_rejects_duplicate_mobile_number_on_update(self):
        other_user = CustomUser.objects.create_user(
            email="user@legaledge.in",
            name="Regular User",
            password="User@123",
            role="user",
            mobile_number="8888888888",
        )

        serializer = UserSerializer(
            self.user,
            data={"mobile_number": other_user.mobile_number},
            partial=True,
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("mobile_number", serializer.errors)

    def test_manager_can_list_only_team_users(self):
        team_user = CustomUser.objects.create_user(
            email="team.user@legaledge.in",
            name="Team User",
            password="User@123",
            role="user",
            team_id="team_02",
        )
        CustomUser.objects.create_user(
            email="other.team@legaledge.in",
            name="Other Team User",
            password="User@123",
            role="user",
            team_id="team_01",
        )

        self.client.force_authenticate(user=self.manager)
        response = self.client.get("/api/users/")

        self.assertEqual(response.status_code, 200)
        returned_ids = {row["id"] for row in response.data}
        self.assertIn(self.manager.id, returned_ids)
        self.assertIn(team_user.id, returned_ids)
        self.assertNotIn(self.user.id, returned_ids)

    def test_manager_can_create_team_user_only(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(
            "/api/users/",
            {
                "email": "new.member@legaledge.in",
                "name": "New Team Member",
                "phone": "9876543210",
                "role": "user",
                "department": "Sales",
                "company": "LegalEdge India",
                "timezone": "Asia/Kolkata",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["role"], "user")
        self.assertEqual(response.data["team_id"], "team_02")
        self.assertEqual(response.data["department"], "Sales")
        self.assertEqual(response.data["company"], "LegalEdge India")
        self.assertEqual(response.data["timezone"], "Asia/Kolkata")

        created = CustomUser.objects.get(email="new.member@legaledge.in")
        self.assertEqual(created.department, "Sales")
        self.assertEqual(created.company, "LegalEdge India")
        self.assertEqual(created.timezone, "Asia/Kolkata")

    def test_manager_cannot_create_manager_account(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(
            "/api/users/",
            {
                "email": "second.manager@legaledge.in",
                "name": "Second Manager",
                "phone": "9876543211",
                "role": "manager",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["error"], "Managers can create only user accounts.")

    def test_admin_can_update_user_profile_fields(self):
        target = CustomUser.objects.create_user(
            email="updatable.user@legaledge.in",
            name="Updatable User",
            password="User@123",
            role="user",
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            f"/api/users/{target.id}/",
            {
                "department": "Marketing",
                "company": "LegalEdge HQ",
                "timezone": "Europe/London",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["department"], "Marketing")
        self.assertEqual(response.data["company"], "LegalEdge HQ")
        self.assertEqual(response.data["timezone"], "Europe/London")

        target.refresh_from_db()
        self.assertEqual(target.department, "Marketing")
        self.assertEqual(target.company, "LegalEdge HQ")
        self.assertEqual(target.timezone, "Europe/London")
