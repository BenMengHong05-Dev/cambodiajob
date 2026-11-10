from rest_framework import serializers

class JobCategorySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name_en = serializers.CharField(read_only=True)
    name_km = serializers.CharField(read_only=True)
    slug = serializers.CharField(read_only=True)
    icon = serializers.CharField(read_only=True)
    jobs_count = serializers.IntegerField(read_only=True, default=0)

