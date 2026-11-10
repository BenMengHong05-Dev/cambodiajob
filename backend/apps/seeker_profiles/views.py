from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError

from common.permissions import IsJobSeeker
from common.database import fetch_one, fetch_all, execute_insert, execute_sql, atomic_transaction
from .serializers import (
    SeekerProfileUpdateSerializer,
    EducationSerializer,
    WorkExperienceSerializer,
    SeekerSkillSerializer,
)


def get_or_create_seeker_id(user_id: int) -> int:
    seeker = fetch_one("SELECT id FROM seeker_profiles WHERE user_id = %s", [user_id])
    if seeker:
        return seeker["id"]
    return execute_insert(
        "INSERT INTO seeker_profiles (user_id, salary_currency) VALUES (%s, 'USD')",
        [user_id]
    )


class SeekerProfileView(APIView):
    permission_classes = [IsJobSeeker]

    def get(self, request):
        user_id = request.user.id
        seeker_id = get_or_create_seeker_id(user_id)

        sql = """
            SELECT 
                sp.id, sp.user_id, sp.headline, sp.summary, sp.date_of_birth,
                sp.gender, sp.province, sp.city, sp.address, sp.current_salary,
                sp.expected_salary, sp.salary_currency, sp.avatar_url,
                u.full_name, u.email, u.phone_number
            FROM seeker_profiles sp
            INNER JOIN users u ON u.id = sp.user_id
            WHERE sp.id = %s
        """
        profile = fetch_one(sql, [seeker_id])

        # Fetch educations
        educations = fetch_all(
            "SELECT * FROM educations WHERE seeker_id = %s ORDER BY start_date DESC",
            [seeker_id]
        )
        profile["educations"] = educations

        # Fetch work experiences
        experiences = fetch_all(
            "SELECT * FROM work_experiences WHERE seeker_id = %s ORDER BY start_date DESC",
            [seeker_id]
        )
        profile["work_experiences"] = experiences

        # Fetch skills
        skills_sql = """
            SELECT s.id, s.name, s.category, ss.proficiency_level
            FROM seeker_skills ss
            INNER JOIN skills s ON s.id = ss.skill_id
            WHERE ss.seeker_id = %s
            ORDER BY s.name ASC
        """
        profile["skills"] = fetch_all(skills_sql, [seeker_id])

        # Fetch resumes
        resumes = fetch_all(
            "SELECT * FROM resumes WHERE seeker_id = %s ORDER BY created_at DESC",
            [seeker_id]
        )
        profile["resumes"] = resumes

        return Response({"success": True, "data": profile})

    def patch(self, request):
        user_id = request.user.id
        seeker_id = get_or_create_seeker_id(user_id)

        serializer = SeekerProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with atomic_transaction():
            # Update users table if full_name or phone_number
            user_updates = []
            user_params = []
            if "full_name" in data:
                user_updates.append("full_name = %s")
                user_params.append(data["full_name"])
            if "phone_number" in data:
                user_updates.append("phone_number = %s")
                user_params.append(data["phone_number"])
            if user_updates:
                u_sql = f"UPDATE users SET {', '.join(user_updates)} WHERE id = %s"
                user_params.append(user_id)
                execute_sql(u_sql, user_params)

            # Update seeker_profiles table
            profile_keys = [
                "headline", "summary", "date_of_birth", "gender", "province",
                "city", "address", "current_salary", "expected_salary",
                "salary_currency", "avatar_url"
            ]
            profile_updates = []
            profile_params = []
            for k in profile_keys:
                if k in data:
                    profile_updates.append(f"{k} = %s")
                    profile_params.append(data[k])

            if profile_updates:
                p_sql = f"UPDATE seeker_profiles SET {', '.join(profile_updates)} WHERE id = %s"
                profile_params.append(seeker_id)
                execute_sql(p_sql, profile_params)

        return self.get(request)


class SeekerEducationView(APIView):
    permission_classes = [IsJobSeeker]

    def post(self, request):
        seeker_id = get_or_create_seeker_id(request.user.id)
        serializer = EducationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        sql = """
            INSERT INTO educations (
                seeker_id, institution, degree, field_of_study, start_date, end_date, is_current, description
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        edu_id = execute_insert(
            sql,
            [
                seeker_id, data["institution"], data["degree"], data.get("field_of_study"),
                data.get("start_date"), data.get("end_date"), data.get("is_current", False),
                data.get("description")
            ]
        )
        new_edu = fetch_one("SELECT * FROM educations WHERE id = %s", [edu_id])
        return Response({"success": True, "data": new_edu}, status=status.HTTP_201_CREATED)

    def delete(self, request, pk):
        seeker_id = get_or_create_seeker_id(request.user.id)
        execute_sql("DELETE FROM educations WHERE id = %s AND seeker_id = %s", [pk, seeker_id])
        return Response({"success": True, "message": "Education record deleted."})


class SeekerExperienceView(APIView):
    permission_classes = [IsJobSeeker]

    def post(self, request):
        seeker_id = get_or_create_seeker_id(request.user.id)
        serializer = WorkExperienceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        sql = """
            INSERT INTO work_experiences (
                seeker_id, company_name, job_title, location, start_date, end_date, is_current, description
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        exp_id = execute_insert(
            sql,
            [
                seeker_id, data["company_name"], data["job_title"], data.get("location"),
                data.get("start_date"), data.get("end_date"), data.get("is_current", False),
                data.get("description")
            ]
        )
        new_exp = fetch_one("SELECT * FROM work_experiences WHERE id = %s", [exp_id])
        return Response({"success": True, "data": new_exp}, status=status.HTTP_201_CREATED)

    def delete(self, request, pk):
        seeker_id = get_or_create_seeker_id(request.user.id)
        execute_sql("DELETE FROM work_experiences WHERE id = %s AND seeker_id = %s", [pk, seeker_id])
        return Response({"success": True, "message": "Experience record deleted."})


class SeekerSkillView(APIView):
    permission_classes = [IsJobSeeker]

    def post(self, request):
        seeker_id = get_or_create_seeker_id(request.user.id)
        serializer = SeekerSkillSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        sql = """
            INSERT INTO seeker_skills (seeker_id, skill_id, proficiency_level)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE proficiency_level = VALUES(proficiency_level)
        """
        execute_sql(sql, [seeker_id, data["skill_id"], data["proficiency_level"]])
        return Response({"success": True, "message": "Skill updated."})

    def delete(self, request, skill_id):
        seeker_id = get_or_create_seeker_id(request.user.id)
        execute_sql("DELETE FROM seeker_skills WHERE seeker_id = %s AND skill_id = %s", [seeker_id, skill_id])
        return Response({"success": True, "message": "Skill removed."})

