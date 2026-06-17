from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.models import Region, SolarModule
from apps.estimates.models import EnergyEstimate
from apps.estimates.serializers import (
    EstimateInputSerializer,
    EstimateOutputSerializer,
    WeatherSnapshotSerializer,
)
from apps.estimates.services import (
    EstimationService,
    EstimationServiceError,
    WeatherService,
    WeatherServiceError,
)


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
            snapshot, is_fallback = WeatherService().get_snapshot(region)
        except WeatherServiceError:
            return Response(
                {'detail': 'Falha ao consultar dados meteorologicos. Nenhum cache disponivel.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        snapshot.is_fallback = is_fallback
        serializer = WeatherSnapshotSerializer(snapshot)
        data = serializer.data

        if is_fallback:
            data['warning'] = 'Dados em cache (API indisponivel).'

        return Response(data)


class EstimateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        input_serializer = EstimateInputSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        region_id = input_serializer.validated_data['region_id']
        module_id = input_serializer.validated_data['module_id']

        try:
            region = Region.objects.get(pk=region_id)
        except Region.DoesNotExist:
            return Response(
                {'detail': 'Regiao nao encontrada.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            solar_module = SolarModule.objects.get(pk=module_id, user=request.user)
        except SolarModule.DoesNotExist:
            return Response(
                {'detail': 'Modulo nao encontrado.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            weather_snapshot, _ = WeatherService().get_snapshot(region)
        except WeatherServiceError:
            return Response(
                {'detail': 'Falha ao consultar dados meteorologicos. Nenhum cache disponivel.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if weather_snapshot.irradiation is None:
            return Response(
                {'detail': 'Dados climaticos indisponiveis para a regiao.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        try:
            estimate = EstimationService().estimate(
                user=request.user,
                region=region,
                solar_module=solar_module,
                weather_snapshot=weather_snapshot,
            )
        except EstimationServiceError as exc:
            return Response(
                {'detail': str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        output_serializer = EstimateOutputSerializer(estimate)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
