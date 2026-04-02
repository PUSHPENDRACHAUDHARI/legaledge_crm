from django.urls import path, include
from rest_framework.permissions import AllowAny
from rest_framework.routers import APIRootView, DefaultRouter
from . import views
from accounts.views import UserListView, UserDetailView

class PublicAPIRootView(APIRootView):
    permission_classes = [AllowAny]


class PublicRootDefaultRouter(DefaultRouter):
    APIRootView = PublicAPIRootView


router = PublicRootDefaultRouter()
router.register(r'contacts', views.ContactViewSet, basename='contacts')
router.register(r'leads', views.LeadViewSet, basename='leads')
router.register(r'deals', views.DealViewSet, basename='deals')
router.register(r'tasks', views.TaskViewSet, basename='tasks')
router.register(r'companies', views.CompanyViewSet, basename='companies')
router.register(r'tickets', views.TicketViewSet, basename='tickets')
router.register(r'calls', views.CallLogViewSet, basename='calls')
router.register(r'meetings', views.MeetingViewSet, basename='meetings')
router.register(r'activities', views.ActivityViewSet, basename='activities')
router.register(r'notes', views.NoteViewSet, basename='notes')
router.register(r'marketing-campaigns', views.MarketingCampaignViewSet, basename='marketing_campaigns')
router.register(r'marketing-ads', views.MarketingAdViewSet, basename='marketing_ads')
router.register(r'marketing-forms', views.MarketingFormViewSet, basename='marketing_forms')
router.register(r'marketing-events', views.MarketingEventViewSet, basename='marketing_events')
router.register(r'marketing-social', views.MarketingSocialPostViewSet, basename='marketing_social')
router.register(r'marketing-buyer-intent', views.MarketingBuyerIntentViewSet, basename='marketing_buyer_intent')
router.register(r'marketing-lead-scoring', views.MarketingLeadScoringViewSet, basename='marketing_lead_scoring')
router.register(r'design-files', views.DesignManagerFileViewSet, basename='design_files')

urlpatterns = [
    # Dashboards
    path('dashboard/admin/', views.AdminDashboardView.as_view(), name='dashboard_admin'),
    path('dashboard/manager/', views.ManagerDashboardView.as_view(), name='dashboard_manager'),
    path('dashboard/user/', views.UserDashboardView.as_view(), name='dashboard_user'),
    path('dashboard/stats/', views.DashboardStatsView.as_view(), name='dashboard_stats'),
    path('dashboard/revenue-chart/', views.RevenueChartView.as_view(), name='dashboard_revenue_chart'),
    path('dashboard/leads-chart/', views.LeadsChartView.as_view(), name='dashboard_leads_chart'),
    path('dashboard/deals-pipeline/', views.PipelineView.as_view(), name='dashboard_pipeline'),
    path('dashboard/recent-activity/', views.RecentActivityView.as_view(), name='dashboard_recent_activity'),
    # User management (admin only)
    path('users/', UserListView.as_view(), name='user_list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user_detail'),
    path('email/send/', views.SendEmailView.as_view(), name='email_send'),
    path('email/sent/', views.SentEmailListView.as_view(), name='email_sent'),
    path('email/accounts/', views.EmailAccountListView.as_view(), name='email_accounts'),
    path('email/connect-url/', views.EmailConnectUrlView.as_view(), name='email_connect_url'),
    path('email/oauth/<str:provider>/callback/', views.EmailOAuthCallbackView.as_view(), name='email_oauth_callback'),
    path('email/accounts/<int:pk>/disconnect/', views.EmailDisconnectView.as_view(), name='email_disconnect'),
    path('email/sync/', views.EmailSyncView.as_view(), name='email_sync'),
    path('inbox/', views.InboxListView.as_view(), name='inbox_list'),
    path('inbox/threads/', views.InboxThreadsView.as_view(), name='inbox_threads'),
    path('inbox/<int:pk>/read/', views.InboxMarkReadView.as_view(), name='inbox_mark_read'),
    path('inbox/<int:pk>/', views.InboxDeleteView.as_view(), name='inbox_delete'),
    path('notifications/', views.NotificationListView.as_view(), name='notifications_list'),
    path('notifications/<int:pk>/read/', views.NotificationReadView.as_view(), name='notifications_read'),
    path('notifications/mark-all-read/', views.MarkAllReadView.as_view(), name='notifications_mark_all'),
    path('notifications/unread-count/', views.UnreadCountView.as_view(), name='notifications_unread_count'),
    # CRM CRUD
    path('', include(router.urls)),
]
