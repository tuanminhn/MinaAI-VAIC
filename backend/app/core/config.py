from __future__ import annotations

from functools import lru_cache
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
        populate_by_name=True,
    )

    app_name: str = Field(validation_alias="APP_NAME")
    app_env: str = Field(validation_alias="APP_ENV")
    api_v1_prefix: str = Field(validation_alias="API_V1_PREFIX")
    database_url: str = Field(validation_alias="DATABASE_URL")
    log_level: str = Field(default="INFO", validation_alias="LOG_LEVEL")
    cors_origins: Annotated[list[str], NoDecode] = Field(validation_alias="CORS_ORIGINS")
    auth_cookie_name: str = Field(default="mina_session", validation_alias="AUTH_COOKIE_NAME")
    auth_session_ttl_minutes: int = Field(default=480, validation_alias="AUTH_SESSION_TTL_MINUTES")
    auth_cookie_secure: bool = Field(default=False, validation_alias="AUTH_COOKIE_SECURE")
    auth_cookie_samesite: str = Field(default="lax", validation_alias="AUTH_COOKIE_SAMESITE")
    dev_student_username: str | None = Field(default=None, validation_alias="DEV_STUDENT_USERNAME")
    dev_student_password: str | None = Field(default=None, validation_alias="DEV_STUDENT_PASSWORD")
    dev_student_display_name: str | None = Field(
        default=None,
        validation_alias="DEV_STUDENT_DISPLAY_NAME",
    )
    dev_teacher_username: str | None = Field(default=None, validation_alias="DEV_TEACHER_USERNAME")
    dev_teacher_password: str | None = Field(default=None, validation_alias="DEV_TEACHER_PASSWORD")
    dev_teacher_display_name: str | None = Field(
        default=None,
        validation_alias="DEV_TEACHER_DISPLAY_NAME",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, list):
            return value

        return [item.strip() for item in value.split(",") if item.strip()]

    @field_validator("auth_cookie_samesite")
    @classmethod
    def validate_samesite(cls, value: str) -> str:
        normalized = value.lower()
        if normalized not in {"lax", "strict", "none"}:
            raise ValueError("AUTH_COOKIE_SAMESITE must be one of: lax, strict, none")
        return normalized

    @field_validator("auth_session_ttl_minutes")
    @classmethod
    def validate_session_ttl(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("AUTH_SESSION_TTL_MINUTES must be greater than 0")
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


def reset_settings_cache() -> None:
    get_settings.cache_clear()
