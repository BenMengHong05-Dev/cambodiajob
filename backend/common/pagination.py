"""
Pagination utilities for raw SQL queries.
"""

from rest_framework.response import Response
from common.database import fetch_all, fetch_scalar


def paginate_raw_query(
    base_select_sql: str,
    base_count_sql: str,
    where_clauses: list[str],
    params: list,
    request,
    allowed_sort_fields: dict[str, str] | None = None,
    default_sort: str = "id DESC",
    default_page_size: int = 10,
    max_page_size: int = 100,
) -> dict:
    """
    Executes a paginated raw SQL query with safe sorting, filtering, and counting.

    :param base_select_sql: SELECT clause and FROM clause without WHERE, ORDER, LIMIT
    :param base_count_sql: SELECT COUNT(*) and FROM clause without WHERE
    :param where_clauses: list of SQL expressions like ["status = %s", "province = %s"]
    :param params: list of parameters matching placeholders in where_clauses
    :param request: Django HTTP request object to extract page, page_size, sort
    :param allowed_sort_fields: mapping of allowed frontend sort keys to safe SQL expressions
    :param default_sort: default SQL ORDER BY clause
    """
    # 1. Page and Page Size validation
    try:
        page = int(request.query_params.get("page", 1))
        if page < 1:
            page = 1
    except (ValueError, TypeError):
        page = 1

    try:
        page_size = int(request.query_params.get("page_size", default_page_size))
        if page_size < 1:
            page_size = default_page_size
        elif page_size > max_page_size:
            page_size = max_page_size
    except (ValueError, TypeError):
        page_size = default_page_size

    offset = (page - 1) * page_size

    # 2. Construct WHERE condition
    where_sql = ""
    if where_clauses:
        where_sql = " WHERE " + " AND ".join(where_clauses)

    # 3. Safe Sorting
    order_by_sql = f" ORDER BY {default_sort}"
    sort_param = request.query_params.get("sort")
    if sort_param and allowed_sort_fields and sort_param in allowed_sort_fields:
        order_by_sql = f" ORDER BY {allowed_sort_fields[sort_param]}"

    # 4. Fetch total count
    count_sql = f"{base_count_sql}{where_sql}"
    total = fetch_scalar(count_sql, list(params)) or 0

    # 5. Fetch page items
    # Note: LIMIT and OFFSET are validated integers, safe for formatting or parameterizing
    query_sql = f"{base_select_sql}{where_sql}{order_by_sql} LIMIT %s OFFSET %s"
    query_params = list(params) + [page_size, offset]
    results = fetch_all(query_sql, query_params)

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "count": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "next": page + 1 if page < total_pages else None,
        "previous": page - 1 if page > 1 else None,
        "results": results,
    }


class StandardRawSQLPagination:
    """
    Helper for views using raw SQL.
    """
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100

