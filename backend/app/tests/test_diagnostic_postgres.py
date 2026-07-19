from __future__ import annotations

import uuid

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


def seed_default_diagnostic() -> None:
    seed_dev_users(reset_password=True)
    seed_dev_core()
    seed_dev_content()


def login(client: TestClient, username: str, password: str) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    assert response.status_code == 200


def get_assignment_id() -> str:
    with session_scope() as session:
        return str(session.execute(text("SELECT id FROM assignments LIMIT 1")).scalar_one())


def get_assignment_recipient_status() -> str:
    with session_scope() as session:
        statement = text("SELECT status FROM assignment_recipients LIMIT 1")
        return str(session.execute(statement).scalar_one())


def get_question_correct_and_wrong_option_ids(question_id: str) -> tuple[str, str]:
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


def get_session_root_cause_skill_code(session_id: str) -> str | None:
    with session_scope() as session:
        row = session.execute(
            text(
                """
                SELECT skills.code
                FROM diagnostic_sessions
                LEFT JOIN skills ON skills.id = diagnostic_sessions.root_cause_skill_id
                WHERE diagnostic_sessions.id = :session_id
                """
            ),
            {"session_id": session_id},
        ).scalar_one()
    return str(row) if row is not None else None


def get_attempt_count(session_id: str) -> int:
    with session_scope() as session:
        return int(
            session.execute(
                text("SELECT COUNT(*) FROM diagnostic_attempts WHERE session_id = :session_id"),
                {"session_id": session_id},
            ).scalar_one()
        )


def get_current_question(client: TestClient, session_id: str) -> dict[str, object]:
    response = client.get(f"/api/v1/diagnostic-sessions/{session_id}")
    assert response.status_code == 200
    payload = response.json()
    assert payload["currentQuestion"] is not None
    return payload["currentQuestion"]


def answer_current_question(
    client: TestClient,
    *,
    session_id: str,
    correct: bool,
    client_attempt_id: str,
) -> dict[str, object]:
    question = get_current_question(client, session_id)
    correct_option_id, wrong_option_id = get_question_correct_and_wrong_option_ids(question["id"])
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


@pytest.mark.integration
@pytest.mark.postgres
def test_start_session_creates_diagnosing_session_and_updates_assignment() -> None:
    seed_default_diagnostic()
    assignment_id = get_assignment_id()

    with TestClient(create_app()) as client:
        login(client, "student01", "test-student-password")
        response = client.post(f"/api/v1/student/assignments/{assignment_id}/diagnostic-sessions")

    assert response.status_code == 200
    payload = response.json()
    assert payload["state"] == "diagnosing"
    assert payload["route"].startswith("/student/diagnostic/")
    assert payload["resumed"] is False
    assert get_assignment_recipient_status() == "in_progress"


@pytest.mark.integration
@pytest.mark.postgres
def test_start_session_is_idempotent_and_resume_returns_same_session() -> None:
    seed_default_diagnostic()
    assignment_id = get_assignment_id()

    with TestClient(create_app()) as client:
        login(client, "student01", "test-student-password")
        first = client.post(f"/api/v1/student/assignments/{assignment_id}/diagnostic-sessions")
        second = client.post(f"/api/v1/student/assignments/{assignment_id}/diagnostic-sessions")

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["sessionId"] == second.json()["sessionId"]
    assert second.json()["resumed"] is True


@pytest.mark.integration
@pytest.mark.postgres
def test_teacher_is_forbidden_from_student_diagnostic_endpoints() -> None:
    seed_default_diagnostic()
    assignment_id = get_assignment_id()

    with TestClient(create_app()) as client:
        login(client, "teacher01", "test-teacher-password")
        response = client.post(f"/api/v1/student/assignments/{assignment_id}/diagnostic-sessions")

    assert response.status_code == 403


@pytest.mark.integration
@pytest.mark.postgres
def test_session_get_hides_correct_option_and_refresh_keeps_current_question() -> None:
    seed_default_diagnostic()
    assignment_id = get_assignment_id()

    with TestClient(create_app()) as client:
        login(client, "student01", "test-student-password")
        start = client.post(f"/api/v1/student/assignments/{assignment_id}/diagnostic-sessions")
        session_id = start.json()["sessionId"]
        first = client.get(f"/api/v1/diagnostic-sessions/{session_id}")
        second = client.get(f"/api/v1/diagnostic-sessions/{session_id}")

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["currentQuestion"]["id"] == second.json()["currentQuestion"]["id"]
    assert "isCorrect" not in first.text
    assert "correctOption" not in first.text


@pytest.mark.integration
@pytest.mark.postgres
def test_mastery_path_completes_session_and_assignment() -> None:
    seed_default_diagnostic()
    assignment_id = get_assignment_id()

    with TestClient(create_app()) as client:
        login(client, "student01", "test-student-password")
        start = client.post(f"/api/v1/student/assignments/{assignment_id}/diagnostic-sessions")
        session_id = start.json()["sessionId"]

        first_attempt = answer_current_question(
            client,
            session_id=session_id,
            correct=True,
            client_attempt_id=str(uuid.uuid4()),
        )
        second_attempt = answer_current_question(
            client,
            session_id=session_id,
            correct=True,
            client_attempt_id=str(uuid.uuid4()),
        )
        session_response = client.get(f"/api/v1/diagnostic-sessions/{session_id}")
        home_response = client.get("/api/v1/student/home")

    assert first_attempt["nextAction"]["type"] == "next_question"
    assert second_attempt["nextAction"]["type"] == "completed"
    assert session_response.status_code == 200
    assert session_response.json()["state"] == "completed"
    assert session_response.json()["nextRoute"].startswith("/student/result/")
    assert get_assignment_recipient_status() == "completed"
    assert home_response.json()["currentAssignment"]["nextRoute"].startswith("/student/result/")


@pytest.mark.integration
@pytest.mark.postgres
def test_root_cause_path_confirms_lcm_gap_and_routes_to_remediation() -> None:
    seed_default_diagnostic()
    assignment_id = get_assignment_id()

    with TestClient(create_app()) as client:
        login(client, "student01", "test-student-password")
        start = client.post(f"/api/v1/student/assignments/{assignment_id}/diagnostic-sessions")
        session_id = start.json()["sessionId"]

        answer_current_question(
            client, session_id=session_id, correct=False, client_attempt_id="a1"
        )
        answer_current_question(
            client, session_id=session_id, correct=False, client_attempt_id="a2"
        )
        answer_current_question(
            client, session_id=session_id, correct=False, client_attempt_id="a3"
        )
        answer_current_question(
            client, session_id=session_id, correct=False, client_attempt_id="a4"
        )
        answer_current_question(client, session_id=session_id, correct=True, client_attempt_id="a5")
        answer_current_question(client, session_id=session_id, correct=True, client_attempt_id="a6")
        answer_current_question(
            client, session_id=session_id, correct=False, client_attempt_id="a7"
        )
        answer_current_question(
            client, session_id=session_id, correct=False, client_attempt_id="a8"
        )
        answer_current_question(client, session_id=session_id, correct=True, client_attempt_id="a9")
        answer_current_question(
            client,
            session_id=session_id,
            correct=True,
            client_attempt_id="a10",
        )
        answer_current_question(
            client,
            session_id=session_id,
            correct=False,
            client_attempt_id="a11",
        )
        answer_current_question(
            client,
            session_id=session_id,
            correct=False,
            client_attempt_id="a12",
        )
        answer_current_question(
            client,
            session_id=session_id,
            correct=True,
            client_attempt_id="a13",
        )
        final_attempt = answer_current_question(
            client,
            session_id=session_id,
            correct=True,
            client_attempt_id="a14",
        )
        session_response = client.get(f"/api/v1/diagnostic-sessions/{session_id}")
        assignments_response = client.get("/api/v1/student/assignments")

    assert final_attempt["nextAction"]["type"] == "navigate"
    assert final_attempt["nextAction"]["route"].startswith("/student/remediation/")
    assert session_response.json()["state"] == "gap_confirmed"
    assert get_session_root_cause_skill_code(session_id) == "MATH6.MULTIPLES.LCM"
    assert get_assignment_recipient_status() == "remediation"
    assert assignments_response.json()["items"][0]["nextRoute"].startswith("/student/remediation/")


@pytest.mark.integration
@pytest.mark.postgres
def test_duplicate_client_attempt_id_is_idempotent_and_conflict_is_detected() -> None:
    seed_default_diagnostic()
    assignment_id = get_assignment_id()

    with TestClient(create_app()) as client:
        login(client, "student01", "test-student-password")
        start = client.post(f"/api/v1/student/assignments/{assignment_id}/diagnostic-sessions")
        session_id = start.json()["sessionId"]
        question = get_current_question(client, session_id)
        correct_option_id, wrong_option_id = get_question_correct_and_wrong_option_ids(
            question["id"]
        )

        first = client.post(
            f"/api/v1/diagnostic-sessions/{session_id}/attempts",
            json={
                "questionId": question["id"],
                "selectedOptionId": correct_option_id,
                "clientAttemptId": "same-id",
            },
        )
        duplicate = client.post(
            f"/api/v1/diagnostic-sessions/{session_id}/attempts",
            json={
                "questionId": question["id"],
                "selectedOptionId": correct_option_id,
                "clientAttemptId": "same-id",
            },
        )
        conflict = client.post(
            f"/api/v1/diagnostic-sessions/{session_id}/attempts",
            json={
                "questionId": question["id"],
                "selectedOptionId": wrong_option_id,
                "clientAttemptId": "same-id",
            },
        )

    assert first.status_code == 200
    assert duplicate.status_code == 200
    assert first.json()["attemptId"] == duplicate.json()["attemptId"]
    assert conflict.status_code == 409
    assert conflict.json()["code"] == "ATTEMPT_CONFLICT"
    assert get_attempt_count(session_id) == 1


@pytest.mark.integration
@pytest.mark.postgres
def test_old_question_is_rejected_after_progress_moves_forward() -> None:
    seed_default_diagnostic()
    assignment_id = get_assignment_id()

    with TestClient(create_app()) as client:
        login(client, "student01", "test-student-password")
        start = client.post(f"/api/v1/student/assignments/{assignment_id}/diagnostic-sessions")
        session_id = start.json()["sessionId"]
        first_question = get_current_question(client, session_id)
        correct_option_id, _ = get_question_correct_and_wrong_option_ids(first_question["id"])

        first = client.post(
            f"/api/v1/diagnostic-sessions/{session_id}/attempts",
            json={
                "questionId": first_question["id"],
                "selectedOptionId": correct_option_id,
                "clientAttemptId": "q1",
            },
        )
        retry_old_question = client.post(
            f"/api/v1/diagnostic-sessions/{session_id}/attempts",
            json={
                "questionId": first_question["id"],
                "selectedOptionId": correct_option_id,
                "clientAttemptId": "q2",
            },
        )

    assert first.status_code == 200
    assert retry_old_question.status_code == 409
    assert retry_old_question.json()["code"] == "QUESTION_NOT_CURRENT"
