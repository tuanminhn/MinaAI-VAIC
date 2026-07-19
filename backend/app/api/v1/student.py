from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies.auth import require_student
from app.api.dependencies.db import get_db
from app.db.models.user import User
from app.repositories.assignment_repository import AssignmentRepository
from app.repositories.classroom_repository import ClassroomRepository
from app.repositories.content_repository import ContentRepository
from app.repositories.diagnostic_repository import DiagnosticRepository
from app.schemas.common import ErrorResponse
from app.schemas.diagnostic import StartDiagnosticSessionResponse
from app.schemas.student import StudentAssignmentsResponse, StudentHomeResponse
from app.services.diagnostic_service import DiagnosticService
from app.services.diagnostic_state_machine import DiagnosticStateMachine
from app.services.skill_graph_service import SkillGraphService
from app.services.student_service import StudentService

router = APIRouter(prefix="/student", tags=["student"])


def get_student_service(db: Session) -> StudentService:
    return StudentService(
        assignments=AssignmentRepository(db),
        classrooms=ClassroomRepository(db),
    )


def get_diagnostic_service(db: Session) -> DiagnosticService:
    return DiagnosticService(
        diagnostic_repository=DiagnosticRepository(db),
        content_repository=ContentRepository(db),
        state_machine=DiagnosticStateMachine(),
        skill_graph=SkillGraphService(),
    )


@router.get(
    "/home",
    response_model=StudentHomeResponse,
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
def student_home(
    current_user: User = Depends(require_student),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> StudentHomeResponse:
    return get_student_service(db).get_home(user=current_user)


@router.get(
    "/assignments",
    response_model=StudentAssignmentsResponse,
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
    },
)
def student_assignments(
    status: str | None = Query(default=None),
    page: int = Query(default=1),
    page_size: int = Query(default=20, alias="pageSize"),
    current_user: User = Depends(require_student),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> StudentAssignmentsResponse:
    return get_student_service(db).list_assignments(
        user=current_user,
        status=status,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/assignments/{assignment_id}/diagnostic-sessions",
    response_model=StartDiagnosticSessionResponse,
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
def start_diagnostic_session(
    assignment_id: uuid.UUID,
    current_user: User = Depends(require_student),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> StartDiagnosticSessionResponse:
    return get_diagnostic_service(db).start_or_resume_session(
        assignment_id=assignment_id,
        user=current_user,
    )
