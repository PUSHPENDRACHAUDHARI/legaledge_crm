from django.core.exceptions import ValidationError
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class CustomUserManager(BaseUserManager):
    def create_user(self, email, name, password=None, role='user', **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email).strip().lower()
        mobile_number = extra_fields.get('mobile_number')
        if mobile_number is not None:
            extra_fields['mobile_number'] = str(mobile_number).strip() or None
        user = self.model(email=email, name=name, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, name, password, role='admin', **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('user', 'User'),
    ]

    email = models.EmailField(unique=True)
    mobile_number = models.CharField(max_length=15, unique=True, blank=True, null=True)
    name = models.CharField(max_length=150)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    department = models.CharField(max_length=100, blank=True)
    company = models.CharField(max_length=150, blank=True)
    timezone = models.CharField(max_length=100, blank=True)
    team_id = models.CharField(max_length=50, blank=True, null=True)
    avatar = models.CharField(max_length=10, blank=True, default='')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    def clean(self):
        super().clean()

        if self.email:
            self.email = self.__class__.objects.normalize_email(self.email).strip().lower()

        if self.mobile_number is not None:
            self.mobile_number = str(self.mobile_number).strip() or None

        if self.email and self.__class__.objects.filter(email__iexact=self.email).exclude(pk=self.pk).exists():
            raise ValidationError({'email': 'Email already exists'})

        if self.mobile_number and self.__class__.objects.filter(mobile_number=self.mobile_number).exclude(pk=self.pk).exists():
            raise ValidationError({'mobile_number': 'Mobile number already exists'})

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.__class__.objects.normalize_email(self.email).strip().lower()

        if self.mobile_number is not None:
            self.mobile_number = str(self.mobile_number).strip() or None

        # Auto-generate avatar initials from name
        if not self.avatar and self.name:
            parts = self.name.strip().split()
            self.avatar = ''.join(p[0].upper() for p in parts[:2])
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.name} ({self.email}) [{self.role}]'

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
