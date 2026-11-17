from django.urls import path
from .views import PublicSiteSettingsView

urlpatterns = [
    path("", PublicSiteSettingsView.as_view(), name="public-site-settings"),
]
