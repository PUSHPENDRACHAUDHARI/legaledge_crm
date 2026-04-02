from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = (
        'email',
        'mobile_number',
        'name',
        'role',
        'department',
        'company',
        'timezone',
        'team_id',
        'is_active',
        'is_staff',
    )
    list_filter = ('role', 'is_active', 'is_staff')
    ordering = ('email',)
    search_fields = ('email', 'mobile_number', 'name', 'department', 'company', 'timezone')

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('name', 'mobile_number', 'department', 'company', 'timezone', 'avatar')}),
        ('Role & Team', {'fields': ('role', 'team_id')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates', {'fields': ('last_login', 'date_joined')}),
    )
    readonly_fields = ('date_joined',)

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email',
                'mobile_number',
                'name',
                'department',
                'company',
                'timezone',
                'password1',
                'password2',
                'role',
                'team_id',
                'is_active',
                'is_staff',
            ),
        }),
    )
