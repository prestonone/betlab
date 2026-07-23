from django import template

from .. import services
from ..permissions import can_view_business_overview, can_view_match_operations

register = template.Library()

# Groups the flat per-app admin nav into named operational sections. Apps not
# listed here (or with no registered models the current user can see) simply
# don't appear — nothing is hidden that wasn't already permission-filtered by
# Django's own AdminSite.index().
NAV_GROUPS = [
    ("Match & Prediction Operations", ["predictions"]),
    ("Subscribers & Accounts", ["accounts", "subscriptions"]),
    ("Payments & Revenue", ["payments"]),
    ("Legal & Compliance", ["legal"]),
    ("Authentication & Permissions", ["auth"]),
]


@register.filter
def group_apps(app_list):
    by_label = {app["app_label"]: app for app in app_list}
    grouped = []
    used_labels = set()
    for group_name, app_labels in NAV_GROUPS:
        models = []
        for label in app_labels:
            app = by_label.get(label)
            if app:
                models.extend(app["models"])
                used_labels.add(label)
        if models:
            grouped.append({"name": group_name, "models": models})

    leftover_models = []
    for app in app_list:
        if app["app_label"] not in used_labels:
            leftover_models.extend(app["models"])
    if leftover_models:
        grouped.append({"name": "Other", "models": leftover_models})

    return grouped


@register.inclusion_tag("admin/dashboard/match_operations.html", takes_context=True)
def match_operations_dashboard(context):
    request = context["request"]
    if not can_view_match_operations(request.user):
        return {"visible": False}
    return {
        "visible": True,
        "quick_actions": services.get_quick_actions(),
        "cards": services.get_match_operations_cards(),
        "todays_games": services.get_todays_games(),
    }


@register.inclusion_tag("admin/dashboard/business_overview.html", takes_context=True)
def business_overview_dashboard(context):
    request = context["request"]
    if not can_view_business_overview(request.user):
        return {"visible": False}
    return {
        "visible": True,
        "metrics": services.get_business_metrics(),
        "alerts": services.get_alerts(),
        "db_health": services.check_database_health(),
        "deployment": services.get_deployment_info(),
        "recent_activity": services.get_recent_admin_activity(),
    }
