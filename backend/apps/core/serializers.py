from rest_framework import serializers

from apps.core.models import Region


class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ['id', 'name', 'state', 'latitude', 'longitude']
