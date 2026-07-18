from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.db.models.assignment import Assignment
from app.db.models.assignment_content_target import AssignmentContentTarget
from app.db.models.content_package import ContentPackage
from app.db.models.misconception import Misconception
from app.db.models.question_item import QuestionItem
from app.db.models.remediation_unit import RemediationUnit
from app.db.models.skill import Skill
from app.db.models.skill_prerequisite import SkillPrerequisite


class ContentRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def add(self, instance):
        self.session.add(instance)
        return instance

    def get_package_by_code(self, package_code: str) -> ContentPackage | None:
        statement = select(ContentPackage).where(ContentPackage.code == package_code)
        return self.session.execute(statement).scalar_one_or_none()

    def get_skill_by_code(self, skill_code: str) -> Skill | None:
        statement = (
            select(Skill).options(joinedload(Skill.content_package)).where(Skill.code == skill_code)
        )
        return self.session.execute(statement).unique().scalar_one_or_none()

    def get_skill_by_id(self, skill_id: uuid.UUID) -> Skill | None:
        statement = select(Skill).where(Skill.id == skill_id)
        return self.session.execute(statement).scalar_one_or_none()

    def get_misconception_by_code(self, misconception_code: str) -> Misconception | None:
        statement = select(Misconception).where(Misconception.code == misconception_code)
        return self.session.execute(statement).scalar_one_or_none()

    def get_remediation_unit_by_code(self, unit_code: str) -> RemediationUnit | None:
        statement = select(RemediationUnit).where(RemediationUnit.code == unit_code)
        return self.session.execute(statement).scalar_one_or_none()

    def get_question_item_by_code(self, question_code: str) -> QuestionItem | None:
        statement = (
            select(QuestionItem)
            .options(joinedload(QuestionItem.options))
            .where(QuestionItem.code == question_code)
        )
        return self.session.execute(statement).unique().scalar_one_or_none()

    def get_assignment_by_title(self, title: str) -> Assignment | None:
        statement = select(Assignment).where(Assignment.title == title)
        return self.session.execute(statement).scalar_one_or_none()

    def get_assignment_target(
        self,
        *,
        assignment_id: uuid.UUID,
        target_skill_id: uuid.UUID,
    ) -> AssignmentContentTarget | None:
        statement = select(AssignmentContentTarget).where(
            AssignmentContentTarget.assignment_id == assignment_id,
            AssignmentContentTarget.target_skill_id == target_skill_id,
        )
        return self.session.execute(statement).scalar_one_or_none()

    def get_package_skill_count(self, package_id: uuid.UUID) -> int:
        statement = (
            select(func.count()).select_from(Skill).where(Skill.content_package_id == package_id)
        )
        return self.session.execute(statement).scalar_one()

    def list_skills_by_package_id(self, package_id: uuid.UUID) -> list[Skill]:
        statement = (
            select(Skill)
            .where(Skill.content_package_id == package_id)
            .order_by(Skill.sort_order.asc(), Skill.code.asc())
        )
        return list(self.session.execute(statement).scalars().all())

    def list_skill_prerequisites_by_package_id(
        self, package_id: uuid.UUID
    ) -> list[SkillPrerequisite]:
        statement = (
            select(SkillPrerequisite)
            .join(Skill, Skill.id == SkillPrerequisite.skill_id)
            .options(
                joinedload(SkillPrerequisite.skill),
                joinedload(SkillPrerequisite.prerequisite_skill),
            )
            .where(Skill.content_package_id == package_id)
            .order_by(SkillPrerequisite.priority.asc(), SkillPrerequisite.created_at.asc())
        )
        return list(self.session.execute(statement).unique().scalars().all())

    def list_direct_prerequisites(self, skill_id: uuid.UUID) -> list[Skill]:
        statement = (
            select(Skill)
            .join(SkillPrerequisite, SkillPrerequisite.prerequisite_skill_id == Skill.id)
            .where(SkillPrerequisite.skill_id == skill_id)
            .order_by(SkillPrerequisite.priority.asc(), Skill.sort_order.asc(), Skill.code.asc())
        )
        return list(self.session.execute(statement).scalars().all())

    def list_misconceptions_for_skill(self, skill_id: uuid.UUID) -> list[Misconception]:
        statement = (
            select(Misconception)
            .where(Misconception.skill_id == skill_id)
            .order_by(Misconception.code.asc())
        )
        return list(self.session.execute(statement).scalars().all())

    def list_questions_for_skill(
        self, *, skill_id: uuid.UUID, purpose: str | None = None
    ) -> list[QuestionItem]:
        statement = (
            select(QuestionItem)
            .options(joinedload(QuestionItem.options), joinedload(QuestionItem.misconception))
            .where(QuestionItem.skill_id == skill_id, QuestionItem.is_active.is_(True))
            .order_by(QuestionItem.difficulty.asc(), QuestionItem.code.asc())
        )
        if purpose is not None:
            statement = statement.where(QuestionItem.purpose == purpose)
        return list(self.session.execute(statement).unique().scalars().all())

    def get_question_with_options_internal(self, question_code: str) -> QuestionItem | None:
        statement = (
            select(QuestionItem)
            .options(
                joinedload(QuestionItem.options),
                joinedload(QuestionItem.skill),
                joinedload(QuestionItem.misconception),
            )
            .where(QuestionItem.code == question_code)
        )
        return self.session.execute(statement).unique().scalar_one_or_none()

    def list_question_counts_for_skill(self, skill_id: uuid.UUID) -> list[tuple[str, int]]:
        statement = (
            select(QuestionItem.purpose, func.count(QuestionItem.id))
            .where(QuestionItem.skill_id == skill_id, QuestionItem.is_active.is_(True))
            .group_by(QuestionItem.purpose)
        )
        return list(self.session.execute(statement).all())

    def list_remediation_units(
        self,
        *,
        skill_id: uuid.UUID,
        misconception_id: uuid.UUID | None = None,
    ) -> list[RemediationUnit]:
        statement = (
            select(RemediationUnit)
            .where(RemediationUnit.skill_id == skill_id, RemediationUnit.is_active.is_(True))
            .order_by(RemediationUnit.sort_order.asc(), RemediationUnit.code.asc())
        )
        if misconception_id is not None:
            statement = statement.where(RemediationUnit.misconception_id == misconception_id)
        return list(self.session.execute(statement).scalars().all())

    def list_assignment_target_skills(self, assignment_id: uuid.UUID) -> list[Skill]:
        statement = (
            select(Skill)
            .join(AssignmentContentTarget, AssignmentContentTarget.target_skill_id == Skill.id)
            .where(AssignmentContentTarget.assignment_id == assignment_id)
            .order_by(Skill.sort_order.asc(), Skill.code.asc())
        )
        return list(self.session.execute(statement).scalars().all())

    def list_assignment_targets_for_package(
        self, package_id: uuid.UUID
    ) -> list[AssignmentContentTarget]:
        statement = (
            select(AssignmentContentTarget)
            .options(
                joinedload(AssignmentContentTarget.target_skill),
                joinedload(AssignmentContentTarget.content_package),
            )
            .where(AssignmentContentTarget.content_package_id == package_id)
        )
        return list(self.session.execute(statement).unique().scalars().all())
