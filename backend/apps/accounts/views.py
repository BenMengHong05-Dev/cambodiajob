import json
import logging
import urllib.error
import urllib.parse
import urllib.request
from django.conf import settings
from django.http import HttpResponseRedirect
from django.contrib.auth.hashers import make_password, check_password
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

from common.permissions import IsAuthenticatedCustom
from common.database import fetch_one, execute_sql, execute_insert
from common.authentication import get_user_by_id
from apps.notifications.services import create_notification, notify_admins
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
        code = (data.get("code") or "").strip()

        # If a Google OAuth authorization code is provided, exchange it for access token
        if code and not token and (not email or not full_name):
            try:
                import json
                import urllib.parse
                import urllib.request
                token_url = "https://oauth2.googleapis.com/token"
                post_data = urllib.parse.urlencode({
                    "code": code,
                    "client_id": getattr(settings, "GOOGLE_CLIENT_ID", ""),
                    "client_secret": getattr(settings, "GOOGLE_CLIENT_SECRET", ""),
                    "redirect_uri": getattr(settings, "GOOGLE_REDIRECT_URI", "http://localhost:5173/auth/google/callback"),
                    "grant_type": "authorization_code",
                }).encode("utf-8")
                token_req = urllib.request.Request(token_url, data=post_data, method="POST")
                token_req.add_header("Content-Type", "application/x-www-form-urlencoded")
                with urllib.request.urlopen(token_req, timeout=8) as t_resp:
                    t_data = json.loads(t_resp.read().decode("utf-8"))
                    token = t_data.get("access_token", "")
            except Exception:
                pass

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
            if profile and profile.get("avatar_url"):
                data["avatar_url"] = profile["avatar_url"]

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
            if company and company.get("logo_url"):
                data["avatar_url"] = company["logo_url"]

        return Response(
            {
                "success": True,
                "data": data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request):
        """Allow the authenticated user to update their own name and phone number."""
        user = request.user
        full_name = (request.data.get("full_name") or "").strip()
        phone_number = request.data.get("phone_number")

        updates = []
        params = []
        if full_name:
            updates.append("full_name = %s")
            params.append(full_name)
        if phone_number is not None:
            updates.append("phone_number = %s")
            params.append(str(phone_number).strip() or None)

        if updates:
            updates.append("updated_at = NOW()")
            params.append(user.id)
            execute_sql(f"UPDATE users SET {', '.join(updates)} WHERE id = %s", params)

        updated_user = get_user_by_id(user.id)
        data = updated_user.to_dict() if updated_user else user.to_dict()
        if updates:
            create_notification(
                user_id=user.id,
                title="Account Details Updated",
                title_km="ព័ត៌មានគណនីត្រូវបានកែប្រែ",
                message="Your account name or phone number has been updated.",
                message_km="ព័ត៌មានគណនីរបស់អ្នកត្រូវបានកែប្រែដោយជោគជ័យ។",
                notification_type="profile_update",
                data={"action": "account_update"},
            )
        return Response(
            {
                "success": True,
                "message": "Profile updated successfully.",
                "data": data,
            },
            status=status.HTTP_200_OK,
        )


class ChangePasswordView(APIView):
    """Allow an authenticated user to change their own password after verifying current password."""
    permission_classes = [IsAuthenticatedCustom]

    def post(self, request):
        current_password = request.data.get("current_password") or ""
        new_password = (request.data.get("new_password") or "").strip()

        if not current_password or not new_password:
            return Response(
                {"success": False, "error": "Current password and new password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 6:
            return Response(
                {"success": False, "error": "New password must be at least 6 characters long."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        row = fetch_one("SELECT id, password_hash FROM users WHERE id = %s", [request.user.id])
        if not row:
            return Response({"success": False, "error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if not check_password(current_password, row["password_hash"]):
            return Response(
                {"success": False, "error": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        hashed = make_password(new_password)
        execute_sql("UPDATE users SET password_hash = %s, updated_at = NOW() WHERE id = %s", [hashed, request.user.id])
        try:
            execute_insert(
                "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (%s, 'change_password', 'user', %s, %s)",
                [request.user.id, request.user.id, json.dumps({"self_service": True})],
            )
        except Exception:
            pass

        create_notification(
            user_id=request.user.id,
            title="Password Changed",
            title_km="ពាក្យសម្ងាត់ត្រូវបានផ្លាស់ប្តូរ",
            message="Your account password was changed successfully.",
            message_km="ពាក្យសម្ងាត់គណនីរបស់អ្នកត្រូវបានផ្លាស់ប្តូរដោយជោគជ័យ។",
            notification_type="security",
            data={"action": "change_password"},
        )
        notify_admins(
            title="User Changed Password",
            title_km="អ្នកប្រើប្រាស់បានប្តូរពាក្យសម្ងាត់",
            message=f"{request.user.full_name or request.user.email} changed their account password.",
            message_km=f"{request.user.full_name or request.user.email} បានផ្លាស់ប្តូរពាក្យសម្ងាត់គណនី។",
            notification_type="security",
            data={"action": "change_password", "actor_id": request.user.id},
            exclude_user_id=request.user.id,
        )

        return Response(
            {"success": True, "message": "Password changed successfully."},
            status=status.HTTP_200_OK,
        )


class GoogleLoginRedirectView(APIView):
    """
    Initiates Google OAuth 2.0 login by redirecting the user to Google's consent screen.
    Query param ?role=job_seeker or ?role=employer sets the registering role.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        client_id = getattr(settings, "GOOGLE_CLIENT_ID", "")
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
        if not client_id:
            return HttpResponseRedirect(f"{frontend_url}/login?error=missing_google_client_id")

        redirect_uri = getattr(settings, "GOOGLE_REDIRECT_URI", "http://127.0.0.1:8000/api/v1/auth/google/callback/")
        role = request.GET.get("role", "job_seeker")
        state = f"role:{role}"

        google_auth_url = (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={urllib.parse.quote(client_id)}&"
            f"redirect_uri={urllib.parse.quote(redirect_uri)}&"
            f"response_type=code&"
            f"scope={urllib.parse.quote('openid email profile')}&"
            f"access_type=offline&"
            f"prompt=select_account&"
            f"state={urllib.parse.quote(state)}"
        )

        # If client requested JSON (e.g. mobile or SPA wanting the URL)
        if request.GET.get("format") == "json" or request.headers.get("Accept") == "application/json":
            return Response({"success": True, "data": {"url": google_auth_url}})

        return HttpResponseRedirect(google_auth_url)


class GoogleCallbackView(APIView):
    """
    Handles Google OAuth 2.0 authorization code callback on the backend.
    Exchanges code for tokens with Google, verifies profile, logs in or registers user,
    then redirects to frontend /auth/callback with JWT access and refresh tokens.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        error = request.GET.get("error")
        code = request.GET.get("code")
        state = request.GET.get("state", "")
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")

        if error:
            logger.warning(f"Google OAuth returned error: {error}")
            return HttpResponseRedirect(f"{frontend_url}/auth/callback?error={urllib.parse.quote(error)}")

        if not code:
            return HttpResponseRedirect(f"{frontend_url}/auth/callback?error=missing_authorization_code")

        client_id = getattr(settings, "GOOGLE_CLIENT_ID", "")
        client_secret = getattr(settings, "GOOGLE_CLIENT_SECRET", "")
        if not client_secret:
            logger.error("GOOGLE_CLIENT_SECRET is missing in backend settings/.env")
            return HttpResponseRedirect(f"{frontend_url}/auth/callback?error=missing_google_client_secret")

        redirect_uri = getattr(settings, "GOOGLE_REDIRECT_URI", "http://127.0.0.1:8000/api/v1/auth/google/callback/")

        try:
            # 1. Exchange authorization code for tokens
            token_url = "https://oauth2.googleapis.com/token"
            post_data = urllib.parse.urlencode({
                "code": code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            }).encode("utf-8")

            token_req = urllib.request.Request(token_url, data=post_data, method="POST")
            token_req.add_header("Content-Type", "application/x-www-form-urlencoded")
            with urllib.request.urlopen(token_req, timeout=10) as t_resp:
                t_data = json.loads(t_resp.read().decode("utf-8"))
                access_token = t_data.get("access_token")

            if not access_token:
                logger.error("No access_token returned in Google token exchange")
                return HttpResponseRedirect(f"{frontend_url}/auth/callback?error=token_exchange_failed")

            # 2. Fetch verified user profile from Google UserInfo endpoint
            userinfo_req = urllib.request.Request(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            with urllib.request.urlopen(userinfo_req, timeout=8) as u_resp:
                profile = json.loads(u_resp.read().decode("utf-8"))

            email = profile.get("email")
            full_name = profile.get("name") or profile.get("given_name") or (email.split("@")[0] if email else "")
            avatar_url = profile.get("picture", "")

            if not email:
                logger.error("No email in Google profile payload")
                return HttpResponseRedirect(f"{frontend_url}/auth/callback?error=missing_email")

            role = "job_seeker"
            if "role:employer" in state:
                role = "employer"

            # 3. Create or login user in MySQL database
            result = oauth_login_or_register(
                provider="google",
                email=email,
                full_name=full_name,
                avatar_url=avatar_url,
                role=role,
            )

            # 4. Redirect user to frontend with tokens
            query = urllib.parse.urlencode({
                "access": result["access"],
                "refresh": result["refresh"],
                "name": result["user"].get("full_name", full_name),
                "email": result["user"].get("email", email),
            })
            return HttpResponseRedirect(f"{frontend_url}/auth/callback?{query}")

        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8") if e.fp else str(e)
            logger.error(f"Google token exchange HTTPError: {e.code} - {err_body}")
            return HttpResponseRedirect(f"{frontend_url}/auth/callback?error=google_token_error")
        except Exception as e:
            logger.error(f"Google OAuth callback unexpected error: {e}", exc_info=True)
            return HttpResponseRedirect(f"{frontend_url}/auth/callback?error=auth_internal_error")

