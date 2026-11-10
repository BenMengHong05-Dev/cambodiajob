from rest_framework import serializers

class ApplyJobSerializer(serializers.Serializer):
    resume_id = serializers.IntegerField(required=False, allow_null=True)
    cover_letter = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class UpdateApplicationStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=["submitted", "reviewing", "shortlisted", "interview", "offered", "rejected", "withdrawn"]
    )
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)

