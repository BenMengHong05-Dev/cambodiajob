"""
Raw SQL JWT Authentication for Cambodia Job Search & Recruitment Platform.
Validates tokens and loads user data directly from the raw SQL database layer.
"""

from datetime import datetime, timedelta, timezone
import uuid
import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed
from common.database import fetch_one, fetch_all, execute_insert, execute_sql


ALL_PLATFORM_PERMISSIONS = [
    "admin:access", "users:manage", "categories:manage",
    "companies:verify", "jobs:moderate", "audit:view", "settings:manage",
    "employer:access", "jobs:create", "jobs:edit", "jobs:delete",
    "applications:view", "applications:review", "company:manage",
    "seeker:access", "profile:manage", "resumes:manage",
    "jobs:apply", "jobs:save", "notifications:view"
]

COMPANY_ROLE_ALLOWED_EMPLOYER_PERMS = {
    "owner": {
        "employer:access", "jobs:create", "jobs:edit", "jobs:delete",
        "applications:view", "applications:review", "company:manage", "notifications:view"
    },
    "hiring_manager": {
        "employer:access", "jobs:create", "jobs:edit", "jobs:delete",
        "applications:view", "applications:review", "notifications:view"
    },
    "recruiter": {
        "employer:access", "jobs:create", "jobs:edit",
        "applications:view", "applications:review", "notifications:view"
    },
    "interviewer": {
        "employer:access", "applications:view", "applications:review", "notifications:view"
    },
    "member": {
        "employer:access", "applications:view", "notifications:view"
    },
}

ALL_EMPLOYER_MODULE_PERMS = {
    "employer:access", "jobs:create", "jobs:edit", "jobs:delete",
    "applications:view", "applications:review", "company:manage"
}


class AuthenticatedUser:
    """
    Lightweight user object populated exclusively from raw SQL queries.
    """
    def __init__(self, data: dict):
        self.id = data["id"]
        self.email = data["email"]
        self.full_name = data.get("full_name", "")
        self.phone_number = data.get("phone_number")
        self.avatar_url = data.get("avatar_url")
        self.is_active = bool(data.get("is_active", True))
        self.national_id_card = data.get("national_id_card")
        self.national_id_photo = data.get("national_id_photo")
        self.company_member_role = (data.get("company_member_role") or "").strip().lower() or None

        # Parse roles list
        raw_roles = data.get("role_names")
        if isinstance(raw_roles, str):
            self.roles = [r.strip() for r in raw_roles.split(",") if r.strip()]
        elif isinstance(raw_roles, list):
            self.roles = raw_roles
        else:
            self.roles = []

        self.custom_permissions = data.get("custom_permissions")
        self.has_custom_permissions = bool(data.get("has_custom_permissions", False))
        self.is_authenticated = True

    def has_role(self, role_name: str) -> bool:
        return role_name in self.roles

    @property
    def is_admin(self) -> bool:
        return (
            self.id == 1
            or "super_admin" in self.roles
            or "admin" in self.roles
            or "admin:access" in self.permissions
        )

    @property
    def is_employer(self) -> bool:
        return "employer" in self.roles or "employer:access" in self.permissions

    @property
    def is_job_seeker(self) -> bool:
        return "job_seeker" in self.roles or "seeker:access" in self.permissions

    @property
    def role(self) -> str:
        if self.id == 1 or "super_admin" in self.roles or "admin" in self.roles:
            return "admin"
        perms = self.permissions
        if "admin:access" in perms:
            return "admin"
        if "employer" in self.roles or "employer:access" in perms:
            return "employer"
        return self.roles[0] if self.roles else "job_seeker"

    @property
    def permissions(self) -> list:
        """
        Calculates effective granular permissions based on:
        1. Super Admin (id == 1 or 'super_admin' role) -> all platform permissions.
        2. Direct user_permissions override (if has_custom_permissions is True).
        3. Role permissions from role_permissions table (or sensible defaults per role).
        4. Employer company sub-user role scope (owner, hiring_manager, recruiter, interviewer, member).
        """
        if self.id == 1 or "super_admin" in self.roles:
            return list(ALL_PLATFORM_PERMISSIONS)

        if self.has_custom_permissions and self.custom_permissions is not None:
            return sorted(list({p for p in self.custom_permissions if p and p != "__none__"}))

        if self.custom_permissions is not None:
            perms = {p for p in self.custom_permissions if p and p != "__none__"}
        else:
            perms = set()
            for r in self.roles:
                rl = r.lower()
                if rl == "super_admin":
                    return list(ALL_PLATFORM_PERMISSIONS)
                elif rl == "admin":
                    perms.update([
                        "admin:access", "users:manage", "categories:manage",
                        "companies:verify", "jobs:moderate", "audit:view",
                        "settings:manage", "notifications:view"
                    ])
                elif rl == "moderator":
                    perms.update([
                        "admin:access", "companies:verify", "jobs:moderate",
                        "audit:view", "notifications:view"
                    ])
                elif rl in ("employer", "recruiter", "hr_manager"):
                    perms.update([
                        "employer:access", "jobs:create", "jobs:edit", "jobs:delete",
                        "applications:view", "applications:review", "company:manage",
                        "notifications:view"
                    ])
                elif rl == "job_seeker":
                    perms.update([
                        "seeker:access", "profile:manage", "resumes:manage",
                        "jobs:apply", "jobs:save", "notifications:view"
                    ])

        # Enforce employer sub-user member_role scoping when no direct user override exists
        if self.company_member_role and self.company_member_role in COMPANY_ROLE_ALLOWED_EMPLOYER_PERMS:
            allowed_emp = COMPANY_ROLE_ALLOWED_EMPLOYER_PERMS[self.company_member_role]
            non_emp = perms - ALL_EMPLOYER_MODULE_PERMS
            scoped_emp = (perms & ALL_EMPLOYER_MODULE_PERMS) & allowed_emp
            # Guarantee employer sub-users at least retain the base privileges of their member role
            if not scoped_emp and ("employer" in self.roles or "employer:access" in perms):
                scoped_emp = allowed_emp & ALL_EMPLOYER_MODULE_PERMS
            perms = non_emp | scoped_emp

        return sorted(list(perms))

    def has_permission(self, perm: str) -> bool:
        if self.id == 1 or "super_admin" in self.roles:
            return True
        return perm in self.permissions

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "phone_number": self.phone_number,
            "avatar_url": self.avatar_url,
            "is_active": self.is_active,
            "national_id_card": self.national_id_card,
            "national_id_photo": self.national_id_photo,
            "role": self.role,
            "roles": self.roles if self.roles else [self.role],
            "company_member_role": self.company_member_role,
            "permissions": self.permissions,
            "has_custom_permissions": self.has_custom_permissions,
        }


def get_user_by_id(user_id: int) -> AuthenticatedUser | None:
    """
    Fetch a user by primary key using parameterized raw SQL.
    """
    sql = """
        SELECT 
            u.id, 
            u.email, 
            u.full_name, 
            u.phone_number, 
            u.is_active,
            u.national_id_card,
            u.national_id_photo,
            COALESCE(sp.avatar_url, c.logo_url) AS avatar_url,
            GROUP_CONCAT(DISTINCT r.name) AS role_names,
            MAX(em.role) AS company_member_role
        FROM users u
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        LEFT JOIN roles r ON r.id = ur.role_id
        LEFT JOIN seeker_profiles sp ON sp.user_id = u.id
        LEFT JOIN employer_members em ON em.user_id = u.id
        LEFT JOIN companies c ON c.id = em.company_id
        WHERE u.id = %s
        GROUP BY u.id, u.email, u.full_name, u.phone_number, u.is_active, u.national_id_card, u.national_id_photo, sp.avatar_url, c.logo_url
    """
    row = fetch_one(sql, [user_id])
    if not row:
        return None

    # Check for direct custom permissions assigned to this user
    user_perms = fetch_all("SELECT permission FROM user_permissions WHERE user_id = %s", [user_id])
    if user_perms:
        row["custom_permissions"] = [p["permission"] for p in user_perms]
        row["has_custom_permissions"] = True
    else:
        # Check permissions attached to this user's role(s)
        role_perms = fetch_all(
            """
            SELECT DISTINCT rp.permission 
            FROM role_permissions rp
            INNER JOIN user_roles ur ON ur.role_id = rp.role_id
            WHERE ur.user_id = %s
            """,
            [user_id]
        )
        if role_perms:
            row["custom_permissions"] = [p["permission"] for p in role_perms]
        else:
            row["custom_permissions"] = None
        row["has_custom_permissions"] = False

    return AuthenticatedUser(row)


def generate_access_token(user_id: int, email: str, roles: list[str]) -> str:
    """
    Generate a signed JWT access token.
    """
    now = datetime.now(timezone.utc)
    expiration = now + timedelta(minutes=settings.JWT_ACCESS_EXPIRATION_MINUTES)
    payload = {
        "user_id": user_id,
        "email": email,
        "roles": roles,
        "token_type": "access",
        "iat": int(now.timestamp()),
        "exp": int(expiration.timestamp()),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm="HS256")


def generate_refresh_token(user_id: int) -> str:
    """
    Generate and store a signed JWT refresh token in MySQL.
    A random jti guarantees token uniqueness even when two tokens are
    issued for the same user within the same second (e.g. token rotation).
    """
    now = datetime.now(timezone.utc)
    expiration = now + timedelta(days=settings.JWT_REFRESH_EXPIRATION_DAYS)
    payload = {
        "user_id": user_id,
        "token_type": "refresh",
        "jti": uuid.uuid4().hex,
        "iat": int(now.timestamp()),
        "exp": int(expiration.timestamp()),
    }
    token_str = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm="HS256")
    
    # Store token in refresh_tokens table
    sql = """
        INSERT INTO refresh_tokens (user_id, token, revoked, expires_at)
        VALUES (%s, %s, FALSE, %s)
    """
    execute_insert(sql, [user_id, token_str, expiration.strftime("%Y-%m-%d %H:%M:%S")])
    return token_str


def revoke_refresh_token(token_str: str) -> bool:
    """
    Revoke a refresh token in MySQL.
    """
    sql = "UPDATE refresh_tokens SET revoked = TRUE WHERE token = %s"
    return execute_sql(sql, [token_str]) > 0


class RawSQLJWTAuthentication(BaseAuthentication):
    """
    DRF Authentication class that parses Bearer JWT tokens and fetches users via raw SQL.
    """
    def authenticate(self, request):
        auth_header = get_authorization_header(request).split()
        if not auth_header or auth_header[0].lower() != b"bearer":
            return None

        if len(auth_header) == 1:
            raise AuthenticationFailed("Invalid Bearer token header: Token missing")
        elif len(auth_header) > 2:
            raise AuthenticationFailed("Invalid Bearer token header: Token contains spaces")

        token = auth_header[1].decode("utf-8")

        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Access token has expired")
        except jwt.InvalidTokenError:
            raise AuthenticationFailed("Invalid access token")

        if payload.get("token_type") != "access":
            raise AuthenticationFailed("Invalid token type")

        user_id = payload.get("user_id")
        if not user_id:
            raise AuthenticationFailed("Token payload missing user_id")

        user = get_user_by_id(user_id)
        if not user:
            raise AuthenticationFailed("User does not exist")
        if not user.is_active:
            raise AuthenticationFailed("User account is inactive or disabled")

        return (user, token)

