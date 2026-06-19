from rest_framework import serializers

from apps.reporting.models import GenerationHistory


class GenerationHistorySerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source='estimate.region.name', read_only=True)
    region_state = serializers.CharField(source='estimate.region.state', read_only=True)
    daily_kwh = serializers.DecimalField(
        source='estimate.daily_kwh', max_digits=10, decimal_places=3, read_only=True
    )
    monthly_kwh = serializers.DecimalField(
        source='estimate.monthly_kwh', max_digits=10, decimal_places=3, read_only=True
    )
    yearly_kwh = serializers.DecimalField(
        source='estimate.yearly_kwh', max_digits=10, decimal_places=3, read_only=True
    )
    efficiency_index = serializers.DecimalField(
        source='estimate.efficiency_index', max_digits=8,
        decimal_places=4, read_only=True,
    )
    module_model = serializers.CharField(
        source='estimate.module.model', read_only=True, default=None
    )
    module_manufacturer = serializers.CharField(
        source='estimate.module.manufacturer', read_only=True, default=None
    )
    module_power_wp = serializers.DecimalField(
        source='estimate.module.power_wp', max_digits=8, decimal_places=2,
        read_only=True, default=None
    )

    class Meta:
        model = GenerationHistory
        fields = [
            'id',
            'title',
            'estimate',
            'notes',
            'created_at',
            'updated_at',
            'region_name',
            'region_state',
            'daily_kwh',
            'monthly_kwh',
            'yearly_kwh',
            'efficiency_index',
            'module_model',
            'module_manufacturer',
            'module_power_wp',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_estimate(self, value):
        user = self.context['request'].user
        if value.user != user:
            raise serializers.ValidationError(
                'A estimativa informada não pertence ao usuário atual.'
            )
        return value
