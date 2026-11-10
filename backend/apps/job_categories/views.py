from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from common.database import fetch_all

class CategoryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        has_jobs = request.query_params.get("has_jobs", "").lower() in ["true", "1"]
        having_clause = "HAVING COUNT(j.id) > 0" if has_jobs else ""

        sql = f"""
            SELECT 
                c.id, 
                c.name_en, 
                c.name_km, 
                c.slug, 
                c.icon,
                COUNT(j.id) AS jobs_count
            FROM job_categories c
            LEFT JOIN jobs j ON j.category_id = c.id 
                AND j.status = 'published' 
                AND j.moderation_status = 'approved'
            GROUP BY c.id, c.name_en, c.name_km, c.slug, c.icon
            {having_clause}
            ORDER BY jobs_count DESC, c.name_en ASC
        """
        categories = fetch_all(sql)
        return Response({
            "success": True,
            "data": categories,
        })

