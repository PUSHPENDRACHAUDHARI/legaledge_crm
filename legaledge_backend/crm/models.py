from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone

from .email_security import decrypt_token, encrypt_token


class Contact(models.Model):
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]
    TYPE_CHOICES = [('Customer', 'Customer'), ('Lead', 'Lead'), ('Prospect', 'Prospect')]
    PRIORITY_CHOICES = [('High', 'High'), ('Medium', 'Medium'), ('Low', 'Low')]

    name = models.CharField(max_length=150)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    company = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    owner = models.CharField(max_length=150, blank=True)
    industry = models.CharField(max_length=100, blank=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Medium')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='Lead')
    created = models.DateField(auto_now_add=True)
    last_contact = models.DateField(null=True, blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_contacts'
    )
    team_id = models.CharField(max_length=50, blank=True, null=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f'{self.name} ({self.company})'

    class Meta:
        ordering = ['-created']


class Lead(models.Model):
    STATUS_CHOICES = [
        ('New', 'New'), ('Contacted', 'Contacted'), ('Qualified', 'Qualified'),
        ('Negotiation', 'Negotiation'), ('Won', 'Won'), ('Lost', 'Lost'),
    ]
    TEMPERATURE_CHOICES = [('Hot', 'Hot'), ('Warm', 'Warm'), ('Cold', 'Cold')]
    SOURCE_CHOICES = [
        ('Website', 'Website'), ('Referral', 'Referral'), ('LinkedIn', 'LinkedIn'),
        ('Email Campaign', 'Email Campaign'), ('Event', 'Event'), ('Cold Call', 'Cold Call'),
        ('Ads', 'Ads'), ('IndiaMART', 'IndiaMART'), ('Other', 'Other'),
    ]

    name = models.CharField(max_length=150)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    company = models.CharField(max_length=150, blank=True)
    source = models.CharField(max_length=50, choices=SOURCE_CHOICES, default='Website')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='New')
    owner = models.CharField(max_length=150, blank=True)
    value = models.CharField(max_length=50, blank=True)
    temperature = models.CharField(max_length=10, choices=TEMPERATURE_CHOICES, default='Cold')
    industry = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created = models.DateField(auto_now_add=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_leads'
    )
    team_id = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f'{self.name} – {self.status}'

    class Meta:
        ordering = ['-created']


class Deal(models.Model):
    STAGE_CHOICES = [
        ('New Lead', 'New Lead'), ('Contacted', 'Contacted'), ('Proposal', 'Proposal'),
        ('Negotiation', 'Negotiation'), ('Closed Won', 'Closed Won'), ('Closed Lost', 'Closed Lost'),
    ]

    name = models.CharField(max_length=200)
    company = models.CharField(max_length=150, blank=True)
    contact = models.CharField(max_length=150, blank=True)
    value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default='New Lead')
    owner = models.CharField(max_length=150, blank=True)
    close_date = models.DateField(null=True, blank=True)
    probability = models.IntegerField(default=0)
    created = models.DateField(auto_now_add=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_deals'
    )
    team_id = models.CharField(max_length=50, blank=True, null=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f'{self.name} ({self.stage})'

    class Meta:
        ordering = ['-created']


class Task(models.Model):
    TYPE_CHOICES = [('Call', 'Call'), ('Email', 'Email'), ('Meeting', 'Meeting'), ('Document', 'Document')]
    PRIORITY_CHOICES = [('High', 'High'), ('Medium', 'Medium'), ('Low', 'Low')]
    STATUS_CHOICES = [('Pending', 'Pending'), ('In Progress', 'In Progress'), ('Completed', 'Completed')]

    title = models.CharField(max_length=250)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='Call')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Medium')
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    owner = models.CharField(max_length=150, blank=True)
    related = models.CharField(max_length=250, blank=True)
    notes = models.TextField(blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_tasks'
    )
    team_id = models.CharField(max_length=50, blank=True, null=True)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['due_date', '-created']


class Company(models.Model):
    STATUS_CHOICES = [('Customer', 'Customer'), ('Prospect', 'Prospect'), ('Lead', 'Lead'), ('Partner', 'Partner')]

    name = models.CharField(max_length=200)
    industry = models.CharField(max_length=100, blank=True)
    size = models.CharField(max_length=50, blank=True)
    city = models.CharField(max_length=100, blank=True)
    website = models.CharField(max_length=200, blank=True)
    revenue = models.CharField(max_length=50, blank=True)
    contacts = models.IntegerField(default=0)
    deals = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Lead')
    owner = models.CharField(max_length=150, blank=True)
    team_id = models.CharField(max_length=50, blank=True, null=True)
    created = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Companies'


class Ticket(models.Model):
    PRIORITY_CHOICES = [('High', 'High'), ('Medium', 'Medium'), ('Low', 'Low')]
    STATUS_CHOICES = [('Open', 'Open'), ('In Progress', 'In Progress'), ('Closed', 'Closed')]
    CATEGORY_CHOICES = [
        ('Technical', 'Technical'), ('Billing', 'Billing'),
        ('Feature Request', 'Feature Request'), ('General', 'General'),
    ]

    title = models.CharField(max_length=250)
    contact = models.CharField(max_length=150, blank=True)
    company = models.CharField(max_length=150, blank=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Open')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='General')
    owner = models.CharField(max_length=150, blank=True)
    team_id = models.CharField(max_length=50, blank=True, null=True)
    created = models.DateField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created']


class CallLog(models.Model):
    STATUS_CHOICES = [('Answered', 'Answered'), ('Missed', 'Missed'), ('Voicemail', 'Voicemail')]
    TYPE_CHOICES = [('Inbound', 'Inbound'), ('Outbound', 'Outbound')]

    contact = models.CharField(max_length=150)
    phone = models.CharField(max_length=30, blank=True)
    duration = models.CharField(max_length=20, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Answered')
    date = models.DateField(null=True, blank=True)
    time = models.CharField(max_length=20, blank=True)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='Outbound')
    notes = models.TextField(blank=True)
    team_id = models.CharField(max_length=50, blank=True, null=True)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.type} – {self.contact} ({self.date})'

    class Meta:
        ordering = ['-date']


class Meeting(models.Model):
    TYPE_CHOICES = [('Video Call', 'Video Call'), ('Meeting', 'Meeting'), ('Phone Call', 'Phone Call')]
    PLATFORM_CHOICES = [('zoom', 'Zoom'), ('gmeet', 'Google Meet'), ('teams', 'Teams'), ('other', 'Other')]

    title = models.CharField(max_length=250)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='Meeting')
    date = models.DateField(null=True, blank=True)
    time = models.CharField(max_length=20, blank=True)
    contact = models.CharField(max_length=150, blank=True)
    duration = models.CharField(max_length=20, blank=True)
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES, blank=True)
    notes = models.TextField(blank=True)
    team_id = models.CharField(max_length=50, blank=True, null=True)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.title} ({self.date})'

    class Meta:
        ordering = ['-date']


class Activity(models.Model):
    entity = models.CharField(max_length=50)
    entity_id = models.IntegerField(null=True, blank=True)
    action = models.CharField(max_length=50)
    detail = models.TextField(blank=True)
    owner = models.CharField(max_length=150, blank=True)
    at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='activities'
    )
    team_id = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f'{self.action} on {self.entity} ({self.at})'

    class Meta:
        ordering = ['-at']
        verbose_name_plural = 'Activities'


class Note(models.Model):
    local_id = models.CharField(max_length=100, blank=True, db_index=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    owner = models.CharField(max_length=150, blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='notes'
    )
    team_id = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']


class PayloadModuleBase(models.Model):
    local_id = models.CharField(max_length=100, blank=True, db_index=True)
    payload = models.JSONField(default=dict, blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='%(class)s_records'
    )
    team_id = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']


class MarketingCampaign(PayloadModuleBase):
    def __str__(self):
        return str(self.local_id or self.id)


class MarketingAd(PayloadModuleBase):
    def __str__(self):
        return str(self.local_id or self.id)


class MarketingForm(PayloadModuleBase):
    def __str__(self):
        return str(self.local_id or self.id)


class MarketingEvent(PayloadModuleBase):
    def __str__(self):
        return str(self.local_id or self.id)


class MarketingSocialPost(PayloadModuleBase):
    def __str__(self):
        return str(self.local_id or self.id)


class MarketingBuyerIntent(PayloadModuleBase):
    def __str__(self):
        return str(self.local_id or self.id)


class MarketingLeadScoring(PayloadModuleBase):
    def __str__(self):
        return str(self.local_id or self.id)


class DesignManagerFile(PayloadModuleBase):
    def __str__(self):
        return str(self.local_id or self.id)


class UserEmailAccount(models.Model):
    PROVIDER_CHOICES = [('gmail', 'Gmail'), ('outlook', 'Outlook')]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='email_accounts'
    )
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES)
    email_address = models.EmailField()
    access_token = models.TextField(blank=True)
    refresh_token = models.TextField(blank=True)
    token_expiry = models.DateTimeField(null=True, blank=True)
    scope = models.TextField(blank=True)
    external_account_id = models.CharField(max_length=255, blank=True)
    sync_cursor = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    last_synced_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        unique_together = ('user', 'provider', 'email_address')

    def __str__(self):
        return f'{self.user.email} -> {self.provider}:{self.email_address}'

    def set_tokens(self, access_token, refresh_token=None, expires_in=None, expires_at=None):
        self.access_token = encrypt_token(access_token)
        if refresh_token:
            self.refresh_token = encrypt_token(refresh_token)
        if expires_at is not None:
            self.token_expiry = expires_at
        elif expires_in:
            self.token_expiry = timezone.now() + timedelta(seconds=int(expires_in))
        elif self.token_expiry is None:
            self.token_expiry = timezone.now() + timedelta(minutes=45)

    def get_access_token(self):
        return decrypt_token(self.access_token)

    def get_refresh_token(self):
        return decrypt_token(self.refresh_token)

    def token_is_expired(self, skew_seconds=60):
        if not self.token_expiry:
            return True
        return timezone.now() >= (self.token_expiry - timedelta(seconds=skew_seconds))


class EmailMessageRecord(models.Model):
    FOLDER_CHOICES = [('inbox', 'Inbox'), ('sent', 'Sent')]
    PROVIDER_CHOICES = [('gmail', 'Gmail'), ('outlook', 'Outlook'), ('internal', 'Internal')]
    DIRECTION_CHOICES = [('inbound', 'Inbound'), ('outbound', 'Outbound')]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='email_messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name='sent_emails', on_delete=models.CASCADE, null=True, blank=True
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name='received_emails', on_delete=models.CASCADE, null=True, blank=True
    )
    sender_email = models.EmailField(blank=True, null=True)
    receiver_email = models.EmailField(blank=True, null=True)

    account = models.ForeignKey(
        UserEmailAccount, on_delete=models.SET_NULL, null=True, blank=True, related_name='messages'
    )
    folder = models.CharField(max_length=20, choices=FOLDER_CHOICES, default='inbox')
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, default='gmail')
    external_id = models.CharField(max_length=255, blank=True, db_index=True)
    thread_id = models.CharField(max_length=255, blank=True, db_index=True)
    in_reply_to = models.CharField(max_length=255, blank=True)
    from_email = models.EmailField()
    to_email = models.EmailField()
    cc = models.TextField(blank=True)
    subject = models.CharField(max_length=255)
    snippet = models.TextField(blank=True)
    body = models.TextField(blank=True)
    direction = models.CharField(max_length=20, choices=DIRECTION_CHOICES, default='inbound')
    unread = models.BooleanField(default=True)
    is_read = models.BooleanField(default=False)
    received_at = models.DateTimeField(null=True, blank=True)
    synced_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.folder}: {self.subject} -> {self.to_email}'

    class Meta:
        ordering = ['-created_at']
