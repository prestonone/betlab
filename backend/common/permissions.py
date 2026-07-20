from rest_framework.permissions import BasePermission


class AllowAll(BasePermission):
    def has_permission(self, request, view):
        return True
