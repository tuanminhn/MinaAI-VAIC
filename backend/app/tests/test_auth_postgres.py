from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from fastapi import APIRouter, Depends
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.api.dependencies.auth import require_student, require_teacher
from app.cli.seed_dev_users import seed_dev_users
from app.core.security import hash_session_token
from app.db.models.auth_session import AuthSession
from app.db.models.user import User
from app.db.session import session_scope
from app.main import create_app
from app.services.auth_service import AuthService
from app.tests.conftest import truncate_auth_tables


def seed_default_users() -> None:
    seed_dev_users(reset_password=True)


def create_inactive_user() -> None:
    with session_scope() as session:
        AuthService(session).create_user(
            username="inactive01",
            display_name="Inactive User",
            role="student",
            password="inactive-password",
            is_active=False,
        )


@pytest.fixture(autouse=True)
def reset_auth_tables() -> None:
    truncate_auth_tables()


@pytest.mark.integration
@pytest.mark.postgres
def test_user_normalized_username_is_unique() -> None:
    with session_scope() as session:
        auth_service = AuthService(session)
        auth_service.create_user(
            username="Student01",
            display_name="Student One",
            role="student",
            password="student-password",
        )

    with session_scope() as session:
        auth_service = AuthService(session)
        duplicate = auth_service.create_user(
            username="student01",
            display_name="Student One Again",
            role="student",
            password="student-password",
        )
        count = session.execute(text("SELECT COUNT(*) FROM users")).scalar_one()

    assert duplicate.normalized_username == "student01"
    assert count == 1


@pytest.mark.integration
@pytest.mark.postgres
def test_seed_command_creates_student_and_teacher() -> None:
    changed = seed_dev_users(reset_password=True)
    assert changed == 2

    with session_scope() as session:
        users = session.execute(
            text("SELECT normalized_username, role FROM users ORDER BY role")
        ).all()
    assert users == [("student01", "student"), ("teacher01", "teacher")]


@pytest.mark.integration
@pytest.mark.postgres
def test_seed_command_is_idempotent() -> None:
    seed_dev_users(reset_password=True)
    changed = seed_dev_users(reset_password=False)
    assert changed == 0


@pytest.mark.integration
@pytest.mark.postgres
def test_seed_command_rejects_production(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    from app.core.config import reset_settings_cache

    reset_settings_cache()
    with pytest.raises(RuntimeError, match="only allowed in development or test"):
        seed_dev_users()


def _login(client: TestClient, username: str, password: str):
    return client.post("/api/v1/auth/login", json={"username": username, "password": password})


@pytest.mark.integration
@pytest.mark.postgres
def test_login_student_succeeds() -> None:
    seed_default_users()
    with TestClient(create_app()) as client:
        response = _login(client, "student01", "test-student-password")
    assert response.status_code == 200
    assert response.json()["user"]["role"] == "student"


@pytest.mark.integration
@pytest.mark.postgres
def test_login_teacher_succeeds() -> None:
    seed_default_users()
    with TestClient(create_app()) as client:
        response = _login(client, "teacher01", "test-teacher-password")
    assert response.status_code == 200
    assert response.json()["user"]["role"] == "teacher"


@pytest.mark.integration
@pytest.mark.postgres
def test_login_wrong_password_returns_generic_401() -> None:
    seed_default_users()
    with TestClient(create_app()) as client:
        response = _login(client, "student01", "wrong-password")
    assert response.status_code == 401
    assert response.json() == {
        "code": "INVALID_CREDENTIALS",
        "message": "Tên đăng nhập hoặc mật khẩu không đúng.",
    }


@pytest.mark.integration
@pytest.mark.postgres
def test_unknown_username_returns_generic_401() -> None:
    seed_default_users()
    with TestClient(create_app()) as client:
        response = _login(client, "unknown01", "wrong-password")
    assert response.status_code == 401
    assert response.json() == {
        "code": "INVALID_CREDENTIALS",
        "message": "Tên đăng nhập hoặc mật khẩu không đúng.",
    }


@pytest.mark.integration
@pytest.mark.postgres
def test_inactive_user_cannot_login() -> None:
    create_inactive_user()
    with TestClient(create_app()) as client:
        response = _login(client, "inactive01", "inactive-password")
    assert response.status_code == 401
    assert response.json()["code"] == "INVALID_CREDENTIALS"


@pytest.mark.integration
@pytest.mark.postgres
def test_login_sets_cookie() -> None:
    seed_default_users()
    with TestClient(create_app()) as client:
        response = _login(client, "student01", "test-student-password")
    assert "mina_session=" in response.headers["set-cookie"]


@pytest.mark.integration
@pytest.mark.postgres
def test_cookie_has_httponly() -> None:
    seed_default_users()
    with TestClient(create_app()) as client:
        response = _login(client, "student01", "test-student-password")
    assert "HttpOnly" in response.headers["set-cookie"]


@pytest.mark.integration
@pytest.mark.postgres
def test_cookie_has_samesite() -> None:
    seed_default_users()
    with TestClient(create_app()) as client:
        response = _login(client, "student01", "test-student-password")
    assert "SameSite=lax" in response.headers["set-cookie"]


@pytest.mark.integration
@pytest.mark.postgres
def test_auth_me_returns_user_for_valid_session() -> None:
    seed_default_users()
    with TestClient(create_app()) as client:
        login_response = _login(client, "student01", "test-student-password")
        me_response = client.get("/api/v1/auth/me")
    assert login_response.status_code == 200
    assert me_response.status_code == 200
    assert me_response.json()["displayName"] == "Nguyen Minh"


@pytest.mark.integration
@pytest.mark.postgres
def test_auth_me_returns_401_without_cookie() -> None:
    with TestClient(create_app()) as client:
        response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert response.json()["code"] == "AUTH_REQUIRED"


@pytest.mark.integration
@pytest.mark.postgres
def test_expired_session_returns_401() -> None:
    seed_default_users()
    raw_token = "expired-session-token"
    with session_scope() as session:
        user = session.query(User).filter(User.normalized_username == "student01").one()
        session.add(
            AuthSession(
                user_id=user.id,
                token_hash=hash_session_token(raw_token),
                expires_at=datetime.now(UTC) - timedelta(minutes=1),
            )
        )

    with TestClient(create_app()) as client:
        client.cookies.set("mina_session", raw_token)
        response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert response.json()["code"] == "SESSION_EXPIRED"


@pytest.mark.integration
@pytest.mark.postgres
def test_revoked_session_returns_401() -> None:
    seed_default_users()
    raw_token = "revoked-session-token"
    with session_scope() as session:
        user = session.query(User).filter(User.normalized_username == "student01").one()
        session.add(
            AuthSession(
                user_id=user.id,
                token_hash=hash_session_token(raw_token),
                expires_at=datetime.now(UTC) + timedelta(minutes=30),
                revoked_at=datetime.now(UTC),
            )
        )

    with TestClient(create_app()) as client:
        client.cookies.set("mina_session", raw_token)
        response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert response.json()["code"] == "SESSION_EXPIRED"


@pytest.mark.integration
@pytest.mark.postgres
def test_logout_revokes_session() -> None:
    seed_default_users()
    with TestClient(create_app()) as client:
        _login(client, "student01", "test-student-password")
        response = client.post("/api/v1/auth/logout")
        me_response = client.get("/api/v1/auth/me")
    assert response.status_code == 204
    assert me_response.status_code == 401


@pytest.mark.integration
@pytest.mark.postgres
def test_logout_clears_cookie() -> None:
    seed_default_users()
    with TestClient(create_app()) as client:
        _login(client, "student01", "test-student-password")
        response = client.post("/api/v1/auth/logout")
    assert 'mina_session=""' in response.headers["set-cookie"]


@pytest.mark.integration
@pytest.mark.postgres
def test_logout_is_idempotent() -> None:
    with TestClient(create_app()) as client:
        response = client.post("/api/v1/auth/logout")
    assert response.status_code == 204


@pytest.mark.integration
@pytest.mark.postgres
def test_require_student_blocks_teacher() -> None:
    router = APIRouter()

    @router.get("/student-only")
    def student_only(_: User = Depends(require_student)) -> dict[str, str]:  # noqa: B008
        return {"status": "ok"}

    app = create_app()
    app.include_router(router, prefix="/test")
    seed_default_users()

    with TestClient(app) as client:
        _login(client, "teacher01", "test-teacher-password")
        response = client.get("/test/student-only")

    assert response.status_code == 403


@pytest.mark.integration
@pytest.mark.postgres
def test_require_teacher_blocks_student() -> None:
    router = APIRouter()

    @router.get("/teacher-only")
    def teacher_only(_: User = Depends(require_teacher)) -> dict[str, str]:  # noqa: B008
        return {"status": "ok"}

    app = create_app()
    app.include_router(router, prefix="/test")
    seed_default_users()

    with TestClient(app) as client:
        _login(client, "student01", "test-student-password")
        response = client.get("/test/teacher-only")

    assert response.status_code == 403


@pytest.mark.integration
@pytest.mark.postgres
def test_token_hash_is_stored_and_raw_token_is_not_in_database() -> None:
    seed_default_users()
    with TestClient(create_app()) as client:
        response = _login(client, "student01", "test-student-password")

    cookie_header = response.headers["set-cookie"]
    raw_token = cookie_header.split("mina_session=")[1].split(";")[0]
    with session_scope() as session:
        token_hash = session.execute(text("SELECT token_hash FROM auth_sessions")).scalar_one()

    assert token_hash == hash_session_token(raw_token)
    assert token_hash != raw_token
