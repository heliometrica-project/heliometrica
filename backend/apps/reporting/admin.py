"""
Admin do app 'reporting' — GenerationHistory e ReportExport.
"""

from django.contrib import admin

from .models import GenerationHistory, ReportExport


@admin.register(GenerationHistory)
class GenerationHistoryAdmin(admin.ModelAdmin):
    """Administração do histórico nomeado de estimativas salvas pelos usuários."""

    list_display = ['title', 'user', 'estimate', 'updated_at', 'created_at']
    search_fields = ['title', 'user__username', 'notes']
    ordering = ['-updated_at']
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['user', 'estimate']


@admin.register(ReportExport)
class ReportExportAdmin(admin.ModelAdmin):
    """Administração de exportações de relatório (CSV/PDF)."""

    list_display = ['id', 'user', 'estimate', 'format', 'file_name', 'generated_at']
    list_filter = ['format']
    search_fields = ['user__username', 'file_name']
    ordering = ['-generated_at']
    readonly_fields = ['generated_at']
    raw_id_fields = ['user', 'estimate']
