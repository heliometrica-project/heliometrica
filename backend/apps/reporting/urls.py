from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.reporting.views import GenerationHistoryViewSet

router = DefaultRouter()
router.register(r'history', GenerationHistoryViewSet, basename='history')

urlpatterns = [
    path('', include(router.urls)),
]
