from __future__ import annotations

import uuid

from app.api.errors import ApiErrorException
from app.db.models.user import User
from app.repositories.classroom_repository import ClassroomRepository
from app.repositories.teacher_repository import TeacherRepository
from app.schemas.teacher import (
    TeacherAssignmentOverviewAssignmentResponse,
    TeacherAssignmentOverviewCountsResponse,
    TeacherAssignmentOverviewResponse,
    TeacherAssignmentStudentInfoResponse,
    TeacherAssignmentStudentRowResponse,
    TeacherAssignmentStudentsResponse,
    TeacherAssignmentSummaryResponse,
    TeacherClassAssignmentsResponse,
    TeacherEvidenceAssignmentResponse,
    TeacherEvidenceAttemptResponse,
    TeacherEvidenceRootCauseResponse,
    TeacherEvidenceStudentResponse,
    TeacherLearningSessionEvidenceResponse,
    TeacherRootCauseGroupResponse,
    TeacherTimelineEventResponse,
)


def _to_teacher_outcome(value: str | None) -> str | None:
    mapping = {
        "mastered_without_remediation": "masteredWithoutRemediation",
        "mastered_after_remediation": "masteredAfterRemediation",
        "needs_teacher_support": "needsTeacherSupport",
    }
    if value is None:
        return None
    return mapping[value]


class TeacherAnalyticsService:
    def __init__(
        self,
        *,
        teacher_repository: TeacherRepository,
        classrooms: ClassroomRepository,
    ) -> None:
        self.teacher_repository = teacher_repository
        self.classrooms = classrooms

    def list_class_assignments(
        self,
        *,
        user: User,
        class_id: uuid.UUID,
    ) -> TeacherClassAssignmentsResponse:
        rows = self.teacher_repository.list_class_assignments(
            teacher_user_id=user.id,
            class_id=class_id,
        )
        detail = self.classrooms.get_teacher_class_detail(
            teacher_user_id=user.id,
            class_id=class_id,
        )
        if detail is None:
            raise ApiErrorException(
                status_code=404,
                code="CLASSROOM_NOT_FOUND",
                message="Không tìm thấy lớp học.",
            )

        return TeacherClassAssignmentsResponse(
            items=[
                TeacherAssignmentSummaryResponse(
                    id=assignment.id,
                    title=assignment.title,
                    status=assignment.status,
                    student_count=student_count,
                    assigned_at=assignment.assigned_at,
                    due_at=assignment.due_at,
                )
                for assignment, student_count in rows
            ]
        )

    def get_assignment_overview(
        self,
        *,
        user: User,
        assignment_id: uuid.UUID,
    ) -> TeacherAssignmentOverviewResponse:
        assignment_row = self.teacher_repository.get_authorized_assignment(
            teacher_user_id=user.id,
            assignment_id=assignment_id,
        )
        if assignment_row is None:
            raise ApiErrorException(
                status_code=404,
                code="ASSIGNMENT_NOT_FOUND",
                message="Không tìm thấy bài được giao.",
            )

        assignment, classroom, _school = assignment_row
        counts_row = self.teacher_repository.get_assignment_overview_counts(
            teacher_user_id=user.id,
            assignment_id=assignment_id,
        )
        root_cause_rows = self.teacher_repository.list_assignment_root_cause_groups(
            teacher_user_id=user.id,
            assignment_id=assignment_id,
        )

        return TeacherAssignmentOverviewResponse(
            assignment=TeacherAssignmentOverviewAssignmentResponse(
                id=assignment.id,
                title=assignment.title,
                classroom_name=classroom.name,
            ),
            counts=TeacherAssignmentOverviewCountsResponse(
                not_started=counts_row.not_started or 0,
                diagnosing=counts_row.diagnosing or 0,
                in_remediation=counts_row.in_remediation or 0,
                completed=counts_row.completed or 0,
                needs_support=counts_row.needs_support or 0,
            ),
            root_cause_groups=[
                TeacherRootCauseGroupResponse(
                    skill_name=row.skill_name,
                    student_count=row.student_count,
                )
                for row in root_cause_rows
            ],
        )

    def list_assignment_students(
        self,
        *,
        user: User,
        assignment_id: uuid.UUID,
        page: int,
        page_size: int,
    ) -> TeacherAssignmentStudentsResponse:
        assignment_row = self.teacher_repository.get_authorized_assignment(
            teacher_user_id=user.id,
            assignment_id=assignment_id,
        )
        if assignment_row is None:
            raise ApiErrorException(
                status_code=404,
                code="ASSIGNMENT_NOT_FOUND",
                message="Không tìm thấy bài được giao.",
            )

        rows, total = self.teacher_repository.list_assignment_students(
            teacher_user_id=user.id,
            assignment_id=assignment_id,
            page=page,
            page_size=page_size,
        )
        return TeacherAssignmentStudentsResponse(
            items=[
                TeacherAssignmentStudentRowResponse(
                    student=TeacherAssignmentStudentInfoResponse(
                        id=row.student_id,
                        display_name=row.display_name,
                    ),
                    session_id=row.session_id,
                    assignment_status=row.assignment_status,
                    session_state=row.session_state,
                    outcome=_to_teacher_outcome(row.outcome),
                    root_cause_skill_name=row.root_cause_skill_name,
                    diagnostic_attempts=row.diagnostic_attempts,
                    remediation_attempts=row.remediation_attempts,
                    transfer_attempts=row.transfer_attempts,
                    updated_at=row.updated_at,
                )
                for row in rows
            ],
            page=page,
            page_size=page_size,
            total=total,
        )

    def get_learning_session_evidence(
        self,
        *,
        user: User,
        session_id: uuid.UUID,
    ) -> TeacherLearningSessionEvidenceResponse:
        row = self.teacher_repository.get_authorized_learning_session(
            teacher_user_id=user.id,
            session_id=session_id,
        )
        if row is None:
            raise ApiErrorException(
                status_code=404,
                code="DIAGNOSTIC_SESSION_NOT_FOUND",
                message="Không tìm thấy phiên học tập.",
            )

        diagnostic_session, assignment, _recipient, student, _classroom = row
        transitions = self.teacher_repository.list_learning_session_transitions(
            session_id=session_id
        )
        attempts = self.teacher_repository.list_learning_session_attempts(session_id=session_id)

        root_cause = None
        if diagnostic_session.root_cause_skill is not None:
            root_cause = TeacherEvidenceRootCauseResponse(
                name=diagnostic_session.root_cause_skill.name
            )

        return TeacherLearningSessionEvidenceResponse(
            student=TeacherEvidenceStudentResponse(
                id=student.id,
                display_name=student.display_name,
            ),
            assignment=TeacherEvidenceAssignmentResponse(
                id=assignment.id,
                title=assignment.title,
            ),
            state=diagnostic_session.state,
            outcome=_to_teacher_outcome(diagnostic_session.outcome),
            root_cause=root_cause,
            timeline=[
                TeacherTimelineEventResponse(
                    from_state=item.from_state,
                    to_state=item.to_state,
                    reason_code=item.reason_code,
                    skill_name=item.skill_name,
                    created_at=item.created_at,
                )
                for item in transitions
            ],
            attempts=[
                TeacherEvidenceAttemptResponse(
                    phase=item.phase,
                    question_prompt=item.question_prompt,
                    selected_option_label=item.selected_option_label,
                    is_correct=item.is_correct,
                    skill_name=item.skill_name,
                    answered_at=item.answered_at,
                )
                for item in attempts
            ],
        )
