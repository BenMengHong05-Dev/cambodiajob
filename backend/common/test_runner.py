from pathlib import Path
from django.test.runner import DiscoverRunner
from django.db import connection


class RawSQLTestRunner(DiscoverRunner):
    """
    Test runner that executes manual SQL schema and seed scripts
    into the test database, since no Django ORM migrations exist.
    """
    def setup_databases(self, **kwargs):
        result = super().setup_databases(**kwargs)
        base_dir = Path(__file__).resolve().parent.parent

        with connection.cursor() as cursor:
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")

            # 1. Apply Schema
            schema_file = base_dir / "sql" / "schema.sql"
            if schema_file.exists():
                with open(schema_file, "r", encoding="utf-8") as f:
                    for statement in f.read().split(";"):
                        stmt = statement.strip()
                        if stmt:
                            cursor.execute(stmt)

            # 2. Apply Indexes
            indexes_file = base_dir / "sql" / "indexes.sql"
            if indexes_file.exists():
                with open(indexes_file, "r", encoding="utf-8") as f:
                    for statement in f.read().split(";"):
                        stmt = statement.strip()
                        if stmt:
                            try:
                                cursor.execute(stmt)
                            except Exception:
                                pass

            # 3. Apply Seed Data
            seed_file = base_dir / "sql" / "seed.sql"
            if seed_file.exists():
                with open(seed_file, "r", encoding="utf-8") as f:
                    for statement in f.read().split(";"):
                        stmt = statement.strip()
                        if stmt:
                            cursor.execute(stmt)

            cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

        return result
