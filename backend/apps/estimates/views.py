from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.models import Region, SolarModule
from apps.estimates.models import WeatherSnapshot
from apps.estimates.serializers import (
    CustomComparisonRequestSerializer,
    CustomEstimateInputSerializer,
    EstimateInputSerializer,
    EstimateOutputSerializer,
    RegionComparisonRequestSerializer,
    WeatherSnapshotSerializer,
)
from apps.estimates.services import (
    CustomComparisonService,
    EstimationService,
    EstimationServiceError,
    RegionComparisonService,
    WeatherService,
    WeatherServiceError,
)


class WeatherView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        region_id = request.query_params.get("region_id")
        if not region_id:
            return Response(
                {"detail": "Informe o parametro region_id."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            region = Region.objects.get(pk=region_id)
        except (Region.DoesNotExist, ValueError):
            return Response(
                {"detail": "Regiao nao encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            snapshot, is_fallback = WeatherService().get_snapshot(region)
        except WeatherServiceError:
            return Response(
                {
                    "detail": (
                        "Falha ao consultar dados meteorologicos. "
                        "Nenhum cache disponivel."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        snapshot.is_fallback = is_fallback
        serializer = WeatherSnapshotSerializer(snapshot)
        data = serializer.data

        if is_fallback:
            data["warning"] = "Dados em cache (API indisponivel)."

        return Response(data)


class EstimateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        input_serializer = EstimateInputSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        region_id = input_serializer.validated_data["region_id"]
        module_id = input_serializer.validated_data["module_id"]

        try:
            region = Region.objects.get(pk=region_id)
        except Region.DoesNotExist:
            return Response(
                {"detail": "Regiao nao encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            solar_module = SolarModule.objects.get(pk=module_id, user=request.user)
        except SolarModule.DoesNotExist:
            return Response(
                {"detail": "Modulo nao encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            weather_snapshot, _ = WeatherService().get_snapshot(region)
        except WeatherServiceError:
            return Response(
                {
                    "detail": (
                        "Falha ao consultar dados meteorologicos. "
                        "Nenhum cache disponivel."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if weather_snapshot.irradiation is None:
            return Response(
                {"detail": "Dados climaticos indisponiveis para a regiao."},
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
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        output_serializer = EstimateOutputSerializer(estimate)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


class CustomEstimateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        input_serializer = CustomEstimateInputSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        data = input_serializer.validated_data

        try:
            solar_module = SolarModule.objects.get(
                pk=data["module_id"],
                user=request.user,
            )
        except SolarModule.DoesNotExist:
            return Response(
                {"detail": "Modulo nao encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        region, _ = Region.objects.get_or_create(
            latitude=data["latitude"],
            longitude=data["longitude"],
            source="user",
            defaults={
                "name": data.get("name") or "Ponto selecionado",
                "state": self._normalize_state(data.get("state", "")),
            },
        )

        try:
            weather_data = WeatherService().fetch_by_coordinates(
                latitude=region.latitude,
                longitude=region.longitude,
            )
        except WeatherServiceError:
            return Response(
                {
                    "detail": (
                        "Falha ao consultar dados meteorologicos para o ponto "
                        "selecionado."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        weather_snapshot, _ = WeatherSnapshot.objects.update_or_create(
            region=region,
            date=weather_data.date,
            defaults={
                "irradiation": weather_data.irradiation,
                "temperature": weather_data.temperature,
                "cloud_cover": weather_data.cloud_cover,
                "status": WeatherSnapshot.STATUS_OK,
                "source": "open-meteo",
                "raw_json": weather_data.raw_json,
            },
        )

        if weather_snapshot.irradiation is None:
            return Response(
                {"detail": "Dados climaticos indisponiveis para o ponto selecionado."},
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
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        output_serializer = EstimateOutputSerializer(estimate)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def _normalize_state(self, value):
        value = (value or "").strip()
        if len(value) == 2:
            return value.upper()
        return "--"


class RegionComparisonView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegionComparisonRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        region_ids = serializer.validated_data["region_ids"]
        regions_by_id = Region.objects.in_bulk(region_ids)
        invalid_region_ids = [
            region_id for region_id in region_ids if region_id not in regions_by_id
        ]

        if invalid_region_ids:
            return Response(
                {
                    "detail": "Uma ou mais regioes informadas nao existem.",
                    "invalid_region_ids": invalid_region_ids,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        regions = [regions_by_id[region_id] for region_id in region_ids]
        comparison = RegionComparisonService().compare(regions)

        return Response(
            {
                "metric": "average_energy_estimates",
                "region_ids": region_ids,
                **comparison,
            }
        )


class CustomComparisonView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CustomComparisonRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        locations = serializer.validated_data["locations"]

        try:
            comparison = CustomComparisonService().compare(locations)
        except WeatherServiceError:
            return Response(
                {
                    "detail": (
                        "Falha ao consultar dados meteorologicos para "
                        "uma ou mais localizacoes."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {
                "metric": "realtime_weather_estimate",
                "locations": [
                    {
                        "id": loc["id"],
                        "name": loc["name"],
                        "state": loc.get("state", ""),
                    }
                    for loc in locations
                ],
                **comparison,
            }
        )
