from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import (
    generate_session_token,
    hash_password,
    hash_session_token,
    verify_password,
)
from app.db.models.auth_session import AuthSession
from app.db.models.user import User
from app.repositories.auth_session_repository import AuthSessionRepository
from app.repositories.user_repository import UserRepository


def normalize_username(username: str) -> str:
    return username.strip().lower()


@dataclass
class AuthenticatedSession:
    user: User
    raw_session_token: str
    auth_session: AuthSession


class AuthService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.users = UserRepository(session)
        self.auth_sessions = AuthSessionRepository(session)

    def create_user(
        self,
        *,
        username: str,
        display_name: str,
        role: str,
        password: str,
        is_active: bool = True,
    ) -> User:
        normalized_username = normalize_username(username)
        existing = self.users.get_by_normalized_username(normalized_username)
        if existing is not None:
            return existing

        user = User(
            username=username.strip(),
            normalized_username=normalized_username,
            display_name=display_name.strip(),
            role=role,
            password_hash=hash_password(password),
            is_active=is_active,
        )
        return self.users.add(user)

    def authenticate(self, username: str, password: str) -> AuthenticatedSession | None:
        normalized_username = normalize_username(username)
        user = self.users.get_by_normalized_username(normalized_username)

        if user is None or not user.is_active:
            return None

        if not verify_password(password, user.password_hash):
            return None

        settings = get_settings()
        expires_at = datetime.now(UTC) + timedelta(minutes=settings.auth_session_ttl_minutes)
        raw_session_token = generate_session_token()
        auth_session = AuthSession(
            user_id=user.id,
            token_hash=hash_session_token(raw_session_token),
            expires_at=expires_at,
        )
        self.auth_sessions.add(auth_session)
        self.session.flush()

        return AuthenticatedSession(
            user=user,
            raw_session_token=raw_session_token,
            auth_session=auth_session,
        )

    def get_user_for_token(self, raw_session_token: str) -> User | None:
        auth_session = self.auth_sessions.get_active_by_token_hash(
            hash_session_token(raw_session_token)
        )
        if auth_session is None:
            return None
        if not auth_session.user.is_active:
            return None
        return auth_session.user

    def revoke_session(self, raw_session_token: str) -> bool:
        auth_session = self.auth_sessions.get_active_by_token_hash(
            hash_session_token(raw_session_token)
        )
        if auth_session is None:
            return False
        self.auth_sessions.revoke(auth_session)
        return True

    def cleanup_expired_sessions(self) -> int:
        return self.auth_sessions.delete_expired_or_revoked(datetime.now(UTC))
