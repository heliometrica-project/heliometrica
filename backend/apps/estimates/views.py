from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.models import Region
from apps.estimates.serializers import WeatherSnapshotSerializer
from apps.estimates.services import WeatherService, WeatherServiceError


class WeatherView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        region_id = request.query_params.get('region_id')
        if not region_id:
            return Response(
                {'detail': 'Informe o parametro region_id.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            region = Region.objects.get(pk=region_id)
        except (Region.DoesNotExist, ValueError):
            return Response(
                {'detail': 'Regiao nao encontrada.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            snapshot = WeatherService().get_snapshot(region)
        except WeatherServiceError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        serializer = WeatherSnapshotSerializer(snapshot)
        return Response(serializer.data)
