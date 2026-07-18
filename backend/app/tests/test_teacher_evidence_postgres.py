from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.cli.seed_dev_content import seed_dev_content
from app.cli.seed_dev_core import seed_dev_core
from app.cli.seed_dev_users import seed_dev_users
from app.db.models.assignment_recipient import AssignmentRecipient
from app.db.models.classroom_membership import ClassroomMembership
from app.db.session import session_scope
from app.main import create_app
from app.services.auth_service import AuthService
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


def get_class_id() -> str:
    with session_scope() as session:
        return str(session.execute(text("SELECT id FROM classrooms LIMIT 1")).scalar_one())


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


def create_second_student_recipient() -> None:
    with session_scope() as session:
        auth_service = AuthService(session)
        student = auth_service.create_user(
            username="student02",
            display_name="Binh An",
            role="student",
            password="student-password",
        )
        session.flush()
        classroom_id = session.execute(text("SELECT id FROM classrooms LIMIT 1")).scalar_one()
        assignment_id = session.execute(text("SELECT id FROM assignments LIMIT 1")).scalar_one()
        session.add(ClassroomMembership(
            classroom_id=classroom_id, user_id=student.id,
            membership_role="student", is_primary=False,
        ))
        session.add(AssignmentRecipient(
            assignment_id=assignment_id, student_user_id=student.id,
            status="not_started", progress_completed=0, progress_total=0,
        ))


def expand_class_to_40_students() -> None:
    with session_scope() as session:
        classroom_id = session.execute(text("SELECT id FROM classrooms LIMIT 1")).scalar_one()
        auth_service = AuthService(session)
        for index in range(2, 41):
            student = auth_service.create_user(
                username=f"capacity-student-{index:02d}",
                display_name=f"Học sinh {index:02d}",
                role="student",
                password="capacity-test-password",
            )
            session.flush()
            session.add(ClassroomMembership(
                classroom_id=classroom_id, user_id=student.id,
                membership_role="student", is_primary=False,
            ))


@pytest.mark.integration
@pytest.mark.postgres
def test_teacher_can_list_class_assignments() -> None:
    seed_default_learning_flow()
    class_id = get_class_id()

    with TestClient(create_app()) as client:
        login(client, "teacher01", "test-teacher-password")
        response = client.get(f"/api/v1/teacher/classes/{class_id}/assignments")

    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["title"] == "Ôn tập phân số"
    assert items[0]["studentCount"] == 1


@pytest.mark.integration
@pytest.mark.postgres
def test_teacher_assignment_overview_counts_and_root_cause_groups() -> None:
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
        client.post(f"/api/v1/diagnostic-sessions/{session_id}/transfer-checks")
        answer_transfer(client, session_id=session_id, correct=True, client_attempt_id="tr-1")
        answer_transfer(client, session_id=session_id, correct=True, client_attempt_id="tr-2")
        client.post("/api/v1/auth/logout")

        login(client, "teacher01", "test-teacher-password")
        response = client.get(f"/api/v1/teacher/assignments/{assignment_id}/overview")

    assert response.status_code == 200
    payload = response.json()
    assert payload["counts"] == {
        "notStarted": 0,
        "diagnosing": 0,
        "inRemediation": 0,
        "completed": 1,
        "needsSupport": 0,
    }
    assert payload["rootCauseGroups"][0]["skillName"] == "Tìm bội chung nhỏ nhất"
    assert payload["rootCauseGroups"][0]["studentCount"] == 1


@pytest.mark.integration
@pytest.mark.postgres
def test_teacher_assignment_students_support_pagination_and_attempt_counts() -> None:
    seed_default_learning_flow()
    create_second_student_recipient()
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
        client.post(f"/api/v1/diagnostic-sessions/{session_id}/transfer-checks")
        answer_transfer(client, session_id=session_id, correct=True, client_attempt_id="tr-1")
        answer_transfer(client, session_id=session_id, correct=True, client_attempt_id="tr-2")
        client.post("/api/v1/auth/logout")

        login(client, "teacher01", "test-teacher-password")
        response = client.get(
            f"/api/v1/teacher/assignments/{assignment_id}/students?page=1&pageSize=1"
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["page"] == 1
    assert payload["pageSize"] == 1
    assert payload["total"] == 2
    assert payload["items"][0]["student"]["displayName"] == "Binh An"


@pytest.mark.integration
@pytest.mark.postgres
def test_teacher_can_view_learning_session_evidence_with_correctness() -> None:
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
        client.post("/api/v1/auth/logout")

        login(client, "teacher01", "test-teacher-password")
        response = client.get(f"/api/v1/teacher/learning-sessions/{session_id}")

    assert response.status_code == 200
    payload = response.json()
    assert payload["student"]["displayName"] == "Nguyen Minh"
    assert payload["assignment"]["title"] == "Ôn tập phân số"
    assert payload["rootCause"]["name"] == "Tìm bội chung nhỏ nhất"
    assert payload["attempts"][0]["phase"] == "diagnostic"
    assert isinstance(payload["attempts"][0]["isCorrect"], bool)
    assert payload["timeline"][0]["toState"] == "diagnosing"


@pytest.mark.integration
@pytest.mark.postgres
def test_student_cannot_access_teacher_assignment_evidence_endpoints() -> None:
    seed_default_learning_flow()
    assignment_id = get_assignment_id()

    with TestClient(create_app()) as client:
        login(client, "student01", "test-student-password")
        response = client.get(f"/api/v1/teacher/assignments/{assignment_id}/overview")

    assert response.status_code == 403


@pytest.mark.integration
@pytest.mark.postgres
def test_teacher_can_create_assignment_for_class_of_40_students() -> None:
    seed_default_learning_flow()
    expand_class_to_40_students()
    class_id = get_class_id()

    with TestClient(create_app()) as client:
        login(client, "teacher01", "test-teacher-password")
        response = client.post(
            f"/api/v1/teacher/classes/{class_id}/assignments",
            json={
                "title": "Kiểm tra tải lớp 40 học sinh",
                "targetSkillCode": "MATH6.FRACTIONS.SUBTRACT_DIFFERENT_DENOMINATOR",
                "estimatedMinutes": 15,
                "publish": True,
            },
        )

    assert response.status_code == 201
    assert response.json()["studentCount"] == 40
    with session_scope() as session:
        recipient_count = session.execute(
            text("SELECT COUNT(*) FROM assignment_recipients WHERE assignment_id = :assignment_id"),
            {"assignment_id": response.json()["id"]},
        ).scalar_one()
    assert recipient_count == 40
