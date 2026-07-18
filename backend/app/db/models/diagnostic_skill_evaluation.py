from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class DiagnosticSkillEvaluation(Base):
    __tablename__ = "diagnostic_skill_evaluations"
    __table_args__ = (
        UniqueConstraint(
            "session_id",
            "skill_id",
            name="uq_diagnostic_skill_evaluations_session_skill",
        ),
        CheckConstraint(
            "status IN ('pending', 'current', 'passed', 'failed', 'root_cause')",
            name="diagnostic_skill_evaluations_status_allowed_values",
        ),
        CheckConstraint(
            "answered_count >= 0 AND answered_count <= 2",
            name="diagnostic_skill_evaluations_answered_count_between_0_and_2",
        ),
        CheckConstraint(
            "correct_count >= 0 AND correct_count <= answered_count",
            name="diagnostic_skill_evaluations_correct_count_valid",
        ),
        CheckConstraint(
            "evaluation_order >= 1",
            name="diagnostic_skill_evaluations_evaluation_order_positive",
        ),
        Index("ix_diagnostic_skill_evaluations_session_id", "session_id"),
        Index("ix_diagnostic_skill_evaluations_skill_id", "skill_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("diagnostic_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    skill_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("skills.id", ondelete="CASCADE"),
        nullable=False,
    )
    parent_skill_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("skills.id", ondelete="SET NULL"),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    answered_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    correct_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    evaluation_order: Mapped[int] = mapped_column(Integer, nullable=False)
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

    session = relationship("DiagnosticSession", back_populates="skill_evaluations")
    skill = relationship("Skill", foreign_keys=[skill_id])
    parent_skill = relationship("Skill", foreign_keys=[parent_skill_id])
