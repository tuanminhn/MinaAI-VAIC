from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


@pytest.mark.integration
@pytest.mark.postgres
def test_ready_endpoint_reports_database_reachable() -> None:
    from app.main import create_app

    with TestClient(create_app()) as client:
        response = client.get("/api/v1/health/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "ready", "database": "reachable"}
