from __future__ import annotations

from dataclasses import dataclass

from app.api.errors import ApiErrorException
from app.db.models.assignment import Assignment
from app.db.models.assignment_recipient import AssignmentRecipient
from app.db.models.classroom import Classroom
from app.db.models.school import School
from app.db.models.user import User
from app.repositories.assignment_repository import AssignmentRepository
from app.repositories.classroom_repository import ClassroomRepository
from app.schemas.student import (
    AssignmentProgressResponse,
    AssignmentSummaryResponse,
    StudentAssignmentsResponse,
    StudentHomeResponse,
    StudentHomeStudentResponse,
)

ALLOWED_ASSIGNMENT_STATUSES = {
    "not_started",
    "in_progress",
    "remediation",
    "transfer_ready",
    "completed",
}


@dataclass
class AssignmentRecord:
    recipient: AssignmentRecipient
    assignment: Assignment
    classroom: Classroom
    school: School


def _format_datetime(value):
    return value.isoformat().replace("+00:00", "Z") if value is not None else None


def _to_assignment_record(row) -> AssignmentRecord:
    recipient, assignment, classroom, school = row
    return AssignmentRecord(
        recipient=recipient,
        assignment=assignment,
        classroom=classroom,
        school=school,
    )


def _serialize_assignment(record: AssignmentRecord) -> AssignmentSummaryResponse:
    latest_session = (
        record.recipient.diagnostic_sessions[0] if record.recipient.diagnostic_sessions else None
    )
    next_route: str | None = None
    if latest_session is not None:
        if latest_session.state == "diagnosing":
            next_route = f"/student/diagnostic/{latest_session.id}"
        elif latest_session.state in {"gap_confirmed", "in_remediation"}:
            next_route = f"/student/remediation/{latest_session.id}"
        elif latest_session.state == "transfer_ready":
            next_route = f"/student/transfer/{latest_session.id}"
        elif latest_session.state == "completed":
            next_route = f"/student/result/{latest_session.id}"

    diagnostic_available = len(record.assignment.content_targets) > 0
    return AssignmentSummaryResponse(
        id=record.assignment.id,
        title=record.assignment.title,
        description=record.assignment.description,
        grade=record.classroom.grade,
        status=record.recipient.status,
        progress=AssignmentProgressResponse(
            completed=record.recipient.progress_completed,
            total=record.recipient.progress_total,
        ),
        estimated_minutes=record.assignment.estimated_minutes,
        assigned_at=_format_datetime(record.assignment.assigned_at),
        due_at=_format_datetime(record.assignment.due_at),
        diagnostic_available=diagnostic_available,
        next_route=next_route,
    )


class StudentService:
    def __init__(
        self,
        *,
        assignments: AssignmentRepository,
        classrooms: ClassroomRepository,
    ) -> None:
        self.assignments = assignments
        self.classrooms = classrooms

    def get_home(self, *, user: User) -> StudentHomeResponse:
        membership = self.classrooms.get_primary_membership_for_user(
            user_id=user.id,
            membership_role="student",
        )
        if membership is None:
            raise ApiErrorException(
                status_code=404,
                code="MEMBERSHIP_REQUIRED",
                message="Không tìm thấy lớp học của học sinh.",
            )

        current_row = self.assignments.get_current_assignment_for_student(student_user_id=user.id)
        current_record = _to_assignment_record(current_row) if current_row is not None else None

        recent_rows = self.assignments.list_recent_assignments_for_student(
            student_user_id=user.id,
            exclude_assignment_id=current_record.assignment.id if current_record else None,
            limit=2,
        )

        return StudentHomeResponse(
            student=StudentHomeStudentResponse(
                id=user.id,
                display_name=user.display_name,
                classroom_name=membership.classroom.name,
                school_name=membership.classroom.school.name,
            ),
            current_assignment=_serialize_assignment(current_record) if current_record else None,
            recent_assignments=[
                _serialize_assignment(_to_assignment_record(row)) for row in recent_rows
            ],
        )

    def list_assignments(
        self,
        *,
        user: User,
        status: str | None,
        page: int,
        page_size: int,
    ) -> StudentAssignmentsResponse:
        if status is not None and status not in ALLOWED_ASSIGNMENT_STATUSES:
            raise ApiErrorException(
                status_code=400,
                code="INVALID_ASSIGNMENT_STATUS",
                message="Trạng thái bài được giao không hợp lệ.",
            )
        if page < 1 or page_size < 1 or page_size > 50:
            raise ApiErrorException(
                status_code=400,
                code="INVALID_PAGINATION",
                message="Tham số phân trang không hợp lệ.",
            )

        rows, total = self.assignments.list_assignments_for_student(
            student_user_id=user.id,
            status=status,
            page=page,
            page_size=page_size,
        )
        return StudentAssignmentsResponse(
            items=[_serialize_assignment(_to_assignment_record(row)) for row in rows],
            page=page,
            page_size=page_size,
            total=total,
        )
