from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AssignmentRecipient(Base):
    __tablename__ = "assignment_recipients"
    __table_args__ = (
        UniqueConstraint(
            "assignment_id",
            "student_user_id",
            name="uq_assignment_recipients_assignment_student",
        ),
        CheckConstraint(
            "status IN ("
            "'not_started', 'in_progress', 'remediation', 'transfer_ready', 'completed'"
            ")",
            name="status_allowed_values",
        ),
        CheckConstraint("progress_completed >= 0", name="progress_completed_non_negative"),
        CheckConstraint("progress_total >= 0", name="progress_total_non_negative"),
        CheckConstraint(
            "progress_completed <= progress_total", name="progress_completed_lte_total"
        ),
        Index("ix_assignment_recipients_student_user_id", "student_user_id"),
        Index("ix_assignment_recipients_assignment_id", "assignment_id"),
        Index("ix_assignment_recipients_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    assignment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("assignments.id", ondelete="CASCADE"),
        nullable=False,
    )
    student_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    progress_completed: Mapped[int] = mapped_column(nullable=False, default=0, server_default="0")
    progress_total: Mapped[int] = mapped_column(nullable=False, default=0, server_default="0")
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
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

    assignment = relationship("Assignment", back_populates="recipients")
    student_user = relationship("User", back_populates="assignment_recipients")
    diagnostic_sessions = relationship(
        "DiagnosticSession",
        back_populates="assignment_recipient",
        cascade="all, delete-orphan",
        order_by="DiagnosticSession.created_at.desc()",
    )
