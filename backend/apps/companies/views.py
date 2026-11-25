import os
import time
import re
from django.conf import settings
from django.contrib.auth.hashers import make_password
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError

from common.permissions import IsEmployer, IsAuthenticatedCustom, HasCustomPermission
from common.database import fetch_one, fetch_all, fetch_scalar, execute_insert, execute_sql, atomic_transaction
from common.pagination import paginate_raw_query
from apps.notifications.services import create_notification, notify_admins
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
    def get_permissions(self):
        if self.request.method in ["POST", "PATCH", "PUT"]:
            return [IsEmployer(), HasCustomPermission.with_perm("company:manage")()]
        return [IsEmployer(), HasCustomPermission.with_perm("employer:access")()]

    def get(self, request):
        # Fetch the company managed by the employer
        sql = """
            SELECT 
                c.id, c.name, c.slug, c.logo_url, c.banner_url, c.description,
                c.website, c.industry, c.company_size, c.province, c.city, c.address,
                c.national_id_card, c.business_license_no,
                c.verification_status, c.verified_at, c.created_at,
                em.role AS member_role
            FROM companies c
            INNER JOIN employer_members em ON em.company_id = c.id
            WHERE em.user_id = %s
            LIMIT 1
        """
        company = fetch_one(sql, [request.user.id])
        if not company:
            # Check if user created a company directly
            comp_created = fetch_one("SELECT id FROM companies WHERE created_by = %s LIMIT 1", [request.user.id])
            if comp_created:
                execute_insert(
                    "INSERT INTO employer_members (company_id, user_id, role) VALUES (%s, %s, 'owner')",
                    [comp_created["id"], request.user.id],
                )
                company = fetch_one(sql, [request.user.id])
            elif getattr(request.user, "has_role", lambda r: False)("admin"):
                first_comp = fetch_one("SELECT id FROM companies ORDER BY id ASC LIMIT 1")
                if first_comp:
                    execute_insert(
                        "INSERT INTO employer_members (company_id, user_id, role) VALUES (%s, %s, 'owner')",
                        [first_comp["id"], request.user.id],
                    )
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
                INSERT INTO companies (name, slug, logo_url, banner_url, description, website, industry, company_size, province, city, address, national_id_card, business_license_no, verification_status, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending', %s)
                """,
                [
                    name, slug, data.get("logo_url"), data.get("banner_url"),
                    data.get("description"), data.get("website"), data.get("industry"),
                    data.get("company_size"), data.get("province"), data.get("city"),
                    data.get("address"), data.get("national_id_card"), data.get("business_license_no"),
                    request.user.id
                ]
            )
            execute_insert(
                "INSERT INTO employer_members (company_id, user_id, role) VALUES (%s, %s, 'owner')",
                [company_id, request.user.id]
            )

        company = fetch_one("SELECT * FROM companies WHERE id = %s", [company_id])
        create_notification(
            user_id=request.user.id,
            title="Company Profile Created",
            title_km="ប្រវត្តិរូបក្រុមហ៊ុនត្រូវបានបង្កើត",
            message=f"{name} was created and is awaiting verification.",
            message_km=f"ក្រុមហ៊ុន {name} ត្រូវបានបង្កើត និងកំពុងរង់ចាំការផ្ទៀងផ្ទាត់។",
            notification_type="company_update",
            data={"action": "create_company", "company_id": company_id},
        )
        notify_admins(
            title="New Company Pending Verification",
            title_km="មានក្រុមហ៊ុនថ្មីរង់ចាំការផ្ទៀងផ្ទាត់",
            message=f"{name} was registered by {request.user.full_name or request.user.email}.",
            message_km=f"ក្រុមហ៊ុន {name} ត្រូវបានចុះឈ្មោះដោយ {request.user.full_name or request.user.email}។",
            notification_type="company_update",
            data={"action": "create_company", "company_id": company_id},
            exclude_user_id=request.user.id,
        )
        return Response({"success": True, "data": company}, status=status.HTTP_201_CREATED)

    def patch(self, request):
        # Find employer's company
        em_row = fetch_one("SELECT company_id, role FROM employer_members WHERE user_id = %s", [request.user.id])
        if not em_row:
            # Fallback auto-link
            comp_created = fetch_one("SELECT id FROM companies WHERE created_by = %s LIMIT 1", [request.user.id])
            if comp_created:
                execute_insert(
                    "INSERT INTO employer_members (company_id, user_id, role) VALUES (%s, %s, 'owner')",
                    [comp_created["id"], request.user.id],
                )
                em_row = fetch_one("SELECT company_id, role FROM employer_members WHERE user_id = %s LIMIT 1", [request.user.id])
            elif getattr(request.user, "has_role", lambda r: False)("admin"):
                first_comp = fetch_one("SELECT id FROM companies ORDER BY id ASC LIMIT 1")
                if first_comp:
                    execute_insert(
                        "INSERT INTO employer_members (company_id, user_id, role) VALUES (%s, %s, 'owner')",
                        [first_comp["id"], request.user.id],
                    )
                    em_row = fetch_one("SELECT company_id, role FROM employer_members WHERE user_id = %s LIMIT 1", [request.user.id])

        if not em_row:
            raise NotFound("You do not currently belong to a company organization.")

        if not request.user.has_permission("company:manage"):
            raise PermissionDenied("Only the company owner or authorized manager can modify company profile details.")

        company_id = em_row["company_id"]
        serializer = CompanySerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        fields = []
        params = []
        for key in ["name", "logo_url", "banner_url", "description", "website", "industry", "company_size", "province", "city", "address", "national_id_card", "business_license_no"]:
            if key in data:
                fields.append(f"{key} = %s")
                params.append(data[key])

        if fields:
            sql = f"UPDATE companies SET {', '.join(fields)} WHERE id = %s"
            params.append(company_id)
            execute_sql(sql, params)

        updated = fetch_one("SELECT * FROM companies WHERE id = %s", [company_id])
        if fields and updated:
            create_notification(
                user_id=request.user.id,
                title="Company Profile Updated",
                title_km="ប្រវត្តិរូបក្រុមហ៊ុនត្រូវបានកែប្រែ",
                message=f"Your company profile for {updated.get('name', 'Company')} has been updated.",
                message_km=f"ប្រវត្តិរូបក្រុមហ៊ុន {updated.get('name', '')} ត្រូវបានកែប្រែដោយជោគជ័យ។",
                notification_type="company_update",
                data={"action": "update_company", "company_id": company_id},
            )
            notify_admins(
                title="Company Profile Updated",
                title_km="ក្រុមហ៊ុនបានកែប្រែព័ត៌មាន",
                message=f"{updated.get('name', 'A company')} updated their profile/verification details.",
                message_km=f"ក្រុមហ៊ុន {updated.get('name', '')} បានកែប្រែព័ត៌មានក្រុមហ៊ុន។",
                notification_type="company_update",
                data={"action": "update_company", "company_id": company_id},
                exclude_user_id=request.user.id,
            )
        return Response({"success": True, "data": updated})


class EmployerCompanyUploadView(APIView):
    permission_classes = [IsEmployer, HasCustomPermission.with_perm("company:manage")]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded_file = request.FILES.get("file") or request.FILES.get("image")
        if not uploaded_file:
            raise ValidationError({"file": "No image or document file provided."})

        allowed_exts = [".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif", ".pdf"]
        file_ext = os.path.splitext(uploaded_file.name)[1].lower()
        if file_ext not in allowed_exts:
            raise ValidationError({"file": f"Unsupported format. Allowed formats: {', '.join(allowed_exts)}"})

        if uploaded_file.size > 5 * 1024 * 1024:
            raise ValidationError({"file": "File size must not exceed 5MB."})

        upload_dir = settings.MEDIA_ROOT / "companies"
        os.makedirs(upload_dir, exist_ok=True)

        upload_type = request.data.get("type", "logo")
        if upload_type in ["id_card", "national_id", "national_id_card"]:
            prefix = "id_card"
            target_column = "national_id_card"
        elif upload_type == "banner":
            prefix = "banner"
            target_column = "banner_url"
        else:
            prefix = "logo"
            target_column = "logo_url"

        clean_name = re.sub(r"[^a-zA-Z0-9_\.-]", "_", uploaded_file.name)
        saved_filename = f"comp_{request.user.id}_{int(time.time())}_{clean_name}"
        file_dest = upload_dir / saved_filename

        with open(file_dest, "wb+") as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)

        file_url = f"/media/companies/{saved_filename}"

        # Persist the uploaded image/document URL immediately
        em_row = fetch_one(
            "SELECT company_id FROM employer_members WHERE user_id = %s LIMIT 1",
            [request.user.id],
        )
        saved = False
        if em_row:
            execute_sql(
                f"UPDATE companies SET `{target_column}` = %s WHERE id = %s",
                [file_url, em_row["company_id"]],
            )
            saved = True

        return Response({
            "success": True,
            "url": file_url,
            "filename": saved_filename,
            "type": upload_type,
            "saved": saved,
            "message": f"Company {prefix} uploaded and saved successfully."
        })


class EmployerCompanyMembersView(APIView):
    """
    Sub-user Employee Management for Companies:
    Allows employers to view, create, and remove team members / recruiter employees.
    """
    def get_permissions(self):
        if self.request.method in ["POST", "PATCH", "PUT", "DELETE"]:
            return [IsEmployer(), HasCustomPermission.with_perm("company:manage")()]
        return [IsEmployer(), HasCustomPermission.with_perm("employer:access")()]

    def get(self, request):
        em_row = fetch_one(
            "SELECT company_id, role FROM employer_members WHERE user_id = %s LIMIT 1",
            [request.user.id],
        )
        if not em_row:
            comp_created = fetch_one("SELECT id FROM companies WHERE created_by = %s LIMIT 1", [request.user.id])
            if comp_created:
                execute_insert(
                    "INSERT INTO employer_members (company_id, user_id, role) VALUES (%s, %s, 'owner')",
                    [comp_created["id"], request.user.id],
                )
                em_row = fetch_one("SELECT company_id, role FROM employer_members WHERE user_id = %s LIMIT 1", [request.user.id])
            elif getattr(request.user, "has_role", lambda r: False)("admin"):
                first_comp = fetch_one("SELECT id FROM companies ORDER BY id ASC LIMIT 1")
                if first_comp:
                    execute_insert(
                        "INSERT INTO employer_members (company_id, user_id, role) VALUES (%s, %s, 'owner')",
                        [first_comp["id"], request.user.id],
                    )
                    em_row = fetch_one("SELECT company_id, role FROM employer_members WHERE user_id = %s LIMIT 1", [request.user.id])

        if not em_row:
            return Response({"success": True, "data": []})

        company_id = em_row["company_id"]
        members = fetch_all(
            """
            SELECT 
                em.id AS member_id,
                em.role AS member_role,
                em.created_at,
                u.id AS user_id,
                u.full_name,
                u.email,
                u.phone_number,
                u.is_active
            FROM employer_members em
            INNER JOIN users u ON u.id = em.user_id
            WHERE em.company_id = %s
            ORDER BY (em.role = 'owner') DESC, em.created_at ASC
            """,
            [company_id],
        )
        return Response({"success": True, "data": members, "my_role": em_row["role"]})

    def post(self, request):
        em_row = fetch_one(
            "SELECT company_id, role FROM employer_members WHERE user_id = %s LIMIT 1",
            [request.user.id],
        )
        if not em_row:
            comp_created = fetch_one("SELECT id FROM companies WHERE created_by = %s LIMIT 1", [request.user.id])
            if comp_created:
                execute_insert(
                    "INSERT INTO employer_members (company_id, user_id, role) VALUES (%s, %s, 'owner')",
                    [comp_created["id"], request.user.id],
                )
                em_row = fetch_one("SELECT company_id, role FROM employer_members WHERE user_id = %s LIMIT 1", [request.user.id])
            elif getattr(request.user, "has_role", lambda r: False)("admin"):
                first_comp = fetch_one("SELECT id FROM companies ORDER BY id ASC LIMIT 1")
                if first_comp:
                    execute_insert(
                        "INSERT INTO employer_members (company_id, user_id, role) VALUES (%s, %s, 'owner')",
                        [first_comp["id"], request.user.id],
                    )
                    em_row = fetch_one("SELECT company_id, role FROM employer_members WHERE user_id = %s LIMIT 1", [request.user.id])

        if not em_row:
            raise PermissionDenied("You must belong to a company to add team members.")

        if not request.user.has_permission("company:manage"):
            raise PermissionDenied("Only the company owner or authorized manager can add team members.")

        company_id = em_row["company_id"]
        data = request.data
        email = (data.get("email") or "").strip().lower()
        full_name = (data.get("full_name") or "").strip()
        phone_number = (data.get("phone_number") or "").strip() or None
        member_role = (data.get("role") or "recruiter").strip()
        password = data.get("password")

        if not email:
            raise ValidationError({"email": "Email address is required."})

        # Check if user already exists
        existing_user = fetch_one("SELECT id, full_name, is_active FROM users WHERE email = %s", [email])
        if existing_user:
            user_id = existing_user["id"]
            # Check if user already belongs to this company
            membership = fetch_one(
                "SELECT id FROM employer_members WHERE company_id = %s AND user_id = %s",
                [company_id, user_id],
            )
            if membership:
                raise ValidationError({"email": "This user is already an employee/member of this company."})

            # Check if user has employer role, add if missing
            emp_role = fetch_one("SELECT id FROM roles WHERE name = 'employer'")
            if emp_role:
                has_role = fetch_scalar(
                    "SELECT COUNT(*) FROM user_roles WHERE user_id = %s AND role_id = %s",
                    [user_id, emp_role["id"]],
                )
                if not has_role:
                    execute_insert(
                        "INSERT INTO user_roles (user_id, role_id) VALUES (%s, %s)",
                        [user_id, emp_role["id"]],
                    )

            execute_insert(
                "INSERT INTO employer_members (company_id, user_id, role) VALUES (%s, %s, %s)",
                [company_id, user_id, member_role],
            )
            return Response(
                {
                    "success": True,
                    "message": f"Existing user {existing_user['full_name']} added as {member_role} to company.",
                    "user_id": user_id,
                },
                status=status.HTTP_201_CREATED,
            )

        # Create brand new sub-user employee
        if not full_name:
            raise ValidationError({"full_name": "Full name is required for new employees."})
        if not password or len(password) < 4:
            raise ValidationError({"password": "Password is required and must be at least 4 characters."})

        hashed_pwd = make_password(password)
        with atomic_transaction():
            user_id = execute_insert(
                "INSERT INTO users (full_name, email, password_hash, phone_number, is_active) VALUES (%s, %s, %s, %s, TRUE)",
                [full_name, email, hashed_pwd, phone_number],
            )
            emp_role = fetch_one("SELECT id FROM roles WHERE name = 'employer'")
            if emp_role:
                execute_insert(
                    "INSERT INTO user_roles (user_id, role_id) VALUES (%s, %s)",
                    [user_id, emp_role["id"]],
                )
            execute_insert(
                "INSERT INTO employer_members (company_id, user_id, role) VALUES (%s, %s, %s)",
                [company_id, user_id, member_role],
            )

        return Response(
            {
                "success": True,
                "message": f"Sub-user employee {full_name} created successfully.",
                "user_id": user_id,
            },
            status=status.HTTP_201_CREATED,
        )

    def delete(self, request, user_id=None):
        em_row = fetch_one(
            "SELECT company_id, role FROM employer_members WHERE user_id = %s LIMIT 1",
            [request.user.id],
        )
        if not em_row:
            comp_created = fetch_one("SELECT id FROM companies WHERE created_by = %s LIMIT 1", [request.user.id])
            if comp_created:
                execute_insert(
                    "INSERT INTO employer_members (company_id, user_id, role) VALUES (%s, %s, 'owner')",
                    [comp_created["id"], request.user.id],
                )
                em_row = fetch_one("SELECT company_id, role FROM employer_members WHERE user_id = %s LIMIT 1", [request.user.id])
            elif getattr(request.user, "has_role", lambda r: False)("admin"):
                first_comp = fetch_one("SELECT id FROM companies ORDER BY id ASC LIMIT 1")
                if first_comp:
                    execute_insert(
                        "INSERT INTO employer_members (company_id, user_id, role) VALUES (%s, %s, 'owner')",
                        [first_comp["id"], request.user.id],
                    )
                    em_row = fetch_one("SELECT company_id, role FROM employer_members WHERE user_id = %s LIMIT 1", [request.user.id])

        if not em_row:
            raise PermissionDenied("You must belong to a company to remove team members.")

        if not request.user.has_permission("company:manage"):
            raise PermissionDenied("Only the company owner or authorized manager can remove team members.")

        company_id = em_row["company_id"]
        target_user_id = user_id or request.data.get("user_id")
        if not target_user_id:
            raise ValidationError({"detail": "User ID is required."})

        if int(target_user_id) == request.user.id:
            raise ValidationError({"detail": "You cannot remove yourself from the company."})

        # Check target membership
        target_mem = fetch_one(
            "SELECT id, role FROM employer_members WHERE company_id = %s AND user_id = %s",
            [company_id, target_user_id],
        )
        if not target_mem:
            raise NotFound("Employee member not found in this company.")

        if target_mem["role"] == "owner" and em_row["role"] != "owner":
            raise PermissionDenied("Only an owner can remove another owner.")

        execute_sql(
            "DELETE FROM employer_members WHERE company_id = %s AND user_id = %s",
            [company_id, target_user_id],
        )
        return Response({"success": True, "message": "Employee removed from company successfully."})

    def patch(self, request, user_id=None):
        em_row = fetch_one(
            "SELECT company_id, role FROM employer_members WHERE user_id = %s LIMIT 1",
            [request.user.id],
        )
        if not em_row:
            comp_created = fetch_one("SELECT id FROM companies WHERE created_by = %s LIMIT 1", [request.user.id])
            if comp_created:
                execute_insert(
                    "INSERT INTO employer_members (company_id, user_id, role) VALUES (%s, %s, 'owner')",
                    [comp_created["id"], request.user.id],
                )
                em_row = fetch_one("SELECT company_id, role FROM employer_members WHERE user_id = %s LIMIT 1", [request.user.id])
            elif getattr(request.user, "has_role", lambda r: False)("admin"):
                first_comp = fetch_one("SELECT id FROM companies ORDER BY id ASC LIMIT 1")
                if first_comp:
                    execute_insert(
                        "INSERT INTO employer_members (company_id, user_id, role) VALUES (%s, %s, 'owner')",
                        [first_comp["id"], request.user.id],
                    )
                    em_row = fetch_one("SELECT company_id, role FROM employer_members WHERE user_id = %s LIMIT 1", [request.user.id])

        if not em_row:
            raise PermissionDenied("You must belong to a company to manage team members.")

        is_admin = getattr(request.user, "has_role", lambda r: False)("admin")
        if not request.user.has_permission("company:manage"):
            raise PermissionDenied("Only the company owner or authorized manager can modify team member accounts.")

        company_id = em_row["company_id"]
        target_user_id = user_id or request.data.get("user_id")
        if not target_user_id:
            raise ValidationError({"detail": "User ID is required."})

        target_user_id = int(target_user_id)
        if target_user_id == request.user.id and not is_admin and "role" in request.data:
            new_role = (request.data.get("role") or "").strip().lower()
            if new_role and new_role != "owner":
                raise ValidationError({"detail": "You cannot change your own role as owner."})

        # Check target membership
        target_mem = fetch_one(
            "SELECT id, role FROM employer_members WHERE company_id = %s AND user_id = %s",
            [company_id, target_user_id],
        )
        if not target_mem:
            raise NotFound("Employee member not found in this company.")

        data = request.data
        user_updates = []
        user_params = []

        if "full_name" in data and data["full_name"]:
            full_name = str(data["full_name"]).strip()
            if full_name:
                user_updates.append("full_name = %s")
                user_params.append(full_name)

        if "phone_number" in data:
            phone_number = str(data["phone_number"] or "").strip() or None
            user_updates.append("phone_number = %s")
            user_params.append(phone_number)

        if "password" in data and data["password"]:
            pwd = str(data["password"]).strip()
            if len(pwd) < 4:
                raise ValidationError({"password": "Password must be at least 4 characters."})
            hashed_pwd = make_password(pwd)
            user_updates.append("password_hash = %s")
            user_params.append(hashed_pwd)

        if "email" in data and data["email"]:
            email = str(data["email"]).strip().lower()
            existing = fetch_one("SELECT id FROM users WHERE email = %s AND id != %s", [email, target_user_id])
            if existing:
                raise ValidationError({"email": "This email is already in use by another account."})
            user_updates.append("email = %s")
            user_params.append(email)

        with atomic_transaction():
            if user_updates:
                user_params.append(target_user_id)
                execute_sql(f"UPDATE users SET {', '.join(user_updates)} WHERE id = %s", user_params)

            if "role" in data and data["role"]:
                new_role = str(data["role"]).strip().lower()
                valid_roles = ["recruiter", "hiring_manager", "interviewer", "member"]
                if is_admin or em_row.get("role") == "owner":
                    valid_roles.append("owner")

                if new_role not in valid_roles:
                    raise ValidationError({"role": f"Invalid role. Choose from: {', '.join(valid_roles)}"})

                execute_sql(
                    "UPDATE employer_members SET role = %s WHERE company_id = %s AND user_id = %s",
                    [new_role, company_id, target_user_id],
                )

        updated_user = fetch_one(
            """
            SELECT u.id AS user_id, u.full_name, u.email, u.phone_number, em.role AS member_role
            FROM users u
            INNER JOIN employer_members em ON em.user_id = u.id AND em.company_id = %s
            WHERE u.id = %s
            """,
            [company_id, target_user_id],
        )

        return Response({
            "success": True,
            "message": "Team member account updated successfully.",
            "data": updated_user,
        })


