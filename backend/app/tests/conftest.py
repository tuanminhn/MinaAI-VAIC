from __future__ import annotations

import os
import re
from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import make_url

from alembic import command
from alembic.config import Config
from app.core.config import reset_settings_cache
from app.db.session import get_engine, reset_database_state

TEST_DATABASE_GUARD_MESSAGE = "Refusing to run PostgreSQL tests against the development database."
DEFAULT_DEV_DATABASE_URL = "postgresql+psycopg://mina_app:mina_dev_password@localhost:5432/mina_dev"
DEFAULT_TEST_DATABASE_URL = (
    "postgresql+psycopg://mina_app:mina_dev_password@localhost:5432/mina_test"
)

DEFAULT_TEST_ENV = {
    "APP_NAME": "Mina AI",
    "APP_ENV": "test",
    "API_V1_PREFIX": "/api/v1",
    "DATABASE_URL": DEFAULT_DEV_DATABASE_URL,
    "TEST_DATABASE_URL": DEFAULT_TEST_DATABASE_URL,
    "LOG_LEVEL": "INFO",
    "CORS_ORIGINS": "http://localhost:5173",
    "AUTH_COOKIE_NAME": "mina_session",
    "AUTH_SESSION_TTL_MINUTES": "480",
    "AUTH_COOKIE_SECURE": "false",
    "AUTH_COOKIE_SAMESITE": "lax",
    "DEV_STUDENT_USERNAME": "student01",
    "DEV_STUDENT_PASSWORD": "test-student-password",
    "DEV_STUDENT_DISPLAY_NAME": "Nguyen Minh",
    "DEV_TEACHER_USERNAME": "teacher01",
    "DEV_TEACHER_PASSWORD": "test-teacher-password",
    "DEV_TEACHER_DISPLAY_NAME": "Co Tran Thu Ha",
}


def get_development_database_url() -> str:
    return (
        os.environ.get("MINA_DEV_DATABASE_URL")
        or os.environ.get("DATABASE_URL")
        or DEFAULT_TEST_ENV["DATABASE_URL"]
    )


def get_test_database_url() -> str:
    database_url = get_development_database_url()
    test_database_url = os.environ.get("TEST_DATABASE_URL")

    if not test_database_url:
        raise RuntimeError("TEST_DATABASE_URL is required for PostgreSQL tests.")
    if test_database_url == database_url:
        raise RuntimeError(TEST_DATABASE_GUARD_MESSAGE)

    database_name = make_url(test_database_url).database
    if not database_name or "test" not in database_name.lower():
        raise RuntimeError(TEST_DATABASE_GUARD_MESSAGE)

    return test_database_url


def _get_database_name(database_url: str) -> str:
    database_name = make_url(database_url).database
    if not database_name:
        raise RuntimeError("Database URL must include a database name.")
    return database_name


def _ensure_database_exists(database_url: str) -> None:
    database_name = _get_database_name(database_url)
    if not re.fullmatch(r"[A-Za-z0-9_]+", database_name):
        raise RuntimeError("Test database name contains unsupported characters.")

    admin_url = make_url(database_url).set(database="postgres")
    engine = create_engine(admin_url, isolation_level="AUTOCOMMIT", future=True)
    try:
        with engine.connect() as connection:
            exists = connection.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :database_name"),
                {"database_name": database_name},
            ).scalar_one_or_none()
            if exists is None:
                connection.execute(text(f'CREATE DATABASE "{database_name}"'))
    finally:
        engine.dispose()


def get_postgres_test_environment() -> dict[str, str]:
    environment = DEFAULT_TEST_ENV.copy()
    environment["MINA_DEV_DATABASE_URL"] = get_development_database_url()
    environment["TEST_DATABASE_URL"] = (
        os.environ.get("TEST_DATABASE_URL") or environment["TEST_DATABASE_URL"]
    )
    environment["DATABASE_URL"] = get_test_database_url()
    return environment


def apply_test_env() -> None:
    environment = get_postgres_test_environment()
    _ensure_database_exists(environment["DATABASE_URL"])

    for key, value in environment.items():
        os.environ[key] = value

    reset_settings_cache()
    reset_database_state()


def make_test_alembic_config() -> Config:
    config = Config(str(Path("alembic.ini")))
    config.set_main_option("sqlalchemy.url", get_test_database_url())
    return config


@pytest.fixture(scope="session", autouse=True)
def postgres_test_database() -> Generator[None, None, None]:
    original_values = {
        key: os.environ.get(key)
        for key in set(DEFAULT_TEST_ENV) | {"MINA_DEV_DATABASE_URL", "TEST_DATABASE_URL"}
    }
    os.environ.setdefault("TEST_DATABASE_URL", DEFAULT_TEST_ENV["TEST_DATABASE_URL"])
    apply_test_env()
    command.upgrade(make_test_alembic_config(), "head")
    yield
    for key, previous_value in original_values.items():
        if previous_value is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = previous_value
    reset_settings_cache()
    reset_database_state()


@pytest.fixture(autouse=True)
def test_environment() -> Generator[None, None, None]:
    tracked_keys = set(DEFAULT_TEST_ENV) | {"MINA_DEV_DATABASE_URL", "TEST_DATABASE_URL"}
    previous_values = {key: os.environ.get(key) for key in tracked_keys}
    apply_test_env()
    yield
    for key, previous_value in previous_values.items():
        if previous_value is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = previous_value
    reset_settings_cache()
    reset_database_state()


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> Generator[TestClient, None, None]:
    from app.main import create_app

    monkeypatch.setattr("app.main.check_database_connection", lambda: True)
    monkeypatch.setattr("app.api.v1.health.check_database_connection", lambda: True)

    with TestClient(create_app()) as test_client:
        yield test_client


@pytest.fixture
def postgres_url() -> str:
    return get_test_database_url()


def truncate_auth_tables() -> None:
    engine = get_engine()
    table_order = [
        "transfer_attempts",
        "transfer_checks",
        "remediation_attempts",
        "remediation_runs",
        "learning_session_transitions",
        "diagnostic_attempts",
        "diagnostic_skill_evaluations",
        "diagnostic_sessions",
        "assignment_content_targets",
        "assignment_recipients",
        "assignments",
        "question_options",
        "question_items",
        "remediation_units",
        "misconceptions",
        "skill_prerequisites",
        "skills",
        "content_packages",
        "classroom_memberships",
        "classrooms",
        "schools",
        "auth_sessions",
        "users",
        "system_metadata",
    ]
    existing_tables = set(inspect(engine).get_table_names())
    tables_to_truncate = [table_name for table_name in table_order if table_name in existing_tables]
    if not tables_to_truncate:
        return

    with engine.begin() as connection:
        connection.execute(
            text(f"TRUNCATE TABLE {', '.join(tables_to_truncate)} RESTART IDENTITY CASCADE")
        )
