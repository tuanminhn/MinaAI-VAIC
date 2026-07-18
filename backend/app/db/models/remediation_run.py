from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RemediationRun(Base):
    __tablename__ = "remediation_runs"
    __table_args__ = (
        UniqueConstraint("session_id", "cycle_number", name="uq_remediation_runs_session_cycle"),
        CheckConstraint("cycle_number >= 1 AND cycle_number <= 2", name="remediation_cycle_1_2"),
        CheckConstraint(
            "status IN ('active', 'completed')",
            name="remediation_runs_status_allowed_values",
        ),
        Index("ix_remediation_runs_session_id", "session_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("diagnostic_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    remediation_unit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("remediation_units.id", ondelete="RESTRICT"),
        nullable=False,
    )
    cycle_number: Mapped[int] = mapped_column(nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
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

    session = relationship("DiagnosticSession", back_populates="remediation_runs")
    remediation_unit = relationship("RemediationUnit")
    attempts = relationship(
        "RemediationAttempt",
        back_populates="remediation_run",
        cascade="all, delete-orphan",
        order_by="RemediationAttempt.sequence_number",
    )
