"""
Admin do app 'core' — Region e SolarModule.
"""

from django.contrib import admin

from .models import Region, SolarModule


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    """Administração de regiões georreferenciadas."""

    list_display = ['name', 'state', 'latitude', 'longitude', 'source', 'created_at']
    list_filter = ['state', 'source']
    search_fields = ['name', 'state']
    ordering = ['state', 'name']
    readonly_fields = ['created_at']


@admin.register(SolarModule)
class SolarModuleAdmin(admin.ModelAdmin):
    """Administração de módulos solares cadastrados pelos usuários."""

    list_display = ['manufacturer', 'model', 'power_wp', 'efficiency', 'area_m2', 'quantity', 'user', 'created_at']
    list_filter = ['manufacturer']
    search_fields = ['model', 'manufacturer', 'user__username']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
    raw_id_fields = ['user']
