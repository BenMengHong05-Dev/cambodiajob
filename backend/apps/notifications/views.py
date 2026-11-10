from rest_framework.views import APIView
from rest_framework.response import Response
from common.permissions import IsAuthenticatedCustom
from common.database import fetch_all, execute_sql


class NotificationListView(APIView):
    permission_classes = [IsAuthenticatedCustom]

    def get(self, request):
        notifications = fetch_all(
            "SELECT * FROM notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 50",
            [request.user.id],
        )
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

