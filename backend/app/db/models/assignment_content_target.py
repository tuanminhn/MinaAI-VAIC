from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AssignmentContentTarget(Base):
    __tablename__ = "assignment_content_targets"
    __table_args__ = (
        UniqueConstraint(
            "assignment_id",
            "target_skill_id",
            name="uq_assignment_content_targets_assignment_skill",
        ),
        Index("ix_assignment_content_targets_assignment_id", "assignment_id"),
        Index("ix_assignment_content_targets_target_skill_id", "target_skill_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assignment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("assignments.id", ondelete="CASCADE"),
        nullable=False,
    )
    content_package_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("content_packages.id", ondelete="CASCADE"),
        nullable=False,
    )
    target_skill_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("skills.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    assignment = relationship("Assignment", back_populates="content_targets")
    content_package = relationship("ContentPackage", back_populates="assignment_targets")
    target_skill = relationship("Skill", back_populates="assignment_targets")
