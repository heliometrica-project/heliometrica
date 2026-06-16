from rest_framework import serializers
from django.utils import timezone

from apps.estimates.models import WeatherSnapshot


class WeatherSnapshotSerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source='region.name', read_only=True)
    region_state = serializers.CharField(source='region.state', read_only=True)
    is_fallback = serializers.BooleanField(default=False, read_only=True)
    fallback_message = serializers.SerializerMethodField()

    class Meta:
        model = WeatherSnapshot
        fields = [
            'id',
            'region',
            'region_name',
            'region_state',
            'date',
            'irradiation',
            'temperature',
            'cloud_cover',
            'source',
            'status',
            'created_at',
            'is_fallback',
            'fallback_message',
        ]
        read_only_fields = fields

    def get_fallback_message(self, obj):
        if getattr(obj, 'is_fallback', False):
            if obj.date != timezone.localdate():
                return f'Dados em cache de {obj.date.strftime("%d/%m/%Y")} (API indisponível).'
            return 'Dados em cache (API indisponível).'
        return None
