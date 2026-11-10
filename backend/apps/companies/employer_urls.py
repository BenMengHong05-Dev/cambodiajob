from django.urls import path
from .views import EmployerCompanyView, EmployerCompanyUploadView

urlpatterns = [
    path("company/", EmployerCompanyView.as_view(), name="employer-company"),
    path("company/upload/", EmployerCompanyUploadView.as_view(), name="employer-company-upload"),
]


