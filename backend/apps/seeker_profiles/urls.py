from django.urls import path
from .views import (
    SeekerProfileView,
    SeekerEducationView,
    SeekerExperienceView,
    SeekerSkillView,
)

urlpatterns = [
    path("profile/", SeekerProfileView.as_view(), name="seeker-profile"),
    path("educations/", SeekerEducationView.as_view(), name="seeker-educations"),
    path("educations/<int:pk>/", SeekerEducationView.as_view(), name="seeker-education-delete"),
    path("experiences/", SeekerExperienceView.as_view(), name="seeker-experiences"),
    path("experiences/<int:pk>/", SeekerExperienceView.as_view(), name="seeker-experience-delete"),
    path("skills/", SeekerSkillView.as_view(), name="seeker-skills"),
    path("skills/<int:skill_id>/", SeekerSkillView.as_view(), name="seeker-skill-delete"),
]

