"""create curriculum content

Revision ID: 20260718_0004
Revises: 20260718_0003
Create Date: 2026-07-18 18:30:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "20260718_0004"
down_revision = "20260718_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "content_packages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(length=100), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("subject", sa.String(length=20), nullable=False),
        sa.Column("grade", sa.Integer(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
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
            "grade >= 1 AND grade <= 12", name="ck_content_packages_grade_between_1_and_12"
        ),
        sa.CheckConstraint(
            "status IN ('draft', 'reviewed', 'published')",
            name="ck_content_packages_status_allowed_values",
        ),
        sa.CheckConstraint(
            "subject IN ('math')", name="ck_content_packages_subject_allowed_values"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_content_packages")),
        sa.UniqueConstraint("code", name=op.f("uq_content_packages_code")),
    )
    op.create_index("ix_content_packages_grade", "content_packages", ["grade"], unique=False)
    op.create_index("ix_content_packages_subject", "content_packages", ["subject"], unique=False)

    op.create_table(
        "skills",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("content_package_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(length=150), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("grade", sa.Integer(), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
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
        sa.CheckConstraint("grade >= 1 AND grade <= 12", name="ck_skills_grade_between_1_and_12"),
        sa.CheckConstraint("sort_order >= 0", name="ck_skills_sort_order_non_negative"),
        sa.ForeignKeyConstraint(
            ["content_package_id"],
            ["content_packages.id"],
            ondelete="CASCADE",
            name=op.f("fk_skills_content_package_id_content_packages"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_skills")),
        sa.UniqueConstraint("code", name=op.f("uq_skills_code")),
    )
    op.create_index("ix_skills_content_package_id", "skills", ["content_package_id"], unique=False)

    op.create_table(
        "skill_prerequisites",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("skill_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("prerequisite_skill_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("priority", sa.Integer(), server_default="1", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.CheckConstraint("priority > 0", name="ck_skill_prerequisites_priority_positive"),
        sa.CheckConstraint(
            "skill_id <> prerequisite_skill_id", name="ck_skill_prerequisites_not_self_prerequisite"
        ),
        sa.ForeignKeyConstraint(
            ["prerequisite_skill_id"],
            ["skills.id"],
            ondelete="CASCADE",
            name=op.f("fk_skill_prerequisites_prerequisite_skill_id_skills"),
        ),
        sa.ForeignKeyConstraint(
            ["skill_id"],
            ["skills.id"],
            ondelete="CASCADE",
            name=op.f("fk_skill_prerequisites_skill_id_skills"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_skill_prerequisites")),
        sa.UniqueConstraint(
            "skill_id", "prerequisite_skill_id", name="uq_skill_prerequisites_edge"
        ),
    )
    op.create_index(
        "ix_skill_prerequisites_prerequisite_skill_id",
        "skill_prerequisites",
        ["prerequisite_skill_id"],
        unique=False,
    )
    op.create_index(
        "ix_skill_prerequisites_skill_id", "skill_prerequisites", ["skill_id"], unique=False
    )

    op.create_table(
        "misconceptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("skill_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(length=150), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("teacher_note", sa.Text(), nullable=True),
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
        sa.ForeignKeyConstraint(
            ["skill_id"],
            ["skills.id"],
            ondelete="CASCADE",
            name=op.f("fk_misconceptions_skill_id_skills"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_misconceptions")),
        sa.UniqueConstraint("code", name=op.f("uq_misconceptions_code")),
    )
    op.create_index("ix_misconceptions_skill_id", "misconceptions", ["skill_id"], unique=False)

    op.create_table(
        "question_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("content_package_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("skill_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("misconception_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("code", sa.String(length=150), nullable=False),
        sa.Column("purpose", sa.String(length=20), nullable=False),
        sa.Column("question_type", sa.String(length=30), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("difficulty", sa.Integer(), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=True),
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
            "difficulty >= 1 AND difficulty <= 3",
            name="ck_question_items_difficulty_between_1_and_3",
        ),
        sa.CheckConstraint(
            "purpose IN ('diagnostic', 'remediation', 'transfer')",
            name="ck_question_items_purpose_allowed_values",
        ),
        sa.CheckConstraint(
            "question_type IN ('single_choice')",
            name="ck_question_items_question_type_allowed_values",
        ),
        sa.ForeignKeyConstraint(
            ["content_package_id"],
            ["content_packages.id"],
            ondelete="CASCADE",
            name=op.f("fk_question_items_content_package_id_content_packages"),
        ),
        sa.ForeignKeyConstraint(
            ["misconception_id"],
            ["misconceptions.id"],
            ondelete="SET NULL",
            name=op.f("fk_question_items_misconception_id_misconceptions"),
        ),
        sa.ForeignKeyConstraint(
            ["skill_id"],
            ["skills.id"],
            ondelete="CASCADE",
            name=op.f("fk_question_items_skill_id_skills"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_question_items")),
        sa.UniqueConstraint("code", name=op.f("uq_question_items_code")),
    )
    op.create_index(
        "ix_question_items_misconception_id", "question_items", ["misconception_id"], unique=False
    )
    op.create_index("ix_question_items_purpose", "question_items", ["purpose"], unique=False)
    op.create_index("ix_question_items_skill_id", "question_items", ["skill_id"], unique=False)

    op.create_table(
        "question_options",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("question_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(length=30), nullable=False),
        sa.Column("label", sa.Text(), nullable=False),
        sa.Column("is_correct", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("feedback", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.CheckConstraint("sort_order >= 0", name="ck_question_options_sort_order_non_negative"),
        sa.ForeignKeyConstraint(
            ["question_id"],
            ["question_items.id"],
            ondelete="CASCADE",
            name=op.f("fk_question_options_question_id_question_items"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_question_options")),
        sa.UniqueConstraint("question_id", "code", name="uq_question_options_question_code"),
    )
    op.create_index(
        "ix_question_options_question_id", "question_options", ["question_id"], unique=False
    )

    op.create_table(
        "remediation_units",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("content_package_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("skill_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("misconception_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("code", sa.String(length=150), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=False),
        sa.Column("worked_example", sa.Text(), nullable=False),
        sa.Column("practice_instruction", sa.Text(), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
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
        sa.CheckConstraint("sort_order >= 0", name="ck_remediation_units_sort_order_non_negative"),
        sa.ForeignKeyConstraint(
            ["content_package_id"],
            ["content_packages.id"],
            ondelete="CASCADE",
            name=op.f("fk_remediation_units_content_package_id_content_packages"),
        ),
        sa.ForeignKeyConstraint(
            ["misconception_id"],
            ["misconceptions.id"],
            ondelete="SET NULL",
            name=op.f("fk_remediation_units_misconception_id_misconceptions"),
        ),
        sa.ForeignKeyConstraint(
            ["skill_id"],
            ["skills.id"],
            ondelete="CASCADE",
            name=op.f("fk_remediation_units_skill_id_skills"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_remediation_units")),
        sa.UniqueConstraint("code", name=op.f("uq_remediation_units_code")),
    )
    op.create_index(
        "ix_remediation_units_skill_id", "remediation_units", ["skill_id"], unique=False
    )

    op.create_table(
        "assignment_content_targets",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assignment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("content_package_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("target_skill_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["assignment_id"],
            ["assignments.id"],
            ondelete="CASCADE",
            name=op.f("fk_assignment_content_targets_assignment_id_assignments"),
        ),
        sa.ForeignKeyConstraint(
            ["content_package_id"],
            ["content_packages.id"],
            ondelete="CASCADE",
            name=op.f("fk_assignment_content_targets_content_package_id_content_packages"),
        ),
        sa.ForeignKeyConstraint(
            ["target_skill_id"],
            ["skills.id"],
            ondelete="CASCADE",
            name=op.f("fk_assignment_content_targets_target_skill_id_skills"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_assignment_content_targets")),
        sa.UniqueConstraint(
            "assignment_id",
            "target_skill_id",
            name="uq_assignment_content_targets_assignment_skill",
        ),
    )
    op.create_index(
        "ix_assignment_content_targets_assignment_id",
        "assignment_content_targets",
        ["assignment_id"],
        unique=False,
    )
    op.create_index(
        "ix_assignment_content_targets_target_skill_id",
        "assignment_content_targets",
        ["target_skill_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_assignment_content_targets_target_skill_id", table_name="assignment_content_targets"
    )
    op.drop_index(
        "ix_assignment_content_targets_assignment_id", table_name="assignment_content_targets"
    )
    op.drop_table("assignment_content_targets")
    op.drop_index("ix_remediation_units_skill_id", table_name="remediation_units")
    op.drop_table("remediation_units")
    op.drop_index("ix_question_options_question_id", table_name="question_options")
    op.drop_table("question_options")
    op.drop_index("ix_question_items_skill_id", table_name="question_items")
    op.drop_index("ix_question_items_purpose", table_name="question_items")
    op.drop_index("ix_question_items_misconception_id", table_name="question_items")
    op.drop_table("question_items")
    op.drop_index("ix_misconceptions_skill_id", table_name="misconceptions")
    op.drop_table("misconceptions")
    op.drop_index("ix_skill_prerequisites_skill_id", table_name="skill_prerequisites")
    op.drop_index("ix_skill_prerequisites_prerequisite_skill_id", table_name="skill_prerequisites")
    op.drop_table("skill_prerequisites")
    op.drop_index("ix_skills_content_package_id", table_name="skills")
    op.drop_table("skills")
    op.drop_index("ix_content_packages_subject", table_name="content_packages")
    op.drop_index("ix_content_packages_grade", table_name="content_packages")
    op.drop_table("content_packages")
