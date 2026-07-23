from decimal import Decimal

from django.contrib import admin
from django.db import transaction
from django.db.models import Count, F, Q
from django.utils import timezone
from django.utils.html import format_html

from .models import (
    Prediction,
    PredictionCategory,
    PredictionSelection,
)


class AwaitingResultFilter(admin.SimpleListFilter):
    """Locked predictions whose kick-off has passed but no selection has a
    result entered yet — step 3 of the daily workflow. Note: once every
    selection on a locked prediction has a result, Prediction.settle() fires
    automatically as part of PredictionSelection.settle()'s recalculation —
    there is no separate manual "settle" action in this codebase, so a
    locked-with-a-complete-result state cannot exist at rest."""

    title = "awaiting result"
    parameter_name = "awaiting_result"

    def lookups(self, request, model_admin):
        return (("yes", "Awaiting result"),)

    def queryset(self, request, queryset):
        if self.value() == "yes":
            return queryset.filter(
                status=Prediction.Status.LOCKED,
                result_status=Prediction.ResultStatus.PENDING,
            )
        return queryset


class AwaitingSettlementFilter(admin.SimpleListFilter):
    """Locked, multi-selection predictions where some (not all) selections
    have a result entered — settlement auto-completes as soon as the last
    one is entered, so this surfaces packages mid-way through result entry
    rather than a distinct manual "settle" step."""

    title = "awaiting settlement"
    parameter_name = "awaiting_settlement"

    def lookups(self, request, model_admin):
        return (("yes", "Awaiting settlement"),)

    def queryset(self, request, queryset):
        if self.value() == "yes":
            return (
                queryset.filter(status=Prediction.Status.LOCKED)
                .annotate(
                    total_selections=Count("selections"),
                    pending_selections=Count(
                        "selections",
                        filter=Q(selections__result_status=PredictionSelection.ResultStatus.PENDING),
                    ),
                )
                .filter(pending_selections__gt=0, pending_selections__lt=F("total_selections"))
            )
        return queryset


class MissingRequiredInfoFilter(admin.SimpleListFilter):
    """Published or scheduled predictions with no selections attached, or
    no analysis text — genuinely incomplete before members see them."""

    title = "missing required information"
    parameter_name = "missing_info"

    def lookups(self, request, model_admin):
        return (("yes", "Missing required information"),)

    def queryset(self, request, queryset):
        if self.value() == "yes":
            return queryset.filter(
                status__in=[Prediction.Status.SCHEDULED, Prediction.Status.PUBLISHED],
            ).filter(Q(selections__isnull=True) | Q(analysis="")).distinct()
        return queryset


@admin.register(PredictionCategory)
class PredictionCategoryAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "slug",
        "color",
        "is_active",
        "display_order",
        "prediction_count",
    )
    list_editable = ("color", "is_active", "display_order")
    list_filter = ("is_active", "color")
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("display_order", "name")

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.annotate(
            _prediction_count=Count("predictions")
        )

    @admin.display(
        description="Predictions",
        ordering="_prediction_count",
    )
    def prediction_count(self, obj):
        return obj._prediction_count


class PredictionSelectionInline(admin.TabularInline):
    model = PredictionSelection
    extra = 1
    min_num = 1
    validate_min = True
    show_change_link = True

    fields = (
        "selection_order",
        "league",
        "home_team",
        "away_team",
        "market",
        "odds",
        "match_time",
        "result_status",
        "result_note",
        "settled_at",
    )

    ordering = ("selection_order", "match_time")

    fixture_fields = (
        "selection_order",
        "league",
        "home_team",
        "away_team",
        "market",
        "odds",
        "match_time",
    )

    result_fields = (
        "result_status",
        "result_note",
        "settled_at",
    )

    immutable_statuses = {
        Prediction.Status.SETTLED,
        Prediction.Status.CANCELLED,
    }

    def get_readonly_fields(self, request, obj=None):
        readonly_fields = list(
            super().get_readonly_fields(request, obj)
        )

        if obj is None:
            readonly_fields.extend(self.result_fields)

        elif obj.status == Prediction.Status.LOCKED:
            readonly_fields.extend(
                (*self.fixture_fields, "settled_at")
            )

        elif obj.status in self.immutable_statuses:
            readonly_fields.extend(self.fields)

        else:
            readonly_fields.extend(self.result_fields)

        return tuple(dict.fromkeys(readonly_fields))

    def get_extra(self, request, obj=None, **kwargs):
        if (
            obj is not None
            and obj.status
            in {
                Prediction.Status.LOCKED,
                Prediction.Status.SETTLED,
                Prediction.Status.CANCELLED,
            }
        ):
            return 0

        return super().get_extra(request, obj, **kwargs)

    def has_add_permission(self, request, obj=None):
        if (
            obj is not None
            and obj.status
            in {
                Prediction.Status.LOCKED,
                Prediction.Status.SETTLED,
                Prediction.Status.CANCELLED,
            }
        ):
            return False

        return super().has_add_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        if (
            obj is not None
            and obj.status
            in {
                Prediction.Status.LOCKED,
                Prediction.Status.SETTLED,
                Prediction.Status.CANCELLED,
            }
        ):
            return False

        return super().has_delete_permission(request, obj)


@admin.register(Prediction)
class PredictionAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "category",
        "status_badge",
        "access_badge",
        "selection_count",
        "combined_odds",
        "result_badge",
        "scheduled_for",
        "published_at",
        "locked_at",
        "settled_at",
    )

    list_filter = (
        "status",
        "category",
        "access_level",
        "result_status",
        "is_published",
        AwaitingResultFilter,
        AwaitingSettlementFilter,
        MissingRequiredInfoFilter,
        "scheduled_for",
        "published_at",
        "locked_at",
        "settled_at",
        "created_at",
    )

    search_fields = (
        "title",
        "analysis",
        "result_note",
        "selections__league",
        "selections__home_team",
        "selections__away_team",
        "selections__market",
    )

    readonly_fields = (
        "status",
        "result_status",
        "result_note",
        "created_at",
        "updated_at",
        "published_at",
        "published_by",
        "locked_at",
        "settled_at",
    )

    fieldsets = (
        (
            "Prediction package",
            {
                "fields": (
                    "title",
                    "category",
                    "access_level",
                    "status",
                )
            },
        ),
        (
            "Publishing",
            {
                "fields": (
                    "is_published",
                    "scheduled_for",
                    "published_at",
                    "published_by",
                    "locked_at",
                    "created_by",
                )
            },
        ),
        (
            "Analysis",
            {
                "fields": ("analysis",),
            },
        ),
        (
            "Calculated result",
            {
                "description": (
                    "The package result is calculated automatically "
                    "from its selection results."
                ),
                "fields": (
                    "result_status",
                    "result_note",
                    "settled_at",
                ),
            },
        ),
        (
            "System information",
            {
                "classes": ("collapse",),
                "fields": (
                    "created_at",
                    "updated_at",
                ),
            },
        ),
    )

    ordering = ("-created_at",)
    autocomplete_fields = ("category", "created_by")
    list_select_related = (
        "category",
        "created_by",
        "published_by",
    )
    list_per_page = 25
    date_hierarchy = "created_at"
    save_on_top = True
    inlines = [PredictionSelectionInline]

    actions = (
        "publish_predictions",
        "lock_predictions",
        "cancel_predictions",
    )

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return (
            queryset
            .select_related(
                "category",
                "created_by",
                "published_by",
            )
            .prefetch_related("selections")
            .distinct()
        )

    def save_model(self, request, obj, form, change):
        if not obj.created_by_id:
            obj.created_by = request.user

        now = timezone.now()

        if obj.scheduled_for and obj.scheduled_for > now:
            obj.is_published = False
            obj.published_at = None
            obj.published_by = None

        elif obj.is_published:
            if obj.published_at is None:
                obj.published_at = now

            if obj.published_by is None:
                obj.published_by = request.user

            obj.scheduled_for = None

        else:
            obj.published_at = None
            obj.published_by = None

        super().save_model(request, obj, form, change)

    def save_formset(self, request, form, formset, change):
        if formset.model is not PredictionSelection:
            return super().save_formset(
                request,
                form,
                formset,
                change,
            )

        instances = formset.save(commit=False)

        for deleted_object in formset.deleted_objects:
            deleted_object.delete()

        for instance in instances:
            if not instance.pk:
                instance.save()
                continue

            previous = PredictionSelection.objects.get(
                pk=instance.pk
            )

            result_changed = (
                previous.result_status
                != instance.result_status
                or previous.result_note
                != instance.result_note
            )

            if (
                form.instance.status == Prediction.Status.LOCKED
                and result_changed
            ):
                desired_result = instance.result_status
                desired_note = instance.result_note

                if (
                    desired_result
                    == PredictionSelection.ResultStatus.PENDING
                ):
                    previous.reset_result()
                else:
                    previous.settle(
                        desired_result,
                        note=desired_note,
                    )
            else:
                instance.save()

        formset.save_m2m()

    @admin.display(description="Selections")
    def selection_count(self, obj):
        return len(obj.selections.all())

    @admin.display(description="Total odds")
    def combined_odds(self, obj):
        selections = obj.selections.all()

        if not selections:
            return "—"

        total = Decimal("1.00")

        for selection in selections:
            total *= selection.odds

        return f"{total:.2f}"

    @admin.display(description="Lifecycle", ordering="status")
    def status_badge(self, obj):
        styles = {
            Prediction.Status.DRAFT: ("#6b7280", "DRAFT"),
            Prediction.Status.SCHEDULED: ("#2563eb", "SCHEDULED"),
            Prediction.Status.PUBLISHED: ("#047857", "PUBLISHED"),
            Prediction.Status.LOCKED: ("#b45309", "LOCKED"),
            Prediction.Status.SETTLED: ("#7c3aed", "SETTLED"),
            Prediction.Status.CANCELLED: ("#b91c1c", "CANCELLED"),
        }

        color, label = styles.get(
            obj.status,
            ("#6b7280", obj.status.upper()),
        )

        return format_html(
            '<span style="color:{};font-weight:700;">{}</span>',
            color,
            label,
        )

    @admin.display(description="Access", ordering="access_level")
    def access_badge(self, obj):
        if obj.access_level == Prediction.AccessLevel.FREE:
            return format_html(
                '<span style="color:#047857;font-weight:700;">'
                "{}</span>",
                "FREE",
            )

        return format_html(
            '<span style="color:#b78b00;font-weight:700;">'
            "{}</span>",
            "LAB",
        )

    @admin.display(description="Result", ordering="result_status")
    def result_badge(self, obj):
        styles = {
            Prediction.ResultStatus.PENDING: (
                "#6b7280",
                "PENDING",
            ),
            Prediction.ResultStatus.WON: (
                "#047857",
                "WON",
            ),
            Prediction.ResultStatus.LOST: (
                "#b91c1c",
                "LOST",
            ),
            Prediction.ResultStatus.VOID: (
                "#7c3aed",
                "VOID",
            ),
        }

        color, label = styles[obj.result_status]

        return format_html(
            '<span style="color:{};font-weight:700;">{}</span>',
            color,
            label,
        )

    def _run_lifecycle_action(
        self,
        request,
        queryset,
        method_name,
        success_label,
    ):
        successful = 0
        failures = []

        for prediction in queryset:
            try:
                with transaction.atomic():
                    locked_prediction = (
                        Prediction.objects
                        .select_for_update()
                        .get(pk=prediction.pk)
                    )

                    method = getattr(
                        locked_prediction,
                        method_name,
                    )

                    if method_name == "publish":
                        try:
                            method(user=request.user)
                        except TypeError:
                            method()
                    else:
                        method()

                successful += 1

            except (ValueError, TypeError) as exc:
                failures.append(
                    f"{prediction.title}: {exc}"
                )

        if successful:
            self.message_user(
                request,
                (
                    f"{successful} prediction package(s) "
                    f"{success_label}."
                ),
            )

        if failures:
            self.message_user(
                request,
                "Skipped: " + " | ".join(failures),
                level="warning",
            )

    @admin.action(
        description="Publish selected predictions now"
    )
    def publish_predictions(self, request, queryset):
        self._run_lifecycle_action(
            request,
            queryset,
            "publish",
            "published",
        )

    @admin.action(
        description="Lock selected predictions"
    )
    def lock_predictions(self, request, queryset):
        self._run_lifecycle_action(
            request,
            queryset,
            "lock",
            "locked",
        )

    @admin.action(
        description="Cancel selected predictions"
    )
    def cancel_predictions(self, request, queryset):
        self._run_lifecycle_action(
            request,
            queryset,
            "cancel",
            "cancelled",
        )

    def get_readonly_fields(self, request, obj=None):
        readonly_fields = list(
            super().get_readonly_fields(request, obj)
        )

        if (
            obj is not None
            and obj.status
            in {
                Prediction.Status.LOCKED,
                Prediction.Status.SETTLED,
                Prediction.Status.CANCELLED,
            }
        ):
            readonly_fields.extend(
                field.name
                for field in obj._meta.concrete_fields
            )

        return tuple(dict.fromkeys(readonly_fields))

    def has_delete_permission(self, request, obj=None):
        if (
            obj is not None
            and obj.status
            in {
                Prediction.Status.LOCKED,
                Prediction.Status.SETTLED,
                Prediction.Status.CANCELLED,
            }
        ):
            return False

        return super().has_delete_permission(request, obj)


@admin.register(PredictionSelection)
class PredictionSelectionAdmin(admin.ModelAdmin):
    list_display = (
        "prediction",
        "selection_order",
        "fixture",
        "league",
        "market",
        "odds",
        "match_time",
        "result_badge",
        "settled_at",
    )

    list_filter = (
        "result_status",
        "prediction__status",
        "league",
        "match_time",
        "settled_at",
    )

    search_fields = (
        "prediction__title",
        "league",
        "home_team",
        "away_team",
        "market",
        "result_note",
    )

    ordering = (
        "-match_time",
        "prediction",
        "selection_order",
    )

    list_select_related = (
        "prediction",
        "prediction__category",
    )

    readonly_fields = ("settled_at",)

    actions = (
        "mark_as_won",
        "mark_as_lost",
        "mark_as_void",
        "reset_results",
    )

    @admin.display(description="Fixture")
    def fixture(self, obj):
        return f"{obj.home_team} vs {obj.away_team}"

    @admin.display(
        description="Result",
        ordering="result_status",
    )
    def result_badge(self, obj):
        styles = {
            PredictionSelection.ResultStatus.PENDING: (
                "#6b7280",
                "PENDING",
            ),
            PredictionSelection.ResultStatus.WON: (
                "#047857",
                "WON",
            ),
            PredictionSelection.ResultStatus.LOST: (
                "#b91c1c",
                "LOST",
            ),
            PredictionSelection.ResultStatus.VOID: (
                "#7c3aed",
                "VOID",
            ),
        }

        color, label = styles[obj.result_status]

        return format_html(
            '<span style="color:{};font-weight:700;">{}</span>',
            color,
            label,
        )

    def _settle_selections(
        self,
        request,
        queryset,
        result_status,
        label,
    ):
        successful = 0
        failures = []

        ordered_queryset = queryset.order_by(
            "prediction_id",
            "selection_order",
        )

        for selection in ordered_queryset:
            try:
                with transaction.atomic():
                    locked_selection = (
                        PredictionSelection.objects
                        .select_for_update()
                        .select_related("prediction")
                        .get(pk=selection.pk)
                    )

                    locked_selection.settle(result_status)

                successful += 1

            except ValueError as exc:
                failures.append(
                    f"{selection}: {exc}"
                )

        if successful:
            self.message_user(
                request,
                (
                    f"{successful} selection(s) "
                    f"marked as {label}."
                ),
            )

        if failures:
            self.message_user(
                request,
                "Skipped: " + " | ".join(failures),
                level="warning",
            )

    @admin.action(description="Mark selected selections as won")
    def mark_as_won(self, request, queryset):
        self._settle_selections(
            request,
            queryset,
            PredictionSelection.ResultStatus.WON,
            "won",
        )

    @admin.action(description="Mark selected selections as lost")
    def mark_as_lost(self, request, queryset):
        self._settle_selections(
            request,
            queryset,
            PredictionSelection.ResultStatus.LOST,
            "lost",
        )

    @admin.action(description="Mark selected selections as void")
    def mark_as_void(self, request, queryset):
        self._settle_selections(
            request,
            queryset,
            PredictionSelection.ResultStatus.VOID,
            "void",
        )

    @admin.action(description="Reset selected results to pending")
    def reset_results(self, request, queryset):
        successful = 0
        failures = []

        for selection in queryset:
            try:
                with transaction.atomic():
                    locked_selection = (
                        PredictionSelection.objects
                        .select_for_update()
                        .select_related("prediction")
                        .get(pk=selection.pk)
                    )

                    locked_selection.reset_result()

                successful += 1

            except ValueError as exc:
                failures.append(
                    f"{selection}: {exc}"
                )

        if successful:
            self.message_user(
                request,
                (
                    f"{successful} selection result(s) "
                    "reset to pending."
                ),
            )

        if failures:
            self.message_user(
                request,
                "Skipped: " + " | ".join(failures),
                level="warning",
            )

    def get_readonly_fields(self, request, obj=None):
        readonly_fields = list(
            super().get_readonly_fields(request, obj)
        )

        if obj is None:
            readonly_fields.extend(
                (
                    "result_status",
                    "result_note",
                    "settled_at",
                )
            )

        elif obj.prediction.status == Prediction.Status.LOCKED:
            readonly_fields.extend(
                (
                    "prediction",
                    "selection_order",
                    "league",
                    "home_team",
                    "away_team",
                    "market",
                    "odds",
                    "match_time",
                    "settled_at",
                )
            )

        elif obj.prediction.status in {
            Prediction.Status.SETTLED,
            Prediction.Status.CANCELLED,
        }:
            readonly_fields.extend(
                field.name
                for field in obj._meta.concrete_fields
            )

        else:
            readonly_fields.extend(
                (
                    "result_status",
                    "result_note",
                    "settled_at",
                )
            )

        return tuple(dict.fromkeys(readonly_fields))

    def save_model(self, request, obj, form, change):
        if not change:
            return super().save_model(
                request,
                obj,
                form,
                change,
            )

        previous = PredictionSelection.objects.get(pk=obj.pk)

        result_changed = (
            previous.result_status != obj.result_status
            or previous.result_note != obj.result_note
        )

        if (
            previous.prediction.status
            == Prediction.Status.LOCKED
            and result_changed
        ):
            if (
                obj.result_status
                == PredictionSelection.ResultStatus.PENDING
            ):
                previous.reset_result()
            else:
                previous.settle(
                    obj.result_status,
                    note=obj.result_note,
                )

            return

        super().save_model(request, obj, form, change)

    def has_delete_permission(self, request, obj=None):
        if (
            obj is not None
            and obj.prediction.status
            in {
                Prediction.Status.LOCKED,
                Prediction.Status.SETTLED,
                Prediction.Status.CANCELLED,
            }
        ):
            return False

        return super().has_delete_permission(request, obj)
