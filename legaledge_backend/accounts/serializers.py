from django.conf import settings
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import CustomUser


def _normalize_mobile_number(value):
    if value is None:
        return None
    normalized = str(value).strip()
    return normalized or None


class UserSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = CustomUser
        fields = (
            'id',
            'email',
            'mobile_number',
            'phone',
            'name',
            'role',
            'department',
            'company',
            'timezone',
            'team_id',
            'avatar',
            'is_active',
            'date_joined',
        )
        read_only_fields = ('id', 'date_joined')

    def validate(self, attrs):
        phone = attrs.pop('phone', serializers.empty)
        if phone is not serializers.empty and 'mobile_number' not in attrs:
            attrs['mobile_number'] = phone

        if 'mobile_number' in attrs:
            mobile_number = _normalize_mobile_number(attrs.get('mobile_number'))
            if mobile_number:
                queryset = CustomUser.objects.filter(mobile_number=mobile_number)
                if self.instance:
                    queryset = queryset.exclude(pk=self.instance.pk)
                if queryset.exists():
                    raise serializers.ValidationError({'mobile_number': 'Mobile number already exists.'})
            attrs['mobile_number'] = mobile_number
        return attrs

    def validate_email(self, value):
        email = value.strip().lower()
        queryset = CustomUser.objects.filter(email__iexact=email)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError('Email already exists.')
        return email

    def validate_mobile_number(self, value):
        mobile_number = _normalize_mobile_number(value)
        if not mobile_number:
            return None

        queryset = CustomUser.objects.filter(mobile_number=mobile_number)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError('Mobile number already exists.')
        return mobile_number


class UserPublicSerializer(serializers.ModelSerializer):
    """Lightweight serializer for public user info (dashboards, assignments)."""
    class Meta:
        model = CustomUser
        fields = ('id', 'email', 'name', 'role', 'department', 'company', 'timezone', 'team_id', 'avatar')


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError('Invalid email or password. Please try again.')
        if not user.is_active:
            raise serializers.ValidationError('This account has been deactivated.')

        refresh = RefreshToken.for_user(user)
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'mobileNumber': user.mobile_number,
                'role': user.role,
                'department': user.department,
                'company': user.company,
                'timezone': user.timezone,
                'teamId': user.team_id,
                'avatar': user.avatar,
            },
        }


class EnterpriseTokenSerializer(TokenObtainPairSerializer):
    username_field = get_user_model().USERNAME_FIELD
    default_error_messages = {
        'no_active_account': 'Invalid email or password. Please try again.',
    }

    def validate(self, attrs):
        email = attrs.get(self.username_field, '').strip().lower()
        allowed_domains = [domain.lower() for domain in getattr(settings, 'ALLOWED_LOGIN_DOMAINS', [])]

        if allowed_domains and not any(email.endswith(domain) for domain in allowed_domains):
            raise serializers.ValidationError({'error': 'Use your company email address.'})

        attrs[self.username_field] = email
        data = super().validate(attrs)
        user = self.user
        data['role'] = user.role
        data['user'] = {
            'id': user.id,
            'email': user.email,
            'name': user.name,
            'mobileNumber': user.mobile_number,
            'role': user.role,
            'department': user.department,
            'company': user.company,
            'timezone': user.timezone,
            'teamId': user.team_id,
            'avatar': user.avatar,
        }
        return data


class SignupSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    mobile_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    department = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    company = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    timezone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    team_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=['admin', 'manager', 'user'], default='user')

    class Meta:
        model = CustomUser
        fields = (
            'email',
            'name',
            'mobile_number',
            'phone',
            'department',
            'company',
            'timezone',
            'team_id',
            'password',
            'confirm_password',
            'role',
        )

    def validate(self, data):
        phone = data.pop('phone', serializers.empty)
        if phone is not serializers.empty and 'mobile_number' not in data:
            data['mobile_number'] = phone

        if 'mobile_number' in data:
            mobile_number = _normalize_mobile_number(data.get('mobile_number'))
            if mobile_number and CustomUser.objects.filter(mobile_number=mobile_number).exists():
                raise serializers.ValidationError({'mobile_number': 'Mobile number already exists.'})
            data['mobile_number'] = mobile_number

        if 'team_id' in data:
            team_id = data.get('team_id')
            if team_id is None:
                data['team_id'] = None
            else:
                data['team_id'] = str(team_id).strip() or None

        for field_name in ('department', 'company', 'timezone'):
            if field_name in data:
                value = data.get(field_name)
                if value is None:
                    data[field_name] = ''
                else:
                    data[field_name] = str(value).strip()

        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data

    def validate_email(self, value):
        email = value.strip().lower()
        if CustomUser.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return email

    def validate_mobile_number(self, value):
        mobile_number = _normalize_mobile_number(value)
        if not mobile_number:
            return None
        if CustomUser.objects.filter(mobile_number=mobile_number).exists():
            raise serializers.ValidationError('Mobile number already exists.')
        return mobile_number

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        validated_data.pop('phone', None)
        password = validated_data.pop('password')
        role = validated_data.get('role', 'user')
        team_id = validated_data.pop('team_id', None)
        if role == 'admin':
            team_id = None
        elif not team_id:
            team_id = 'team_01'
        user = CustomUser.objects.create_user(
            **validated_data,
            password=password,
            team_id=team_id,
        )
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)
