from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError

from common.permissions import IsAuthenticatedCustom, IsEmployer, IsJobSeeker, HasCustomPermission
from common.database import fetch_one, fetch_all, fetch_scalar, execute_insert, execute_sql, atomic_transaction
from common.pagination import paginate_raw_query
from common.validators import slugify_string
from apps.notifications.services import create_notification, notify_admins
from .serializers import JobSerializer, JobStatusUpdateSerializer


class JobStatsView(APIView):
    """
    Public platform statistics: total verified jobs, total active companies, and provinces with active jobs.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        total_jobs = fetch_scalar("""
            SELECT COUNT(id) FROM jobs 
            WHERE status = 'published' AND moderation_status = 'approved'
        """) or 0

        total_companies = fetch_scalar("""
            SELECT COUNT(id) FROM companies 
            WHERE verification_status != 'rejected'
        """) or 0

        provinces_with_jobs = fetch_scalar("""
            SELECT COUNT(DISTINCT province) FROM jobs 
            WHERE status = 'published' AND moderation_status = 'approved' 
              AND province IS NOT NULL AND TRIM(province) != ''
        """) or 0

        return Response({
            "success": True,
            "data": {
                "total_jobs": total_jobs,
                "total_companies": total_companies,
                "provinces_with_jobs": provinces_with_jobs,
            }
        })


class JobListView(APIView):
    """
    Public job search endpoint supporting comprehensive Cambodian market filters.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        base_select = """
            SELECT 
                j.id, j.company_id, j.category_id, j.title, j.title_km, j.slug,
                j.description, j.description_km,
                j.employment_type, j.workplace_type, j.experience_level, j.education_level,
                j.province, j.city, j.salary_min, j.salary_max, j.salary_currency,
                j.is_salary_negotiable, j.vacancies_count, j.published_at, j.created_at,
                c.name AS company_name, c.slug AS company_slug, c.logo_url AS company_logo,
                c.banner_url AS company_banner,
                c.verification_status AS company_verification,
                cat.name_en AS category_name_en, cat.name_km AS category_name_km
            FROM jobs j
            INNER JOIN companies c ON c.id = j.company_id
            LEFT JOIN job_categories cat ON cat.id = j.category_id
        """
        base_count = """
            SELECT COUNT(*)
            FROM jobs j
            INNER JOIN companies c ON c.id = j.company_id
            LEFT JOIN job_categories cat ON cat.id = j.category_id
        """

        where_clauses = [
            "j.status = 'published'",
            "j.moderation_status = 'approved'",
        ]
        params = []

        # 1. Search keyword (matches title, title_km, description, company name)
        keyword = request.query_params.get("q") or request.query_params.get("keyword")
        if keyword:
            like_val = f"%{keyword}%"
            where_clauses.append(
                "(j.title LIKE %s OR j.title_km LIKE %s OR j.description LIKE %s OR c.name LIKE %s)"
            )
            params.extend([like_val, like_val, like_val, like_val])

        # 2. Category filter (by id or slug)
        category = request.query_params.get("category")
        if category:
            if category.isdigit():
                where_clauses.append("j.category_id = %s")
                params.append(int(category))
            else:
                where_clauses.append("cat.slug = %s")
                params.append(category)

        # 3. Province / Location
        province = request.query_params.get("province") or request.query_params.get("location")
        if province and province.lower() != "all":
            where_clauses.append("j.province = %s")
            params.append(province)

        # 4. Employment Type (full_time, part_time, internship, freelance, contract)
        emp_type = request.query_params.get("employment_type")
        if emp_type:
            where_clauses.append("j.employment_type = %s")
            params.append(emp_type)

        # 5. Workplace Type (on_site, remote, hybrid)
        work_type = request.query_params.get("workplace_type")
        if work_type:
            where_clauses.append("j.workplace_type = %s")
            params.append(work_type)

        # 6. Experience Level (fresh_graduate, entry, mid, senior, lead, executive)
        exp_level = request.query_params.get("experience_level")
        if exp_level:
            where_clauses.append("j.experience_level = %s")
            params.append(exp_level)

        # 7. Salary Filters
        salary_min = request.query_params.get("salary_min")
        if salary_min:
            try:
                where_clauses.append("(j.salary_max >= %s OR j.salary_min >= %s)")
                params.extend([float(salary_min), float(salary_min)])
            except ValueError:
                pass

        salary_currency = request.query_params.get("currency")
        if salary_currency:
            where_clauses.append("j.salary_currency = %s")
            params.append(salary_currency)

        # 8. Company slug
        company_slug = request.query_params.get("company")
        if company_slug:
            where_clauses.append("c.slug = %s")
            params.append(company_slug)

        allowed_sorts = {
            "newest": "j.published_at DESC",
            "highest_salary": "j.salary_max DESC",
            "lowest_salary": "j.salary_min ASC",
        }

        paginated = paginate_raw_query(
            base_select_sql=base_select,
            base_count_sql=base_count,
            where_clauses=where_clauses,
            params=params,
            request=request,
            allowed_sort_fields=allowed_sorts,
            default_sort="j.published_at DESC, j.id DESC",
            default_page_size=10,
        )

        # If user is logged in, annotate is_saved and has_applied
        user = getattr(request, "user", None)
        if user and getattr(user, "is_authenticated", False):
            seeker = fetch_one("SELECT id FROM seeker_profiles WHERE user_id = %s", [user.id])
            if seeker:
                seeker_id = seeker["id"]
                saved_ids = {
                    r["job_id"]
                    for r in fetch_all("SELECT job_id FROM saved_jobs WHERE seeker_id = %s", [seeker_id])
                }
                applied_ids = {
                    r["job_id"]
                    for r in fetch_all("SELECT job_id FROM applications WHERE seeker_id = %s", [seeker_id])
                }
                for item in paginated["results"]:
                    item["is_saved"] = item["id"] in saved_ids
                    item["has_applied"] = item["id"] in applied_ids

        return Response({"success": True, "data": paginated})


class JobDetailView(APIView):
    """
    Public job vacancy detail view.
    """
    permission_classes = [AllowAny]

    def get(self, request, slug):
        sql = """
            SELECT 
                j.id, j.company_id, j.category_id, j.title, j.title_km, j.slug,
                j.description, j.description_km, j.requirements,
                j.employment_type, j.workplace_type, j.experience_level, j.education_level,
                j.province, j.city, j.address, j.salary_min, j.salary_max, j.salary_currency,
                j.is_salary_negotiable, j.vacancies_count, j.status, j.moderation_status,
                j.published_at, j.expires_at, j.created_at,
                c.name AS company_name, c.slug AS company_slug, c.logo_url AS company_logo,
                c.banner_url AS company_banner,
                c.website AS company_website, c.description AS company_description,
                c.verification_status AS company_verification,
                cat.name_en AS category_name_en, cat.name_km AS category_name_km
            FROM jobs j
            INNER JOIN companies c ON c.id = j.company_id
            LEFT JOIN job_categories cat ON cat.id = j.category_id
            WHERE j.slug = %s
        """
        job = fetch_one(sql, [slug])
        if not job:
            raise NotFound("Job vacancy not found.")

        # Fetch required skills
        skills_sql = """
            SELECT s.id, s.name, s.category, js.is_required
            FROM job_skills js
            INNER JOIN skills s ON s.id = js.skill_id
            WHERE js.job_id = %s
            ORDER BY js.is_required DESC, s.name ASC
        """
        job["skills"] = fetch_all(skills_sql, [job["id"]])

        # Check user specific application & saved state
        job["is_saved"] = False
        job["has_applied"] = False
        user = getattr(request, "user", None)
        if user and getattr(user, "is_authenticated", False) and user.is_job_seeker:
            seeker = fetch_one("SELECT id FROM seeker_profiles WHERE user_id = %s", [user.id])
            if seeker:
                saved = fetch_one(
                    "SELECT id FROM saved_jobs WHERE seeker_id = %s AND job_id = %s",
                    [seeker["id"], job["id"]],
                )
                job["is_saved"] = bool(saved)

                applied = fetch_one(
                    "SELECT id, status FROM applications WHERE seeker_id = %s AND job_id = %s",
                    [seeker["id"], job["id"]],
                )
                job["has_applied"] = bool(applied)
                if applied:
                    job["application_status"] = applied["status"]

        # Also fetch 3 related jobs
        related_sql = """
            SELECT 
                j.id, j.title, j.title_km, j.slug, j.province, j.salary_min, j.salary_max, j.salary_currency,
                c.name AS company_name, c.logo_url AS company_logo
            FROM jobs j
            INNER JOIN companies c ON c.id = j.company_id
            WHERE j.id != %s AND (j.category_id = %s OR j.province = %s)
                AND j.status = 'published' AND j.moderation_status = 'approved'
            ORDER BY j.published_at DESC
            LIMIT 3
        """
        job["related_jobs"] = fetch_all(related_sql, [job["id"], job["category_id"], job["province"]])

        return Response({"success": True, "data": job})


class JobSaveToggleView(APIView):
    """
    Save or unsave a job for an authenticated user.
    """
    permission_classes = [IsAuthenticatedCustom]

    def post(self, request, pk):
        seeker = fetch_one("SELECT id FROM seeker_profiles WHERE user_id = %s", [request.user.id])
        if not seeker:
            # Auto-create basic seeker_profile so any authenticated user (seeker, employer, or admin) can bookmark vacancies
            seeker_id = execute_insert(
                "INSERT INTO seeker_profiles (user_id, salary_currency, created_at, updated_at) VALUES (%s, 'USD', NOW(), NOW())",
                [request.user.id]
            )
            seeker = {"id": seeker_id}

        job = fetch_one("SELECT id, title FROM jobs WHERE id = %s", [pk])
        if not job:
            raise NotFound("Job vacancy not found.")

        # Check existing
        existing = fetch_one(
            "SELECT id FROM saved_jobs WHERE seeker_id = %s AND job_id = %s",
            [seeker["id"], pk],
        )
        if not existing:
            execute_insert(
                "INSERT INTO saved_jobs (seeker_id, job_id) VALUES (%s, %s)",
                [seeker["id"], pk],
            )
            create_notification(
                user_id=request.user.id,
                title="Job Saved",
                title_km="បានរក្សាទុកការងារ",
                message=f"You saved '{job['title']}' to your bookmarks.",
                message_km=f"អ្នកបានរក្សាទុកការងារ '{job['title']}' ក្នុងបញ្ជីរក្សាទុក។",
                notification_type="job_saved",
                data={"action": "save_job", "job_id": pk},
            )
        return Response({"success": True, "message": "Job saved successfully.", "is_saved": True})

    def delete(self, request, pk):
        seeker = fetch_one("SELECT id FROM seeker_profiles WHERE user_id = %s", [request.user.id])
        if not seeker:
            return Response({"success": True, "message": "Job removed from saved list.", "is_saved": False})

        execute_sql(
            "DELETE FROM saved_jobs WHERE seeker_id = %s AND job_id = %s",
            [seeker["id"], pk],
        )
        return Response({"success": True, "message": "Job removed from saved list.", "is_saved": False})


class EmployerJobManagementView(APIView):
    """
    Employer endpoints: list vacancies and create new vacancy.
    """
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsEmployer(), HasCustomPermission.with_perm("jobs:create")()]
        return [IsEmployer(), HasCustomPermission.with_perm("employer:access")()]

    def get(self, request):
        em = fetch_one("SELECT company_id FROM employer_members WHERE user_id = %s", [request.user.id])
        if not em:
            return Response({"success": True, "data": []})

        company_id = em["company_id"]
        sql = """
            SELECT 
                j.id, j.title, j.title_km, j.slug, j.employment_type, j.workplace_type,
                j.province, j.salary_min, j.salary_max, j.salary_currency, j.is_salary_negotiable,
                j.status, j.moderation_status, j.published_at, j.created_at,
                cat.name_en AS category_name_en,
                (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS applications_count
            FROM jobs j
            LEFT JOIN job_categories cat ON cat.id = j.category_id
            WHERE j.company_id = %s
            ORDER BY j.created_at DESC, j.id DESC
        """
        jobs = fetch_all(sql, [company_id])
        return Response({"success": True, "data": jobs})

    def post(self, request):
        em = fetch_one(
            """
            SELECT em.company_id, em.role AS member_role, c.name AS company_name, c.verification_status 
            FROM employer_members em
            INNER JOIN companies c ON c.id = em.company_id
            WHERE em.user_id = %s
            """,
            [request.user.id],
        )
        if not em:
            raise ValidationError("You must belong to an employer company to post vacancies.")

        if not getattr(request.user, "has_permission", lambda p: False)("jobs:create"):
            raise PermissionDenied("You do not have permission to post new job vacancies.")

        if em.get("verification_status") != "verified":
            raise PermissionDenied(
                "Your company is awaiting Administrator confirmation. Only verified companies approved by the Platform Admin can post job vacancies."
            )

        company_id = em["company_id"]
        serializer = JobSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        import uuid
        title = data["title"].strip()
        base_slug = slugify_string(title)
        unique_slug = f"{base_slug}-{company_id}-{uuid.uuid4().hex[:6]}"

        with atomic_transaction():
            insert_sql = """
                INSERT INTO jobs (
                    company_id, category_id, title, title_km, slug, description, description_km,
                    requirements, employment_type, workplace_type, experience_level,
                    education_level, province, city, address, salary_min, salary_max,
                    salary_currency, is_salary_negotiable, vacancies_count, status,
                    moderation_status, published_at, created_by
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    'approved', NOW(), %s
                )
            """
            job_id = execute_insert(
                insert_sql,
                [
                    company_id, data.get("category_id"), title, data.get("title_km"),
                    unique_slug, data["description"], data.get("description_km"),
                    data.get("requirements"), data["employment_type"], data["workplace_type"],
                    data["experience_level"], data.get("education_level"), data["province"],
                    data.get("city"), data.get("address"), data.get("salary_min"),
                    data.get("salary_max"), data.get("salary_currency", "USD"),
                    data.get("is_salary_negotiable", False), data.get("vacancies_count", 1),
                    data.get("status", "published"), request.user.id
                ],
            )

            # Insert skill links
            skill_ids = data.get("skill_ids", [])
            for sid in skill_ids:
                execute_insert(
                    "INSERT INTO job_skills (job_id, skill_id, is_required) VALUES (%s, %s, TRUE)",
                    [job_id, sid],
                )

        new_job = fetch_one("SELECT * FROM jobs WHERE id = %s", [job_id])
        job_status = data.get("status", "published")
        create_notification(
            user_id=request.user.id,
            title="Job Vacancy Published" if job_status == "published" else "Job Vacancy Created",
            title_km="ការងារត្រូវបានផ្សព្វផ្សាយ" if job_status == "published" else "ការងារត្រូវបានបង្កើត",
            message=f"Your job vacancy '{title}' ({job_status}) is now live for {em['company_name']}.",
            message_km=f"មុខតំណែង '{title}' របស់ក្រុមហ៊ុន {em['company_name']} ត្រូវបានបង្កើតដោយជោគជ័យ។",
            notification_type="job_published",
            data={"action": "create_job", "job_id": job_id, "status": job_status},
        )
        notify_admins(
            title="New Job Vacancy Posted",
            title_km="មានការងារថ្មីត្រូវបានប្រកាស",
            message=f"{em['company_name']} posted a new job: '{title}'.",
            message_km=f"ក្រុមហ៊ុន {em['company_name']} បានប្រកាសការងារថ្មី៖ '{title}'។",
            notification_type="job_published",
            data={"action": "create_job", "job_id": job_id, "company_id": company_id},
            exclude_user_id=request.user.id,
        )
        return Response({"success": True, "data": new_job}, status=status.HTTP_201_CREATED)


class EmployerJobDetailView(APIView):
    """
    Employer endpoints: update vacancy details, update vacancy status, delete vacancy.
    """
    def get_permissions(self):
        if self.request.method in ["PATCH", "PUT"]:
            return [IsEmployer(), HasCustomPermission.with_perm("jobs:edit")()]
        if self.request.method == "DELETE":
            return [IsEmployer(), HasCustomPermission.with_perm("jobs:delete")()]
        return [IsEmployer(), HasCustomPermission.with_perm("employer:access")()]

    def _get_employer_job(self, job_id, user_id):
        sql = """
            SELECT j.* 
            FROM jobs j
            INNER JOIN employer_members em ON em.company_id = j.company_id
            WHERE j.id = %s AND em.user_id = %s
        """
        job = fetch_one(sql, [job_id, user_id])
        if not job:
            raise NotFound("Job vacancy not found or access denied.")
        return job

    def get(self, request, pk):
        job = self._get_employer_job(pk, request.user.id)
        skills = fetch_all(
            "SELECT s.id, s.name, js.is_required FROM job_skills js INNER JOIN skills s ON s.id = js.skill_id WHERE js.job_id = %s",
            [pk],
        )
        job["skills"] = skills
        return Response({"success": True, "data": job})

    def patch(self, request, pk):
        self._get_employer_job(pk, request.user.id)
        serializer = JobSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        allowed_fields = [
            "title", "title_km", "category_id", "description", "description_km",
            "requirements", "employment_type", "workplace_type", "experience_level",
            "education_level", "province", "city", "address", "salary_min",
            "salary_max", "salary_currency", "is_salary_negotiable", "vacancies_count", "status"
        ]
        updates = []
        params = []
        for field in allowed_fields:
            if field in data:
                updates.append(f"{field} = %s")
                params.append(data[field])

        if updates:
            sql = f"UPDATE jobs SET {', '.join(updates)} WHERE id = %s"
            params.append(pk)
            execute_sql(sql, params)

        if "skill_ids" in data:
            execute_sql("DELETE FROM job_skills WHERE job_id = %s", [pk])
            for sid in data["skill_ids"]:
                execute_insert(
                    "INSERT INTO job_skills (job_id, skill_id, is_required) VALUES (%s, %s, TRUE)",
                    [pk, sid],
                )

        updated_job = fetch_one("SELECT * FROM jobs WHERE id = %s", [pk])
        return Response({"success": True, "data": updated_job})

    def delete(self, request, pk):
        self._get_employer_job(pk, request.user.id)
        with atomic_transaction():
            execute_sql("DELETE FROM job_skills WHERE job_id = %s", [pk])
            execute_sql("DELETE FROM saved_jobs WHERE job_id = %s", [pk])
            execute_sql("DELETE FROM interviews WHERE application_id IN (SELECT id FROM applications WHERE job_id = %s)", [pk])
            execute_sql("DELETE FROM applications WHERE job_id = %s", [pk])
            execute_sql("DELETE FROM jobs WHERE id = %s", [pk])
        return Response({"success": True, "message": "Job vacancy deleted successfully."})


class EmployerJobStatusView(APIView):
    permission_classes = [IsEmployer, HasCustomPermission.with_perm("jobs:edit")]

    def patch(self, request, pk):
        sql = """
            SELECT j.id, j.title FROM jobs j
            INNER JOIN employer_members em ON em.company_id = j.company_id
            WHERE j.id = %s AND em.user_id = %s
        """
        job = fetch_one(sql, [pk, request.user.id])
        if not job:
            raise NotFound("Job vacancy not found.")

        serializer = JobStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]

        execute_sql(
            """
            UPDATE jobs 
            SET status = %s,
                published_at = IF(%s = 'published' AND (published_at IS NULL OR status != 'published'), NOW(), published_at),
                moderation_status = IF(%s = 'published' AND moderation_status = 'pending', 'approved', moderation_status)
            WHERE id = %s
            """,
            [new_status, new_status, new_status, pk],
        )
        create_notification(
            user_id=request.user.id,
            title="Job Status Updated",
            title_km="ស្ថានភាពការងារត្រូវបានផ្លាស់ប្តូរ",
            message=f"'{job['title']}' status changed to {new_status}.",
            message_km=f"ស្ថានភាពការងារ '{job['title']}' ត្រូវបានប្តូរទៅ {new_status}។",
            notification_type="job_updated",
            data={"action": "update_job_status", "job_id": pk, "status": new_status},
        )
        notify_admins(
            title="Job Status Changed",
            title_km="ស្ថានភាពការងារត្រូវបានផ្លាស់ប្តូរ",
            message=f"Job '{job['title']}' status changed to {new_status}.",
            message_km=f"ស្ថានភាពការងារ '{job['title']}' ត្រូវបានប្តូរទៅ {new_status}។",
            notification_type="job_updated",
            data={"action": "update_job_status", "job_id": pk, "status": new_status},
            exclude_user_id=request.user.id,
        )
        return Response({"success": True, "message": f"Job status updated to {new_status}."})
