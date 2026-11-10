from django.test import SimpleTestCase
from rest_framework.test import APIClient
from rest_framework import status
from common.database import fetch_one, execute_sql


class RecruitmentWorkflowTests(SimpleTestCase):
    databases = {"default"}

    def setUp(self):
        self.client = APIClient()

    def test_complete_recruitment_lifecycle(self):
        # 1. Login as Job Seeker (Channary)
        seeker_login = self.client.post(
            "/api/v1/auth/login/",
            {"email": "channary.voeun@gmail.com", "password": "Password123!"},
            format="json",
        )
        seeker_token = seeker_login.json()["data"]["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {seeker_token}")

        # Clean existing application for Job 2 if any
        seeker_id = fetch_one("SELECT id FROM seeker_profiles WHERE user_id = 5")["id"]
        execute_sql("DELETE FROM applications WHERE job_id = 2 AND seeker_id = %s", [seeker_id])

        # 2. Apply for Job 2 (Mobile Developer at ABA Bank)
        apply_payload = {
            "cover_letter": "I am passionate about building fast mobile fintech applications in Cambodia."
        }
        apply_res = self.client.post("/api/v1/applications/apply/2/", apply_payload, format="json")
        self.assertEqual(apply_res.status_code, status.HTTP_201_CREATED)
        app_id = apply_res.json()["data"]["application_id"]

        # 3. Verify Seeker Application List
        seeker_apps_res = self.client.get("/api/v1/applications/seeker/")
        self.assertEqual(seeker_apps_res.status_code, status.HTTP_200_OK)
        app_ids = [a["id"] for a in seeker_apps_res.json()["data"]]
        self.assertIn(app_id, app_ids)

        # 4. Login as Employer (ABA Bank recruiter)
        emp_login = self.client.post(
            "/api/v1/auth/login/",
            {"email": "careers@aba.com.kh", "password": "Password123!"},
            format="json",
        )
        emp_token = emp_login.json()["data"]["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {emp_token}")

        # 5. Employer reviews applications for Job 2
        emp_apps_res = self.client.get("/api/v1/applications/employer/job/2/")
        self.assertEqual(emp_apps_res.status_code, status.HTTP_200_OK)
        emp_apps = emp_apps_res.json()["data"]["applications"]
        self.assertTrue(any(a["id"] == app_id for a in emp_apps))

        # 6. Employer shortlists candidate
        status_res = self.client.patch(
            f"/api/v1/applications/employer/{app_id}/status/",
            {"status": "shortlisted", "notes": "Strong banking skills"},
            format="json",
        )
        self.assertEqual(status_res.status_code, status.HTTP_200_OK)

        # 7. Check Admin Dashboard Stats
        admin_login = self.client.post(
            "/api/v1/auth/login/",
            {"email": "admin@cambodiajobs.kh", "password": "Password123!"},
            format="json",
        )
        admin_token = admin_login.json()["data"]["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {admin_token}")

        admin_res = self.client.get("/api/v1/admin/dashboard/")
        self.assertEqual(admin_res.status_code, status.HTTP_200_OK)
        stats = admin_res.json()["data"]["stats"]
        self.assertGreater(stats["total_users"], 0)
        self.assertGreater(stats["total_jobs"], 0)

