from rest_framework import serializers
import re


class JobCategorySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name_en = serializers.CharField(read_only=True)
    name_km = serializers.CharField(read_only=True)
    slug = serializers.CharField(read_only=True)
    icon = serializers.CharField(read_only=True)
    jobs_count = serializers.IntegerField(read_only=True, default=0)


class JobCategoryCreateUpdateSerializer(serializers.Serializer):
    name_en = serializers.CharField(max_length=100, required=True)
    name_km = serializers.CharField(max_length=100, required=True)
    slug = serializers.CharField(max_length=100, required=False, allow_blank=True)
    icon = serializers.CharField(max_length=50, required=False, allow_blank=True, default="briefcase")

    def validate_name_en(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("English category name is required.")
        return val

    def validate_name_km(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Khmer category name is required.")
        return val

    def validate_slug(self, value):
        if not value:
            return ""
        val = value.strip().lower()
        val = re.sub(r'[^a-z0-9\-]', '-', val)
        val = re.sub(r'-+', '-', val).strip('-')
        return val


