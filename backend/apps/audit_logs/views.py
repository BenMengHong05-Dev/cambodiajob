import json
import datetime
import os
import re
import time
from django.conf import settings
from django.contrib.auth.hashers import make_password
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny

from common.permissions import IsAdmin, HasCustomPermission
from common.database import fetch_one, fetch_all, fetch_scalar, execute_sql, execute_insert


class AdminDashboardView(APIView):
    permission_classes = [HasCustomPermission.with_perm("admin:access")]

    def get(self, request):
        total_apps = fetch_scalar("SELECT COUNT(*) FROM applications") or 0
        completed_apps = fetch_scalar("SELECT COUNT(*) FROM applications WHERE status IN ('offered', 'hired', 'accepted')") or 0
        placement_rate = round((completed_apps / total_apps * 100), 1) if total_apps > 0 else 0.0

        stats = {
            "total_users": fetch_scalar("SELECT COUNT(*) FROM users") or 0,
            "active_users": fetch_scalar("SELECT COUNT(*) FROM users WHERE is_active = TRUE") or 0,
            "suspended_users": fetch_scalar("SELECT COUNT(*) FROM users WHERE is_active = FALSE") or 0,
            "total_seekers": fetch_scalar("SELECT COUNT(*) FROM seeker_profiles") or 0,
            "total_companies": fetch_scalar("SELECT COUNT(*) FROM companies") or 0,
            "verified_companies": fetch_scalar("SELECT COUNT(*) FROM companies WHERE verification_status = 'verified'") or 0,
            "pending_verifications": fetch_scalar("SELECT COUNT(*) FROM companies WHERE verification_status = 'pending'") or 0,
            "total_jobs": fetch_scalar("SELECT COUNT(*) FROM jobs") or 0,
            "published_jobs": fetch_scalar("SELECT COUNT(*) FROM jobs WHERE status = 'published' AND moderation_status = 'approved'") or 0,
            "pending_moderation_jobs": fetch_scalar("SELECT COUNT(*) FROM jobs WHERE moderation_status = 'pending'") or 0,
            "total_applications": total_apps,
            "completed_applications": completed_apps,
            "placement_rate": placement_rate,
            "total_interviews": fetch_scalar("SELECT COUNT(*) FROM interviews") or 0,
            "total_resumes": fetch_scalar("SELECT COUNT(*) FROM resumes") or 0,
            "active_recruiters": fetch_scalar("SELECT COUNT(DISTINCT user_id) FROM employer_members") or 0,
            "total_categories": fetch_scalar("SELECT COUNT(*) FROM job_categories") or 0,
        }

        recent_applications = fetch_all(
            """
            SELECT a.id, a.status, a.created_at, j.title as job_title, u.full_name as applicant_name, sp.avatar_url as applicant_avatar, c.name as company_name, c.logo_url as company_logo
            FROM applications a
            INNER JOIN jobs j ON j.id = a.job_id
            INNER JOIN companies c ON c.id = j.company_id
            INNER JOIN seeker_profiles sp ON sp.id = a.seeker_id
            INNER JOIN users u ON u.id = sp.user_id
            ORDER BY a.created_at DESC, a.id DESC
            LIMIT 5
            """
        )

        recent_companies = fetch_all(
            """
            SELECT id, name, industry, province, logo_url, verification_status, created_at
            FROM companies
            ORDER BY created_at DESC
            LIMIT 5
            """
        )

        pending_jobs = fetch_all(
            """
            SELECT j.id, j.title, j.employment_type, j.workplace_type, j.created_at, c.name as company_name, c.logo_url as company_logo
            FROM jobs j
            INNER JOIN companies c ON c.id = j.company_id
            WHERE j.moderation_status = 'pending'
            ORDER BY j.created_at DESC, j.id DESC
            LIMIT 5
            """
        )

        pending_companies = fetch_all(
            """
            SELECT id, name, industry, province, logo_url, verification_status, created_at
            FROM companies
            WHERE verification_status = 'pending'
            ORDER BY created_at DESC
            LIMIT 5
            """
        )

        recent_audit_logs = fetch_all(
            """
            SELECT 
                al.id, al.action, al.entity_type, al.entity_id, al.details, al.created_at,
                u.full_name as user_name, u.email as user_email,
                COALESCE(
                    comp.name,
                    jb.title,
                    tu.full_name,
                    ro.name,
                    jc.name_en,
                    CASE WHEN al.entity_type = 'settings' THEN 'General Site Settings' ELSE NULL END
                ) as target_name
            FROM audit_logs al
            LEFT JOIN users u ON u.id = al.user_id
            LEFT JOIN companies comp ON (al.entity_type = 'company' AND comp.id = al.entity_id)
            LEFT JOIN jobs jb ON (al.entity_type = 'job' AND jb.id = al.entity_id)
            LEFT JOIN users tu ON (al.entity_type = 'user' AND tu.id = al.entity_id)
            LEFT JOIN roles ro ON (al.entity_type = 'role' AND ro.id = al.entity_id)
            LEFT JOIN job_categories jc ON (al.entity_type = 'category' AND jc.id = al.entity_id)
            ORDER BY al.created_at DESC, al.id DESC
            LIMIT 6
            """
        )

        # Real Database Analytics for 7d, 30d, 12m
        today = datetime.date.today()

        # 1. 7 Days
        km_days = {
            "Mon": "ច័ន្ទ", "Tue": "អង្គារ", "Wed": "ពុធ", "Thu": "ព្រហ",
            "Fri": "សុក្រ", "Sat": "សៅរ៍", "Sun": "អាទិត្យ"
        }
        seven_days = []
        for i in range(6, -1, -1):
            dt = today - datetime.timedelta(days=i)
            next_dt = dt + datetime.timedelta(days=1)
            app_cnt = fetch_scalar(
                "SELECT COUNT(*) FROM applications WHERE created_at >= %s AND created_at < %s",
                [dt, next_dt]
            ) or 0
            job_cnt = fetch_scalar(
                "SELECT COUNT(*) FROM jobs WHERE created_at >= %s AND created_at < %s",
                [dt, next_dt]
            ) or 0
            day_name = dt.strftime("%a")
            seven_days.append({
                "label": day_name,
                "labelKm": km_days.get(day_name, day_name),
                "applications": app_cnt,
                "jobs": job_cnt,
            })

        # 2. 30 Days (4 Weeks)
        thirty_days = []
        for w in range(3, -1, -1):
            w_start = today - datetime.timedelta(days=(w + 1) * 7)
            w_end = today - datetime.timedelta(days=w * 7)
            app_cnt = fetch_scalar(
                "SELECT COUNT(*) FROM applications WHERE created_at >= %s AND created_at < %s",
                [w_start, w_end]
            ) or 0
            job_cnt = fetch_scalar(
                "SELECT COUNT(*) FROM jobs WHERE created_at >= %s AND created_at < %s",
                [w_start, w_end]
            ) or 0
            w_num = 4 - w
            thirty_days.append({
                "label": f"Week {w_num}",
                "labelKm": f"សប្តាហ៍ {w_num}",
                "applications": app_cnt,
                "jobs": job_cnt,
            })

        # 3. 12 Months
        km_months = {
            "01": "មករា", "02": "កុម្ភៈ", "03": "មីនា", "04": "មេសា",
            "05": "ឧសភា", "06": "មិថុនា", "07": "កក្កដា", "08": "សីហា",
            "09": "កញ្ញា", "10": "តុលា", "11": "វិច្ឆិកា", "12": "ធ្នូ"
        }
        en_months = {
            "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
            "05": "May", "06": "Jun", "07": "Jul", "08": "Aug",
            "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec"
        }
        twelve_months = []
        for m in range(11, -1, -1):
            year = today.year
            month = today.month - m
            while month <= 0:
                month += 12
                year -= 1
            start_date = datetime.date(year, month, 1)
            if month == 12:
                end_date = datetime.date(year + 1, 1, 1)
            else:
                end_date = datetime.date(year, month + 1, 1)
            app_cnt = fetch_scalar(
                "SELECT COUNT(*) FROM applications WHERE created_at >= %s AND created_at < %s",
                [start_date, end_date]
            ) or 0
            job_cnt = fetch_scalar(
                "SELECT COUNT(*) FROM jobs WHERE created_at >= %s AND created_at < %s",
                [start_date, end_date]
            ) or 0
            m_code = f"{month:02d}"
            twelve_months.append({
                "label": en_months.get(m_code, m_code),
                "labelKm": km_months.get(m_code, m_code),
                "applications": app_cnt,
                "jobs": job_cnt,
            })

        analytics = {
            "7d": seven_days,
            "30d": thirty_days,
            "12m": twelve_months,
        }

        return Response({
            "success": True,
            "data": {
                "stats": stats,
                "recent_applications": recent_applications,
                "recent_companies": recent_companies,
                "pending_jobs": pending_jobs,
                "pending_companies": pending_companies,
                "recent_audit_logs": recent_audit_logs,
                "analytics": analytics,
            }
        })


class AdminUsersView(APIView):
    permission_classes = [HasCustomPermission.with_perm("users:manage")]

    def get(self, request):
        sql = """
            SELECT 
                u.id, u.email, u.full_name, u.phone_number, u.is_active, u.created_at,
                COALESCE(sp.avatar_url, c.logo_url) as avatar_url,
                GROUP_CONCAT(DISTINCT r.name) as role_names,
                c.id as company_id,
                c.name as company_name,
                em.role as company_member_role
            FROM users u
            LEFT JOIN user_roles ur ON ur.user_id = u.id
            LEFT JOIN roles r ON r.id = ur.role_id
            LEFT JOIN seeker_profiles sp ON sp.user_id = u.id
            LEFT JOIN employer_members em ON em.user_id = u.id
            LEFT JOIN companies c ON c.id = em.company_id
            GROUP BY u.id, c.id, c.name, em.role
            ORDER BY u.created_at DESC, u.id DESC
        """
        users = fetch_all(sql)
        user_ids = [u["id"] for u in users]
        custom_perm_map = {}
        if user_ids:
            format_strings = ','.join(['%s'] * len(user_ids))
            up_rows = fetch_all(f"SELECT user_id, permission FROM user_permissions WHERE user_id IN ({format_strings})", user_ids)
            for r in up_rows:
                custom_perm_map.setdefault(r["user_id"], []).append(r["permission"])

        rp_rows = fetch_all("SELECT r.name as role_name, rp.permission FROM role_permissions rp INNER JOIN roles r ON r.id = rp.role_id")
        role_perm_map = {}
        for r in rp_rows:
            role_perm_map.setdefault(r["role_name"], []).append(r["permission"])

        for u in users:
            roles_list = [r.strip() for r in (u["role_names"] or "").split(",") if r.strip()]
            u["roles"] = roles_list
            u["role"] = roles_list[0] if len(roles_list) > 0 else "job_seeker"
            if u["id"] in custom_perm_map:
                u["permissions"] = [p for p in custom_perm_map[u["id"]] if p != "__none__"]
                u["has_custom_permissions"] = True
            else:
                default_perms = set()
                for r in roles_list:
                    default_perms.update(role_perm_map.get(r, []))
                u["permissions"] = sorted(list(default_perms))
                u["has_custom_permissions"] = False
        return Response({"success": True, "data": users})

    def post(self, request):
        data = request.data
        full_name = data.get("full_name")
        email = (data.get("email") or "").strip().lower()
        password = data.get("password")
        phone_number = data.get("phone_number")
        roles = data.get("roles", ["job_seeker"])

        if not full_name or not email or not password:
            raise ValidationError({"detail": "Full name, email, and password are required."})

        exists = fetch_scalar("SELECT COUNT(*) FROM users WHERE email = %s", [email])
        if exists:
            raise ValidationError({"email": "A user with this email already exists."})

        hashed_pwd = make_password(password)
        user_id = execute_insert(
            "INSERT INTO users (full_name, email, password_hash, phone_number, is_active) VALUES (%s, %s, %s, %s, TRUE)",
            [full_name, email, hashed_pwd, phone_number],
        )

        # Each user has exactly ONE role
        role = data.get("role")
        if not role:
            roles_input = data.get("roles", ["job_seeker"])
            role = roles_input[0] if isinstance(roles_input, list) and len(roles_input) > 0 else "job_seeker"

        r_row = fetch_one("SELECT id FROM roles WHERE name = %s", [role])
        if r_row:
            execute_insert("INSERT INTO user_roles (user_id, role_id) VALUES (%s, %s)", [user_id, r_row["id"]])

        if role == "job_seeker":
            execute_insert("INSERT INTO seeker_profiles (user_id, salary_currency) VALUES (%s, 'USD')", [user_id])

        if "permissions" in data and isinstance(data["permissions"], list) and len(data["permissions"]) > 0:
            for p in set(data["permissions"]):
                if p and isinstance(p, str):
                    execute_insert("INSERT INTO user_permissions (user_id, permission) VALUES (%s, %s)", [user_id, p.strip()])

        # If company assigned to this employee/sub-user
        company_id = data.get("company_id")
        company_member_role = data.get("company_member_role") or "recruiter"
        if company_id:
            execute_insert(
                "INSERT INTO employer_members (company_id, user_id, role) VALUES (%s, %s, %s)",
                [company_id, user_id, company_member_role],
            )

        return Response({"success": True, "user_id": user_id, "message": "User created successfully."}, status=status.HTTP_201_CREATED)


class AdminUserDetailView(APIView):
    permission_classes = [HasCustomPermission.with_perm("users:manage")]

    def get(self, request, pk):
        user = fetch_one(
            """
            SELECT u.id, u.email, u.full_name, u.phone_number, u.is_active, u.created_at, u.updated_at,
                   GROUP_CONCAT(r.name) as role_names
            FROM users u
            LEFT JOIN user_roles ur ON ur.user_id = u.id
            LEFT JOIN roles r ON r.id = ur.role_id
            WHERE u.id = %s
            GROUP BY u.id
            """,
            [pk],
        )
        if not user:
            raise NotFound("User not found.")
        roles_list = [r.strip() for r in (user["role_names"] or "").split(",") if r.strip()]
        user["roles"] = roles_list
        user["role"] = roles_list[0] if len(roles_list) > 0 else "job_seeker"

        # Attach permissions
        u_perms = fetch_all("SELECT permission FROM user_permissions WHERE user_id = %s", [pk])
        if u_perms:
            user["permissions"] = [p["permission"] for p in u_perms if p["permission"] != "__none__"]
            user["has_custom_permissions"] = True
        else:
            default_perms = fetch_all(
                "SELECT DISTINCT rp.permission FROM role_permissions rp INNER JOIN user_roles ur ON ur.role_id = rp.role_id WHERE ur.user_id = %s",
                [pk]
            )
            user["permissions"] = [p["permission"] for p in default_perms]
            user["has_custom_permissions"] = False

        # If Job Seeker, attach complete candidate profile, education, work experience, skills, and resumes
        seeker = fetch_one(
            """
            SELECT id, headline, summary, province, city, expected_salary, salary_currency, avatar_url, created_at
            FROM seeker_profiles
            WHERE user_id = %s
            """,
            [pk],
        )
        if seeker:
            seeker_id = seeker["id"]
            seeker["skills"] = fetch_all(
                """
                SELECT s.id, s.name, ss.proficiency_level
                FROM seeker_skills ss
                INNER JOIN skills s ON s.id = ss.skill_id
                WHERE ss.seeker_id = %s
                ORDER BY s.name ASC
                """,
                [seeker_id],
            )
            seeker["educations"] = fetch_all(
                """
                SELECT id, institution, degree, field_of_study, start_date, end_date
                FROM educations
                WHERE seeker_id = %s
                ORDER BY start_date DESC
                """,
                [seeker_id],
            )
            seeker["work_experiences"] = fetch_all(
                """
                SELECT id, company_name, job_title, location, start_date, end_date, is_current, description
                FROM work_experiences
                WHERE seeker_id = %s
                ORDER BY start_date DESC
                """,
                [seeker_id],
            )
            seeker["resumes"] = fetch_all(
                """
                SELECT id, title, file_path, file_size, is_primary, created_at
                FROM resumes
                WHERE seeker_id = %s
                ORDER BY is_primary DESC, id DESC
                """,
                [seeker_id],
            )
            user["seeker_profile"] = seeker

        # If Employer, attach company details
        company = fetch_one(
            """
            SELECT c.id, c.name, c.industry, c.company_size, c.province, c.city, c.address, c.website, c.verification_status, c.created_at
            FROM employer_members em
            INNER JOIN companies c ON c.id = em.company_id
            WHERE em.user_id = %s
            LIMIT 1
            """,
            [pk],
        )
        if company:
            user["employer_company"] = company

        return Response({"success": True, "data": user})

    def patch(self, request, pk):
        user = fetch_one("SELECT id, full_name, email, phone_number, is_active FROM users WHERE id = %s", [pk])
        if not user:
            raise NotFound("User not found.")

        data = request.data
        full_name = data.get("full_name", user["full_name"])
        email = (data.get("email") or user["email"]).strip().lower()
        phone_number = data.get("phone_number", user["phone_number"])
        is_active = data.get("is_active", user["is_active"])

        if email != user["email"]:
            exists = fetch_scalar("SELECT COUNT(*) FROM users WHERE email = %s AND id != %s", [email, pk])
            if exists:
                raise ValidationError({"email": "This email is already in use by another account."})

        new_password = data.get("password")
        if new_password and len(new_password.strip()) >= 6:
            hashed_pwd = make_password(new_password.strip())
            execute_sql(
                "UPDATE users SET full_name = %s, email = %s, phone_number = %s, is_active = %s, password_hash = %s WHERE id = %s",
                [full_name, email, phone_number, is_active, hashed_pwd, pk],
            )
        else:
            execute_sql(
                "UPDATE users SET full_name = %s, email = %s, phone_number = %s, is_active = %s WHERE id = %s",
                [full_name, email, phone_number, is_active, pk],
            )

        if "role" in data or "roles" in data:
            role = data.get("role")
            if not role:
                roles_input = data.get("roles", ["job_seeker"])
                role = roles_input[0] if isinstance(roles_input, list) and len(roles_input) > 0 else "job_seeker"
            execute_sql("DELETE FROM user_roles WHERE user_id = %s", [pk])
            r_row = fetch_one("SELECT id FROM roles WHERE name = %s", [role])
            if r_row:
                execute_insert("INSERT INTO user_roles (user_id, role_id) VALUES (%s, %s)", [pk, r_row["id"]])

        if "permissions" in data or "has_custom_permissions" in data:
            has_custom = data.get("has_custom_permissions")
            perms_input = data.get("permissions")
            execute_sql("DELETE FROM user_permissions WHERE user_id = %s", [pk])
            if has_custom is True or (has_custom is None and isinstance(perms_input, list) and len(perms_input) > 0):
                clean_perms = [p.strip() for p in (perms_input or []) if p and isinstance(p, str) and p.strip() != "__none__"]
                if clean_perms:
                    for p in set(clean_perms):
                        execute_insert("INSERT INTO user_permissions (user_id, permission) VALUES (%s, %s)", [pk, p])
                else:
                    # Sentinel marks an intentional custom override with 0 permissions
                    execute_insert("INSERT INTO user_permissions (user_id, permission) VALUES (%s, '__none__')", [pk])

        if "company_id" in data:
            new_cid = data.get("company_id")
            new_crole = data.get("company_member_role") or "recruiter"
            execute_sql("DELETE FROM employer_members WHERE user_id = %s", [pk])
            if new_cid:
                execute_insert(
                    "INSERT INTO employer_members (company_id, user_id, role) VALUES (%s, %s, %s)",
                    [new_cid, pk, new_crole],
                )

        execute_insert(
            "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (%s, %s, 'user', %s, %s)",
            [request.user.id, "update_user", pk, json.dumps({"email": email, "full_name": full_name, "is_active": is_active})],
        )

        return Response({"success": True, "message": "User updated successfully."})

    def delete(self, request, pk):
        if pk == request.user.id:
            raise ValidationError({"detail": "You cannot delete your own admin account."})
        if pk == 1:
            raise ValidationError({"detail": "Platform super administrator account cannot be deleted."})

        user = fetch_one("SELECT id, full_name, email FROM users WHERE id = %s", [pk])
        if not user:
            raise NotFound("User not found.")

        # Reassign any companies/jobs/interviews created_by to root admin 1
        execute_sql("UPDATE companies SET created_by = 1 WHERE created_by = %s", [pk])
        execute_sql("UPDATE jobs SET created_by = 1 WHERE created_by = %s", [pk])
        execute_sql("UPDATE interviews SET created_by = 1 WHERE created_by = %s", [pk])

        execute_sql("DELETE FROM users WHERE id = %s", [pk])

        execute_insert(
            "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (%s, %s, 'user', %s, %s)",
            [request.user.id, "delete_user", pk, json.dumps({"email": user["email"], "name": user["full_name"]})],
        )

        return Response({"success": True, "message": "User account permanently deleted."})


class AdminUserBulkDeleteView(APIView):
    permission_classes = [HasCustomPermission.with_perm("users:manage")]

    def post(self, request):
        user_ids = request.data.get("user_ids", [])
        if not isinstance(user_ids, list) or len(user_ids) == 0:
            raise ValidationError({"user_ids": "No user IDs provided."})

        safe_ids = [uid for uid in user_ids if uid != request.user.id and uid != 1]
        if not safe_ids:
            return Response({"success": True, "deleted_count": 0, "message": "No eligible accounts to delete."})

        for uid in safe_ids:
            execute_sql("UPDATE companies SET created_by = 1 WHERE created_by = %s", [uid])
            execute_sql("UPDATE jobs SET created_by = 1 WHERE created_by = %s", [uid])
            execute_sql("UPDATE interviews SET created_by = 1 WHERE created_by = %s", [uid])
            execute_sql("DELETE FROM users WHERE id = %s", [uid])

        execute_insert(
            "INSERT INTO audit_logs (user_id, action, entity_type, details) VALUES (%s, %s, 'user', %s)",
            [request.user.id, "bulk_delete_users", json.dumps({"deleted_ids": safe_ids})],
        )

        return Response({"success": True, "deleted_count": len(safe_ids), "message": f"{len(safe_ids)} accounts deleted."})


class AdminUserStatusView(APIView):
    permission_classes = [HasCustomPermission.with_perm("users:manage")]

    def patch(self, request, pk):
        user = fetch_one("SELECT id, is_active FROM users WHERE id = %s", [pk])
        if not user:
            raise NotFound("User not found.")

        new_status = not user["is_active"]
        execute_sql("UPDATE users SET is_active = %s WHERE id = %s", [new_status, pk])

        # Audit log
        execute_insert(
            "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (%s, %s, 'user', %s, %s)",
            [request.user.id, "toggle_user_status", pk, json.dumps({"is_active": new_status})],
        )

        return Response({"success": True, "message": f"User status updated to {'active' if new_status else 'suspended'}."})


class AdminCompaniesView(APIView):
    permission_classes = [HasCustomPermission.with_perm("companies:verify")]

    def get(self, request):
        sql = """
            SELECT 
                c.id, c.name, c.slug, c.logo_url, c.banner_url, c.description, c.website,
                c.industry, c.company_size, c.province, c.city, c.address,
                c.national_id_card, c.business_license_no,
                c.verification_status,
                c.verified_at, c.created_at, u.full_name as owner_name, u.email as owner_email,
                (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id) as jobs_count
            FROM companies c
            LEFT JOIN users u ON u.id = c.created_by
            ORDER BY c.created_at DESC, c.id DESC
        """
        companies = fetch_all(sql)
        return Response({"success": True, "data": companies})


class AdminCompanyDetailView(APIView):
    permission_classes = [HasCustomPermission.with_perm("companies:verify")]

    def get(self, request, pk):
        company = fetch_one(
            """
            SELECT 
                c.id, c.name, c.slug, c.logo_url, c.banner_url, c.description, c.website,
                c.industry, c.company_size, c.province, c.city, c.address,
                c.national_id_card, c.business_license_no,
                c.verification_status,
                c.verified_at, c.created_at, u.full_name as owner_name, u.email as owner_email,
                (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id) as jobs_count
            FROM companies c
            LEFT JOIN users u ON u.id = c.created_by
            WHERE c.id = %s
            """,
            [pk],
        )
        if not company:
            raise NotFound("Company not found.")
        return Response({"success": True, "data": company})

    def patch(self, request, pk):
        company = fetch_one("SELECT id, name, verification_status FROM companies WHERE id = %s", [pk])
        if not company:
            raise NotFound("Company not found.")

        name = request.data.get("name")
        industry = request.data.get("industry")
        province = request.data.get("province")
        city = request.data.get("city")
        address = request.data.get("address")
        website = request.data.get("website")
        company_size = request.data.get("company_size")
        description = request.data.get("description")
        verification_status = request.data.get("verification_status")

        updates = []
        params = []

        if name is not None:
            updates.append("name = %s")
            params.append(name.strip())
        if industry is not None:
            updates.append("industry = %s")
            params.append(industry.strip() or None)
        if province is not None:
            updates.append("province = %s")
            params.append(province.strip() or None)
        if city is not None:
            updates.append("city = %s")
            params.append(city.strip() or None)
        if address is not None:
            updates.append("address = %s")
            params.append(address.strip() or None)
        if website is not None:
            updates.append("website = %s")
            params.append(website.strip() or None)
        if company_size is not None:
            updates.append("company_size = %s")
            params.append(company_size or None)
        if description is not None:
            updates.append("description = %s")
            params.append(description)
        if verification_status is not None:
            if verification_status not in ["verified", "rejected", "pending"]:
                raise ValidationError({"verification_status": "Invalid verification status."})
            updates.append("verification_status = %s")
            params.append(verification_status)
            if verification_status == "verified":
                updates.append("verified_at = NOW()")
            else:
                updates.append("verified_at = NULL")

        if updates:
            updates.append("updated_at = NOW()")
            params.append(pk)
            sql = f"UPDATE companies SET {', '.join(updates)} WHERE id = %s"
            execute_sql(sql, params)

            # Audit log
            execute_insert(
                "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (%s, 'update_company', 'company', %s, %s)",
                [request.user.id, pk, json.dumps({"updated_fields": list(request.data.keys())})],
            )

        updated_company = fetch_one(
            """
            SELECT 
                c.id, c.name, c.slug, c.logo_url, c.banner_url, c.description, c.website,
                c.industry, c.company_size, c.province, c.city, c.address, c.verification_status,
                c.verified_at, c.created_at, u.full_name as owner_name, u.email as owner_email,
                (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id) as jobs_count
            FROM companies c
            LEFT JOIN users u ON u.id = c.created_by
            WHERE c.id = %s
            """,
            [pk],
        )
        return Response({"success": True, "data": updated_company, "message": "Company updated successfully."})

    def delete(self, request, pk):
        company = fetch_one("SELECT id, name FROM companies WHERE id = %s", [pk])
        if not company:
            raise NotFound("Company not found.")

        company_name = company["name"]
        execute_sql("DELETE FROM companies WHERE id = %s", [pk])

        # Audit log
        execute_insert(
            "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (%s, 'delete_company', 'company', %s, %s)",
            [request.user.id, pk, json.dumps({"deleted_company_name": company_name})],
        )

        return Response({"success": True, "message": f"Company '{company_name}' deleted successfully."})


class AdminCompanyVerificationView(APIView):
    permission_classes = [HasCustomPermission.with_perm("companies:verify")]

    def patch(self, request, pk):
        company = fetch_one("SELECT id, name FROM companies WHERE id = %s", [pk])
        if not company:
            raise NotFound("Company not found.")

        verification_status = request.data.get("verification_status")
        if verification_status not in ["verified", "rejected", "pending"]:
            raise ValidationError({"verification_status": "Invalid verification status."})

        verified_at = "NOW()" if verification_status == "verified" else "NULL"
        execute_sql(
            f"UPDATE companies SET verification_status = %s, verified_at = {verified_at} WHERE id = %s",
            [verification_status, pk],
        )

        # Audit log
        execute_insert(
            "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (%s, 'company_verification', 'company', %s, %s)",
            [request.user.id, pk, json.dumps({"verification_status": verification_status})],
        )

        return Response({"success": True, "message": f"Company verification updated to '{verification_status}'."})


class AdminCompanyMembersView(APIView):
    """
    Sub-user Employee Management for Companies (Admin Console):
    List, create, or remove sub-user employees / recruiters for any company.
    """
    permission_classes = [HasCustomPermission.with_perm("companies:verify")]

    def get(self, request, pk):
        company = fetch_one("SELECT id, name FROM companies WHERE id = %s", [pk])
        if not company:
            raise NotFound("Company not found.")

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
            ORDER BY (em.role = 'owner') DESC, em.created_at DESC, em.id DESC
            """,
            [pk],
        )
        return Response({"success": True, "data": members, "company": company})

    def post(self, request, pk):
        company = fetch_one("SELECT id, name FROM companies WHERE id = %s", [pk])
        if not company:
            raise NotFound("Company not found.")

        data = request.data
        email = (data.get("email") or "").strip().lower()
        full_name = (data.get("full_name") or "").strip()
        phone_number = (data.get("phone_number") or "").strip() or None
        member_role = (data.get("role") or "recruiter").strip()
        password = data.get("password")

        if not email:
            raise ValidationError({"email": "Email address is required."})

        existing_user = fetch_one("SELECT id, full_name FROM users WHERE email = %s", [email])
        if existing_user:
            user_id = existing_user["id"]
            membership = fetch_one(
                "SELECT id FROM employer_members WHERE company_id = %s AND user_id = %s",
                [pk, user_id],
            )
            if membership:
                raise ValidationError({"email": "User is already an employee/member of this company."})

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
                [pk, user_id, member_role],
            )
            return Response(
                {
                    "success": True,
                    "message": f"User {existing_user['full_name']} linked to company {company['name']}.",
                    "user_id": user_id,
                },
                status=status.HTTP_201_CREATED,
            )

        if not full_name:
            raise ValidationError({"full_name": "Full name is required for new employees."})
        if not password or len(password) < 6:
            raise ValidationError({"password": "Password must be at least 6 characters."})

        hashed_pwd = make_password(password)
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
            [pk, user_id, member_role],
        )

        return Response(
            {
                "success": True,
                "message": f"Sub-user employee {full_name} created for {company['name']}.",
                "user_id": user_id,
            },
            status=status.HTTP_201_CREATED,
        )

    def delete(self, request, pk, user_id):
        mem = fetch_one(
            "SELECT id FROM employer_members WHERE company_id = %s AND user_id = %s",
            [pk, user_id],
        )
        if not mem:
            raise NotFound("Employee member not found in this company.")

        execute_sql(
            "DELETE FROM employer_members WHERE company_id = %s AND user_id = %s",
            [pk, user_id],
        )
        return Response({"success": True, "message": "Employee removed from company successfully."})

    def patch(self, request, pk, user_id=None):
        target_user_id = user_id or request.data.get("user_id")
        if not target_user_id:
            raise ValidationError({"detail": "User ID is required."})

        new_role = (request.data.get("role") or "").strip().lower()
        valid_roles = ["owner", "recruiter", "hiring_manager", "interviewer", "member"]
        if not new_role or new_role not in valid_roles:
            raise ValidationError({"role": f"Invalid role. Choose from: {', '.join(valid_roles)}"})

        mem = fetch_one(
            "SELECT id FROM employer_members WHERE company_id = %s AND user_id = %s",
            [pk, target_user_id],
        )
        if not mem:
            raise NotFound("Employee member not found in this company.")

        execute_sql(
            "UPDATE employer_members SET role = %s WHERE company_id = %s AND user_id = %s",
            [new_role, pk, target_user_id],
        )
        return Response({"success": True, "message": f"Team member role updated to '{new_role}' successfully."})


class AdminJobsModerationView(APIView):
    permission_classes = [HasCustomPermission.with_perm("jobs:moderate")]

    def get(self, request):
        sql = """
            SELECT 
                j.id, j.company_id, j.category_id, j.title, j.title_km, j.slug, j.province, j.city, j.address,
                j.salary_min, j.salary_max, j.salary_currency, j.is_salary_negotiable,
                j.employment_type, j.workplace_type, j.experience_level, j.education_level,
                j.vacancies_count, j.description, j.description_km, j.requirements,
                j.status, j.moderation_status, j.created_at, j.expires_at,
                c.name as company_name, c.slug as company_slug, c.logo_url as company_logo,
                c.verification_status as company_verification_status,
                (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as applications_count
            FROM jobs j
            INNER JOIN companies c ON c.id = j.company_id
            ORDER BY j.created_at DESC, j.id DESC
        """
        jobs = fetch_all(sql)
        return Response({"success": True, "data": jobs})

    def patch(self, request, pk):
        job = fetch_one("SELECT id, title FROM jobs WHERE id = %s", [pk])
        if not job:
            raise NotFound("Job vacancy not found.")

        moderation_status = request.data.get("moderation_status")
        if moderation_status not in ["approved", "rejected", "pending"]:
            raise ValidationError({"moderation_status": "Invalid moderation status."})

        execute_sql(
            "UPDATE jobs SET moderation_status = %s WHERE id = %s",
            [moderation_status, pk],
        )

        # Audit log
        execute_insert(
            "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (%s, 'job_moderation', 'job', %s, %s)",
            [request.user.id, pk, json.dumps({"moderation_status": moderation_status})],
        )

        return Response({"success": True, "message": f"Job moderation status updated to '{moderation_status}'."})

    def delete(self, request, pk):
        job = fetch_one("SELECT id, title FROM jobs WHERE id = %s", [pk])
        if not job:
            raise NotFound("Job vacancy not found.")

        title = job["title"]
        execute_sql("DELETE FROM jobs WHERE id = %s", [pk])

        # Audit log
        execute_insert(
            "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (%s, 'delete_job', 'job', %s, %s)",
            [request.user.id, pk, json.dumps({"deleted_job_title": title})],
        )

        return Response({"success": True, "message": f"Job '{title}' deleted successfully."})


class AdminJobDetailView(APIView):
    permission_classes = [HasCustomPermission.with_perm("jobs:moderate")]

    def get(self, request, pk):
        job = fetch_one(
            """
            SELECT 
                j.id, j.company_id, j.category_id, j.title, j.title_km, j.slug,
                j.description, j.description_km, j.requirements,
                j.employment_type, j.workplace_type, j.experience_level, j.education_level,
                j.province, j.city, j.address,
                j.salary_min, j.salary_max, j.salary_currency, j.is_salary_negotiable,
                j.vacancies_count, j.status, j.moderation_status,
                j.published_at, j.expires_at, j.created_at, j.updated_at,
                c.name as company_name, c.logo_url as company_logo
            FROM jobs j
            INNER JOIN companies c ON c.id = j.company_id
            WHERE j.id = %s
            """,
            [pk],
        )
        if not job:
            raise NotFound("Job vacancy not found.")
        return Response({"success": True, "data": job})

    def patch(self, request, pk):
        job = fetch_one("SELECT id, title, company_id FROM jobs WHERE id = %s", [pk])
        if not job:
            raise NotFound("Job vacancy not found.")

        data = request.data
        updates = []
        params = []

        if "title" in data:
            val = (data.get("title") or "").strip()
            if not val:
                raise ValidationError({"title": "Job title cannot be empty."})
            updates.append("title = %s")
            params.append(val)

        if "title_km" in data:
            val = (data.get("title_km") or "").strip() or None
            updates.append("title_km = %s")
            params.append(val)

        if "category_id" in data:
            cat_id = data.get("category_id")
            updates.append("category_id = %s")
            params.append(cat_id if cat_id else None)

        if "employment_type" in data:
            updates.append("employment_type = %s")
            params.append(data.get("employment_type") or "full_time")

        if "workplace_type" in data:
            updates.append("workplace_type = %s")
            params.append(data.get("workplace_type") or "on_site")

        if "experience_level" in data:
            updates.append("experience_level = %s")
            params.append(data.get("experience_level") or "entry")

        if "education_level" in data:
            val = (data.get("education_level") or "").strip() or None
            updates.append("education_level = %s")
            params.append(val)

        if "province" in data:
            updates.append("province = %s")
            params.append((data.get("province") or "Phnom Penh").strip())

        if "city" in data:
            updates.append("city = %s")
            params.append((data.get("city") or "").strip() or None)

        if "address" in data:
            updates.append("address = %s")
            params.append((data.get("address") or "").strip() or None)

        if "salary_min" in data:
            s_min = data.get("salary_min")
            updates.append("salary_min = %s")
            params.append(s_min if s_min is not None and str(s_min).strip() != "" else None)

        if "salary_max" in data:
            s_max = data.get("salary_max")
            updates.append("salary_max = %s")
            params.append(s_max if s_max is not None and str(s_max).strip() != "" else None)

        if "salary_currency" in data:
            updates.append("salary_currency = %s")
            params.append(data.get("salary_currency") or "USD")

        if "is_salary_negotiable" in data:
            updates.append("is_salary_negotiable = %s")
            params.append(bool(data.get("is_salary_negotiable")))

        if "vacancies_count" in data:
            try:
                vc = max(1, int(data.get("vacancies_count", 1)))
            except (ValueError, TypeError):
                vc = 1
            updates.append("vacancies_count = %s")
            params.append(vc)

        if "status" in data:
            st = data.get("status")
            if st in ["published", "draft", "closed"]:
                updates.append("status = %s")
                params.append(st)

        if "moderation_status" in data:
            mod_st = data.get("moderation_status")
            if mod_st in ["approved", "rejected", "pending"]:
                updates.append("moderation_status = %s")
                params.append(mod_st)

        if "description" in data:
            updates.append("description = %s")
            params.append(data.get("description") or "")

        if "description_km" in data:
            updates.append("description_km = %s")
            params.append(data.get("description_km") or None)

        if "requirements" in data:
            updates.append("requirements = %s")
            params.append(data.get("requirements") or None)

        if updates:
            updates.append("updated_at = NOW()")
            params.append(pk)
            sql = f"UPDATE jobs SET {', '.join(updates)} WHERE id = %s"
            execute_sql(sql, params)

            # Audit log
            execute_insert(
                "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (%s, 'update_job', 'job', %s, %s)",
                [request.user.id, pk, json.dumps({"updated_fields": list(data.keys()), "job_title": job["title"]})],
            )

        updated_job = fetch_one("SELECT * FROM jobs WHERE id = %s", [pk])
        return Response({"success": True, "message": "Job vacancy updated successfully.", "data": updated_job})

    def delete(self, request, pk):
        job = fetch_one("SELECT id, title FROM jobs WHERE id = %s", [pk])
        if not job:
            raise NotFound("Job vacancy not found.")

        title = job["title"]
        execute_sql("DELETE FROM jobs WHERE id = %s", [pk])

        # Audit log
        execute_insert(
            "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (%s, 'delete_job', 'job', %s, %s)",
            [request.user.id, pk, json.dumps({"deleted_job_title": title})],
        )

        return Response({"success": True, "message": f"Job '{title}' deleted successfully."})


class AdminAuditLogsView(APIView):
    permission_classes = [HasCustomPermission.with_perm("audit:view")]

    def get(self, request):
        sql = """
            SELECT 
                al.id, al.action, al.entity_type, al.entity_id, al.details, al.ip_address, al.created_at,
                u.full_name as user_name, u.email as user_email,
                COALESCE(
                    comp.name,
                    jb.title,
                    tu.full_name,
                    ro.name,
                    jc.name_en,
                    CASE WHEN al.entity_type = 'settings' THEN 'General Site Settings' ELSE NULL END
                ) as target_name
            FROM audit_logs al
            LEFT JOIN users u ON u.id = al.user_id
            LEFT JOIN companies comp ON (al.entity_type = 'company' AND comp.id = al.entity_id)
            LEFT JOIN jobs jb ON (al.entity_type = 'job' AND jb.id = al.entity_id)
            LEFT JOIN users tu ON (al.entity_type = 'user' AND tu.id = al.entity_id)
            LEFT JOIN roles ro ON (al.entity_type = 'role' AND ro.id = al.entity_id)
            LEFT JOIN job_categories jc ON (al.entity_type = 'category' AND jc.id = al.entity_id)
            ORDER BY al.created_at DESC, al.id DESC
            LIMIT 300
        """
        logs = fetch_all(sql)
        return Response({"success": True, "data": logs})


def get_site_settings_dict() -> dict:
    """Fetch site settings row, or fallback defaults if table row is absent."""
    settings_row = fetch_one("SELECT * FROM site_settings WHERE id = 1")
    if not settings_row:
        return {
            "id": 1,
            "site_name": "CambodiaJobs",
            "site_name_km": "ការងារកម្ពុជា",
            "site_title": "CambodiaJobs | Cambodia's #1 Job Search & Recruitment Platform",
            "site_title_km": "វេទិកាការងារ និងជ្រើសរើសបុគ្គលិកឈានមុខគេនៅកម្ពុជា",
            "site_subtitle": "Find your dream career or hire top talent across Cambodia",
            "site_subtitle_km": "ស្វែងរកការងារក្នុងក្តីស្រមៃ ឬជ្រើសរើសបុគ្គលិកឆ្នើមទូទាំងប្រទេសកម្ពុជា",
            "site_description": "CambodiaJobs is the premier job search and talent acquisition platform in Cambodia. Connecting verified employers with skilled professionals across Phnom Penh and all 25 provinces.",
            "site_description_km": "CambodiaJobs គឺជាវេទិកាស្វែងរកការងារ និងជ្រើសរើសបុគ្គលិកឈានមុខគេនៅកម្ពុជា ដែលតភ្ជាប់និយោជកដែលមានការផ្ទៀងផ្ទាត់ជាមួយអ្នកជំនាញឆ្នើមនៅរាជធានីភ្នំពេញ និងគ្រប់ខេត្តក្រុង។",
            "logo_url": None,
            "favicon_url": None,
            "hero_title": "Discover Verified Career Opportunities in Cambodia",
            "hero_title_km": "ស្វែងរកឱកាសការងារដែលបានផ្ទៀងផ្ទាត់នៅកម្ពុជា",
            "hero_subtitle": "Connecting talented professionals with top verified companies across Phnom Penh and all 25 provinces. Real salary data and direct hiring.",
            "hero_subtitle_km": "តភ្ជាប់បេក្ខជនឆ្នើមជាមួយក្រុមហ៊ុនដែលបានផ្ទៀងផ្ទាត់នៅរាជធានីភ្នំពេញ និងគ្រប់ខេត្តក្រុង។ ទិន្នន័យប្រាក់ខែជាក់ស្តែង និងការដាក់ពាក្យផ្ទាល់។",
            "hero_badge_text": "🇰🇭 #1 Job Platform in Cambodia",
            "hero_badge_text_km": "🇰🇭 វេទិកាការងារលេខ ១ នៅកម្ពុជា",
            "contact_email": "support@cambodiajobs.kh",
            "contact_phone": "+855 23 999 888",
            "contact_address": "Phnom Penh, Cambodia",
            "contact_address_km": "រាជធានីភ្នំពេញ, ប្រទេសកម្ពុជា",
            "footer_text": "Connecting ambitious professionals with reputable employers across Cambodia since 2026.",
            "footer_text_km": "តភ្ជាប់អ្នកជំនាញដែលមានទេពកោសល្យជាមួយនិយោជកដែលគួរឱ្យទុកចិត្តទូទាំងប្រទេសកម្ពុជា។",
            "social_facebook": "https://facebook.com",
            "social_telegram": "https://t.me/CambodiaJobSupportBot",
            "social_linkedin": "https://linkedin.com",
            "social_twitter": "",
            "announcement_enabled": False,
            "announcement_text": "",
            "announcement_text_km": "",
            "announcement_url": "",
        }
    settings_row["announcement_enabled"] = bool(settings_row.get("announcement_enabled"))
    return settings_row


class PublicSiteSettingsView(APIView):
    """Public endpoint to fetch active site settings for Navbar, Footer, SEO, and Home page."""
    permission_classes = [AllowAny]

    def get(self, request):
        data = get_site_settings_dict()
        return Response({"success": True, "data": data})


class AdminSiteSettingsView(APIView):
    """Admin endpoint to retrieve and update website branding, hero content, and metadata."""
    permission_classes = [HasCustomPermission.with_perm("settings:manage")]

    def get(self, request):
        data = get_site_settings_dict()
        return Response({"success": True, "data": data})

    def put(self, request):
        return self.patch(request)

    def patch(self, request):
        allowed_keys = [
            "site_name", "site_name_km", "site_title", "site_title_km",
            "site_subtitle", "site_subtitle_km", "site_description", "site_description_km",
            "logo_url", "favicon_url", "hero_title", "hero_title_km",
            "hero_subtitle", "hero_subtitle_km", "hero_badge_text", "hero_badge_text_km",
            "contact_email", "contact_phone", "contact_address", "contact_address_km",
            "footer_text", "footer_text_km", "social_facebook", "social_telegram",
            "social_linkedin", "social_twitter", "announcement_enabled",
            "announcement_text", "announcement_text_km", "announcement_url",
        ]

        # Make sure row 1 exists
        existing = fetch_one("SELECT id FROM site_settings WHERE id = 1")
        if not existing:
            execute_sql("INSERT INTO site_settings (id) VALUES (1)")

        fields = []
        params = []
        updated_keys = []

        for key in allowed_keys:
            if key in request.data:
                val = request.data[key]
                if key == "announcement_enabled":
                    val = 1 if val else 0
                fields.append(f"`{key}` = %s")
                params.append(val)
                updated_keys.append(key)

        if fields:
            sql = f"UPDATE site_settings SET {', '.join(fields)} WHERE id = 1"
            execute_sql(sql, params)

            # Record in audit log
            execute_insert(
                "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (%s, 'update_site_settings', 'settings', 1, %s)",
                [request.user.id, json.dumps({"updated_keys": updated_keys})],
            )

        updated_data = get_site_settings_dict()
        return Response({
            "success": True,
            "data": updated_data,
            "message": "Website settings updated successfully."
        })


class AdminSiteSettingsUploadLogoView(APIView):
    """Admin endpoint to upload website logo or favicon."""
    permission_classes = [HasCustomPermission.with_perm("settings:manage")]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded_file = (
            request.FILES.get("file")
            or request.FILES.get("image")
            or request.FILES.get("logo")
            or request.FILES.get("favicon")
        )
        if not uploaded_file:
            raise ValidationError({"file": "No image file provided."})

        allowed_exts = [".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif", ".ico"]
        file_ext = os.path.splitext(uploaded_file.name)[1].lower()
        if file_ext not in allowed_exts:
            raise ValidationError({"file": f"Unsupported format. Allowed formats: {', '.join(allowed_exts)}"})

        if uploaded_file.size > 5 * 1024 * 1024:
            raise ValidationError({"file": "File size must not exceed 5MB."})

        upload_dir = settings.MEDIA_ROOT / "site"
        os.makedirs(upload_dir, exist_ok=True)

        upload_type = request.data.get("type", "logo")
        prefix = "favicon" if upload_type == "favicon" else "logo"
        clean_name = re.sub(r"[^a-zA-Z0-9_\.-]", "_", uploaded_file.name)
        saved_filename = f"{prefix}_{int(time.time())}_{clean_name}"
        file_dest = upload_dir / saved_filename

        with open(file_dest, "wb+") as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)

        file_url = f"/media/site/{saved_filename}"

        # Make sure the singleton settings row exists, otherwise the UPDATE
        # below silently affects 0 rows and the URL is never saved.
        existing = fetch_one("SELECT id FROM site_settings WHERE id = 1")
        if not existing:
            execute_insert("INSERT INTO site_settings (id) VALUES (1)")

        # Update database directly
        target_column = "favicon_url" if upload_type == "favicon" else "logo_url"
        execute_sql(f"UPDATE site_settings SET `{target_column}` = %s WHERE id = 1", [file_url])

        execute_insert(
            "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (%s, 'upload_site_logo', 'settings', 1, %s)",
            [request.user.id, json.dumps({"file_url": file_url, "type": upload_type})],
        )

        return Response({
            "success": True,
            "url": file_url,
            "filename": saved_filename,
            "message": f"Website {upload_type} uploaded and updated successfully."
        })


SYSTEM_PERMISSIONS_CATALOG = [
    {
        "category": "Administration & Security",
        "categoryKm": "ការគ្រប់គ្រងប្រព័ន្ធ & សុវត្ថិភាព",
        "permissions": [
            {"key": "admin:access", "name": "Admin Console Access", "nameKm": "ចូលប្រើផ្ទាំង Admin", "description": "Access admin console overview and core tools", "descriptionKm": "ចូលប្រើផ្ទាំងគ្រប់គ្រង Admin និងស្ថិតិរួម"},
            {"key": "users:manage", "name": "Manage Users & Accounts", "nameKm": "គ្រប់គ្រងអ្នកប្រើប្រាស់ & គណនី", "description": "Create, edit, suspend, and assign roles to users", "descriptionKm": "បង្កើត កែប្រែ ផ្អាក និងកំណត់តួនាទី/សិទ្ធិអ្នកប្រើប្រាស់"},
            {"key": "categories:manage", "name": "Manage Job Categories", "nameKm": "គ្រប់គ្រងផ្នែកការងារ", "description": "Create, edit, and organize job industries and categories", "descriptionKm": "បង្កើត កែប្រែ និងរៀបចំប្រភេទផ្នែកការងារ"},
            {"key": "companies:verify", "name": "Verify Companies", "nameKm": "ផ្ទៀងផ្ទាត់ក្រុមហ៊ុន", "description": "Review and approve/reject business profiles", "descriptionKm": "ត្រួតពិនិត្យ និងអនុម័ត ឬបដិសេធក្រុមហ៊ុន"},
            {"key": "jobs:moderate", "name": "Moderate Vacancies", "nameKm": "ត្រួតពិនិត្យការងារ", "description": "Approve, feature, pause, or remove job listings", "descriptionKm": "ត្រួតពិនិត្យ កែប្រែ និងអនុម័តការផ្សាយការងារ"},
            {"key": "audit:view", "name": "View Audit Logs", "nameKm": "មើលកំណត់ត្រាប្រព័ន្ធ", "description": "Inspect administrative actions and system security logs", "descriptionKm": "មើលកំណត់ហេតុសកម្មភាព និងសុវត្ថិភាពប្រព័ន្ធ"},
            {"key": "settings:manage", "name": "Platform Settings", "nameKm": "ការកំណត់ប្រព័ន្ធ", "description": "Manage branding, SEO, contact info, and website settings", "descriptionKm": "គ្រប់គ្រងម៉ាកយីហោ SEO ព័ត៌មានទំនាក់ទំនង និងការកំណត់គេហទំព័រ"},
        ]
    },
    {
        "category": "Employer & Vacancy Management",
        "categoryKm": "និយោជក & ការគ្រប់គ្រងការងារ",
        "permissions": [
            {"key": "employer:access", "name": "Employer Workspace Access", "nameKm": "ចូលប្រើផ្ទាំងនិយោជក", "description": "Access employer recruitment workspace", "descriptionKm": "ចូលប្រើផ្ទាំងការងារជ្រើសរើសបុគ្គលិករបស់ក្រុមហ៊ុន"},
            {"key": "jobs:create", "name": "Post Vacancies", "nameKm": "ចុះផ្សាយការងារថ្មី", "description": "Create new job postings on the portal", "descriptionKm": "បង្កើត និងចុះផ្សាយឱកាសការងារថ្មី (រួមទាំង AI)"},
            {"key": "jobs:edit", "name": "Edit Vacancies", "nameKm": "កែសម្រួលការងារ", "description": "Modify details and requirements of job postings", "descriptionKm": "កែសម្រួលព័ត៌មាន និងប្តូរស្ថានភាពការងារ"},
            {"key": "jobs:delete", "name": "Delete/Close Vacancies", "nameKm": "លុប/បិទការងារ", "description": "Delete or permanently close vacancies", "descriptionKm": "លុប ឬបិទការងារដែលបានផ្សាយចោលជាអចិន្ត្រៃយ៍"},
            {"key": "applications:view", "name": "View Applications", "nameKm": "មើលបេក្ខជនដាក់ពាក្យ", "description": "View incoming candidate resumes and submissions", "descriptionKm": "មើលបញ្ជីបេក្ខជន CV និងព័ត៌មានដាក់ពាក្យ"},
            {"key": "applications:review", "name": "Review & Process Candidates", "nameKm": "វាយតម្លៃ & ដំណើរការបេក្ខជន", "description": "Shortlist, reject, hire, and schedule interviews", "descriptionKm": "ប្តូរស្ថានភាពបេក្ខជន សម្រាំង ណាត់សម្ភាសន៍ និងផ្តល់ការងារ"},
            {"key": "company:manage", "name": "Manage Company Profile", "nameKm": "គ្រប់គ្រងព័ត៌មានក្រុមហ៊ុន", "description": "Edit organization profile, branding, and details", "descriptionKm": "កែប្រែព័ត៌មានក្រុមហ៊ុន និងគ្រប់គ្រងសមាជិកក្រុមការងារ"},
        ]
    },
    {
        "category": "Candidate & Seeker Services",
        "categoryKm": "សេវាបេក្ខជន & អ្នកស្វែងរកការងារ",
        "permissions": [
            {"key": "seeker:access", "name": "Seeker Workspace Access", "nameKm": "ចូលប្រើផ្ទាំងបេក្ខជន", "description": "Access candidate portal and dashboard", "descriptionKm": "ចូលប្រើផ្ទាំងគ្រប់គ្រងសម្រាប់អ្នកស្វែងរកការងារ"},
            {"key": "profile:manage", "name": "Manage Candidate Profile", "nameKm": "គ្រប់គ្រងប្រវត្តិរូបផ្ទាល់ខ្លួន", "description": "Update work experience, education, and skills", "descriptionKm": "ធ្វើបច្ចុប្បន្នភាពបទពិសោធន៍ ការសិក្សា និងជំនាញ"},
            {"key": "resumes:manage", "name": "Manage Resumes & CVs", "nameKm": "គ្រប់គ្រង CV & ឯកសារ", "description": "Upload, create, print, and download CVs", "descriptionKm": "ផ្ទុកឡើង បង្កើត បោះពុម្ព និងទាញយកប្រវត្តិរូប CV"},
            {"key": "jobs:apply", "name": "Apply for Vacancies", "nameKm": "ដាក់ពាក្យសុំការងារ", "description": "Submit applications and cover letters to employers", "descriptionKm": "ដាក់ពាក្យ និងលិខិតអមទៅកាន់ក្រុមហ៊ុន"},
            {"key": "jobs:save", "name": "Bookmark Vacancies", "nameKm": "រក្សាទុកការងារ", "description": "Save favorite job postings to wishlist", "descriptionKm": "កត់ចំណាំរក្សាទុកការងារដែលចាប់អារម្មណ៍"},
        ]
    },
    {
        "category": "System & Notifications",
        "categoryKm": "ប្រព័ន្ធ & ការជូនដំណឹង",
        "permissions": [
            {"key": "notifications:view", "name": "Receive Notifications", "nameKm": "ទទួលការជូនដំណឹង", "description": "View system notifications and real-time updates", "descriptionKm": "ទទួល និងមើលការជូនដំណឹងភ្លាមៗក្នុងប្រព័ន្ធ"},
        ]
    }
]


class AdminRolesPermissionsView(APIView):
    permission_classes = [HasCustomPermission.with_perm("users:manage")]

    def get(self, request):
        roles = fetch_all("SELECT id, name, description FROM roles ORDER BY id ASC")
        for r in roles:
            r["user_count"] = fetch_scalar(
                "SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE role_id = %s",
                [r["id"]]
            ) or 0
            perms = fetch_all(
                "SELECT permission FROM role_permissions WHERE role_id = %s ORDER BY permission ASC",
                [r["id"]]
            )
            r["permissions"] = [p["permission"] for p in perms]

        return Response({
            "success": True,
            "data": {
                "roles": roles,
                "catalog": SYSTEM_PERMISSIONS_CATALOG,
            }
        })

    def post(self, request):
        raw_name = (request.data.get("name") or "").strip().lower()
        name = re.sub(r"[^a-z0-9_]+", "_", raw_name).strip("_")
        description = (request.data.get("description") or "").strip()
        permissions = request.data.get("permissions", [])

        if not name:
            raise ValidationError({"name": "Role name is required (letters, numbers, underscores)."})

        exists = fetch_scalar("SELECT COUNT(*) FROM roles WHERE name = %s", [name])
        if exists:
            raise ValidationError({"name": "A role with this name already exists."})

        role_id = execute_insert(
            "INSERT INTO roles (name, description) VALUES (%s, %s)",
            [name, description]
        )

        if isinstance(permissions, list):
            for p in set(permissions):
                if p and isinstance(p, str):
                    execute_insert("INSERT INTO role_permissions (role_id, permission) VALUES (%s, %s)", [role_id, p.strip()])

        execute_insert(
            "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (%s, %s, 'role', %s, %s)",
            [request.user.id, "create_role", role_id, json.dumps({"name": name, "permissions": permissions})],
        )

        return Response({"success": True, "message": "Role created successfully.", "role_id": role_id}, status=status.HTTP_201_CREATED)


class AdminRolesPermissionsDetailView(APIView):
    permission_classes = [HasCustomPermission.with_perm("users:manage")]

    def put(self, request, pk):
        role = fetch_one("SELECT id, name, description FROM roles WHERE id = %s", [pk])
        if not role:
            raise NotFound("Role not found.")

        data = request.data
        description = data.get("description", role["description"])
        execute_sql("UPDATE roles SET description = %s WHERE id = %s", [description, pk])

        if "permissions" in data:
            permissions = data.get("permissions")
            if isinstance(permissions, list):
                execute_sql("DELETE FROM role_permissions WHERE role_id = %s", [pk])
                for p in set(permissions):
                    if p and isinstance(p, str):
                        execute_insert("INSERT INTO role_permissions (role_id, permission) VALUES (%s, %s)", [pk, p.strip()])

        execute_insert(
            "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (%s, %s, 'role', %s, %s)",
            [request.user.id, "update_role_permissions", pk, json.dumps({"role": role["name"], "permissions": data.get("permissions")})],
        )

        return Response({"success": True, "message": "Role permissions updated successfully."})

    def delete(self, request, pk):
        role = fetch_one("SELECT id, name FROM roles WHERE id = %s", [pk])
        if not role:
            raise NotFound("Role not found.")

        if role["id"] in (1, 2, 3) or role["name"] in ("admin", "employer", "job_seeker", "super_admin"):
            raise ValidationError({"detail": "Core platform roles cannot be deleted."})

        assigned_count = fetch_scalar("SELECT COUNT(*) FROM user_roles WHERE role_id = %s", [pk]) or 0
        if assigned_count > 0:
            raise ValidationError({"detail": f"Cannot delete role '{role['name']}' while {assigned_count} user(s) are assigned to it. Reassign those users first."})

        execute_sql("DELETE FROM role_permissions WHERE role_id = %s", [pk])
        execute_sql("DELETE FROM roles WHERE id = %s", [pk])

        execute_insert(
            "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (%s, %s, 'role', %s, %s)",
            [request.user.id, "delete_role", pk, json.dumps({"role": role["name"]})],
        )

        return Response({"success": True, "message": f"Role '{role['name']}' deleted successfully."})


class AdminApplicationsView(APIView):
    """
    Allows Platform Admins to view all job seeker applications across any company and job vacancy.
    Supports optional filters: ?company_id=, ?job_id=, ?status=, ?q=
    """
    permission_classes = [HasCustomPermission.with_perm("admin:access")]

    def get(self, request):
        company_id = request.query_params.get("company_id")
        job_id = request.query_params.get("job_id")
        status_filter = request.query_params.get("status")
        q = (request.query_params.get("q") or "").strip()

        where_clauses = []
        params = []

        if company_id and str(company_id).isdigit():
            where_clauses.append("c.id = %s")
            params.append(int(company_id))

        if job_id and str(job_id).isdigit():
            where_clauses.append("j.id = %s")
            params.append(int(job_id))

        if status_filter and status_filter != "all":
            if status_filter in ("reviewing", "screening"):
                where_clauses.append("a.status IN ('reviewing', 'screening')")
            elif status_filter in ("interview", "interview_scheduled"):
                where_clauses.append("a.status IN ('interview', 'interview_scheduled')")
            else:
                where_clauses.append("a.status = %s")
                params.append(status_filter)

        if q:
            like = f"%{q}%"
            where_clauses.append(
                "(u.full_name LIKE %s OR u.email LIKE %s OR j.title LIKE %s OR c.name LIKE %s)"
            )
            params.extend([like, like, like, like])

        where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

        sql = f"""
            SELECT
                a.id, a.job_id, a.seeker_id, a.resume_id, a.cover_letter, a.status, a.created_at,
                u.full_name AS applicant_name, u.email AS applicant_email, u.phone_number AS applicant_phone,
                sp.headline AS applicant_headline, sp.summary AS applicant_summary, sp.avatar_url AS applicant_avatar,
                sp.province AS applicant_province, sp.city AS applicant_city, sp.expected_salary, sp.salary_currency,
                r.title AS resume_title, r.file_path AS resume_path,
                j.title AS job_title, j.title_km AS job_title_km, j.slug AS job_slug,
                c.id AS company_id, c.name AS company_name, c.logo_url AS company_logo,
                c.verification_status AS company_verification
            FROM applications a
            INNER JOIN seeker_profiles sp ON sp.id = a.seeker_id
            INNER JOIN users u ON u.id = sp.user_id
            INNER JOIN jobs j ON j.id = a.job_id
            INNER JOIN companies c ON c.id = j.company_id
            LEFT JOIN resumes r ON r.id = a.resume_id
            {where_sql}
            ORDER BY a.created_at DESC, a.id DESC
        """
        applications = fetch_all(sql, params)

        for app in applications:
            app["interview"] = fetch_one(
                "SELECT id, scheduled_at, location_or_link, interview_type, notes, status FROM interviews WHERE application_id = %s ORDER BY id DESC LIMIT 1",
                [app["id"]],
            )
            app["skills"] = fetch_all(
                """
                SELECT s.name AS skill_name, s.name, ss.proficiency_level
                FROM seeker_skills ss
                INNER JOIN skills s ON s.id = ss.skill_id
                WHERE ss.seeker_id = %s
                ORDER BY s.name ASC
                """,
                [app["seeker_id"]],
            )
            app["educations"] = fetch_all(
                """
                SELECT institution AS school, institution, degree, field_of_study, start_date, end_date
                FROM educations
                WHERE seeker_id = %s
                ORDER BY start_date DESC LIMIT 3
                """,
                [app["seeker_id"]],
            )
            app["experiences"] = fetch_all(
                "SELECT company_name, job_title, start_date, end_date, is_current FROM work_experiences WHERE seeker_id = %s ORDER BY start_date DESC LIMIT 3",
                [app["seeker_id"]],
            )

        companies = fetch_all("SELECT id, name FROM companies ORDER BY name ASC")
        jobs = fetch_all("SELECT id, title, company_id FROM jobs ORDER BY created_at DESC")

        return Response({
            "success": True,
            "data": {
                "applications": applications,
                "companies": companies,
                "jobs": jobs,
            },
        })



