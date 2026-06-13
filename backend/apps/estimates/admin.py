"""
Admin do app 'estimates' — WeatherSnapshot e EnergyEstimate.
"""

from django.contrib import admin

from .models import EnergyEstimate, WeatherSnapshot


@admin.register(WeatherSnapshot)
class WeatherSnapshotAdmin(admin.ModelAdmin):
    """Administração de snapshots climáticos diários por região."""

    list_display = ['region', 'date', 'irradiation', 'temperature', 'cloud_cover', 'source', 'status', 'created_at']
    list_filter = ['status', 'source', 'region__state']
    search_fields = ['region__name']
    date_hierarchy = 'date'
    ordering = ['-date']
    readonly_fields = ['created_at', 'raw_json']


@admin.register(EnergyEstimate)
class EnergyEstimateAdmin(admin.ModelAdmin):
    """Administração de estimativas de geração de energia."""

    list_display = ['id', 'user', 'region', 'module', 'daily_kwh', 'monthly_kwh', 'yearly_kwh', 'losses_factor', 'created_at']
    list_filter = ['region__state']
    search_fields = ['user__username', 'region__name']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
    raw_id_fields = ['user', 'module']
