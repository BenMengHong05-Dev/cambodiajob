from rest_framework import serializers

class CompanySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(max_length=255)
    slug = serializers.CharField(read_only=True)
    logo_url = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)
    banner_url = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    website = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    industry = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    company_size = serializers.CharField(max_length=50, required=False, allow_blank=True, allow_null=True)
    province = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    address = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    national_id_card = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    business_license_no = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    verification_status = serializers.CharField(read_only=True)
    verified_at = serializers.DateTimeField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    jobs_count = serializers.IntegerField(read_only=True, default=0)

