from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import delete, select
from sqlalchemy.orm import Session, joinedload

from app.db.models.auth_session import AuthSession


class AuthSessionRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def add(self, auth_session: AuthSession) -> AuthSession:
        self.session.add(auth_session)
        return auth_session

    def get_active_by_token_hash(self, token_hash: str) -> AuthSession | None:
        statement = (
            select(AuthSession)
            .options(joinedload(AuthSession.user))
            .where(AuthSession.token_hash == token_hash)
        )
        auth_session = self.session.execute(statement).scalar_one_or_none()
        if auth_session is None:
            return None
        if auth_session.revoked_at is not None:
            return None
        if auth_session.expires_at <= datetime.now(UTC):
            return None
        return auth_session

    def revoke(self, auth_session: AuthSession) -> None:
        if auth_session.revoked_at is None:
            auth_session.revoked_at = datetime.now(UTC)

    def delete_expired_or_revoked(self, reference_time: datetime) -> int:
        statement = delete(AuthSession).where(
            (AuthSession.expires_at < reference_time) | (AuthSession.revoked_at.is_not(None))
        )
        result = self.session.execute(statement)
        return result.rowcount or 0
