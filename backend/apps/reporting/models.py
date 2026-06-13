"""
Models do app 'reporting'.

Contém os modelos de saída e histórico do Heliométrica:
    - GenerationHistory: registro nomeado de uma estimativa salva pelo usuário,
      com suporte a anotações e rastreamento de última atualização.
    - ReportExport: metadados de um relatório exportado (CSV ou PDF)
      gerado a partir de uma estimativa de energia.
"""

from django.conf import settings
from django.db import models

from apps.estimates.models import EnergyEstimate


class GenerationHistory(models.Model):
    """
    Histórico nomeado de uma estimativa de geração de energia.

    Permite ao usuário salvar e nomear estimativas para consulta futura,
    adicionando anotações e acompanhando mudanças via `updated_at`.

    Relacionamentos:
        - user     → dono do histórico
        - estimate → estimativa associada (CASCADE: excluir a estimativa
                     remove o histórico vinculado)
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='generation_histories',
        verbose_name='Usuário',
    )
    title = models.CharField(
        max_length=300,
        verbose_name='Título',
        help_text='Nome descritivo dado pelo usuário a este histórico.',
    )
    estimate = models.ForeignKey(
        EnergyEstimate,
        on_delete=models.CASCADE,
        related_name='generation_histories',
        verbose_name='Estimativa',
    )
    notes = models.TextField(
        blank=True,
        default='',
        verbose_name='Observações',
        help_text='Anotações livres do usuário sobre esta estimativa.',
    )
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')

    class Meta:
        verbose_name = 'Histórico de Geração'
        verbose_name_plural = 'Históricos de Geração'
        ordering = ['-updated_at']

    def __str__(self) -> str:
        return f'{self.title} ({self.user})'


class ReportExport(models.Model):
    """
    Metadados de um relatório exportado.

    Registra qual usuário gerou o relatório, a partir de qual estimativa,
    em qual formato e com qual nome de arquivo. O arquivo em si não é
    armazenado no banco — apenas os metadados necessários para rastreamento.

    Formatos suportados:
        - 'csv' → planilha de dados brutos
        - 'pdf' → relatório formatado

    Relacionamentos:
        - user     → usuário que solicitou a exportação
        - estimate → estimativa que originou o relatório (CASCADE)
    """

    FORMAT_CSV = 'csv'
    FORMAT_PDF = 'pdf'
    FORMAT_CHOICES = [
        (FORMAT_CSV, 'CSV'),
        (FORMAT_PDF, 'PDF'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='report_exports',
        verbose_name='Usuário',
    )
    estimate = models.ForeignKey(
        EnergyEstimate,
        on_delete=models.CASCADE,
        related_name='report_exports',
        verbose_name='Estimativa',
    )
    format = models.CharField(
        max_length=10,
        default=FORMAT_CSV,
        choices=FORMAT_CHOICES,
        verbose_name='Formato',
        help_text='Formato do arquivo exportado: csv ou pdf.',
    )
    generated_at = models.DateTimeField(auto_now_add=True, verbose_name='Gerado em')
    file_name = models.CharField(
        max_length=300,
        blank=True,
        verbose_name='Nome do Arquivo',
        help_text='Nome do arquivo gerado (sem caminho). Vazio enquanto pendente.',
    )

    class Meta:
        verbose_name = 'Exportação de Relatório'
        verbose_name_plural = 'Exportações de Relatório'
        ordering = ['-generated_at']

    def __str__(self) -> str:
        label = self.file_name or f'Relatório #{self.pk}'
        return f'{label} ({self.format.upper()}) — {self.user}'
