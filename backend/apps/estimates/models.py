"""
Models do app 'estimates'.

Contém o coração do domínio de estimativa solar:
    - WeatherSnapshot: snapshot diário de dados climáticos de uma região,
      consumido da API Open-Meteo e armazenado localmente para evitar
      requisições redundantes.
    - EnergyEstimate: estimativa de geração de energia calculada a partir
      de um módulo solar e dos dados climáticos de uma região.
"""

from django.conf import settings
from django.db import models

from apps.core.models import Region, SolarModule


class WeatherSnapshot(models.Model):
    """
    Snapshot climático diário de uma região.

    Armazena os dados obtidos da API Open-Meteo (ou outra fonte)
    para uma data e região específicas. O campo `unique_together`
    garante que não há duplicação de registros para o mesmo par
    (região, data).

    Campos climáticos:
        - irradiation:  irradiação solar global horizontal em kWh/m²/dia
        - temperature:  temperatura média do ar em °C
        - cloud_cover:  cobertura de nuvens média em %

    O campo `status` indica a qualidade do dado:
        - 'ok'     → dados obtidos com sucesso
        - 'error'  → falha na requisição; campos climáticos podem ser nulos
        - 'cached' → dados servidos de cache local sem nova requisição

    O campo `raw_json` preserva a resposta bruta da API para auditoria/debug.
    """

    STATUS_OK = 'ok'
    STATUS_ERROR = 'error'
    STATUS_CACHED = 'cached'
    STATUS_CHOICES = [
        (STATUS_OK, 'OK'),
        (STATUS_ERROR, 'Erro'),
        (STATUS_CACHED, 'Cacheado'),
    ]

    region = models.ForeignKey(
        Region,
        on_delete=models.CASCADE,
        related_name='weather_snapshots',
        verbose_name='Região',
    )
    date = models.DateField(
        verbose_name='Data',
        help_text='Data à qual o snapshot se refere (YYYY-MM-DD).',
    )
    irradiation = models.DecimalField(
        max_digits=7,
        decimal_places=3,
        null=True,
        verbose_name='Irradiação (kWh/m²/dia)',
        help_text='Irradiação solar global horizontal média do dia.',
    )
    temperature = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        verbose_name='Temperatura (°C)',
        help_text='Temperatura média do ar em graus Celsius.',
    )
    cloud_cover = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        verbose_name='Cobertura de Nuvens (%)',
        help_text='Percentual médio de cobertura de nuvens no dia.',
    )
    source = models.CharField(
        max_length=100,
        default='open-meteo',
        verbose_name='Fonte',
        help_text='Identificador da fonte dos dados climáticos.',
    )
    raw_json = models.JSONField(
        null=True,
        blank=True,
        verbose_name='JSON Bruto',
        help_text='Resposta bruta da API para fins de auditoria e debug.',
    )
    status = models.CharField(
        max_length=20,
        default=STATUS_OK,
        choices=STATUS_CHOICES,
        verbose_name='Status',
        help_text='Qualidade/origem do dado: ok, error ou cached.',
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')

    class Meta:
        verbose_name = 'Snapshot Climático'
        verbose_name_plural = 'Snapshots Climáticos'
        unique_together = ('region', 'date')
        ordering = ['-date']

    def __str__(self) -> str:
        return f'{self.region} — {self.date} [{self.status}]'


class EnergyEstimate(models.Model):
    """
    Estimativa de geração de energia de um sistema fotovoltaico.

    Calculada a partir de:
        - Um módulo solar (SolarModule) definido pelo usuário;
        - Os dados climáticos (WeatherSnapshot) de uma Region específica.

    Campos de resultado:
        - daily_kwh:       geração média diária estimada (kWh)
        - monthly_kwh:     projeção mensal (kWh)
        - yearly_kwh:      projeção anual (kWh)
        - efficiency_index: índice de eficiência do sistema (PR — Performance Ratio)

    O campo `losses_factor` representa as perdas sistêmicas (cabeamento,
    inversores, temperatura, sujeira). Padrão: 0.80 (80% de aproveitamento).

    Relacionamentos:
        - user   → estimativa pertence ao usuário que a gerou
        - region → localização para consulta climática
        - module → especificações técnicas do painel (FK nullable via SET_NULL,
                   permitindo preservar a estimativa caso o módulo seja excluído)
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='energy_estimates',
        verbose_name='Usuário',
    )
    region = models.ForeignKey(
        Region,
        on_delete=models.CASCADE,
        related_name='energy_estimates',
        verbose_name='Região',
    )
    module = models.ForeignKey(
        SolarModule,
        on_delete=models.SET_NULL,
        null=True,
        related_name='energy_estimates',
        verbose_name='Módulo Solar',
        help_text='Painel solar utilizado no cálculo. Preservado mesmo se o módulo for excluído.',
    )
    weather_snapshot = models.ForeignKey(
        'WeatherSnapshot',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='energy_estimates',
        verbose_name='Snapshot Climático',
        help_text='Snapshot climático utilizado no cálculo.',
    )
    daily_kwh = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        verbose_name='Energia Diária (kWh)',
    )
    monthly_kwh = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        verbose_name='Energia Mensal (kWh)',
    )
    yearly_kwh = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        verbose_name='Energia Anual (kWh)',
    )
    efficiency_index = models.DecimalField(
        max_digits=8,
        decimal_places=4,
        verbose_name='Índice de Eficiência (PR)',
        help_text='Performance Ratio do sistema fotovoltaico.',
    )
    losses_factor = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=0.80,
        verbose_name='Fator de Perdas',
        help_text='Fração de energia aproveitada após perdas sistêmicas (0.0–1.0). Padrão: 0.80.',
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')

    class Meta:
        verbose_name = 'Estimativa de Energia'
        verbose_name_plural = 'Estimativas de Energia'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'Estimativa #{self.pk} — {self.region} ({self.user})'
