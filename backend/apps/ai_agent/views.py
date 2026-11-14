import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.conf import settings

from common.permissions import IsAuthenticatedCustom
from .agent_service import process_ai_agent_chat, get_market_chart_data, find_matching_jobs, get_seeker_profile_data


class AIChatView(APIView):
    """
    General AI Platform Agent conversational endpoint powered by Google Gemini.
    Accepts natural language queries from seekers, employers, and visitors.
    Matches live jobs, generates salary charts, and responds via Gemini API.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        message = request.data.get("message", "").strip()
        history = request.data.get("history", [])
        api_key = request.data.get("api_key")

        if not message:
            return Response(
                {"success": False, "message": "Message is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Extract user if authenticated
        user = getattr(request, "user", None)
        user_id = getattr(user, "id", None) if getattr(user, "is_authenticated", False) else None

        agent_result = process_ai_agent_chat(
            message=message,
            user_id=user_id,
            history=history,
            api_key=api_key,
        )

        return Response({
            "success": True,
            "data": agent_result,
        })


class AIStatusView(APIView):
    """
    Check AI Agent status and whether Google Gemini is configured.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        has_key = bool(
            getattr(settings, "GEMINI_API_KEY", "").strip()
            or os.getenv("GEMINI_API_KEY", "").strip()
        )
        return Response({
            "success": True,
            "data": {
                "gemini_configured": has_key,
                "provider": "google_gemini" if has_key else "built_in_ai",
                "default_model": "gemini-2.0-flash / gemini-1.5-flash",
                "platform": "CambodiaJobs AI Platform Agent",
            }
        })


class AIProfileMatchView(APIView):
    """
    Personalized job recommendation based on seeker profile and skills.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        user = getattr(request, "user", None)
        user_id = getattr(user, "id", None) if getattr(user, "is_authenticated", False) else None

        candidate_skills = []
        province = None
        if user_id:
            profile_info = get_seeker_profile_data(user_id)
            if profile_info:
                candidate_skills = profile_info["skills"]
                province = profile_info["seeker"].get("province")

        jobs = find_matching_jobs(
            query_text="",
            province=province,
            candidate_skills=candidate_skills,
            limit=6,
        )

        return Response({
            "success": True,
            "data": {
                "matched_jobs": jobs,
                "skills_analyzed": candidate_skills,
                "total": len(jobs),
            }
        })


class AIMarketChartView(APIView):
    """
    Get live market salary distribution and skill demand analytics for charts.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        data = get_market_chart_data()
        return Response({
            "success": True,
            "data": data,
        })
