"""create diagnostic engine

Revision ID: 20260718_0005
Revises: 20260718_0004
Create Date: 2026-07-18 22:10:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "20260718_0005"
down_revision = "20260718_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "diagnostic_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assignment_recipient_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("student_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("target_skill_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("current_skill_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("root_cause_skill_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("state", sa.String(length=30), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
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
            (
                "state IN "
                "('diagnosing', 'gap_confirmed', 'in_remediation', "
                "'transfer_ready', 'completed')"
            ),
            name="diagnostic_sessions_state_allowed_values",
        ),
        sa.ForeignKeyConstraint(
            ["assignment_recipient_id"],
            ["assignment_recipients.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(["student_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["target_skill_id"], ["skills.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["current_skill_id"], ["skills.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["root_cause_skill_id"], ["skills.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_diagnostic_sessions")),
    )
    op.create_index(
        "ix_diagnostic_sessions_assignment_recipient_id",
        "diagnostic_sessions",
        ["assignment_recipient_id"],
        unique=False,
    )
    op.create_index(
        "ix_diagnostic_sessions_student_user_id",
        "diagnostic_sessions",
        ["student_user_id"],
        unique=False,
    )
    op.create_index("ix_diagnostic_sessions_state", "diagnostic_sessions", ["state"], unique=False)
    op.create_index(
        "uq_diagnostic_sessions_active_recipient",
        "diagnostic_sessions",
        ["assignment_recipient_id"],
        unique=True,
        postgresql_where=sa.text("state = 'diagnosing'"),
    )

    op.create_table(
        "diagnostic_skill_evaluations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("skill_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("parent_skill_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("answered_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("correct_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("evaluation_order", sa.Integer(), nullable=False),
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
            "status IN ('pending', 'current', 'passed', 'failed', 'root_cause')",
            name="diagnostic_skill_evaluations_status_allowed_values",
        ),
        sa.CheckConstraint(
            "answered_count >= 0 AND answered_count <= 2",
            name="diagnostic_skill_evaluations_answered_count_between_0_and_2",
        ),
        sa.CheckConstraint(
            "correct_count >= 0 AND correct_count <= answered_count",
            name="diagnostic_skill_evaluations_correct_count_valid",
        ),
        sa.CheckConstraint(
            "evaluation_order >= 1",
            name="diagnostic_skill_evaluations_evaluation_order_positive",
        ),
        sa.ForeignKeyConstraint(["session_id"], ["diagnostic_sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["skill_id"], ["skills.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["parent_skill_id"], ["skills.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_diagnostic_skill_evaluations")),
        sa.UniqueConstraint(
            "session_id",
            "skill_id",
            name="uq_diagnostic_skill_evaluations_session_skill",
        ),
    )
    op.create_index(
        "ix_diagnostic_skill_evaluations_session_id",
        "diagnostic_skill_evaluations",
        ["session_id"],
        unique=False,
    )
    op.create_index(
        "ix_diagnostic_skill_evaluations_skill_id",
        "diagnostic_skill_evaluations",
        ["skill_id"],
        unique=False,
    )

    op.create_table(
        "diagnostic_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("skill_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("question_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("selected_option_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("client_attempt_id", sa.String(length=100), nullable=False),
        sa.Column("sequence_number", sa.Integer(), nullable=False),
        sa.Column("is_correct", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "sequence_number >= 1",
            name="diagnostic_attempts_sequence_number_positive",
        ),
        sa.ForeignKeyConstraint(["session_id"], ["diagnostic_sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["skill_id"], ["skills.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["question_id"], ["question_items.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(
            ["selected_option_id"], ["question_options.id"], ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_diagnostic_attempts")),
        sa.UniqueConstraint(
            "session_id",
            "client_attempt_id",
            name="uq_diagnostic_attempts_session_client_attempt",
        ),
        sa.UniqueConstraint(
            "session_id",
            "question_id",
            name="uq_diagnostic_attempts_session_question",
        ),
    )
    op.create_index(
        "ix_diagnostic_attempts_session_id",
        "diagnostic_attempts",
        ["session_id"],
        unique=False,
    )
    op.create_index(
        "ix_diagnostic_attempts_question_id",
        "diagnostic_attempts",
        ["question_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_diagnostic_attempts_question_id", table_name="diagnostic_attempts")
    op.drop_index("ix_diagnostic_attempts_session_id", table_name="diagnostic_attempts")
    op.drop_table("diagnostic_attempts")
    op.drop_index(
        "ix_diagnostic_skill_evaluations_skill_id",
        table_name="diagnostic_skill_evaluations",
    )
    op.drop_index(
        "ix_diagnostic_skill_evaluations_session_id",
        table_name="diagnostic_skill_evaluations",
    )
    op.drop_table("diagnostic_skill_evaluations")
    op.drop_index("uq_diagnostic_sessions_active_recipient", table_name="diagnostic_sessions")
    op.drop_index("ix_diagnostic_sessions_state", table_name="diagnostic_sessions")
    op.drop_index("ix_diagnostic_sessions_student_user_id", table_name="diagnostic_sessions")
    op.drop_index(
        "ix_diagnostic_sessions_assignment_recipient_id",
        table_name="diagnostic_sessions",
    )
    op.drop_table("diagnostic_sessions")
