from rest_framework import serializers


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255)
    password = serializers.CharField(min_length=6, write_only=True)
    full_name = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    # Public registration must never be allowed to create administrators.
    role = serializers.ChoiceField(choices=["job_seeker", "employer"], default="job_seeker")
    # For employers, optional initial company name
    company_name = serializers.CharField(max_length=255, required=False, allow_blank=True)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class TokenRefreshSerializer(serializers.Serializer):
    refresh_token = serializers.CharField()


class LogoutSerializer(serializers.Serializer):
    refresh_token = serializers.CharField()


class OAuthLoginSerializer(serializers.Serializer):
    provider = serializers.ChoiceField(choices=["google", "linkedin"], default="google")
    email = serializers.EmailField(required=False, allow_blank=True)
    full_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    avatar_url = serializers.CharField(max_length=500, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=["job_seeker", "employer"], default="job_seeker")
    token = serializers.CharField(required=False, allow_blank=True)
    id_token = serializers.CharField(required=False, allow_blank=True)
    code = serializers.CharField(required=False, allow_blank=True)


class UserSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    email = serializers.EmailField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    phone_number = serializers.CharField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    roles = serializers.ListField(child=serializers.CharField(), read_only=True)
    created_at = serializers.DateTimeField(read_only=True)

