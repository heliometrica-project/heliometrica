"""
Testes do app 'estimates' — WeatherSnapshot e EnergyEstimate.

Cobertura:
    - Criação de instâncias com campos obrigatórios e valores padrão
    - Representação __str__ de cada model
    - Constraint unique_together em WeatherSnapshot (region, date)
    - Campos nullable: irradiation, temperature, cloud_cover
    - Comportamento SET_NULL: excluir SolarModule preserva EnergyEstimate
    - Comportamento CASCADE: excluir User/Region exclui EnergyEstimate
"""

import datetime
import json
from decimal import Decimal
from unittest.mock import patch
from urllib.error import URLError

from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.core.models import Region, SolarModule
from apps.estimates.models import EnergyEstimate, WeatherSnapshot
from apps.estimates.services import WeatherService, WeatherServiceError

User = get_user_model()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_user(username="testuser"):
    return User.objects.create_user(username=username, password="secret")


def make_region(name="Pau dos Ferros", state="RN"):
    return Region.objects.create(
        name=name,
        state=state,
        latitude=Decimal("-6.108900"),
        longitude=Decimal("-38.204400"),
    )


def make_solar_module(user):
    return SolarModule.objects.create(
        user=user,
        model="RS-540M10",
        manufacturer="Canadian Solar",
        power_wp=Decimal("540.00"),
        efficiency=Decimal("20.90"),
        area_m2=Decimal("2.583"),
    )


def make_energy_estimate(user, region, module=None, **kwargs):
    """Cria e retorna uma EnergyEstimate com valores padrão razoáveis."""
    defaults = {
        "daily_kwh": Decimal("8.640"),
        "monthly_kwh": Decimal("259.200"),
        "yearly_kwh": Decimal("3110.400"),
        "efficiency_index": Decimal("0.7500"),
        "losses_factor": Decimal("0.80"),
    }
    defaults.update(kwargs)
    return EnergyEstimate.objects.create(user=user, region=region, module=module, **defaults)


def make_weather_snapshot(region, date=None, **kwargs):
    """Cria e retorna um WeatherSnapshot para a região e data fornecidas."""
    if date is None:
        date = datetime.date(2024, 6, 1)
    defaults = {
        "irradiation": Decimal("5.500"),
        "temperature": Decimal("28.50"),
        "cloud_cover": Decimal("20.00"),
        "status": WeatherSnapshot.STATUS_OK,
    }
    defaults.update(kwargs)
    return WeatherSnapshot.objects.create(region=region, date=date, **defaults)


# ---------------------------------------------------------------------------
# WeatherSnapshot
# ---------------------------------------------------------------------------

class WeatherSnapshotModelTest(TestCase):
    """Testes do model WeatherSnapshot."""

    def setUp(self):
        self.region = make_region()
        self.today = datetime.date(2024, 6, 1)
        self.snapshot = make_weather_snapshot(self.region, date=self.today)

    def test_criacao_com_campos_obrigatorios(self):
        """WeatherSnapshot é criado com campos climáticos corretos."""
        self.assertEqual(self.snapshot.region, self.region)
        self.assertEqual(self.snapshot.date, self.today)
        self.assertEqual(self.snapshot.irradiation, Decimal("5.500"))
        self.assertEqual(self.snapshot.temperature, Decimal("28.50"))
        self.assertEqual(self.snapshot.cloud_cover, Decimal("20.00"))

    def test_status_default_e_ok(self):
        """O campo status deve ser 'ok' por padrão."""
        snap = WeatherSnapshot.objects.create(region=self.region, date=datetime.date(2024, 6, 2))
        self.assertEqual(snap.status, WeatherSnapshot.STATUS_OK)

    def test_source_default_e_open_meteo(self):
        """O campo source deve ser 'open-meteo' por padrão."""
        snap = WeatherSnapshot.objects.create(region=self.region, date=datetime.date(2024, 6, 3))
        self.assertEqual(snap.source, "open-meteo")

    def test_campos_climaticos_podem_ser_nulos(self):
        """irradiation, temperature e cloud_cover aceitam null."""
        snap = WeatherSnapshot.objects.create(
            region=self.region,
            date=datetime.date(2024, 6, 4),
            status=WeatherSnapshot.STATUS_ERROR,
        )
        self.assertIsNone(snap.irradiation)
        self.assertIsNone(snap.temperature)
        self.assertIsNone(snap.cloud_cover)

    def test_unique_together_region_date(self):
        """Não deve ser possível criar dois snapshots para a mesma (região, data)."""
        with self.assertRaises(IntegrityError):
            WeatherSnapshot.objects.create(region=self.region, date=self.today)

    def test_str_inclui_regiao_data_e_status(self):
        """__str__ deve incluir região, data e status."""
        esperado = f"{self.region} — {self.today} [ok]"
        self.assertEqual(str(self.snapshot), esperado)

    def test_raw_json_pode_ser_nulo(self):
        """O campo raw_json aceita null e blank."""
        self.assertIsNone(self.snapshot.raw_json)

    def test_cascade_ao_deletar_regiao(self):
        """Excluir a Region deve excluir os WeatherSnapshots vinculados (CASCADE)."""
        snap_id = self.snapshot.pk
        self.region.delete()
        self.assertFalse(WeatherSnapshot.objects.filter(pk=snap_id).exists())


# ---------------------------------------------------------------------------
# EnergyEstimate
# ---------------------------------------------------------------------------

class EnergyEstimateModelTest(TestCase):
    """Testes do model EnergyEstimate."""

    def setUp(self):
        self.user = make_user()
        self.region = make_region()
        self.module = make_solar_module(self.user)
        self.estimate = make_energy_estimate(self.user, self.region, module=self.module)

    def test_criacao_com_todos_os_campos(self):
        """EnergyEstimate é criada com relacionamentos e campos numéricos corretos."""
        self.assertEqual(self.estimate.user, self.user)
        self.assertEqual(self.estimate.region, self.region)
        self.assertEqual(self.estimate.module, self.module)
        self.assertEqual(self.estimate.daily_kwh, Decimal("8.640"))
        self.assertEqual(self.estimate.monthly_kwh, Decimal("259.200"))
        self.assertEqual(self.estimate.yearly_kwh, Decimal("3110.400"))

    def test_losses_factor_default(self):
        """O campo losses_factor deve ser 0.80 por padrão."""
        estimate = make_energy_estimate(self.user, self.region)
        self.assertEqual(estimate.losses_factor, Decimal("0.80"))

    def test_str_inclui_pk_regiao_e_usuario(self):
        """__str__ deve incluir o pk, região e usuário."""
        esperado = f"Estimativa #{self.estimate.pk} — {self.region} ({self.user})"
        self.assertEqual(str(self.estimate), esperado)

    def test_set_null_ao_deletar_modulo(self):
        """Excluir o SolarModule deve setar module=None na estimativa (SET_NULL)."""
        estimate_id = self.estimate.pk
        self.module.delete()
        self.estimate.refresh_from_db()
        self.assertIsNone(self.estimate.module)
        # A estimativa em si deve continuar existindo
        self.assertTrue(EnergyEstimate.objects.filter(pk=estimate_id).exists())

    def test_cascade_ao_deletar_usuario(self):
        """Excluir o User deve excluir as EnergyEstimates vinculadas (CASCADE)."""
        estimate_id = self.estimate.pk
        self.user.delete()
        self.assertFalse(EnergyEstimate.objects.filter(pk=estimate_id).exists())

    def test_cascade_ao_deletar_regiao(self):
        """Excluir a Region deve excluir as EnergyEstimates vinculadas (CASCADE)."""
        estimate_id = self.estimate.pk
        self.region.delete()
        self.assertFalse(EnergyEstimate.objects.filter(pk=estimate_id).exists())

    def test_created_at_preenchido_automaticamente(self):
        """created_at é preenchido automaticamente na criação."""
        self.assertIsNotNone(self.estimate.created_at)

    def test_module_pode_ser_nulo(self):
        """EnergyEstimate pode ser criada sem módulo (module=None)."""
        estimate = make_energy_estimate(self.user, self.region, module=None)
        self.assertIsNone(estimate.module)


# ---------------------------------------------------------------------------
# WeatherService / API
# ---------------------------------------------------------------------------

class FakeWeatherResponse:
    def __init__(self, payload):
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False

    def read(self):
        return json.dumps(self.payload).encode('utf-8')


def make_open_meteo_payload(snapshot_date=None):
    if snapshot_date is None:
        snapshot_date = timezone.localdate()

    return {
        'daily': {
            'time': [snapshot_date.isoformat()],
            'temperature_2m_mean': [28.5],
            'cloud_cover_mean': [42],
            'shortwave_radiation_sum': [20.52],
        },
        'daily_units': {
            'temperature_2m_mean': 'C',
            'cloud_cover_mean': '%',
            'shortwave_radiation_sum': 'MJ/m2',
        },
    }


class WeatherApiTest(APITestCase):
    def setUp(self):
        self.region = make_region()

    @patch('apps.estimates.services.request.urlopen')
    def test_weather_endpoint_returns_normalized_data_and_saves_snapshot(self, urlopen_mock):
        urlopen_mock.return_value = FakeWeatherResponse(make_open_meteo_payload())

        response = self.client.get(reverse('weather'), {'region_id': self.region.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['region'], self.region.id)
        self.assertEqual(response.data['irradiation'], '5.700')
        self.assertEqual(response.data['temperature'], '28.50')
        self.assertEqual(response.data['cloud_cover'], '42.00')
        self.assertEqual(response.data['status'], WeatherSnapshot.STATUS_OK)

        snapshot = WeatherSnapshot.objects.get(region=self.region)
        self.assertEqual(snapshot.irradiation, Decimal('5.700'))
        self.assertEqual(snapshot.temperature, Decimal('28.50'))
        self.assertEqual(snapshot.cloud_cover, Decimal('42.00'))
        self.assertEqual(snapshot.raw_json['daily']['cloud_cover_mean'], [42])

    @patch('apps.estimates.services.request.urlopen')
    def test_weather_endpoint_returns_cached_snapshot_without_external_call(self, urlopen_mock):
        snapshot = make_weather_snapshot(self.region, date=timezone.localdate())

        response = self.client.get(reverse('weather'), {'region_id': self.region.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], snapshot.id)
        self.assertEqual(response.data['status'], WeatherSnapshot.STATUS_CACHED)
        urlopen_mock.assert_not_called()

    @patch('apps.estimates.services.request.urlopen')
    def test_weather_service_logs_technical_error(self, urlopen_mock):
        urlopen_mock.side_effect = URLError('timeout')

        with self.assertLogs('apps.estimates.services', level='ERROR') as logs:
            with self.assertRaises(WeatherServiceError):
                WeatherService().get_snapshot(self.region)

        self.assertTrue(
            any('Erro tecnico ao consultar API meteorologica externa.' in message for message in logs.output)
        )
        snapshot = WeatherSnapshot.objects.get(region=self.region, date=timezone.localdate())
        self.assertEqual(snapshot.status, WeatherSnapshot.STATUS_ERROR)
