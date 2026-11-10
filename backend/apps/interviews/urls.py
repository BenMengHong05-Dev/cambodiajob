from django.urls import path
from .views import ScheduleInterviewView

urlpatterns = [
    path("applications/<int:pk>/interview/", ScheduleInterviewView.as_view(), name="schedule-interview"),
]

