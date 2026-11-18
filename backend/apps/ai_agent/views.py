import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.conf import settings

from common.permissions import IsAuthenticatedCustom
from .agent_service import (
    process_ai_agent_chat,
    get_market_chart_data,
    find_matching_jobs,
    get_seeker_profile_data,
    resolve_ai_config,
    generate_ai_cover_letter,
)


class AIChatView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):
        message = request.data.get("message", "").strip()
        history = request.data.get("history", [])
        api_key = request.data.get("api_key")
        provider = request.data.get("provider")
        model = request.data.get("model")
        base_url = request.data.get("base_url")

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
            provider=provider,
            model=model,
            base_url=base_url,
        )

        return Response({
            "success": True,
            "data": agent_result,
        })


class AIStatusView(APIView):
    """
    Check Universal AI Gateway status and active provider (Gemini, ChatGPT, DeepSeek, etc.).
    """
    permission_classes = [AllowAny]

    def get(self, request):
        cfg = resolve_ai_config()
        return Response({
            "success": True,
            "data": {
                "ai_configured": cfg["is_active"],
                "gemini_configured": cfg["is_active"],
                "provider": cfg["provider"],
                "model": cfg["model"] or "built_in_ai",
                "supported_providers": ["gemini", "openai", "deepseek", "custom"],
                "platform": "CambodiaJobs Universal AI Platform Agent",
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


class AICoverLetterView(APIView):
    """
    Generate an intelligent, tailored cover letter using AI for a job opportunity.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        job_title = request.data.get("job_title", "").strip()
        company_name = request.data.get("company_name", "").strip()
        job_description = request.data.get("job_description", "")
        candidate_name = request.data.get("candidate_name")
        candidate_skills = request.data.get("candidate_skills")
        experience_summary = request.data.get("experience_summary")
        is_khmer = bool(request.data.get("is_khmer", False))
        api_key = request.data.get("api_key")

        if not job_title or not company_name:
            return Response(
                {"success": False, "message": "job_title and company_name are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # If user is authenticated and details not supplied, enrich from profile
        user = getattr(request, "user", None)
        user_id = getattr(user, "id", None) if getattr(user, "is_authenticated", False) else None
        if user_id:
            profile_info = get_seeker_profile_data(user_id)
            if profile_info:
                if not candidate_name:
                    candidate_name = profile_info["seeker"].get("full_name")
                if not candidate_skills:
                    candidate_skills = profile_info.get("skills", [])
                if not experience_summary and profile_info.get("experiences"):
                    exp_titles = [e["job_title"] for e in profile_info["experiences"][:2]]
                    experience_summary = f"Background in {', '.join(exp_titles)}"

        cover_letter = generate_ai_cover_letter(
            job_title=job_title,
            company_name=company_name,
            job_description=job_description,
            candidate_skills=candidate_skills,
            candidate_name=candidate_name or "Candidate",
            experience_summary=experience_summary,
            is_khmer=is_khmer,
            api_key=api_key,
        )

        return Response({
            "success": True,
            "data": {
                "cover_letter": cover_letter,
                "job_title": job_title,
                "company_name": company_name,
            }
        })

