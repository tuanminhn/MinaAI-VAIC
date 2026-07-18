from __future__ import annotations

import pytest
from sqlalchemy.engine import make_url

from app.cli.reset_dev_database import _validate_reset_target
from app.core.config import reset_settings_cache
from app.tests import conftest as test_conftest


def test_test_database_url_is_required(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("TEST_DATABASE_URL", raising=False)
    monkeypatch.setenv("DATABASE_URL", test_conftest.DEFAULT_DEV_DATABASE_URL)
    monkeypatch.delenv("MINA_DEV_DATABASE_URL", raising=False)

    with pytest.raises(RuntimeError, match="TEST_DATABASE_URL is required"):
        test_conftest.get_test_database_url()


def test_test_database_url_must_differ_from_development_url(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("DATABASE_URL", test_conftest.DEFAULT_DEV_DATABASE_URL)
    monkeypatch.delenv("MINA_DEV_DATABASE_URL", raising=False)
    monkeypatch.setenv("TEST_DATABASE_URL", test_conftest.DEFAULT_DEV_DATABASE_URL)

    with pytest.raises(RuntimeError, match="Refusing to run PostgreSQL tests"):
        test_conftest.get_test_database_url()


def test_test_database_name_must_be_safe(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DATABASE_URL", test_conftest.DEFAULT_DEV_DATABASE_URL)
    monkeypatch.delenv("MINA_DEV_DATABASE_URL", raising=False)
    monkeypatch.setenv(
        "TEST_DATABASE_URL",
        "postgresql+psycopg://mina_app:mina_dev_password@localhost:5432/mina_preview",
    )

    with pytest.raises(RuntimeError, match="Refusing to run PostgreSQL tests"):
        test_conftest.get_test_database_url()


def test_postgres_test_environment_uses_mina_test(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DATABASE_URL", test_conftest.DEFAULT_DEV_DATABASE_URL)
    monkeypatch.delenv("MINA_DEV_DATABASE_URL", raising=False)
    monkeypatch.setenv("TEST_DATABASE_URL", test_conftest.DEFAULT_TEST_DATABASE_URL)

    environment = test_conftest.get_postgres_test_environment()

    assert make_url(environment["DATABASE_URL"]).database == "mina_test"
    assert make_url(environment["MINA_DEV_DATABASE_URL"]).database == "mina_dev"


def test_reset_dev_database_rejects_production(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("DATABASE_URL", test_conftest.DEFAULT_DEV_DATABASE_URL)
    monkeypatch.setenv("TEST_DATABASE_URL", test_conftest.DEFAULT_TEST_DATABASE_URL)
    reset_settings_cache()

    with pytest.raises(RuntimeError, match="only allowed when APP_ENV=development"):
        _validate_reset_target()


def test_reset_dev_database_rejects_unsafe_database_name(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql+psycopg://mina_app:mina_dev_password@localhost:5432/mina_preview",
    )
    monkeypatch.setenv("TEST_DATABASE_URL", test_conftest.DEFAULT_TEST_DATABASE_URL)
    reset_settings_cache()

    with pytest.raises(RuntimeError, match="Expected database name 'mina_dev'"):
        _validate_reset_target()


@pytest.mark.integration
@pytest.mark.postgres
def test_postgres_fixture_targets_mina_test(postgres_url: str) -> None:
    assert make_url(postgres_url).database == "mina_test"
