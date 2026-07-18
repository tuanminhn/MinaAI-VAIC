from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TransferCheck(Base):
    __tablename__ = "transfer_checks"
    __table_args__ = (
        UniqueConstraint("session_id", "cycle_number", name="uq_transfer_checks_session_cycle"),
        CheckConstraint("cycle_number >= 1 AND cycle_number <= 2", name="transfer_cycle_1_2"),
        CheckConstraint(
            "status IN ('active', 'passed', 'failed')",
            name="transfer_checks_status_allowed_values",
        ),
        CheckConstraint(
            "answered_count >= 0 AND answered_count <= 2", name="transfer_answered_0_2"
        ),
        CheckConstraint("correct_count >= 0", name="transfer_correct_non_negative"),
        CheckConstraint("correct_count <= answered_count", name="transfer_correct_lte_answered"),
        Index("ix_transfer_checks_session_id", "session_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("diagnostic_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    target_skill_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("skills.id", ondelete="RESTRICT"),
        nullable=False,
    )
    cycle_number: Mapped[int] = mapped_column(nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    correct_count: Mapped[int] = mapped_column(nullable=False, default=0, server_default="0")
    answered_count: Mapped[int] = mapped_column(nullable=False, default=0, server_default="0")
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

    session = relationship("DiagnosticSession", back_populates="transfer_checks")
    target_skill = relationship("Skill")
    attempts = relationship(
        "TransferAttempt",
        back_populates="transfer_check",
        cascade="all, delete-orphan",
        order_by="TransferAttempt.sequence_number",
    )
