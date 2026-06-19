from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls')),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/', include('apps.health.urls')),
    path('api/', include('apps.core.urls')),
    path('api/', include('apps.estimates.urls')),
    path('api/', include('apps.reporting.urls')),
]
