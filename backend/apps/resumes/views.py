import os
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.exceptions import NotFound, ValidationError

from common.permissions import IsJobSeeker
from common.database import fetch_one, fetch_all, execute_insert, execute_sql
from apps.notifications.services import create_notification, notify_admins


class SeekerResumeView(APIView):
    permission_classes = [IsJobSeeker]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        seeker = fetch_one("SELECT id FROM seeker_profiles WHERE user_id = %s", [request.user.id])
        if not seeker:
            return Response({"success": True, "data": []})

        resumes = fetch_all(
            "SELECT * FROM resumes WHERE seeker_id = %s ORDER BY is_primary DESC, created_at DESC",
            [seeker["id"]],
        )
        return Response({"success": True, "data": resumes})

    def post(self, request):
        seeker = fetch_one("SELECT id FROM seeker_profiles WHERE user_id = %s", [request.user.id])
        if not seeker:
            raise ValidationError("Job seeker profile not found.")

        seeker_id = seeker["id"]
        title = request.data.get("title", "").strip()
        uploaded_file = request.FILES.get("file")

        if uploaded_file:
            # File validation (PDF, DOCX under 5MB)
            allowed_exts = [".pdf", ".doc", ".docx"]
            file_ext = os.path.splitext(uploaded_file.name)[1].lower()
            if file_ext not in allowed_exts:
                raise ValidationError({"file": "Only PDF and DOC/DOCX files are supported."})
            if uploaded_file.size > 5 * 1024 * 1024:
                raise ValidationError({"file": "File size must not exceed 5MB."})

            upload_dir = settings.MEDIA_ROOT / "resumes"
            os.makedirs(upload_dir, exist_ok=True)
            saved_filename = f"resume_{seeker_id}_{int(request.user.id)}_{uploaded_file.name}"
            file_dest = upload_dir / saved_filename

            with open(file_dest, "wb+") as destination:
                for chunk in uploaded_file.chunks():
                    destination.write(chunk)

            file_path = f"/media/resumes/{saved_filename}"
            file_name = uploaded_file.name
            file_size = uploaded_file.size
        else:
            # Text-based title or link fallback
            if not title:
                raise ValidationError({"title": "Please provide a resume title or upload a CV file."})
            file_path = f"/media/resumes/default_{seeker_id}.pdf"
            file_name = f"{title}.pdf"
            file_size = 102400

        # Unset previous primary if this is first resume
        existing_count = fetch_one("SELECT COUNT(*) as count FROM resumes WHERE seeker_id = %s", [seeker_id])["count"]
        is_primary = (existing_count == 0)

        resume_id = execute_insert(
            """
            INSERT INTO resumes (seeker_id, title, file_path, file_name, file_size, is_primary)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            [seeker_id, title or file_name, file_path, file_name, file_size, is_primary],
        )

        new_resume = fetch_one("SELECT * FROM resumes WHERE id = %s", [resume_id])
        create_notification(
            user_id=request.user.id,
            title="Resume / CV Uploaded",
            title_km="ប្រវត្តិរូបសង្ខេប (CV) ត្រូវបានផ្ទុកឡើង",
            message=f"Your CV '{title or file_name}' was uploaded to your profile.",
            message_km=f"ប្រវត្តិរូបសង្ខេប '{title or file_name}' ត្រូវបានផ្ទុកឡើងដោយជោគជ័យ។",
            notification_type="profile_update",
            data={"action": "resume_upload", "resume_id": resume_id},
        )
        notify_admins(
            title="Job Seeker Uploaded CV",
            title_km="បេក្ខជនបានផ្ទុកឡើង CV ថ្មី",
            message=f"{request.user.full_name or request.user.email} uploaded CV '{title or file_name}'.",
            message_km=f"{request.user.full_name or request.user.email} បានផ្ទុកឡើង CV '{title or file_name}'។",
            notification_type="profile_update",
            data={"action": "resume_upload", "resume_id": resume_id, "actor_id": request.user.id},
            exclude_user_id=request.user.id,
        )
        return Response({"success": True, "data": new_resume}, status=status.HTTP_201_CREATED)

    def delete(self, request, pk):
        seeker = fetch_one("SELECT id FROM seeker_profiles WHERE user_id = %s", [request.user.id])
        if not seeker:
            raise NotFound("Seeker profile not found.")

        execute_sql("DELETE FROM resumes WHERE id = %s AND seeker_id = %s", [pk, seeker["id"]])
        return Response({"success": True, "message": "Resume deleted successfully."})

