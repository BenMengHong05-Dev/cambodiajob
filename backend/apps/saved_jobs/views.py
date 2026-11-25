from rest_framework.views import APIView
from rest_framework.response import Response
from common.permissions import IsAuthenticatedCustom
from common.database import fetch_one, fetch_all


class SeekerSavedJobsView(APIView):
    permission_classes = [IsAuthenticatedCustom]

    def get(self, request):
        seeker = fetch_one("SELECT id FROM seeker_profiles WHERE user_id = %s", [request.user.id])
        if not seeker:
            return Response({"success": True, "data": []})

        sql = """
            SELECT 
                j.id, j.title, j.title_km, j.slug, j.employment_type, j.workplace_type,
                j.province, j.salary_min, j.salary_max, j.salary_currency, j.is_salary_negotiable,
                j.published_at, j.status,
                c.name AS company_name, c.slug AS company_slug, c.logo_url AS company_logo,
                c.banner_url AS company_banner,
                sj.created_at AS saved_at
            FROM saved_jobs sj
            INNER JOIN jobs j ON j.id = sj.job_id
            INNER JOIN companies c ON c.id = j.company_id
            WHERE sj.seeker_id = %s
            ORDER BY sj.created_at DESC, sj.id DESC
        """
        saved = fetch_all(sql, [seeker["id"]])
        return Response({"success": True, "data": saved})

