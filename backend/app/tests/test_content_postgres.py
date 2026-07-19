from __future__ import annotations

from dataclasses import dataclass

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.cli.seed_dev_content import PACKAGE_CODE, seed_dev_content
from app.cli.seed_dev_core import seed_dev_core
from app.cli.seed_dev_users import seed_dev_users
from app.cli.validate_content import validate_content
from app.core.config import reset_settings_cache
from app.db.models.assignment_content_target import AssignmentContentTarget
from app.db.models.content_package import ContentPackage
from app.db.models.question_item import QuestionItem
from app.db.models.question_option import QuestionOption
from app.db.models.skill import Skill
from app.db.models.skill_prerequisite import SkillPrerequisite
from app.db.session import session_scope
from app.main import create_app
from app.repositories.content_repository import ContentRepository
from app.services.content_service import ContentService
from app.services.skill_graph_service import SkillGraphService
from app.tests.conftest import truncate_auth_tables


@pytest.fixture(autouse=True)
def reset_tables() -> None:
    truncate_auth_tables()


def seed_default_content() -> None:
    seed_dev_users(reset_password=True)
    seed_dev_core()
    seed_dev_content()


def login(client: TestClient, username: str, password: str) -> None:
    response = client.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200


def get_content_service() -> ContentService:
    with session_scope() as session:
        return ContentService(
            repository=ContentRepository(session),
            skill_graph=SkillGraphService(),
        )


@dataclass
class FakeSkill:
    id: str
    code: str
    sort_order: int


@dataclass
class FakeEdge:
    skill_id: str
    prerequisite_skill_id: str
    priority: int


def test_seed_content_succeeds_and_is_idempotent() -> None:
    seed_dev_users(reset_password=True)
    seed_dev_core()
    first = seed_dev_content()
    second = seed_dev_content()

    assert first["diagnostic_questions"] == 14
    assert first["remediation_questions"] == 14
    assert first["transfer_questions"] == 4
    assert second == first

    with session_scope() as session:
        counts = (
            session.execute(
                text(
                    """
                SELECT
                  (SELECT COUNT(*) FROM content_packages) AS packages,
                  (SELECT COUNT(*) FROM skills) AS skills,
                  (SELECT COUNT(*) FROM skill_prerequisites) AS edges,
                  (SELECT COUNT(*) FROM misconceptions) AS misconceptions,
                  (SELECT COUNT(*) FROM question_items) AS questions,
                  (SELECT COUNT(*) FROM remediation_units) AS remediation_units,
                  (SELECT COUNT(*) FROM assignment_content_targets) AS assignment_targets
                """
                )
            )
            .mappings()
            .one()
        )

    assert counts == {
        "packages": 1,
        "skills": 7,
        "edges": 6,
        "misconceptions": 5,
        "questions": 32,
        "remediation_units": 7,
        "assignment_targets": 2,
    }


def test_seed_content_rejects_production(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    reset_settings_cache()

    with pytest.raises(RuntimeError, match="only allowed in development or test"):
        seed_dev_content()


def test_seed_content_fails_without_core_assignment() -> None:
    seed_dev_users(reset_password=True)

    with pytest.raises(RuntimeError, match="seed_dev_core"):
        seed_dev_content()


@pytest.mark.integration
@pytest.mark.postgres
def test_content_constraints_hold() -> None:
    seed_default_content()

    with pytest.raises(IntegrityError):
        with session_scope() as session:
            session.add(
                ContentPackage(
                    code=PACKAGE_CODE,
                    title="Duplicate",
                    subject="math",
                    grade=6,
                    version=1,
                    status="published",
                )
            )
            session.flush()

    with pytest.raises(IntegrityError):
        with session_scope() as session:
            skill_id = session.execute(text("SELECT id FROM skills LIMIT 1")).scalar_one()
            session.add(
                SkillPrerequisite(
                    skill_id=skill_id,
                    prerequisite_skill_id=skill_id,
                    priority=1,
                )
            )
            session.flush()


@pytest.mark.integration
@pytest.mark.postgres
def test_duplicate_assignment_target_is_blocked() -> None:
    seed_default_content()

    with pytest.raises(IntegrityError):
        with session_scope() as session:
            assignment_id, package_id, skill_id = session.execute(
                text(
                    """
                    SELECT assignment_id, content_package_id, target_skill_id
                    FROM assignment_content_targets
                    LIMIT 1
                    """
                )
            ).one()
            session.add(
                AssignmentContentTarget(
                    assignment_id=assignment_id,
                    content_package_id=package_id,
                    target_skill_id=skill_id,
                )
            )
            session.flush()


def test_skill_graph_direct_prerequisites_chain_and_topological_order() -> None:
    seed_default_content()
    with session_scope() as session:
        repository = ContentRepository(session)
        service = ContentService(repository=repository, skill_graph=SkillGraphService())
        skill = service.get_skill_by_code("MATH6.FRACTIONS.SIMPLE_FRACTION_EQUATION")

        direct_codes = [item.code for item in service.get_direct_prerequisites(skill)]
        chain_codes = [item.code for item in service.get_prerequisite_chain(skill)]
        ordered_codes = [item.code for item in service.list_package_skills(PACKAGE_CODE).items]

    assert direct_codes == ["MATH6.FRACTIONS.SUBTRACT_DIFFERENT_DENOMINATOR"]
    assert chain_codes == [
        "MATH6.MULTIPLES.COMMON_MULTIPLE",
        "MATH6.MULTIPLES.LCM",
        "MATH6.FRACTIONS.EQUIVALENT_FRACTION",
        "MATH6.FRACTIONS.COMMON_DENOMINATOR",
        "MATH6.FRACTIONS.SUBTRACT_SAME_DENOMINATOR",
        "MATH6.FRACTIONS.SUBTRACT_DIFFERENT_DENOMINATOR",
    ]
    assert ordered_codes == [
        "MATH6.MULTIPLES.COMMON_MULTIPLE",
        "MATH6.MULTIPLES.LCM",
        "MATH6.FRACTIONS.EQUIVALENT_FRACTION",
        "MATH6.FRACTIONS.COMMON_DENOMINATOR",
        "MATH6.FRACTIONS.SUBTRACT_SAME_DENOMINATOR",
        "MATH6.FRACTIONS.SUBTRACT_DIFFERENT_DENOMINATOR",
        "MATH6.FRACTIONS.SIMPLE_FRACTION_EQUATION",
    ]


def test_skill_graph_cycle_detection_and_cross_package_validation() -> None:
    graph = SkillGraphService()
    skills = [
        FakeSkill(id="A", code="A", sort_order=1),
        FakeSkill(id="B", code="B", sort_order=2),
    ]
    cyclic_edges = [
        FakeEdge(skill_id="A", prerequisite_skill_id="B", priority=1),
        FakeEdge(skill_id="B", prerequisite_skill_id="A", priority=1),
    ]
    cross_package_edges = [FakeEdge(skill_id="A", prerequisite_skill_id="C", priority=1)]

    with pytest.raises(RuntimeError, match="cycle"):
        graph.ensure_acyclic(skills=skills, edges=cyclic_edges)  # type: ignore[arg-type]

    with pytest.raises(RuntimeError, match="package boundaries"):
        graph.build_prerequisite_map(skills=skills, edges=cross_package_edges)  # type: ignore[arg-type]


def test_seed_questions_have_single_correct_option_and_two_or_more_options() -> None:
    seed_default_content()
    with session_scope() as session:
        questions = session.query(QuestionItem).all()
        assert len(questions) == 32
        for question in questions:
            assert len(question.options) >= 2
            assert len([option for option in question.options if option.is_correct]) == 1


def test_content_service_filters_questions_and_remediation() -> None:
    seed_default_content()
    with session_scope() as session:
        repository = ContentRepository(session)
        service = ContentService(repository=repository, skill_graph=SkillGraphService())
        skill = service.get_skill_by_code("MATH6.FRACTIONS.EQUIVALENT_FRACTION")
        diagnostic_questions = service.get_questions_for_skill(skill, "diagnostic")
        remediation_questions = service.get_questions_for_skill(skill, "remediation")
        remediation_units = service.get_remediation_for_gap(
            skill=skill,
            misconception_code="MATH6.MIS.KEEP_NUMERATOR_WHEN_SCALING",
        )

    assert len(diagnostic_questions) == 2
    assert len(remediation_questions) == 2
    assert remediation_units[0].code == "UNIT.EQUIVALENT.MULTIPLY_BOTH"


def test_get_question_with_options_internal_exposes_correctness_only_in_backend() -> None:
    seed_default_content()
    with session_scope() as session:
        repository = ContentRepository(session)
        service = ContentService(repository=repository, skill_graph=SkillGraphService())
        question = service.get_question_with_options_internal("Q.DIAG.LCM.01")

    assert any(option.is_correct for option in question.options)


def test_validate_content_passes_for_seeded_package() -> None:
    seed_default_content()
    validate_content(PACKAGE_CODE)


def test_validate_content_fails_for_cycle() -> None:
    seed_default_content()
    with session_scope() as session:
        first_skill_id, second_skill_id = session.execute(
            text("SELECT id FROM skills ORDER BY sort_order ASC LIMIT 2")
        ).all()
        session.add(
            SkillPrerequisite(
                skill_id=first_skill_id[0],
                prerequisite_skill_id=second_skill_id[0],
                priority=99,
            )
        )

    with pytest.raises(RuntimeError, match="cycle"):
        validate_content(PACKAGE_CODE)


def test_validate_content_fails_when_question_has_multiple_or_zero_correct_options() -> None:
    seed_default_content()
    with session_scope() as session:
        question = session.query(QuestionItem).filter_by(code="Q.DIAG.LCM.01").one()
        for option in question.options:
            option.is_correct = False

    with pytest.raises(RuntimeError, match="exactly one correct option"):
        validate_content(PACKAGE_CODE)


def test_teacher_can_read_content_endpoints_and_student_cannot() -> None:
    seed_default_content()
    with TestClient(create_app()) as client:
        login(client, "teacher01", "test-teacher-password")
        package_response = client.get(f"/api/v1/content/packages/{PACKAGE_CODE}")
        skills_response = client.get(f"/api/v1/content/packages/{PACKAGE_CODE}/skills")
        detail_response = client.get(
            "/api/v1/content/skills/MATH6.FRACTIONS.SUBTRACT_DIFFERENT_DENOMINATOR"
        )

    assert package_response.status_code == 200
    assert package_response.json()["skillCount"] == 7
    assert skills_response.status_code == 200
    assert len(skills_response.json()["items"]) == 7
    assert detail_response.status_code == 200
    assert "isCorrect" not in detail_response.text

    with TestClient(create_app()) as client:
        login(client, "student01", "test-student-password")
        forbidden = client.get(f"/api/v1/content/packages/{PACKAGE_CODE}")

    assert forbidden.status_code == 403


def test_content_endpoints_require_authentication() -> None:
    seed_default_content()
    with TestClient(create_app()) as client:
        response = client.get(f"/api/v1/content/packages/{PACKAGE_CODE}")

    assert response.status_code == 401


def test_assignment_targets_exist_and_student_home_still_has_null_next_route() -> None:
    seed_default_content()
    with session_scope() as session:
        repository = ContentRepository(session)
        assignment_id = session.execute(text("SELECT id FROM assignments LIMIT 1")).scalar_one()
        target_codes = [
            skill.code for skill in repository.list_assignment_target_skills(assignment_id)
        ]

    assert target_codes == [
        "MATH6.FRACTIONS.SUBTRACT_DIFFERENT_DENOMINATOR",
        "MATH6.FRACTIONS.SIMPLE_FRACTION_EQUATION",
    ]

    with TestClient(create_app()) as client:
        login(client, "student01", "test-student-password")
        response = client.get("/api/v1/student/home")

    assert response.status_code == 200
    assert response.json()["currentAssignment"]["nextRoute"] is None


def test_content_text_is_not_empty_and_question_counts_match_purpose() -> None:
    seed_default_content()
    with session_scope() as session:
        counts = {
            purpose: count
            for purpose, count in session.execute(
                text(
                    "SELECT purpose, COUNT(*) FROM question_items GROUP BY purpose ORDER BY purpose"
                )
            ).all()
        }
        package = session.query(ContentPackage).filter_by(code=PACKAGE_CODE).one()
        skills = session.query(Skill).all()
        options = session.query(QuestionOption).all()

    assert package.title.strip()
    assert counts == {"diagnostic": 14, "remediation": 14, "transfer": 4}
    assert all(skill.name.strip() for skill in skills)
    assert all(option.label.strip() for option in options)
