OPERATIONS_MANAGERS_GROUP = "Operations Managers"


def can_view_match_operations(user) -> bool:
    """Any staff member can see the daily game-management workspace."""
    return bool(user and user.is_authenticated and user.is_staff)


def can_view_business_overview(user) -> bool:
    """Revenue, subscriber, payment and system-health data is restricted to
    superusers and members of the Operations Managers group — not shown to
    ordinary content staff."""
    if not user or not user.is_authenticated or not user.is_staff:
        return False
    if user.is_superuser:
        return True
    return user.groups.filter(name=OPERATIONS_MANAGERS_GROUP).exists()
