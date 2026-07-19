"""create school assignment core

Revision ID: 20260718_0003
Revises: 20260718_0002
Create Date: 2026-07-18 15:00:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "20260718_0003"
down_revision = "20260718_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "schools",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_schools")),
        sa.UniqueConstraint("code", name=op.f("uq_schools_code")),
    )
    op.create_table(
        "classrooms",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("school_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("grade", sa.Integer(), nullable=False),
        sa.Column("academic_year", sa.String(length=20), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "grade >= 1 AND grade <= 12", name="ck_classrooms_grade_between_1_and_12"
        ),
        sa.ForeignKeyConstraint(
            ["school_id"],
            ["schools.id"],
            ondelete="CASCADE",
            name=op.f("fk_classrooms_school_id_schools"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_classrooms")),
        sa.UniqueConstraint(
            "school_id",
            "code",
            "academic_year",
            name="uq_classrooms_school_code_year",
        ),
    )
    op.create_table(
        "classroom_memberships",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("classroom_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("membership_role", sa.String(length=20), nullable=False),
        sa.Column("is_primary", sa.Boolean(), server_default="false", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "membership_role IN ('student', 'teacher')",
            name="ck_classroom_memberships_membership_role_allowed_values",
        ),
        sa.ForeignKeyConstraint(
            ["classroom_id"],
            ["classrooms.id"],
            ondelete="CASCADE",
            name=op.f("fk_classroom_memberships_classroom_id_classrooms"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
            name=op.f("fk_classroom_memberships_user_id_users"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_classroom_memberships")),
        sa.UniqueConstraint(
            "classroom_id",
            "user_id",
            name="uq_classroom_memberships_classroom_user",
        ),
    )
    op.create_index(
        "ix_classroom_memberships_classroom_id",
        "classroom_memberships",
        ["classroom_id"],
        unique=False,
    )
    op.create_index(
        "ix_classroom_memberships_user_id",
        "classroom_memberships",
        ["user_id"],
        unique=False,
    )
    op.create_table(
        "assignments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("classroom_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("estimated_minutes", sa.Integer(), nullable=True),
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "estimated_minutes IS NULL OR (estimated_minutes >= 1 AND estimated_minutes <= 240)",
            name="ck_assignments_estimated_minutes_between_1_and_240",
        ),
        sa.CheckConstraint(
            "status IN ('draft', 'published', 'archived')",
            name="ck_assignments_status_allowed_values",
        ),
        sa.ForeignKeyConstraint(
            ["classroom_id"],
            ["classrooms.id"],
            ondelete="CASCADE",
            name=op.f("fk_assignments_classroom_id_classrooms"),
        ),
        sa.ForeignKeyConstraint(
            ["created_by_user_id"],
            ["users.id"],
            ondelete="RESTRICT",
            name=op.f("fk_assignments_created_by_user_id_users"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_assignments")),
    )
    op.create_index(
        op.f("ix_assignments_classroom_id"), "assignments", ["classroom_id"], unique=False
    )
    op.create_index(op.f("ix_assignments_status"), "assignments", ["status"], unique=False)
    op.create_table(
        "assignment_recipients",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assignment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("student_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("progress_completed", sa.Integer(), server_default="0", nullable=False),
        sa.Column("progress_total", sa.Integer(), server_default="0", nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "progress_completed >= 0",
            name="ck_assignment_recipients_progress_completed_non_negative",
        ),
        sa.CheckConstraint(
            "progress_completed <= progress_total",
            name="ck_assignment_recipients_progress_completed_lte_total",
        ),
        sa.CheckConstraint(
            "progress_total >= 0",
            name="ck_assignment_recipients_progress_total_non_negative",
        ),
        sa.CheckConstraint(
            "status IN ("
            "'not_started', 'in_progress', 'remediation', 'transfer_ready', 'completed'"
            ")",
            name="ck_assignment_recipients_status_allowed_values",
        ),
        sa.ForeignKeyConstraint(
            ["assignment_id"],
            ["assignments.id"],
            ondelete="CASCADE",
            name=op.f("fk_assignment_recipients_assignment_id_assignments"),
        ),
        sa.ForeignKeyConstraint(
            ["student_user_id"],
            ["users.id"],
            ondelete="CASCADE",
            name=op.f("fk_assignment_recipients_student_user_id_users"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_assignment_recipients")),
        sa.UniqueConstraint(
            "assignment_id",
            "student_user_id",
            name="uq_assignment_recipients_assignment_student",
        ),
    )
    op.create_index(
        op.f("ix_assignment_recipients_assignment_id"),
        "assignment_recipients",
        ["assignment_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_assignment_recipients_status"),
        "assignment_recipients",
        ["status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_assignment_recipients_student_user_id"),
        "assignment_recipients",
        ["student_user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_assignment_recipients_student_user_id"), table_name="assignment_recipients"
    )
    op.drop_index(op.f("ix_assignment_recipients_status"), table_name="assignment_recipients")
    op.drop_index(
        op.f("ix_assignment_recipients_assignment_id"), table_name="assignment_recipients"
    )
    op.drop_table("assignment_recipients")
    op.drop_index(op.f("ix_assignments_status"), table_name="assignments")
    op.drop_index(op.f("ix_assignments_classroom_id"), table_name="assignments")
    op.drop_table("assignments")
    op.drop_index("ix_classroom_memberships_user_id", table_name="classroom_memberships")
    op.drop_index("ix_classroom_memberships_classroom_id", table_name="classroom_memberships")
    op.drop_table("classroom_memberships")
    op.drop_table("classrooms")
    op.drop_table("schools")
