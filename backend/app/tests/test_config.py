from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_config_load_successfully() -> None:
    settings = Settings(
        _env_file=None,
        APP_NAME="Mina AI",
        APP_ENV="development",
        API_V1_PREFIX="/api/v1",
        DATABASE_URL="postgresql+psycopg://mina_app:mina_dev_password@localhost:5432/mina_ai",
        LOG_LEVEL="INFO",
        CORS_ORIGINS="http://localhost:5173",
        AUTH_COOKIE_NAME="mina_session",
        AUTH_SESSION_TTL_MINUTES=480,
        AUTH_COOKIE_SECURE=False,
        AUTH_COOKIE_SAMESITE="lax",
    )

    assert settings.app_name == "Mina AI"
    assert settings.cors_origins == ["http://localhost:5173"]
    assert settings.auth_cookie_name == "mina_session"


def test_config_missing_required_field_fails_clearly(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("DATABASE_URL", raising=False)

    with pytest.raises(ValidationError) as exc_info:
        Settings(
            _env_file=None,
            APP_NAME="Mina AI",
            APP_ENV="development",
            API_V1_PREFIX="/api/v1",
            LOG_LEVEL="INFO",
            CORS_ORIGINS="http://localhost:5173",
            AUTH_COOKIE_NAME="mina_session",
            AUTH_SESSION_TTL_MINUTES=480,
            AUTH_COOKIE_SECURE=False,
            AUTH_COOKIE_SAMESITE="lax",
        )

    assert "DATABASE_URL" in str(exc_info.value)
