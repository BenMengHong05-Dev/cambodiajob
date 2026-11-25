import json
from rest_framework.views import APIView
from rest_framework.response import Response
from common.permissions import IsAuthenticatedCustom
from common.database import fetch_all, execute_sql


class NotificationListView(APIView):
    permission_classes = [IsAuthenticatedCustom]

    def get(self, request):
        notifications = fetch_all(
            "SELECT * FROM notifications WHERE user_id = %s ORDER BY created_at DESC, id DESC LIMIT 60",
            [request.user.id],
        )
        for n in notifications:
            raw_data = n.get("data")
            parsed = {}
            if isinstance(raw_data, dict):
                parsed = raw_data
            elif isinstance(raw_data, str) and raw_data.strip():
                try:
                    parsed = json.loads(raw_data)
                except Exception:
                    parsed = {}
            n["data"] = parsed
            if not n.get("title_km") and parsed.get("title_km"):
                n["title_km"] = parsed["title_km"]
            if not n.get("message_km") and parsed.get("message_km"):
                n["message_km"] = parsed["message_km"]

        unread_count = sum(1 for n in notifications if not n["is_read"])
        return Response({
            "success": True,
            "data": {
                "notifications": notifications,
                "unread_count": unread_count,
            }
        })


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticatedCustom]

    def patch(self, request, pk):
        execute_sql(
            "UPDATE notifications SET is_read = TRUE WHERE id = %s AND user_id = %s",
            [pk, request.user.id],
        )
        return Response({"success": True, "message": "Notification marked as read."})

    def post(self, request, pk):
        return self.patch(request, pk)


class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticatedCustom]

    def patch(self, request):
        execute_sql("UPDATE notifications SET is_read = TRUE WHERE user_id = %s", [request.user.id])
        return Response({"success": True, "message": "All notifications marked as read."})

    def post(self, request):
        return self.patch(request)


class NotificationDetailView(APIView):
    permission_classes = [IsAuthenticatedCustom]

    def delete(self, request, pk):
        execute_sql(
            "DELETE FROM notifications WHERE id = %s AND user_id = %s",
            [pk, request.user.id],
        )
        return Response({"success": True, "message": "Notification deleted."})

