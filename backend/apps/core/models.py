"""
Models do app 'core'.

Contém as entidades de referência do domínio Heliométrica:
    - Region: representa um município/localidade com coordenadas geográficas,
      usado como âncora para busca de dados climáticos.
    - SolarModule: painel solar cadastrado por um usuário, com especificações
      técnicas utilizadas nos cálculos de estimativa.
"""

from django.conf import settings
from django.db import models


class Region(models.Model):
    """
    Município ou localidade georreferenciada.

    Serve como ponto de referência para consultas climáticas
    e para associar estimativas de energia a uma localização específica.

    O campo `source` indica a origem do registro:
        - 'seed'  → inserido pelo comando `python manage.py seed_regions`
        - 'user'  → criado manualmente via API/admin (uso futuro)
    """

    name = models.CharField(
        max_length=200,
        verbose_name='Nome',
        help_text='Nome do município ou localidade.',
    )
    state = models.CharField(
        max_length=2,
        verbose_name='UF',
        help_text='Sigla do estado, ex: "RN".',
    )
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        verbose_name='Latitude',
        help_text='Latitude em graus decimais (WGS 84).',
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        verbose_name='Longitude',
        help_text='Longitude em graus decimais (WGS 84).',
    )
    source = models.CharField(
        max_length=100,
        default='seed',
        verbose_name='Fonte',
        help_text='"seed" para regiões do fixture inicial; "user" para registros manuais.',
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')

    class Meta:
        verbose_name = 'Região'
        verbose_name_plural = 'Regiões'
        ordering = ['state', 'name']

    def __str__(self) -> str:
        return f'{self.name} - {self.state}'


class SolarModule(models.Model):
    """
    Painel solar cadastrado por um usuário.

    Armazena as especificações técnicas necessárias para o cálculo de
    estimativa de geração de energia:
        - power_wp:   potência de pico em Watts-pico (Wp)
        - efficiency: eficiência de conversão em percentual (%)
        - area_m2:    área total do painel em metros quadrados (m²)
        - quantity:   número de painéis no conjunto

    Relacionamento: cada módulo pertence a exatamente um usuário (User → SolarModule 1:N).
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='solar_modules',
        verbose_name='Usuário',
    )
    model = models.CharField(
        max_length=200,
        verbose_name='Modelo',
        help_text='Identificação comercial do painel (ex: "RS-540M10").',
    )
    manufacturer = models.CharField(
        max_length=200,
        verbose_name='Fabricante',
        help_text='Nome do fabricante (ex: "Canadian Solar").',
    )
    power_wp = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        verbose_name='Potência (Wp)',
        help_text='Potência de pico em Watts-pico.',
    )
    efficiency = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name='Eficiência (%)',
        help_text='Eficiência de conversão fotovoltaica em percentual.',
    )
    area_m2 = models.DecimalField(
        max_digits=6,
        decimal_places=3,
        verbose_name='Área (m²)',
        help_text='Área total do painel em metros quadrados.',
    )
    quantity = models.PositiveIntegerField(
        default=1,
        verbose_name='Quantidade',
        help_text='Número de painéis no conjunto.',
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')

    class Meta:
        verbose_name = 'Módulo Solar'
        verbose_name_plural = 'Módulos Solares'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'{self.manufacturer} {self.model} ({self.power_wp} Wp)'
