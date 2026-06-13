"""
Testes do app 'core' — Region e SolarModule.

Cobertura:
    - Criação de instâncias com campos obrigatórios e valores padrão
    - Representação __str__ de cada model
    - Valores default dos campos opcionais
    - Comportamento CASCADE: excluir User exclui SolarModule vinculado
"""

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.core.models import Region, SolarModule

User = get_user_model()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_user(**kwargs):
    """Cria e retorna um usuário de teste."""
    defaults = {"username": "testuser", "password": "secret"}
    defaults.update(kwargs)
    return User.objects.create_user(**defaults)


def make_region(**kwargs):
    """Cria e retorna uma Region de teste."""
    defaults = {
        "name": "Pau dos Ferros",
        "state": "RN",
        "latitude": Decimal("-6.108900"),
        "longitude": Decimal("-38.204400"),
    }
    defaults.update(kwargs)
    return Region.objects.create(**defaults)


def make_solar_module(user, **kwargs):
    """Cria e retorna um SolarModule de teste vinculado a *user*."""
    defaults = {
        "model": "RS-540M10",
        "manufacturer": "Canadian Solar",
        "power_wp": Decimal("540.00"),
        "efficiency": Decimal("20.90"),
        "area_m2": Decimal("2.583"),
        "quantity": 4,
    }
    defaults.update(kwargs)
    return SolarModule.objects.create(user=user, **defaults)


# ---------------------------------------------------------------------------
# Region
# ---------------------------------------------------------------------------

class RegionModelTest(TestCase):
    """Testes do model Region."""

    def setUp(self):
        self.region = make_region()

    def test_criacao_com_campos_obrigatorios(self):
        """Region é criada com os campos informados corretamente."""
        self.assertEqual(self.region.name, "Pau dos Ferros")
        self.assertEqual(self.region.state, "RN")
        self.assertEqual(self.region.latitude, Decimal("-6.108900"))
        self.assertEqual(self.region.longitude, Decimal("-38.204400"))

    def test_source_default_e_seed(self):
        """O campo source deve ser 'seed' por padrão."""
        self.assertEqual(self.region.source, "seed")

    def test_created_at_preenchido_automaticamente(self):
        """created_at é preenchido automaticamente na criação."""
        self.assertIsNotNone(self.region.created_at)

    def test_str_retorna_nome_e_estado(self):
        """__str__ deve retornar 'Nome - UF'."""
        self.assertEqual(str(self.region), "Pau dos Ferros - RN")

    def test_ordering_por_estado_e_nome(self):
        """Regiões devem ser ordenadas por state e depois name."""
        Region.objects.all().delete()
        make_region(name="Natal", state="RN")
        make_region(name="Mossoró", state="RN")
        make_region(name="Fortaleza", state="CE")
        nomes = list(Region.objects.values_list("name", flat=True))
        self.assertEqual(nomes, ["Fortaleza", "Mossoró", "Natal"])


# ---------------------------------------------------------------------------
# SolarModule
# ---------------------------------------------------------------------------

class SolarModuleModelTest(TestCase):
    """Testes do model SolarModule."""

    def setUp(self):
        self.user = make_user()
        self.module = make_solar_module(self.user)

    def test_criacao_com_campos_obrigatorios(self):
        """SolarModule é criado corretamente com dados técnicos do painel."""
        self.assertEqual(self.module.manufacturer, "Canadian Solar")
        self.assertEqual(self.module.model, "RS-540M10")
        self.assertEqual(self.module.power_wp, Decimal("540.00"))
        self.assertEqual(self.module.efficiency, Decimal("20.90"))
        self.assertEqual(self.module.area_m2, Decimal("2.583"))

    def test_quantity_default_e_um(self):
        """O campo quantity deve ser 1 por padrão."""
        modulo_sem_qty = SolarModule.objects.create(
            user=self.user,
            model="X-100",
            manufacturer="Generic",
            power_wp=Decimal("100.00"),
            efficiency=Decimal("15.00"),
            area_m2=Decimal("1.000"),
        )
        self.assertEqual(modulo_sem_qty.quantity, 1)

    def test_str_inclui_fabricante_modelo_e_potencia(self):
        """__str__ deve incluir fabricante, modelo e potência em Wp."""
        self.assertEqual(str(self.module), "Canadian Solar RS-540M10 (540.00 Wp)")

    def test_fk_usuario(self):
        """SolarModule deve estar vinculado ao usuário correto."""
        self.assertEqual(self.module.user, self.user)

    def test_cascade_ao_deletar_usuario(self):
        """Excluir o User deve excluir os SolarModules vinculados (CASCADE)."""
        module_id = self.module.pk
        self.user.delete()
        self.assertFalse(SolarModule.objects.filter(pk=module_id).exists())

    def test_created_at_preenchido_automaticamente(self):
        """created_at é preenchido automaticamente na criação."""
        self.assertIsNotNone(self.module.created_at)
