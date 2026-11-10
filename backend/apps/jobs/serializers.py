from rest_framework import serializers

class JobSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    company_id = serializers.IntegerField(read_only=True)
    category_id = serializers.IntegerField(required=False, allow_null=True)
    title = serializers.CharField(max_length=255)
    title_km = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    slug = serializers.CharField(read_only=True)
    description = serializers.CharField()
    description_km = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    requirements = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    employment_type = serializers.ChoiceField(
        choices=["full_time", "part_time", "internship", "contract", "freelance"],
        default="full_time"
    )
    workplace_type = serializers.ChoiceField(
        choices=["on_site", "remote", "hybrid"],
        default="on_site"
    )
    experience_level = serializers.ChoiceField(
        choices=["fresh_graduate", "entry", "mid", "senior", "lead", "executive"],
        default="entry"
    )
    education_level = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    province = serializers.CharField(max_length=100)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    address = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    salary_min = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    salary_max = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    salary_currency = serializers.ChoiceField(choices=["USD", "KHR"], default="USD")
    is_salary_negotiable = serializers.BooleanField(default=False)
    vacancies_count = serializers.IntegerField(default=1)
    status = serializers.ChoiceField(
        choices=["draft", "published", "closed", "expired", "suspended"],
        default="published"
    )
    skill_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True
    )


class JobStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["draft", "published", "closed"])

