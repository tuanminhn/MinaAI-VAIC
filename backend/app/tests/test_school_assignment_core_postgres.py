from __future__ import annotations

from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.cli.seed_dev_core import seed_dev_core
from app.cli.seed_dev_users import seed_dev_users
from app.core.config import reset_settings_cache
from app.db.models.assignment import Assignment
from app.db.models.assignment_recipient import AssignmentRecipient
from app.db.models.classroom import Classroom
from app.db.models.classroom_membership import ClassroomMembership
from app.db.models.school import School
from app.db.session import session_scope
from app.main import create_app
from app.services.auth_service import AuthService
from app.tests.conftest import truncate_auth_tables


@pytest.fixture(autouse=True)
def reset_core_tables() -> None:
    truncate_auth_tables()


def seed_default_core() -> None:
    seed_dev_users(reset_password=True)
    seed_dev_core()


def login(client: TestClient, username: str, password: str) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    assert response.status_code == 200


def create_teacher_with_classroom(
    *,
    code: str,
    class_name: str,
    academic_year: str,
) -> tuple[str, str]:
    with session_scope() as session:
        auth_service = AuthService(session)
        teacher = auth_service.create_user(
            username=f"{code.lower()}-teacher",
            display_name=f"Teacher {code}",
            role="teacher",
            password="teacher-password",
        )
        school = School(code=f"school-{code.lower()}", name=f"School {code}", is_active=True)
        session.add(school)
        session.flush()
        classroom = Classroom(
            school_id=school.id,
            code=code,
            name=class_name,
            grade=6,
            academic_year=academic_year,
            is_active=True,
        )
        session.add(classroom)
        session.flush()
        session.add(
            ClassroomMembership(
                classroom_id=classroom.id,
                user_id=teacher.id,
                membership_role="teacher",
                is_primary=True,
            )
        )
        return str(teacher.id), str(classroom.id)


def create_student_assignment(
    *,
    title: str,
    status: str,
    published: bool = True,
    due_at=None,
) -> None:
    with session_scope() as session:
        student = session.execute(
            text("SELECT id FROM users WHERE normalized_username = 'student01'")
        ).scalar_one()
        teacher = session.execute(
            text("SELECT id FROM users WHERE normalized_username = 'teacher01'")
        ).scalar_one()
        classroom = session.execute(
            text(
                "SELECT classroom_id FROM classroom_memberships "
                "WHERE user_id = :student_id AND membership_role = 'student' LIMIT 1"
            ),
            {"student_id": student},
        ).scalar_one()
        assignment = Assignment(
            classroom_id=classroom,
            created_by_user_id=teacher,
            title=title,
            description=f"Description for {title}",
            status="published" if published else "draft",
            estimated_minutes=20,
            assigned_at=datetime.now(UTC),
            due_at=due_at,
        )
        session.add(assignment)
        session.flush()
        session.add(
            AssignmentRecipient(
                assignment_id=assignment.id,
                student_user_id=student,
                status=status,
                progress_completed=0,
                progress_total=0,
            )
        )


@pytest.mark.integration
@pytest.mark.postgres
def test_seed_core_succeeds_and_is_idempotent() -> None:
    seed_dev_users(reset_password=True)
    changed_first = seed_dev_core()
    changed_second = seed_dev_core()

    assert changed_first > 0
    assert changed_second == 0


@pytest.mark.integration
@pytest.mark.postgres
def test_seed_core_rejects_production(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    reset_settings_cache()

    with pytest.raises(RuntimeError, match="only allowed in development or test"):
        seed_dev_core()


@pytest.mark.integration
@pytest.mark.postgres
def test_seed_core_fails_clearly_when_users_are_missing() -> None:
    with pytest.raises(RuntimeError, match="seed_dev_users"):
        seed_dev_core()


@pytest.mark.integration
@pytest.mark.postgres
def test_seed_core_uses_usernames_from_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DEV_STUDENT_USERNAME", "hs1")
    monkeypatch.setenv("DEV_STUDENT_PASSWORD", "123")
    monkeypatch.setenv("DEV_STUDENT_DISPLAY_NAME", "DIEM")
    monkeypatch.setenv("DEV_TEACHER_USERNAME", "gv1")
    monkeypatch.setenv("DEV_TEACHER_PASSWORD", "123")
    monkeypatch.setenv("DEV_TEACHER_DISPLAY_NAME", "Co Tran Thu Ha")
    reset_settings_cache()

    seed_dev_users(reset_password=True)
    seed_dev_core()

    with session_scope() as session:
        usernames = session.execute(
            text(
                "SELECT normalized_username FROM users "
                "WHERE normalized_username IN ('hs1', 'gv1') ORDER BY normalized_username"
            )
        ).scalars()
        memberships = session.execute(
            text("SELECT COUNT(*) FROM classroom_memberships")
        ).scalar_one()

    assert list(usernames) == ["gv1", "hs1"]
    assert memberships == 2


@pytest.mark.integration
@pytest.mark.postgres
def test_school_and_classroom_constraints_hold() -> None:
    seed_default_core()

    with pytest.raises(IntegrityError):
        with session_scope() as session:
            school = School(code="mina-thcs", name="Duplicate School", is_active=True)
            session.add(school)
            session.flush()

    with pytest.raises(IntegrityError):
        with session_scope() as session:
            school_id = session.execute(text("SELECT id FROM schools LIMIT 1")).scalar_one()
            classroom = Classroom(
                school_id=school_id,
                code="6A1",
                name="Duplicate Classroom",
                grade=6,
                academic_year="2026-2027",
                is_active=True,
            )
            session.add(classroom)
            session.flush()


@pytest.mark.integration
@pytest.mark.postgres
def test_membership_and_recipient_constraints_hold() -> None:
    seed_default_core()

    with pytest.raises(IntegrityError):
        with session_scope() as session:
            classroom_id = session.execute(text("SELECT id FROM classrooms LIMIT 1")).scalar_one()
            student_id = session.execute(
                text("SELECT id FROM users WHERE normalized_username = 'student01'")
            ).scalar_one()
            session.add(
                ClassroomMembership(
                    classroom_id=classroom_id,
                    user_id=student_id,
                    membership_role="student",
                    is_primary=False,
                )
            )
            session.flush()

    with pytest.raises(IntegrityError):
        with session_scope() as session:
            assignment_id = session.execute(text("SELECT id FROM assignments LIMIT 1")).scalar_one()
            student_id = session.execute(
                text("SELECT id FROM users WHERE normalized_username = 'student01'")
            ).scalar_one()
            session.add(
                AssignmentRecipient(
                    assignment_id=assignment_id,
                    student_user_id=student_id,
                    status="completed",
                    progress_completed=3,
                    progress_total=2,
                )
            )
            session.flush()


@pytest.mark.integration
@pytest.mark.postgres
def test_student_home_returns_school_classroom_and_current_assignment() -> None:
    seed_default_core()

    with TestClient(create_app()) as client:
        login(client, "student01", "test-student-password")
        response = client.get("/api/v1/student/home")

    assert response.status_code == 200
    payload = response.json()
    assert payload["student"]["displayName"] == "Nguyen Minh"
    assert payload["student"]["classroomName"] == "Lớp 6A1"
    assert payload["student"]["schoolName"] == "Trường THCS Mina"
    assert payload["currentAssignment"]["title"] == "Ôn tập phân số"
    assert payload["currentAssignment"]["nextRoute"] is None


@pytest.mark.integration
@pytest.mark.postgres
def test_student_home_recent_assignments_is_capped_at_two() -> None:
    seed_default_core()
    create_student_assignment(title="Bài 1", status="completed")
    create_student_assignment(title="Bài 2", status="completed")
    create_student_assignment(title="Bài 3", status="completed")

    with TestClient(create_app()) as client:
        login(client, "student01", "test-student-password")
        response = client.get("/api/v1/student/home")

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["recentAssignments"]) == 2


@pytest.mark.integration
@pytest.mark.postgres
def test_student_assignments_support_pagination_and_status_filter() -> None:
    seed_default_core()
    create_student_assignment(title="Bài tiến độ", status="in_progress")
    create_student_assignment(title="Bài hoàn thành", status="completed")

    with TestClient(create_app()) as client:
        login(client, "student01", "test-student-password")
        filtered = client.get("/api/v1/student/assignments?status=in_progress&page=1&pageSize=10")
        paged = client.get("/api/v1/student/assignments?page=1&pageSize=2")

    assert filtered.status_code == 200
    assert all(item["status"] == "in_progress" for item in filtered.json()["items"])
    assert paged.status_code == 200
    assert paged.json()["pageSize"] == 2
    assert paged.json()["total"] >= 3


@pytest.mark.integration
@pytest.mark.postgres
def test_student_cannot_see_draft_assignments() -> None:
    seed_default_core()
    create_student_assignment(title="Bài nháp", status="not_started", published=False)

    with TestClient(create_app()) as client:
        login(client, "student01", "test-student-password")
        response = client.get("/api/v1/student/assignments")

    titles = [item["title"] for item in response.json()["items"]]
    assert "Bài nháp" not in titles


@pytest.mark.integration
@pytest.mark.postgres
def test_student_role_is_required_for_student_endpoints() -> None:
    seed_default_core()

    with TestClient(create_app()) as client:
        login(client, "teacher01", "test-teacher-password")
        response = client.get("/api/v1/student/home")

    assert response.status_code == 403


@pytest.mark.integration
@pytest.mark.postgres
def test_teacher_classes_detail_and_roster_only_include_authorized_classrooms() -> None:
    seed_default_core()
    _, other_class_id = create_teacher_with_classroom(
        code="6B1",
        class_name="Lớp 6B1",
        academic_year="2026-2027",
    )

    with TestClient(create_app()) as client:
        login(client, "teacher01", "test-teacher-password")
        classes_response = client.get("/api/v1/teacher/classes")
        items = classes_response.json()["items"]
        class_id = items[0]["id"]
        detail_response = client.get(f"/api/v1/teacher/classes/{class_id}")
        roster_response = client.get(f"/api/v1/teacher/classes/{class_id}/students")
        forbidden_response = client.get(f"/api/v1/teacher/classes/{other_class_id}")

    assert classes_response.status_code == 200
    assert len(items) == 1
    assert items[0]["name"] == "Lớp 6A1"
    assert detail_response.status_code == 200
    assert detail_response.json()["school"]["name"] == "Trường THCS Mina"
    assert roster_response.status_code == 200
    assert roster_response.json()["items"][0]["displayName"] == "Nguyen Minh"
    assert forbidden_response.status_code == 404


@pytest.mark.integration
@pytest.mark.postgres
def test_student_cannot_access_teacher_endpoints() -> None:
    seed_default_core()
    with session_scope() as session:
        class_id = session.execute(text("SELECT id FROM classrooms LIMIT 1")).scalar_one()

    with TestClient(create_app()) as client:
        login(client, "student01", "test-student-password")
        response = client.get(f"/api/v1/teacher/classes/{class_id}")

    assert response.status_code == 403


@pytest.mark.integration
@pytest.mark.postgres
def test_auth_me_includes_core_context() -> None:
    seed_default_core()

    with TestClient(create_app()) as client:
        login(client, "student01", "test-student-password")
        response = client.get("/api/v1/auth/me")

    assert response.status_code == 200
    assert response.json()["schoolName"] == "Trường THCS Mina"
    assert response.json()["classroomName"] == "Lớp 6A1"
