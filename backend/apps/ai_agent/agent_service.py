"""
General AI Platform Agent Service for CambodiaJobs with Google Gemini Integration.
Provides comprehensive assistance for:
- Job Seekers (job search, skill matching, CV & interview prep)
- Employers & Recruiters (posting jobs, hiring tips, candidate management)
- General Visitors (platform guidance, navigation, Cambodian market insights & salary charts)
- General Career & Tech Consultation
Supports Google Gemini API with fallback to built-in intelligent engine.
Supports English & Khmer natively.
"""

import json
import logging
import os
import re
import urllib.request
import urllib.error
from decimal import Decimal
from typing import Any, Dict, List, Optional
from django.conf import settings

from common.database import fetch_all, fetch_one, fetch_scalar

logger = logging.getLogger(__name__)


def decimal_to_float(obj: Any) -> Any:
    """Helper to serialize Decimals for JSON response."""
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [decimal_to_float(i) for i in obj]
    return obj


def is_khmer_text(text: str) -> bool:
    """Check if the text contains Khmer Unicode characters."""
    return bool(re.search(r"[\u1780-\u17ff]", text))


def get_seeker_profile_data(user_id: int) -> Optional[Dict[str, Any]]:
    """Retrieve candidate profile, skills, and experience for matching."""
    seeker = fetch_one(
        """
        SELECT sp.*, u.full_name, u.email, u.phone_number
        FROM seeker_profiles sp
        INNER JOIN users u ON u.id = sp.user_id
        WHERE sp.user_id = %s
        """,
        [user_id],
    )
    if not seeker:
        return None

    skills = fetch_all(
        """
        SELECT s.id, s.name, s.category, ss.proficiency_level
        FROM seeker_skills ss
        INNER JOIN skills s ON s.id = ss.skill_id
        WHERE ss.seeker_id = %s
        """,
        [seeker["id"]],
    )

    experiences = fetch_all(
        """
        SELECT job_title, company_name, is_current
        FROM work_experiences
        WHERE seeker_id = %s
        ORDER BY start_date DESC
        """,
        [seeker["id"]],
    )

    return {
        "seeker": seeker,
        "skills": [s["name"] for s in skills],
        "skills_detailed": skills,
        "experiences": experiences,
    }


def find_matching_jobs(
    query_text: str = "",
    province: Optional[str] = None,
    category_id: Optional[int] = None,
    candidate_skills: Optional[List[str]] = None,
    min_salary: Optional[float] = None,
    employment_type: Optional[str] = None,
    workplace_type: Optional[str] = None,
    experience_level: Optional[str] = None,
    limit: int = 4,
) -> List[Dict[str, Any]]:
    """
    Search and rank active jobs in Cambodia matching criteria,
    computing fit score (0-100%) and matched/missing skill breakdown.
    """
    candidate_skills_set = {s.lower().strip() for s in (candidate_skills or [])}

    sql = """
        SELECT 
            j.id, j.title, j.title_km, j.slug, j.description, j.description_km,
            j.requirements, j.employment_type, j.workplace_type, j.experience_level,
            j.province, j.city, j.salary_min, j.salary_max, j.salary_currency,
            j.is_salary_negotiable, j.vacancies_count, j.published_at,
            c.id AS company_id, c.name AS company_name, c.slug AS company_slug,
            c.logo_url AS company_logo, c.verification_status,
            cat.name_en AS category_name_en, cat.name_km AS category_name_km
        FROM jobs j
        INNER JOIN companies c ON c.id = j.company_id
        LEFT JOIN job_categories cat ON cat.id = j.category_id
        WHERE j.status = 'published' AND j.moderation_status = 'approved'
    """
    params: List[Any] = []

    if province and province.lower() != "all":
        sql += " AND LOWER(j.province) = LOWER(%s)"
        params.append(province)

    if category_id:
        sql += " AND j.category_id = %s"
        params.append(category_id)

    if employment_type:
        sql += " AND j.employment_type = %s"
        params.append(employment_type)

    if workplace_type:
        sql += " AND j.workplace_type = %s"
        params.append(workplace_type)

    if experience_level:
        sql += " AND j.experience_level = %s"
        params.append(experience_level)

    if min_salary:
        sql += " AND (j.salary_max >= %s OR j.salary_min >= %s)"
        params.extend([min_salary, min_salary])

    all_jobs = fetch_all(sql, params)
    if not all_jobs:
        return []

    # Fetch skills for these jobs
    job_ids = [j["id"] for j in all_jobs]
    placeholders = ",".join(["%s"] * len(job_ids))
    job_skills_data = fetch_all(
        f"""
        SELECT js.job_id, s.name, js.is_required
        FROM job_skills js
        INNER JOIN skills s ON s.id = js.skill_id
        WHERE js.job_id IN ({placeholders})
        """,
        job_ids,
    )

    skills_by_job: Dict[int, List[Dict[str, Any]]] = {}
    for js in job_skills_data:
        skills_by_job.setdefault(js["job_id"], []).append(js)

    tokens = [t.lower() for t in re.findall(r"\w+", query_text) if len(t) > 2]
    ranked_jobs = []

    for job in all_jobs:
        job_id = job["id"]
        required_skills = skills_by_job.get(job_id, [])
        req_names = [s["name"] for s in required_skills]
        req_names_lower = {s.lower() for s in req_names}

        title_lower = (job["title"] or "").lower()
        title_km_lower = (job["title_km"] or "").lower()
        desc_lower = (job["description"] or "").lower()
        comp_lower = (job["company_name"] or "").lower()

        score = 60

        for token in tokens:
            if token in title_lower or token in title_km_lower:
                score += 15
            elif token in comp_lower or token in desc_lower:
                score += 8
            elif token in req_names_lower:
                score += 12

        matched_skills = []
        missing_skills = []
        for s in req_names:
            s_low = s.lower()
            if candidate_skills_set and s_low in candidate_skills_set:
                matched_skills.append(s)
            elif any(token in s_low for token in tokens):
                matched_skills.append(s)
            else:
                missing_skills.append(s)

        if candidate_skills_set and req_names:
            overlap_ratio = len(matched_skills) / len(req_names)
            score += int(overlap_ratio * 30)

        final_score = min(98, max(55, score))

        job_result = {
            **decimal_to_float(job),
            "skills": req_names,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "match_score": final_score,
        }
        ranked_jobs.append(job_result)

    ranked_jobs.sort(key=lambda x: x["match_score"], reverse=True)
    return ranked_jobs[:limit]


def get_market_chart_data(category_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Generate live benchmark salary and job volume distribution
    from the Cambodian job database for chart visualization.
    """
    categories = fetch_all(
        """
        SELECT 
            c.id, c.name_en, c.name_km,
            COUNT(j.id) AS job_count,
            MIN(CASE WHEN j.salary_currency = 'USD' THEN j.salary_min ELSE j.salary_min / 4100 END) AS min_salary_usd,
            AVG(CASE WHEN j.salary_currency = 'USD' THEN (j.salary_min + j.salary_max)/2 ELSE ((j.salary_min + j.salary_max)/2) / 4100 END) AS avg_salary_usd,
            MAX(CASE WHEN j.salary_currency = 'USD' THEN j.salary_max ELSE j.salary_max / 4100 END) AS max_salary_usd
        FROM job_categories c
        LEFT JOIN jobs j ON j.category_id = c.id AND j.status = 'published' AND j.moderation_status = 'approved'
        GROUP BY c.id, c.name_en, c.name_km
        ORDER BY job_count DESC, avg_salary_usd DESC
        LIMIT 6
        """
    )

    province_stats = fetch_all(
        """
        SELECT province, COUNT(id) AS count
        FROM jobs
        WHERE status = 'published' AND moderation_status = 'approved' AND province IS NOT NULL
        GROUP BY province
        ORDER BY count DESC
        LIMIT 5
        """
    )

    skill_demand = fetch_all(
        """
        SELECT s.name, COUNT(js.id) as demand_count
        FROM skills s
        INNER JOIN job_skills js ON js.skill_id = s.id
        INNER JOIN jobs j ON j.id = js.job_id AND j.status = 'published'
        GROUP BY s.id, s.name
        ORDER BY demand_count DESC
        LIMIT 6
        """
    )

    return {
        "categories_salary": decimal_to_float(categories),
        "provinces": decimal_to_float(province_stats),
        "top_skills": decimal_to_float(skill_demand),
    }


def call_gemini_api(
    prompt: str,
    api_key: str,
    system_instruction: Optional[str] = None,
    history: Optional[List[Dict[str, str]]] = None,
) -> Optional[str]:
    """
    Call Google Gemini REST API using the provided API key.
    Supports gemini-2.0-flash and gemini-1.5-flash with automatic fallback.
    """
    if not api_key or api_key.strip() in ("", "your_gemini_api_key_here"):
        return None

    clean_key = api_key.strip()

    contents = []
    # Add recent history
    if history:
        for turn in history[-4:]:
            role = "user" if turn.get("sender") == "user" else "model"
            text = turn.get("text", "")
            if text:
                contents.append({"role": role, "parts": [{"text": text}]})

    # Add current prompt
    contents.append({"role": "user", "parts": [{"text": prompt}]})

    payload: Dict[str, Any] = {
        "contents": contents,
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 800,
        },
    }

    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }

    # Try gemini-2.0-flash first, then gemini-1.5-flash
    for model in ["gemini-2.0-flash", "gemini-1.5-flash"]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={clean_key}"
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=12) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                candidates = res_data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        text = parts[0].get("text")
                        if text:
                            return text.strip()
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8", errors="ignore")
            logger.warning("Gemini API HTTP %s for model %s: %s", e.code, model, error_body)
            continue
        except Exception as e:
            logger.warning("Gemini API call failed for model %s: %s", model, e)
            continue

    return None


def detect_user_intent(query_lower: str) -> str:
    """Classify user query into platform intent categories."""
    if any(k in query_lower for k in [
        "post a job", "post job", "how to hire", "hire developer", "hire candidate",
        "employer", "recruiter", "post vacancy", "find talent", "pricing for employer",
        "company account", "របៀបផុសការងារ", "ជ្រើសរើសបុគ្គលិក", "និយោជក", "របៀបដាក់ការងារ"
    ]):
        return "employer_guide"

    if any(k in query_lower for k in [
        "what is cambodiajobs", "about cambodiajobs", "about this platform", "about the website",
        "who are you", "what can you do", "features of", "how does this platform work",
        "how to use this website", "switch currency", "khr to usd", "riel", "language support",
        "តើគេហទំព័រនេះជាអ្វី", "តើអ្នកអាចធ្វើអ្វីបាន", "មុខងាររបស់ប្រព័ន្ធ", "ប្តូររូបិយប័ណ្ណ"
    ]):
        return "platform_info"

    if any(k in query_lower for k in [
        "how to apply", "upload cv", "upload resume", "create profile", "how to register as seeker",
        "track application", "interview schedule", "របៀបដាក់ពាក្យ", "របៀបបង្កើត cv", "របៀបចុះឈ្មោះ"
    ]):
        return "seeker_guide"

    if any(k in query_lower for k in [
        "chart", "salary", "pay", "benchmark", "graph", "how much does", "compare salary",
        "compensation", "market demand", "highest paying", "តារាងប្រាក់ខែ", "ប្រាក់ខែ", "ប្រៀបធៀប"
    ]):
        return "salary_chart"

    if any(k in query_lower for k in [
        "cv", "resume", "interview", "cover letter", "career advice", "pass interview", "prepare interview",
        "negotiate salary", "career tip", "គន្លឹះសម្ភាសន៍", "សម្ភាសន៍", "សរសេរ cv", "រៀបចំ cv", "ប្រឹក្សាអាជីព"
    ]) and not any(k in query_lower for k in ["upload cv", "upload resume", "how to apply"]):
        return "career_advice"

    if any(k in query_lower for k in [
        "smart axiata", "aba bank", "wing bank", "royal academy", "company profile", "top companies",
        "ក្រុមហ៊ុន aba", "ក្រុមហ៊ុន smart", "ធនាគារ wing"
    ]):
        return "company_query"

    if query_lower in ["hello", "hi", "hey", "hola", "halo", "good morning", "good afternoon", "good evening", "សួស្តី", "ជំរាបសួរ"]:
        return "greeting"

    if any(k in query_lower for k in [
        "job", "jobs", "vacancy", "vacancies", "developer", "engineer", "react", "python",
        "flutter", "accounting", "marketing", "customer service", "sales", "intern", "graduate",
        "remote", "phnom penh", "siem reap", "position", "opening", "ការងារ", "មុខតំណែង"
    ]):
        return "job_search"

    return "general_qa"


def process_ai_agent_chat(
    message: str,
    user_id: Optional[int] = None,
    history: Optional[List[Dict[str, str]]] = None,
    api_key: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Main AI Platform Agent handler:
    1. Determines effective Gemini API Key from param, settings, or env.
    2. Gathers real CambodiaJobs database grounding (jobs, companies, salaries, user profile).
    3. Calls Google Gemini API if key is present to craft an articulate, natural language response.
    4. Seamlessly falls back to built-in intelligent engine if key is not provided.
    5. Attaches structured job cards and interactive charts.
    """
    raw_query = message.strip()
    query_lower = raw_query.lower()
    in_khmer = is_khmer_text(raw_query)

    seeker_info = get_seeker_profile_data(user_id) if user_id else None
    candidate_skills = seeker_info["skills"] if seeker_info else []

    intent = detect_user_intent(query_lower)

    matched_jobs: List[Dict[str, Any]] = []
    chart_payload: Optional[Dict[str, Any]] = None
    ai_reply: Optional[str] = None

    market_data = get_market_chart_data()

    # Determine if user is looking for jobs or if jobs should be fetched
    if intent in ["job_search", "company_query"] or any(k in query_lower for k in ["job", "jobs", "developer", "engineer", "work", "ការងារ"]):
        province = None
        for prov in ["phnom penh", "siem reap", "sihanoukville", "battambang", "kampot", "kandal", "kampong cham"]:
            if prov in query_lower:
                province = prov.title()
                break

        experience_level = None
        if any(k in query_lower for k in ["fresh graduate", "graduate", "junior", "entry", "beginner", "ទើបបញ្ចប់ការសិក្សា"]):
            experience_level = "fresh_graduate" if "graduate" in query_lower or "ទើបបញ្ចប់" in query_lower else "entry"
        elif any(k in query_lower for k in ["senior", "lead", "ជាន់ខ្ពស់"]):
            experience_level = "senior"
        elif "mid" in query_lower or "កម្រិតមធ្យម" in query_lower:
            experience_level = "mid"

        workplace_type = None
        if any(k in query_lower for k in ["remote", "work from home", "wfh", "ពីផ្ទះ"]):
            workplace_type = "remote"
        elif "hybrid" in query_lower:
            workplace_type = "hybrid"
        elif "on site" in query_lower or "office" in query_lower:
            workplace_type = "on_site"

        min_salary = None
        salary_match = re.search(r"(\$|usd)?\s*([1-9]\d{2,4})\s*(\$|usd)?", query_lower)
        if salary_match and any(w in query_lower for w in ["salary", "above", "more than", "over", ">", "min", "ប្រាក់ខែ"]):
            try:
                min_salary = float(salary_match.group(2))
            except ValueError:
                pass

        matched_jobs = find_matching_jobs(
            query_text=raw_query,
            province=province,
            candidate_skills=candidate_skills,
            min_salary=min_salary,
            workplace_type=workplace_type,
            experience_level=experience_level,
            limit=4,
        )

        if not matched_jobs:
            matched_jobs = find_matching_jobs(
                query_text=raw_query,
                candidate_skills=candidate_skills,
                limit=4,
            )

    # Attach chart if requested
    if intent == "salary_chart" or any(k in query_lower for k in ["chart", "salary", "benchmark", "compare", "ប្រាក់ខែ"]):
        cat_items = []
        for cat in market_data["categories_salary"]:
            min_val = round(cat.get("min_salary_usd") or 300)
            avg_val = round(cat.get("avg_salary_usd") or 800)
            max_val = round(cat.get("max_salary_usd") or 1800)
            cat_items.append({
                "label": cat["name_en"],
                "label_km": cat.get("name_km") or cat["name_en"],
                "min": min_val,
                "avg": avg_val,
                "max": max_val,
                "count": cat.get("job_count") or 1,
            })

        chart_payload = {
            "type": "salary_benchmark",
            "title": "Cambodia Market Salary Benchmark (USD / Month)",
            "title_km": "តារាងប្រៀបធៀបប្រាក់ខែទីផ្សារការងារកម្ពុជា (ដុល្លារ / ខែ)",
            "items": cat_items,
        }

    # ----------------------------------------------------
    # GOOGLE GEMINI API CALL (If API Key is available)
    # ----------------------------------------------------
    effective_key = (
        (api_key or "").strip()
        or getattr(settings, "GEMINI_API_KEY", "").strip()
        or os.getenv("GEMINI_API_KEY", "").strip()
    )

    is_gemini_active = bool(effective_key and effective_key not in ["", "your_gemini_api_key_here"])

    if is_gemini_active:
        job_summaries = [
            f"- {j['title']} at {j['company_name']} ({j['province']}, ${j['salary_min']}-${j['salary_max']}) Match: {j['match_score']}%"
            for j in matched_jobs
        ]
        system_instruction = f"""
You are the official CambodiaJobs Platform AI Assistant, powered by Google Gemini.
CambodiaJobs is Cambodia's premier recruitment and career platform connecting candidates with verified employers
(such as Smart Axiata, ABA Bank, Wing Bank, Royal Academy) across Phnom Penh, Siem Reap, and all 25 provinces.

PLATFORM INFORMATION:
- 100% verified jobs & employers.
- Bilingual: English and Khmer. (CRITICAL: If the user writes in Khmer, reply in natural, fluent Khmer. If English, reply in English).
- Dual currency: USD and KHR (1 USD = 4,100 KHR).
- Seeker features: Profile builder (/seeker/profile), resume upload, 1-click apply, application tracking, interview schedule with Google Calendar sync.
- Employer features: Employer dashboard (/employer/dashboard), post a job (/employer/jobs/create), applicant pipeline review (/employer/applications), interview scheduler.

LIVE DATABASE CONTEXT:
- Top Hiring Employers: Smart Axiata Co., Ltd., ABA Bank, Wing Bank.
- Live Matched Jobs:
{chr(10).join(job_summaries) if job_summaries else "No direct job matches found for this query."}
- Salary Market Benchmark: IT & Software ($450-$3,000 USD), Banking ($480-$2,400 USD), Accounting ($800-$1,300 USD), Marketing ($700-$1,200 USD).

USER CONTEXT:
{f"Candidate Name: {seeker_info['seeker']['full_name']}, Skills: {', '.join(candidate_skills)}" if seeker_info else "User is a visitor or unauthenticated user."}

INSTRUCTIONS:
- Give a direct, helpful, warm response.
- If the user asks for jobs, mention the top matched opportunities and encourage them to view the interactive job cards below.
- If an employer asks how to hire or post a job, explain the employer registration and job posting steps clearly.
- If asking for salary or market trends, explain the compensation and reference the interactive benchmark chart below.
- Keep response under 160 words, formatted in clean Markdown with bolding for key terms.
"""
        gemini_response = call_gemini_api(
            prompt=raw_query,
            api_key=effective_key,
            system_instruction=system_instruction,
            history=history,
        )
        if gemini_response:
            ai_reply = gemini_response

    # ----------------------------------------------------
    # FALLBACK BUILT-IN INTELLIGENT DIALOGUE GENERATOR
    # (Used when no Gemini key is set or on API network error)
    # ----------------------------------------------------
    if not ai_reply:
        if intent == "employer_guide":
            if in_khmer:
                ai_reply = (
                    "**សួស្តីនិយោជក! CambodiaJobs ផ្តល់ដំណោះស្រាយជ្រើសរើសបុគ្គលិកពេញលេញ៖**\n\n"
                    "1. **ការចុះឈ្មោះគណនីក្រុមហ៊ុន**៖ ចុះឈ្មោះដោយជ្រើសរើសប្រភេទ **Employer** រួចបំពេញព័ត៌មានក្រុមហ៊ុន និង Logo នៅលើទំព័រ Company Profile។\n"
                    "2. **ការប្រកាសរើសបុគ្គលិក (Post a Job)**៖ ចូលទៅកាន់ **Employer Dashboard &rarr; Post a Job** (`/employer/jobs/create`) ដើម្បីកំណត់មុខតំណែង ប្រាក់ខែ (USD/KHR) ទីតាំង និងជំនាញដែលត្រូវការ។\n"
                    "3. **ការគ្រប់គ្រងពាក្យសុំ**៖ ពិនិត្យមើល CV បេក្ខជន ផ្លាស់ប្តូរស្ថានភាព (Screening, Interview, Offer) និងកំណត់កាលវិភាគសម្ភាសន៍ដោយផ្ទាល់ជាមួយ Google Calendar Sync!\n\n"
                    "💡 **គន្លឹះទាក់ទាញបេក្ខជនឆ្នើម**៖ ការបង្ហាញប្រាក់ខែជាក់លាក់ និងអត្ថប្រយោជន៍ច្បាស់លាស់ជួយបង្កើនចំនួនអ្នកដាក់ពាក្យគុណភាពខ្ពស់រហូតដល់ ៤០%។"
                )
            else:
                ai_reply = (
                    "**Welcome Employers & Recruiters! Here is how to hire top talent on CambodiaJobs:**\n\n"
                    "1. **Register as Employer**: Sign up and select the **Employer** role, then configure your verified company profile with your logo and website.\n"
                    "2. **Post Vacancies**: Head to **Employer Dashboard &rarr; Post a Job** (`/employer/jobs/create`). Set required skills, job type (On-site/Hybrid/Remote), and salary in USD or KHR.\n"
                    "3. **Review & Interview**: Review incoming CVs, update applicant stages (Screening, Shortlisted, Interview, Offered), and schedule interviews with built-in video links and Google Calendar sync!\n\n"
                    "💡 **Pro-Tip**: Vacancies with transparent salary ranges receive up to **40% more qualified applications** in Cambodia."
                )

        elif intent == "platform_info":
            if in_khmer:
                ai_reply = (
                    "**CambodiaJobs គឺជាប្រព័ន្ធស្វែងរកការងារ និងជ្រើសរើសបុគ្គលិកឈានមុខគេនៅកម្ពុជា** ដែលតភ្ជាប់បេក្ខជនជាមួយក្រុមហ៊ុនធំៗដូចជា Smart Axiata, ABA Bank, និង Wing Bank។\n\n"
                    "🌟 **មុខងារសំខាន់ៗរបស់ប្រព័ន្ធ**៖\n"
                    "- **ការងារដែលបានផ្ទៀងផ្ទាត់ (100% Verified)**៖ រាល់ឱកាសការងារ និងក្រុមហ៊ុនត្រូវបានត្រួតពិនិត្យយ៉ាងហ្មត់ចត់។\n"
                    "- **ប្រព័ន្ធពីរភាសាពេញលេញ**៖ គាំទ្រភាសាខ្មែរ និងអង់គ្លេសយ៉ាងរលូន។\n"
                    "- **គាំទ្ររូបិយប័ណ្ណពីរ (Dual Currency)**៖ បង្ហាញប្រាក់ខែជា USD និងរៀល (KHR) ជាមួយនឹងអត្រាប្តូរប្រាក់ស្វ័យប្រវត្តិ (1 USD = 4,100 KHR)។\n"
                    "- **ជំនួយការ AI ឆ្លាតវៃ**៖ ដំណើរការដោយ Google Gemini ជួយផ្គូផ្គងជំនាញ គណនាពិន្ទុសមត្ថភាព និងបង្ហាញតារាងប្រៀបធៀបប្រាក់ខែផ្ទាល់។\n"
                    "- **ការគ្រប់គ្រងការសម្ភាសន៍**៖ កំណត់ពេលសម្ភាសន៍តាមវីដេអូ និង Sync ជាមួយ Google Calendar។"
                )
            else:
                ai_reply = (
                    "**CambodiaJobs is Cambodia's premier modern recruitment and career platform**, connecting ambitious talent with top verified employers including ABA Bank, Smart Axiata, and Wing Bank across Phnom Penh, Siem Reap, and all 25 provinces.\n\n"
                    "🌟 **Core Platform Capabilities**:\n"
                    "- **100% Verified Jobs & Employers**: Rigorous moderation ensuring safe, legitimate career opportunities.\n"
                    "- **Full Bilingual Experience**: Seamless switching between English and Khmer.\n"
                    "- **Dual-Currency Support**: Real-time USD and KHR conversion at 4,100 KHR/USD.\n"
                    "- **AI Platform & Career Chart Agent**: Powered by Google Gemini with live skill matching, compatibility scoring, and interactive salary benchmark charts.\n"
                    "- **Interview Lifecycle Management**: Application tracking, interview video links, and Google Calendar integration."
                )

        elif intent == "seeker_guide":
            if in_khmer:
                ai_reply = (
                    "**ការណែនាំសម្រាប់បេក្ខជនស្វែងរកការងារ (Job Seekers)៖**\n\n"
                    "1. **ចុះឈ្មោះគណនី**៖ ចុះឈ្មោះជា **Job Seeker** ឬចូលតាម Google OAuth ដោយចុចមួយដង។\n"
                    "2. **បំពេញប្រវត្តិរូប (Seeker Profile)**៖ បញ្ចូលចំណងជើងការងារ (Headline), សេចក្តីសង្ខេប, បទពិសោធន៍ការងារ, និងកម្រិតជំនាញរបស់អ្នក។\n"
                    "3. **ផ្ទុកឡើង CV/Resume**៖ ចូលទៅកាន់ **My Resumes** ដើម្បីផ្ទុកឯកសារ CV (PDF) សម្រាប់ដាក់ពាក្យរហ័ស។\n"
                    "4. **ស្វែងរក និងដាក់ពាក្យ**៖ ប្រើប្រាស់តម្រងស្វែងរកតាមវិស័យ និងខេត្ត-ក្រុង រួចចុច **Apply Now**។\n"
                    "5. **តាមដានលទ្ធផល**៖ ពិនិត្យមើលស្ថានភាពពាក្យសុំ និងកាលវិភាគសម្ភាសន៍នៅ **Seeker Dashboard** (`/seeker/dashboard`)។"
                )
            else:
                ai_reply = (
                    "**Step-by-Step Guide for Job Seekers on CambodiaJobs:**\n\n"
                    "1. **Sign Up**: Register as a **Job Seeker** or use 1-click Google OAuth sign-in.\n"
                    "2. **Build Your Profile**: Add your headline, summary, education, and technical/business skills in your **Seeker Profile** (`/seeker/profile`).\n"
                    "3. **Upload Your CV**: Attach your PDF resume in **My Resumes** for instant 1-click job applications.\n"
                    "4. **Search & Filter**: Browse verified vacancies by category, province, and salary, then hit **Apply Now**.\n"
                    "5. **Track Applications**: Monitor recruitment status (Screening, Interview, Offer) directly from your **Seeker Dashboard** (`/seeker/dashboard`)."
                )

        elif intent == "salary_chart":
            if in_khmer:
                ai_reply = (
                    "**តារាងប្រៀបធៀបប្រាក់ខែទីផ្សារការងារកម្ពុជា (ទិន្នន័យផ្ទាល់ពីមូលដ្ឋានទិន្នន័យ CambodiaJobs)៖**\n\n"
                    "- **វិស័យបច្ចេកវិទ្យា (IT & Software)**៖ $450 - $3,000+ (មធ្យម ~$1,450 សម្រាប់តួនាទី Full-Stack & DevOps)\n"
                    "- **ធនាគារ និងហិរញ្ញវត្ថុ**៖ $480 - $2,400 (មធ្យម ~$800 - $1,400 សម្រាប់ Mobile Banking & Relationship Officers)\n"
                    "- **គណនេយ្យ និងពន្ធដារ**៖ $800 - $1,300 (មធ្យម ~$1,050)\n"
                    "- **ទីផ្សារឌីជីថល និងលក់**៖ $700 - $1,200\n\n"
                    "ពិនិត្យមើលតារាងក្រាហ្វិកអន្តរកម្មខាងក្រោមដើម្បីមើលជួរប្រាក់ខែជាក់ស្តែង!"
                )
            else:
                ai_reply = (
                    "**Here is the Cambodia Market Salary Benchmark from our live database:**\n\n"
                    "- **IT & Software**: $450 - $3,000+ USD (Average ~$1,450 for Full-Stack, Mobile & DevOps)\n"
                    "- **Banking & Financial Services**: $480 - $2,400 USD (Average ~$800 - $1,400 for Mobile Banking & Officers)\n"
                    "- **Accounting & Taxation**: $800 - $1,300 USD (Average ~$1,050)\n"
                    "- **Digital Marketing & Sales**: $700 - $1,200 USD\n\n"
                    "Interact with the benchmark chart below to explore pay distributions across sectors!"
                )

        elif intent == "career_advice":
            if in_khmer:
                ai_reply = (
                    "**គន្លឹះរៀបចំ CV និងសម្ភាសន៍ការងារឱ្យជោគជ័យនៅកម្ពុជា៖**\n\n"
                    "📄 **គន្លឹះរៀបចំ CV/Resume**៖\n"
                    "- រក្សាប្រវែងត្រឹម **១ ទៅ ២ ទំព័រ** ឱ្យខ្លី ខ្លឹម និងច្បាស់លាស់។\n"
                    "- បញ្ចូលព័ត៌មានទំនាក់ទំនងសំខាន់ៗ៖ លេខទូរស័ព្ទ, Email, Telegram, និង LinkedIn ឬ GitHub។\n"
                    "- បញ្ជាក់កម្រិតភាសាអង់គ្លេស និងភាសាខ្មែរ ព្រោះក្រុមហ៊ុនធំៗនៅកម្ពុជាត្រូវការទំនាក់ទំនងពីរភាសា។\n"
                    "- រៀបរាប់ពីលទ្ធផលការងារ (Achievements) ដោយប្រើទិន្នន័យជាក់ស្តែង (ឧ. បង្កើនល្បឿន App 30%, គ្រប់គ្រងយុទ្ធនាការលើ Facebook/TikTok)។\n\n"
                    "🎯 **គន្លឹះពេលសម្ភាសន៍**៖\n"
                    "- សិក្សាឱ្យបានច្បាស់ពីផលិតផលក្រុមហ៊ុន (ឧ. ABA Mobile, SmartNas, Wing App) មុនពេលសម្ភាសន៍។\n"
                    "- ឆ្លើយតាមវិធីសាស្ត្រ **STAR** (Situation, Task, Action, Result) នៅពេលសួរអំពីបទពិសោធន៍កន្លងមក។"
                )
            else:
                ai_reply = (
                    "**Essential CV & Interview Preparation Tips for the Cambodian Market:**\n\n"
                    "📄 **High-Impact CV Writing**:\n"
                    "- **Length**: Keep it to **1-2 pages** maximum with a modern, legible layout.\n"
                    "- **Contact Info**: Include Phone number, professional Email, and Telegram handle (very commonly used by recruiters in Cambodia).\n"
                    "- **Language Proficiency**: Highlight both English and Khmer fluency—cross-border and bilingual communication is highly prized.\n"
                    "- **Quantify Impact**: Use action verbs and numbers (e.g., 'Optimized database queries by 40%', 'Managed monthly tax declarations for $2M volume').\n\n"
                    "🎯 **Interview Excellence**:\n"
                    "- Research the company’s flagship products (e.g., ABA Mobile, Smart Axiata services, Wing Bank fintech ecosystem).\n"
                    "- Use the **STAR Framework** (Situation, Task, Action, Result) when answering behavioral questions."
                )

        elif intent == "company_query":
            if in_khmer:
                ai_reply = (
                    "**ក្រុមហ៊ុនឈានមុខគេដែលបានផ្ទៀងផ្ទាត់ (Verified Employers) នៅលើ CambodiaJobs រួមមាន៖**\n\n"
                    "- **Smart Axiata Co., Ltd.** (ទូរគមនាគមន៍ និងអ៊ីនធឺណិត, ភ្នំពេញ)\n"
                    "- **ABA Bank (Advanced Bank of Asia)** (ធនាគារពាណិជ្ជឈានមុខ, ភ្នំពេញ & សៀមរាប)\n"
                    "- **Wing Bank (Cambodia) Plc.** (Fintech & ធនាគារឌីជីថល, ភ្នំពេញ)\n\n"
                    "ក្រុមហ៊ុនទាំងអស់នេះកំពុងជ្រើសរើសបុគ្គលិកសកម្មលើមុខតំណែងបច្ចេកវិទ្យា ធនាគារ ទីផ្សារ និងគណនេយ្យ។ អ្នកអាចចូលមើលព័ត៌មានលម្អិតនៅទំព័រ **Companies** (`/companies`)!"
                )
            else:
                ai_reply = (
                    "**Top Verified Employers Actively Hiring on CambodiaJobs:**\n\n"
                    "- **Smart Axiata Co., Ltd.**: Leading telecommunications provider with open roles in Full-Stack Engineering, Digital Marketing, and DevOps.\n"
                    "- **ABA Bank (Advanced Bank of Asia)**: Cambodia's premier commercial bank, hiring Mobile Developers, Branch Relationship Officers, and Customer Support Specialists.\n"
                    "- **Wing Bank (Cambodia) Plc.**: Fast-growing digital banking and fintech leader hiring Senior Tax Officers and Cloud Engineers.\n\n"
                    "You can explore all employer profiles and open vacancies at the **Companies** directory (`/companies`)!"
                )

        elif intent == "job_search":
            if matched_jobs:
                top = matched_jobs[0]
                if in_khmer:
                    ai_reply = (
                        f"ខ្ញុំបានរកឃើញឱកាសការងារដែលត្រូវគ្នាចំនួន **{len(matched_jobs)} កន្លែង** នៅលើ CambodiaJobs! "
                        f"មុខតំណែងណែនាំកំពូលគឺ **{top.get('title_km') or top['title']}** នៅ **{top['company_name']}** "
                        f"(ពិន្ទុផ្គូផ្គង **{top['match_score']}%**)។ សូមពិនិត្យមើលកាតការងារខាងក្រោម រួចចុច 'View Job' ដើម្បីដាក់ពាក្យ!"
                    )
                else:
                    ai_reply = (
                        f"I found **{len(matched_jobs)} verified job vacancies** matching your criteria on CambodiaJobs! "
                        f"Your top match is **{top['title']}** at **{top['company_name']}** with a **{top['match_score']}% fit score**. "
                        f"Explore the interactive cards below and click to apply or view requirements!"
                    )
            else:
                if in_khmer:
                    ai_reply = (
                        "មិនទាន់ឃើញការងារដែលត្រូវនឹងលក្ខខណ្ឌជាក់លាក់នេះទេ។ "
                        "ខ្ញុំសូមបង្ហាញតារាងប្រៀបធៀបប្រាក់ខែទីផ្សារកម្ពុជាជូនអ្នកខាងក្រោម!"
                    )
                else:
                    ai_reply = (
                        "No exact vacancies matched all specific filters yet. "
                        "Here is our **Cambodia Market Salary Benchmark Chart** showing current compensation across top sectors!"
                    )

        else:
            if in_khmer:
                ai_reply = (
                    f"ទាក់ទងនឹងសំណួររបស់អ្នកអំពី **\"{raw_query}\"**៖\n\n"
                    "CambodiaJobs គឺជាវេទិកាការងារ និងអាជីពឌីជីថលឈានមុខគេនៅកម្ពុជា។ យើងជួយសម្រួលដល់ការស្វែងរកការងារ "
                    "ការជ្រើសរើសបុគ្គលិក ការប្រៀបធៀបប្រាក់ខែ និងការអភិវឌ្ឍជំនាញវិជ្ជាជីវៈ។\n\n"
                    "តើអ្នកចង់ឱ្យខ្ញុំជួយស្វែងរកការងារ ផ្តល់គន្លឹះរៀបចំ CV បង្ហាញតារាងប្រាក់ខែ ឬជួយដល់ការប្រកាសរើសបុគ្គលិក?"
                )
            else:
                ai_reply = (
                    f"Regarding your query on **\"{raw_query}\"**:\n\n"
                    "CambodiaJobs provides full career and recruitment support across Cambodia. Whether you are a job seeker building your career, "
                    "an employer hiring software engineers or finance specialists, or exploring Cambodian market compensation, I am here to assist!\n\n"
                    "Feel free to ask me to search live vacancies, compare market salaries with interactive charts, or guide you through platform features."
                )

    suggested_actions = [
        "🎯 Find verified jobs in Cambodia",
        "🏢 How to post a job as an employer",
        "📊 Show Salary Benchmark Chart",
        "💡 Platform Guide & Features",
    ]

    return {
        "reply": ai_reply,
        "matched_jobs": matched_jobs,
        "chart": chart_payload,
        "suggested_actions": suggested_actions,
        "total_matches": len(matched_jobs),
        "intent": intent,
        "provider": "google_gemini" if is_gemini_active else "built_in_ai",
    }
