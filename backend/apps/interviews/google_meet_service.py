"""
Google Calendar API integration for creating real, shared Google Meet rooms.
"""

import datetime
import json
import urllib.error
import urllib.parse
import urllib.request
import uuid
from django.conf import settings
from django.core import signing
from common.database import fetch_one, execute_sql


def ensure_google_tokens_table() -> None:
    execute_sql(
        """
        CREATE TABLE IF NOT EXISTS user_google_tokens (
            user_id INT PRIMARY KEY,
            access_token TEXT NOT NULL,
            refresh_token TEXT NULL,
            expires_at DATETIME NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """
    )


def get_callback_uri(request) -> str:
    return request.build_absolute_uri("/api/v1/interviews/google-meet/callback/")


def build_google_calendar_auth_url(request, user_id: int) -> str:
    state = signing.dumps({"uid": user_id}, salt="google-meet-oauth")
    params = {
        "client_id": getattr(settings, "GOOGLE_CLIENT_ID", ""),
        "redirect_uri": get_callback_uri(request),
        "response_type": "code",
        "scope": "https://www.googleapis.com/auth/calendar.events",
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    return f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"


def exchange_code_and_save_tokens(request, code: str, state: str) -> int:
    ensure_google_tokens_table()
    payload = signing.loads(state, salt="google-meet-oauth", max_age=900)
    user_id = int(payload["uid"])

    post_data = urllib.parse.urlencode(
        {
            "code": code,
            "client_id": getattr(settings, "GOOGLE_CLIENT_ID", ""),
            "client_secret": getattr(settings, "GOOGLE_CLIENT_SECRET", ""),
            "redirect_uri": get_callback_uri(request),
            "grant_type": "authorization_code",
        }
    ).encode("utf-8")

    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=post_data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urllib.request.urlopen(req, timeout=10) as resp:
        token_data = json.loads(resp.read().decode("utf-8"))

    access_token = token_data["access_token"]
    refresh_token = token_data.get("refresh_token")
    expires_in = int(token_data.get("expires_in") or 3600)
    expires_at = (datetime.datetime.utcnow() + datetime.timedelta(seconds=max(60, expires_in - 60))).strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    existing = fetch_one("SELECT user_id, refresh_token FROM user_google_tokens WHERE user_id = %s", [user_id])
    if existing:
        final_refresh = refresh_token or existing.get("refresh_token")
        execute_sql(
            """
            UPDATE user_google_tokens
            SET access_token = %s, refresh_token = %s, expires_at = %s
            WHERE user_id = %s
            """,
            [access_token, final_refresh, expires_at, user_id],
        )
    else:
        execute_sql(
            """
            INSERT INTO user_google_tokens (user_id, access_token, refresh_token, expires_at)
            VALUES (%s, %s, %s, %s)
            """,
            [user_id, access_token, refresh_token, expires_at],
        )
    return user_id


def get_valid_access_token(user_id: int) -> str | None:
    ensure_google_tokens_table()
    row = fetch_one(
        "SELECT access_token, refresh_token, expires_at FROM user_google_tokens WHERE user_id = %s",
        [user_id],
    )
    if not row:
        return None

    expires_at = row.get("expires_at")
    now_utc = datetime.datetime.utcnow()
    is_expired = False
    if isinstance(expires_at, datetime.datetime):
        is_expired = expires_at <= now_utc
    elif isinstance(expires_at, str) and expires_at:
        try:
            is_expired = datetime.datetime.strptime(expires_at[:19], "%Y-%m-%d %H:%M:%S") <= now_utc
        except Exception:
            is_expired = False

    if not is_expired and row.get("access_token"):
        return row["access_token"]

    refresh_token = row.get("refresh_token")
    if not refresh_token:
        return None

    post_data = urllib.parse.urlencode(
        {
            "client_id": getattr(settings, "GOOGLE_CLIENT_ID", ""),
            "client_secret": getattr(settings, "GOOGLE_CLIENT_SECRET", ""),
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        }
    ).encode("utf-8")
    try:
        req = urllib.request.Request("https://oauth2.googleapis.com/token", data=post_data, method="POST")
        req.add_header("Content-Type", "application/x-www-form-urlencoded")
        with urllib.request.urlopen(req, timeout=10) as resp:
            token_data = json.loads(resp.read().decode("utf-8"))
        new_access = token_data["access_token"]
        expires_in = int(token_data.get("expires_in") or 3600)
        new_expires = (now_utc + datetime.timedelta(seconds=max(60, expires_in - 60))).strftime(
            "%Y-%m-%d %H:%M:%S"
        )
        execute_sql(
            "UPDATE user_google_tokens SET access_token = %s, expires_at = %s WHERE user_id = %s",
            [new_access, new_expires, user_id],
        )
        return new_access
    except Exception:
        return None


def create_google_meet_event(
    access_token: str,
    summary: str = "Job Interview",
    start_dt: datetime.datetime | None = None,
    attendee_email: str | None = None,
) -> str:
    start = start_dt or (datetime.datetime.utcnow() + datetime.timedelta(days=1)).replace(
        hour=9, minute=0, second=0, microsecond=0
    )
    end = start + datetime.timedelta(minutes=45)

    body = {
        "summary": summary or "Job Interview",
        "start": {"dateTime": start.strftime("%Y-%m-%dT%H:%M:%S"), "timeZone": "Asia/Phnom_Penh"},
        "end": {"dateTime": end.strftime("%Y-%m-%dT%H:%M:%S"), "timeZone": "Asia/Phnom_Penh"},
        "conferenceData": {
            "createRequest": {
                "requestId": str(uuid.uuid4()),
                "conferenceSolutionKey": {"type": "hangoutsMeet"},
            }
        },
    }
    if attendee_email:
        body["attendees"] = [{"email": attendee_email}]

    req = urllib.request.Request(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
        data=json.dumps(body).encode("utf-8"),
        method="POST",
    )
    req.add_header("Authorization", f"Bearer {access_token}")
    req.add_header("Content-Type", "application/json")

    with urllib.request.urlopen(req, timeout=12) as resp:
        event_data = json.loads(resp.read().decode("utf-8"))

    hangout_link = event_data.get("hangoutLink")
    if not hangout_link:
        entry_points = (event_data.get("conferenceData") or {}).get("entryPoints") or []
        for ep in entry_points:
            if ep.get("entryPointType") == "video" and ep.get("uri"):
                hangout_link = ep["uri"]
                break

    if not hangout_link:
        raise ValueError("Google Calendar did not return a Google Meet link.")
    return hangout_link
