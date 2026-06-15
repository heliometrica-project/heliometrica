from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.core.views import RegionViewSet, SolarModuleViewSet

router = DefaultRouter()
router.register(r'regions', RegionViewSet, basename='region')
router.register(r'modules', SolarModuleViewSet, basename='module')

urlpatterns = [
    path('', include(router.urls)),
]
