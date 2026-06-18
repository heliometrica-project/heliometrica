from django.utils import timezone
from rest_framework import serializers

from apps.estimates.models import EnergyEstimate, WeatherSnapshot


class RegionComparisonRequestSerializer(serializers.Serializer):
    region_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        min_length=2,
    )

    def validate_region_ids(self, value):
        unique_ids = list(dict.fromkeys(value))
        if len(unique_ids) < 2:
            raise serializers.ValidationError(
                "Informe pelo menos 2 regioes distintas para comparar."
            )
        return unique_ids


class WeatherSnapshotSerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source="region.name", read_only=True)
    region_state = serializers.CharField(source="region.state", read_only=True)
    is_fallback = serializers.BooleanField(default=False, read_only=True)
    fallback_message = serializers.SerializerMethodField()

    class Meta:
        model = WeatherSnapshot
        fields = [
            "id",
            "region",
            "region_name",
            "region_state",
            "date",
            "irradiation",
            "temperature",
            "cloud_cover",
            "source",
            "status",
            "created_at",
            "is_fallback",
            "fallback_message",
        ]
        read_only_fields = fields

    def get_fallback_message(self, obj):
        if getattr(obj, "is_fallback", False):
            if obj.date != timezone.localdate():
                formatted_date = obj.date.strftime("%d/%m/%Y")
                return f"Dados em cache de {formatted_date} (API indisponível)."
            return "Dados em cache (API indisponível)."
        return None


class EstimateInputSerializer(serializers.Serializer):
    region_id = serializers.IntegerField()
    module_id = serializers.IntegerField()


class EstimateOutputSerializer(serializers.ModelSerializer):
    annual_kwh = serializers.DecimalField(
        source="yearly_kwh",
        max_digits=10,
        decimal_places=3,
        read_only=True,
    )

    class Meta:
        model = EnergyEstimate
        fields = [
            "id",
            "daily_kwh",
            "monthly_kwh",
            "annual_kwh",
            "efficiency_index",
        ]
