"""
Raw SQL Account & Authentication Services.
"""

from datetime import datetime, timezone
import jwt
from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password
from rest_framework.exceptions import ValidationError, AuthenticationFailed
from common.database import fetch_one, fetch_all, execute_insert, execute_sql, atomic_transaction
from common.authentication import (
    generate_access_token,
    generate_refresh_token,
    revoke_refresh_token,
    get_user_by_id,
)
from common.validators import slugify_string
from apps.notifications.email_service import (
    send_welcome_email,
    send_login_notification_email,
)
from apps.notifications.services import create_notification, notify_admins


def register_user(validated_data: dict) -> dict:
    email = validated_data["email"].strip().lower()
    password = validated_data["password"]
    full_name = validated_data["full_name"].strip()
    phone_number = validated_data.get("phone_number", "").strip() or None
    role_name = validated_data.get("role", "job_seeker")
    # Defense in depth: never allow privilege escalation through public registration.
    if role_name not in ("job_seeker", "employer"):
        raise ValidationError({"role": "Only job_seeker and employer accounts can be self-registered."})
    company_name = validated_data.get("company_name", "").strip()

    # 1. Check existing email
    existing = fetch_one("SELECT id FROM users WHERE email = %s", [email])
    if existing:
        raise ValidationError({"email": "A user with this email address already exists."})

    # 2. Get role ID
    role_row = fetch_one("SELECT id FROM roles WHERE name = %s", [role_name])
    if not role_row:
        raise ValidationError({"role": f"Role '{role_name}' is not recognized."})
    role_id = role_row["id"]

    # 3. Hash password
    password_hash = make_password(password)

    # 4. Atomic transaction to insert user and related records
    with atomic_transaction():
        user_sql = """
            INSERT INTO users (email, password_hash, full_name, phone_number, is_active)
            VALUES (%s, %s, %s, %s, TRUE)
        """
        user_id = execute_insert(user_sql, [email, password_hash, full_name, phone_number])

        # Link role
        execute_insert(
            "INSERT INTO user_roles (user_id, role_id) VALUES (%s, %s)",
            [user_id, role_id],
        )

        # Initialize profile based on role
        if role_name == "job_seeker":
            execute_insert(
                "INSERT INTO seeker_profiles (user_id, salary_currency) VALUES (%s, 'USD')",
                [user_id],
            )
        elif role_name == "employer":
            c_name = company_name or f"{full_name}'s Organization"
            base_slug = slugify_string(c_name)
            slug = f"{base_slug}-{user_id}"
            company_id = execute_insert(
                """
                INSERT INTO companies (name, slug, verification_status, created_by)
                VALUES (%s, %s, 'pending', %s)
                """,
                [c_name, slug, user_id],
            )
            execute_insert(
                "INSERT INTO employer_members (company_id, user_id, role) VALUES (%s, %s, 'owner')",
                [company_id, user_id],
            )

    # 5. Issue tokens
    access_token = generate_access_token(user_id, email, [role_name])
    refresh_token = generate_refresh_token(user_id)

    user_obj = get_user_by_id(user_id)

    # Dispatch welcome email notification asynchronously/safely
    try:
        send_welcome_email(user_email=email, user_name=full_name, role=role_name)
    except Exception as em_err:
        print(f"[Register] Welcome email notification skipped: {em_err}")

    create_notification(
        user_id=user_id,
        title="Welcome to JobPortal Cambodia",
        title_km="សូមស្វាគមន៍មកកាន់ JobPortal Cambodia",
        message=f"Your {role_name.replace('_', ' ')} account ({email}) has been created successfully.",
        message_km=f"គណនី ({email}) របស់អ្នកត្រូវបានបង្កើតដោយជោគជ័យ។",
        notification_type="welcome",
        data={"action": "register", "role": role_name, "email": email},
    )
    notify_admins(
        title="New User Registered",
        title_km="មានអ្នកប្រើប្រាស់ថ្មីបានចុះឈ្មោះ",
        message=f"{full_name} ({email}) registered as {role_name.replace('_', ' ')}.",
        message_km=f"{full_name} ({email}) បានចុះឈ្មោះជា {role_name.replace('_', ' ')}។",
        notification_type="user_activity",
        data={"action": "register", "actor_id": user_id, "email": email, "role": role_name},
        exclude_user_id=user_id,
    )

    return {
        "user": user_obj.to_dict(),
        "access": access_token,
        "refresh": refresh_token,
    }


def authenticate_user(validated_data: dict) -> dict:
    email = validated_data["email"].strip().lower()
    password = validated_data["password"]

    sql = """
        SELECT 
            u.id, 
            u.email, 
            u.password_hash, 
            u.full_name, 
            u.phone_number, 
            u.is_active,
            GROUP_CONCAT(r.name) AS role_names
        FROM users u
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        LEFT JOIN roles r ON r.id = ur.role_id
        WHERE u.email = %s
        GROUP BY u.id, u.email, u.password_hash, u.full_name, u.phone_number, u.is_active
    """
    row = fetch_one(sql, [email])
    if not row:
        raise AuthenticationFailed("Invalid email or password.")

    if not check_password(password, row["password_hash"]):
        raise AuthenticationFailed("Invalid email or password.")

    if not row["is_active"]:
        raise AuthenticationFailed("Account is inactive or suspended.")

    roles = [r.strip() for r in (row["role_names"] or "").split(",") if r.strip()]
    user_id = row["id"]

    access_token = generate_access_token(user_id, email, roles)
    refresh_token = generate_refresh_token(user_id)

    primary_role = "admin" if user_id == 1 or "admin" in roles else (roles[0] if roles else "job_seeker")

    # Dispatch login notification email
    try:
        send_login_notification_email(user_email=email, user_name=row["full_name"] or "User")
    except Exception as em_err:
        print(f"[Login] Login notification email skipped: {em_err}")

    actor_name = row["full_name"] or email
    create_notification(
        user_id=user_id,
        title="Account Sign-In Detected",
        title_km="មានការចូលគណនីថ្មី",
        message=f"You signed in to your account ({email}) at {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}.",
        message_km=f"អ្នកបានចូលគណនី ({email}) ដោយជោគជ័យ។",
        notification_type="login",
        data={"action": "login", "email": email},
    )
    notify_admins(
        title="User Signed In",
        title_km="អ្នកប្រើប្រាស់បានចូលប្រព័ន្ធ",
        message=f"{actor_name} ({email}) signed in as {primary_role.replace('_', ' ')}.",
        message_km=f"{actor_name} ({email}) បានចូលប្រព័ន្ធ។",
        notification_type="user_activity",
        data={"action": "login", "actor_id": user_id, "email": email, "role": primary_role},
        exclude_user_id=user_id,
    )

    user_obj = get_user_by_id(user_id)
    return {
        "user": user_obj.to_dict() if user_obj else {
            "id": user_id,
            "email": row["email"],
            "full_name": row["full_name"],
            "phone_number": row["phone_number"],
            "is_active": bool(row["is_active"]),
            "role": primary_role,
            "roles": roles if roles else [primary_role],
        },
        "access": access_token,
        "refresh": refresh_token,
    }


def refresh_token_service(refresh_token_str: str) -> dict:
    try:
        payload = jwt.decode(refresh_token_str, settings.JWT_SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed("Refresh token has expired.")
    except jwt.InvalidTokenError:
        raise AuthenticationFailed("Invalid refresh token.")

    if payload.get("token_type") != "refresh":
        raise AuthenticationFailed("Invalid token type.")

    # Check token record in database
    token_row = fetch_one(
        "SELECT id, user_id, revoked, expires_at FROM refresh_tokens WHERE token = %s",
        [refresh_token_str],
    )
    if not token_row or token_row["revoked"]:
        raise AuthenticationFailed("Refresh token is invalid or has been revoked.")

    user_id = token_row["user_id"]
    user = get_user_by_id(user_id)
    if not user or not user.is_active:
        raise AuthenticationFailed("User account is inactive or not found.")

    # Token rotation: revoke old token
    revoke_refresh_token(refresh_token_str)

    # Issue new pair
    new_access = generate_access_token(user.id, user.email, user.roles)
    new_refresh = generate_refresh_token(user.id)

    return {
        "access": new_access,
        "refresh": new_refresh,
    }


def logout_user(refresh_token_str: str) -> bool:
    token_user = fetch_one(
        """
        SELECT u.id, u.email, u.full_name
        FROM refresh_tokens rt
        INNER JOIN users u ON u.id = rt.user_id
        WHERE rt.token = %s
        LIMIT 1
        """,
        [refresh_token_str],
    )
    revoked = revoke_refresh_token(refresh_token_str)
    if token_user:
        actor_name = token_user.get("full_name") or token_user.get("email") or "User"
        email = token_user.get("email") or ""
        uid = token_user["id"]
        create_notification(
            user_id=uid,
            title="Signed Out Successfully",
            title_km="បានចាកចេញពីគណនីដោយជោគជ័យ",
            message=f"You signed out from your session ({email}).",
            message_km=f"អ្នកបានចាកចេញពីគណនី ({email}) ដោយជោគជ័យ។",
            notification_type="logout",
            data={"action": "logout", "email": email},
        )
        notify_admins(
            title="User Signed Out",
            title_km="អ្នកប្រើប្រាស់បានចាកចេញពីប្រព័ន្ធ",
            message=f"{actor_name} ({email}) signed out.",
            message_km=f"{actor_name} ({email}) បានចាកចេញពីប្រព័ន្ធ។",
            notification_type="user_activity",
            data={"action": "logout", "actor_id": uid, "email": email},
            exclude_user_id=uid,
        )
    return revoked


def oauth_login_or_register(provider: str, email: str, full_name: str, avatar_url: str = None, role: str = "job_seeker") -> dict:
    import secrets
    email = email.strip().lower()
    full_name = (full_name or email.split("@")[0]).strip()

    row = fetch_one(
        """
        SELECT 
            u.id, u.email, u.full_name, u.phone_number, u.is_active,
            GROUP_CONCAT(r.name) AS role_names
        FROM users u
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        LEFT JOIN roles r ON r.id = ur.role_id
        WHERE u.email = %s
        GROUP BY u.id, u.email, u.full_name, u.phone_number, u.is_active
        """,
        [email]
    )

    if row:
        if not row["is_active"]:
            raise AuthenticationFailed("Account is inactive or suspended.")
        user_id = row["id"]
        roles = [r.strip() for r in (row["role_names"] or "").split(",") if r.strip()]
        if not roles:
            roles = ["job_seeker"]
        # Dispatch sign-in notification email for returning OAuth user
        try:
            send_login_notification_email(user_email=email, user_name=row["full_name"] or "User")
        except Exception as em_err:
            print(f"[OAuth Login] Login notification email skipped: {em_err}")
        create_notification(
            user_id=user_id,
            title="Signed In via Google",
            title_km="បានចូលគណនីតាម Google",
            message=f"You signed in with {provider.capitalize()} ({email}).",
            message_km=f"អ្នកបានចូលគណនីតាម {provider.capitalize()} ({email}) ដោយជោគជ័យ។",
            notification_type="login",
            data={"action": "oauth_login", "provider": provider, "email": email},
        )
        notify_admins(
            title="User Signed In (OAuth)",
            title_km="អ្នកប្រើប្រាស់បានចូលប្រព័ន្ធ (OAuth)",
            message=f"{row['full_name'] or email} ({email}) signed in via {provider.capitalize()}.",
            message_km=f"{row['full_name'] or email} ({email}) បានចូលប្រព័ន្ធតាម {provider.capitalize()}។",
            notification_type="user_activity",
            data={"action": "oauth_login", "actor_id": user_id, "email": email},
            exclude_user_id=user_id,
        )
    else:
        target_role = role if role in ["job_seeker", "employer"] else "job_seeker"
        role_row = fetch_one("SELECT id FROM roles WHERE name = %s", [target_role])
        role_id = role_row["id"] if role_row else 1
        
        dummy_pass = secrets.token_urlsafe(32)
        password_hash = make_password(dummy_pass)

        with atomic_transaction():
            user_id = execute_insert(
                "INSERT INTO users (email, password_hash, full_name, is_active) VALUES (%s, %s, %s, TRUE)",
                [email, password_hash, full_name]
            )
            execute_insert(
                "INSERT INTO user_roles (user_id, role_id) VALUES (%s, %s)",
                [user_id, role_id]
            )
            if target_role == "job_seeker":
                execute_insert(
                    "INSERT INTO seeker_profiles (user_id, avatar_url, salary_currency) VALUES (%s, %s, 'USD')",
                    [user_id, avatar_url or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces"]
                )
            elif target_role == "employer":
                company_id = execute_insert(
                    "INSERT INTO companies (name, slug, verification_status, created_by) VALUES (%s, %s, 'pending', %s)",
                    [f"{full_name}'s Organization", f"company-{user_id}", user_id]
                )
                execute_insert(
                    "INSERT INTO employer_members (company_id, user_id, role) VALUES (%s, %s, 'owner')",
                    [company_id, user_id]
                )
        roles = [target_role]

        # Dispatch welcome email notification for new OAuth user
        try:
            send_welcome_email(user_email=email, user_name=full_name, role=target_role)
        except Exception as em_err:
            print(f"[OAuth Register] Welcome email notification skipped: {em_err}")

    access_token = generate_access_token(user_id, email, roles)
    refresh_token = generate_refresh_token(user_id)
    user_obj = get_user_by_id(user_id)

    return {
        "user": user_obj.to_dict(),
        "access": access_token,
        "refresh": refresh_token,
    }


