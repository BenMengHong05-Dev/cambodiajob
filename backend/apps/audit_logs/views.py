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

from common.permissions import IsAdmin
from common.database import fetch_one, fetch_all, fetch_scalar, execute_sql, execute_insert


class AdminDashboardView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
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
            "total_applications": fetch_scalar("SELECT COUNT(*) FROM applications") or 0,
            "total_categories": fetch_scalar("SELECT COUNT(*) FROM job_categories") or 0,
        }

        recent_applications = fetch_all(
            """
            SELECT a.id, a.status, a.created_at, j.title as job_title, u.full_name as applicant_name, c.name as company_name
            FROM applications a
            INNER JOIN jobs j ON j.id = a.job_id
            INNER JOIN companies c ON c.id = j.company_id
            INNER JOIN seeker_profiles sp ON sp.id = a.seeker_id
            INNER JOIN users u ON u.id = sp.user_id
            ORDER BY a.created_at DESC
            LIMIT 5
            """
        )

        recent_companies = fetch_all(
            """
            SELECT id, name, industry, province, verification_status, created_at
            FROM companies
            ORDER BY created_at DESC
            LIMIT 5
            """
        )

        pending_jobs = fetch_all(
            """
            SELECT j.id, j.title, j.employment_type, j.workplace_type, j.created_at, c.name as company_name
            FROM jobs j
            INNER JOIN companies c ON c.id = j.company_id
            WHERE j.moderation_status = 'pending'
            ORDER BY j.created_at DESC
            LIMIT 5
            """
        )

        pending_companies = fetch_all(
            """
            SELECT id, name, industry, province, verification_status, created_at
            FROM companies
            WHERE verification_status = 'pending'
            ORDER BY created_at DESC
            LIMIT 5
            """
        )

        recent_audit_logs = fetch_all(
            """
            SELECT al.id, al.action, al.entity_type, al.entity_id, al.created_at, u.full_name as user_name, u.email as user_email
            FROM audit_logs al
            LEFT JOIN users u ON u.id = al.user_id
            ORDER BY al.created_at DESC
            LIMIT 5
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
    permission_classes = [IsAdmin]

    def get(self, request):
        sql = """
            SELECT 
                u.id, u.email, u.full_name, u.phone_number, u.is_active, u.created_at,
                GROUP_CONCAT(r.name) as role_names
            FROM users u
            LEFT JOIN user_roles ur ON ur.user_id = u.id
            LEFT JOIN roles r ON r.id = ur.role_id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        """
        users = fetch_all(sql)
        for u in users:
            roles_list = [r.strip() for r in (u["role_names"] or "").split(",") if r.strip()]
            u["roles"] = roles_list
            u["role"] = roles_list[0] if len(roles_list) > 0 else "job_seeker"
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

        return Response({"success": True, "user_id": user_id, "message": "User created successfully."}, status=status.HTTP_201_CREATED)


class AdminUserDetailView(APIView):
    permission_classes = [IsAdmin]

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
    permission_classes = [IsAdmin]

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
    permission_classes = [IsAdmin]

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
    permission_classes = [IsAdmin]

    def get(self, request):
        sql = """
            SELECT 
                c.id, c.name, c.slug, c.logo_url, c.banner_url, c.description, c.website,
                c.industry, c.company_size, c.province, c.city, c.address, c.verification_status,
                c.verified_at, c.created_at, u.full_name as owner_name, u.email as owner_email,
                (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id) as jobs_count
            FROM companies c
            LEFT JOIN users u ON u.id = c.created_by
            ORDER BY c.created_at DESC
        """
        companies = fetch_all(sql)
        return Response({"success": True, "data": companies})


class AdminCompanyDetailView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        company = fetch_one(
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
    permission_classes = [IsAdmin]

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


class AdminJobsModerationView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        sql = """
            SELECT 
                j.id, j.title, j.title_km, j.slug, j.province, j.city, j.salary_min, j.salary_max,
                j.salary_currency, j.is_salary_negotiable, j.employment_type, j.workplace_type,
                j.status, j.moderation_status, j.created_at,
                c.name as company_name, c.slug as company_slug, c.logo_url as company_logo,
                (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as applications_count
            FROM jobs j
            INNER JOIN companies c ON c.id = j.company_id
            ORDER BY j.created_at DESC
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


class AdminAuditLogsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        sql = """
            SELECT 
                al.id, al.action, al.entity_type, al.entity_id, al.details, al.created_at,
                u.full_name as user_name, u.email as user_email
            FROM audit_logs al
            LEFT JOIN users u ON u.id = al.user_id
            ORDER BY al.created_at DESC
            LIMIT 100
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
            "site_title": "Cambodia's Leading Job & Recruitment Platform",
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
    permission_classes = [IsAdmin]

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
    permission_classes = [IsAdmin]
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


