import json
import datetime
import urllib.error
from django.conf import settings
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import NotFound, ValidationError

from common.permissions import IsAuthenticatedCustom, IsEmployer, HasCustomPermission
from common.database import fetch_one, fetch_all, execute_insert, execute_sql, atomic_transaction
from apps.notifications.email_service import (
    send_interview_invitation_email,
    attach_calendar_urls,
    parse_datetime_safe,
)
from apps.notifications.services import notify_admins
from .google_meet_service import (
    build_google_calendar_auth_url,
    exchange_code_and_save_tokens,
    get_valid_access_token,
    get_platform_access_token,
    create_google_meet_event,
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

        notify_admins(
            title="Interview Scheduled",
            title_km="មានការណាត់សម្ភាសន៍ការងារថ្មី",
            message=f"{app['company_name']} scheduled an interview with {app.get('seeker_name') or 'Candidate'} for '{app['job_title']}'.",
            message_km=f"ក្រុមហ៊ុន {app['company_name']} បានណាត់សម្ភាសន៍ជាមួយ {app.get('seeker_name') or 'បេក្ខជន'} សម្រាប់មុខតំណែង '{app['job_title']}'។",
            notification_type="interview",
            data={"interview_id": interview_id, "application_id": pk, "scheduled_at": formatted_db_datetime, "interview_type": interview_type, "location_or_link": location_or_link},
            exclude_user_id=request.user.id,
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

        notify_admins(
            title="Interview Cancelled",
            title_km="ការសម្ភាសន៍ត្រូវបានលុបចោល",
            message=f"{app['company_name']} cancelled the interview for '{app['job_title']}'.",
            message_km=f"ក្រុមហ៊ុន {app['company_name']} បានលុបចោលការសម្ភាសន៍សម្រាប់ '{app['job_title']}'។",
            notification_type="interview",
            data={"application_id": pk},
            exclude_user_id=request.user.id,
        )

        return Response({"success": True, "message": "Interview has been cancelled."})


class GoogleMeetGenerateView(APIView):
    """
    Generate a real, shared Google Meet room via the user's connected Google Calendar API.
    If the user hasn't authorized Google Calendar yet, returns connected=False and auth_url.
    """

    permission_classes = [IsEmployer, HasCustomPermission.with_perm("applications:review")]

    def post(self, request):
        if not getattr(settings, "GOOGLE_CLIENT_ID", "") or not getattr(settings, "GOOGLE_CLIENT_SECRET", ""):
            return Response(
                {
                    "success": False,
                    "error": "Google OAuth credentials are not configured on the server.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        access_token = get_valid_access_token(request.user.id) or get_platform_access_token()
        if not access_token:
            auth_url = build_google_calendar_auth_url(request, request.user.id)
            return Response(
                {
                    "success": True,
                    "data": {
                        "connected": False,
                        "auth_url": auth_url,
                    },
                }
            )

        summary = str(request.data.get("summary") or "Job Interview").strip()
        attendee_email = str(request.data.get("attendee_email") or "").strip() or None
        scheduled_at_raw = request.data.get("scheduled_at")
        start_dt = parse_datetime_safe(scheduled_at_raw) if scheduled_at_raw else None

        try:
            meet_link = create_google_meet_event(
                access_token=access_token,
                summary=summary,
                start_dt=start_dt,
                attendee_email=attendee_email,
            )
            return Response(
                {
                    "success": True,
                    "data": {
                        "connected": True,
                        "meet_link": meet_link,
                    },
                }
            )
        except urllib.error.HTTPError as exc:
            if exc.code in (401, 403):
                auth_url = build_google_calendar_auth_url(request, request.user.id)
                return Response(
                    {
                        "success": True,
                        "data": {
                            "connected": False,
                            "auth_url": auth_url,
                        },
                    }
                )
            err_body = exc.read().decode("utf-8", errors="ignore")
            return Response(
                {"success": False, "error": f"Google Calendar API error ({exc.code}): {err_body[:240]}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            return Response(
                {"success": False, "error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class GoogleMeetOAuthCallbackView(APIView):
    """
    OAuth2 callback from Google Calendar authorization popup.
    Saves tokens and notifies opener window via postMessage.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        code = request.query_params.get("code")
        state = request.query_params.get("state")
        error = request.query_params.get("error")

        if error or not code or not state:
            msg = error or "Missing authorization code."
            html = f"""<!doctype html><html><body style="font-family:sans-serif;text-align:center;padding:40px">
            <h3>Google Calendar connection cancelled</h3><p>{msg}</p>
            <script>if(window.opener)window.opener.postMessage({{type:'google-meet-error',error:{json.dumps(msg)}}},'*');window.close();</script>
            </body></html>"""
            return HttpResponse(html, content_type="text/html")

        try:
            exchange_code_and_save_tokens(request, code, state)
            html = """<!doctype html><html><body style="font-family:sans-serif;text-align:center;padding:40px">
            <h3>Google Calendar Connected</h3><p>Generating your Google Meet link...</p>
            <script>if(window.opener)window.opener.postMessage({type:'google-meet-connected'},'*');window.close();</script>
            </body></html>"""
            return HttpResponse(html, content_type="text/html")
        except Exception as exc:
            msg = str(exc)
            html = f"""<!doctype html><html><body style="font-family:sans-serif;text-align:center;padding:40px">
            <h3>Connection Failed</h3><p>{msg}</p>
            <script>if(window.opener)window.opener.postMessage({{type:'google-meet-error',error:{json.dumps(msg)}}},'*');window.close();</script>
            </body></html>"""
            return HttpResponse(html, content_type="text/html")
