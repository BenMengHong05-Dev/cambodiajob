import os
import time
import re
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError

from common.permissions import IsEmployer, IsAuthenticatedCustom
from common.database import fetch_one, fetch_all, execute_insert, execute_sql, atomic_transaction
from common.pagination import paginate_raw_query
from common.validators import slugify_string
from .serializers import CompanySerializer


class CompanyListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        base_select = """
            SELECT 
                c.id, c.name, c.slug, c.logo_url, c.banner_url, c.description,
                c.website, c.industry, c.company_size, c.province, c.city,
                c.verification_status, c.created_at,
                (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id AND j.status = 'published' AND j.moderation_status = 'approved') AS jobs_count
            FROM companies c
        """
        base_count = "SELECT COUNT(*) FROM companies c"

        where_clauses = ["c.verification_status != 'rejected'"]
        params = []

        # Filters
        keyword = request.query_params.get("q")
        if keyword:
            where_clauses.append("(c.name LIKE %s OR c.industry LIKE %s OR c.description LIKE %s)")
            like_val = f"%{keyword}%"
            params.extend([like_val, like_val, like_val])

        industry = request.query_params.get("industry")
        if industry:
            where_clauses.append("c.industry = %s")
            params.append(industry)

        province = request.query_params.get("province")
        if province:
            where_clauses.append("c.province = %s")
            params.append(province)

        allowed_sorts = {
            "name": "c.name ASC",
            "jobs_count": "jobs_count DESC",
            "newest": "c.created_at DESC",
        }

        data = paginate_raw_query(
            base_select_sql=base_select,
            base_count_sql=base_count,
            where_clauses=where_clauses,
            params=params,
            request=request,
            allowed_sort_fields=allowed_sorts,
            default_sort="jobs_count DESC, c.id DESC",
            default_page_size=12,
        )
        return Response({"success": True, "data": data})


class CompanyDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        sql = """
            SELECT 
                c.id, c.name, c.slug, c.logo_url, c.banner_url, c.description,
                c.website, c.industry, c.company_size, c.province, c.city, c.address,
                c.verification_status, c.verified_at, c.created_at,
                (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id AND j.status = 'published' AND j.moderation_status = 'approved') AS jobs_count
            FROM companies c
            WHERE c.slug = %s
        """
        company = fetch_one(sql, [slug])
        if not company:
            raise NotFound("Company not found.")

        # Also fetch active jobs for this company
        jobs_sql = """
            SELECT 
                j.id, j.title, j.title_km, j.slug, j.employment_type, j.workplace_type,
                j.experience_level, j.province, j.city, j.salary_min, j.salary_max,
                j.salary_currency, j.is_salary_negotiable, j.published_at,
                cat.name_en AS category_name_en, cat.name_km AS category_name_km
            FROM jobs j
            LEFT JOIN job_categories cat ON cat.id = j.category_id
            WHERE j.company_id = %s AND j.status = 'published' AND j.moderation_status = 'approved'
            ORDER BY j.published_at DESC
        """
        jobs = fetch_all(jobs_sql, [company["id"]])
        company["jobs"] = jobs

        return Response({"success": True, "data": company})


class EmployerCompanyView(APIView):
    permission_classes = [IsEmployer]

    def get(self, request):
        # Fetch the company managed by the employer
        sql = """
            SELECT 
                c.id, c.name, c.slug, c.logo_url, c.banner_url, c.description,
                c.website, c.industry, c.company_size, c.province, c.city, c.address,
                c.verification_status, c.verified_at, c.created_at,
                em.role AS member_role
            FROM companies c
            INNER JOIN employer_members em ON em.company_id = c.id
            WHERE em.user_id = %s
            LIMIT 1
        """
        company = fetch_one(sql, [request.user.id])
        if not company:
            return Response({"success": True, "data": None})
        return Response({"success": True, "data": company})

    def post(self, request):
        serializer = CompanySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        name = data["name"].strip()
        base_slug = slugify_string(name)
        slug = f"{base_slug}-{request.user.id}"

        with atomic_transaction():
            company_id = execute_insert(
                """
                INSERT INTO companies (name, slug, logo_url, banner_url, description, website, industry, company_size, province, city, address, verification_status, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending', %s)
                """,
                [
                    name, slug, data.get("logo_url"), data.get("banner_url"),
                    data.get("description"), data.get("website"), data.get("industry"),
                    data.get("company_size"), data.get("province"), data.get("city"),
                    data.get("address"), request.user.id
                ]
            )
            execute_insert(
                "INSERT INTO employer_members (company_id, user_id, role) VALUES (%s, %s, 'owner')",
                [company_id, request.user.id]
            )

        company = fetch_one("SELECT * FROM companies WHERE id = %s", [company_id])
        return Response({"success": True, "data": company}, status=status.HTTP_201_CREATED)

    def patch(self, request):
        # Find employer's company
        em_row = fetch_one("SELECT company_id, role FROM employer_members WHERE user_id = %s", [request.user.id])
        if not em_row:
            raise NotFound("You do not currently belong to a company organization.")

        company_id = em_row["company_id"]
        serializer = CompanySerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        fields = []
        params = []
        for key in ["name", "logo_url", "banner_url", "description", "website", "industry", "company_size", "province", "city", "address"]:
            if key in data:
                fields.append(f"{key} = %s")
                params.append(data[key])

        if fields:
            sql = f"UPDATE companies SET {', '.join(fields)} WHERE id = %s"
            params.append(company_id)
            execute_sql(sql, params)

        updated = fetch_one("SELECT * FROM companies WHERE id = %s", [company_id])
        return Response({"success": True, "data": updated})


class EmployerCompanyUploadView(APIView):
    permission_classes = [IsEmployer]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded_file = request.FILES.get("file") or request.FILES.get("image")
        if not uploaded_file:
            raise ValidationError({"file": "No image file provided."})

        allowed_exts = [".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif"]
        file_ext = os.path.splitext(uploaded_file.name)[1].lower()
        if file_ext not in allowed_exts:
            raise ValidationError({"file": f"Unsupported format. Allowed formats: {', '.join(allowed_exts)}"})

        if uploaded_file.size > 5 * 1024 * 1024:
            raise ValidationError({"file": "Image size must not exceed 5MB."})

        upload_dir = settings.MEDIA_ROOT / "companies"
        os.makedirs(upload_dir, exist_ok=True)

        clean_name = re.sub(r"[^a-zA-Z0-9_\.-]", "_", uploaded_file.name)
        saved_filename = f"comp_{request.user.id}_{int(time.time())}_{clean_name}"
        file_dest = upload_dir / saved_filename

        with open(file_dest, "wb+") as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)

        file_url = f"/media/companies/{saved_filename}"
        return Response({
            "success": True,
            "url": file_url,
            "filename": saved_filename,
            "message": "Image uploaded successfully."
        })


