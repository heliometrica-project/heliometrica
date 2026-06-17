import json
import logging
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from urllib import parse, request
from urllib.error import HTTPError, URLError

from django.conf import settings
from django.utils import timezone

from apps.estimates.models import EnergyEstimate, WeatherSnapshot

logger = logging.getLogger(__name__)


class WeatherServiceError(Exception):
    pass


@dataclass(frozen=True)
class WeatherData:
    date: date
    irradiation: Decimal
    temperature: Decimal
    cloud_cover: Decimal
    raw_json: dict


class WeatherService:
    DAILY_VARIABLES = (
        'temperature_2m_mean',
        'cloud_cover_mean',
        'shortwave_radiation_sum',
    )

    def __init__(self, timeout=None, base_url=None):
        self.timeout = timeout or settings.WEATHER_API_TIMEOUT_SECONDS
        self.base_url = base_url or settings.WEATHER_API_BASE_URL

    FALLBACK_DAYS = 7

    def get_snapshot(self, region):
        today = timezone.localdate()

        cached_snapshot = WeatherSnapshot.objects.filter(
            region=region,
            date=today,
            status__in=[WeatherSnapshot.STATUS_OK, WeatherSnapshot.STATUS_CACHED],
        ).first()

        if cached_snapshot:
            if cached_snapshot.status != WeatherSnapshot.STATUS_CACHED:
                cached_snapshot.status = WeatherSnapshot.STATUS_CACHED
                cached_snapshot.save(update_fields=['status'])
            return cached_snapshot, False

        try:
            weather_data = self.fetch_by_coordinates(
                latitude=region.latitude,
                longitude=region.longitude,
            )
        except WeatherServiceError:
            fallback_snapshot = self._get_fallback_snapshot(region)
            if fallback_snapshot:
                return fallback_snapshot, True

            WeatherSnapshot.objects.get_or_create(
                region=region,
                date=timezone.localdate(),
                defaults={
                    'status': WeatherSnapshot.STATUS_ERROR,
                    'raw_json': None,
                },
            )
            raise

        snapshot, _ = WeatherSnapshot.objects.update_or_create(
            region=region,
            date=weather_data.date,
            defaults={
                'irradiation': weather_data.irradiation,
                'temperature': weather_data.temperature,
                'cloud_cover': weather_data.cloud_cover,
                'status': WeatherSnapshot.STATUS_OK,
                'source': 'open-meteo',
                'raw_json': weather_data.raw_json,
            },
        )
        return snapshot, False

    def _get_fallback_snapshot(self, region):
        cutoff_date = timezone.localdate() - timedelta(days=self.FALLBACK_DAYS)

        fallback = WeatherSnapshot.objects.filter(
            region=region,
            date__gte=cutoff_date,
            status__in=[WeatherSnapshot.STATUS_OK, WeatherSnapshot.STATUS_CACHED],
        ).order_by('-date').first()

        if fallback:
            if fallback.status != WeatherSnapshot.STATUS_CACHED:
                fallback.status = WeatherSnapshot.STATUS_CACHED
                fallback.save(update_fields=['status'])
            return fallback

        return None

    def fetch_by_coordinates(self, latitude, longitude):
        url = self._build_url(latitude=latitude, longitude=longitude)

        try:
            with request.urlopen(url, timeout=self.timeout) as response:
                payload = json.loads(response.read().decode('utf-8'))
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
            logger.exception('Erro tecnico ao consultar API meteorologica externa.')
            raise WeatherServiceError('Falha ao consultar dados meteorologicos.') from exc

        try:
            return self._map_response(payload)
        except (KeyError, IndexError, TypeError, ValueError, InvalidOperation) as exc:
            logger.exception('Erro tecnico ao normalizar resposta meteorologica externa.')
            raise WeatherServiceError('Resposta meteorologica externa invalida.') from exc

    def _build_url(self, latitude, longitude):
        params = {
            'latitude': str(latitude),
            'longitude': str(longitude),
            'daily': ','.join(self.DAILY_VARIABLES),
            'forecast_days': '1',
            'timezone': 'auto',
        }
        return f'{self.base_url}?{parse.urlencode(params)}'

    def _map_response(self, payload):
        daily = payload['daily']
        units = payload.get('daily_units', {})

        irradiation = self._decimal_from_api(daily['shortwave_radiation_sum'][0], '0.001')
        irradiation_unit = units.get('shortwave_radiation_sum', '')
        if 'MJ' in irradiation_unit:
            irradiation = (irradiation / Decimal('3.6')).quantize(
                Decimal('0.001'),
                rounding=ROUND_HALF_UP,
            )

        return WeatherData(
            date=date.fromisoformat(daily['time'][0]),
            irradiation=irradiation,
            temperature=self._decimal_from_api(daily['temperature_2m_mean'][0], '0.01'),
            cloud_cover=self._decimal_from_api(daily['cloud_cover_mean'][0], '0.01'),
            raw_json=payload,
        )

    def _decimal_from_api(self, value, quantizer):
        return Decimal(str(value)).quantize(Decimal(quantizer), rounding=ROUND_HALF_UP)


class EstimationServiceError(Exception):
    pass


class EstimationService:
    PR = Decimal('0.80')

    def estimate(self, user, region, solar_module, weather_snapshot):
        solar_module_power = Decimal(str(solar_module.power_wp))
        solar_module_qty = Decimal(str(solar_module.quantity))
        irradiation = Decimal(str(weather_snapshot.irradiation))
        efficiency = Decimal(str(solar_module.efficiency))

        if solar_module_power <= 0:
            raise EstimationServiceError('Potência do módulo deve ser maior que zero.')
        if solar_module_qty <= 0:
            raise EstimationServiceError('Quantidade de módulos deve ser maior que zero.')
        if efficiency <= 0 or efficiency > 100:
            raise EstimationServiceError('Eficiência do módulo deve estar entre 0 e 100.')
        if irradiation <= 0:
            raise EstimationServiceError('Irradiação deve ser maior que zero.')

        installed_power_kw = (solar_module_power * solar_module_qty) / Decimal('1000')

        daily_kwh = (installed_power_kw * irradiation * self.PR).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP,
        )
        monthly_kwh = (daily_kwh * 30).quantize(
            Decimal('0.001'), rounding=ROUND_HALF_UP,
        )
        yearly_kwh = (daily_kwh * 365).quantize(
            Decimal('0.001'), rounding=ROUND_HALF_UP,
        )

        estimate = EnergyEstimate.objects.create(
            user=user,
            region=region,
            module=solar_module,
            weather_snapshot=weather_snapshot,
            daily_kwh=daily_kwh,
            monthly_kwh=monthly_kwh,
            yearly_kwh=yearly_kwh,
            efficiency_index=efficiency,
        )
        return estimate
