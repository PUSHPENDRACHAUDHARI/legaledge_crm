from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from django.http import HttpResponseRedirect
from django.utils import timezone
from datetime import date, timedelta
from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
import traceback
import logging

logger = logging.getLogger(__name__)

from .models import (
    Contact,
    Lead,
    Deal,
    Task,
    Company,
    Ticket,
    CallLog,
    Meeting,
    Activity,
    Note,
    MarketingCampaign,
    MarketingAd,
    MarketingForm,
    MarketingEvent,
    MarketingSocialPost,
    MarketingBuyerIntent,
    MarketingLeadScoring,
    DesignManagerFile,
    EmailMessageRecord,
    UserEmailAccount,
)
from .serializers import (
    ContactSerializer,
    LeadSerializer,
    DealSerializer,
    TaskSerializer,
    CompanySerializer,
    TicketSerializer,
    CallLogSerializer,
    MeetingSerializer,
    ActivitySerializer,
    NoteSerializer,
    MarketingCampaignSerializer,
    MarketingAdSerializer,
    MarketingFormSerializer,
    MarketingEventSerializer,
    MarketingSocialPostSerializer,
    MarketingBuyerIntentSerializer,
    MarketingLeadScoringSerializer,
    DesignManagerFileSerializer,
    EmailMessageRecordSerializer,
    UserEmailAccountSerializer,
)
from .email_oauth import (
    EmailOAuthError,
    complete_oauth_connection,
    generate_connect_url,
    oauth_redirect_target,
    send_email as send_email_via_oauth,
    sync_account_inbox,
    sync_all_active_accounts,
)
from .email_smtp import EmailSMTPError, send_email_via_smtp
from .permissions import IsAdmin


CRM_PERMISSION_CLASSES = [AllowAny] if getattr(settings, 'CRM_ALLOW_ANY', False) else [IsAuthenticated]
ACTIVITY_RETENTION_HOURS = 12

def _scope_queryset(qs, user):
    """Filter queryset based on auth state and role."""
    try:
        if not getattr(user, 'is_authenticated', False):
            return qs if getattr(settings, 'CRM_ALLOW_ANY', False) else qs.none()

        role = getattr(user, 'role', None)
        model_fields = {f.name for f in qs.model._meta.get_fields()}

        if role == 'admin':
            return qs
        if role == 'manager':
            if 'team_id' in model_fields:
                return qs.filter(team_id=user.team_id)
            return qs
        if role == 'user':
            if 'assigned_to' in model_fields:
                return qs.filter(assigned_to=user)
            if 'user' in model_fields:
                return qs.filter(user=user)
            if 'team_id' in model_fields:
                return qs.filter(team_id=user.team_id)
            if 'owner' in model_fields and getattr(user, 'name', None):
                return qs.filter(owner=user.name)
        return qs.none()
    except Exception:
        print(f"[CRM-ERROR] _scope_queryset failed for model {qs.model.__name__}:")
        traceback.print_exc()
        raise


def _prune_expired_activities():
    cutoff = timezone.now() - timedelta(hours=ACTIVITY_RETENTION_HOURS)
    Activity.objects.filter(at__lt=cutoff).delete()
    return cutoff


def _scoped_activity_queryset(user):
    try:
        cutoff = _prune_expired_activities()
        return _scope_queryset(Activity.objects.filter(at__gte=cutoff), user)
    except Exception:
        print("[CRM-ERROR] _scoped_activity_queryset failed:")
        traceback.print_exc()
        raise


def _session_store(request):
    direct_session = getattr(request, 'session', None)
    if direct_session is not None:
        return direct_session
    raw_request = getattr(request, '_request', None)
    return getattr(raw_request, 'session', None)


def _read_notification_ids(request):
    session = _session_store(request)
    if session is None:
        return set()
    return {int(value) for value in session.get('read_notification_ids', []) if str(value).isdigit()}


def _write_notification_ids(request, ids):
    session = _session_store(request)
    if session is None:
        return
    session['read_notification_ids'] = list(ids)
    session.modified = True


def _activity_icon(entity):
    return {
        'lead': 'fa-user',
        'deal': 'fa-handshake',
        'task': 'fa-clock',
        'ticket': 'fa-ticket-alt',
        'contact': 'fa-address-book',
        'meeting': 'fa-calendar',
    }.get(str(entity or '').lower(), 'fa-bell')


def _activity_path(entity):
    return {
        'lead': '/leads',
        'deal': '/deals',
        'task': '/tasks',
        'ticket': '/tickets',
        'contact': '/contacts',
        'meeting': '/meetings',
    }.get(str(entity or '').lower(), '/inbox')


class AdminDashboardView(APIView):
    """GET /api/dashboard/admin/ - full-platform KPIs for admin."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from accounts.models import CustomUser

        total_contacts = Contact.objects.count()
        total_leads = Lead.objects.count()
        total_deals = Deal.objects.count()
        open_deals = Deal.objects.exclude(stage__in=['Closed Won', 'Closed Lost']).count()
        won_deals = Deal.objects.filter(stage='Closed Won')
        revenue_won = float(sum(d.value for d in won_deals))
        pending_tasks = Task.objects.exclude(status='Completed').count()
        open_tickets = Ticket.objects.filter(status='Open').count()
        total_companies = Company.objects.count()
        total_users = CustomUser.objects.filter(is_active=True).count()

        pipeline_stages = ['New Lead', 'Contacted', 'Proposal', 'Negotiation', 'Closed Won']
        pipeline = [
            {
                'stage': stage,
                'count': Deal.objects.filter(stage=stage).count(),
                'value': float(sum(d.value for d in Deal.objects.filter(stage=stage))),
            }
            for stage in pipeline_stages
        ]

        recent_leads = LeadSerializer(Lead.objects.order_by('-id')[:5], many=True).data
        upcoming_tasks = TaskSerializer(
            Task.objects.exclude(status='Completed').order_by('due_date')[:5], many=True
        ).data
        recent_activity = ActivitySerializer(_scoped_activity_queryset(request.user).order_by('-at')[:10], many=True).data
        monthly_revenue = [42, 58, 75, 90, 63, 88]

        lead_status_counts = {}
        for status_val, _ in Lead.STATUS_CHOICES:
            lead_status_counts[status_val] = Lead.objects.filter(status=status_val).count()

        return Response(
            {
                'kpi': {
                    'totalContacts': total_contacts,
                    'totalLeads': total_leads,
                    'totalDeals': total_deals,
                    'openDeals': open_deals,
                    'revenueWon': revenue_won,
                    'pendingTasks': pending_tasks,
                    'openTickets': open_tickets,
                    'totalCompanies': total_companies,
                    'totalUsers': total_users,
                    'winRate': round((won_deals.count() / total_deals * 100) if total_deals else 0),
                },
                'pipeline': pipeline,
                'recentLeads': recent_leads,
                'upcomingTasks': upcoming_tasks,
                'recentActivity': recent_activity,
                'monthlyRevenue': monthly_revenue,
                'leadStatusCounts': lead_status_counts,
            }
        )


class ManagerDashboardView(APIView):
    """GET /api/dashboard/manager/ - team-scoped KPIs for manager."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from accounts.models import CustomUser

        user = request.user
        if user.role not in ('manager', 'admin'):
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        team_id = user.team_id

        team_members = CustomUser.objects.filter(team_id=team_id, is_active=True)
        team_leads = Lead.objects.filter(team_id=team_id)
        team_tasks = Task.objects.filter(team_id=team_id)
        team_deals = Deal.objects.filter(team_id=team_id)

        team_lead_count = team_leads.count()
        open_deals_count = team_deals.exclude(stage__in=['Closed Won', 'Closed Lost']).count()
        open_deals_value = float(
            sum(d.value for d in team_deals.exclude(stage__in=['Closed Won', 'Closed Lost']))
        )
        overdue_tasks = team_tasks.filter(priority='High').exclude(status='Completed').count()
        won_leads = team_leads.filter(status='Won').count()
        conversion = round((won_leads / team_lead_count * 100) if team_lead_count else 0)

        members_data = []
        for m in team_members:
            member_leads = team_leads.filter(assigned_to=m).count()
            member_tasks = team_tasks.filter(assigned_to=m).exclude(status='Completed').count()
            member_deals = team_deals.filter(assigned_to=m).count()
            members_data.append(
                {
                    'id': m.id,
                    'name': m.name,
                    'role': m.role,
                    'avatar': m.avatar,
                    'leads': member_leads,
                    'tasksDue': member_tasks,
                    'deals': member_deals,
                    'status': 'Active',
                    'teamId': m.team_id,
                }
            )

        recent_leads = LeadSerializer(team_leads.order_by('-id')[:5], many=True).data
        today_tasks = TaskSerializer(
            team_tasks.exclude(status='Completed').order_by('due_date')[:5], many=True
        ).data

        deal_stages_map = {
            'Inquiry': 'New Lead',
            'Consultation': 'Contacted',
            'Retainer': 'Proposal',
            'Active': 'Negotiation',
            'Closed Won': 'Closed Won',
        }
        pipeline = []
        for label, db_stage in deal_stages_map.items():
            stage_deals = team_deals.filter(stage=db_stage)
            pipeline.append(
                {
                    'stage': label,
                    'count': stage_deals.count(),
                    'value': float(sum(d.value for d in stage_deals)),
                }
            )

        return Response(
            {
                'kpi': {
                    'teamLeadCount': team_lead_count,
                    'openDealsCount': open_deals_count,
                    'openDealsValue': open_deals_value,
                    'overdueCount': overdue_tasks,
                    'conversionRate': conversion,
                },
                'teamMembers': members_data,
                'recentLeads': recent_leads,
                'todayTasks': today_tasks,
                'pipeline': pipeline,
            }
        )


class UserDashboardView(APIView):
    """GET /api/dashboard/user/ - personal KPIs for regular user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != 'user':
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        my_leads = Lead.objects.filter(assigned_to=user)
        my_tasks = Task.objects.filter(assigned_to=user)
        my_activity = _scoped_activity_queryset(user).order_by('-at')[:10]

        due_today = my_tasks.exclude(status='Completed').count()
        overdue = my_tasks.filter(priority='High').exclude(status='Completed').count()
        open_deals_value = float(
            sum(40000 for l in my_leads.filter(status__in=['New', 'Contacted', 'Qualified']))
        )

        recent_leads = LeadSerializer(my_leads.order_by('-id')[:5], many=True).data
        today_tasks = TaskSerializer(
            my_tasks.exclude(status='Completed').order_by('due_date')[:5], many=True
        ).data
        activity = ActivitySerializer(my_activity, many=True).data

        return Response(
            {
                'kpi': {
                    'myLeads': my_leads.count(),
                    'dueToday': due_today,
                    'overdue': overdue,
                    'openDealsValue': open_deals_value,
                },
                'myLeads': recent_leads,
                'myTasks': today_tasks,
                'activity': activity,
            }
        )


class DashboardStatsView(APIView):
    permission_classes = CRM_PERMISSION_CLASSES

    def get(self, request):
        user = request.user
        leads_qs = _scope_queryset(Lead.objects.all(), user)
        deals_qs = _scope_queryset(Deal.objects.all(), user)
        contacts_qs = _scope_queryset(Contact.objects.all(), user)
        tasks_qs = _scope_queryset(Task.objects.all(), user)
        tickets_qs = _scope_queryset(Ticket.objects.all(), user)
        companies_qs = _scope_queryset(Company.objects.all(), user)

        revenue = deals_qs.filter(stage='Closed Won').aggregate(total=Sum('value')).get('total') or 0

        return Response(
            {
                'total_leads': leads_qs.count(),
                'total_deals': deals_qs.count(),
                'total_contacts': contacts_qs.count(),
                'total_companies': companies_qs.count(),
                'revenue': float(revenue),
                'tasks_today': tasks_qs.filter(due_date=date.today()).exclude(status='Completed').count(),
                'open_tickets': tickets_qs.filter(status='Open').count(),
            },
            status=status.HTTP_200_OK,
        )


class RevenueChartView(APIView):
    permission_classes = CRM_PERMISSION_CLASSES

    def get(self, request):
        user = request.user
        rows = (
            _scope_queryset(Deal.objects.all(), user)
            .filter(stage='Closed Won')
            .annotate(month=TruncMonth('created'))
            .values('month')
            .annotate(total=Sum('value'))
            .order_by('month')
        )
        data = [
            {
                'label': r['month'].strftime('%b %Y') if r.get('month') else '',
                'value': float(r.get('total') or 0),
            }
            for r in rows
        ]
        return Response(data, status=status.HTTP_200_OK)


class LeadsChartView(APIView):
    permission_classes = CRM_PERMISSION_CLASSES

    def get(self, request):
        user = request.user
        leads_qs = _scope_queryset(Lead.objects.all(), user)
        data = []
        for key, _label in Lead.STATUS_CHOICES:
            data.append({'label': key, 'count': leads_qs.filter(status=key).count()})
        return Response(data, status=status.HTTP_200_OK)


class PipelineView(APIView):
    permission_classes = CRM_PERMISSION_CLASSES

    def get(self, request):
        user = request.user
        deals_qs = _scope_queryset(Deal.objects.all(), user)
        rows = []
        for stage, _label in Deal.STAGE_CHOICES:
            stage_qs = deals_qs.filter(stage=stage)
            rows.append(
                {
                    'stage': stage,
                    'count': stage_qs.count(),
                    'value': float(stage_qs.aggregate(total=Sum('value')).get('total') or 0),
                }
            )
        return Response(rows, status=status.HTTP_200_OK)


class RecentActivityView(APIView):
    permission_classes = CRM_PERMISSION_CLASSES

    def get(self, request):
        user = request.user
        rows = _scoped_activity_queryset(user).order_by('-at')[:10]
        return Response(ActivitySerializer(rows, many=True).data, status=status.HTTP_200_OK)


class NotificationListView(APIView):
    permission_classes = CRM_PERMISSION_CLASSES

    def get(self, request):
        try:
            user = request.user
            if not getattr(user, 'is_authenticated', False):
                return Response([], status=status.HTTP_200_OK)

            read_ids = _read_notification_ids(request)
            rows = _scoped_activity_queryset(user).order_by('-at')[:30]
            data = []
            for row in rows:
                data.append(
                    {
                        'id': row.id,
                        'icon': _activity_icon(row.entity),
                        'title': f'{str(row.entity or "Activity").title()} {str(row.action or "").title()}'.strip(),
                        'body': row.detail or '',
                        'time': row.at.strftime('%d %b, %I:%M %p') if row.at else 'Just now',
                        'path': _activity_path(row.entity),
                        'is_read': row.id in read_ids,
                    }
                )
            return Response(data, status=status.HTTP_200_OK)
        except Exception:
            print("[CRM-ERROR] NotificationListView failed:")
            traceback.print_exc()
            return Response({'error': 'Internal server error during notification fetch'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NotificationReadView(APIView):
    permission_classes = CRM_PERMISSION_CLASSES

    def patch(self, request, pk):
        if not getattr(request.user, 'is_authenticated', False):
            return Response({'success': False, 'message': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
        read_ids = _read_notification_ids(request)
        read_ids.add(int(pk))
        _write_notification_ids(request, read_ids)
        return Response({'success': True, 'message': 'Notification marked as read.'}, status=status.HTTP_200_OK)


class MarkAllReadView(APIView):
    permission_classes = CRM_PERMISSION_CLASSES

    def patch(self, request):
        if not getattr(request.user, 'is_authenticated', False):
            return Response({'success': False, 'message': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
        ids = list(
            _scoped_activity_queryset(request.user)
            .order_by('-at')
            .values_list('id', flat=True)[:1000]
        )
        _write_notification_ids(request, ids)
        return Response({'success': True, 'message': 'All notifications marked as read.'}, status=status.HTTP_200_OK)


class UnreadCountView(APIView):
    permission_classes = CRM_PERMISSION_CLASSES

    def get(self, request):
        if not getattr(request.user, 'is_authenticated', False):
            return Response({'count': 0}, status=status.HTTP_200_OK)
        read_ids = _read_notification_ids(request)
        all_ids = set(
            _scoped_activity_queryset(request.user)
            .order_by('-at')
            .values_list('id', flat=True)[:1000]
        )
        unread = len(all_ids - read_ids)
        return Response({'count': unread}, status=status.HTTP_200_OK)


class ContactViewSet(viewsets.ModelViewSet):
    serializer_class = ContactSerializer
    permission_classes = CRM_PERMISSION_CLASSES
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'company', 'city']
    ordering_fields = ['name', 'created', 'status', 'priority']

    def get_queryset(self):
        return _scope_queryset(Contact.objects.all(), self.request.user)


class LeadViewSet(viewsets.ModelViewSet):
    serializer_class = LeadSerializer
    permission_classes = CRM_PERMISSION_CLASSES
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'company', 'status']
    ordering_fields = ['name', 'created', 'status', 'temperature']

    def get_queryset(self):
        return _scope_queryset(Lead.objects.all(), self.request.user)

    def perform_create(self, serializer):
        user = self.request.user
        if getattr(user, 'is_authenticated', False):
            serializer.save(
                assigned_to=serializer.validated_data.get('assigned_to') or user,
                team_id=serializer.validated_data.get('team_id') or user.team_id,
            )
            return
        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        if getattr(user, 'is_authenticated', False):
            current = serializer.instance
            serializer.save(
                assigned_to=serializer.validated_data.get('assigned_to', current.assigned_to or user),
                team_id=serializer.validated_data.get('team_id', current.team_id or user.team_id),
            )
            return
        serializer.save()


class DealViewSet(viewsets.ModelViewSet):
    serializer_class = DealSerializer
    permission_classes = CRM_PERMISSION_CLASSES
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'company', 'contact']
    ordering_fields = ['name', 'value', 'stage', 'close_date']

    def get_queryset(self):
        return _scope_queryset(Deal.objects.all(), self.request.user)

    def perform_create(self, serializer):
        user = self.request.user
        if getattr(user, 'is_authenticated', False):
            serializer.save(
                assigned_to=serializer.validated_data.get('assigned_to') or user,
                team_id=serializer.validated_data.get('team_id') or user.team_id,
            )
            return
        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        if getattr(user, 'is_authenticated', False):
            current = serializer.instance
            serializer.save(
                assigned_to=serializer.validated_data.get('assigned_to', current.assigned_to or user),
                team_id=serializer.validated_data.get('team_id', current.team_id or user.team_id),
            )
            return
        serializer.save()


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = CRM_PERMISSION_CLASSES
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'owner', 'related']
    ordering_fields = ['due_date', 'priority', 'status']

    def get_queryset(self):
        return _scope_queryset(Task.objects.all(), self.request.user)

    def perform_create(self, serializer):
        user = self.request.user
        if getattr(user, 'is_authenticated', False):
            serializer.save(
                assigned_to=serializer.validated_data.get('assigned_to') or user,
                team_id=serializer.validated_data.get('team_id') or user.team_id,
            )
            return
        serializer.save()


class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = CRM_PERMISSION_CLASSES

    def get_queryset(self):
        try:
            return _scope_queryset(Note.objects.all(), self.request.user)
        except Exception:
            print("[CRM-ERROR] NoteViewSet.get_queryset failed:")
            traceback.print_exc()
            raise

    def perform_create(self, serializer):
        user = self.request.user
        if getattr(user, 'is_authenticated', False):
            serializer.save(
                user=user,
                team_id=serializer.validated_data.get('team_id') or user.team_id,
            )
            return
        serializer.save()


class PayloadModuleViewSet(viewsets.ModelViewSet):
    permission_classes = CRM_PERMISSION_CLASSES

    def get_queryset(self):
        return _scope_queryset(self.model.objects.all(), self.request.user)

    def perform_create(self, serializer):
        user = self.request.user
        if getattr(user, 'is_authenticated', False):
            serializer.save(
                user=user,
                team_id=serializer.validated_data.get('team_id') or user.team_id,
            )
            return
        serializer.save()


class MarketingCampaignViewSet(PayloadModuleViewSet):
    serializer_class = MarketingCampaignSerializer
    model = MarketingCampaign


class MarketingAdViewSet(PayloadModuleViewSet):
    serializer_class = MarketingAdSerializer
    model = MarketingAd


class MarketingFormViewSet(PayloadModuleViewSet):
    serializer_class = MarketingFormSerializer
    model = MarketingForm


class MarketingEventViewSet(PayloadModuleViewSet):
    serializer_class = MarketingEventSerializer
    model = MarketingEvent


class MarketingSocialPostViewSet(PayloadModuleViewSet):
    serializer_class = MarketingSocialPostSerializer
    model = MarketingSocialPost


class MarketingBuyerIntentViewSet(PayloadModuleViewSet):
    serializer_class = MarketingBuyerIntentSerializer
    model = MarketingBuyerIntent


class MarketingLeadScoringViewSet(PayloadModuleViewSet):
    serializer_class = MarketingLeadScoringSerializer
    model = MarketingLeadScoring


class DesignManagerFileViewSet(PayloadModuleViewSet):
    serializer_class = DesignManagerFileSerializer
    model = DesignManagerFile


class CompanyViewSet(viewsets.ModelViewSet):
    serializer_class = CompanySerializer
    permission_classes = CRM_PERMISSION_CLASSES
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'industry', 'city']
    ordering_fields = ['name', 'industry', 'size', 'city', 'revenue', 'contacts', 'deals', 'status', 'owner', 'created']

    def get_queryset(self):
        return _scope_queryset(Company.objects.all(), self.request.user)

    def perform_create(self, serializer):
        user = self.request.user
        if getattr(user, 'is_authenticated', False):
            serializer.save(
                owner=serializer.validated_data.get('owner') or getattr(user, 'name', ''),
                team_id=serializer.validated_data.get('team_id') or user.team_id,
            )
            return
        serializer.save()

    def perform_update(self, serializer):
        current = self.get_object()
        user = self.request.user
        if getattr(user, 'is_authenticated', False):
            serializer.save(
                owner=serializer.validated_data.get('owner', current.owner or getattr(user, 'name', '')),
                team_id=serializer.validated_data.get('team_id', current.team_id or user.team_id),
            )
            return
        serializer.save()


class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer
    permission_classes = CRM_PERMISSION_CLASSES
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'contact', 'company']
    ordering_fields = ['created', 'priority', 'status']

    def get_queryset(self):
        return _scope_queryset(Ticket.objects.all(), self.request.user)


class CallLogViewSet(viewsets.ModelViewSet):
    serializer_class = CallLogSerializer
    permission_classes = CRM_PERMISSION_CLASSES

    def get_queryset(self):
        return _scope_queryset(CallLog.objects.all(), self.request.user)


class MeetingViewSet(viewsets.ModelViewSet):
    serializer_class = MeetingSerializer
    permission_classes = CRM_PERMISSION_CLASSES

    def get_queryset(self):
        return _scope_queryset(Meeting.objects.all(), self.request.user)

    def perform_create(self, serializer):
        user = self.request.user
        if getattr(user, 'is_authenticated', False):
            serializer.save(team_id=serializer.validated_data.get('team_id') or user.team_id)
            return
        serializer.save()


class ActivityViewSet(viewsets.ModelViewSet):
    serializer_class = ActivitySerializer
    permission_classes = CRM_PERMISSION_CLASSES

    def get_queryset(self):
        return _scoped_activity_queryset(self.request.user)

    def perform_create(self, serializer):
        user = self.request.user
        if getattr(user, 'is_authenticated', False):
            serializer.save(
                user=user,
                team_id=serializer.validated_data.get('team_id') or user.team_id,
            )
            return
        serializer.save()


class SendEmailView(APIView):
    permission_classes = CRM_PERMISSION_CLASSES

    @staticmethod
    def _as_email_list(raw):
        if isinstance(raw, list):
            values = raw
        else:
            values = str(raw or '').split(',')
        return [item.strip() for item in values if item and item.strip()]

    def post(self, request):
        if not getattr(request.user, 'is_authenticated', False):
            return Response({'success': False, 'message': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

        data = request.data or {}
        to_list = self._as_email_list(data.get('to'))
        cc_list = self._as_email_list(data.get('cc'))
        subject = str(data.get('subject', '')).strip()
        body = str(data.get('body', '')).strip()
        provider = str(data.get('provider', 'gmail')).strip().lower() or 'gmail'
        thread_id = str(data.get('thread_id', '')).strip()

        if not to_list:
            return Response({'success': False, 'message': '"to" email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not subject:
            return Response({'success': False, 'message': 'Subject is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not body:
            return Response({'success': False, 'message': 'Body is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            internal_users = get_user_model().objects.filter(email__in=to_list)
            internal_emails = {u.email for u in internal_users}
            external_emails = [em for em in to_list if em not in internal_emails]

            sender = request.user
            sender_email = sender.email

            delivery_provider = 'internal'
            delivery_from_email = sender_email
            delivery_thread_id = thread_id
            external_delivery_recorded = False

            if external_emails:
                active_accounts = UserEmailAccount.objects.filter(
                    user=request.user,
                    is_active=True,
                ).order_by('-updated_at')
                oauth_account = None
                if provider in {'gmail', 'outlook'}:
                    oauth_account = active_accounts.filter(provider=provider).first()
                if not oauth_account:
                    oauth_account = active_accounts.first()

                if oauth_account:
                    sent_rows = send_email_via_oauth(
                        oauth_account,
                        to_list=external_emails,
                        cc_list=cc_list,
                        subject=subject,
                        body=body,
                        thread_id=thread_id,
                    )
                    delivery_provider = oauth_account.provider
                    delivery_from_email = oauth_account.email_address or sender_email
                    delivery_thread_id = (
                        sent_rows[0].thread_id if sent_rows and sent_rows[0].thread_id else delivery_thread_id
                    )
                    external_delivery_recorded = True
                else:
                    smtp_meta = send_email_via_smtp(
                        to_list=external_emails,
                        cc_list=cc_list,
                        subject=subject,
                        body=body,
                        provider=provider,
                        thread_id=thread_id,
                    )
                    delivery_provider = smtp_meta.get('provider', 'gmail')
                    delivery_from_email = smtp_meta.get('from_email', sender_email)
                    delivery_thread_id = smtp_meta.get('thread_id', delivery_thread_id)

            for recipient_user in internal_users:
                rec_thread_id = delivery_thread_id

                # 1. Receiver Inbox
                EmailMessageRecord.objects.create(
                    owner=recipient_user,
                    sender=sender,
                    receiver=recipient_user,
                    sender_email=sender_email,
                    receiver_email=recipient_user.email,
                    account=None,
                    folder='inbox',
                    direction='inbound',
                    provider='internal',
                    thread_id=rec_thread_id,
                    from_email=sender_email,
                    to_email=recipient_user.email,
                    cc=','.join(cc_list),
                    subject=subject,
                    snippet=body[:180],
                    body=body,
                    unread=True,
                    is_read=False,
                    received_at=timezone.now(),
                    synced_at=timezone.now(),
                )

                # 2. Sender Sent Folder
                EmailMessageRecord.objects.create(
                    owner=sender,
                    sender=sender,
                    receiver=recipient_user,
                    sender_email=sender_email,
                    receiver_email=recipient_user.email,
                    account=None,
                    folder='sent',
                    direction='outbound',
                    provider='internal',
                    thread_id=rec_thread_id,
                    from_email=sender_email,
                    to_email=recipient_user.email,
                    cc=','.join(cc_list),
                    subject=subject,
                    snippet=body[:180],
                    body=body,
                    unread=False,
                    is_read=True,
                    received_at=timezone.now(),
                    synced_at=timezone.now(),
                )

            if external_emails and not external_delivery_recorded:
                for ext_email in external_emails:
                    EmailMessageRecord.objects.create(
                        owner=sender,
                        sender=sender,
                        receiver=None,
                        sender_email=sender_email,
                        receiver_email=ext_email,
                        account=None,
                        folder='sent',
                        direction='outbound',
                        provider=delivery_provider,
                        thread_id=delivery_thread_id,
                        from_email=delivery_from_email,
                        to_email=ext_email,
                        cc=','.join(cc_list),
                        subject=subject,
                        snippet=body[:180],
                        body=body,
                        unread=False,
                        is_read=True,
                        received_at=timezone.now(),
                        synced_at=timezone.now(),
                    )

            return Response(
                {
                    'success': True,
                    'message': 'Email sent successfully.',
                    'from': delivery_from_email if external_emails else sender_email,
                    'to': to_list,
                    'cc': cc_list,
                    'provider': delivery_provider if external_emails else 'internal',
                    'sent_count': len(to_list),
                    'thread_id': delivery_thread_id,
                },
                status=status.HTTP_200_OK,
            )
        except EmailOAuthError as exc:
            return Response(
                {'success': False, 'message': str(exc)},
                status=getattr(exc, 'status_code', status.HTTP_400_BAD_REQUEST),
            )
        except EmailSMTPError as exc:
            return Response(
                {'success': False, 'message': str(exc)},
                status=getattr(exc, 'status_code', status.HTTP_400_BAD_REQUEST),
            )
        except Exception as exc:
            return Response(
                {'success': False, 'message': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class InboxListView(APIView):
    permission_classes = CRM_PERMISSION_CLASSES

    def get(self, request):
        if not getattr(request.user, 'is_authenticated', False):
            return Response([], status=status.HTTP_200_OK)
        sync_requested = str(request.query_params.get('sync', '')).strip().lower() in {'1', 'true', 'yes'}
        if sync_requested:
            try:
                sync_all_active_accounts(request.user, max_results=25)
            except Exception:
                pass
        thread_id = str(request.query_params.get('thread_id', '')).strip()
        rows = EmailMessageRecord.objects.filter(owner=request.user, folder='inbox')
        if thread_id:
            rows = rows.filter(thread_id=thread_id)
        return Response(EmailMessageRecordSerializer(rows, many=True).data, status=status.HTTP_200_OK)


class InboxMarkReadView(APIView):
    permission_classes = CRM_PERMISSION_CLASSES

    def patch(self, request, pk):
        if not getattr(request.user, 'is_authenticated', False):
            return Response({'success': False, 'message': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
        msg = EmailMessageRecord.objects.filter(id=pk, owner=request.user).first()
        if not msg:
            return Response({'success': False, 'message': 'Message not found.'}, status=status.HTTP_404_NOT_FOUND)
        msg.unread = False
        msg.is_read = True
        msg.save(update_fields=['unread', 'is_read'])
        return Response({'success': True, 'message': 'Message marked as read.'}, status=status.HTTP_200_OK)


class InboxDeleteView(APIView):
    permission_classes = CRM_PERMISSION_CLASSES

    def delete(self, request, pk):
        if not getattr(request.user, 'is_authenticated', False):
            return Response({'success': False, 'message': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
        msg = EmailMessageRecord.objects.filter(id=pk, owner=request.user).first()
        if not msg:
            return Response({'success': False, 'message': 'Message not found.'}, status=status.HTTP_404_NOT_FOUND)
        msg.delete()
        return Response({'success': True, 'message': 'Message deleted.'}, status=status.HTTP_200_OK)


class SentEmailListView(APIView):
    permission_classes = CRM_PERMISSION_CLASSES

    def get(self, request):
        if not getattr(request.user, 'is_authenticated', False):
            return Response([], status=status.HTTP_200_OK)
        rows = EmailMessageRecord.objects.filter(owner=request.user, folder='sent')
        return Response(EmailMessageRecordSerializer(rows, many=True).data, status=status.HTTP_200_OK)


class EmailAccountListView(APIView):
    permission_classes = CRM_PERMISSION_CLASSES

    def get(self, request):
        if not getattr(request.user, 'is_authenticated', False):
            return Response([], status=status.HTTP_200_OK)
        rows = UserEmailAccount.objects.filter(user=request.user).order_by('-updated_at')
        return Response(UserEmailAccountSerializer(rows, many=True).data, status=status.HTTP_200_OK)


class EmailConnectUrlView(APIView):
    permission_classes = CRM_PERMISSION_CLASSES

    def post(self, request):
        if not getattr(request.user, 'is_authenticated', False):
            return Response({'success': False, 'message': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
        provider = str((request.data or {}).get('provider', '')).strip().lower()
        if provider not in {'gmail', 'outlook'}:
            return Response({'success': False, 'message': 'Provider must be gmail or outlook.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            connect_url, state = generate_connect_url(provider, request.user, request=request)
            return Response({'success': True, 'provider': provider, 'connect_url': connect_url, 'state': state}, status=status.HTTP_200_OK)
        except EmailOAuthError as exc:
            return Response({'success': False, 'message': str(exc)}, status=getattr(exc, 'status_code', 400))


class EmailOAuthCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, provider):
        provider = str(provider or '').strip().lower()
        code = request.query_params.get('code', '')
        state = request.query_params.get('state', '')
        if not code or not state:
            return HttpResponseRedirect(oauth_redirect_target(False, 'OAuth callback is missing required parameters.'))
        try:
            account = complete_oauth_connection(provider, code=code, state=state, request=request)
            return HttpResponseRedirect(oauth_redirect_target(True, f'{account.get_provider_display()} account connected successfully.'))
        except EmailOAuthError as exc:
            return HttpResponseRedirect(oauth_redirect_target(False, str(exc)))
        except Exception as exc:
            return HttpResponseRedirect(oauth_redirect_target(False, f'Unable to complete OAuth: {exc}'))


class EmailDisconnectView(APIView):
    permission_classes = CRM_PERMISSION_CLASSES

    def post(self, request, pk):
        if not getattr(request.user, 'is_authenticated', False):
            return Response({'success': False, 'message': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
        account = UserEmailAccount.objects.filter(id=pk, user=request.user).first()
        if not account:
            return Response({'success': False, 'message': 'Connected account not found.'}, status=status.HTTP_404_NOT_FOUND)
        account.is_active = False
        account.save(update_fields=['is_active', 'updated_at'])
        return Response({'success': True, 'message': 'Email account disconnected.'}, status=status.HTTP_200_OK)


class EmailSyncView(APIView):
    permission_classes = CRM_PERMISSION_CLASSES

    def post(self, request):
        if not getattr(request.user, 'is_authenticated', False):
            return Response({'success': False, 'message': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
        data = request.data or {}
        account_id = data.get('account_id')
        max_results = int(data.get('max_results', 25) or 25)
        try:
            if account_id:
                account = UserEmailAccount.objects.filter(id=account_id, user=request.user, is_active=True).first()
                if not account:
                    return Response({'success': False, 'message': 'Connected account not found.'}, status=status.HTTP_404_NOT_FOUND)
                count = sync_account_inbox(account, max_results=max_results)
            else:
                count = sync_all_active_accounts(request.user, max_results=max_results)
            return Response({'success': True, 'message': 'Inbox synchronized successfully.', 'synced_count': count}, status=status.HTTP_200_OK)
        except EmailOAuthError as exc:
            return Response({'success': False, 'message': str(exc)}, status=getattr(exc, 'status_code', 400))
        except Exception as exc:
            return Response({'success': False, 'message': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class InboxThreadsView(APIView):
    permission_classes = CRM_PERMISSION_CLASSES

    def get(self, request):
        if not getattr(request.user, 'is_authenticated', False):
            return Response([], status=status.HTTP_200_OK)

        rows = list(
            EmailMessageRecord.objects.filter(owner=request.user, folder='inbox')
            .order_by('-received_at', '-created_at')
        )
        grouped = {}
        for row in rows:
            key = row.thread_id or f'message-{row.id}'
            if key not in grouped:
                grouped[key] = {
                    'thread_id': key,
                    'subject': row.subject,
                    'from': row.from_email,
                    'preview': row.snippet or (row.body or '')[:100],
                    'time': row.received_at or row.created_at,
                    'unread_count': 1 if row.unread else 0,
                    'messages': 1,
                }
            else:
                grouped[key]['unread_count'] += 1 if row.unread else 0
                grouped[key]['messages'] += 1

        payload = list(grouped.values())
        payload.sort(key=lambda item: item['time'] or timezone.now(), reverse=True)
        for item in payload:
            item['time'] = item['time'].isoformat() if item['time'] else ''
        return Response(payload, status=status.HTTP_200_OK)
