from django.apps import AppConfig


class EstimatesConfig(AppConfig):
    """
    App 'estimates' — coração do domínio de estimativa solar.

    Responsabilidades:
        - WeatherSnapshot: dados climáticos diários por região (irradiação,
          temperatura, cobertura de nuvens), obtidos via Open-Meteo.
        - EnergyEstimate: estimativa de geração de energia (diária/mensal/anual)
          calculada a partir de um módulo solar e dados climáticos de uma região.
    """

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.estimates'
    verbose_name = 'Estimates — Estimativas de Energia'
