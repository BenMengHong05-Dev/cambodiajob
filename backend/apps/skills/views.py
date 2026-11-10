from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import ValidationError
from rest_framework import status
from common.database import fetch_all, fetch_one, execute_insert

class SkillListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        category = request.query_params.get("category")
        if category:
            sql = "SELECT id, name, category FROM skills WHERE category = %s ORDER BY name ASC"
            params = [category]
        else:
            sql = "SELECT id, name, category FROM skills ORDER BY category ASC, name ASC"
            params = []
        skills = fetch_all(sql, params)
        return Response({
            "success": True,
            "data": skills,
        })

    def post(self, request):
        name = request.data.get("name", "").strip()
        category = request.data.get("category", "Custom").strip() or "Custom"
        if not name:
            raise ValidationError("Skill name is required.")

        # Check existing (case-insensitive)
        existing = fetch_one("SELECT id, name, category FROM skills WHERE LOWER(name) = LOWER(%s)", [name])
        if existing:
            return Response({"success": True, "data": existing}, status=status.HTTP_200_OK)

        skill_id = execute_insert(
            "INSERT INTO skills (name, category) VALUES (%s, %s)",
            [name, category]
        )
        new_skill = fetch_one("SELECT id, name, category FROM skills WHERE id = %s", [skill_id])
        return Response({"success": True, "data": new_skill}, status=status.HTTP_201_CREATED)
