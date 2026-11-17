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
    """Compatibility helper returning category benchmarks, province stats, and top skills."""
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
    return {
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
            "maxOutputTokens": 800,
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
        "max_tokens": 800,
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

    suggested_actions = [
        "🎯 ស្វែងរកការងារលើគេហទំព័រ" if in_khmer else "🎯 Search Live Jobs",
        "🏢 ស្វែងរកក្រុមហ៊ុនដែលបានផ្ទៀងផ្ទាត់" if in_khmer else "🏢 Browse Verified Companies",
        "📄 គន្លឹះរៀបចំ CV & សម្ភាសន៍" if in_khmer else "📄 CV & Interview Tips",
        "💼 របៀបប្រកាសការងារ (Employer)" if in_khmer else "💼 How to Post a Job",
    ]

    return {
        "reply": reply_text,
        "matched_jobs": matched_jobs,
        "chart": None,
        "suggested_actions": suggested_actions,
        "total_matches": len(matched_jobs),
        "intent": "job_search" if matched_jobs else "general_qa",
        "provider": active_provider,
        "model": active_model,
    }
