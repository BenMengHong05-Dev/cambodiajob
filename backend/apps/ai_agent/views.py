import os
import time
import json
import re
from collections import defaultdict
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.conf import settings

from common.permissions import IsAuthenticatedCustom
from common.database import fetch_one, fetch_all
from .agent_service import (
    process_ai_agent_chat,
    get_market_chart_data,
    find_matching_jobs,
    get_seeker_profile_data,
    resolve_ai_config,
    generate_ai_cover_letter,
    call_universal_ai,
)

# In-memory Rate Limiting Cache: Max 10 AI requests per 60 seconds per client (IP/User) to prevent spam
_AI_RATE_LIMIT_CACHE = defaultdict(list)
AI_MAX_REQUESTS_PER_MINUTE = 10
AI_RATE_LIMIT_WINDOW = 60  # seconds


def check_ai_rate_limit(request, max_requests: int = AI_MAX_REQUESTS_PER_MINUTE, window_seconds: int = AI_RATE_LIMIT_WINDOW):
    """
    Max 10 AI requests per 60 seconds per client (IP/User) to prevent spam.
    Returns: (is_allowed: bool, info: dict)
    """
    now = time.time()
    user = getattr(request, "user", None)
    if user and getattr(user, "is_authenticated", False) and getattr(user, "id", None):
        key = f"user_{user.id}"
    else:
        ip = request.META.get("HTTP_X_FORWARDED_FOR") or request.META.get("REMOTE_ADDR") or "anonymous"
        key = f"ip_{ip.split(',')[0].strip()}"

    timestamps = [t for t in _AI_RATE_LIMIT_CACHE[key] if now - t < window_seconds]
    if len(timestamps) >= max_requests:
        _AI_RATE_LIMIT_CACHE[key] = timestamps
        oldest_t = min(timestamps)
        retry_after = max(1, int(window_seconds - (now - oldest_t)))
        return False, {
            "remaining": 0,
            "limit": max_requests,
            "retry_after": retry_after,
            "key": key,
        }

    timestamps.append(now)
    _AI_RATE_LIMIT_CACHE[key] = timestamps
    return True, {
        "remaining": max_requests - len(timestamps),
        "limit": max_requests,
        "retry_after": 0,
        "key": key,
    }


class AIChatView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):
        allowed, info = check_ai_rate_limit(request, max_requests=10, window_seconds=60)
        if not allowed:
            return Response(
                {
                    "success": False,
                    "message": f"Rate limit reached: Max 10 AI requests per minute to prevent spam. សូមរង់ចាំ {info['retry_after']} វិនាទី (កំណត់ត្រឹម ១០ សំណើក្នុង ១ នាទី)។",
                    "error": "rate_limit_exceeded",
                    "limit": info["limit"],
                    "retry_after": info["retry_after"],
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

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
        allowed, info = check_ai_rate_limit(request, max_requests=10, window_seconds=60)
        if not allowed:
            return Response(
                {
                    "success": False,
                    "message": f"Rate limit reached: Max 10 AI chart requests per minute to prevent spam. សូមរង់ចាំ {info['retry_after']} វិនាទី (កំណត់ត្រឹម ១០ សំណើក្នុង ១ នាទី)។",
                    "error": "rate_limit_exceeded",
                    "limit": info["limit"],
                    "retry_after": info["retry_after"],
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
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
        allowed, info = check_ai_rate_limit(request, max_requests=10, window_seconds=60)
        if not allowed:
            return Response(
                {
                    "success": False,
                    "message": f"Rate limit reached: Max 10 AI requests per minute to prevent spam. សូមរង់ចាំ {info['retry_after']} វិនាទី (កំណត់ត្រឹម ១០ សំណើក្នុង ១ នាទី)។",
                    "error": "rate_limit_exceeded",
                    "limit": info["limit"],
                    "retry_after": info["retry_after"],
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
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


def generate_fallback_job(prompt: str, industry: str, experience_level: str, workplace_type: str) -> dict:
    """
    Intelligent bilingual job generator for common roles when external AI API is offline.
    """
    p_lower = prompt.lower()
    
    # 1. Tech / Software Developer
    if any(k in p_lower for k in ["develop", "engineer", "react", "node", "python", "full", "frontend", "backend", "web"]):
        return {
            "title": prompt.strip().title() or "Senior Software Engineer",
            "title_km": "វិស្វករអភិវឌ្ឍន៍សូហ្វវែរ (Software Engineer)",
            "employment_type": "full_time",
            "workplace_type": workplace_type or "hybrid",
            "experience_level": experience_level or "mid",
            "salary_min": 800,
            "salary_max": 2000,
            "salary_currency": "USD",
            "vacancies_count": 2,
            "description": (
                f"We are seeking a talented and proactive {prompt} to join our high-performing technology team. "
                "In this role, you will architect, build, and optimize scalable web and mobile software solutions, "
                "collaborate closely with product managers and designers, and deliver clean, maintainable code."
            ),
            "description_km": (
                f"ក្រុមហ៊ុនរបស់យើងខ្ញុំកំពុងស្វែងរក {prompt} ដែលមានទេពកោសល្យ និងភាពច្នៃប្រឌិតខ្ពស់ដើម្បីចូលរួមជាមួយក្រុមការងារបច្ចេកវិទ្យា។ "
                "តួនាទីនេះទទួលខុសត្រូវលើការអភិវឌ្ឍន៍ និងថែទាំប្រព័ន្ធកម្មវិធីសូហ្វវែរឱ្យមានដំណើរការរលូន សុវត្ថិភាពខ្ពស់ និងឆ្លើយតបនឹងតម្រូវការអាជីវកម្ម។"
            ),
            "requirements": (
                "- Bachelor's degree in Computer Science, IT, or equivalent experience\n"
                "- Strong experience with modern JavaScript/TypeScript, React, Python, or Node.js\n"
                "- Solid understanding of RESTful APIs, relational databases (MySQL/PostgreSQL), and Git\n"
                "- Problem-solving mindset with good communication skills in English and Khmer"
            ),
            "recommended_skills": ["React.js", "Node.js", "Python", "Docker & Cloud Deployment", "English (Professional)"]
        }

    # 2. Accounting & Finance
    elif any(k in p_lower for k in ["account", "finance", "audit", "tax", "bookkeeper"]):
        return {
            "title": prompt.strip().title() or "Senior Accountant",
            "title_km": "មន្ត្រីគណនេយ្យជាន់ខ្ពស់ (Senior Accountant)",
            "employment_type": "full_time",
            "workplace_type": workplace_type or "on_site",
            "experience_level": experience_level or "mid",
            "salary_min": 450,
            "salary_max": 1000,
            "salary_currency": "USD",
            "vacancies_count": 1,
            "description": (
                f"We are hiring a meticulous {prompt} to manage daily financial operations, tax filings, "
                "and financial statement preparation according to Cambodian accounting standards."
            ),
            "description_km": (
                f"យើងកំពុងស្វែងរក {prompt} ដែលមានការប្រុងប្រយ័ត្នខ្ពស់ ដើម្បីគ្រប់គ្រងប្រតិបត្តិការហិរញ្ញវត្ថុប្រចាំថ្ងៃ "
                "ការរៀបចំរបាយការណ៍ហិរញ្ញវត្ថុ និងការប្រកាសពន្ធស្របតាមច្បាប់នៃព្រះរាជាណាចក្រកម្ពុជា។"
            ),
            "requirements": (
                "- Bachelor's degree in Accounting, Finance, or ACCA/CAT certification\n"
                "- At least 2-3 years of proven experience in financial reporting and general ledger\n"
                "- Proficient in QuickBooks, Microsoft Excel, and local General Department of Taxation (GDT) e-filing\n"
                "- High integrity, analytical acumen, and organizational skills"
            ),
            "recommended_skills": ["Accounting", "Financial Modeling", "Microsoft Office", "English (Professional)"]
        }

    # 3. Sales & Marketing
    elif any(k in p_lower for k in ["sale", "market", "business", "retail", "digital"]):
        return {
            "title": prompt.strip().title() or "Sales & Marketing Specialist",
            "title_km": "មន្ត្រីផ្នែកលក់ និងទីផ្សារ (Sales & Marketing)",
            "employment_type": "full_time",
            "workplace_type": workplace_type or "on_site",
            "experience_level": experience_level or "entry",
            "salary_min": 400,
            "salary_max": 900,
            "salary_currency": "USD",
            "vacancies_count": 3,
            "description": (
                f"We are looking for an energetic {prompt} to drive sales growth, manage client partnerships, "
                "and execute successful campaigns across digital and on-ground channels in Cambodia."
            ),
            "description_km": (
                f"ក្រុមហ៊ុនយើងត្រូវការ {prompt} ដែលមានភាពស្វាហាប់ និងរហ័សរហួន ដើម្បីជំរុញការលក់ បង្កើតទំនាក់ទំនងល្អជាមួយអតិថិជន "
                "និងរៀបចំយុទ្ធសាស្ត្រទីផ្សារប្រកបដោយប្រសិទ្ធភាព។"
            ),
            "requirements": (
                "- Proven experience or strong passion for sales, client negotiation, and customer relationship management\n"
                "- Excellent interpersonal and verbal presentation skills in Khmer and English\n"
                "- Experience with social media advertising (Facebook, Telegram, TikTok) is an advantage\n"
                "- Results-driven, resilient, and customer-focused attitude"
            ),
            "recommended_skills": ["B2B Sales Negotiation", "Digital Marketing & SEO", "Customer Relationship Management", "Khmer Language"]
        }

    # 4. Default Universal Job Template
    return {
        "title": prompt.strip().title() or "Professional Specialist",
        "title_km": f"បុគ្គលិកជំនាញ ({prompt.strip().title()})",
        "employment_type": "full_time",
        "workplace_type": workplace_type or "on_site",
        "experience_level": experience_level or "mid",
        "salary_min": 500,
        "salary_max": 1200,
        "salary_currency": "USD",
        "vacancies_count": 1,
        "description": (
            f"We are hiring a qualified {prompt} to join our growing organization. "
            "You will be responsible for executing key operations, collaborating with team members, "
            "and ensuring high standards of service and project delivery."
        ),
        "description_km": (
            f"ក្រុមហ៊ុនយើងខ្ញុំកំពុងជ្រើសរើស {prompt} ដើម្បីចូលរួមបម្រើការងារ។ "
            "អ្នកនឹងទទួលខុសត្រូវលើកិច្ចការប្រតិបត្តិការសំខាន់ៗ សហការជាមួយក្រុមការងារ និងធានាឱ្យបាននូវគុណភាពការងារខ្ពស់។"
        ),
        "requirements": (
            "- Relevant degree or professional qualification related to the position\n"
            "- Good working attitude, reliability, and strong attention to detail\n"
            "- Effective communication skills in Khmer and English\n"
            "- Ability to work both independently and collaboratively as a team"
        ),
        "recommended_skills": ["Communication", "Microsoft Office", "English (Professional)", "Khmer Language"]
    }


class AIJobGenerateView(APIView):
    """
    AI-powered Job Creation: generates complete job specifications automatically
    from title/prompt including bilingual English & Khmer titles, descriptions,
    requirements, salary estimates, and matched skills.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        allowed, info = check_ai_rate_limit(request, max_requests=10, window_seconds=60)
        if not allowed:
            return Response(
                {
                    "success": False,
                    "message": f"Rate limit reached: Max 10 AI requests per minute to prevent spam. សូមរង់ចាំ {info['retry_after']} វិនាទី (កំណត់ត្រឹម ១០ សំណើក្នុង ១ នាទី)។",
                    "error": "rate_limit_exceeded",
                    "limit": info["limit"],
                    "retry_after": info["retry_after"],
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        prompt = str(request.data.get("prompt") or request.data.get("title") or "").strip()
        industry = str(request.data.get("industry") or "").strip()
        experience_level = str(request.data.get("experience_level") or "mid").strip()
        workplace_type = str(request.data.get("workplace_type") or "on_site").strip()

        if not prompt:
            return Response(
                {"success": False, "message": "Job title or prompt is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Call Universal AI (DeepSeek, Gemini, etc.) or fallback
        generated_data = None
        system_instruction = (
            "You are an expert HR Recruitment Specialist for Cambodian Job Market. "
            "Return ONLY a valid JSON object (no markdown code fence, no additional commentary) with the following exact keys:\n"
            "- title: string (English job title, e.g. 'Senior React Developer')\n"
            "- title_km: string (Khmer job title, e.g. 'អ្នកអភិវឌ្ឍន៍ React ជាន់ខ្ពស់')\n"
            "- employment_type: string ('full_time', 'part_time', 'contract', 'internship', or 'freelance')\n"
            "- workplace_type: string ('on_site', 'hybrid', or 'remote')\n"
            "- experience_level: string ('fresh_graduate', 'entry', 'mid', 'senior', 'lead', or 'executive')\n"
            "- education_level: string ('high_school', 'associate', 'bachelor', 'master', or 'doctorate')\n"
            "- province: string (Cambodian province name in English, e.g. 'Phnom Penh', 'Siem Reap', 'Battambang', etc.)\n"
            "- salary_min: integer (reasonable monthly USD salary, e.g. 1500)\n"
            "- salary_max: integer (reasonable monthly USD salary, e.g. 2500)\n"
            "- vacancies_count: integer (e.g. 1 or 2)\n"
            "- description: string (clean HTML formatted job overview and key responsibilities with <p> and <ul><li> tags in English)\n"
            "- description_km: string (clean HTML formatted job overview in Khmer with <p> and <ul><li> tags)\n"
            "- requirements: string (clear bullet points formatted requirements and qualifications with <ul><li> tags or newline bullets)\n"
            "- recommended_skills: array of string skill names (e.g. ['React.js', 'TypeScript', 'Tailwind CSS', 'Khmer Language', 'English (Professional)'])\n"
        )
        user_msg = f"Generate a complete, professional job vacancy for: '{prompt}'. Industry: {industry}. Experience: {experience_level}. Workplace: {workplace_type}."

        try:
            reply, prov, mod = call_universal_ai(
                prompt=user_msg,
                system_instruction=system_instruction,
                max_tokens=2048
            )
            if reply:
                clean_reply = re.sub(r"^```(?:json)?\s*", "", reply.strip(), flags=re.IGNORECASE)
                clean_reply = re.sub(r"\s*```$", "", clean_reply.strip())
                match = re.search(r"(\{[\s\S]*\})", clean_reply)
                if match:
                    clean_reply = match.group(1)
                generated_data = json.loads(clean_reply)
        except Exception as e:
            print(f"[AIJobGenerate] AI call fallback: {e}")

        # Fallback Generator if AI failed or returned invalid JSON
        if not generated_data:
            generated_data = generate_fallback_job(prompt, industry, experience_level, workplace_type)

        # Match category_id from database
        cats = fetch_all("SELECT id, name_en, name_km FROM job_categories")
        matched_cat_id = 1
        prompt_lower = prompt.lower()
        for cat in cats:
            c_en = (cat["name_en"] or "").lower()
            if any(w in prompt_lower for w in ["software", "developer", "it", "web", "react", "python", "tech"]):
                if "information" in c_en or "technology" in c_en:
                    matched_cat_id = cat["id"]
                    break
            elif any(w in prompt_lower for w in ["account", "finance", "audit", "tax"]):
                if "account" in c_en or "finance" in c_en:
                    matched_cat_id = cat["id"]
                    break
            elif any(w in prompt_lower for w in ["sale", "market", "business", "retail"]):
                if "sale" in c_en or "market" in c_en:
                    matched_cat_id = cat["id"]
                    break
            elif any(w in prompt_lower for w in ["hr", "human", "recruit", "admin"]):
                if "human" in c_en:
                    matched_cat_id = cat["id"]
                    break
            elif any(w in prompt_lower for w in ["graphic", "design", "media", "ui", "ux"]):
                if "design" in c_en or "creative" in c_en:
                    matched_cat_id = cat["id"]
                    break
            elif any(w in prompt_lower for w in ["teach", "train", "educat"]):
                if "educat" in c_en:
                    matched_cat_id = cat["id"]
                    break

        generated_data["category_id"] = matched_cat_id

        # Match skill IDs from DB
        db_skills = fetch_all("SELECT id, name FROM skills")
        selected_skill_ids = []
        for s in db_skills:
            s_name = s["name"].lower()
            for rec in generated_data.get("recommended_skills", []):
                if rec.lower() in s_name or s_name in rec.lower():
                    selected_skill_ids.append(s["id"])
                    break
        generated_data["skill_ids"] = list(set(selected_skill_ids))

        return Response({"success": True, "data": generated_data})

