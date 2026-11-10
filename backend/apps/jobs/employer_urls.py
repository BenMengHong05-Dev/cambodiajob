from django.urls import path
from .views import EmployerJobManagementView, EmployerJobDetailView, EmployerJobStatusView

urlpatterns = [
    path("", EmployerJobManagementView.as_view(), name="employer-jobs-list-create"),
    path("<int:pk>/", EmployerJobDetailView.as_view(), name="employer-job-detail-update"),
    path("<int:pk>/status/", EmployerJobStatusView.as_view(), name="employer-job-status-update"),
]

