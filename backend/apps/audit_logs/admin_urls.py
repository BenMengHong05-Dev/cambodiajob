from django.urls import path
from .views import (
    AdminDashboardView,
    AdminUsersView,
    AdminUserDetailView,
    AdminUserBulkDeleteView,
    AdminUserStatusView,
    AdminCompaniesView,
    AdminCompanyDetailView,
    AdminCompanyVerificationView,
    AdminJobsModerationView,
    AdminAuditLogsView,
    AdminSiteSettingsView,
    AdminSiteSettingsUploadLogoView,
)
from apps.job_categories.views import CategoryListView, CategoryDetailView

urlpatterns = [
    path("dashboard/", AdminDashboardView.as_view(), name="admin-dashboard"),
    path("settings/", AdminSiteSettingsView.as_view(), name="admin-settings"),
    path("settings/upload-logo/", AdminSiteSettingsUploadLogoView.as_view(), name="admin-settings-upload-logo"),
    path("categories/", CategoryListView.as_view(), name="admin-categories"),
    path("categories/<int:pk>/", CategoryDetailView.as_view(), name="admin-category-detail"),
    path("users/", AdminUsersView.as_view(), name="admin-users"),
    path("users/<int:pk>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
    path("users/bulk-delete/", AdminUserBulkDeleteView.as_view(), name="admin-user-bulk-delete"),
    path("users/<int:pk>/status/", AdminUserStatusView.as_view(), name="admin-user-status"),
    path("companies/", AdminCompaniesView.as_view(), name="admin-companies"),
    path("companies/<int:pk>/", AdminCompanyDetailView.as_view(), name="admin-company-detail"),
    path("companies/<int:pk>/verification/", AdminCompanyVerificationView.as_view(), name="admin-company-verification"),
    path("jobs/", AdminJobsModerationView.as_view(), name="admin-jobs"),
    path("jobs/<int:pk>/moderation/", AdminJobsModerationView.as_view(), name="admin-job-moderation"),
    path("audit/", AdminAuditLogsView.as_view(), name="admin-audit-logs"),
]

