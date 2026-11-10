"""
Raw SQL Database Layer for Cambodia Job Search & Recruitment Platform.
All application database interactions go through this layer using Django's database connection
and cursor interfaces. No Django ORM models are used.
"""

import logging
from django.db import connection, transaction

logger = logging.getLogger(__name__)


def fetch_one(sql: str, params=None) -> dict | None:
    """
    Execute a parameterized SQL query and return a single row as a dictionary.
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, params or [])
        if cursor.description is None:
            return None
        row = cursor.fetchone()
        if row is None:
            return None
        columns = [col[0] for col in cursor.description]
        return dict(zip(columns, row))


def fetch_all(sql: str, params=None) -> list[dict]:
    """
    Execute a parameterized SQL query and return all matching rows as dictionaries.
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, params or [])
        if cursor.description is None:
            return []
        columns = [col[0] for col in cursor.description]
        rows = cursor.fetchall()
        return [dict(zip(columns, row)) for row in rows]


def fetch_scalar(sql: str, params=None):
    """
    Execute a parameterized SQL query and return the first column of the first row (e.g., COUNT(*)).
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, params or [])
        row = cursor.fetchone()
        if row is None:
            return None
        return row[0]


def execute_sql(sql: str, params=None) -> int:
    """
    Execute an INSERT, UPDATE, or DELETE SQL statement and return affected row count.
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, params or [])
        return cursor.rowcount


def execute_insert(sql: str, params=None) -> int:
    """
    Execute an INSERT statement and return the generated lastrowid.
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, params or [])
        return cursor.lastrowid


def atomic_transaction():
    """
    Context manager for atomic database transactions.
    """
    return transaction.atomic()

