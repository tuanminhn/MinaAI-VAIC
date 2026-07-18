from __future__ import annotations

import os
from pathlib import Path

import pytest
from sqlalchemy import inspect, text

from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from app.db.session import get_engine, session_scope


def make_alembic_config() -> Config:
    config = Config(str(Path("alembic.ini")))
    config.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])
    return config


@pytest.mark.integration
@pytest.mark.postgres
def test_migration_upgrade_on_empty_postgres() -> None:
    config = make_alembic_config()
    command.upgrade(config, "head")

    inspector = inspect(get_engine())
    table_names = inspector.get_table_names()
    assert "system_metadata" in table_names
    assert "users" in table_names
    assert "auth_sessions" in table_names


@pytest.mark.integration
@pytest.mark.postgres
def test_migration_downgrade_and_upgrade_again() -> None:
    config = make_alembic_config()
    command.downgrade(config, "base")

    inspector = inspect(get_engine())
    assert "users" not in inspector.get_table_names()
    assert "auth_sessions" not in inspector.get_table_names()

    command.upgrade(config, "head")
    inspector = inspect(get_engine())
    assert "users" in inspector.get_table_names()
    assert "auth_sessions" in inspector.get_table_names()


@pytest.mark.integration
@pytest.mark.postgres
def test_alembic_current_matches_head() -> None:
    engine = get_engine()

    with engine.connect() as connection:
        current_revision = connection.execute(
            text("SELECT version_num FROM alembic_version")
        ).scalar_one()

    assert current_revision == "20260718_0002"


@pytest.mark.integration
@pytest.mark.postgres
def test_there_is_only_one_head() -> None:
    config = make_alembic_config()
    script = ScriptDirectory.from_config(config)
    heads = script.get_heads()
    assert heads == ["20260718_0002"]


@pytest.mark.integration
@pytest.mark.postgres
def test_database_transaction_rolls_back_on_exception() -> None:
    from app.db.models.user import User

    with pytest.raises(RuntimeError):
        with session_scope() as session:
            session.add(
                User(
                    username="rollback-user",
                    normalized_username="rollback-user",
                    display_name="Rollback User",
                    role="student",
                    password_hash="placeholder",
                    is_active=True,
                )
            )
            session.flush()
            raise RuntimeError("trigger rollback")

    with session_scope() as session:
        row_count = session.execute(
            text("SELECT COUNT(*) FROM users WHERE normalized_username = 'rollback-user'")
        ).scalar_one()

    assert row_count == 0
