import re
import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import NotFound, ValidationError

from common.permissions import HasCustomPermission
from common.database import fetch_all, fetch_one, execute_insert, execute_sql, atomic_transaction
from .serializers import JobCategoryCreateUpdateSerializer


def generate_unique_slug(name_en: str, current_id: int = None) -> str:
    base_slug = re.sub(r'[^a-z0-9]+', '-', name_en.strip().lower()).strip('-')
    if not base_slug:
        base_slug = "category"
    slug = base_slug
    counter = 1
    while True:
        if current_id:
            existing = fetch_one("SELECT id FROM job_categories WHERE slug = %s AND id != %s", [slug, current_id])
        else:
            existing = fetch_one("SELECT id FROM job_categories WHERE slug = %s", [slug])
        if not existing:
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1


class CategoryListView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [HasCustomPermission.with_perm("categories:manage")()]
        return [AllowAny()]

    def get(self, request):
        has_jobs = request.query_params.get("has_jobs", "").lower() in ["true", "1"]
        having_clause = "HAVING COUNT(j.id) > 0" if has_jobs else ""

        sql = f"""
            SELECT 
                c.id, 
                c.name_en, 
                c.name_km, 
                c.slug, 
                c.icon,
                COUNT(j.id) AS jobs_count
            FROM job_categories c
            LEFT JOIN jobs j ON j.category_id = c.id 
                AND j.status = 'published' 
                AND j.moderation_status = 'approved'
            GROUP BY c.id, c.name_en, c.name_km, c.slug, c.icon
            {having_clause}
            ORDER BY jobs_count DESC, c.name_en ASC
        """
        categories = fetch_all(sql)
        return Response({
            "success": True,
            "data": categories,
        })

    def post(self, request):
        serializer = JobCategoryCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        name_en = data["name_en"]
        name_km = data["name_km"]
        provided_slug = data.get("slug")
        icon = data.get("icon") or "briefcase"

        if provided_slug:
            existing = fetch_one("SELECT id FROM job_categories WHERE slug = %s", [provided_slug])
            if existing:
                raise ValidationError({"slug": "This slug is already in use by another category."})
            slug = provided_slug
        else:
            slug = generate_unique_slug(name_en)

        with atomic_transaction():
            cat_id = execute_insert(
                """
                INSERT INTO job_categories (name_en, name_km, slug, icon)
                VALUES (%s, %s, %s, %s)
                """,
                [name_en, name_km, slug, icon],
            )
            # Record audit log
            try:
                execute_insert(
                    """
                    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                    VALUES (%s, 'create_category', 'job_category', %s, %s)
                    """,
                    [request.user.id, cat_id, json.dumps({"name_en": name_en, "name_km": name_km, "slug": slug})],
                )
            except Exception as e:
                print(f"[Audit Log Warning]: {e}")

        new_cat = fetch_one(
            """
            SELECT c.id, c.name_en, c.name_km, c.slug, c.icon, 0 AS jobs_count
            FROM job_categories c
            WHERE c.id = %s
            """,
            [cat_id],
        )

        return Response(
            {
                "success": True,
                "message": "Job category created successfully.",
                "data": new_cat,
            },
            status=status.HTTP_201_CREATED,
        )


class CategoryDetailView(APIView):
    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            return [HasCustomPermission.with_perm("categories:manage")()]
        return [AllowAny()]

    def get(self, request, pk):
        cat = fetch_one(
            """
            SELECT c.id, c.name_en, c.name_km, c.slug, c.icon, COUNT(j.id) as jobs_count
            FROM job_categories c
            LEFT JOIN jobs j ON j.category_id = c.id AND j.status = 'published' AND j.moderation_status = 'approved'
            WHERE c.id = %s
            GROUP BY c.id, c.name_en, c.name_km, c.slug, c.icon
            """,
            [pk],
        )
        if not cat:
            raise NotFound("Job category not found.")
        return Response({"success": True, "data": cat})

    def patch(self, request, pk):
        return self.put(request, pk)

    def put(self, request, pk):
        cat = fetch_one("SELECT id, name_en, name_km, slug, icon FROM job_categories WHERE id = %s", [pk])
        if not cat:
            raise NotFound("Job category not found.")

        serializer = JobCategoryCreateUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        name_en = data.get("name_en") or cat["name_en"]
        name_km = data.get("name_km") or cat["name_km"]
        icon = data.get("icon") if "icon" in data else cat["icon"]
        
        provided_slug = data.get("slug")
        if provided_slug:
            existing = fetch_one("SELECT id FROM job_categories WHERE slug = %s AND id != %s", [provided_slug, pk])
            if existing:
                raise ValidationError({"slug": "This slug is already in use by another category."})
            slug = provided_slug
        else:
            slug = cat["slug"]

        with atomic_transaction():
            execute_sql(
                """
                UPDATE job_categories 
                SET name_en = %s, name_km = %s, slug = %s, icon = %s
                WHERE id = %s
                """,
                [name_en, name_km, slug, icon, pk],
            )
            try:
                execute_insert(
                    """
                    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                    VALUES (%s, 'update_category', 'job_category', %s, %s)
                    """,
                    [request.user.id, pk, json.dumps({"name_en": name_en, "name_km": name_km, "slug": slug})],
                )
            except Exception as e:
                print(f"[Audit Log Warning]: {e}")

        updated_cat = fetch_one(
            """
            SELECT c.id, c.name_en, c.name_km, c.slug, c.icon, COUNT(j.id) as jobs_count
            FROM job_categories c
            LEFT JOIN jobs j ON j.category_id = c.id AND j.status = 'published' AND j.moderation_status = 'approved'
            WHERE c.id = %s
            GROUP BY c.id, c.name_en, c.name_km, c.slug, c.icon
            """,
            [pk],
        )

        return Response({
            "success": True,
            "message": "Job category updated successfully.",
            "data": updated_cat,
        })

    def delete(self, request, pk):
        cat = fetch_one("SELECT id, name_en, slug FROM job_categories WHERE id = %s", [pk])
        if not cat:
            raise NotFound("Job category not found.")

        # Check job count
        jobs_count = fetch_one("SELECT COUNT(*) AS count FROM jobs WHERE category_id = %s", [pk])["count"]

        with atomic_transaction():
            # Update jobs with this category to NULL safely
            execute_sql("UPDATE jobs SET category_id = NULL WHERE category_id = %s", [pk])
            execute_sql("DELETE FROM job_categories WHERE id = %s", [pk])
            try:
                execute_insert(
                    """
                    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                    VALUES (%s, 'delete_category', 'job_category', %s, %s)
                    """,
                    [request.user.id, pk, json.dumps({"name_en": cat["name_en"], "slug": cat["slug"], "unlinked_jobs": jobs_count})],
                )
            except Exception as e:
                print(f"[Audit Log Warning]: {e}")

        return Response({
            "success": True,
            "message": f"Job category '{cat['name_en']}' deleted successfully. {jobs_count} job(s) unlinked.",
        })
