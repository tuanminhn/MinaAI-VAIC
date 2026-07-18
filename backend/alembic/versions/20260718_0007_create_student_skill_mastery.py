"""Create persistent student skill mastery records.

Revision ID: 20260718_0007
Revises: 20260718_0006
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260718_0007"
down_revision: str | None = "20260718_0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "student_skill_masteries",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("student_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("skill_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("mastery_score", sa.Float(), server_default="0", nullable=False),
        sa.Column("confidence", sa.Float(), server_default="0", nullable=False),
        sa.Column("evidence_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("last_evaluated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("mastery_score >= 0 AND mastery_score <= 1", name=op.f("ck_student_skill_masteries_mastery_score_between_0_and_1")),
        sa.CheckConstraint("confidence >= 0 AND confidence <= 1", name=op.f("ck_student_skill_masteries_confidence_between_0_and_1")),
        sa.CheckConstraint("evidence_count >= 0", name=op.f("ck_student_skill_masteries_evidence_count_non_negative")),
        sa.CheckConstraint("status IN ('unknown', 'diagnosing', 'learning', 'practicing', 'mastered', 'needs_review', 'needs_teacher_support')", name=op.f("ck_student_skill_masteries_status_allowed_values")),
        sa.ForeignKeyConstraint(["skill_id"], ["skills.id"], name=op.f("fk_student_skill_masteries_skill_id_skills"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["student_user_id"], ["users.id"], name=op.f("fk_student_skill_masteries_student_user_id_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_student_skill_masteries")),
        sa.UniqueConstraint("student_user_id", "skill_id", name="uq_student_skill_masteries_student_skill"),
    )
    op.create_index(op.f("ix_student_skill_masteries_student_user_id"), "student_skill_masteries", ["student_user_id"])
    op.create_index(op.f("ix_student_skill_masteries_skill_id"), "student_skill_masteries", ["skill_id"])
    op.create_index(op.f("ix_student_skill_masteries_status"), "student_skill_masteries", ["status"])


def downgrade() -> None:
    op.drop_index(op.f("ix_student_skill_masteries_status"), table_name="student_skill_masteries")
    op.drop_index(op.f("ix_student_skill_masteries_skill_id"), table_name="student_skill_masteries")
    op.drop_index(op.f("ix_student_skill_masteries_student_user_id"), table_name="student_skill_masteries")
    op.drop_table("student_skill_masteries")
