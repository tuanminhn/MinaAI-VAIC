from __future__ import annotations

from sqlalchemy import text

from app.core.config import get_settings
from app.db.session import get_engine


def _validate_reset_target() -> str:
    settings = get_settings()
    if settings.app_env != "development":
        raise RuntimeError("Development database reset is only allowed when APP_ENV=development.")

    database_name = settings.get_database_name(settings.database_url)
    if database_name != "mina_dev":
        raise RuntimeError(
            "Refusing to reset a non-development database. Expected database name 'mina_dev'."
        )

    if settings.test_database_url:
        test_database_name = settings.get_database_name(settings.test_database_url)
        if test_database_name == database_name:
            raise RuntimeError(
                "Refusing to reset the development database because "
                "TEST_DATABASE_URL points to the same database."
            )

    return database_name


def reset_dev_database() -> str:
    database_name = _validate_reset_target()

    with get_engine().begin() as connection:
        connection.execute(
            text(
                """
                DO $$
                DECLARE
                    record_item RECORD;
                BEGIN
                    FOR record_item IN
                        SELECT tablename
                        FROM pg_tables
                        WHERE schemaname = 'public'
                          AND tablename <> 'alembic_version'
                    LOOP
                        EXECUTE format(
                            'DROP TABLE IF EXISTS public.%I CASCADE',
                            record_item.tablename
                        );
                    END LOOP;
                END $$;
                """
            )
        )
        connection.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS public.alembic_version (
                    version_num VARCHAR(32) NOT NULL
                );
                """
            )
        )
        connection.execute(text("TRUNCATE TABLE public.alembic_version"))

    return database_name


def main() -> None:
    database_name = reset_dev_database()
    print(f"Development database '{database_name}' has been reset.")


if __name__ == "__main__":
    main()
