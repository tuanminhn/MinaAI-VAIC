from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.cli.seed_dev_content import seed_dev_content
from app.cli.seed_dev_core import seed_dev_core
from app.cli.seed_dev_users import seed_dev_users
from app.db.session import session_scope
from app.main import create_app
from app.tests.conftest import truncate_auth_tables


@pytest.fixture(autouse=True)
def reset_tables() -> None:
    truncate_auth_tables()


def seed_default_learning_flow() -> None:
    seed_dev_users(reset_password=True)
    seed_dev_core()
    seed_dev_content()


def login(client: TestClient, username: str, password: str) -> None:
    response = client.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200


def get_assignment_id() -> str:
    with session_scope() as session:
        return str(session.execute(text("SELECT id FROM assignments LIMIT 1")).scalar_one())


def get_option_ids(question_id: str) -> tuple[str, str]:
    with session_scope() as session:
        rows = session.execute(
            text(
                """
                SELECT id, is_correct
                FROM question_options
                WHERE question_id = :question_id
                ORDER BY sort_order ASC, code ASC
                """
            ),
            {"question_id": question_id},
        ).all()
    correct = next(str(row[0]) for row in rows if row[1] is True)
    wrong = next(str(row[0]) for row in rows if row[1] is False)
    return correct, wrong


def answer_diagnostic(
    client: TestClient,
    *,
    session_id: str,
    correct: bool,
    client_attempt_id: str,
) -> dict[str, object]:
    session_response = client.get(f"/api/v1/diagnostic-sessions/{session_id}")
    question = session_response.json()["currentQuestion"]
    correct_option_id, wrong_option_id = get_option_ids(question["id"])
    response = client.post(
        f"/api/v1/diagnostic-sessions/{session_id}/attempts",
        json={
            "questionId": question["id"],
            "selectedOptionId": correct_option_id if correct else wrong_option_id,
            "clientAttemptId": client_attempt_id,
        },
    )
    assert response.status_code == 200
    return response.json()


def drive_to_lcm_root_cause(client: TestClient, session_id: str) -> None:
    plan = [
        False,
        False,
        False,
        False,
        True,
        True,
        False,
        False,
        True,
        True,
        False,
        False,
        True,
        True,
    ]
    for index, should_be_correct in enumerate(plan, start=1):
        answer_diagnostic(
            client,
            session_id=session_id,
            correct=should_be_correct,
            client_attempt_id=f"diagnostic-{index}",
        )


def answer_remediation(
    client: TestClient,
    *,
    session_id: str,
    correct: bool,
    client_attempt_id: str,
) -> dict[str, object]:
    remediation = client.get(f"/api/v1/diagnostic-sessions/{session_id}/remediation").json()
    question = remediation["currentQuestion"]
    correct_option_id, wrong_option_id = get_option_ids(question["id"])
    response = client.post(
        f"/api/v1/diagnostic-sessions/{session_id}/remediation/attempts",
        json={
            "questionId": question["id"],
            "selectedOptionId": correct_option_id if correct else wrong_option_id,
            "clientAttemptId": client_attempt_id,
        },
    )
    assert response.status_code == 200
    return response.json()


def answer_transfer(
    client: TestClient,
    *,
    session_id: str,
    correct: bool,
    client_attempt_id: str,
) -> dict[str, object]:
    transfer = client.get(f"/api/v1/diagnostic-sessions/{session_id}/transfer").json()
    question = transfer["currentQuestion"]
    correct_option_id, wrong_option_id = get_option_ids(question["id"])
    response = client.post(
        f"/api/v1/diagnostic-sessions/{session_id}/transfer/attempts",
        json={
            "questionId": question["id"],
            "selectedOptionId": correct_option_id if correct else wrong_option_id,
            "clientAttemptId": client_attempt_id,
        },
    )
    assert response.status_code == 200
    return response.json()


@pytest.mark.integration
@pytest.mark.postgres
def test_remediation_run_starts_and_completes_to_transfer() -> None:
    seed_default_learning_flow()
    assignment_id = get_assignment_id()

    with TestClient(create_app()) as client:
        login(client, "student01", "test-student-password")
        session_id = client.post(
            f"/api/v1/student/assignments/{assignment_id}/diagnostic-sessions"
        ).json()["sessionId"]
        drive_to_lcm_root_cause(client, session_id)

        start = client.post(f"/api/v1/diagnostic-sessions/{session_id}/remediation-runs")
        details = client.get(f"/api/v1/diagnostic-sessions/{session_id}/remediation")
        first = answer_remediation(
            client,
            session_id=session_id,
            correct=True,
            client_attempt_id="rem-1",
        )
        second = answer_remediation(
            client,
            session_id=session_id,
            correct=False,
            client_attempt_id="rem-2",
        )

    assert start.status_code == 200
    assert start.json()["state"] == "in_remediation"
    assert start.json()["resumed"] is False
    assert details.status_code == 200
    assert "isCorrect" not in details.text
    assert first["nextAction"]["type"] == "next_question"
    assert second["nextAction"]["type"] == "navigate"
    assert second["nextAction"]["route"].startswith("/student/transfer/")


@pytest.mark.integration
@pytest.mark.postgres
def test_transfer_pass_leads_to_mastered_after_remediation_result() -> None:
    seed_default_learning_flow()
    assignment_id = get_assignment_id()

    with TestClient(create_app()) as client:
        login(client, "student01", "test-student-password")
        session_id = client.post(
            f"/api/v1/student/assignments/{assignment_id}/diagnostic-sessions"
        ).json()["sessionId"]
        drive_to_lcm_root_cause(client, session_id)
        client.post(f"/api/v1/diagnostic-sessions/{session_id}/remediation-runs")
        answer_remediation(client, session_id=session_id, correct=True, client_attempt_id="rem-1")
        answer_remediation(client, session_id=session_id, correct=True, client_attempt_id="rem-2")

        start_transfer = client.post(f"/api/v1/diagnostic-sessions/{session_id}/transfer-checks")
        first = answer_transfer(
            client,
            session_id=session_id,
            correct=True,
            client_attempt_id="transfer-1",
        )
        second = answer_transfer(
            client,
            session_id=session_id,
            correct=True,
            client_attempt_id="transfer-2",
        )
        result = client.get(f"/api/v1/diagnostic-sessions/{session_id}/result")

    assert start_transfer.status_code == 200
    assert first["nextAction"]["type"] == "next_question"
    assert second["nextAction"]["type"] == "completed"
    assert result.status_code == 200
    assert result.json()["outcome"] == "mastered_after_remediation"


@pytest.mark.integration
@pytest.mark.postgres
def test_second_transfer_failure_leads_to_needs_teacher_support() -> None:
    seed_default_learning_flow()
    assignment_id = get_assignment_id()

    with TestClient(create_app()) as client:
        login(client, "student01", "test-student-password")
        session_id = client.post(
            f"/api/v1/student/assignments/{assignment_id}/diagnostic-sessions"
        ).json()["sessionId"]
        drive_to_lcm_root_cause(client, session_id)

        client.post(f"/api/v1/diagnostic-sessions/{session_id}/remediation-runs")
        answer_remediation(client, session_id=session_id, correct=True, client_attempt_id="rem-1")
        answer_remediation(client, session_id=session_id, correct=False, client_attempt_id="rem-2")
        client.post(f"/api/v1/diagnostic-sessions/{session_id}/transfer-checks")
        answer_transfer(client, session_id=session_id, correct=False, client_attempt_id="tr-1")
        retry = answer_transfer(
            client,
            session_id=session_id,
            correct=False,
            client_attempt_id="tr-2",
        )

        remediation_retry = client.post(
            f"/api/v1/diagnostic-sessions/{session_id}/remediation-runs"
        )
        answer_remediation(
            client,
            session_id=session_id,
            correct=True,
            client_attempt_id="rem-3",
        )
        answer_remediation(
            client,
            session_id=session_id,
            correct=True,
            client_attempt_id="rem-4",
        )
        client.post(f"/api/v1/diagnostic-sessions/{session_id}/transfer-checks")
        answer_transfer(client, session_id=session_id, correct=False, client_attempt_id="tr-3")
        final = answer_transfer(
            client,
            session_id=session_id,
            correct=False,
            client_attempt_id="tr-4",
        )
        result = client.get(f"/api/v1/diagnostic-sessions/{session_id}/result")

    assert retry["nextAction"]["type"] == "navigate"
    assert retry["nextAction"]["route"].startswith("/student/remediation/")
    assert remediation_retry.status_code == 200
    assert remediation_retry.json()["cycleNumber"] == 2
    assert final["nextAction"]["type"] == "completed"
    assert result.status_code == 200
    assert result.json()["outcome"] == "needs_teacher_support"
