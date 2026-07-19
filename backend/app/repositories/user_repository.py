from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.user import User


class UserRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_normalized_username(self, normalized_username: str) -> User | None:
        statement = select(User).where(User.normalized_username == normalized_username)
        return self.session.execute(statement).scalar_one_or_none()

    def get_by_id(self, user_id: str) -> User | None:
        statement = select(User).where(User.id == user_id)
        return self.session.execute(statement).scalar_one_or_none()

    def add(self, user: User) -> User:
        self.session.add(user)
        return user
