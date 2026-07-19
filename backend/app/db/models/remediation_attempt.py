from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RemediationAttempt(Base):
    __tablename__ = "remediation_attempts"
    __table_args__ = (
        UniqueConstraint(
            "remediation_run_id",
            "client_attempt_id",
            name="uq_remediation_attempts_run_client_attempt",
        ),
        UniqueConstraint(
            "remediation_run_id",
            "question_id",
            name="uq_remediation_attempts_run_question",
        ),
        Index("ix_remediation_attempts_run_id", "remediation_run_id"),
        Index("ix_remediation_attempts_question_id", "question_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    remediation_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("remediation_runs.id", ondelete="CASCADE"),
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
    sequence_number: Mapped[int] = mapped_column(nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    remediation_run = relationship("RemediationRun", back_populates="attempts")
    question = relationship("QuestionItem")
    selected_option = relationship("QuestionOption")
