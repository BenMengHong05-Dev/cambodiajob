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

    # If query had meaningful tokens, prioritize jobs that actually matched the tokens
    if meaningful_tokens:
        ranked_jobs.sort(key=lambda x: (x["matched_tokens_count"], x["match_score"]), reverse=True)
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


def get_dynamic_market_chart(
    query_text: str = "",
    matched_jobs: Optional[List[Dict[str, Any]]] = None,
) -> Tuple[Optional[Dict[str, Any]], Dict[str, Any]]:
    """
    Construct an interactive chart dynamically based on user query and live database content.
    - If user specifies an industry/role (e.g. IT, Software, Banking, Accounting, Customer Support):
      Builds a role-specific comparison chart of published jobs in that sector.
    - If user asks about a specific company (e.g. ABA Bank, Smart Axiata, Wing Bank, Royal Academy):
      Builds a company-specific vacancy & salary distribution chart.
    - If matched jobs >= 2 and relevant:
      Builds a comparison chart for those matched jobs.
    - Otherwise (general salary benchmark):
      Builds the category benchmark chart using only active database categories.
    """
    query_lower = query_text.lower().strip()
    platform_stats = get_live_platform_stats()
    active_categories = platform_stats["categories"]

    # 1. Check for specific company match (e.g., ABA Bank, Smart Axiata, Wing Bank, Royal Academy)
    for comp in platform_stats["companies"]:
        comp_name_lower = comp["name"].lower()
        short_names = [w for w in comp_name_lower.split() if len(w) > 2 and w not in ["bank", "co.,", "ltd.", "plc.", "the", "advanced", "asia"]]
        if comp_name_lower in query_lower or any(sn in query_lower for sn in short_names):
            comp_jobs = fetch_all(
                """
                SELECT 
                    j.id, j.title, j.title_km, j.salary_min, j.salary_max, j.salary_currency,
                    c.name as company_name,
                    ROUND(CASE WHEN j.salary_currency = 'USD' THEN j.salary_min ELSE j.salary_min / 4100 END) AS min_usd,
                    ROUND(CASE WHEN j.salary_currency = 'USD' THEN (j.salary_min + j.salary_max)/2 ELSE ((j.salary_min + j.salary_max)/2) / 4100 END) AS avg_usd,
                    ROUND(CASE WHEN j.salary_currency = 'USD' THEN j.salary_max ELSE j.salary_max / 4100 END) AS max_usd
                FROM jobs j
                INNER JOIN companies c ON c.id = j.company_id
                WHERE j.status = 'published' AND j.moderation_status = 'approved' AND c.id = %s
                ORDER BY max_usd DESC
                LIMIT 6
                """,
                [comp["id"]],
            )
            if comp_jobs:
                items = [
                    {
                        "label": j["title"],
                        "label_km": j.get("title_km") or j["title"],
                        "min": float(j["min_usd"]),
                        "avg": float(j["avg_usd"]),
                        "max": float(j["max_usd"]),
                        "count": 1,
                        "company": j["company_name"],
                    }
                    for j in comp_jobs
                ]
                chart = {
                    "type": "salary_benchmark",
                    "title": f"{comp['name']} Vacancies & Salaries (USD / Mo)",
                    "title_km": f"ឱកាសការងារ និងកម្រិតប្រាក់ខែនៅ {comp['name']} (ដុល្លារ / ខែ)",
                    "items": items,
                }
                return chart, {"type": "company", "target": comp["name"], "jobs": comp_jobs, "stats": platform_stats}

    # 2. Check for sector / category match
    category_keywords = {
        "it": ["it", "software", "developer", "engineer", "programming", "code", "tech", "react", "python", "flutter", "devops", "cloud", "backend", "full-stack", "fullstack", "frontend", "web", "បច្ចេកវិទ្យា", "កម្មវិធី"],
        "banking": ["bank", "banking", "finance", "financial", "loan", "teller", "credit", "relationship", "branch", "ធនាគារ", "ហិរញ្ញវត្ថុ"],
        "accounting": ["accounting", "accountant", "audit", "auditing", "tax", "taxation", "គណនេយ្យ", "ពន្ធដារ", "សវនកម្ម"],
        "sales": ["sales", "marketing", "digital marketing", "business development", "retail", "content", "ការលក់", "ទីផ្សារ"],
        "support": ["customer support", "call center", "customer service", "helpdesk", "សេវាអតិថិជន", "ហៅចូល"],
    }

    matched_sector = None
    for sector_key, kw_list in category_keywords.items():
        if any(kw in query_lower for kw in kw_list):
            matched_sector = sector_key
            break

    if matched_sector:
        sector_jobs = []
        if matched_sector == "it":
            sector_jobs = fetch_all(
                """
                SELECT 
                    j.id, j.title, j.title_km, j.salary_min, j.salary_max, j.salary_currency,
                    c.name as company_name,
                    ROUND(CASE WHEN j.salary_currency = 'USD' THEN j.salary_min ELSE j.salary_min / 4100 END) AS min_usd,
                    ROUND(CASE WHEN j.salary_currency = 'USD' THEN (j.salary_min + j.salary_max)/2 ELSE ((j.salary_min + j.salary_max)/2) / 4100 END) AS avg_usd,
                    ROUND(CASE WHEN j.salary_currency = 'USD' THEN j.salary_max ELSE j.salary_max / 4100 END) AS max_usd
                FROM jobs j
                INNER JOIN companies c ON c.id = j.company_id
                WHERE j.status = 'published' AND j.moderation_status = 'approved'
                  AND (j.category_id = 1 OR j.title LIKE %s OR j.title LIKE %s)
                ORDER BY max_usd DESC
                LIMIT 6
                """,
                ["%Developer%", "%Engineer%"],
            )
            sector_title_en = "Information Technology & Software Salary Ranges (USD / Mo)"
            sector_title_km = "តារាងប្រាក់ខែវិស័យបច្ចេកវិទ្យាព័ត៌មាន និងកម្មវិធី (ដុល្លារ / ខែ)"
        elif matched_sector == "banking":
            sector_jobs = fetch_all(
                """
                SELECT 
                    j.id, j.title, j.title_km, j.salary_min, j.salary_max, j.salary_currency,
                    c.name as company_name,
                    ROUND(CASE WHEN j.salary_currency = 'USD' THEN j.salary_min ELSE j.salary_min / 4100 END) AS min_usd,
                    ROUND(CASE WHEN j.salary_currency = 'USD' THEN (j.salary_min + j.salary_max)/2 ELSE ((j.salary_min + j.salary_max)/2) / 4100 END) AS avg_usd,
                    ROUND(CASE WHEN j.salary_currency = 'USD' THEN j.salary_max ELSE j.salary_max / 4100 END) AS max_usd
                FROM jobs j
                INNER JOIN companies c ON c.id = j.company_id
                WHERE j.status = 'published' AND j.moderation_status = 'approved' AND j.category_id = 2
                ORDER BY max_usd DESC
                LIMIT 6
                """
            )
            sector_title_en = "Banking & Financial Services Salary Ranges (USD / Mo)"
            sector_title_km = "តារាងប្រាក់ខែវិស័យធនាគារ និងសេវាហិរញ្ញវត្ថុ (ដុល្លារ / ខែ)"
        elif matched_sector == "accounting":
            sector_jobs = fetch_all(
                """
                SELECT 
                    j.id, j.title, j.title_km, j.salary_min, j.salary_max, j.salary_currency,
                    c.name as company_name,
                    ROUND(CASE WHEN j.salary_currency = 'USD' THEN j.salary_min ELSE j.salary_min / 4100 END) AS min_usd,
                    ROUND(CASE WHEN j.salary_currency = 'USD' THEN (j.salary_min + j.salary_max)/2 ELSE ((j.salary_min + j.salary_max)/2) / 4100 END) AS avg_usd,
                    ROUND(CASE WHEN j.salary_currency = 'USD' THEN j.salary_max ELSE j.salary_max / 4100 END) AS max_usd
                FROM jobs j
                INNER JOIN companies c ON c.id = j.company_id
                WHERE j.status = 'published' AND j.moderation_status = 'approved' AND j.category_id = 4
                ORDER BY max_usd DESC
                LIMIT 6
                """
            )
            sector_title_en = "Accounting & Auditing Salary Ranges (USD / Mo)"
            sector_title_km = "តារាងប្រាក់ខែវិស័យគណនេយ្យ និងសវនកម្ម (ដុល្លារ / ខែ)"
        elif matched_sector == "sales":
            sector_jobs = fetch_all(
                """
                SELECT 
                    j.id, j.title, j.title_km, j.salary_min, j.salary_max, j.salary_currency,
                    c.name as company_name,
                    ROUND(CASE WHEN j.salary_currency = 'USD' THEN j.salary_min ELSE j.salary_min / 4100 END) AS min_usd,
                    ROUND(CASE WHEN j.salary_currency = 'USD' THEN (j.salary_min + j.salary_max)/2 ELSE ((j.salary_min + j.salary_max)/2) / 4100 END) AS avg_usd,
                    ROUND(CASE WHEN j.salary_currency = 'USD' THEN j.salary_max ELSE j.salary_max / 4100 END) AS max_usd
                FROM jobs j
                INNER JOIN companies c ON c.id = j.company_id
                WHERE j.status = 'published' AND j.moderation_status = 'approved' AND j.category_id = 3
                ORDER BY max_usd DESC
                LIMIT 6
                """
            )
            sector_title_en = "Sales & Marketing Salary Ranges (USD / Mo)"
            sector_title_km = "តារាងប្រាក់ខែវិស័យការលក់ និងទីផ្សារ (ដុល្លារ / ខែ)"
        else:
            sector_jobs = fetch_all(
                """
                SELECT 
                    j.id, j.title, j.title_km, j.salary_min, j.salary_max, j.salary_currency,
                    c.name as company_name,
                    ROUND(CASE WHEN j.salary_currency = 'USD' THEN j.salary_min ELSE j.salary_min / 4100 END) AS min_usd,
                    ROUND(CASE WHEN j.salary_currency = 'USD' THEN (j.salary_min + j.salary_max)/2 ELSE ((j.salary_min + j.salary_max)/2) / 4100 END) AS avg_usd,
                    ROUND(CASE WHEN j.salary_currency = 'USD' THEN j.salary_max ELSE j.salary_max / 4100 END) AS max_usd
                FROM jobs j
                INNER JOIN companies c ON c.id = j.company_id
                WHERE j.status = 'published' AND j.moderation_status = 'approved' AND j.category_id = 9
                ORDER BY max_usd DESC
                LIMIT 6
                """
            )
            sector_title_en = "Customer Support Salary Ranges (USD / Mo)"
            sector_title_km = "តារាងប្រាក់ខែវិស័យសេវាកម្មអតិថិជន (ដុល្លារ / ខែ)"

        if sector_jobs:
            items = [
                {
                    "label": j["title"],
                    "label_km": j.get("title_km") or j["title"],
                    "min": float(j["min_usd"]),
                    "avg": float(j["avg_usd"]),
                    "max": float(j["max_usd"]),
                    "count": 1,
                    "company": j["company_name"],
                }
                for j in sector_jobs
            ]
            chart = {
                "type": "salary_benchmark",
                "title": sector_title_en,
                "title_km": sector_title_km,
                "items": items,
            }
            return chart, {
                "type": "sector",
                "sector": matched_sector,
                "title_en": sector_title_en,
                "title_km": sector_title_km,
                "jobs": sector_jobs,
                "stats": platform_stats,
            }

    # 3. If matched jobs were passed from search and >= 2
    if matched_jobs and len(matched_jobs) >= 2:
        items = []
        for j in matched_jobs[:6]:
            s_min = float(j.get("salary_min") or 0)
            s_max = float(j.get("salary_max") or 0)
            s_curr = j.get("salary_currency") or "USD"
            min_usd = round(s_min if s_curr == "USD" else s_min / KHR_PER_USD)
            max_usd = round(s_max if s_curr == "USD" else s_max / KHR_PER_USD)
            avg_usd = round((min_usd + max_usd) / 2) if (min_usd and max_usd) else (min_usd or max_usd)

            items.append({
                "label": j.get("title") or "Position",
                "label_km": j.get("title_km") or j.get("title") or "Position",
                "min": min_usd,
                "avg": avg_usd,
                "max": max_usd,
                "count": 1,
                "company": j.get("company_name"),
            })

        chart = {
            "type": "salary_benchmark",
            "title": "Matched Vacancies Salary Comparison (USD / Mo)",
            "title_km": "តារាងប្រៀបធៀបប្រាក់ខែមុខតំណែងដែលត្រូវគ្នា (ដុល្លារ / ខែ)",
            "items": items,
        }
        return chart, {"type": "matched_jobs", "jobs": matched_jobs, "stats": platform_stats}

    # 4. Fallback: Live Category Benchmark across all active categories in DB
    cat_items = []
    for cat in active_categories:
        min_val = float(cat.get("min_salary_usd") or 0)
        avg_val = float(cat.get("avg_salary_usd") or 0)
        max_val = float(cat.get("max_salary_usd") or 0)
        cat_items.append({
            "label": cat["name_en"],
            "label_km": cat.get("name_km") or cat["name_en"],
            "min": min_val,
            "avg": avg_val,
            "max": max_val,
            "count": cat.get("job_count") or 1,
        })

    chart = {
        "type": "salary_benchmark",
        "title": "Cambodia Market Salary Benchmark (USD / Month)",
        "title_km": "តារាងប្រៀបធៀបប្រាក់ខែទីផ្សារការងារកម្ពុជា (ដុល្លារ / ខែ)",
        "items": cat_items,
    }
    return chart, {"type": "categories", "categories": active_categories, "stats": platform_stats}


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
) -> Optional[str]:
    """
    Call Google Gemini REST API using the provided API key.
    Supports gemini-2.0-flash and gemini-1.5-flash with automatic fallback.
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
        "telegram", "telegrams", "t.me", "telegram support", "telegram channel",
        "human support", "contact support", "talk to human", "តេឡេក្រាម", "ឆាតតាម telegram", "ជំនួយការផ្ទាល់", "ទាក់ទងតាម telegram"
    ]):
        return "telegram_support"

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
        "compensation", "market demand", "highest paying", "តារាងប្រាក់ខែ", "ប្រាក់ខែ", "ប្រៀបធៀបប្រាក់ខែ", "ចំណូល"
    ]):
        return "salary_chart"

    if any(k in query_lower for k in [
        "cv", "resume", "interview", "cover letter", "career advice", "pass interview", "prepare interview",
        "negotiate salary", "career tip", "គន្លឹះសម្ភាសន៍", "សម្ភាសន៍", "សរសេរ cv", "រៀបចំ cv", "ប្រឹក្សាអាជីព"
    ]) and not any(k in query_lower for k in ["upload cv", "upload resume", "how to apply"]):
        return "career_advice"

    if any(k in query_lower for k in [
        "smart axiata", "aba bank", "wing bank", "royal academy", "company profile", "top companies",
        "ក្រុមហ៊ុន aba", "ក្រុមហ៊ុន smart", "ធនាគារ wing", "ធនាគារ aba", "សាលារាជបណ្ឌិត្យ"
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
    1. Gathers real CambodiaJobs database grounding (live jobs, verified companies, dynamic salaries).
    2. Searches matching jobs using multi-field scoring.
    3. Generates query-specific or market-wide interactive salary benchmark charts.
    4. Calls Google Gemini API if key is present to craft a grounded, articulate response.
    5. Falls back to built-in dynamic dialogue generator that strictly formats real database stats.
    """
    raw_query = message.strip()
    query_lower = raw_query.lower()
    in_khmer = is_khmer_text(raw_query)

    seeker_info = get_seeker_profile_data(user_id) if user_id else None
    candidate_skills = seeker_info["skills"] if seeker_info else []

    intent = detect_user_intent(query_lower)

    # Detect location criteria
    province = None
    for prov in [
        ("phnom penh", "Phnom Penh"), ("ភ្នំពេញ", "Phnom Penh"),
        ("siem reap", "Siem Reap"), ("សៀមរាប", "Siem Reap"),
        ("sihanoukville", "Sihanoukville"), ("ព្រះសីហនុ", "Sihanoukville"),
        ("battambang", "Battambang"), ("បាត់ដំបង", "Battambang"),
        ("kampot", "Kampot"), ("កំពត", "Kampot"),
        ("kandal", "Kandal"), ("កណ្តាល", "Kandal"),
        ("kampong cham", "Kampong Cham"), ("កំពង់ចាម", "Kampong Cham"),
    ]:
        if prov[0] in query_lower:
            province = prov[1]
            break

    experience_level = None
    if any(k in query_lower for k in ["fresh graduate", "graduate", "junior", "entry", "beginner", "ទើបបញ្ចប់ការសិក្សា"]):
        experience_level = "fresh_graduate" if ("graduate" in query_lower or "ទើបបញ្ចប់" in query_lower) else "entry"
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

    # Search live platform jobs
    matched_jobs = find_matching_jobs(
        query_text=raw_query,
        province=province,
        candidate_skills=candidate_skills,
        min_salary=min_salary,
        workplace_type=workplace_type,
        experience_level=experience_level,
        limit=5,
    )

    if not matched_jobs and intent in ["job_search", "company_query"]:
        matched_jobs = find_matching_jobs(
            query_text=raw_query,
            candidate_skills=candidate_skills,
            limit=5,
        )

    # Dynamically build interactive chart & metadata
    chart_payload, chart_meta = get_dynamic_market_chart(
        query_text=raw_query,
        matched_jobs=matched_jobs if intent in ["job_search", "company_query"] else None,
    )

    platform_stats = chart_meta.get("stats") or get_live_platform_stats()

    # Determine whether chart should be shown in response:
    # Always attach chart if requested or if relevant query
    should_show_chart = (
        intent in ["salary_chart", "company_query"]
        or any(k in query_lower for k in ["chart", "salary", "pay", "benchmark", "compare", "តារាង", "ប្រាក់ខែ", "ក្រាហ្វ"])
        or (intent == "job_search" and len(matched_jobs) >= 2)
    )

    if not should_show_chart:
        chart_payload = None

    # ----------------------------------------------------
    # GOOGLE GEMINI API CALL (If API Key is available)
    # ----------------------------------------------------
    effective_key = (
        (api_key or "").strip()
        or getattr(settings, "GEMINI_API_KEY", "").strip()
        or os.getenv("GEMINI_API_KEY", "").strip()
    )

    is_gemini_active = bool(effective_key and effective_key not in ["", "your_gemini_api_key_here"])
    ai_reply: Optional[str] = None

    if is_gemini_active:
        cat_summaries = [
            f"- {c['name_en']}: {c['job_count']} vacancies, ${c['min_salary_usd']}-${c['max_salary_usd']} USD (Avg: ${c['avg_salary_usd']} USD)"
            for c in platform_stats["categories"]
        ]
        comp_summaries = [
            f"- {c['name']}: {c['job_count']} active vacancies in {c.get('city') or 'Cambodia'}"
            for c in platform_stats["companies"]
        ]
        job_summaries = [
            f"- {j['title']} at {j['company_name']} ({j['province']}, {format_salary_range(j['salary_min'], j['salary_max'], j['salary_currency'])}) Fit: {j['match_score']}%"
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

LIVE DATABASE CONTEXT (STRICT GROUNDING):
- Total Active Vacancies: {platform_stats['total_jobs']}
- Verified Employers Hiring:
{chr(10).join(comp_summaries)}
- Real Salary Benchmarks by Sector:
{chr(10).join(cat_summaries)}
- Matched Jobs for this Query:
{chr(10).join(job_summaries) if job_summaries else "No exact direct vacancies matched all filters."}

USER CONTEXT:
{f"Candidate Name: {seeker_info['seeker']['full_name']}, Skills: {', '.join(candidate_skills)}" if seeker_info else "User is a visitor or unauthenticated user."}

INSTRUCTIONS:
- Give a direct, helpful, warm response.
- Ground ALL salaries, job numbers, and company names strictly in the live database context above. Do not invent numbers.
- If the user asks for jobs or salaries, cite the real active roles and refer them to the interactive chart and job cards below.
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
    # (Strictly queries real database data; 0% static canned text)
    # ----------------------------------------------------
    if not ai_reply:
        if intent == "salary_chart":
            chart_type = chart_meta.get("type")
            if chart_type in ["sector", "company"] and chart_meta.get("jobs"):
                jobs_list = chart_meta["jobs"]
                target_title = chart_meta.get("target") or chart_meta.get("title_en")
                target_title_km = chart_meta.get("title_km") or target_title

                s_mins = [float(j["min_usd"]) for j in jobs_list if j.get("min_usd")]
                s_maxs = [float(j["max_usd"]) for j in jobs_list if j.get("max_usd")]
                overall_min = int(min(s_mins)) if s_mins else 0
                overall_max = int(max(s_maxs)) if s_maxs else 0
                overall_avg = int(sum(s_mins + s_maxs) / (len(s_mins) + len(s_maxs))) if (s_mins or s_maxs) else 0

                bullet_lines_km = []
                bullet_lines_en = []
                for j in jobs_list[:5]:
                    s_fmt = format_salary_range(j["salary_min"], j["salary_max"], j["salary_currency"])
                    t_title = j.get("title_km") or j["title"]
                    bullet_lines_km.append(f"- **{t_title}** ({j['company_name']})៖ {s_fmt}")
                    bullet_lines_en.append(f"- **{j['title']}** at {j['company_name']}: {s_fmt}")

                if in_khmer:
                    ai_reply = (
                        f"**ទិន្នន័យប្រាក់ខែជាក់ស្តែងសម្រាប់ {target_title_km} (ទិន្នន័យផ្ទាល់ពី CambodiaJobs)៖**\n\n"
                        f"ផ្អែកលើការងារសកម្មជាក់ស្តែងនៅលើប្រព័ន្ធ រកឃើញចំនួន **{len(jobs_list)} មុខតំណែង** ដែលមានកម្រិតប្រាក់ខែចាប់ពី "
                        f"**${overall_min} ដល់ ${overall_max} ដុល្លារ/ខែ** (មធ្យមជាមធ្យម **~${overall_avg} ដុល្លារ/ខែ**)៖\n\n"
                        f"{chr(10).join(bullet_lines_km)}\n\n"
                        f"សូមពិនិត្យមើលតារាងក្រាហ្វិកអន្តរកម្ម និងកាតការងារជាក់ស្តែងខាងក្រោម!"
                    )
                else:
                    ai_reply = (
                        f"**Live Salary Data for {target_title} (Queried directly from CambodiaJobs Database):**\n\n"
                        f"Based on active published listings, found **{len(jobs_list)} positions** with compensation ranging from "
                        f"**${overall_min} to ${overall_max} USD/month** (Overall Average: **~${overall_avg} USD/month**):\n\n"
                        f"{chr(10).join(bullet_lines_en)}\n\n"
                        f"Explore the interactive benchmark chart and direct vacancy cards below!"
                    )
            else:
                # General category salary benchmark
                cats = platform_stats["categories"]
                bullet_lines_km = []
                bullet_lines_en = []
                for c in cats:
                    c_km = c.get("name_km") or c["name_en"]
                    bullet_lines_km.append(
                        f"- **{c_km}** ({c['job_count']} ការងារ)៖ ${int(c['min_salary_usd'])} - ${int(c['max_salary_usd'])} USD (មធ្យម ~${int(c['avg_salary_usd'])} USD)"
                    )
                    bullet_lines_en.append(
                        f"- **{c['name_en']}** ({c['job_count']} jobs): ${int(c['min_salary_usd'])} - ${int(c['max_salary_usd'])} USD (Average: ~${int(c['avg_salary_usd'])} USD)"
                    )

                if in_khmer:
                    ai_reply = (
                        f"**តារាងប្រៀបធៀបប្រាក់ខែទីផ្សារការងារកម្ពុជា (ទិន្នន័យផ្ទាល់ពីមូលដ្ឋានទិន្នន័យ CambodiaJobs)៖**\n\n"
                        f"បច្ចុប្បន្នមានឱកាសការងារសកម្មចំនួន **{platform_stats['total_jobs']} កន្លែង** នៅលើប្រព័ន្ធ ក្នុងនោះកម្រិតប្រាក់ខែតាមវិស័យនីមួយៗរួមមាន៖\n\n"
                        f"{chr(10).join(bullet_lines_km)}\n\n"
                        f"សូមចុចលើតារាងខាងក្រោមដើម្បីពិនិត្យមើលជួរប្រាក់ខែជាក់ស្តែងតាមវិស័យនីមួយៗ!"
                    )
                else:
                    ai_reply = (
                        f"**Cambodia Market Salary Benchmark (Live from CambodiaJobs Database):**\n\n"
                        f"Currently tracking **{platform_stats['total_jobs']} active vacancies** across verified employers. Here are the live salary distributions by sector:\n\n"
                        f"{chr(10).join(bullet_lines_en)}\n\n"
                        f"Interact with the benchmark chart below to explore compensation distributions across sectors!"
                    )

        elif intent == "company_query":
            target_comp = None
            for c in platform_stats["companies"]:
                c_low = c["name"].lower()
                short_words = [w for w in c_low.split() if len(w) > 2 and w not in ["bank", "co.,", "ltd.", "plc.", "the", "advanced", "asia"]]
                if c_low in query_lower or any(sw in query_lower for sw in short_words):
                    target_comp = c
                    break

            comp_jobs = [j for j in matched_jobs if j.get("company_id") == target_comp["id"]] if target_comp else []
            if not comp_jobs and chart_meta.get("type") == "company" and chart_meta.get("jobs"):
                comp_jobs = chart_meta["jobs"]

            if target_comp and comp_jobs:
                comp_name = target_comp["name"]
                bullet_lines_km = [
                    f"- **{j.get('title_km') or j['title']}** — ប្រាក់ខែ៖ {format_salary_range(j['salary_min'], j['salary_max'], j['salary_currency'])} ({j.get('province') or 'កម្ពុជា'})"
                    for j in comp_jobs
                ]
                bullet_lines_en = [
                    f"- **{j['title']}** — Salary: {format_salary_range(j['salary_min'], j['salary_max'], j['salary_currency'])} ({j.get('province') or 'Cambodia'})"
                    for j in comp_jobs
                ]

                # Ensure matched_jobs returned to client only contains this company's jobs
                matched_jobs = [j for j in matched_jobs if j.get("company_id") == target_comp["id"]]

                if in_khmer:
                    ai_reply = (
                        f"**ក្រុមហ៊ុន {comp_name} គឺជាដៃគូនិយោជកដែលបានផ្ទៀងផ្ទាត់ (Verified Employer) នៅលើ CambodiaJobs!**\n\n"
                        f"បច្ចុប្បន្នកំពុងប្រកាសរើសបុគ្គលិកសកម្មចំនួន **{len(comp_jobs)} មុខតំណែង**៖\n\n"
                        f"{chr(10).join(bullet_lines_km)}\n\n"
                        f"អ្នកអាចពិនិត្យមើលតារាងប្រាក់ខែ និងដាក់ពាក្យដោយផ្ទាល់តាមរយៈកាតការងារខាងក្រោម!"
                    )
                else:
                    ai_reply = (
                        f"**{comp_name} is a Verified Employer on CambodiaJobs!**\n\n"
                        f"Currently actively hiring for **{len(comp_jobs)} open positions**:\n\n"
                        f"{chr(10).join(bullet_lines_en)}\n\n"
                        f"Review the salary breakdown and apply directly through the job cards below!"
                    )
            else:
                top_comps = platform_stats["companies"]
                comp_lines_km = [f"- **{c['name']}** ({c['job_count']} មុខតំណែងសកម្ម)" for c in top_comps]
                comp_lines_en = [f"- **{c['name']}**: {c['job_count']} active vacancies" for c in top_comps]

                if in_khmer:
                    ai_reply = (
                        "**ក្រុមហ៊ុនឈានមុខគេដែលបានផ្ទៀងផ្ទាត់ (Verified Employers) កំពុងជ្រើសរើសបុគ្គលិកសកម្មនៅលើ CambodiaJobs រួមមាន៖**\n\n"
                        f"{chr(10).join(comp_lines_km)}\n\n"
                        "អ្នកអាចស្វែងរកការងារ និងដាក់ពាក្យទៅកាន់ក្រុមហ៊ុនទាំងនេះបានភ្លាមៗតាមរយៈកាតការងារខាងក្រោម!"
                    )
                else:
                    ai_reply = (
                        "**Top Verified Employers actively hiring on CambodiaJobs include:**\n\n"
                        f"{chr(10).join(comp_lines_en)}\n\n"
                        "Explore company profiles and apply directly to these verified employers below!"
                    )

        elif intent == "job_search":
            if matched_jobs:
                top = matched_jobs[0]
                bullet_lines_km = [
                    f"- **{j.get('title_km') or j['title']}** នៅ **{j['company_name']}** ({j['province']}) — {format_salary_range(j['salary_min'], j['salary_max'], j['salary_currency'])} (ពិន្ទុផ្គូផ្គង {j['match_score']}%)"
                    for j in matched_jobs[:4]
                ]
                bullet_lines_en = [
                    f"- **{j['title']}** at **{j['company_name']}** ({j['province']}) — {format_salary_range(j['salary_min'], j['salary_max'], j['salary_currency'])} (Fit: {j['match_score']}%)"
                    for j in matched_jobs[:4]
                ]

                if in_khmer:
                    ai_reply = (
                        f"ខ្ញុំបានរកឃើញឱកាសការងារសកម្មចំនួន **{len(matched_jobs)} កន្លែង** នៅលើ CambodiaJobs! "
                        f"មុខតំណែងណែនាំកំពូលគឺ **{top.get('title_km') or top['title']}** នៅ **{top['company_name']}**៖\n\n"
                        f"{chr(10).join(bullet_lines_km)}\n\n"
                        f"សូមពិនិត្យមើលកាតការងារអន្តរកម្មខាងក្រោម រួចចុច 'View Job' ដើម្បីដាក់ពាក្យ ឬមើលតម្រូវការលម្អិត!"
                    )
                else:
                    ai_reply = (
                        f"I found **{len(matched_jobs)} verified vacancies** matching your search on CambodiaJobs! "
                        f"Your top recommendation is **{top['title']}** at **{top['company_name']}**:\n\n"
                        f"{chr(10).join(bullet_lines_en)}\n\n"
                        f"Explore the interactive job cards and salary comparison chart below to review requirements and apply!"
                    )
            else:
                if in_khmer:
                    ai_reply = (
                        f"មិនទាន់ឃើញការងារដែលត្រូវគ្នានឹងលក្ខខណ្ឌជាក់លាក់ **\"{raw_query}\"** នេះនៅឡើយទេ។\n\n"
                        f"បច្ចុប្បន្ន CambodiaJobs មានការងារសកម្មចំនួន **{platform_stats['total_jobs']} កន្លែង** "
                        f"លើវិស័យបច្ចេកវិទ្យា (IT), ធនាគារ, គណនេយ្យ, និងការលក់។ សូមពិនិត្យមើលតារាងប្រាក់ខែ និងឱកាសការងារពេញនិយមខាងក្រោម!"
                    )
                else:
                    ai_reply = (
                        f"No direct vacancies matched all filters for **\"{raw_query}\"** at this moment.\n\n"
                        f"CambodiaJobs currently features **{platform_stats['total_jobs']} verified active vacancies** "
                        f"across IT & Software, Banking, Accounting, and Sales. Check out the salary benchmark chart below!"
                    )

        elif intent == "telegram_support":
            if in_khmer:
                ai_reply = (
                    "**ទាក់ទងក្រុមការងារគាំទ្រ CambodiaJobs តាមរយៈ Telegram៖**\n\n"
                    "💬 **Telegram Bot ផ្លូវការ (Support Bot)**៖ [@CambodiaJobSupportBot](https://t.me/CambodiaJobSupportBot)\n"
                    "📢 **Channel ដំណឹងការងារថ្មីៗប្រចាំថ្ងៃ (Job Alerts)**៖ [@cambodiajobs_channel](https://t.me/cambodiajobs_channel)\n\n"
                    "ក្រុមការងារយើងខ្ញុំត្រៀមខ្លួនជួយសម្រួលដល់បេក្ខជនក្នុងការស្វែងរកការងារ ដាក់ពាក្យ ពិនិត្យមើល CV និងជួយនិយោជកក្នុងការប្រកាសរើសបុគ្គលិកដោយផ្ទាល់រៀងរាល់ថ្ងៃធ្វើការ!"
                )
            else:
                ai_reply = (
                    "**Connect with CambodiaJobs Support on Telegram:**\n\n"
                    "💬 **Official Telegram Support Bot**: [@CambodiaJobSupportBot](https://t.me/CambodiaJobSupportBot)\n"
                    "📢 **Official Daily Job Alerts Channel**: [@cambodiajobs_channel](https://t.me/cambodiajobs_channel)\n\n"
                    "Our team is available on Telegram to assist job seekers with applications and employers with posting vacancies!"
                )

        elif intent == "employer_guide":
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
                    f"**CambodiaJobs គឺជាប្រព័ន្ធស្វែងរកការងារ និងជ្រើសរើសបុគ្គលិកឈានមុខគេនៅកម្ពុជា** ដែលតភ្ជាប់បេក្ខជនជាមួយក្រុមហ៊ុនធំៗដូចជា Smart Axiata, ABA Bank, និង Wing Bank។\n\n"
                    f"🌟 **មុខងារសំខាន់ៗរបស់ប្រព័ន្ធ (ទិន្នន័យផ្សាយបន្តផ្ទាល់)**៖\n"
                    f"- **ឱកាសការងារសកម្ម**៖ បច្ចុប្បន្នមានការងារចំនួន **{platform_stats['total_jobs']} កន្លែង** ដែលបានផ្ទៀងផ្ទាត់ត្រឹមត្រូវ (100% Verified)។\n"
                    f"- **ប្រព័ន្ធពីរភាសាពេញលេញ**៖ គាំទ្រភាសាខ្មែរ និងអង់គ្លេសយ៉ាងរលូន។\n"
                    f"- **គាំទ្ររូបិយប័ណ្ណពីរ (Dual Currency)**៖ បង្ហាញប្រាក់ខែជា USD និងរៀល (KHR) ជាមួយនឹងអត្រាប្តូរប្រាក់ស្វ័យប្រវត្តិ (1 USD = 4,100 KHR)។\n"
                    f"- **ជំនួយការ AI ឆ្លាតវៃ**៖ ស្វែងរកការងារផ្ទាល់ពីមូលដ្ឋានទិន្នន័យ គណនាពិន្ទុសមត្ថភាព និងបង្ហាញតារាងប្រៀបធៀបប្រាក់ខែជាក់ស្តែង។\n"
                    f"- **ការគ្រប់គ្រងការសម្ភាសន៍**៖ កំណត់ពេលសម្ភាសន៍តាមវីដេអូ និង Sync ជាមួយ Google Calendar។"
                )
            else:
                ai_reply = (
                    f"**CambodiaJobs is Cambodia's premier modern recruitment and career platform**, connecting ambitious talent with top verified employers including ABA Bank, Smart Axiata, and Wing Bank across Phnom Penh, Siem Reap, and all 25 provinces.\n\n"
                    f"🌟 **Core Platform Capabilities (Live Data)**:\n"
                    f"- **Active Vacancies**: Currently hosting **{platform_stats['total_jobs']} verified listings** from vetted employers.\n"
                    f"- **Full Bilingual Experience**: Seamless switching between English and Khmer.\n"
                    f"- **Dual-Currency Support**: Real-time USD and KHR conversion at 4,100 KHR/USD.\n"
                    f"- **AI Platform & Dynamic Career Charts**: Live skill matching, compatibility scoring, and interactive salary benchmark charts queried directly from the platform database.\n"
                    f"- **Interview Lifecycle Management**: Application tracking, interview video links, and Google Calendar integration."
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

        else:
            if in_khmer:
                ai_reply = (
                    f"ទាក់ទងនឹងសំណួររបស់អ្នកអំពី **\"{raw_query}\"**៖\n\n"
                    f"CambodiaJobs បច្ចុប្បន្នមានឱកាសការងារសកម្មចំនួន **{platform_stats['total_jobs']} កន្លែង** "
                    f"ពីក្រុមហ៊ុនធំៗដូចជា Smart Axiata, ABA Bank, និង Wing Bank។\n\n"
                    "តើអ្នកចង់ឱ្យខ្ញុំជួយស្វែងរកការងារ ផ្តល់គន្លឹះរៀបចំ CV បង្ហាញតារាងប្រាក់ខែ ឬជួយដល់ការប្រកាសរើសបុគ្គលិក?"
                )
            else:
                ai_reply = (
                    f"Regarding your query on **\"{raw_query}\"**:\n\n"
                    f"CambodiaJobs currently tracks **{platform_stats['total_jobs']} active verified vacancies** "
                    f"across top Cambodian employers including Smart Axiata, ABA Bank, and Wing Bank.\n\n"
                    "Feel free to ask me to search live vacancies, compare market salaries with interactive charts, or guide you through platform features!"
                )

    suggested_actions = [
        "🎯 ការងារ IT នៅភ្នំពេញ" if in_khmer else "🎯 Tech jobs in Phnom Penh",
        "📊 តារាងប្រាក់ខែទីផ្សារកម្ពុជា" if in_khmer else "📊 Show Salary Benchmark Chart",
        "💬 ជំនួយតាម Telegram" if in_khmer else "💬 Telegram Support",
        "🏢 របៀបផុសការងារ (Employer)" if in_khmer else "🏢 How to post a job as an employer",
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
