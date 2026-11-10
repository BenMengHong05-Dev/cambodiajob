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
    Allows access only to users with the 'job_seeker' role.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            getattr(request.user, "is_authenticated", False) and 
            request.user.has_role("job_seeker")
        )


class IsEmployer(BasePermission):
    """
    Allows access only to users with the 'employer' role.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            getattr(request.user, "is_authenticated", False) and 
            request.user.has_role("employer")
        )


class IsAdmin(BasePermission):
    """
    Allows access only to users with the 'admin' role.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            getattr(request.user, "is_authenticated", False) and 
            request.user.has_role("admin")
        )


class IsEmployerOrAdmin(BasePermission):
    """
    Allows access to either employer or admin.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            getattr(request.user, "is_authenticated", False) and 
            (request.user.has_role("employer") or request.user.has_role("admin"))
        )

