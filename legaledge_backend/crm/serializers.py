from rest_framework import serializers
from django.contrib.auth import get_user_model
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


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = '__all__'


class LeadSerializer(serializers.ModelSerializer):
    assignedTo = serializers.PrimaryKeyRelatedField(
        source='assigned_to', queryset=get_user_model().objects.all(), required=False, allow_null=True
    )
    teamId = serializers.CharField(source='team_id', required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Lead
        fields = '__all__'
        extra_kwargs = {
            'assigned_to': {'write_only': True, 'required': False, 'allow_null': True},
            'team_id': {'write_only': True, 'required': False, 'allow_null': True, 'allow_blank': True},
        }


class DealSerializer(serializers.ModelSerializer):
    closeDate = serializers.DateField(source='close_date', required=False, allow_null=True)
    assignedTo = serializers.PrimaryKeyRelatedField(
        source='assigned_to', queryset=get_user_model().objects.all(), required=False, allow_null=True
    )
    teamId = serializers.CharField(source='team_id', required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Deal
        fields = '__all__'
        extra_kwargs = {
            'close_date': {'write_only': True, 'required': False, 'allow_null': True},
            'assigned_to': {'write_only': True, 'required': False, 'allow_null': True},
            'team_id': {'write_only': True, 'required': False, 'allow_null': True, 'allow_blank': True},
        }


class TaskSerializer(serializers.ModelSerializer):
    dueDate = serializers.DateField(source='due_date', required=False, allow_null=True)
    assignedTo = serializers.PrimaryKeyRelatedField(
        source='assigned_to', queryset=get_user_model().objects.all(), required=False, allow_null=True
    )
    teamId = serializers.CharField(source='team_id', required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Task
        fields = '__all__'
        extra_kwargs = {
            'due_date': {'write_only': True, 'required': False, 'allow_null': True},
            'assigned_to': {'write_only': True, 'required': False, 'allow_null': True},
            'team_id': {'write_only': True, 'required': False, 'allow_null': True, 'allow_blank': True},
        }


class CompanySerializer(serializers.ModelSerializer):
    teamId = serializers.CharField(source='team_id', required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Company
        fields = '__all__'
        extra_kwargs = {
            'team_id': {'write_only': True, 'required': False, 'allow_null': True, 'allow_blank': True},
        }


class TicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = '__all__'


class CallLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = CallLog
        fields = '__all__'


class MeetingSerializer(serializers.ModelSerializer):
    teamId = serializers.CharField(source='team_id', required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Meeting
        fields = '__all__'
        extra_kwargs = {
            'team_id': {'write_only': True, 'required': False, 'allow_null': True, 'allow_blank': True},
        }


class ActivitySerializer(serializers.ModelSerializer):
    entityId = serializers.IntegerField(source='entity_id', required=False, allow_null=True)
    teamId = serializers.CharField(source='team_id', required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Activity
        fields = '__all__'
        extra_kwargs = {
            'entity_id': {'write_only': True, 'required': False, 'allow_null': True},
            'team_id': {'write_only': True, 'required': False, 'allow_null': True, 'allow_blank': True},
            'user': {'read_only': True},
        }


class NoteSerializer(serializers.ModelSerializer):
    localId = serializers.CharField(source='local_id', required=False, allow_blank=True)
    teamId = serializers.CharField(source='team_id', required=False, allow_blank=True, allow_null=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = Note
        fields = '__all__'
        extra_kwargs = {
            'local_id': {'write_only': True, 'required': False, 'allow_blank': True},
            'team_id': {'write_only': True, 'required': False, 'allow_null': True, 'allow_blank': True},
            'user': {'read_only': True},
        }


class PayloadModuleSerializer(serializers.ModelSerializer):
    localId = serializers.CharField(source='local_id', required=False, allow_blank=True)
    teamId = serializers.CharField(source='team_id', required=False, allow_blank=True, allow_null=True)
    data = serializers.JSONField(source='payload', required=False)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        fields = '__all__'
        extra_kwargs = {
            'local_id': {'write_only': True, 'required': False, 'allow_blank': True},
            'team_id': {'write_only': True, 'required': False, 'allow_null': True, 'allow_blank': True},
            'payload': {'write_only': True, 'required': False},
            'user': {'read_only': True},
        }


class MarketingCampaignSerializer(PayloadModuleSerializer):
    class Meta(PayloadModuleSerializer.Meta):
        model = MarketingCampaign


class MarketingAdSerializer(PayloadModuleSerializer):
    class Meta(PayloadModuleSerializer.Meta):
        model = MarketingAd


class MarketingFormSerializer(PayloadModuleSerializer):
    class Meta(PayloadModuleSerializer.Meta):
        model = MarketingForm


class MarketingEventSerializer(PayloadModuleSerializer):
    class Meta(PayloadModuleSerializer.Meta):
        model = MarketingEvent


class MarketingSocialPostSerializer(PayloadModuleSerializer):
    class Meta(PayloadModuleSerializer.Meta):
        model = MarketingSocialPost


class MarketingBuyerIntentSerializer(PayloadModuleSerializer):
    class Meta(PayloadModuleSerializer.Meta):
        model = MarketingBuyerIntent


class MarketingLeadScoringSerializer(PayloadModuleSerializer):
    class Meta(PayloadModuleSerializer.Meta):
        model = MarketingLeadScoring


class DesignManagerFileSerializer(PayloadModuleSerializer):
    class Meta(PayloadModuleSerializer.Meta):
        model = DesignManagerFile


class EmailMessageRecordSerializer(serializers.ModelSerializer):
    accountId = serializers.IntegerField(source='account_id', read_only=True)
    threadId = serializers.CharField(source='thread_id', read_only=True)
    externalId = serializers.CharField(source='external_id', read_only=True)
    inReplyTo = serializers.CharField(source='in_reply_to', read_only=True)
    receivedAt = serializers.DateTimeField(source='received_at', read_only=True)
    from_ = serializers.EmailField(source='from_email', read_only=True)
    email = serializers.EmailField(source='from_email', read_only=True)
    preview = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    tag = serializers.SerializerMethodField()

    class Meta:
        model = EmailMessageRecord
        fields = [
            'id',
            'from_',
            'email',
            'to_email',
            'cc',
            'subject',
            'body',
            'preview',
            'time',
            'unread',
            'provider',
            'tag',
            'created_at',
            'receivedAt',
            'folder',
            'accountId',
            'threadId',
            'externalId',
            'inReplyTo',
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['from'] = data.pop('from_')
        return data

    def get_preview(self, obj):
        return (obj.body or '')[:100]

    def get_time(self, obj):
        return obj.created_at.strftime('%I:%M %p').lstrip('0')

    def get_tag(self, obj):
        return 'Sent' if obj.folder == 'sent' else 'Inbox'


class UserEmailAccountSerializer(serializers.ModelSerializer):
    providerLabel = serializers.SerializerMethodField()
    tokenExpired = serializers.SerializerMethodField()

    class Meta:
        model = UserEmailAccount
        fields = [
            'id',
            'provider',
            'providerLabel',
            'email_address',
            'is_active',
            'last_synced_at',
            'token_expiry',
            'tokenExpired',
            'created_at',
            'updated_at',
        ]

    def get_providerLabel(self, obj):
        return obj.get_provider_display()

    def get_tokenExpired(self, obj):
        return obj.token_is_expired()
