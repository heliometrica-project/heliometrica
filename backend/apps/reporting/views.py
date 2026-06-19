from rest_framework import permissions, viewsets
from rest_framework.decorators import action

from apps.reporting.models import GenerationHistory
from apps.reporting.serializers import GenerationHistorySerializer
from apps.reporting.services import ReportService


class GenerationHistoryViewSet(viewsets.ModelViewSet):
    serializer_class = GenerationHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return GenerationHistory.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['get'], url_path='export')
    def export_csv(self, request, pk=None):
        history = self.get_object()
        service = ReportService()
        response, filename = service.generate_csv_response(
            estimate=history.estimate,
            title=history.title,
        )
        service.register_export(
            user=request.user,
            estimate=history.estimate,
            filename=filename,
        )
        return response
