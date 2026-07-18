"""create remediation transfer flow

Revision ID: 20260718_0006
Revises: 20260718_0005
Create Date: 2026-07-18 23:10:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "20260718_0006"
down_revision = "20260718_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "diagnostic_sessions",
        sa.Column("outcome", sa.String(length=40), nullable=True),
    )
    op.add_column(
        "diagnostic_sessions",
        sa.Column(
            "remediation_cycle_count",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
    )
    op.add_column(
        "diagnostic_sessions",
        sa.Column(
            "transfer_cycle_count",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
    )
    op.create_index(
        "ix_diagnostic_sessions_outcome",
        "diagnostic_sessions",
        ["outcome"],
        unique=False,
    )
    op.create_check_constraint(
        "diagnostic_sessions_outcome_allowed_values",
        "diagnostic_sessions",
        (
            "outcome IS NULL OR outcome IN "
            "('mastered_without_remediation', 'mastered_after_remediation', "
            "'needs_teacher_support')"
        ),
    )
    op.create_check_constraint(
        "diagnostic_sessions_remediation_cycles_0_2",
        "diagnostic_sessions",
        "remediation_cycle_count >= 0 AND remediation_cycle_count <= 2",
    )
    op.create_check_constraint(
        "diagnostic_sessions_transfer_cycles_0_2",
        "diagnostic_sessions",
        "transfer_cycle_count >= 0 AND transfer_cycle_count <= 2",
    )
    op.create_check_constraint(
        "diagnostic_sessions_outcome_matches_completed_state",
        "diagnostic_sessions",
        "(outcome IS NULL AND state != 'completed') OR "
        "(outcome IS NOT NULL AND state = 'completed')",
    )

    op.create_table(
        "remediation_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("remediation_unit_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("cycle_number", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
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
        sa.CheckConstraint("cycle_number >= 1 AND cycle_number <= 2", name="remediation_cycle_1_2"),
        sa.CheckConstraint(
            "status IN ('active', 'completed')",
            name="remediation_runs_status_allowed_values",
        ),
        sa.ForeignKeyConstraint(["session_id"], ["diagnostic_sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["remediation_unit_id"],
            ["remediation_units.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_remediation_runs")),
        sa.UniqueConstraint(
            "session_id",
            "cycle_number",
            name="uq_remediation_runs_session_cycle",
        ),
    )
    op.create_index(
        "ix_remediation_runs_session_id", "remediation_runs", ["session_id"], unique=False
    )

    op.create_table(
        "remediation_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("remediation_run_id", postgresql.UUID(as_uuid=True), nullable=False),
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
        sa.ForeignKeyConstraint(
            ["remediation_run_id"], ["remediation_runs.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["question_id"], ["question_items.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(
            ["selected_option_id"], ["question_options.id"], ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_remediation_attempts")),
        sa.UniqueConstraint(
            "remediation_run_id",
            "client_attempt_id",
            name="uq_remediation_attempts_run_client_attempt",
        ),
        sa.UniqueConstraint(
            "remediation_run_id",
            "question_id",
            name="uq_remediation_attempts_run_question",
        ),
    )
    op.create_index(
        "ix_remediation_attempts_run_id",
        "remediation_attempts",
        ["remediation_run_id"],
        unique=False,
    )
    op.create_index(
        "ix_remediation_attempts_question_id",
        "remediation_attempts",
        ["question_id"],
        unique=False,
    )

    op.create_table(
        "transfer_checks",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("target_skill_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("cycle_number", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("correct_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("answered_count", sa.Integer(), server_default="0", nullable=False),
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
        sa.CheckConstraint("cycle_number >= 1 AND cycle_number <= 2", name="transfer_cycle_1_2"),
        sa.CheckConstraint(
            "status IN ('active', 'passed', 'failed')",
            name="transfer_checks_status_allowed_values",
        ),
        sa.CheckConstraint(
            "answered_count >= 0 AND answered_count <= 2", name="transfer_answered_0_2"
        ),
        sa.CheckConstraint("correct_count >= 0", name="transfer_correct_non_negative"),
        sa.CheckConstraint("correct_count <= answered_count", name="transfer_correct_lte_answered"),
        sa.ForeignKeyConstraint(["session_id"], ["diagnostic_sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["target_skill_id"], ["skills.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_transfer_checks")),
        sa.UniqueConstraint(
            "session_id",
            "cycle_number",
            name="uq_transfer_checks_session_cycle",
        ),
    )
    op.create_index(
        "ix_transfer_checks_session_id", "transfer_checks", ["session_id"], unique=False
    )

    op.create_table(
        "transfer_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("transfer_check_id", postgresql.UUID(as_uuid=True), nullable=False),
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
        sa.ForeignKeyConstraint(["transfer_check_id"], ["transfer_checks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["question_id"], ["question_items.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(
            ["selected_option_id"], ["question_options.id"], ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_transfer_attempts")),
        sa.UniqueConstraint(
            "transfer_check_id",
            "client_attempt_id",
            name="uq_transfer_attempts_check_client_attempt",
        ),
        sa.UniqueConstraint(
            "transfer_check_id",
            "question_id",
            name="uq_transfer_attempts_check_question",
        ),
    )
    op.create_index(
        "ix_transfer_attempts_check_id",
        "transfer_attempts",
        ["transfer_check_id"],
        unique=False,
    )
    op.create_index(
        "ix_transfer_attempts_question_id",
        "transfer_attempts",
        ["question_id"],
        unique=False,
    )

    op.create_table(
        "learning_session_transitions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("from_state", sa.String(length=30), nullable=True),
        sa.Column("to_state", sa.String(length=30), nullable=False),
        sa.Column("reason_code", sa.String(length=80), nullable=False),
        sa.Column("skill_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["session_id"], ["diagnostic_sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["skill_id"], ["skills.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_learning_session_transitions")),
    )
    op.create_index(
        "ix_learning_session_transitions_session_id",
        "learning_session_transitions",
        ["session_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_learning_session_transitions_session_id",
        table_name="learning_session_transitions",
    )
    op.drop_table("learning_session_transitions")
    op.drop_index("ix_transfer_attempts_question_id", table_name="transfer_attempts")
    op.drop_index("ix_transfer_attempts_check_id", table_name="transfer_attempts")
    op.drop_table("transfer_attempts")
    op.drop_index("ix_transfer_checks_session_id", table_name="transfer_checks")
    op.drop_table("transfer_checks")
    op.drop_index("ix_remediation_attempts_question_id", table_name="remediation_attempts")
    op.drop_index("ix_remediation_attempts_run_id", table_name="remediation_attempts")
    op.drop_table("remediation_attempts")
    op.drop_index("ix_remediation_runs_session_id", table_name="remediation_runs")
    op.drop_table("remediation_runs")
    op.drop_constraint(
        "diagnostic_sessions_outcome_matches_completed_state",
        "diagnostic_sessions",
        type_="check",
    )
    op.drop_constraint(
        "diagnostic_sessions_transfer_cycles_0_2",
        "diagnostic_sessions",
        type_="check",
    )
    op.drop_constraint(
        "diagnostic_sessions_remediation_cycles_0_2",
        "diagnostic_sessions",
        type_="check",
    )
    op.drop_constraint(
        "diagnostic_sessions_outcome_allowed_values",
        "diagnostic_sessions",
        type_="check",
    )
    op.drop_index("ix_diagnostic_sessions_outcome", table_name="diagnostic_sessions")
    op.drop_column("diagnostic_sessions", "transfer_cycle_count")
    op.drop_column("diagnostic_sessions", "remediation_cycle_count")
    op.drop_column("diagnostic_sessions", "outcome")
