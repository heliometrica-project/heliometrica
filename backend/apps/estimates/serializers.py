from rest_framework import serializers

from apps.estimates.models import WeatherSnapshot


class WeatherSnapshotSerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source='region.name', read_only=True)
    region_state = serializers.CharField(source='region.state', read_only=True)

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
        ]
        read_only_fields = fields
