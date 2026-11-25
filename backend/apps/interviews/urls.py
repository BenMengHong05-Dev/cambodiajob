from django.urls import path
from .views import (
    ScheduleInterviewView,
    GoogleMeetGenerateView,
    GoogleMeetOAuthCallbackView,
)

urlpatterns = [
    path("applications/<int:pk>/interview/", ScheduleInterviewView.as_view(), name="schedule-interview"),
    path("google-meet/generate/", GoogleMeetGenerateView.as_view(), name="google-meet-generate"),
    path("google-meet/callback/", GoogleMeetOAuthCallbackView.as_view(), name="google-meet-callback"),
]

