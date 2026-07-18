from __future__ import annotations

import uuid

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session, joinedload

from app.db.models.assignment import Assignment
from app.db.models.assignment_recipient import AssignmentRecipient
from app.db.models.classroom import Classroom
from app.db.models.diagnostic_session import DiagnosticSession
from app.db.models.school import School


class AssignmentRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_classroom_and_title(
        self,
        *,
        classroom_id: uuid.UUID,
        title: str,
    ) -> Assignment | None:
        statement = select(Assignment).where(
            Assignment.classroom_id == classroom_id,
            Assignment.title == title,
        )
        return self.session.execute(statement).scalar_one_or_none()

    def add(self, assignment: Assignment) -> Assignment:
        self.session.add(assignment)
        return assignment

    def get_recipient(
        self,
        *,
        assignment_id: uuid.UUID,
        student_user_id: uuid.UUID,
    ) -> AssignmentRecipient | None:
        statement = select(AssignmentRecipient).where(
            AssignmentRecipient.assignment_id == assignment_id,
            AssignmentRecipient.student_user_id == student_user_id,
        )
        return self.session.execute(statement).scalar_one_or_none()

    def get_recipient_with_assignment(
        self,
        *,
        assignment_id: uuid.UUID,
        student_user_id: uuid.UUID,
    ):
        statement = (
            select(AssignmentRecipient, Assignment, Classroom, School)
            .join(Assignment, Assignment.id == AssignmentRecipient.assignment_id)
            .join(Classroom, Classroom.id == Assignment.classroom_id)
            .join(School, School.id == Classroom.school_id)
            .options(
                joinedload(AssignmentRecipient.diagnostic_sessions),
                joinedload(Assignment.content_targets),
            )
            .where(
                AssignmentRecipient.assignment_id == assignment_id,
                AssignmentRecipient.student_user_id == student_user_id,
            )
        )
        return self.session.execute(statement).first()

    def add_recipient(self, recipient: AssignmentRecipient) -> AssignmentRecipient:
        self.session.add(recipient)
        return recipient

    def get_current_assignment_for_student(self, *, student_user_id: uuid.UUID):
        statement = (
            select(AssignmentRecipient, Assignment, Classroom, School)
            .join(Assignment, Assignment.id == AssignmentRecipient.assignment_id)
            .join(Classroom, Classroom.id == Assignment.classroom_id)
            .join(School, School.id == Classroom.school_id)
            .options(
                joinedload(AssignmentRecipient.diagnostic_sessions),
                joinedload(Assignment.content_targets),
            )
            .where(
                AssignmentRecipient.student_user_id == student_user_id,
                Assignment.status == "published",
            )
            .order_by(
                case((AssignmentRecipient.status == "completed", 1), else_=0).asc(),
                case((Assignment.due_at.is_(None), 1), else_=0).asc(),
                Assignment.due_at.asc(),
                Assignment.assigned_at.desc(),
            )
            .limit(1)
        )
        return self.session.execute(statement).unique().first()

    def list_recent_assignments_for_student(
        self,
        *,
        student_user_id: uuid.UUID,
        exclude_assignment_id: uuid.UUID | None,
        limit: int,
    ):
        statement = (
            select(AssignmentRecipient, Assignment, Classroom, School)
            .join(Assignment, Assignment.id == AssignmentRecipient.assignment_id)
            .join(Classroom, Classroom.id == Assignment.classroom_id)
            .join(School, School.id == Classroom.school_id)
            .options(
                joinedload(AssignmentRecipient.diagnostic_sessions),
                joinedload(Assignment.content_targets),
            )
            .where(
                AssignmentRecipient.student_user_id == student_user_id,
                Assignment.status == "published",
            )
            .order_by(Assignment.assigned_at.desc(), Assignment.created_at.desc())
            .limit(limit)
        )
        if exclude_assignment_id is not None:
            statement = statement.where(Assignment.id != exclude_assignment_id)
        return self.session.execute(statement).unique().all()

    def list_assignments_for_student(
        self,
        *,
        student_user_id: uuid.UUID,
        status: str | None,
        page: int,
        page_size: int,
    ):
        filters = [
            AssignmentRecipient.student_user_id == student_user_id,
            Assignment.status == "published",
        ]
        if status is not None:
            filters.append(AssignmentRecipient.status == status)

        count_statement = (
            select(func.count())
            .select_from(AssignmentRecipient)
            .join(Assignment, Assignment.id == AssignmentRecipient.assignment_id)
            .where(*filters)
        )
        total = self.session.execute(count_statement).scalar_one()

        statement = (
            select(AssignmentRecipient, Assignment, Classroom, School)
            .join(Assignment, Assignment.id == AssignmentRecipient.assignment_id)
            .join(Classroom, Classroom.id == Assignment.classroom_id)
            .join(School, School.id == Classroom.school_id)
            .options(
                joinedload(AssignmentRecipient.diagnostic_sessions),
                joinedload(Assignment.content_targets),
            )
            .where(*filters)
            .order_by(Assignment.assigned_at.desc(), Assignment.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return self.session.execute(statement).unique().all(), total

    def get_latest_diagnostic_session_for_recipient(
        self,
        *,
        assignment_recipient_id: uuid.UUID,
    ) -> DiagnosticSession | None:
        statement = (
            select(DiagnosticSession)
            .where(DiagnosticSession.assignment_recipient_id == assignment_recipient_id)
            .order_by(DiagnosticSession.created_at.desc())
            .limit(1)
        )
        return self.session.execute(statement).scalar_one_or_none()
