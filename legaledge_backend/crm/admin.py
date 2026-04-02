from django.contrib import admin
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


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'company', 'status', 'priority', 'owner', 'created')
    list_filter = ('status', 'priority', 'type', 'industry')
    search_fields = ('name', 'email', 'company')
    ordering = ('-created',)


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('name', 'company', 'status', 'temperature', 'source', 'owner', 'created')
    list_filter = ('status', 'temperature', 'source')
    search_fields = ('name', 'email', 'company')
    ordering = ('-created',)


@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = ('name', 'company', 'value', 'stage', 'probability', 'owner', 'close_date')
    list_filter = ('stage',)
    search_fields = ('name', 'company', 'contact')
    ordering = ('-created',)


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'priority', 'status', 'due_date', 'owner')
    list_filter = ('type', 'priority', 'status')
    search_fields = ('title', 'owner')
    ordering = ('due_date',)


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'industry', 'city', 'status', 'owner')
    list_filter = ('status', 'industry')
    search_fields = ('name', 'city')


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('title', 'contact', 'priority', 'status', 'category', 'created')
    list_filter = ('priority', 'status', 'category')
    search_fields = ('title', 'contact', 'company')


@admin.register(CallLog)
class CallLogAdmin(admin.ModelAdmin):
    list_display = ('contact', 'type', 'status', 'duration', 'date')
    list_filter = ('type', 'status')


@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'contact', 'date', 'platform')
    list_filter = ('type', 'platform')


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ('entity', 'action', 'detail', 'owner', 'at')
    list_filter = ('entity', 'action')
    ordering = ('-at',)


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'team_id', 'created_at')
    search_fields = ('title', 'description', 'owner')
    ordering = ('-created_at',)


class PayloadModuleAdmin(admin.ModelAdmin):
    list_display = ('id', 'local_id', 'team_id', 'created_at')
    search_fields = ('local_id',)
    ordering = ('-created_at',)


admin.site.register(MarketingCampaign, PayloadModuleAdmin)
admin.site.register(MarketingAd, PayloadModuleAdmin)
admin.site.register(MarketingForm, PayloadModuleAdmin)
admin.site.register(MarketingEvent, PayloadModuleAdmin)
admin.site.register(MarketingSocialPost, PayloadModuleAdmin)
admin.site.register(MarketingBuyerIntent, PayloadModuleAdmin)
admin.site.register(MarketingLeadScoring, PayloadModuleAdmin)
admin.site.register(DesignManagerFile, PayloadModuleAdmin)


@admin.register(EmailMessageRecord)
class EmailMessageRecordAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'owner', 'account', 'folder', 'provider', 'from_email', 'to_email', 'thread_id', 'unread', 'created_at'
    )
    list_filter = ('folder', 'provider', 'unread')
    search_fields = ('from_email', 'to_email', 'subject', 'owner__email')
    ordering = ('-created_at',)


@admin.register(UserEmailAccount)
class UserEmailAccountAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'provider', 'email_address', 'is_active', 'token_expiry', 'last_synced_at')
    list_filter = ('provider', 'is_active')
    search_fields = ('user__email', 'email_address')
    ordering = ('-updated_at',)
