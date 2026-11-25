"""
Centralized Notification Service for user actions and platform events.
"""

import json
import logging
from common.database import fetch_all, execute_insert

logger = logging.getLogger(__name__)


def create_notification(
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "system",
    data: dict | None = None,
    title_km: str | None = None,
    message_km: str | None = None,
) -> int | None:
    """Safely insert an in-app notification for a user without breaking the caller."""
    if not user_id:
        return None
    try:
        payload = dict(data) if isinstance(data, dict) else {}
        if title_km:
            payload["title_km"] = title_km
        if message_km:
            payload["message_km"] = message_km

        return execute_insert(
            """
            INSERT INTO notifications (user_id, title, message, notification_type, data)
            VALUES (%s, %s, %s, %s, %s)
            """,
            [
                user_id,
                title[:255],
                message,
                (notification_type or "system")[:50],
                json.dumps(payload) if payload else None,
            ],
        )
    except Exception as exc:
        logger.warning("Failed to create notification for user %s: %s", user_id, exc)
        return None


def notify_admins(
    title: str,
    message: str,
    notification_type: str = "user_activity",
    data: dict | None = None,
    title_km: str | None = None,
    message_km: str | None = None,
    exclude_user_id: int | None = None,
) -> None:
    """Send an in-app notification to all active platform administrators."""
    try:
        admins = fetch_all(
            """
            SELECT DISTINCT u.id
            FROM users u
            LEFT JOIN user_roles ur ON ur.user_id = u.id
            LEFT JOIN roles r ON r.id = ur.role_id
            WHERE u.is_active = TRUE AND (u.id = 1 OR r.name = 'admin')
            """
        )
        for admin in admins:
            admin_id = admin.get("id")
            if admin_id and admin_id != exclude_user_id:
                create_notification(
                    user_id=admin_id,
                    title=title,
                    message=message,
                    notification_type=notification_type,
                    data=data,
                    title_km=title_km,
                    message_km=message_km,
                )
    except Exception as exc:
        logger.warning("Failed to notify admins: %s", exc)
