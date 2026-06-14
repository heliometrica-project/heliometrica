from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.core.views import RegionViewSet

router = DefaultRouter()
router.register(r'regions', RegionViewSet, basename='region')

urlpatterns = [
    path('', include(router.urls)),
]
