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
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Skill(Base):
    __tablename__ = "skills"
    __table_args__ = (
        CheckConstraint("grade >= 1 AND grade <= 12", name="grade_between_1_and_12"),
        CheckConstraint("sort_order >= 0", name="sort_order_non_negative"),
        Index("ix_skills_content_package_id", "content_package_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content_package_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("content_packages.id", ondelete="CASCADE"),
        nullable=False,
    )
    code: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    grade: Mapped[int] = mapped_column(Integer, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    content_package = relationship("ContentPackage", back_populates="skills")
    prerequisite_edges = relationship(
        "SkillPrerequisite",
        foreign_keys="SkillPrerequisite.skill_id",
        back_populates="skill",
        cascade="all, delete-orphan",
    )
    prerequisite_for_edges = relationship(
        "SkillPrerequisite",
        foreign_keys="SkillPrerequisite.prerequisite_skill_id",
        back_populates="prerequisite_skill",
        cascade="all, delete-orphan",
    )
    misconceptions = relationship("Misconception", back_populates="skill")
    question_items = relationship("QuestionItem", back_populates="skill")
    remediation_units = relationship("RemediationUnit", back_populates="skill")
    assignment_targets = relationship("AssignmentContentTarget", back_populates="target_skill")
    diagnostic_sessions_as_target = relationship(
        "DiagnosticSession",
        foreign_keys="DiagnosticSession.target_skill_id",
        viewonly=True,
    )
