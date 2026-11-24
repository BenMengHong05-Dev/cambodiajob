"""
Role and Resource Permissions for Cambodia Job Search & Recruitment Platform.
"""

from rest_framework.permissions import BasePermission


class IsAuthenticatedCustom(BasePermission):
    """
    Allows access only to authenticated users.
    """
    def has_permission(self, request, view):
        return bool(request.user and getattr(request.user, "is_authenticated", False))


class IsJobSeeker(BasePermission):
    """
    Allows access to users with 'job_seeker', 'seeker:access' permission, or 'admin'.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            getattr(request.user, "is_authenticated", False) and
            (
                request.user.has_role("job_seeker")
                or request.user.has_role("admin")
                or request.user.has_permission("seeker:access")
            )
        )


class IsEmployer(BasePermission):
    """
    Allows access to users with 'employer', 'employer:access' permission, or 'admin'.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            getattr(request.user, "is_authenticated", False) and
            (
                request.user.has_role("employer")
                or request.user.has_role("admin")
                or request.user.has_permission("employer:access")
            )
        )


class IsAdmin(BasePermission):
    """
    Allows access to users with 'admin', 'super_admin', or 'admin:access' permission.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            getattr(request.user, "is_authenticated", False) and
            (
                request.user.id == 1
                or request.user.has_role("admin")
                or request.user.has_role("super_admin")
                or request.user.has_permission("admin:access")
            )
        )


class IsEmployerOrAdmin(BasePermission):
    """
    Allows access to either employer or admin.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            getattr(request.user, "is_authenticated", False) and
            (
                request.user.has_role("employer")
                or request.user.has_role("admin")
                or request.user.has_permission("employer:access")
                or request.user.has_permission("admin:access")
            )
        )


class HasCustomPermission(BasePermission):
    """
    Allows access based on granular permission strings (always allowing root Super Admin).
    Usage:
        class MyView(APIView):
            permission_classes = [HasCustomPermission.with_perm("jobs:create")]
    """
    required_permission = None

    @classmethod
    def with_perm(cls, permission_name: str):
        class _SpecificPermission(cls):
            required_permission = permission_name
        return _SpecificPermission

    def has_permission(self, request, view):
        if not (request.user and getattr(request.user, "is_authenticated", False)):
            return False
        if not self.required_permission:
            return True
        return hasattr(request.user, "has_permission") and request.user.has_permission(self.required_permission)


class HasAnyPermission(BasePermission):
    """
    Allows access if the user has at least one of the specified granular permissions.
    """
    allowed_permissions = ()

    @classmethod
    def with_perms(cls, *perms: str):
        class _AnySpecificPermission(cls):
            allowed_permissions = perms
        return _AnySpecificPermission

    def has_permission(self, request, view):
        if not (request.user and getattr(request.user, "is_authenticated", False)):
            return False
        if not self.allowed_permissions:
            return True
        return any(request.user.has_permission(p) for p in self.allowed_permissions)


class HasAnyRole(BasePermission):
    """
    Allows access if the user has at least one of the specified roles.
    Usage:
        class MyView(APIView):
            permission_classes = [HasAnyRole.with_roles("admin", "moderator")]
    """
    allowed_roles = ()

    @classmethod
    def with_roles(cls, *roles: str):
        class _SpecificRoles(cls):
            allowed_roles = roles
        return _SpecificRoles

    def has_permission(self, request, view):
        if not (request.user and getattr(request.user, "is_authenticated", False)):
            return False
        return any(request.user.has_role(r) for r in self.allowed_roles)

