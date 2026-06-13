from django.apps import AppConfig


class CoreConfig(AppConfig):
    """
    App 'core' — entidades de referência do domínio Heliométrica.

    Responsabilidades:
        - Region: municípios/localidades com coordenadas geográficas.
        - SolarModule: painéis solares cadastrados pelo usuário.

    Seed inicial disponível via:
        python manage.py seed_regions
    """

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.core'
    verbose_name = 'Core — Entidades de Referência'
