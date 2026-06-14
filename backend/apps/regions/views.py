from rest_framework import viewsets, filters

from apps.core.models import Region
from .serializers import RegionSerializer


class RegionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Region.objects.all()
    serializer_class = RegionSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'state']
