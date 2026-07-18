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
    TeacherInterventionResponse,
    TeacherInterventionsResponse,
    TeacherStudentMasteryResponse,
    TeacherStudentProfileResponse,
    TeacherStudentSessionResponse,
    TeacherSupportGroupResponse,
    TeacherSupportGroupsResponse,
    TeacherCreateAssignmentRequest,
    TeacherCreateAssignmentResponse,
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

    def create_assignment(self, *, user: User, class_id: uuid.UUID, payload: TeacherCreateAssignmentRequest) -> TeacherCreateAssignmentResponse:
        result = self.teacher_repository.create_assignment_for_class(
            teacher_user_id=user.id, class_id=class_id, title=payload.title,
            description=payload.description, target_skill_code=payload.target_skill_code,
            estimated_minutes=payload.estimated_minutes, due_at=payload.due_at, publish=payload.publish,
        )
        if result is None:
            raise ApiErrorException(404, "CLASSROOM_NOT_FOUND", "Không tìm thấy lớp học.")
        if result == "skill_not_found":
            raise ApiErrorException(400, "TARGET_SKILL_NOT_FOUND", "Không tìm thấy kỹ năng mục tiêu đã chọn.")
        assignment, student_count = result
        return TeacherCreateAssignmentResponse(id=assignment.id, title=assignment.title, status=assignment.status, student_count=student_count)

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

    def list_support_groups(self, *, user: User) -> TeacherSupportGroupsResponse:
        rows = self.teacher_repository.list_support_groups(teacher_user_id=user.id)
        return TeacherSupportGroupsResponse(items=[
            TeacherSupportGroupResponse(
                skill_id=row.skill_id,
                skill_name=row.skill_name,
                student_count=row.student_count,
                needs_support_count=row.needs_support_count or 0,
                classroom_names=sorted(row.classroom_names or []),
            ) for row in rows
        ])

    def list_interventions(self, *, user: User) -> TeacherInterventionsResponse:
        items = []
        for row in self.teacher_repository.list_interventions(teacher_user_id=user.id):
            needs_support = row.outcome == "needs_teacher_support"
            priority_score = 100 if needs_support else 70 if row.state == "in_remediation" else 50
            skill_label = row.root_cause_skill_name or "kỹ năng mục tiêu"
            reason = (
                f"Đã hoàn thành nhưng chưa vượt qua kiểm tra chuyển giao ở {skill_label}."
                if needs_support
                else f"Đang cần củng cố {skill_label} và chưa hoàn thành lộ trình."
            )
            items.append(TeacherInterventionResponse(
                student_id=row.student_id, student_name=row.student_name,
                classroom_name=row.classroom_name, assignment_id=row.assignment_id,
                assignment_title=row.assignment_title, session_id=row.session_id,
                root_cause_skill_name=row.root_cause_skill_name,
                priority="high" if priority_score >= 90 else "medium",
                priority_score=priority_score, reason=reason, updated_at=row.updated_at,
            ))
        return TeacherInterventionsResponse(items=items)

    def get_student_profile(self, *, user: User, student_id: uuid.UUID) -> TeacherStudentProfileResponse:
        result = self.teacher_repository.get_student_profile(
            teacher_user_id=user.id, student_user_id=student_id
        )
        if result is None:
            raise ApiErrorException(404, "STUDENT_NOT_FOUND", "Không tìm thấy học sinh trong lớp phụ trách.")
        identity, mastery_rows, session_rows = result
        student, classroom, school = identity
        return TeacherStudentProfileResponse(
            id=student.id, display_name=student.display_name,
            classroom_name=classroom.name, school_name=school.name,
            masteries=[TeacherStudentMasteryResponse(
                skill_id=mastery.skill_id, skill_name=skill.name, status=mastery.status,
                mastery_score=mastery.mastery_score, confidence=mastery.confidence,
                evidence_count=mastery.evidence_count, last_evaluated_at=mastery.last_evaluated_at,
            ) for mastery, skill in mastery_rows],
            recent_sessions=[TeacherStudentSessionResponse(
                session_id=session.id, assignment_id=assignment.id,
                assignment_title=assignment.title, state=session.state,
                outcome=_to_teacher_outcome(session.outcome),
                root_cause_skill_name=root_name, updated_at=session.updated_at,
            ) for session, assignment, root_name in session_rows],
        )
