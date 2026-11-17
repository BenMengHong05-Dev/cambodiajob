from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Auth
    path("api/v1/auth/", include("apps.accounts.urls")),
    # Jobs
    path("api/v1/jobs/", include("apps.jobs.urls")),
    path("api/v1/employer/jobs/", include("apps.jobs.employer_urls")),
    # Companies
    path("api/v1/companies/", include("apps.companies.urls")),
    path("api/v1/employer/", include("apps.companies.employer_urls")),
    # Catalogs
    path("api/v1/categories/", include("apps.job_categories.urls")),
    path("api/v1/locations/", include("apps.locations.urls")),
    path("api/v1/skills/", include("apps.skills.urls")),
    # Candidate Profile & CV
    path("api/v1/seeker/", include("apps.seeker_profiles.urls")),
    path("api/v1/seeker/resumes/", include("apps.resumes.urls")),
    path("api/v1/seeker/", include("apps.saved_jobs.urls")),
    # Applications & Interviews
    path("api/v1/applications/", include("apps.applications.urls")),
    path("api/v1/interviews/", include("apps.interviews.urls")),
    # Notifications
    path("api/v1/notifications/", include("apps.notifications.urls")),
    # AI Job Agent
    path("api/v1/ai/", include("apps.ai_agent.urls")),
    # Admin
    path("api/v1/admin/", include("apps.audit_logs.admin_urls")),
    # Public Website Settings
    path("api/v1/site-settings/", include("apps.audit_logs.public_urls")),
]

from django.views.static import serve
from django.urls import re_path

urlpatterns += [
    re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
]
