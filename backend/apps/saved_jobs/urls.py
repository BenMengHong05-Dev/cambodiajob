from django.urls import path
from .views import SeekerSavedJobsView

urlpatterns = [
    path("saved/", SeekerSavedJobsView.as_view(), name="seeker-saved-jobs"),
]

