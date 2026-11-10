import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError, PermissionDenied

from common.permissions import IsAuthenticatedCustom, IsEmployer, IsJobSeeker
from common.database import fetch_one, fetch_all, execute_insert, execute_sql, atomic_transaction
from .serializers import ApplyJobSerializer, UpdateApplicationStatusSerializer
from apps.notifications.email_service import (
    send_application_received_email,
    send_application_rejected_email,
    send_job_offer_email,
    attach_calendar_urls,
)


class JobApplyView(APIView):
    """
    Candidate applies to a job vacancy.
    """
    permission_classes = [IsJobSeeker]

    def post(self, request, pk):
        seeker = fetch_one("SELECT id FROM seeker_profiles WHERE user_id = %s", [request.user.id])
        if not seeker:
            raise ValidationError("You must have a job seeker profile to apply.")

        seeker_id = seeker["id"]
        job = fetch_one(
            "SELECT id, title, company_id, status, moderation_status FROM jobs WHERE id = %s",
            [pk],
        )
        if not job:
            raise NotFound("Job vacancy not found.")

        if job["status"] != "published" or job["moderation_status"] != "approved":
            raise ValidationError("This job vacancy is no longer accepting applications.")

        # Check existing application
        existing = fetch_one(
            "SELECT id FROM applications WHERE job_id = %s AND seeker_id = %s",
            [pk, seeker_id],
        )
        if existing:
            raise ValidationError("You have already submitted an application for this vacancy.")

        serializer = ApplyJobSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        resume_id = data.get("resume_id")
        if not resume_id:
            # Pick primary resume if available
            primary_resume = fetch_one(
                "SELECT id FROM resumes WHERE seeker_id = %s ORDER BY is_primary DESC, created_at DESC LIMIT 1",
                [seeker_id],
            )
            if primary_resume:
                resume_id = primary_resume["id"]

        with atomic_transaction():
            app_id = execute_insert(
                """
                INSERT INTO applications (job_id, seeker_id, resume_id, cover_letter, status)
                VALUES (%s, %s, %s, %s, 'submitted')
                """,
                [pk, seeker_id, resume_id, data.get("cover_letter")],
            )

            # Record status history
            execute_insert(
                """
                INSERT INTO application_status_history (application_id, status, notes, changed_by)
                VALUES (%s, 'submitted', 'Candidate submitted application', %s)
                """,
                [app_id, request.user.id],
            )

            # Notify company recruiters
            recruiters = fetch_all(
                "SELECT user_id FROM employer_members WHERE company_id = %s",
                [job["company_id"]],
            )
            for r in recruiters:
                execute_insert(
                    """
                    INSERT INTO notifications (user_id, title, message, notification_type, data)
                    VALUES (%s, %s, %s, 'new_job', %s)
                    """,
                    [
                        r["user_id"],
                        "New Candidate Application",
                        f"{request.user.full_name} applied for {job['title']}",
                        json.dumps({"job_id": pk, "application_id": app_id}),
                    ],
                )

        # Send automated application received email to candidate
        if getattr(request.user, "email", None):
            try:
                company = fetch_one("SELECT name FROM companies WHERE id = %s", [job["company_id"]])
                company_name = company["name"] if company else "Employer"
                send_application_received_email(
                    candidate_email=request.user.email,
                    candidate_name=request.user.full_name or "Candidate",
                    job_title=job["title"],
                    company_name=company_name,
                    application_id=app_id,
                )
            except Exception as email_err:
                print(f"[Application Submit] Failed to send email confirmation: {email_err}")

        return Response(
            {
                "success": True,
                "message": "Application submitted successfully!",
                "data": {"application_id": app_id},
            },
            status=status.HTTP_201_CREATED,
        )


class SeekerApplicationListView(APIView):
    """
    List applications submitted by current job seeker.
    """
    permission_classes = [IsJobSeeker]

    def get(self, request):
        seeker = fetch_one("SELECT id FROM seeker_profiles WHERE user_id = %s", [request.user.id])
        if not seeker:
            return Response({"success": True, "data": []})

        seeker_id = seeker["id"]
        sql = """
            SELECT 
                a.id, a.job_id, a.status, a.created_at, a.updated_at, a.cover_letter,
                j.title AS job_title, j.slug AS job_slug, j.province, j.salary_min, j.salary_max, j.salary_currency,
                c.name AS company_name, c.slug AS company_slug, c.logo_url AS company_logo,
                r.title AS resume_title, r.file_path AS resume_path
            FROM applications a
            INNER JOIN jobs j ON j.id = a.job_id
            INNER JOIN companies c ON c.id = j.company_id
            LEFT JOIN resumes r ON r.id = a.resume_id
            WHERE a.seeker_id = %s
            ORDER BY a.created_at DESC
        """
        applications = fetch_all(sql, [seeker_id])

        # Attach scheduled interviews if any with calendar URLs
        for app in applications:
            interviews = fetch_all(
                "SELECT id, scheduled_at, location_or_link, interview_type, notes, status FROM interviews WHERE application_id = %s ORDER BY scheduled_at ASC",
                [app["id"]],
            )
            for inv in interviews:
                attach_calendar_urls(inv, app.get("job_title", "Interview"), app.get("company_name", "Employer"))
            app["interviews"] = interviews

        return Response({"success": True, "data": applications})

    def delete(self, request, pk=None):
        seeker = fetch_one("SELECT id FROM seeker_profiles WHERE user_id = %s", [request.user.id])
        if not seeker:
            raise NotFound("Seeker profile not found.")
        app_id = pk or request.query_params.get("id")
        if not app_id:
            raise ValidationError("Application ID is required.")
        app = fetch_one("SELECT id FROM applications WHERE id = %s AND seeker_id = %s", [app_id, seeker["id"]])
        if not app:
            raise NotFound("Application not found or unauthorized.")
        with atomic_transaction():
            execute_sql("DELETE FROM interviews WHERE application_id = %s", [app_id])
            execute_sql("DELETE FROM application_status_history WHERE application_id = %s", [app_id])
            execute_sql("DELETE FROM applications WHERE id = %s", [app_id])
        return Response({"success": True, "message": "Application withdrawn successfully."})


class EmployerJobApplicationsView(APIView):
    """
    List all applicants for a specific vacancy managed by this employer.
    """
    permission_classes = [IsEmployer]

    def get(self, request, pk):
        # Validate employer owns this job
        job = fetch_one(
            """
            SELECT j.id, j.title, j.slug 
            FROM jobs j
            INNER JOIN employer_members em ON em.company_id = j.company_id
            WHERE j.id = %s AND em.user_id = %s
            """,
            [pk, request.user.id],
        )
        if not job:
            raise NotFound("Job vacancy not found or access denied.")

        company = fetch_one(
            "SELECT c.name FROM companies c INNER JOIN jobs j ON j.company_id = c.id WHERE j.id = %s",
            [pk],
        )
        company_name = company["name"] if company else "Company"

        sql = """
            SELECT 
                a.id, a.job_id, a.seeker_id, a.resume_id, a.cover_letter, a.status, a.created_at,
                u.full_name AS applicant_name, u.email AS applicant_email, u.phone_number AS applicant_phone,
                sp.headline AS applicant_headline, sp.summary AS applicant_summary, sp.avatar_url AS applicant_avatar,
                sp.province AS applicant_province, sp.city AS applicant_city, sp.expected_salary, sp.salary_currency,
                r.title AS resume_title, r.file_path AS resume_path
            FROM applications a
            INNER JOIN seeker_profiles sp ON sp.id = a.seeker_id
            INNER JOIN users u ON u.id = sp.user_id
            LEFT JOIN resumes r ON r.id = a.resume_id
            WHERE a.job_id = %s
            ORDER BY a.created_at DESC
        """
        applicants = fetch_all(sql, [pk])

        # Attach interview details, skills, education, and experience for each applicant
        for applicant in applicants:
            interview = fetch_one(
                "SELECT id, scheduled_at, location_or_link, interview_type, notes, status FROM interviews WHERE application_id = %s ORDER BY id DESC LIMIT 1",
                [applicant["id"]],
            )
            if interview:
                attach_calendar_urls(interview, job["title"], company_name)
            applicant["interview"] = interview
            applicant["skills"] = fetch_all(
                """
                SELECT s.name AS skill_name, s.name, ss.proficiency_level 
                FROM seeker_skills ss
                INNER JOIN skills s ON s.id = ss.skill_id
                WHERE ss.seeker_id = %s
                ORDER BY s.name ASC
                """,
                [applicant["seeker_id"]]
            )
            applicant["educations"] = fetch_all(
                """
                SELECT institution AS school, institution, degree, field_of_study, start_date, end_date 
                FROM educations 
                WHERE seeker_id = %s 
                ORDER BY start_date DESC LIMIT 3
                """,
                [applicant["seeker_id"]]
            )
            applicant["experiences"] = fetch_all(
                "SELECT company_name, job_title, start_date, end_date, is_current FROM work_experiences WHERE seeker_id = %s ORDER BY start_date DESC LIMIT 3",
                [applicant["seeker_id"]]
            )

        return Response({
            "success": True,
            "data": {
                "job": job,
                "applications": applicants,
            }
        })


class EmployerApplicationStatusUpdateView(APIView):
    """
    Update candidate application status and notify applicant.
    """
    permission_classes = [IsEmployer]

    def patch(self, request, pk):
        # Verify employer manages this application's company
        app_sql = """
            SELECT 
                a.id, a.job_id, a.seeker_id, a.status,
                j.title AS job_title, 
                c.name AS company_name,
                sp.user_id AS seeker_user_id,
                u.email AS seeker_email,
                u.full_name AS seeker_name
            FROM applications a
            INNER JOIN jobs j ON j.id = a.job_id
            INNER JOIN companies c ON c.id = j.company_id
            INNER JOIN employer_members em ON em.company_id = j.company_id
            INNER JOIN seeker_profiles sp ON sp.id = a.seeker_id
            INNER JOIN users u ON u.id = sp.user_id
            WHERE a.id = %s AND em.user_id = %s
        """
        app = fetch_one(app_sql, [pk, request.user.id])
        if not app:
            raise NotFound("Application record not found or permission denied.")

        serializer = UpdateApplicationStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]
        notes = serializer.validated_data.get("notes") or f"Status changed to {new_status}"

        with atomic_transaction():
            execute_sql("UPDATE applications SET status = %s WHERE id = %s", [new_status, pk])

            execute_insert(
                """
                INSERT INTO application_status_history (application_id, status, notes, changed_by)
                VALUES (%s, %s, %s, %s)
                """,
                [pk, new_status, notes, request.user.id],
            )

            # Notify seeker
            execute_insert(
                """
                INSERT INTO notifications (user_id, title, message, notification_type, data)
                VALUES (%s, %s, %s, 'application_status', %s)
                """,
                [
                    app["seeker_user_id"],
                    f"Application Status Updated: {new_status.capitalize()}",
                    f"Your application for {app['job_title']} is now '{new_status}'.",
                    json.dumps({"application_id": pk, "job_id": app["job_id"], "status": new_status}),
                ],
            )

        # Trigger automated email notifications based on status
        if app.get("seeker_email"):
            if new_status == "rejected":
                try:
                    send_application_rejected_email(
                        candidate_email=app["seeker_email"],
                        candidate_name=app.get("seeker_name") or "Candidate",
                        job_title=app["job_title"],
                        company_name=app.get("company_name") or "Employer",
                    )
                except Exception as email_err:
                    print(f"[Status Update] Failed to dispatch regret email: {email_err}")
            elif new_status == "offered":
                try:
                    send_job_offer_email(
                        candidate_email=app["seeker_email"],
                        candidate_name=app.get("seeker_name") or "Candidate",
                        job_title=app["job_title"],
                        company_name=app.get("company_name") or "Employer",
                        details_note=notes if notes != f"Status changed to {new_status}" else None,
                    )
                except Exception as email_err:
                    print(f"[Status Update] Failed to dispatch offer email: {email_err}")

        return Response({"success": True, "message": f"Application status updated to {new_status}."})

    def delete(self, request, pk):
        app_sql = """
            SELECT a.id FROM applications a
            INNER JOIN jobs j ON j.id = a.job_id
            INNER JOIN employer_members em ON em.company_id = j.company_id
            WHERE a.id = %s AND em.user_id = %s
        """
        app = fetch_one(app_sql, [pk, request.user.id])
        if not app:
            raise NotFound("Application record not found or permission denied.")

        with atomic_transaction():
            execute_sql("DELETE FROM application_status_history WHERE application_id = %s", [pk])
            execute_sql("DELETE FROM interviews WHERE application_id = %s", [pk])
            execute_sql("DELETE FROM applications WHERE id = %s", [pk])

        return Response({"success": True, "message": "Candidate application removed successfully."})

