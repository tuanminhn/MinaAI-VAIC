from __future__ import annotations

import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.core.config import reset_settings_cache
from app.db.session import get_engine, reset_database_state

DEFAULT_TEST_ENV = {
    "APP_NAME": "Mina AI",
    "APP_ENV": "test",
    "API_V1_PREFIX": "/api/v1",
    "DATABASE_URL": "postgresql+psycopg://mina_app:mina_dev_password@localhost:5432/mina_ai",
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


def apply_test_env() -> None:
    for key, value in DEFAULT_TEST_ENV.items():
        os.environ[key] = value
    reset_settings_cache()
    reset_database_state()


apply_test_env()


@pytest.fixture(autouse=True)
def test_environment() -> Generator[None, None, None]:
    previous_values = {key: os.environ.get(key) for key in DEFAULT_TEST_ENV}
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
    return os.environ["DATABASE_URL"]


def truncate_auth_tables() -> None:
    engine = get_engine()
    with engine.begin() as connection:
        connection.execute(text("TRUNCATE TABLE auth_sessions, users RESTART IDENTITY CASCADE"))
