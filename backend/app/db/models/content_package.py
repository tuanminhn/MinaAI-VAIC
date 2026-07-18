from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ContentPackage(Base):
    __tablename__ = "content_packages"
    __table_args__ = (
        CheckConstraint("subject IN ('math')", name="subject_allowed_values"),
        CheckConstraint("grade >= 1 AND grade <= 12", name="grade_between_1_and_12"),
        CheckConstraint(
            "status IN ('draft', 'reviewed', 'published')",
            name="status_allowed_values",
        ),
        Index("ix_content_packages_subject", "subject"),
        Index("ix_content_packages_grade", "grade"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    subject: Mapped[str] = mapped_column(String(20), nullable=False)
    grade: Mapped[int] = mapped_column(Integer, nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    skills = relationship("Skill", back_populates="content_package")
    question_items = relationship("QuestionItem", back_populates="content_package")
    remediation_units = relationship("RemediationUnit", back_populates="content_package")
    assignment_targets = relationship("AssignmentContentTarget", back_populates="content_package")
