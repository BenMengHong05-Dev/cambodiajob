from rest_framework import serializers

class SeekerProfileUpdateSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150, required=False)
    phone_number = serializers.CharField(max_length=50, required=False, allow_blank=True, allow_null=True)
    headline = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    summary = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    gender = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True)
    province = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    address = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    current_salary = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    expected_salary = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    salary_currency = serializers.ChoiceField(choices=["USD", "KHR"], default="USD")
    avatar_url = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)


class EducationSerializer(serializers.Serializer):
    institution = serializers.CharField(max_length=255)
    degree = serializers.CharField(max_length=150)
    field_of_study = serializers.CharField(max_length=150, required=False, allow_blank=True, allow_null=True)
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)
    is_current = serializers.BooleanField(default=False)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class WorkExperienceSerializer(serializers.Serializer):
    company_name = serializers.CharField(max_length=255)
    job_title = serializers.CharField(max_length=255)
    location = serializers.CharField(max_length=150, required=False, allow_blank=True, allow_null=True)
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)
    is_current = serializers.BooleanField(default=False)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class SeekerSkillSerializer(serializers.Serializer):
    skill_id = serializers.IntegerField()
    proficiency_level = serializers.ChoiceField(
        choices=["beginner", "intermediate", "advanced", "expert", "fluent", "native"],
        default="intermediate"
    )

