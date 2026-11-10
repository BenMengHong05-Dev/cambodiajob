from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from common.permissions import IsAuthenticatedCustom
from common.database import fetch_one
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    TokenRefreshSerializer,
    LogoutSerializer,
    OAuthLoginSerializer,
)
from .services import (
    register_user,
    authenticate_user,
    refresh_token_service,
    logout_user,
    oauth_login_or_register,
)


class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = register_user(serializer.validated_data)
        return Response(
            {
                "success": True,
                "message": "User registered successfully.",
                "data": result,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = authenticate_user(serializer.validated_data)
        return Response(
            {
                "success": True,
                "message": "Logged in successfully.",
                "data": result,
            },
            status=status.HTTP_200_OK,
        )


class OAuthLoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OAuthLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        email = (data.get("email") or "").strip()
        full_name = (data.get("full_name") or "").strip()
        avatar_url = (data.get("avatar_url") or "").strip()
        token = (data.get("token") or "").strip()

        # If a Google OAuth access token is provided, verify or fetch profile directly from Google
        if token and (not email or not full_name):
            try:
                import json
                import urllib.request
                req = urllib.request.Request(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    headers={"Authorization": f"Bearer {token}"}
                )
                with urllib.request.urlopen(req, timeout=5) as response:
                    g_data = json.loads(response.read().decode("utf-8"))
                    email = email or g_data.get("email", "")
                    full_name = full_name or g_data.get("name", "")
                    avatar_url = avatar_url or g_data.get("picture", "")
            except Exception:
                pass

        if not email:
            return Response(
                {"success": False, "error": "Email is required to complete authentication."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = oauth_login_or_register(
            provider=data.get("provider", "google"),
            email=email,
            full_name=full_name,
            avatar_url=avatar_url,
            role=data.get("role", "job_seeker"),
        )
        return Response(
            {
                "success": True,
                "message": f"Successfully authenticated via {data.get('provider', 'OAuth2').capitalize()}.",
                "data": result,
            },
            status=status.HTTP_200_OK,
        )


class RefreshTokenView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = TokenRefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = refresh_token_service(serializer.validated_data["refresh_token"])
        return Response(
            {
                "success": True,
                "message": "Token refreshed successfully.",
                "data": result,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        logout_user(serializer.validated_data["refresh_token"])
        return Response(
            {
                "success": True,
                "message": "Logged out successfully.",
            },
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticatedCustom]

    def get(self, request):
        user = request.user
        data = user.to_dict()

        # If Job Seeker, attach seeker profile summary
        if user.is_job_seeker:
            profile = fetch_one(
                """
                SELECT id, headline, avatar_url, province, city
                FROM seeker_profiles
                WHERE user_id = %s
                """,
                [user.id],
            )
            data["seeker_profile"] = profile

        # If Employer, attach company info
        if user.is_employer:
            company = fetch_one(
                """
                SELECT c.id, c.name, c.slug, c.logo_url, c.verification_status, em.role as member_role
                FROM companies c
                INNER JOIN employer_members em ON em.company_id = c.id
                WHERE em.user_id = %s
                LIMIT 1
                """,
                [user.id],
            )
            data["company"] = company

        return Response(
            {
                "success": True,
                "data": data,
            },
            status=status.HTTP_200_OK,
        )

