from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated

from apps.core.models import Region, SolarModule
from apps.core.serializers import RegionSerializer, SolarModuleSerializer


class RegionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Region.objects.all()
    serializer_class = RegionSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'state']


class SolarModuleViewSet(viewsets.ModelViewSet):
    serializer_class = SolarModuleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SolarModule.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
