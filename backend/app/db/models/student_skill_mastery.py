from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Float, ForeignKey, Index, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class StudentSkillMastery(Base):
    __tablename__ = "student_skill_masteries"
    __table_args__ = (
        UniqueConstraint("student_user_id", "skill_id", name="uq_student_skill_masteries_student_skill"),
        CheckConstraint("mastery_score >= 0 AND mastery_score <= 1", name="mastery_score_between_0_and_1"),
        CheckConstraint("confidence >= 0 AND confidence <= 1", name="confidence_between_0_and_1"),
        CheckConstraint("evidence_count >= 0", name="evidence_count_non_negative"),
        CheckConstraint(
            "status IN ('unknown', 'diagnosing', 'learning', 'practicing', 'mastered', 'needs_review', 'needs_teacher_support')",
            name="status_allowed_values",
        ),
        Index("ix_student_skill_masteries_student_user_id", "student_user_id"),
        Index("ix_student_skill_masteries_skill_id", "skill_id"),
        Index("ix_student_skill_masteries_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    skill_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="unknown")
    mastery_score: Mapped[float] = mapped_column(Float, nullable=False, default=0, server_default="0")
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0, server_default="0")
    evidence_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    last_evaluated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    student_user = relationship("User")
    skill = relationship("Skill")
