from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    RefreshTokenView,
    LogoutView,
    MeView,
    OAuthLoginView,
    GoogleLoginRedirectView,
    GoogleCallbackView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("oauth/", OAuthLoginView.as_view(), name="auth-oauth"),
    path("google/login/", GoogleLoginRedirectView.as_view(), name="auth-google-login"),
    path("google/callback/", GoogleCallbackView.as_view(), name="auth-google-callback"),
    path("refresh/", RefreshTokenView.as_view(), name="auth-refresh"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("me/", MeView.as_view(), name="auth-me"),
]

