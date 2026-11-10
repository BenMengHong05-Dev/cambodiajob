from django.urls import path
from .views import JobListView, JobDetailView, JobSaveToggleView, JobStatsView

urlpatterns = [
    path("", JobListView.as_view(), name="job-list"),
    path("stats/", JobStatsView.as_view(), name="job-stats"),
    path("<slug:slug>/", JobDetailView.as_view(), name="job-detail"),
    path("<int:pk>/save/", JobSaveToggleView.as_view(), name="job-save-toggle"),
]

