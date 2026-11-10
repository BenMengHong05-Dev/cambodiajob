from django.test import SimpleTestCase
from rest_framework.test import APIClient
from rest_framework import status
from common.database import fetch_one


class JobsAndCatalogTests(SimpleTestCase):
    databases = {"default"}

    def setUp(self):
        self.client = APIClient()

    def test_01_public_job_list(self):
        response = self.client.get("/api/v1/jobs/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertGreater(data["data"]["count"], 0)
        self.assertTrue(len(data["data"]["results"]) > 0)

    def test_02_job_filter_by_province(self):
        response = self.client.get("/api/v1/jobs/?province=Siem+Reap")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        for job in data["data"]["results"]:
            self.assertEqual(job["province"], "Siem Reap")

    def test_03_job_detail_by_slug(self):
        response = self.client.get("/api/v1/jobs/senior-full-stack-engineer-react-python/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        job = response.json()["data"]
        self.assertEqual(job["title"], "Senior Full-Stack Engineer (React & Python)")
        self.assertEqual(job["company_name"], "Smart Axiata Co., Ltd.")
        self.assertIn("skills", job)
        self.assertGreater(len(job["skills"]), 0)

    def test_04_categories_and_locations(self):
        cat_res = self.client.get("/api/v1/categories/")
        self.assertEqual(cat_res.status_code, status.HTTP_200_OK)
        self.assertGreater(len(cat_res.json()["data"]), 0)

        loc_res = self.client.get("/api/v1/locations/")
        self.assertEqual(loc_res.status_code, status.HTTP_200_OK)
        self.assertIn("locations", loc_res.json()["data"])
        self.assertIn("provinces", loc_res.json()["data"])

    def test_05_employer_post_and_update_job(self):
        # 1. Login as Smart recruiter
        login_res = self.client.post(
            "/api/v1/auth/login/",
            {"email": "recruiter@smart.com.kh", "password": "Password123!"},
            format="json",
        )
        token = login_res.json()["data"]["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        # 2. Post new vacancy
        payload = {
            "title": "QA Automation Engineer",
            "title_km": "វិស្វករស្វ័យប្រវត្តិកម្ម QA",
            "category_id": 1,
            "description": "Ensure high reliability of banking integrations.",
            "employment_type": "full_time",
            "workplace_type": "hybrid",
            "experience_level": "mid",
            "province": "Phnom Penh",
            "salary_min": 900.00,
            "salary_max": 1500.00,
            "salary_currency": "USD",
            "vacancies_count": 1,
            "skill_ids": [1, 3],
        }
        res = self.client.post("/api/v1/employer/jobs/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        job_id = res.json()["data"]["id"]

        # 3. Update status to closed
        status_res = self.client.patch(
            f"/api/v1/employer/jobs/{job_id}/status/",
            {"status": "closed"},
            format="json",
        )
        self.assertEqual(status_res.status_code, status.HTTP_200_OK)

