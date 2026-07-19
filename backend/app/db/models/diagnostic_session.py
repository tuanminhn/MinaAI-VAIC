from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class DiagnosticSession(Base):
    __tablename__ = "diagnostic_sessions"
    __table_args__ = (
        CheckConstraint(
            "state IN ("
            "'diagnosing', 'gap_confirmed', 'in_remediation', 'transfer_ready', 'completed'"
            ")",
            name="diagnostic_sessions_state_allowed_values",
        ),
        CheckConstraint(
            "outcome IS NULL OR outcome IN ("
            "'mastered_without_remediation', 'mastered_after_remediation', "
            "'needs_teacher_support'"
            ")",
            name="diagnostic_sessions_outcome_allowed_values",
        ),
        CheckConstraint(
            "remediation_cycle_count >= 0 AND remediation_cycle_count <= 2",
            name="diagnostic_sessions_remediation_cycles_0_2",
        ),
        CheckConstraint(
            "transfer_cycle_count >= 0 AND transfer_cycle_count <= 2",
            name="diagnostic_sessions_transfer_cycles_0_2",
        ),
        CheckConstraint(
            "(outcome IS NULL AND state != 'completed') OR "
            "(outcome IS NOT NULL AND state = 'completed')",
            name="diagnostic_sessions_outcome_matches_completed_state",
        ),
        Index("ix_diagnostic_sessions_assignment_recipient_id", "assignment_recipient_id"),
        Index("ix_diagnostic_sessions_student_user_id", "student_user_id"),
        Index("ix_diagnostic_sessions_state", "state"),
        Index("ix_diagnostic_sessions_outcome", "outcome"),
        Index(
            "uq_diagnostic_sessions_active_recipient",
            "assignment_recipient_id",
            unique=True,
            postgresql_where=text("state = 'diagnosing'"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assignment_recipient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("assignment_recipients.id", ondelete="CASCADE"),
        nullable=False,
    )
    student_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    target_skill_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("skills.id", ondelete="RESTRICT"),
        nullable=False,
    )
    current_skill_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("skills.id", ondelete="RESTRICT"),
        nullable=True,
    )
    root_cause_skill_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("skills.id", ondelete="RESTRICT"),
        nullable=True,
    )
    state: Mapped[str] = mapped_column(String(30), nullable=False)
    outcome: Mapped[str | None] = mapped_column(String(40), nullable=True)
    remediation_cycle_count: Mapped[int] = mapped_column(
        nullable=False,
        default=0,
        server_default="0",
    )
    transfer_cycle_count: Mapped[int] = mapped_column(
        nullable=False,
        default=0,
        server_default="0",
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    assignment_recipient = relationship("AssignmentRecipient", back_populates="diagnostic_sessions")
    student_user = relationship("User", back_populates="diagnostic_sessions")
    target_skill = relationship("Skill", foreign_keys=[target_skill_id])
    current_skill = relationship("Skill", foreign_keys=[current_skill_id])
    root_cause_skill = relationship("Skill", foreign_keys=[root_cause_skill_id])
    skill_evaluations = relationship(
        "DiagnosticSkillEvaluation",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="DiagnosticSkillEvaluation.evaluation_order",
    )
    attempts = relationship(
        "DiagnosticAttempt",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="DiagnosticAttempt.sequence_number",
    )
    remediation_runs = relationship(
        "RemediationRun",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="RemediationRun.cycle_number",
    )
    transfer_checks = relationship(
        "TransferCheck",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="TransferCheck.cycle_number",
    )
    transitions = relationship(
        "LearningSessionTransition",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="LearningSessionTransition.created_at",
    )
