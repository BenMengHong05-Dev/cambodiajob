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
from common.database import fetch_one, execute_insert, execute_sql


class AuthenticatedUser:
    """
    Lightweight user object populated exclusively from raw SQL queries.
    """
    def __init__(self, data: dict):
        self.id = data["id"]
        self.email = data["email"]
        self.full_name = data.get("full_name", "")
        self.phone_number = data.get("phone_number")
        self.is_active = bool(data.get("is_active", True))
        
        # Parse roles list
        raw_roles = data.get("role_names")
        if isinstance(raw_roles, str):
            self.roles = [r.strip() for r in raw_roles.split(",") if r.strip()]
        elif isinstance(raw_roles, list):
            self.roles = raw_roles
        else:
            self.roles = []
            
        self.is_authenticated = True

    def has_role(self, role_name: str) -> bool:
        return role_name in self.roles

    @property
    def is_admin(self) -> bool:
        return "admin" in self.roles

    @property
    def is_employer(self) -> bool:
        return "employer" in self.roles

    @property
    def is_job_seeker(self) -> bool:
        return "job_seeker" in self.roles

    @property
    def role(self) -> str:
        if self.id == 1 or "admin" in self.roles:
            return "admin"
        if "employer" in self.roles:
            return "employer"
        return "job_seeker"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "phone_number": self.phone_number,
            "is_active": self.is_active,
            "role": self.role,
            "roles": self.roles if self.roles else [self.role],
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
            GROUP_CONCAT(r.name) AS role_names
        FROM users u
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        LEFT JOIN roles r ON r.id = ur.role_id
        WHERE u.id = %s
        GROUP BY u.id, u.email, u.full_name, u.phone_number, u.is_active
    """
    row = fetch_one(sql, [user_id])
    if not row:
        return None
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

