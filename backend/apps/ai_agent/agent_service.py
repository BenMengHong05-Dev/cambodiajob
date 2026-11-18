"""
General AI Platform Agent Service for CambodiaJobs with Google Gemini Integration.
Dynamically searches the live Cambodian recruitment database for jobs, categories,
companies, and real salary distributions.
Supports:
- Job Seekers (dynamic job search, live skill matching, CV & interview prep)
- Employers & Recruiters (posting jobs, hiring tips, candidate management)
- General Visitors (platform navigation, live Cambodian market insights & real-time salary charts)
- Multi-intent dynamic query detection & database grounding
- Google Gemini API with seamless fallback to built-in intelligent engine
- 100% Bilingual (English & Khmer)
"""

import json
import logging
import os
import re
import urllib.request
import urllib.error
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple
from django.conf import settings

from common.database import fetch_all, fetch_one, fetch_scalar

logger = logging.getLogger(__name__)

KHR_PER_USD = 4100.0


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


def format_salary_range(salary_min: Any, salary_max: Any, currency: str = "USD") -> str:
    """Format salary range string cleanly for display in conversational replies."""
    if not salary_min and not salary_max:
        return "Negotiable"
    if currency == "KHR":
        min_fmt = f"{int(salary_min):,} KHR" if salary_min else ""
        max_fmt = f"{int(salary_max):,} KHR" if salary_max else ""
        usd_min = round(float(salary_min) / KHR_PER_USD) if salary_min else 0
        usd_max = round(float(salary_max) / KHR_PER_USD) if salary_max else 0
        if min_fmt and max_fmt:
            return f"{min_fmt} - {max_fmt} (~${usd_min} - ${usd_max} USD)"
        return f"{min_fmt or max_fmt} (~${usd_min or usd_max} USD)"
    else:
        min_fmt = f"${int(salary_min):,}" if salary_min else ""
        max_fmt = f"${int(salary_max):,}" if salary_max else ""
        if min_fmt and max_fmt:
            return f"{min_fmt} - {max_fmt} USD"
        return f"{min_fmt or max_fmt} USD"


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
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """
    Search and rank active jobs in Cambodia matching criteria,
    computing fit score (0-100%) and matched/missing skill breakdown.
    Uses dynamic multi-field scoring across titles, categories, companies, descriptions, and skills.
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
            cat.id AS category_id, cat.name_en AS category_name_en, cat.name_km AS category_name_km
        FROM jobs j
        INNER JOIN companies c ON c.id = j.company_id
        LEFT JOIN job_categories cat ON cat.id = j.category_id
        WHERE j.status = 'published' AND j.moderation_status = 'approved'
    """
    params: List[Any] = []

    if province and province.lower() != "all":
        sql += " AND (LOWER(j.province) = LOWER(%s) OR LOWER(j.city) = LOWER(%s))"
        params.extend([province, province])

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
        # Normalize comparison to USD or KHR
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

    # Extract tokens: alphanumeric + Khmer characters (minimum length 2 so IT, AI, HR, QA, UI work)
    en_tokens = [t.lower() for t in re.findall(r"[A-Za-z0-9_#+]+", query_text) if len(t) >= 2]
    km_tokens = [t for t in re.findall(r"[\u1780-\u17ff]+", query_text) if len(t) >= 2]
    tokens = en_tokens + km_tokens

    # Remove common conversational stop words that shouldn't distort ranking
    stop_words = {
        "the", "for", "and", "with", "jobs", "job", "find", "show", "what", "how", "much",
        "salary", "salaries", "chart", "benchmark", "want", "like", "need", "about", "are",
        "can", "any", "top", "good", "best", "work", "looking", "search",
        "ការងារ", "ស្វែងរក", "ប្រាក់ខែ", "តារាង", "ចង់បាន", "ត្រូវការ"
    }
    meaningful_tokens = [t for t in tokens if t not in stop_words]
    effective_tokens = meaningful_tokens if meaningful_tokens else tokens

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
        cat_en_lower = (job["category_name_en"] or "").lower()
        cat_km_lower = (job["category_name_km"] or "").lower()

        score = 60
        matched_tokens_count = 0

        for token in effective_tokens:
            matched = False
            if token in title_lower or token in title_km_lower:
                score += 25
                matched = True
            if token in comp_lower:
                score += 20
                matched = True
            if token in cat_en_lower or token in cat_km_lower:
                score += 18
                matched = True
            if token in req_names_lower:
                score += 15
                matched = True
            elif token in desc_lower:
                score += 8
                matched = True

            if matched:
                matched_tokens_count += 1

        matched_skills = []
        missing_skills = []
        for s in req_names:
            s_low = s.lower()
            if candidate_skills_set and s_low in candidate_skills_set:
                matched_skills.append(s)
            elif any(token in s_low for token in effective_tokens):
                matched_skills.append(s)
            else:
                missing_skills.append(s)

        if candidate_skills_set and req_names:
            overlap_ratio = len(matched_skills) / len(req_names)
            score += int(overlap_ratio * 30)

        # Cap score between 55% and 98%
        final_score = min(98, max(55, score))

        job_result = {
            **decimal_to_float(job),
            "skills": req_names,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "match_score": final_score,
            "matched_tokens_count": matched_tokens_count,
        }
        ranked_jobs.append(job_result)

    # If query had meaningful tokens, only return jobs that actually matched at least one token
    if meaningful_tokens:
        matched_jobs = [j for j in ranked_jobs if j["matched_tokens_count"] > 0]
        matched_jobs.sort(key=lambda x: (x["matched_tokens_count"], x["match_score"]), reverse=True)
        return matched_jobs[:limit]
    else:
        ranked_jobs.sort(key=lambda x: x["match_score"], reverse=True)
        return ranked_jobs[:limit]


def get_live_platform_stats() -> Dict[str, Any]:
    """
    Fetch comprehensive live statistics from the MySQL platform database.
    Strictly aggregates active published jobs. Never fabricates numbers.
    """
    active_categories = fetch_all(
        """
        SELECT 
            c.id, c.name_en, c.name_km,
            COUNT(j.id) AS job_count,
            ROUND(MIN(CASE WHEN j.salary_currency = 'USD' THEN j.salary_min ELSE j.salary_min / 4100 END)) AS min_salary_usd,
            ROUND(AVG(CASE WHEN j.salary_currency = 'USD' THEN (j.salary_min + j.salary_max)/2 ELSE ((j.salary_min + j.salary_max)/2) / 4100 END)) AS avg_salary_usd,
            ROUND(MAX(CASE WHEN j.salary_currency = 'USD' THEN j.salary_max ELSE j.salary_max / 4100 END)) AS max_salary_usd
        FROM job_categories c
        INNER JOIN jobs j ON j.category_id = c.id AND j.status = 'published' AND j.moderation_status = 'approved'
        GROUP BY c.id, c.name_en, c.name_km
        ORDER BY job_count DESC, avg_salary_usd DESC
        """
    )

    active_companies = fetch_all(
        """
        SELECT 
            c.id, c.name, c.slug, c.logo_url, c.city, c.verification_status,
            COUNT(j.id) AS job_count
        FROM companies c
        INNER JOIN jobs j ON j.company_id = c.id AND j.status = 'published' AND j.moderation_status = 'approved'
        GROUP BY c.id, c.name, c.slug, c.logo_url, c.city, c.verification_status
        ORDER BY job_count DESC, c.name ASC
        """
    )

    top_skills = fetch_all(
        """
        SELECT s.name, COUNT(js.id) as demand_count
        FROM skills s
        INNER JOIN job_skills js ON js.skill_id = s.id
        INNER JOIN jobs j ON j.id = js.job_id AND j.status = 'published' AND j.moderation_status = 'approved'
        GROUP BY s.id, s.name
        ORDER BY demand_count DESC
        LIMIT 6
        """
    )

    total_jobs = sum(c["job_count"] for c in active_categories)

    return {
        "total_jobs": total_jobs,
        "categories": decimal_to_float(active_categories),
        "companies": decimal_to_float(active_companies),
        "top_skills": decimal_to_float(top_skills),
    }


def get_market_chart_data(category_name: Optional[str] = None) -> Dict[str, Any]:
    """Compatibility helper returning live platform salary benchmarks, province stats, and top skills."""
    platform_stats = get_live_platform_stats()
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

    # Real published jobs from platform with salary data
    recent_jobs = fetch_all(
        """
        SELECT j.id, j.title, j.title_km, j.salary_min, j.salary_max, j.salary_currency, c.name as company_name
        FROM jobs j
        LEFT JOIN companies c ON c.id = j.company_id
        WHERE j.status = 'published' AND j.moderation_status = 'approved' AND (j.salary_min > 0 OR j.salary_max > 0)
        ORDER BY j.created_at DESC
        LIMIT 6
        """
    )
    KHR_PER_USD = 4100
    job_chart_items = []
    for j in recent_jobs:
        s_min = float(j.get("salary_min") or 0)
        s_max = float(j.get("salary_max") or 0)
        if j.get("salary_currency") == "KHR":
            s_min = round(s_min / KHR_PER_USD)
            s_max = round(s_max / KHR_PER_USD)
        job_chart_items.append({
            "label": j["title"],
            "label_km": j.get("title_km") or j["title"],
            "min": s_min,
            "max": s_max,
            "company": j.get("company_name") or "",
        })

    # Aggregate real category benchmarks from platform, rounded to clean standard market numbers
    category_chart_items = []
    live_cats = platform_stats.get("categories", [])
    seen_names = set()

    # Standard Cambodia market benchmarks by major fields
    DEFAULT_CAMBODIA_BENCHMARKS = [
        {"name_en": "Information Technology & Software", "name_km": "បច្ចេកវិទ្យាព័ត៌មាន និងកម្មវិធី", "min": 600, "max": 3000},
        {"name_en": "Banking & Financial Services", "name_km": "ធនាគារ និងសេវាហិរញ្ញវត្ថុ", "min": 500, "max": 2500},
        {"name_en": "Accounting & Auditing", "name_km": "គណនេយ្យ និងសវនកម្ម", "min": 500, "max": 1500},
        {"name_en": "Sales, Retail & Business Development", "name_km": "ការលក់ និងអភិវឌ្ឍន៍អាជីវកម្ម", "min": 450, "max": 1400},
        {"name_en": "Customer Support & Call Center", "name_km": "សេវាកម្មអតិថិជន", "min": 350, "max": 850},
    ]

    for cat in live_cats[:5]:
        c_min = float(cat.get("min_salary_usd") or 0)
        c_max = float(cat.get("max_salary_usd") or 0)
        # Round cleanly to nearest $50 for realistic Cambodia benchmarks (no odd numbers like $488 or $854)
        c_min_clean = max(200, round(c_min / 50) * 50) if c_min > 0 else 400
        c_max_clean = max(c_min_clean + 200, round(c_max / 50) * 50) if c_max > 0 else 1200
        job_cnt = int(cat.get("job_count", 0))
        seen_names.add(cat.get("name_en", "").lower())
        category_chart_items.append({
            "label": cat.get("name_en", "General"),
            "label_km": cat.get("name_km") or cat.get("name_en", "ទូទៅ"),
            "min": c_min_clean,
            "max": c_max_clean,
            "count": job_cnt,
        })

    # If fewer than 5 categories have published jobs, supplement with standard Cambodia benchmarks
    for bench in DEFAULT_CAMBODIA_BENCHMARKS:
        if len(category_chart_items) >= 5:
            break
        if bench["name_en"].lower() not in seen_names:
            category_chart_items.append({
                "label": bench["name_en"],
                "label_km": bench["name_km"],
                "min": bench["min"],
                "max": bench["max"],
                "count": 0,
            })
            seen_names.add(bench["name_en"].lower())

    chart_data = {
        "type": "salary_benchmark",
        "title": "Cambodia Market Salary Benchmarks",
        "title_km": "កម្រិតប្រាក់ខែទីផ្សារការងារកម្ពុជា",
        "items": category_chart_items,
    }

    return {
        "chart": chart_data,
        "job_items": job_chart_items,
        "category_items": category_chart_items,
        "categories_salary": platform_stats["categories"],
        "provinces": decimal_to_float(province_stats),
        "top_skills": platform_stats["top_skills"],
    }


def call_gemini_api(
    prompt: str,
    api_key: str,
    system_instruction: Optional[str] = None,
    history: Optional[List[Dict[str, str]]] = None,
    preferred_model: Optional[str] = None,
    max_tokens: int = 2048,
) -> Optional[str]:
    """
    Call Google Gemini REST API using the provided API key.
    Supports gemini-3.5-flash-lite, gemini-3.1-flash-lite, and gemini-2.5-flash.
    """
    if not api_key or api_key.strip() in ("", "your_gemini_api_key_here"):
        return None

    clean_key = api_key.strip()

    contents = []
    if history:
        for turn in history[-4:]:
            role = "user" if turn.get("sender") == "user" else "model"
            text = turn.get("text", "")
            if text:
                contents.append({"role": role, "parts": [{"text": text}]})

    contents.append({"role": "user", "parts": [{"text": prompt}]})

    payload: Dict[str, Any] = {
        "contents": contents,
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": max_tokens,
        },
    }

    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }

    models_to_try = [preferred_model] if preferred_model else []
    for m in ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-flash-latest"]:
        if m and m not in models_to_try:
            models_to_try.append(m)

    for model in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={clean_key}"
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
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


def call_openai_compatible_api(
    prompt: str,
    api_key: str,
    base_url: str = "https://api.openai.com/v1",
    model: str = "gpt-4o-mini",
    system_instruction: Optional[str] = None,
    history: Optional[List[Dict[str, str]]] = None,
    max_tokens: int = 2048,
) -> Optional[str]:
    """
    Call OpenAI, DeepSeek, Groq, OpenRouter, or any OpenAI-compatible Chat Completions API.
    Endpoint: {base_url}/chat/completions
    """
    if not api_key or api_key.strip() in ("", "your_openai_api_key_here", "your_deepseek_api_key_here", "your_api_key_here"):
        return None

    clean_key = api_key.strip()
    clean_url = base_url.rstrip("/")
    if not clean_url.endswith("/chat/completions"):
        endpoint = f"{clean_url}/chat/completions"
    else:
        endpoint = clean_url

    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})

    if history:
        for turn in history[-4:]:
            role = "user" if turn.get("sender") == "user" else "assistant"
            text = turn.get("text", "")
            if text:
                messages.append({"role": role, "content": text})

    messages.append({"role": "user", "content": prompt})

    payload: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": max_tokens,
    }

    req = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {clean_key}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            choices = res_data.get("choices", [])
            if choices:
                msg = choices[0].get("message", {})
                content = msg.get("content")
                if content:
                    return content.strip()
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="ignore")
        logger.warning("OpenAI-compatible API HTTP %s for endpoint %s: %s", e.code, endpoint, error_body)
    except Exception as e:
        logger.warning("OpenAI-compatible API call failed for endpoint %s: %s", endpoint, e)

    return None


def resolve_ai_config(
    api_key_override: Optional[str] = None,
    provider_override: Optional[str] = None,
    model_override: Optional[str] = None,
    base_url_override: Optional[str] = None,
) -> Dict[str, Any]:
 
    env_vals: Dict[str, str] = {}
    try:
        from dotenv import dotenv_values
        env_vals = dotenv_values(settings.BASE_DIR / ".env")
    except Exception:
        pass

    def get_val(key: str, default: str = "") -> str:
        return (
            (env_vals.get(key) or "").strip()
            or (os.getenv(key) or "").strip()
            or getattr(settings, key, default)
            or default
        ).strip()

    # The 2 Primary Variables: AI_MODEL and AI_API_KEY (Options: gemini or deepseek)
    selected_model = (
        model_override
        or provider_override
        or get_val("AI_MODEL", "")
        or get_val("AI_PROVIDER", "gemini")
    ).lower().strip()

    ai_api_key = (
        api_key_override
        or get_val("AI_API_KEY", "")
        or get_val("GEMINI_API_KEY", "")
        or get_val("DEEPSEEK_API_KEY", "")
    ).strip()

    base_url = (base_url_override or get_val("AI_BASE_URL", "")).strip()

    # Resolve between the two options: gemini or deepseek
    if "deepseek" in selected_model:
        provider = "deepseek"
        model_name = "deepseek-chat"
        base_url = base_url or "https://api.deepseek.com/v1"
    elif "gemini" in selected_model:
        provider = "gemini"
        model_name = "gemini-2.5-flash"
        base_url = "https://generativelanguage.googleapis.com/v1beta"
    else:
        # Auto-detect if AI_MODEL was set to auto or unknown
        if ai_api_key.startswith("sk-"):
            provider = "deepseek"
            model_name = "deepseek-chat"
            base_url = base_url or "https://api.deepseek.com/v1"
        else:
            provider = "gemini"
            model_name = "gemini-2.5-flash"
            base_url = "https://generativelanguage.googleapis.com/v1beta"

    is_active = bool(
        ai_api_key
        and ai_api_key not in (
            "",
            "your_ai_api_key_here",
            "your_gemini_api_key_here",
            "your_deepseek_api_key_here",
        )
    )

    return {
        "is_active": is_active,
        "provider": provider if is_active else "built_in_ai",
        "api_key": ai_api_key,
        "model": model_name,
        "base_url": base_url,
    }


def call_universal_ai(
    prompt: str,
    system_instruction: Optional[str] = None,
    history: Optional[List[Dict[str, str]]] = None,
    api_key_override: Optional[str] = None,
    provider_override: Optional[str] = None,
    model_override: Optional[str] = None,
    base_url_override: Optional[str] = None,
    max_tokens: int = 2048,
) -> Tuple[Optional[str], str, str]:
    """
    Universal AI Dispatcher.
    Routes queries to Google Gemini, OpenAI (ChatGPT), DeepSeek, or custom provider.
    Returns (reply_text, provider_name, model_name).
    """
    cfg = resolve_ai_config(
        api_key_override=api_key_override,
        provider_override=provider_override,
        model_override=model_override,
        base_url_override=base_url_override,
    )

    if not cfg["is_active"]:
        return None, "built_in_ai", "built_in_ai"

    provider = cfg["provider"]
    api_key = cfg["api_key"]
    model = cfg["model"]
    base_url = cfg["base_url"]

    reply = None
    if provider == "gemini":
        reply = call_gemini_api(
            prompt=prompt,
            api_key=api_key,
            system_instruction=system_instruction,
            history=history,
            preferred_model=model,
            max_tokens=max_tokens,
        )
        # Automatic developer fallback: If Gemini fails, try DeepSeek if configured
        if not reply and not api_key_override:
            ds_cfg = resolve_ai_config(provider_override="deepseek")
            if ds_cfg["is_active"] and ds_cfg["api_key"] != api_key:
                logger.info("Failover: Attempting DeepSeek after Gemini failure...")
                reply = call_openai_compatible_api(
                    prompt=prompt,
                    api_key=ds_cfg["api_key"],
                    base_url=ds_cfg["base_url"],
                    model=ds_cfg["model"],
                    system_instruction=system_instruction,
                    history=history,
                    max_tokens=max_tokens,
                )
                if reply:
                    return reply, "deepseek", ds_cfg["model"]

    elif provider == "deepseek":
        reply = call_openai_compatible_api(
            prompt=prompt,
            api_key=api_key,
            base_url=base_url,
            model=model,
            system_instruction=system_instruction,
            history=history,
            max_tokens=max_tokens,
        )
        # Automatic developer fallback: If DeepSeek fails, try Gemini if configured
        if not reply and not api_key_override:
            gem_cfg = resolve_ai_config(provider_override="gemini")
            if gem_cfg["is_active"] and gem_cfg["api_key"] != api_key:
                logger.info("Failover: Attempting Gemini after DeepSeek failure...")
                reply = call_gemini_api(
                    prompt=prompt,
                    api_key=gem_cfg["api_key"],
                    system_instruction=system_instruction,
                    history=history,
                    preferred_model=gem_cfg["model"],
                    max_tokens=max_tokens,
                )
                if reply:
                    return reply, "gemini", gem_cfg["model"]

    elif provider in ("openai", "custom"):
        reply = call_openai_compatible_api(
            prompt=prompt,
            api_key=api_key,
            base_url=base_url,
            model=model,
            system_instruction=system_instruction,
            history=history,
            max_tokens=max_tokens,
        )

    if reply:
        return reply, provider, model

    # If calling primary external provider failed, return None to trigger intelligent fallback
    return None, provider, model


def search_platform_data(query_text: str, limit: int = 5) -> Dict[str, Any]:
    """
    First searches the live platform database for matching vacancies and verified companies.
    """
    clean_query = (query_text or "").strip()
    if not clean_query:
        return {"jobs": [], "companies": []}

    greetings = {
        "hello", "hi", "hey", "hola", "halo", "good morning", "good afternoon", "good evening",
        "សួស្តី", "ជំរាបសួរ", "អរគុណ", "thank you", "thanks"
    }
    if clean_query.lower() in greetings:
        return {"jobs": [], "companies": []}

    # 1. Search matching vacancies
    jobs = find_matching_jobs(query_text=clean_query, limit=limit)

    # 2. Search verified companies
    tokens = [t.lower() for t in re.findall(r"[A-Za-z0-9_#+]+", clean_query) if len(t) >= 2]
    companies = []
    if tokens:
        like_parts = " OR ".join(["LOWER(name) LIKE %s" for _ in tokens])
        params = [f"%{t}%" for t in tokens]
        try:
            companies = fetch_all(
                f"""
                SELECT id, name, slug, logo_url, city, verification_status
                FROM companies
                WHERE verification_status = 'verified' AND ({like_parts})
                LIMIT 3
                """,
                params,
            )
        except Exception:
            companies = []

    return {
        "jobs": jobs,
        "companies": decimal_to_float(companies),
    }


def process_ai_agent_chat(
    message: str,
    user_id: Optional[int] = None,
    history: Optional[List[Dict[str, str]]] = None,
    api_key: Optional[str] = None,
    provider: Optional[str] = None,
    model: Optional[str] = None,
    base_url: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Chatbot flow:
    1. First searches the platform database for matching jobs and companies.
    2. Sends the user query along with the live platform search results to the AI model (Gemini or DeepSeek).
    3. The AI model crafts the natural, intelligent response grounded in live platform data.
    4. Returns the AI response and attaches the matched job cards.
    """
    raw_query = (message or "").strip()
    in_khmer = is_khmer_text(raw_query)

    # 1. FIRST SEARCH ON PLATFORM
    platform_data = search_platform_data(raw_query, limit=5)
    matched_jobs = platform_data["jobs"]
    matched_companies = platform_data["companies"]

    # Format live search results for the AI model
    search_context_lines = []
    if matched_jobs:
        search_context_lines.append(f"Matching Vacancies Found on Platform ({len(matched_jobs)}):")
        for j in matched_jobs:
            sal_str = format_salary_range(j.get("salary_min"), j.get("salary_max"), j.get("salary_currency", "USD"))
            loc = j.get("province") or j.get("city") or "Cambodia"
            search_context_lines.append(f"- {j['title']} at {j['company_name']} ({loc}, {sal_str})")

    if matched_companies:
        search_context_lines.append(f"Matching Verified Employers Found ({len(matched_companies)}):")
        for c in matched_companies:
            search_context_lines.append(f"- {c['name']} (Verified, {c.get('city') or 'Cambodia'})")

    platform_context = "\n".join(search_context_lines) if search_context_lines else "No specific matching jobs or companies found in the live database for this query."

    # 2. RESOLVE AI MODEL CONFIGURATION
    ai_cfg = resolve_ai_config(
        api_key_override=api_key,
        provider_override=provider,
        model_override=model,
        base_url_override=base_url,
    )

    provider_title = {
        "gemini": "Google Gemini",
        "openai": "OpenAI ChatGPT",
        "deepseek": "DeepSeek AI",
    }.get(ai_cfg["provider"], "AI")

    website_url = "https://cambodiajob.menghong.site"

    system_instruction = f"""You are the official AI Career & Platform Assistant for CambodiaJobs ({website_url}), powered by {provider_title}.
CambodiaJobs is Cambodia's premier recruitment and career platform connecting job seekers with verified employers across Cambodia.

CORE GUIDELINES:
- Respond naturally, intelligently, and warmly to whatever the user asks.
- LANGUAGE RULE: Match the user's language. If the user writes in Khmer, reply in fluent, natural Khmer. If in English, reply in English.
- Provide expert career advice, CV improvement, interview tips, hiring recommendations, and answer general questions.
- Format responses cleanly using Markdown with bullet points and bolding.

LIVE PLATFORM SEARCH RESULTS (First searched from CambodiaJobs database for user query "{raw_query}"):
{platform_context}

INSTRUCTIONS FOR PLATFORM SEARCH:
- If matching jobs or companies were found above, reference them directly in your response!
- When jobs are found, mention that the user can explore the full details and apply directly through the job cards below.
- Provide direct, clickable Markdown links to search live on {website_url}:
  * Search all jobs: [Browse Live Jobs]({website_url}/jobs)
  * Search jobs by topic: [Search Jobs]({website_url}/jobs?q=KEYWORD) (e.g. `[Search Developer Jobs]({website_url}/jobs?q=developer)`)
  * Verified companies: [Verified Employers & Companies]({website_url}/companies)
  * Seeker profile & CV builder: [Job Seeker Profile]({website_url}/seeker/profile)
  * Employer post a job: [Post a Job]({website_url}/employer/jobs/new)"""

    universal_reply, res_provider, res_model = call_universal_ai(
        prompt=raw_query,
        system_instruction=system_instruction,
        history=history,
        api_key_override=api_key,
        provider_override=provider,
        model_override=model,
        base_url_override=base_url,
    )

    if universal_reply:
        reply_text = universal_reply
        active_provider = res_provider
        active_model = res_model
    else:
        # Fallback only if external AI API is unreachable
        if in_khmer:
            if matched_jobs:
                reply_text = f"ខ្ញុំបានរកឃើញឱកាសការងារសកម្មចំនួន **{len(matched_jobs)} កន្លែង** នៅលើ CambodiaJobs! សូមពិនិត្យមើលកាតការងារខាងក្រោម។"
            else:
                reply_text = "សួស្តី! ខ្ញុំជាជំនួយការ AI របស់ CambodiaJobs។ តើខ្ញុំអាចជួយអ្វីដល់លោកអ្នកនៅថ្ងៃនេះ?"
        else:
            if matched_jobs:
                reply_text = f"I found **{len(matched_jobs)} verified vacancies** matching your search on CambodiaJobs! Check out the job cards below."
            else:
                reply_text = "Hello! I am your CambodiaJobs AI Assistant. How can I assist you today?"
        active_provider = ai_cfg["provider"]
        active_model = ai_cfg["model"]

    # 3. DYNAMIC CAREER & SALARY BENCHMARK CHART
    chart_data = None
    query_lower = raw_query.lower()
    salary_keywords = [
        "salary", "pay", "wage", "compensation", "benchmark", "chart",
        "ប្រាក់ខែ", "បៀវត្ស", "តារាង", "ស្ថិតិ", "ទីផ្សារ", "rate", "ថវិកា"
    ]
    is_salary_query = any(k in query_lower for k in salary_keywords)

    if is_salary_query or "benchmark" in query_lower:
        stats = get_live_platform_stats()
        categories = stats.get("categories", [])
        if categories:
            chart_items = []
            for cat in categories[:6]:
                chart_items.append({
                    "label": cat.get("name_en", "General"),
                    "label_km": cat.get("name_km") or cat.get("name_en", "ទូទៅ"),
                    "min": float(cat.get("min_salary_usd") or 300),
                    "max": float(cat.get("max_salary_usd") or 1500),
                    "count": int(cat.get("job_count", 0)),
                })
            chart_data = {
                "type": "salary_benchmark",
                "title": "Platform Job Salary Benchmark (USD)",
                "title_km": "តារាងប្រៀបធៀបប្រាក់ខែការងារលើប្រព័ន្ធ (USD)",
                "items": chart_items,
            }
    elif user_id and any(k in query_lower for k in ["match", "fit", "skill", "profile", "cv", "ជំនាញ"]):
        profile_info = get_seeker_profile_data(user_id)
        if profile_info and profile_info.get("skills"):
            user_skills = set(s.lower() for s in profile_info["skills"])
            stats = get_live_platform_stats()
            top_skills = stats.get("top_skills", [])
            items = []
            matched = 0
            for s in top_skills[:5]:
                has = s["name"].lower() in user_skills
                if has:
                    matched += 1
                items.append({
                    "skill": s["name"],
                    "user_has": has,
                })
            score = round((matched / max(len(items), 1)) * 100) if items else 75
            chart_data = {
                "type": "skill_match",
                "title": f"Candidate Skill Alignment ({score}%)",
                "title_km": f"កម្រិតត្រូវគ្នានៃជំនាញបេក្ខជន ({score}%)",
                "match_score": max(50, score),
                "items": items,
            }
    elif matched_jobs and any(j.get("salary_min") or j.get("salary_max") for j in matched_jobs):
        chart_items = []
        for j in matched_jobs[:5]:
            s_min = float(j.get("salary_min") or 350)
            s_max = float(j.get("salary_max") or 1200)
            if j.get("salary_currency") == "KHR":
                s_min = round(s_min / KHR_PER_USD)
                s_max = round(s_max / KHR_PER_USD)
            chart_items.append({
                "label": j["title"],
                "label_km": j.get("title_km") or j["title"],
                "min": s_min,
                "max": s_max,
                "company": j.get("company_name"),
            })
        if chart_items:
            chart_data = {
                "type": "salary_benchmark",
                "title": f"Salary Range: {raw_query[:25]}",
                "title_km": f"កម្រិតប្រាក់ខែ: {raw_query[:25]}",
                "items": chart_items,
            }

    suggested_actions = [
        "🎯 ស្វែងរកការងារលើគេហទំព័រ" if in_khmer else "🎯 Search Live Jobs",
        "🏢 ស្វែងរកក្រុមហ៊ុនដែលបានផ្ទៀងផ្ទាត់" if in_khmer else "🏢 Browse Verified Companies",
        "📊 តារាងប្រាក់ខែទីផ្សារកម្ពុជា" if in_khmer else "📊 Salary Benchmark Chart",
        "📄 គន្លឹះរៀបចំ CV & សម្ភាសន៍" if in_khmer else "📄 CV & Interview Tips",
    ]

    return {
        "reply": reply_text,
        "matched_jobs": matched_jobs,
        "chart": chart_data,
        "suggested_actions": suggested_actions,
        "total_matches": len(matched_jobs),
        "intent": "job_search" if matched_jobs else "general_qa",
        "provider": active_provider,
        "model": active_model,
    }


def generate_ai_cover_letter(
    job_title: str,
    company_name: str,
    job_description: Optional[str] = "",
    candidate_skills: Optional[List[str]] = None,
    candidate_name: Optional[str] = "Candidate",
    experience_summary: Optional[str] = "",
    is_khmer: bool = False,
    api_key: Optional[str] = None,
) -> str:
    """
    Generate an engaging, highly professional, tailored cover letter for a job opportunity.
    Adheres strictly to modern Cambodian and international business writing standards.
    """
    skills_str = ", ".join(candidate_skills) if candidate_skills else ("ជំនាញវិជ្ជាជីវៈពាក់ព័ន្ធ" if is_khmer else "relevant professional competencies")
    clean_name = (candidate_name or "").strip()
    if not clean_name or clean_name.lower() in ("candidate", "none", "null", "បេក្ខជន"):
        clean_name = "បេក្ខជន" if is_khmer else "Candidate"

    if is_khmer:
        system_instruction = (
            "អ្នកគឺជាអ្នកជំនាញសរសេរលិខិតណែនាំខ្លួន (Cover Letter / លិខិតស្នើសុំបម្រើការងារ) កម្រិតអាជីពជាន់ខ្ពស់នៅកម្ពុជា។ "
            "អ្នកមានវោហារសព្ទការងារផ្លូវការ ថ្លៃថ្នូរ គួរសម ត្រឹមត្រូវតាមក្បួនខ្នាតវេយ្យាករណ៍ និងទំនៀមទម្លាប់ការទូតការងារក្នុងស្ថាប័នកម្ពុជា (Khmer Business Etiquette)។ "
            "គោលដៅរបស់អ្នកគឺជួយឱ្យបេក្ខជនលេចធ្លោ មានភាពទាក់ទាញ និងបង្ហាញពីតម្លៃសមត្ថភាពជាក់ស្តែងជូននិយោជក។"
        )
        prompt = f"""សូមជួយរៀបចំ «លិខិតណែនាំខ្លួន / លិខិតស្នើសុំបម្រើការងារ» (Professional Cover Letter) មួយច្បាប់យ៉ាងប្រណិត ផ្លូវការ និងមានភាពទាក់ទាញបំផុត សម្រាប់ព័ត៌មានខាងក្រោម៖

- មុខតំណែងការងារ៖ {job_title}
- ស្ថាប័ន / ក្រុមហ៊ុន៖ {company_name}
- ឈ្មោះបេក្ខជន៖ {clean_name}
- ជំនាញស្នូលរបស់បេក្ខជន៖ {skills_str}
- ប្រវត្តិនិងបទពិសោធន៍៖ {experience_summary or 'មានបទពិសោធន៍ និងសមត្ថភាពជំនាញរឹងមាំក្នុងការបំពេញការងារ'}
- ការពិពណ៌នាការងារសង្ខេប៖ {job_description[:600] if job_description else 'តម្រូវការទូទៅសម្រាប់មុខតំណែង ' + job_title}

គោលការណ៍ណែនាំតឹងរ៉ឹងក្នុងការសរសេរ (CRITICAL RULES)៖
១. កុំដាក់ចំណងជើងក្បាលទំព័រដាច់ខាត ដូចជា **សេចក្តីថ្លែងការណ៍...** ឬ **Cover Letter** ឬ **ឈ្មោះ៖** ឬ **មុខតំណែង៖** ឡើយ។
២. ត្រូវចាប់ផ្តើមភ្លាមៗដោយពាក្យគួរសមផ្លូវការ៖
«សូមគោរពជូនចំពោះ គណៈគ្រប់គ្រង និងក្រុមការងារជ្រើសរើសបុគ្គលិកនៃ {company_name}»
៣. រៀបចំជា ៣ ទៅ ៤ កថាខណ្ឌខ្លីៗ មានខ្លឹមសារស៊ីជម្រៅ៖
   - កថាខណ្ឌទី១៖ បង្ហាញពីគោលបំណង និងការប្តេជ្ញាចិត្តដ៏មុតមាំក្នុងការស្នើសុំមុខតំណែង {job_title} នៅ {company_name}។
   - កថាខណ្ឌទី២៖ បញ្ជាក់ពីសមត្ថភាព ចំណុចខ្លាំង ជំនាញស្នូល ({skills_str}) និងបទពិសោធន៍ជាក់ស្តែងដែលស្របទៅនឹងតម្រូវការរបស់ស្ថាប័ន ព្រមទាំងរបៀបដែលបេក្ខជនអាចរួមចំណែកដោះស្រាយការងារ និងអភិវឌ្ឍន៍ស្ថាប័ន។
   - កថាខណ្ឌទី៣៖ បង្ហាញពីក្រមសីលធម៌ការងារ ស្មារតីការងារជាក្រុម ការបត់បែនរហ័ស និងភាពស្មោះត្រង់។
   - កថាខណ្ឌទី៤៖ ការថ្លែងអំណរគុណយ៉ាងស្មោះស្ម័គ្រ និងបង្ហាញពីការត្រៀមខ្លួនជួបសម្ភាសន៍ពិភាក្សាដោយផ្ទាល់ (Call to Action)។
៤. បញ្ចប់ដោយពាក្យ៖
«ដោយសេចក្តីគោរពដ៏ខ្ពង់ខ្ពស់,
{clean_name}»
៥. ហាមដាច់ខាតកុំប្រើសញ្ញាវង់ក្រចក [ឈ្មោះ...] ឬ [កាលបរិច្ឆេទ] ឡើយ។ ត្រូវបំពេញឈ្មោះ {clean_name} និងឈ្មោះក្រុមហ៊ុន {company_name} ចូលក្នុងអត្ថបទដោយរលូន។
៦. ហាមមានពាក្យសន្ទនាបន្ថែម (No AI conversation or preamble) ដូចជា "នេះជាលិខិត..." ឬ "Here is..." ឡើយ។ បញ្ចេញតែខ្លឹមសារលិខិតសុទ្ធប៉ុណ្ណោះ។"""

    else:
        system_instruction = (
            "You are an executive career advisor and professional cover letter writer with over 15 years of recruitment experience. "
            "You craft compelling, polished, and human-sounding cover letters tailored to modern hiring standards. "
            "Your writing is persuasive, confident, articulate, and completely free of clichés and generic templates."
        )
        prompt = f"""Write an exceptional, highly engaging, and professional cover letter for the following position:

- Job Title: {job_title}
- Company Name: {company_name}
- Candidate Name: {clean_name}
- Key Skills: {skills_str}
- Professional Background: {experience_summary or 'Proven track record of excellence, dedication, and impactful contribution'}
- Job Overview: {job_description[:600] if job_description else 'Standard requirements and responsibilities for ' + job_title}

CRITICAL FORMATTING & CONTENT RULES:
1. DO NOT include any document titles (e.g. # Cover Letter, **Cover Letter**, Subject line, or metadata headers like Name, Position, Date).
2. Start directly with the formal salutation:
"Dear Hiring Team at {company_name},"
3. Write 3 to 4 impactful, cohesive paragraphs:
   - Paragraph 1 (The Hook): State your targeted interest in the {job_title} role at {company_name} with authentic enthusiasm, citing their respected reputation.
   - Paragraph 2 (Value Proposition): Connect your background and core skills ({skills_str}) directly to the role's needs. Highlight how your expertise will solve challenges and drive value for the team.
   - Paragraph 3 (Culture & Impact): Emphasize a strong work ethic, collaboration, continuous learning, and positive energy.
   - Paragraph 4 (Closing & Next Steps): Thank the hiring committee respectfully and invite a conversation or interview.
4. Conclude with:
"Sincerely,
{clean_name}"
5. ABSOLUTELY NO generic brackets or placeholders (e.g., [Your Name], [Insert Date], [Phone Number]). Use the provided names seamlessly.
6. NO AI conversational filler (e.g. "Here is your cover letter:", "Sure, I can help"). Return ONLY the finished letter text."""

    cover_letter, _, _ = call_universal_ai(
        prompt=prompt,
        system_instruction=system_instruction,
        api_key_override=api_key,
        max_tokens=2048,
    )

    if cover_letter:
        cleaned = cover_letter.strip()
        # Strip accidental code fences or leading markdown header if AI slipped
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`").strip()
            if cleaned.startswith("markdown") or cleaned.startswith("text"):
                cleaned = cleaned.split("\n", 1)[-1].strip()
        return cleaned

    # Fallback template
    if is_khmer:
        return f"""សូមគោរពជូនចំពោះ គណៈគ្រប់គ្រង និងក្រុមការងារជ្រើសរើសបុគ្គលិកនៃ {company_name},

ខ្ញុំបាទ/នាងខ្ញុំមានកិត្តិយស និងសេចក្តីសោមនស្សរីករាយយ៉ាងក្រៃលែងក្នុងការដាក់ពាក្យស្នើសុំបម្រើការងារក្នុងមុខតំណែង «{job_title}» នៅក្រុមហ៊ុន {company_name}។ ដោយបានតាមដាន និងកោតសរសើរចំពោះភាពរីកចម្រើន កេរ្តិ៍ឈ្មោះ និងការអភិវឌ្ឍប្រកបដោយវិជ្ជាជីវៈរបស់ស្ថាប័ន ខ្ញុំមានបំណងប្រាថ្នាយ៉ាងមុតមាំក្នុងការចូលរួមជាផ្នែកមួយនៃក្រុមការងារ។

ជាមួយនឹងចំណេះដឹង បទពិសោធន៍ និងជំនាញស្នូលពាក់ព័ន្ធដូចជា {skills_str} ខ្ញុំជឿជាក់យ៉ាងមុតមាំថានឹងអាចចូលរួមចំណែកយ៉ាងសកម្មក្នុងការបំពេញភារកិច្ច និងសម្រេចបាននូវគោលដៅយុទ្ធសាស្ត្ររបស់ស្ថាប័ន។ ខ្ញុំជាមនុស្សដែលមានស្មារតីទទួលខុសត្រូវខ្ពស់ ស្រឡាញ់ការងារ ឧស្សាហ៍ព្យាយាម រៀនសូត្ររហ័ស និងមានភាពបត់បែនល្អក្នុងការធ្វើការងារជាក្រុម។

ខ្ញុំសូមថ្លែងអំណរគុណយ៉ាងជ្រាលជ្រៅចំពោះពេលវេលា និងការពិចារណាលើពាក្យស្នើសុំរបស់ខ្ញុំ។ ខ្ញុំសង្ឃឹមយ៉ាងមុតមាំថានឹងទទួលបានឱកាសជួបសម្ភាសន៍ដោយផ្ទាល់ ដើម្បីបង្ហាញលម្អិតបន្ថែមអំពីសមត្ថភាព និងការរួមចំណែករបស់ខ្ញុំជូនស្ថាប័ន។

ដោយសេចក្តីគោរពដ៏ខ្ពង់ខ្ពស់,
{clean_name}"""
    else:
        return f"""Dear Hiring Team at {company_name},

I am writing to express my enthusiastic interest in the {job_title} position at {company_name}. Having closely followed your organization's impressive growth and commitment to excellence, I am eager to contribute my energy, skills, and professional dedication to your team.

With a strong foundation in {skills_str} alongside {experience_summary or 'demonstrated experience in achieving results'}, I am confident in my ability to hit the ground running and add immediate value to your ongoing initiatives. Throughout my career, I have prided myself on solving complex challenges, maintaining rigorous quality standards, and fostering productive, cross-functional collaboration.

Beyond technical expertise, I bring a proactive problem-solving mindset, a deep passion for continuous growth, and an unwavering commitment to operational excellence. I am excited about the opportunity to align my dedication with {company_name}'s mission.

Thank you very much for your time and thoughtful consideration. I welcome the opportunity to discuss how my background and qualifications will benefit your team in an interview.

Sincerely,
{clean_name}"""
