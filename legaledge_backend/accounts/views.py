from django.conf import settings
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

from .models import CustomUser
from .serializers import (
    EnterpriseTokenSerializer, SignupSerializer, UserSerializer,
    UserPublicSerializer, ChangePasswordSerializer
)


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ – authenticate and return JWT tokens."""
    permission_classes = [permissions.AllowAny]
    serializer_class = EnterpriseTokenSerializer

    def post(self, request, *args, **kwargs):
        email = (request.data.get('email') or request.data.get('username') or '').strip().lower()
        password = request.data.get('password') or ''

        if not email or not password:
            return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)

        allowed_domains = [domain.lower() for domain in getattr(settings, 'ALLOWED_LOGIN_DOMAINS', [])]
        if allowed_domains and not any(email.endswith(domain) for domain in allowed_domains):
            return Response({'error': 'Use your company email address.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            user = CustomUser.objects.get(email__iexact=email)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except CustomUser.MultipleObjectsReturned:
            return Response(
                {'error': 'Multiple accounts match this email. Contact admin.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.is_active:
            return Response({'error': 'Account disabled. Contact admin'}, status=status.HTTP_403_FORBIDDEN)

        if not user.check_password(password):
            return Response({'error': 'Invalid email or password. Please try again.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data={'email': email, 'password': password})
        if not serializer.is_valid():
            errors = serializer.errors
            msg = None
            for key, val in errors.items():
                if key == 'error':
                    msg = val[0] if isinstance(val, list) else str(val)
                    break
                msg = val[0] if isinstance(val, list) else str(val)
                break
            return Response({'error': msg or 'Invalid credentials.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class SignupView(APIView):
    """POST /api/auth/signup/ – register a new user."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
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
        }, status=status.HTTP_201_CREATED)


class MeView(APIView):
    """GET /api/auth/me/ – return current authenticated user profile."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        data = serializer.data
        data['teamId'] = data.pop('team_id', None)
        return Response(data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'error': 'Old password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password changed successfully.'})


class UserListView(generics.ListCreateAPIView):
    """GET/POST /api/users/ – list all users (admin only)."""
    serializer_class = UserSerializer

    def get_permissions(self):
        from crm.permissions import IsManagerOrAdmin
        return [IsManagerOrAdmin()]

    def get_queryset(self):
        qs = CustomUser.objects.all().order_by('name')
        if self.request.user.role == 'manager':
            qs = qs.filter(team_id=self.request.user.team_id)
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        return qs

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        requested_role = (data.get('role') or 'user').strip().lower()

        if request.user.role == 'manager':
            if requested_role != 'user':
                return Response(
                    {'error': 'Managers can create only user accounts.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            data['role'] = 'user'
            data['team_id'] = request.user.team_id

        password = data.pop('password', ['User@123'])
        if isinstance(password, list):
            password = password[0]
        serializer = SignupSerializer(data={**data, 'password': password, 'confirm_password': password})
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/users/<id>/ – manage a specific user (admin only)."""
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        from crm.permissions import IsAdmin
        return [IsAdmin()]
