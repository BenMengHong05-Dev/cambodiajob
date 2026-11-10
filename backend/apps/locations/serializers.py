from rest_framework import serializers

class LocationSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    province_en = serializers.CharField(read_only=True)
    province_km = serializers.CharField(read_only=True)
    city_en = serializers.CharField(read_only=True)
    city_km = serializers.CharField(read_only=True)

