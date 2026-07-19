from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
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


class DiagnosticAttempt(Base):
    __tablename__ = "diagnostic_attempts"
    __table_args__ = (
        UniqueConstraint(
            "session_id",
            "client_attempt_id",
            name="uq_diagnostic_attempts_session_client_attempt",
        ),
        UniqueConstraint(
            "session_id",
            "question_id",
            name="uq_diagnostic_attempts_session_question",
        ),
        CheckConstraint(
            "sequence_number >= 1",
            name="diagnostic_attempts_sequence_number_positive",
        ),
        Index("ix_diagnostic_attempts_session_id", "session_id"),
        Index("ix_diagnostic_attempts_question_id", "question_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("diagnostic_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    skill_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("skills.id", ondelete="RESTRICT"),
        nullable=False,
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("question_items.id", ondelete="RESTRICT"),
        nullable=False,
    )
    selected_option_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("question_options.id", ondelete="RESTRICT"),
        nullable=False,
    )
    client_attempt_id: Mapped[str] = mapped_column(String(100), nullable=False)
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    session = relationship("DiagnosticSession", back_populates="attempts")
    skill = relationship("Skill")
    question = relationship("QuestionItem")
    selected_option = relationship("QuestionOption")
