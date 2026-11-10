from django.urls import path
from .views import SeekerResumeView

urlpatterns = [
    path("", SeekerResumeView.as_view(), name="seeker-resumes"),
    path("<int:pk>/", SeekerResumeView.as_view(), name="seeker-resume-delete"),
]

