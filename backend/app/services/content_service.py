from __future__ import annotations

from app.api.errors import ApiErrorException
from app.db.models.question_item import QuestionItem
from app.db.models.remediation_unit import RemediationUnit
from app.db.models.skill import Skill
from app.repositories.content_repository import ContentRepository
from app.schemas.content import (
    ContentPackageSummaryResponse,
    ContentSkillDetailResponse,
    ContentSkillsResponse,
    ContentSkillSummaryResponse,
    RemediationUnitMetadataResponse,
    SkillMisconceptionResponse,
    SkillQuestionCountResponse,
)
from app.services.skill_graph_service import SkillGraphService


class ContentService:
    def __init__(
        self,
        *,
        repository: ContentRepository,
        skill_graph: SkillGraphService,
    ) -> None:
        self.repository = repository
        self.skill_graph = skill_graph

    def get_package_summary(self, package_code: str) -> ContentPackageSummaryResponse:
        package = self.repository.get_package_by_code(package_code)
        if package is None:
            raise ApiErrorException(
                404, "CONTENT_PACKAGE_NOT_FOUND", "Không tìm thấy gói nội dung."
            )

        return ContentPackageSummaryResponse(
            code=package.code,
            title=package.title,
            subject=package.subject,
            grade=package.grade,
            version=package.version,
            status=package.status,
            skill_count=self.repository.get_package_skill_count(package.id),
        )

    def list_package_skills(self, package_code: str) -> ContentSkillsResponse:
        package = self.repository.get_package_by_code(package_code)
        if package is None:
            raise ApiErrorException(
                404, "CONTENT_PACKAGE_NOT_FOUND", "Không tìm thấy gói nội dung."
            )

        skills = self.repository.list_skills_by_package_id(package.id)
        edges = self.repository.list_skill_prerequisites_by_package_id(package.id)
        prerequisite_map = self.skill_graph.build_prerequisite_map(skills=skills, edges=edges)
        skill_lookup = {skill.id: skill for skill in skills}

        items = [
            ContentSkillSummaryResponse(
                code=skill.code,
                name=skill.name,
                grade=skill.grade,
                prerequisite_codes=[skill_lookup[item].code for item in prerequisite_map[skill.id]],
            )
            for skill in self.skill_graph.topological_sort(skills=skills, edges=edges)
        ]
        return ContentSkillsResponse(items=items)

    def get_skill_detail(self, skill_code: str) -> ContentSkillDetailResponse:
        skill = self.get_skill_by_code(skill_code)
        skills = self.repository.list_skills_by_package_id(skill.content_package_id)
        edges = self.repository.list_skill_prerequisites_by_package_id(skill.content_package_id)
        skill_lookup = {item.id: item for item in skills}
        prerequisite_chain = self.skill_graph.get_prerequisite_chain(
            target_skill_id=skill.id,
            skills=skills,
            edges=edges,
        )
        misconceptions = self.repository.list_misconceptions_for_skill(skill.id)
        question_counts = [
            SkillQuestionCountResponse(purpose=purpose, count=count)
            for purpose, count in sorted(self.repository.list_question_counts_for_skill(skill.id))
        ]
        remediation_units = [
            self._serialize_remediation_unit(item)
            for item in self.repository.list_remediation_units(skill_id=skill.id)
        ]

        return ContentSkillDetailResponse(
            code=skill.code,
            name=skill.name,
            description=skill.description,
            grade=skill.grade,
            prerequisite_codes=[skill_lookup[item].code for item in prerequisite_chain],
            misconceptions=[
                SkillMisconceptionResponse(
                    code=item.code,
                    name=item.name,
                    description=item.description,
                )
                for item in misconceptions
            ],
            question_counts=question_counts,
            remediation_units=remediation_units,
        )

    def get_skill_by_code(self, skill_code: str) -> Skill:
        skill = self.repository.get_skill_by_code(skill_code)
        if skill is None:
            raise ApiErrorException(404, "SKILL_NOT_FOUND", "Không tìm thấy kỹ năng.")
        return skill

    def get_direct_prerequisites(self, skill: Skill) -> list[Skill]:
        return self.repository.list_direct_prerequisites(skill.id)

    def get_prerequisite_chain(self, skill: Skill) -> list[Skill]:
        skills = self.repository.list_skills_by_package_id(skill.content_package_id)
        edges = self.repository.list_skill_prerequisites_by_package_id(skill.content_package_id)
        skill_lookup = {item.id: item for item in skills}
        chain_ids = self.skill_graph.get_prerequisite_chain(
            target_skill_id=skill.id,
            skills=skills,
            edges=edges,
        )
        return [skill_lookup[item] for item in chain_ids]

    def get_questions_for_skill(self, skill: Skill, purpose: str) -> list[QuestionItem]:
        return self.repository.list_questions_for_skill(skill_id=skill.id, purpose=purpose)

    def get_question_with_options_internal(self, question_code: str) -> QuestionItem:
        question = self.repository.get_question_with_options_internal(question_code)
        if question is None:
            raise ApiErrorException(404, "QUESTION_NOT_FOUND", "Không tìm thấy câu hỏi.")
        return question

    def get_remediation_for_gap(
        self,
        *,
        skill: Skill,
        misconception_code: str | None = None,
    ) -> list[RemediationUnit]:
        misconception = (
            self.repository.get_misconception_by_code(misconception_code)
            if misconception_code is not None
            else None
        )
        misconception_id = misconception.id if misconception is not None else None
        units = self.repository.list_remediation_units(
            skill_id=skill.id,
            misconception_id=misconception_id,
        )
        if units or misconception_id is None:
            return units
        return self.repository.list_remediation_units(skill_id=skill.id)

    def get_assignment_target_skills(self, assignment_id) -> list[Skill]:
        return self.repository.list_assignment_target_skills(assignment_id)

    def validate_package_content(self, package_code: str) -> None:
        package = self.repository.get_package_by_code(package_code)
        if package is None:
            raise RuntimeError("Content package was not found.")

        skills = self.repository.list_skills_by_package_id(package.id)
        if not skills:
            raise RuntimeError("Content package does not contain any skills.")

        edges = self.repository.list_skill_prerequisites_by_package_id(package.id)
        self.skill_graph.ensure_acyclic(skills=skills, edges=edges)

        skill_ids = {skill.id for skill in skills}
        for edge in edges:
            if edge.skill_id not in skill_ids or edge.prerequisite_skill_id not in skill_ids:
                raise RuntimeError("Skill prerequisite edge crosses content package boundaries.")

        for skill in skills:
            if not skill.code.strip() or not skill.name.strip():
                raise RuntimeError("Skill text fields must not be empty.")

            misconceptions = self.repository.list_misconceptions_for_skill(skill.id)
            for misconception in misconceptions:
                if not misconception.description.strip():
                    raise RuntimeError("Misconception description must not be empty.")

            for question in self.repository.list_questions_for_skill(skill_id=skill.id):
                if not question.prompt.strip():
                    raise RuntimeError("Question prompt must not be empty.")
                if len(question.options) < 2:
                    raise RuntimeError(f"Question {question.code} must have at least two options.")
                correct_options = [option for option in question.options if option.is_correct]
                if len(correct_options) != 1:
                    raise RuntimeError(
                        f"Question {question.code} must have exactly one correct option."
                    )
                if question.misconception_id is not None and question.misconception is None:
                    raise RuntimeError(
                        f"Question {question.code} references an invalid misconception."
                    )

            for unit in self.repository.list_remediation_units(skill_id=skill.id):
                if not unit.title.strip() or not unit.summary.strip():
                    raise RuntimeError(f"Remediation unit {unit.code} must not have empty text.")

        targets = self.repository.list_assignment_targets_for_package(package.id)
        if package.status == "published" and not targets:
            raise RuntimeError("Published package must have at least one assignment target.")

        for target in targets:
            if target.target_skill.content_package_id != package.id:
                raise RuntimeError(
                    "Assignment content target points to a skill from another package."
                )

    @staticmethod
    def _serialize_remediation_unit(unit: RemediationUnit) -> RemediationUnitMetadataResponse:
        return RemediationUnitMetadataResponse(
            code=unit.code,
            title=unit.title,
            summary=unit.summary,
            misconception_code=unit.misconception.code if unit.misconception else None,
        )
