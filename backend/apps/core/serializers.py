from rest_framework import serializers

from apps.core.models import Region, SolarModule


class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ['id', 'name', 'state', 'latitude', 'longitude']


class SolarModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = SolarModule
        fields = [
            'id', 'model', 'manufacturer', 'power_wp',
            'efficiency', 'area_m2', 'quantity', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate_power_wp(self, value):
        if value <= 0:
            raise serializers.ValidationError('A potência deve ser maior que zero.')
        return value

    def validate_efficiency(self, value):
        if value <= 0 or value > 100:
            raise serializers.ValidationError(
                'A eficiência deve estar entre 0 e 100%.'
            )
        return value

    def validate_area_m2(self, value):
        if value <= 0:
            raise serializers.ValidationError('A área deve ser maior que zero.')
        return value

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError('A quantidade deve ser maior que zero.')
        return value
