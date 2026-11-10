from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from common.database import fetch_all

class LocationListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        has_jobs = request.query_params.get("has_jobs", "").lower() in ["true", "1"]

        sql = """
            SELECT id, province_en, province_km, city_en, city_km
            FROM locations
            ORDER BY province_en ASC, city_en ASC
        """
        locations = fetch_all(sql)
        
        # Generate distinct provinces with real published & approved jobs_count
        if has_jobs:
            provinces_sql = """
                SELECT 
                    l.province_en,
                    l.province_km,
                    COUNT(j.id) AS jobs_count
                FROM (
                    SELECT DISTINCT province_en, province_km
                    FROM locations
                ) l
                INNER JOIN jobs j ON j.province = l.province_en
                    AND j.status = 'published' 
                    AND j.moderation_status = 'approved'
                GROUP BY l.province_en, l.province_km
                HAVING COUNT(j.id) > 0
                ORDER BY jobs_count DESC, l.province_en ASC
            """
        else:
            provinces_sql = """
                SELECT 
                    l.province_en,
                    l.province_km,
                    COUNT(j.id) AS jobs_count
                FROM (
                    SELECT DISTINCT province_en, province_km
                    FROM locations
                ) l
                LEFT JOIN jobs j ON j.province = l.province_en
                    AND j.status = 'published' 
                    AND j.moderation_status = 'approved'
                GROUP BY l.province_en, l.province_km
                ORDER BY jobs_count DESC, l.province_en ASC
            """
        provinces = fetch_all(provinces_sql)

        return Response({
            "success": True,
            "data": {
                "locations": locations,
                "provinces": provinces,
            }
        })


