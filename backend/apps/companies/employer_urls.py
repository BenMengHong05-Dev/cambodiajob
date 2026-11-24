from django.urls import path
from .views import EmployerCompanyView, EmployerCompanyUploadView, EmployerCompanyMembersView

urlpatterns = [
    path("company/", EmployerCompanyView.as_view(), name="employer-company"),
    path("company/upload/", EmployerCompanyUploadView.as_view(), name="employer-company-upload"),
    path("company/members/", EmployerCompanyMembersView.as_view(), name="employer-company-members"),
    path("company/members/<int:user_id>/", EmployerCompanyMembersView.as_view(), name="employer-company-member-delete"),
]


