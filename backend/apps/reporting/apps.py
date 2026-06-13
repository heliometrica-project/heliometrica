from django.apps import AppConfig


class ReportingConfig(AppConfig):
    """
    App 'reporting' — camada de saída e histórico do Heliométrica.

    Responsabilidades:
        - GenerationHistory: registro nomeado de estimativas salvas pelo usuário,
          com suporte a anotações (notes) e rastreamento de alterações.
        - ReportExport: metadados de relatórios exportados (CSV ou PDF)
          gerados a partir de uma estimativa de energia.
    """

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.reporting'
    verbose_name = 'Reporting — Histórico e Exportações'
