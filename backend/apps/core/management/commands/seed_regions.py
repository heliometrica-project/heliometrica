"""
Management command: seed_regions

Popula a tabela Region com municípios do Rio Grande do Norte,
com ênfase no Alto Oeste Potiguar (microrregião de Pau dos Ferros).

Uso:
    python manage.py seed_regions

Características:
    - Idempotente: usar get_or_create garante que rodar múltiplas vezes
      não duplica registros.
    - Coordenadas em graus decimais (WGS 84), obtidas via IBGE/Google Maps.
    - Todos os registros recebem source='seed' para distinguir de regiões
      criadas manualmente via API.
"""

from django.core.management.base import BaseCommand

from apps.core.models import Region

# ---------------------------------------------------------------------------
# Fixture de municípios do RN
# Formato: nome, UF, latitude, longitude (WGS 84)
# ---------------------------------------------------------------------------
REGIONS = [
    # --- Alto Oeste Potiguar (microrregião de Pau dos Ferros) ---
    {"name": "Pau dos Ferros",    "state": "RN", "latitude": -6.108900, "longitude": -38.204400},
    {"name": "Umarizal",          "state": "RN", "latitude": -5.992500, "longitude": -37.831400},
    {"name": "Marcelino Vieira",  "state": "RN", "latitude": -6.285000, "longitude": -38.175900},
    {"name": "Rafael Fernandes",  "state": "RN", "latitude": -6.086700, "longitude": -38.005600},
    {"name": "Luís Gomes",        "state": "RN", "latitude": -6.408300, "longitude": -38.381700},
    {"name": "Major Sales",       "state": "RN", "latitude": -6.390300, "longitude": -38.321700},
    {"name": "Encanto",           "state": "RN", "latitude": -6.109800, "longitude": -38.516700},
    {"name": "Alexandria",        "state": "RN", "latitude": -6.407600, "longitude": -38.016900},
    # --- Outras regiões representativas do RN ---
    {"name": "Mossoró",           "state": "RN", "latitude": -5.187800, "longitude": -37.344100},
    {"name": "Natal",             "state": "RN", "latitude": -5.794500, "longitude": -35.211100},
    {"name": "Caicó",             "state": "RN", "latitude": -6.458300, "longitude": -37.097200},
    {"name": "Currais Novos",     "state": "RN", "latitude": -6.259200, "longitude": -36.520000},
]


class Command(BaseCommand):
    help = 'Seed initial regions (municipalities of Rio Grande do Norte, focused on Alto Oeste Potiguar)'

    def handle(self, *args, **kwargs):
        created_count = 0

        for data in REGIONS:
            _, created = Region.objects.get_or_create(
                name=data['name'],
                state=data['state'],
                defaults={
                    'latitude': data['latitude'],
                    'longitude': data['longitude'],
                    'source': 'seed',
                },
            )
            if created:
                created_count += 1

        skipped = len(REGIONS) - created_count
        self.stdout.write(
            self.style.SUCCESS(
                f'{len(REGIONS)} regiões verificadas — '
                f'{created_count} criadas, {skipped} já existiam.'
            )
        )
