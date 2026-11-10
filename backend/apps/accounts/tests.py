from django.test import SimpleTestCase
from rest_framework.test import APIClient
from rest_framework import status
from common.database import fetch_one, fetch_all, execute_sql


class AuthAndRawSQLTests(SimpleTestCase):
    """
    Test raw SQL database interactions and authentication endpoints.
    """
    databases = {"default"}

    def setUp(self):
        self.client = APIClient()

    def test_01_raw_sql_connectivity(self):
        """Verify raw SQL connection to MySQL."""
        roles = fetch_all("SELECT id, name FROM roles ORDER BY id ASC")
        self.assertTrue(len(roles) >= 3)
        role_names = [r["name"] for r in roles]
        self.assertIn("job_seeker", role_names)
        self.assertIn("employer", role_names)
        self.assertIn("admin", role_names)

    def test_02_login_seeded_admin(self):
        """Verify logging in with seeded user credentials."""
        response = self.client.post(
            "/api/v1/auth/login/",
            {"email": "admin@cambodiajobs.kh", "password": "Password123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("access", data["data"])
        self.assertIn("refresh", data["data"])
        self.assertIn("admin", data["data"]["user"]["roles"])

    def test_03_auth_me_endpoint(self):
        """Verify /api/v1/auth/me/ with Bearer access token."""
        login_res = self.client.post(
            "/api/v1/auth/login/",
            {"email": "recruiter@smart.com.kh", "password": "Password123!"},
            format="json",
        )
        token = login_res.json()["data"]["access"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user_data = response.json()["data"]
        self.assertEqual(user_data["email"], "recruiter@smart.com.kh")
        self.assertIn("employer", user_data["roles"])
        self.assertIsNotNone(user_data.get("company"))

    def test_04_register_new_seeker(self):
        """Verify registration using raw SQL and transaction."""
        test_email = "test.seeker.automated@example.kh"
        # Cleanup if exists
        execute_sql("DELETE FROM users WHERE email = %s", [test_email])

        payload = {
            "email": test_email,
            "password": "SecurePassword2026!",
            "full_name": "Test Seeker User",
            "phone_number": "+855 12 333 444",
            "role": "job_seeker",
        }
        response = self.client.post("/api/v1/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        res_data = response.json()["data"]
        self.assertEqual(res_data["user"]["email"], test_email)

        # Verify DB directly via raw SQL
        user_row = fetch_one("SELECT * FROM users WHERE email = %s", [test_email])
        self.assertIsNotNone(user_row)
        seeker_profile = fetch_one("SELECT * FROM seeker_profiles WHERE user_id = %s", [user_row["id"]])
        self.assertIsNotNone(seeker_profile)

        # Cleanup test user
        execute_sql("DELETE FROM users WHERE email = %s", [test_email])
