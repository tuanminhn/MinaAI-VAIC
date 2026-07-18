from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class SkillPrerequisite(Base):
    __tablename__ = "skill_prerequisites"
    __table_args__ = (
        CheckConstraint("priority > 0", name="priority_positive"),
        CheckConstraint("skill_id <> prerequisite_skill_id", name="not_self_prerequisite"),
        UniqueConstraint("skill_id", "prerequisite_skill_id", name="uq_skill_prerequisites_edge"),
        Index("ix_skill_prerequisites_skill_id", "skill_id"),
        Index("ix_skill_prerequisites_prerequisite_skill_id", "prerequisite_skill_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    skill_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("skills.id", ondelete="CASCADE"),
        nullable=False,
    )
    prerequisite_skill_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("skills.id", ondelete="CASCADE"),
        nullable=False,
    )
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    skill = relationship("Skill", foreign_keys=[skill_id], back_populates="prerequisite_edges")
    prerequisite_skill = relationship(
        "Skill",
        foreign_keys=[prerequisite_skill_id],
        back_populates="prerequisite_for_edges",
    )
