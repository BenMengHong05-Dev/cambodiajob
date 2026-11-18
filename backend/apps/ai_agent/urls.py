from django.urls import path
from .views import (
    AIChatView,
    AIProfileMatchView,
    AIMarketChartView,
    AIStatusView,
    AICoverLetterView,
)

urlpatterns = [
    path("chat/", AIChatView.as_view(), name="ai-chat"),
    path("status/", AIStatusView.as_view(), name="ai-status"),
    path("profile-match/", AIProfileMatchView.as_view(), name="ai-profile-match"),
    path("market-chart/", AIMarketChartView.as_view(), name="ai-market-chart"),
    path("generate-cover-letter/", AICoverLetterView.as_view(), name="ai-generate-cover-letter"),
]
