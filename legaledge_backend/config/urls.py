"""
URL configuration for LegalEdge CRM backend.
"""
from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.http import JsonResponse
from django.views.static import serve as static_serve


def api_root(request):
    return JsonResponse({
        "project": "LegalEdge CRM API",
        "status": "online",
        "endpoints": ["/admin/", "/api/auth/", "/api/"],
    })


urlpatterns = [
    path('', api_root),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('crm.urls')),
]

if getattr(settings, 'SERVE_STATIC_LOCAL', False):
    urlpatterns += [
        re_path(
            r'^static/(?P<path>.*)$',
            static_serve,
            {'document_root': settings.STATIC_ROOT},
        ),
    ]
