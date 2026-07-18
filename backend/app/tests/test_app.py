from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def test_fastapi_app_can_be_created() -> None:
    from app.main import create_app

    app = create_app()
    assert app.title == "Mina AI"


def test_health_returns_200(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "mina-backend"}


def test_ready_returns_ready_when_database_is_reachable(client: TestClient) -> None:
    response = client.get("/api/v1/health/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "ready", "database": "reachable"}


def test_ready_returns_503_when_database_is_unreachable(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.main import create_app

    monkeypatch.setattr("app.main.check_database_connection", lambda: True)
    monkeypatch.setattr("app.api.v1.health.check_database_connection", lambda: False)

    with TestClient(create_app()) as test_client:
        response = test_client.get("/api/v1/health/ready")

    assert response.status_code == 503
    assert response.json() == {
        "code": "DATABASE_UNAVAILABLE",
        "message": "Máy chủ dữ liệu chưa sẵn sàng.",
    }


def test_cors_allows_development_origin(client: TestClient) -> None:
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert response.headers["access-control-allow-credentials"] == "true"


def test_app_fails_clearly_if_database_is_unreachable(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.main import create_app

    monkeypatch.setattr("app.main.check_database_connection", lambda: False)

    with pytest.raises(RuntimeError, match="Database is not reachable"):
        with TestClient(create_app()):
            pass


def test_startup_path_does_not_use_create_all() -> None:
    with open("app/main.py", encoding="utf-8") as file:
        main_source = file.read()

    with open("app/db/session.py", encoding="utf-8") as file:
        session_source = file.read()

    assert "create_all(" not in main_source
    assert "create_all(" not in session_source
