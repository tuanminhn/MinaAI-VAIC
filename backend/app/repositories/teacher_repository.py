from __future__ import annotations

import uuid

from sqlalchemy import and_, case, func, literal, select
from sqlalchemy.orm import Session

from app.db.models.assignment import Assignment
from app.db.models.assignment_recipient import AssignmentRecipient
from app.db.models.classroom import Classroom
from app.db.models.classroom_membership import ClassroomMembership
from app.db.models.diagnostic_attempt import DiagnosticAttempt
from app.db.models.diagnostic_session import DiagnosticSession
from app.db.models.learning_session_transition import LearningSessionTransition
from app.db.models.question_item import QuestionItem
from app.db.models.question_option import QuestionOption
from app.db.models.remediation_attempt import RemediationAttempt
from app.db.models.remediation_run import RemediationRun
from app.db.models.school import School
from app.db.models.skill import Skill
from app.db.models.transfer_attempt import TransferAttempt
from app.db.models.transfer_check import TransferCheck
from app.db.models.user import User


def _latest_session_subquery():
    return select(
        DiagnosticSession.id.label("session_id"),
        DiagnosticSession.assignment_recipient_id.label("assignment_recipient_id"),
        DiagnosticSession.student_user_id.label("student_user_id"),
        DiagnosticSession.state.label("state"),
        DiagnosticSession.outcome.label("outcome"),
        DiagnosticSession.root_cause_skill_id.label("root_cause_skill_id"),
        DiagnosticSession.updated_at.label("updated_at"),
        func.row_number()
        .over(
            partition_by=DiagnosticSession.assignment_recipient_id,
            order_by=(DiagnosticSession.created_at.desc(), DiagnosticSession.id.desc()),
        )
        .label("row_number"),
    ).subquery()


class TeacherRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_class_assignments(
        self,
        *,
        teacher_user_id: uuid.UUID,
        class_id: uuid.UUID,
    ):
        teacher_membership = ClassroomMembership.__table__.alias("teacher_membership")

        statement = (
            select(
                Assignment,
                func.count(AssignmentRecipient.id).label("student_count"),
            )
            .join(Classroom, Classroom.id == Assignment.classroom_id)
            .join(
                teacher_membership,
                and_(
                    teacher_membership.c.classroom_id == Classroom.id,
                    teacher_membership.c.user_id == teacher_user_id,
                    teacher_membership.c.membership_role == "teacher",
                ),
            )
            .outerjoin(
                AssignmentRecipient,
                AssignmentRecipient.assignment_id == Assignment.id,
            )
            .where(Assignment.classroom_id == class_id)
            .group_by(Assignment.id)
            .order_by(Assignment.assigned_at.desc(), Assignment.created_at.desc())
        )
        return self.session.execute(statement).all()

    def get_authorized_assignment(
        self,
        *,
        teacher_user_id: uuid.UUID,
        assignment_id: uuid.UUID,
    ):
        teacher_membership = ClassroomMembership.__table__.alias("teacher_membership")

        statement = (
            select(Assignment, Classroom, School)
            .join(Classroom, Classroom.id == Assignment.classroom_id)
            .join(School, School.id == Classroom.school_id)
            .join(
                teacher_membership,
                and_(
                    teacher_membership.c.classroom_id == Classroom.id,
                    teacher_membership.c.user_id == teacher_user_id,
                    teacher_membership.c.membership_role == "teacher",
                ),
            )
            .where(Assignment.id == assignment_id)
            .limit(1)
        )
        return self.session.execute(statement).first()

    def get_assignment_overview_counts(
        self,
        *,
        teacher_user_id: uuid.UUID,
        assignment_id: uuid.UUID,
    ):
        teacher_membership = ClassroomMembership.__table__.alias("teacher_membership")
        latest_session = _latest_session_subquery()

        statement = (
            select(
                func.sum(case((AssignmentRecipient.status == "not_started", 1), else_=0)).label(
                    "not_started"
                ),
                func.sum(case((latest_session.c.state == "diagnosing", 1), else_=0)).label(
                    "diagnosing"
                ),
                func.sum(
                    case(
                        (
                            latest_session.c.state.in_(
                                ("gap_confirmed", "in_remediation", "transfer_ready")
                            ),
                            1,
                        ),
                        else_=0,
                    )
                ).label("in_remediation"),
                func.sum(
                    case(
                        (
                            and_(
                                latest_session.c.state == "completed",
                                latest_session.c.outcome != "needs_teacher_support",
                            ),
                            1,
                        ),
                        else_=0,
                    )
                ).label("completed"),
                func.sum(
                    case(
                        (
                            and_(
                                latest_session.c.state == "completed",
                                latest_session.c.outcome == "needs_teacher_support",
                            ),
                            1,
                        ),
                        else_=0,
                    )
                ).label("needs_support"),
            )
            .select_from(AssignmentRecipient)
            .join(Assignment, Assignment.id == AssignmentRecipient.assignment_id)
            .join(Classroom, Classroom.id == Assignment.classroom_id)
            .join(
                teacher_membership,
                and_(
                    teacher_membership.c.classroom_id == Classroom.id,
                    teacher_membership.c.user_id == teacher_user_id,
                    teacher_membership.c.membership_role == "teacher",
                ),
            )
            .outerjoin(
                latest_session,
                and_(
                    latest_session.c.assignment_recipient_id == AssignmentRecipient.id,
                    latest_session.c.row_number == 1,
                ),
            )
            .where(Assignment.id == assignment_id)
        )
        return self.session.execute(statement).one()

    def list_assignment_root_cause_groups(
        self,
        *,
        teacher_user_id: uuid.UUID,
        assignment_id: uuid.UUID,
    ):
        teacher_membership = ClassroomMembership.__table__.alias("teacher_membership")
        latest_session = _latest_session_subquery()

        statement = (
            select(
                Skill.name.label("skill_name"),
                func.count(AssignmentRecipient.id).label("student_count"),
            )
            .select_from(AssignmentRecipient)
            .join(Assignment, Assignment.id == AssignmentRecipient.assignment_id)
            .join(Classroom, Classroom.id == Assignment.classroom_id)
            .join(
                teacher_membership,
                and_(
                    teacher_membership.c.classroom_id == Classroom.id,
                    teacher_membership.c.user_id == teacher_user_id,
                    teacher_membership.c.membership_role == "teacher",
                ),
            )
            .join(
                latest_session,
                and_(
                    latest_session.c.assignment_recipient_id == AssignmentRecipient.id,
                    latest_session.c.row_number == 1,
                    latest_session.c.root_cause_skill_id.is_not(None),
                ),
            )
            .join(Skill, Skill.id == latest_session.c.root_cause_skill_id)
            .where(Assignment.id == assignment_id)
            .group_by(Skill.id, Skill.name)
            .order_by(func.count(AssignmentRecipient.id).desc(), Skill.name.asc())
        )
        return self.session.execute(statement).all()

    def list_assignment_students(
        self,
        *,
        teacher_user_id: uuid.UUID,
        assignment_id: uuid.UUID,
        page: int,
        page_size: int,
    ):
        teacher_membership = ClassroomMembership.__table__.alias("teacher_membership")
        latest_session = _latest_session_subquery()
        root_cause_skill = Skill.__table__.alias("root_cause_skill")

        diagnostic_counts = (
            select(
                DiagnosticAttempt.session_id.label("session_id"),
                func.count(DiagnosticAttempt.id).label("diagnostic_attempts"),
            )
            .group_by(DiagnosticAttempt.session_id)
            .subquery()
        )
        remediation_counts = (
            select(
                RemediationRun.session_id.label("session_id"),
                func.count(RemediationAttempt.id).label("remediation_attempts"),
            )
            .select_from(RemediationRun)
            .outerjoin(
                RemediationAttempt,
                RemediationAttempt.remediation_run_id == RemediationRun.id,
            )
            .group_by(RemediationRun.session_id)
            .subquery()
        )
        transfer_counts = (
            select(
                TransferCheck.session_id.label("session_id"),
                func.count(TransferAttempt.id).label("transfer_attempts"),
            )
            .select_from(TransferCheck)
            .outerjoin(
                TransferAttempt,
                TransferAttempt.transfer_check_id == TransferCheck.id,
            )
            .group_by(TransferCheck.session_id)
            .subquery()
        )

        base_filters = [
            Assignment.id == assignment_id,
            teacher_membership.c.user_id == teacher_user_id,
            teacher_membership.c.membership_role == "teacher",
        ]

        total_statement = (
            select(func.count())
            .select_from(AssignmentRecipient)
            .join(Assignment, Assignment.id == AssignmentRecipient.assignment_id)
            .join(Classroom, Classroom.id == Assignment.classroom_id)
            .join(
                teacher_membership,
                teacher_membership.c.classroom_id == Classroom.id,
            )
            .where(*base_filters)
        )
        total = self.session.execute(total_statement).scalar_one()

        statement = (
            select(
                User.id.label("student_id"),
                User.display_name.label("display_name"),
                latest_session.c.session_id.label("session_id"),
                AssignmentRecipient.status.label("assignment_status"),
                latest_session.c.state.label("session_state"),
                latest_session.c.outcome.label("outcome"),
                root_cause_skill.c.name.label("root_cause_skill_name"),
                func.coalesce(diagnostic_counts.c.diagnostic_attempts, 0).label(
                    "diagnostic_attempts"
                ),
                func.coalesce(remediation_counts.c.remediation_attempts, 0).label(
                    "remediation_attempts"
                ),
                func.coalesce(transfer_counts.c.transfer_attempts, 0).label("transfer_attempts"),
                func.coalesce(latest_session.c.updated_at, AssignmentRecipient.updated_at).label(
                    "updated_at"
                ),
            )
            .select_from(AssignmentRecipient)
            .join(Assignment, Assignment.id == AssignmentRecipient.assignment_id)
            .join(Classroom, Classroom.id == Assignment.classroom_id)
            .join(
                teacher_membership,
                teacher_membership.c.classroom_id == Classroom.id,
            )
            .join(User, User.id == AssignmentRecipient.student_user_id)
            .outerjoin(
                latest_session,
                and_(
                    latest_session.c.assignment_recipient_id == AssignmentRecipient.id,
                    latest_session.c.row_number == 1,
                ),
            )
            .outerjoin(
                root_cause_skill,
                root_cause_skill.c.id == latest_session.c.root_cause_skill_id,
            )
            .outerjoin(
                diagnostic_counts,
                diagnostic_counts.c.session_id == latest_session.c.session_id,
            )
            .outerjoin(
                remediation_counts,
                remediation_counts.c.session_id == latest_session.c.session_id,
            )
            .outerjoin(
                transfer_counts,
                transfer_counts.c.session_id == latest_session.c.session_id,
            )
            .where(*base_filters)
            .order_by(User.display_name.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return self.session.execute(statement).all(), total

    def get_authorized_learning_session(
        self,
        *,
        teacher_user_id: uuid.UUID,
        session_id: uuid.UUID,
    ):
        teacher_membership = ClassroomMembership.__table__.alias("teacher_membership")

        statement = (
            select(
                DiagnosticSession,
                Assignment,
                AssignmentRecipient,
                User,
                Classroom,
            )
            .join(
                AssignmentRecipient,
                AssignmentRecipient.id == DiagnosticSession.assignment_recipient_id,
            )
            .join(Assignment, Assignment.id == AssignmentRecipient.assignment_id)
            .join(Classroom, Classroom.id == Assignment.classroom_id)
            .join(User, User.id == AssignmentRecipient.student_user_id)
            .join(
                teacher_membership,
                and_(
                    teacher_membership.c.classroom_id == Classroom.id,
                    teacher_membership.c.user_id == teacher_user_id,
                    teacher_membership.c.membership_role == "teacher",
                ),
            )
            .where(DiagnosticSession.id == session_id)
            .limit(1)
        )
        return self.session.execute(statement).first()

    def list_learning_session_transitions(self, *, session_id: uuid.UUID):
        skill_alias = Skill.__table__.alias("transition_skill")

        statement = (
            select(
                LearningSessionTransition.from_state,
                LearningSessionTransition.to_state,
                LearningSessionTransition.reason_code,
                skill_alias.c.name.label("skill_name"),
                LearningSessionTransition.created_at,
            )
            .select_from(LearningSessionTransition)
            .outerjoin(skill_alias, skill_alias.c.id == LearningSessionTransition.skill_id)
            .where(LearningSessionTransition.session_id == session_id)
            .order_by(
                LearningSessionTransition.created_at.asc(),
                LearningSessionTransition.id.asc(),
            )
        )
        return self.session.execute(statement).all()

    def list_learning_session_attempts(self, *, session_id: uuid.UUID):
        diagnostic_statement = (
            select(
                literal("diagnostic").label("phase"),
                QuestionItem.prompt.label("question_prompt"),
                QuestionOption.label.label("selected_option_label"),
                DiagnosticAttempt.is_correct.label("is_correct"),
                Skill.name.label("skill_name"),
                DiagnosticAttempt.created_at.label("answered_at"),
            )
            .select_from(DiagnosticAttempt)
            .join(QuestionItem, QuestionItem.id == DiagnosticAttempt.question_id)
            .join(QuestionOption, QuestionOption.id == DiagnosticAttempt.selected_option_id)
            .join(Skill, Skill.id == DiagnosticAttempt.skill_id)
            .where(DiagnosticAttempt.session_id == session_id)
        )
        remediation_statement = (
            select(
                literal("remediation").label("phase"),
                QuestionItem.prompt.label("question_prompt"),
                QuestionOption.label.label("selected_option_label"),
                RemediationAttempt.is_correct.label("is_correct"),
                Skill.name.label("skill_name"),
                RemediationAttempt.created_at.label("answered_at"),
            )
            .select_from(RemediationAttempt)
            .join(RemediationRun, RemediationRun.id == RemediationAttempt.remediation_run_id)
            .join(QuestionItem, QuestionItem.id == RemediationAttempt.question_id)
            .join(QuestionOption, QuestionOption.id == RemediationAttempt.selected_option_id)
            .join(Skill, Skill.id == QuestionItem.skill_id)
            .where(RemediationRun.session_id == session_id)
        )
        transfer_statement = (
            select(
                literal("transfer").label("phase"),
                QuestionItem.prompt.label("question_prompt"),
                QuestionOption.label.label("selected_option_label"),
                TransferAttempt.is_correct.label("is_correct"),
                Skill.name.label("skill_name"),
                TransferAttempt.created_at.label("answered_at"),
            )
            .select_from(TransferAttempt)
            .join(TransferCheck, TransferCheck.id == TransferAttempt.transfer_check_id)
            .join(QuestionItem, QuestionItem.id == TransferAttempt.question_id)
            .join(QuestionOption, QuestionOption.id == TransferAttempt.selected_option_id)
            .join(Skill, Skill.id == QuestionItem.skill_id)
            .where(TransferCheck.session_id == session_id)
        )

        union_subquery = diagnostic_statement.union_all(
            remediation_statement,
            transfer_statement,
        ).subquery()
        wrapped = select(
            union_subquery.c.phase,
            union_subquery.c.question_prompt,
            union_subquery.c.selected_option_label,
            union_subquery.c.is_correct,
            union_subquery.c.skill_name,
            union_subquery.c.answered_at,
        ).order_by(union_subquery.c.answered_at.asc(), union_subquery.c.phase.asc())
        return self.session.execute(wrapped).all()
