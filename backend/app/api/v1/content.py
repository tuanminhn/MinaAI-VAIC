from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies.auth import require_teacher
from app.api.dependencies.db import get_db
from app.db.models.user import User
from app.repositories.content_repository import ContentRepository
from app.schemas.common import ErrorResponse
from app.schemas.content import (
    ContentPackageSummaryResponse,
    ContentSkillDetailResponse,
    ContentSkillsResponse,
)
from app.services.content_service import ContentService
from app.services.skill_graph_service import SkillGraphService

router = APIRouter(prefix="/content", tags=["content"])


def get_content_service(db: Session) -> ContentService:
    return ContentService(
        repository=ContentRepository(db),
        skill_graph=SkillGraphService(),
    )


@router.get(
    "/packages/{package_code}",
    response_model=ContentPackageSummaryResponse,
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
def content_package(
    package_code: str,
    _: User = Depends(require_teacher),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> ContentPackageSummaryResponse:
    return get_content_service(db).get_package_summary(package_code)


@router.get(
    "/packages/{package_code}/skills",
    response_model=ContentSkillsResponse,
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
def content_package_skills(
    package_code: str,
    _: User = Depends(require_teacher),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> ContentSkillsResponse:
    return get_content_service(db).list_package_skills(package_code)


@router.get(
    "/skills/{skill_code}",
    response_model=ContentSkillDetailResponse,
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
def content_skill_detail(
    skill_code: str,
    _: User = Depends(require_teacher),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> ContentSkillDetailResponse:
    return get_content_service(db).get_skill_detail(skill_code)
