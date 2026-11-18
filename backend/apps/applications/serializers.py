from rest_framework import serializers

class ApplyJobSerializer(serializers.Serializer):
    resume_id = serializers.IntegerField(required=False, allow_null=True)
    cover_letter = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class UpdateApplicationStatusSerializer(serializers.Serializer):
    STATUS_CHOICES = [
        "submitted",
        "reviewing",
        "screening",  # alias for reviewing
        "shortlisted",
        "interview",
        "interview_scheduled",  # alias for interview
        "offered",
        "rejected",
        "withdrawn",
    ]

    status = serializers.ChoiceField(choices=STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate_status(self, value):
        mapping = {
            "screening": "reviewing",
            "interview_scheduled": "interview",
        }
        return mapping.get(value, value)

