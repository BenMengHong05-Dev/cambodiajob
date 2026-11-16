from django.urls import path
from .views import (
    JobApplyView,
    SeekerApplicationListView,
    EmployerJobApplicationsView,
    EmployerRecentApplicationsView,
    EmployerApplicationStatusUpdateView,
)

urlpatterns = [
    path("apply/<int:pk>/", JobApplyView.as_view(), name="job-apply"),
    path("seeker/", SeekerApplicationListView.as_view(), name="seeker-applications"),
    path("seeker/<int:pk>/", SeekerApplicationListView.as_view(), name="seeker-application-detail-delete"),
    path("employer/job/<int:pk>/", EmployerJobApplicationsView.as_view(), name="employer-job-applications"),
    path("employer/recent/", EmployerRecentApplicationsView.as_view(), name="employer-recent-applications"),
    path("employer/<int:pk>/status/", EmployerApplicationStatusUpdateView.as_view(), name="employer-app-status"),
]

