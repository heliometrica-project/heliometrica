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


class CustomLocationItemSerializer(serializers.Serializer):
    id = serializers.IntegerField(min_value=1)
    name = serializers.CharField(max_length=200)
    state = serializers.CharField(max_length=2, default="", allow_blank=True)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6)


class CustomComparisonRequestSerializer(serializers.Serializer):
    locations = serializers.ListField(
        child=CustomLocationItemSerializer(),
        min_length=2,
    )

    def validate_locations(self, value):
        seen = set()
        unique = []
        for loc in value:
            key = (round(float(loc["latitude"]), 4), round(float(loc["longitude"]), 4))
            if key not in seen:
                seen.add(key)
                unique.append(loc)
        if len(unique) < 2:
            raise serializers.ValidationError(
                "Informe pelo menos 2 localizacoes distintas para comparar."
            )
        return unique


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
