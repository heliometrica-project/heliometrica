from rest_framework import permissions, viewsets

from apps.reporting.models import GenerationHistory
from apps.reporting.serializers import GenerationHistorySerializer


class GenerationHistoryViewSet(viewsets.ModelViewSet):
    serializer_class = GenerationHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return GenerationHistory.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
