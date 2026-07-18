from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.school import School


class SchoolRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_code(self, code: str) -> School | None:
        statement = select(School).where(School.code == code)
        return self.session.execute(statement).scalar_one_or_none()

    def add(self, school: School) -> School:
        self.session.add(school)
        return school
