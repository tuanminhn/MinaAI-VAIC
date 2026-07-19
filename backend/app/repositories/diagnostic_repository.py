from __future__ import annotations

import uuid
from dataclasses import dataclass

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session, joinedload

from app.db.models.assignment import Assignment
from app.db.models.assignment_content_target import AssignmentContentTarget
from app.db.models.assignment_recipient import AssignmentRecipient
from app.db.models.diagnostic_attempt import DiagnosticAttempt
from app.db.models.diagnostic_session import DiagnosticSession
from app.db.models.diagnostic_skill_evaluation import DiagnosticSkillEvaluation
from app.db.models.learning_session_transition import LearningSessionTransition
from app.db.models.question_item import QuestionItem
from app.db.models.question_option import QuestionOption
from app.db.models.remediation_attempt import RemediationAttempt
from app.db.models.remediation_run import RemediationRun
from app.db.models.skill import Skill
from app.db.models.transfer_attempt import TransferAttempt
from app.db.models.transfer_check import TransferCheck


@dataclass
class StudentAssignmentDiagnosticRecord:
    recipient: AssignmentRecipient
    assignment: Assignment


class DiagnosticRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def add(self, instance):
        self.session.add(instance)
        return instance

    def get_assignment_for_student(
        self,
        *,
        assignment_id: uuid.UUID,
        student_user_id: uuid.UUID,
    ) -> StudentAssignmentDiagnosticRecord | None:
        statement = (
            select(AssignmentRecipient, Assignment)
            .join(Assignment, Assignment.id == AssignmentRecipient.assignment_id)
            .where(
                AssignmentRecipient.assignment_id == assignment_id,
                AssignmentRecipient.student_user_id == student_user_id,
            )
        )
        row = self.session.execute(statement).first()
        if row is None:
            return None
        return StudentAssignmentDiagnosticRecord(recipient=row[0], assignment=row[1])

    def get_assignment_for_student_with_lock(
        self,
        *,
        assignment_id: uuid.UUID,
        student_user_id: uuid.UUID,
    ) -> StudentAssignmentDiagnosticRecord | None:
        statement = (
            select(AssignmentRecipient, Assignment)
            .join(Assignment, Assignment.id == AssignmentRecipient.assignment_id)
            .where(
                AssignmentRecipient.assignment_id == assignment_id,
                AssignmentRecipient.student_user_id == student_user_id,
            )
            .with_for_update()
        )
        row = self.session.execute(statement).first()
        if row is None:
            return None
        return StudentAssignmentDiagnosticRecord(recipient=row[0], assignment=row[1])

    def list_assignment_targets(self, assignment_id: uuid.UUID) -> list[AssignmentContentTarget]:
        statement = (
            select(AssignmentContentTarget)
            .options(
                joinedload(AssignmentContentTarget.target_skill).joinedload(Skill.content_package),
                joinedload(AssignmentContentTarget.content_package),
            )
            .where(AssignmentContentTarget.assignment_id == assignment_id)
            .order_by(AssignmentContentTarget.created_at.asc())
        )
        return list(self.session.execute(statement).unique().scalars().all())

    def get_latest_session_for_recipient(
        self,
        assignment_recipient_id: uuid.UUID,
    ) -> DiagnosticSession | None:
        statement = (
            self._base_session_query()
            .where(DiagnosticSession.assignment_recipient_id == assignment_recipient_id)
            .order_by(DiagnosticSession.created_at.desc())
            .limit(1)
        )
        return self.session.execute(statement).unique().scalar_one_or_none()

    def get_latest_session_for_recipient_with_lock(
        self,
        assignment_recipient_id: uuid.UUID,
    ) -> DiagnosticSession | None:
        session_id_statement = (
            select(DiagnosticSession.id)
            .where(DiagnosticSession.assignment_recipient_id == assignment_recipient_id)
            .order_by(DiagnosticSession.created_at.desc())
            .limit(1)
            .with_for_update()
        )
        session_id = self.session.execute(session_id_statement).scalar_one_or_none()
        if session_id is None:
            return None
        return self._get_session_by_id(session_id)

    def get_session_for_student(
        self,
        *,
        session_id: uuid.UUID,
        student_user_id: uuid.UUID,
    ) -> DiagnosticSession | None:
        statement = self._base_session_query().where(
            DiagnosticSession.id == session_id,
            DiagnosticSession.student_user_id == student_user_id,
        )
        return self.session.execute(statement).unique().scalar_one_or_none()

    def get_session_for_student_with_lock(
        self,
        *,
        session_id: uuid.UUID,
        student_user_id: uuid.UUID,
    ) -> DiagnosticSession | None:
        lock_statement = (
            select(DiagnosticSession.id)
            .where(
                DiagnosticSession.id == session_id,
                DiagnosticSession.student_user_id == student_user_id,
            )
            .with_for_update()
        )
        locked_session_id = self.session.execute(lock_statement).scalar_one_or_none()
        if locked_session_id is None:
            return None
        return self._get_session_by_id(locked_session_id)

    def get_current_evaluation(self, session_id: uuid.UUID) -> DiagnosticSkillEvaluation | None:
        statement = (
            select(DiagnosticSkillEvaluation)
            .options(joinedload(DiagnosticSkillEvaluation.skill))
            .where(
                DiagnosticSkillEvaluation.session_id == session_id,
                DiagnosticSkillEvaluation.status == "current",
            )
            .limit(1)
        )
        return self.session.execute(statement).scalar_one_or_none()

    def get_evaluation(
        self,
        *,
        session_id: uuid.UUID,
        skill_id: uuid.UUID,
    ) -> DiagnosticSkillEvaluation | None:
        statement = (
            select(DiagnosticSkillEvaluation)
            .options(
                joinedload(DiagnosticSkillEvaluation.skill),
                joinedload(DiagnosticSkillEvaluation.parent_skill),
            )
            .where(
                DiagnosticSkillEvaluation.session_id == session_id,
                DiagnosticSkillEvaluation.skill_id == skill_id,
            )
        )
        return self.session.execute(statement).scalar_one_or_none()

    def list_evaluations(self, session_id: uuid.UUID) -> list[DiagnosticSkillEvaluation]:
        statement = (
            select(DiagnosticSkillEvaluation)
            .options(
                joinedload(DiagnosticSkillEvaluation.skill),
                joinedload(DiagnosticSkillEvaluation.parent_skill),
            )
            .where(DiagnosticSkillEvaluation.session_id == session_id)
            .order_by(DiagnosticSkillEvaluation.evaluation_order.asc())
        )
        return list(self.session.execute(statement).scalars().all())

    def get_next_evaluation_order(self, session_id: uuid.UUID) -> int:
        statement = select(
            func.coalesce(func.max(DiagnosticSkillEvaluation.evaluation_order), 0)
        ).where(
            DiagnosticSkillEvaluation.session_id == session_id,
        )
        return int(self.session.execute(statement).scalar_one()) + 1

    def list_attempts(self, session_id: uuid.UUID) -> list[DiagnosticAttempt]:
        statement = (
            select(DiagnosticAttempt)
            .options(
                joinedload(DiagnosticAttempt.question),
                joinedload(DiagnosticAttempt.selected_option),
            )
            .where(DiagnosticAttempt.session_id == session_id)
            .order_by(DiagnosticAttempt.sequence_number.asc())
        )
        return list(self.session.execute(statement).scalars().all())

    def get_attempt_by_client_attempt_id(
        self,
        *,
        session_id: uuid.UUID,
        client_attempt_id: str,
    ) -> DiagnosticAttempt | None:
        statement = (
            select(DiagnosticAttempt)
            .options(
                joinedload(DiagnosticAttempt.question),
                joinedload(DiagnosticAttempt.selected_option),
            )
            .where(
                DiagnosticAttempt.session_id == session_id,
                DiagnosticAttempt.client_attempt_id == client_attempt_id,
            )
        )
        return self.session.execute(statement).scalar_one_or_none()

    def get_attempt_count(self, session_id: uuid.UUID) -> int:
        statement = (
            select(func.count())
            .select_from(DiagnosticAttempt)
            .where(DiagnosticAttempt.session_id == session_id)
        )
        return int(self.session.execute(statement).scalar_one())

    def get_remediation_attempt_count(self, remediation_run_id: uuid.UUID) -> int:
        statement = (
            select(func.count())
            .select_from(RemediationAttempt)
            .where(RemediationAttempt.remediation_run_id == remediation_run_id)
        )
        return int(self.session.execute(statement).scalar_one())

    def get_transfer_attempt_count(self, transfer_check_id: uuid.UUID) -> int:
        statement = (
            select(func.count())
            .select_from(TransferAttempt)
            .where(TransferAttempt.transfer_check_id == transfer_check_id)
        )
        return int(self.session.execute(statement).scalar_one())

    def get_question_with_options(self, question_id: uuid.UUID) -> QuestionItem | None:
        statement = (
            select(QuestionItem)
            .options(
                joinedload(QuestionItem.options),
                joinedload(QuestionItem.skill),
                joinedload(QuestionItem.content_package),
            )
            .where(QuestionItem.id == question_id)
        )
        return self.session.execute(statement).unique().scalar_one_or_none()

    def get_option(self, option_id: uuid.UUID) -> QuestionOption | None:
        statement = (
            select(QuestionOption)
            .options(joinedload(QuestionOption.question))
            .where(QuestionOption.id == option_id)
        )
        return self.session.execute(statement).scalar_one_or_none()

    def list_diagnostic_questions_for_skill(self, skill_id: uuid.UUID) -> list[QuestionItem]:
        statement = (
            select(QuestionItem)
            .options(joinedload(QuestionItem.options))
            .where(
                QuestionItem.skill_id == skill_id,
                QuestionItem.is_active.is_(True),
                QuestionItem.purpose == "diagnostic",
            )
            .order_by(QuestionItem.code.asc())
        )
        return list(self.session.execute(statement).unique().scalars().all())

    def list_questions_for_skill_and_purpose(
        self,
        *,
        skill_id: uuid.UUID,
        purpose: str,
    ) -> list[QuestionItem]:
        statement = (
            select(QuestionItem)
            .options(joinedload(QuestionItem.options))
            .where(
                QuestionItem.skill_id == skill_id,
                QuestionItem.is_active.is_(True),
                QuestionItem.purpose == purpose,
            )
            .order_by(QuestionItem.code.asc())
        )
        return list(self.session.execute(statement).unique().scalars().all())

    def get_active_remediation_run(self, session_id: uuid.UUID) -> RemediationRun | None:
        statement = (
            select(RemediationRun)
            .options(
                joinedload(RemediationRun.remediation_unit),
                joinedload(RemediationRun.attempts).joinedload(RemediationAttempt.question),
                joinedload(RemediationRun.attempts).joinedload(RemediationAttempt.selected_option),
            )
            .where(
                RemediationRun.session_id == session_id,
                RemediationRun.status == "active",
            )
            .limit(1)
        )
        return self.session.execute(statement).unique().scalar_one_or_none()

    def get_active_remediation_run_with_lock(self, session_id: uuid.UUID) -> RemediationRun | None:
        run_id_statement = (
            select(RemediationRun.id)
            .where(
                RemediationRun.session_id == session_id,
                RemediationRun.status == "active",
            )
            .limit(1)
            .with_for_update()
        )
        run_id = self.session.execute(run_id_statement).scalar_one_or_none()
        if run_id is None:
            return None
        return self.get_remediation_run(run_id)

    def get_remediation_run(self, run_id: uuid.UUID) -> RemediationRun | None:
        statement = (
            select(RemediationRun)
            .options(
                joinedload(RemediationRun.remediation_unit),
                joinedload(RemediationRun.attempts).joinedload(RemediationAttempt.question),
                joinedload(RemediationRun.attempts).joinedload(RemediationAttempt.selected_option),
            )
            .where(RemediationRun.id == run_id)
        )
        return self.session.execute(statement).unique().scalar_one_or_none()

    def list_remediation_runs(self, session_id: uuid.UUID) -> list[RemediationRun]:
        statement = (
            select(RemediationRun)
            .options(joinedload(RemediationRun.remediation_unit))
            .where(RemediationRun.session_id == session_id)
            .order_by(RemediationRun.cycle_number.asc())
        )
        return list(self.session.execute(statement).unique().scalars().all())

    def get_remediation_attempt_by_client_attempt_id(
        self,
        *,
        remediation_run_id: uuid.UUID,
        client_attempt_id: str,
    ) -> RemediationAttempt | None:
        statement = (
            select(RemediationAttempt)
            .options(
                joinedload(RemediationAttempt.question),
                joinedload(RemediationAttempt.selected_option),
            )
            .where(
                RemediationAttempt.remediation_run_id == remediation_run_id,
                RemediationAttempt.client_attempt_id == client_attempt_id,
            )
        )
        return self.session.execute(statement).scalar_one_or_none()

    def list_remediation_attempts(self, remediation_run_id: uuid.UUID) -> list[RemediationAttempt]:
        statement = (
            select(RemediationAttempt)
            .options(
                joinedload(RemediationAttempt.question),
                joinedload(RemediationAttempt.selected_option),
            )
            .where(RemediationAttempt.remediation_run_id == remediation_run_id)
            .order_by(RemediationAttempt.sequence_number.asc())
        )
        return list(self.session.execute(statement).scalars().all())

    def get_active_transfer_check(self, session_id: uuid.UUID) -> TransferCheck | None:
        statement = (
            select(TransferCheck)
            .options(
                joinedload(TransferCheck.attempts).joinedload(TransferAttempt.question),
                joinedload(TransferCheck.attempts).joinedload(TransferAttempt.selected_option),
                joinedload(TransferCheck.target_skill),
            )
            .where(
                TransferCheck.session_id == session_id,
                TransferCheck.status == "active",
            )
            .limit(1)
        )
        return self.session.execute(statement).unique().scalar_one_or_none()

    def get_active_transfer_check_with_lock(self, session_id: uuid.UUID) -> TransferCheck | None:
        check_id_statement = (
            select(TransferCheck.id)
            .where(
                TransferCheck.session_id == session_id,
                TransferCheck.status == "active",
            )
            .limit(1)
            .with_for_update()
        )
        check_id = self.session.execute(check_id_statement).scalar_one_or_none()
        if check_id is None:
            return None
        return self.get_transfer_check(check_id)

    def get_transfer_check(self, check_id: uuid.UUID) -> TransferCheck | None:
        statement = (
            select(TransferCheck)
            .options(
                joinedload(TransferCheck.attempts).joinedload(TransferAttempt.question),
                joinedload(TransferCheck.attempts).joinedload(TransferAttempt.selected_option),
                joinedload(TransferCheck.target_skill),
            )
            .where(TransferCheck.id == check_id)
        )
        return self.session.execute(statement).unique().scalar_one_or_none()

    def list_transfer_checks(self, session_id: uuid.UUID) -> list[TransferCheck]:
        statement = (
            select(TransferCheck)
            .options(joinedload(TransferCheck.target_skill))
            .where(TransferCheck.session_id == session_id)
            .order_by(TransferCheck.cycle_number.asc())
        )
        return list(self.session.execute(statement).unique().scalars().all())

    def get_transfer_attempt_by_client_attempt_id(
        self,
        *,
        transfer_check_id: uuid.UUID,
        client_attempt_id: str,
    ) -> TransferAttempt | None:
        statement = (
            select(TransferAttempt)
            .options(
                joinedload(TransferAttempt.question),
                joinedload(TransferAttempt.selected_option),
            )
            .where(
                TransferAttempt.transfer_check_id == transfer_check_id,
                TransferAttempt.client_attempt_id == client_attempt_id,
            )
        )
        return self.session.execute(statement).scalar_one_or_none()

    def list_transfer_attempts(self, transfer_check_id: uuid.UUID) -> list[TransferAttempt]:
        statement = (
            select(TransferAttempt)
            .options(
                joinedload(TransferAttempt.question),
                joinedload(TransferAttempt.selected_option),
            )
            .where(TransferAttempt.transfer_check_id == transfer_check_id)
            .order_by(TransferAttempt.sequence_number.asc())
        )
        return list(self.session.execute(statement).scalars().all())

    def list_transitions(self, session_id: uuid.UUID) -> list[LearningSessionTransition]:
        statement = (
            select(LearningSessionTransition)
            .options(joinedload(LearningSessionTransition.skill))
            .where(LearningSessionTransition.session_id == session_id)
            .order_by(LearningSessionTransition.created_at.asc())
        )
        return list(self.session.execute(statement).unique().scalars().all())

    @staticmethod
    def _base_session_query() -> Select[tuple[DiagnosticSession]]:
        return select(DiagnosticSession).options(
            joinedload(DiagnosticSession.assignment_recipient).joinedload(
                AssignmentRecipient.assignment
            ),
            joinedload(DiagnosticSession.target_skill),
            joinedload(DiagnosticSession.current_skill),
            joinedload(DiagnosticSession.root_cause_skill),
            joinedload(DiagnosticSession.skill_evaluations).joinedload(
                DiagnosticSkillEvaluation.skill
            ),
            joinedload(DiagnosticSession.skill_evaluations).joinedload(
                DiagnosticSkillEvaluation.parent_skill
            ),
            joinedload(DiagnosticSession.remediation_runs).joinedload(
                RemediationRun.remediation_unit
            ),
            joinedload(DiagnosticSession.remediation_runs)
            .joinedload(RemediationRun.attempts)
            .joinedload(RemediationAttempt.question),
            joinedload(DiagnosticSession.remediation_runs)
            .joinedload(RemediationRun.attempts)
            .joinedload(RemediationAttempt.selected_option),
            joinedload(DiagnosticSession.transfer_checks).joinedload(TransferCheck.target_skill),
            joinedload(DiagnosticSession.transfer_checks)
            .joinedload(TransferCheck.attempts)
            .joinedload(TransferAttempt.question),
            joinedload(DiagnosticSession.transfer_checks)
            .joinedload(TransferCheck.attempts)
            .joinedload(TransferAttempt.selected_option),
            joinedload(DiagnosticSession.transitions).joinedload(LearningSessionTransition.skill),
        )

    def _get_session_by_id(self, session_id: uuid.UUID) -> DiagnosticSession | None:
        statement = self._base_session_query().where(DiagnosticSession.id == session_id)
        return self.session.execute(statement).unique().scalar_one_or_none()
