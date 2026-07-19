from __future__ import annotations

from datetime import UTC, datetime

from app.core.config import get_settings
from app.db.models.assignment import Assignment
from app.db.models.assignment_recipient import AssignmentRecipient
from app.db.models.classroom import Classroom
from app.db.models.classroom_membership import ClassroomMembership
from app.db.models.school import School
from app.db.session import session_scope
from app.repositories.assignment_repository import AssignmentRepository
from app.repositories.classroom_repository import ClassroomRepository
from app.repositories.school_repository import SchoolRepository
from app.repositories.user_repository import UserRepository
from app.services.auth_service import normalize_username

DEV_SCHOOL_CODE = "mina-thcs"
DEV_SCHOOL_NAME = "Trường THCS Mina"
DEV_CLASSROOM_CODE = "6A1"
DEV_CLASSROOM_NAME = "Lớp 6A1"
DEV_ACADEMIC_YEAR = "2026-2027"
DEV_ASSIGNMENT_TITLE = "Ôn tập phân số"
DEV_ASSIGNMENT_DESCRIPTION = "Kiểm tra và củng cố kiến thức nền."
DEV_ASSIGNED_AT = datetime(2026, 7, 18, 8, 0, tzinfo=UTC)


def _require_development_environment() -> None:
    settings = get_settings()
    if settings.app_env not in {"development", "test"}:
        raise RuntimeError("Core development seeding is only allowed in development or test.")


def seed_dev_core() -> int:
    _require_development_environment()
    settings = get_settings()

    if not settings.dev_student_username or not settings.dev_teacher_username:
        raise RuntimeError(
            "Missing development usernames. "
            "Run with DEV_STUDENT_USERNAME and DEV_TEACHER_USERNAME configured."
        )

    with session_scope() as session:
        users = UserRepository(session)
        schools = SchoolRepository(session)
        classrooms = ClassroomRepository(session)
        assignments = AssignmentRepository(session)

        student_user = users.get_by_normalized_username(
            normalize_username(settings.dev_student_username)
        )
        teacher_user = users.get_by_normalized_username(
            normalize_username(settings.dev_teacher_username)
        )

        if student_user is None or teacher_user is None:
            raise RuntimeError(
                "Development users were not found. Run 'python -m app.cli.seed_dev_users' first."
            )
        if student_user.role != "student":
            raise RuntimeError("DEV_STUDENT_USERNAME must belong to a student user.")
        if teacher_user.role != "teacher":
            raise RuntimeError("DEV_TEACHER_USERNAME must belong to a teacher user.")

        changed = 0

        school = schools.get_by_code(DEV_SCHOOL_CODE)
        if school is None:
            school = schools.add(
                School(
                    code=DEV_SCHOOL_CODE,
                    name=DEV_SCHOOL_NAME,
                    is_active=True,
                )
            )
            session.flush()
            changed += 1
        elif school.name != DEV_SCHOOL_NAME or not school.is_active:
            school.name = DEV_SCHOOL_NAME
            school.is_active = True
            changed += 1

        classroom = classrooms.get_by_school_code_year(
            school_id=school.id,
            code=DEV_CLASSROOM_CODE,
            academic_year=DEV_ACADEMIC_YEAR,
        )
        if classroom is None:
            classroom = classrooms.add(
                Classroom(
                    school_id=school.id,
                    code=DEV_CLASSROOM_CODE,
                    name=DEV_CLASSROOM_NAME,
                    grade=6,
                    academic_year=DEV_ACADEMIC_YEAR,
                    is_active=True,
                )
            )
            session.flush()
            changed += 1
        else:
            updated = False
            if classroom.name != DEV_CLASSROOM_NAME:
                classroom.name = DEV_CLASSROOM_NAME
                updated = True
            if classroom.grade != 6:
                classroom.grade = 6
                updated = True
            if not classroom.is_active:
                classroom.is_active = True
                updated = True
            if updated:
                changed += 1

        for user, membership_role, is_primary in [
            (teacher_user, "teacher", True),
            (student_user, "student", True),
        ]:
            membership = classrooms.get_membership(
                classroom_id=classroom.id,
                user_id=user.id,
            )
            if membership is None:
                classrooms.add_membership(
                    ClassroomMembership(
                        classroom_id=classroom.id,
                        user_id=user.id,
                        membership_role=membership_role,
                        is_primary=is_primary,
                    )
                )
                changed += 1
            else:
                updated = False
                if membership.membership_role != membership_role:
                    membership.membership_role = membership_role
                    updated = True
                if membership.is_primary != is_primary:
                    membership.is_primary = is_primary
                    updated = True
                if updated:
                    changed += 1

        assignment = assignments.get_by_classroom_and_title(
            classroom_id=classroom.id,
            title=DEV_ASSIGNMENT_TITLE,
        )
        if assignment is None:
            assignment = assignments.add(
                Assignment(
                    classroom_id=classroom.id,
                    created_by_user_id=teacher_user.id,
                    title=DEV_ASSIGNMENT_TITLE,
                    description=DEV_ASSIGNMENT_DESCRIPTION,
                    status="published",
                    estimated_minutes=20,
                    assigned_at=DEV_ASSIGNED_AT,
                    due_at=None,
                )
            )
            session.flush()
            changed += 1
        else:
            updated = False
            if assignment.created_by_user_id != teacher_user.id:
                assignment.created_by_user_id = teacher_user.id
                updated = True
            if assignment.description != DEV_ASSIGNMENT_DESCRIPTION:
                assignment.description = DEV_ASSIGNMENT_DESCRIPTION
                updated = True
            if assignment.status != "published":
                assignment.status = "published"
                updated = True
            if assignment.estimated_minutes != 20:
                assignment.estimated_minutes = 20
                updated = True
            if assignment.assigned_at != DEV_ASSIGNED_AT:
                assignment.assigned_at = DEV_ASSIGNED_AT
                updated = True
            if assignment.due_at is not None:
                assignment.due_at = None
                updated = True
            if updated:
                changed += 1

        recipient = assignments.get_recipient(
            assignment_id=assignment.id,
            student_user_id=student_user.id,
        )
        if recipient is None:
            assignments.add_recipient(
                AssignmentRecipient(
                    assignment_id=assignment.id,
                    student_user_id=student_user.id,
                    status="not_started",
                    progress_completed=0,
                    progress_total=0,
                    started_at=None,
                    completed_at=None,
                )
            )
            changed += 1
        else:
            updated = False
            if recipient.status != "not_started":
                recipient.status = "not_started"
                updated = True
            if recipient.progress_completed != 0:
                recipient.progress_completed = 0
                updated = True
            if recipient.progress_total != 0:
                recipient.progress_total = 0
                updated = True
            if recipient.started_at is not None:
                recipient.started_at = None
                updated = True
            if recipient.completed_at is not None:
                recipient.completed_at = None
                updated = True
            if updated:
                changed += 1

    return changed


def main() -> None:
    count = seed_dev_core()
    print(f"Core seed completed with {count} changes.")


if __name__ == "__main__":
    main()
