import json
import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError

from common.permissions import IsAuthenticatedCustom, IsEmployer, HasCustomPermission
from common.database import fetch_one, fetch_all, execute_insert, execute_sql, atomic_transaction
from apps.notifications.email_service import (
    send_interview_invitation_email,
    attach_calendar_urls,
    parse_datetime_safe,
)


class ScheduleInterviewView(APIView):
    def get_permissions(self):
        if self.request.method in ["POST", "DELETE", "PATCH", "PUT"]:
            return [IsEmployer(), HasCustomPermission.with_perm("applications:review")()]
        return [IsEmployer(), HasCustomPermission.with_perm("applications:view")()]

    def get(self, request, pk):
        """
        Retrieve interview details for an application.
        """
        app = fetch_one(
            """
            SELECT a.id, a.job_id, j.title AS job_title, c.name AS company_name
            FROM applications a
            INNER JOIN jobs j ON j.id = a.job_id
            INNER JOIN companies c ON c.id = j.company_id
            INNER JOIN employer_members em ON em.company_id = j.company_id
            WHERE a.id = %s AND em.user_id = %s
            """,
            [pk, request.user.id],
        )
        if not app:
            raise NotFound("Application not found or unauthorized.")

        interview = fetch_one(
            "SELECT * FROM interviews WHERE application_id = %s ORDER BY id DESC LIMIT 1",
            [pk],
        )
        if interview:
            interview = attach_calendar_urls(interview, app["job_title"], app["company_name"])

        return Response({"success": True, "data": interview})

    def post(self, request, pk):
        """
        Schedule or reschedule an interview and notify applicant via email + in-app.
        """
        app = fetch_one(
            """
            SELECT 
                a.id, a.job_id, a.seeker_id,
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
            """,
            [pk, request.user.id],
        )
        if not app:
            raise NotFound("Application not found or unauthorized.")

        scheduled_at_raw = request.data.get("scheduled_at")
        if not scheduled_at_raw:
            raise ValidationError({"scheduled_at": "Interview date & time is required."})

        dt_obj = parse_datetime_safe(scheduled_at_raw)
        formatted_db_datetime = dt_obj.strftime("%Y-%m-%d %H:%M:%S")

        location_or_link = str(request.data.get("location_or_link") or "").strip()
        interview_type = str(request.data.get("interview_type") or "online").strip().lower()
        if interview_type not in ["online", "in_person", "phone"]:
            interview_type = "online"
        notes = str(request.data.get("notes") or "").strip()
        send_email = request.data.get("send_email", True)

        existing_interview = fetch_one(
            "SELECT id FROM interviews WHERE application_id = %s ORDER BY id DESC LIMIT 1",
            [pk],
        )

        with atomic_transaction():
            if existing_interview:
                interview_id = existing_interview["id"]
                execute_sql(
                    """
                    UPDATE interviews
                    SET scheduled_at = %s, location_or_link = %s, interview_type = %s, notes = %s, status = 'scheduled'
                    WHERE id = %s
                    """,
                    [formatted_db_datetime, location_or_link, interview_type, notes, interview_id],
                )
            else:
                interview_id = execute_insert(
                    """
                    INSERT INTO interviews (application_id, scheduled_at, location_or_link, interview_type, notes, status, created_by)
                    VALUES (%s, %s, %s, %s, %s, 'scheduled', %s)
                    """,
                    [pk, formatted_db_datetime, location_or_link, interview_type, notes, request.user.id],
                )

            # Update application status to interview
            execute_sql("UPDATE applications SET status = 'interview' WHERE id = %s", [pk])
            execute_insert(
                """
                INSERT INTO application_status_history (application_id, status, notes, changed_by)
                VALUES (%s, 'interview', %s, %s)
                """,
                [pk, f"Interview scheduled for {dt_obj.strftime('%b %d, %Y %I:%M %p')}", request.user.id],
            )

            # In-app notification
            execute_insert(
                """
                INSERT INTO notifications (user_id, title, message, notification_type, data)
                VALUES (%s, %s, %s, 'interview', %s)
                """,
                [
                    app["seeker_user_id"],
                    "Interview Scheduled!",
                    f"An interview for '{app['job_title']}' at {app['company_name']} has been scheduled for {dt_obj.strftime('%A, %b %d at %I:%M %p')}.",
                    json.dumps({
                        "interview_id": interview_id,
                        "application_id": pk,
                        "scheduled_at": formatted_db_datetime,
                        "interview_type": interview_type,
                        "location_or_link": location_or_link,
                    }),
                ],
            )

        # Send automated email template with calendar sync links
        email_sent = False
        if send_email and app.get("seeker_email"):
            try:
                email_sent = send_interview_invitation_email(
                    candidate_email=app["seeker_email"],
                    candidate_name=app.get("seeker_name") or "Candidate",
                    job_title=app["job_title"],
                    company_name=app.get("company_name") or "Employer",
                    scheduled_at_dt=dt_obj,
                    location_or_link=location_or_link,
                    interview_type=interview_type,
                    notes=notes,
                )
            except Exception as e:
                print(f"[Interview View] Failed to send email invitation: {e}")

        interview = fetch_one("SELECT * FROM interviews WHERE id = %s", [interview_id])
        interview = attach_calendar_urls(interview, app["job_title"], app["company_name"])

        return Response(
            {
                "success": True,
                "message": "Interview scheduled successfully" + (" and invitation email sent!" if email_sent else "!"),
                "email_sent": email_sent,
                "data": interview,
            },
            status=status.HTTP_201_CREATED,
        )

    def delete(self, request, pk):
        """
        Cancel a scheduled interview.
        """
        app = fetch_one(
            """
            SELECT a.id, a.job_id, j.title AS job_title, c.name AS company_name, sp.user_id AS seeker_user_id
            FROM applications a
            INNER JOIN jobs j ON j.id = a.job_id
            INNER JOIN companies c ON c.id = j.company_id
            INNER JOIN employer_members em ON em.company_id = j.company_id
            INNER JOIN seeker_profiles sp ON sp.id = a.seeker_id
            WHERE a.id = %s AND em.user_id = %s
            """,
            [pk, request.user.id],
        )
        if not app:
            raise NotFound("Application not found or unauthorized.")

        with atomic_transaction():
            execute_sql("UPDATE interviews SET status = 'cancelled' WHERE application_id = %s", [pk])
            execute_insert(
                """
                INSERT INTO application_status_history (application_id, status, notes, changed_by)
                VALUES (%s, 'interview', 'Interview cancelled by employer', %s)
                """,
                [pk, request.user.id],
            )
            execute_insert(
                """
                INSERT INTO notifications (user_id, title, message, notification_type, data)
                VALUES (%s, %s, %s, 'interview', %s)
                """,
                [
                    app["seeker_user_id"],
                    "Interview Cancelled",
                    f"The interview for '{app['job_title']}' has been cancelled by {app['company_name']}.",
                    json.dumps({"application_id": pk}),
                ],
            )

        return Response({"success": True, "message": "Interview has been cancelled."})
