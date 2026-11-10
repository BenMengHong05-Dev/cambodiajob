"""
Input validators and sanitation utilities for Raw SQL queries.
"""

import re
import unicodedata


def slugify_string(text: str) -> str:
    """
    Generate URL-friendly slug supporting Khmer and English text.
    """
    text = text.strip().lower()
    # Replace spaces with hyphens
    text = re.sub(r"[\s_]+", "-", text)
    # Remove non-word characters except hyphens and unicode words
    text = re.sub(r"[^\w\-]+", "", text, flags=re.UNICODE)
    # Deduplicate hyphens
    text = re.sub(r"-{2,}", "-", text)
    return text.strip("-")


def validate_whitelist_field(field_name: str, allowed_fields: dict[str, str], default: str) -> str:
    """
    Validate and return the SQL column mapped to a field name.
    """
    if not field_name:
        return default
    return allowed_fields.get(field_name, default)

