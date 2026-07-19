from __future__ import annotations

import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.api.dependencies.auth import require_student
from app.api.dependencies.db import get_db
from app.db.models.user import User
from app.repositories.content_repository import ContentRepository
from app.repositories.diagnostic_repository import DiagnosticRepository
from app.schemas.common import ErrorResponse
from app.schemas.diagnostic import (
    DiagnosticResultResponse,
    DiagnosticSessionResponse,
    RemediationResponse,
    StartRemediationRunResponse,
    StartTransferCheckResponse,
    SubmitDiagnosticAttemptRequest,
    SubmitDiagnosticAttemptResponse,
    SubmitRemediationAttemptRequest,
    SubmitRemediationAttemptResponse,
    SubmitTransferAttemptRequest,
    SubmitTransferAttemptResponse,
    TransferResponse,
)
from app.services.diagnostic_service import DiagnosticService
from app.services.diagnostic_state_machine import DiagnosticStateMachine
from app.services.learning_flow_service import LearningFlowService
from app.services.learning_state_machine import LearningStateMachine
from app.services.skill_graph_service import SkillGraphService

router = APIRouter(prefix="/diagnostic-sessions", tags=["diagnostic"])


def get_diagnostic_service(db: Session) -> DiagnosticService:
    return DiagnosticService(
        diagnostic_repository=DiagnosticRepository(db),
        content_repository=ContentRepository(db),
        state_machine=DiagnosticStateMachine(),
        skill_graph=SkillGraphService(),
    )


def get_learning_flow_service(db: Session) -> LearningFlowService:
    return LearningFlowService(
        diagnostic_repository=DiagnosticRepository(db),
        content_repository=ContentRepository(db),
        state_machine=LearningStateMachine(),
    )


@router.get(
    "/{session_id}",
    response_model=DiagnosticSessionResponse,
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
def get_diagnostic_session(
    session_id: uuid.UUID,
    current_user: User = Depends(require_student),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> DiagnosticSessionResponse:
    return get_diagnostic_service(db).get_session(session_id=session_id, user=current_user)


@router.post(
    "/{session_id}/attempts",
    response_model=SubmitDiagnosticAttemptResponse,
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        409: {"model": ErrorResponse},
    },
)
def submit_diagnostic_attempt(
    session_id: uuid.UUID,
    payload: Annotated[dict[str, Any], Body()],
    current_user: User = Depends(require_student),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> SubmitDiagnosticAttemptResponse:
    try:
        validated_payload = SubmitDiagnosticAttemptRequest.model_validate(payload)
    except ValidationError as exc:
        raise RequestValidationError(exc.errors()) from exc

    return get_diagnostic_service(db).submit_attempt(
        session_id=session_id,
        user=current_user,
        payload=validated_payload,
    )


@router.post(
    "/{session_id}/remediation-runs",
    response_model=StartRemediationRunResponse,
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        409: {"model": ErrorResponse},
    },
)
def start_remediation_run(
    session_id: uuid.UUID,
    current_user: User = Depends(require_student),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> StartRemediationRunResponse:
    return get_learning_flow_service(db).start_or_resume_remediation(
        session_id=session_id,
        user=current_user,
    )


@router.get(
    "/{session_id}/remediation",
    response_model=RemediationResponse,
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        409: {"model": ErrorResponse},
    },
)
def get_remediation(
    session_id: uuid.UUID,
    current_user: User = Depends(require_student),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> RemediationResponse:
    return get_learning_flow_service(db).get_remediation(
        session_id=session_id,
        user=current_user,
    )


@router.post(
    "/{session_id}/remediation/attempts",
    response_model=SubmitRemediationAttemptResponse,
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        409: {"model": ErrorResponse},
    },
)
def submit_remediation_attempt(
    session_id: uuid.UUID,
    payload: Annotated[dict[str, Any], Body()],
    current_user: User = Depends(require_student),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> SubmitRemediationAttemptResponse:
    try:
        validated_payload = SubmitRemediationAttemptRequest.model_validate(payload)
    except ValidationError as exc:
        raise RequestValidationError(exc.errors()) from exc
    return get_learning_flow_service(db).submit_remediation_attempt(
        session_id=session_id,
        user=current_user,
        payload=validated_payload,
    )


@router.post(
    "/{session_id}/transfer-checks",
    response_model=StartTransferCheckResponse,
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        409: {"model": ErrorResponse},
    },
)
def start_transfer_check(
    session_id: uuid.UUID,
    current_user: User = Depends(require_student),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> StartTransferCheckResponse:
    return get_learning_flow_service(db).start_or_resume_transfer(
        session_id=session_id,
        user=current_user,
    )


@router.get(
    "/{session_id}/transfer",
    response_model=TransferResponse,
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        409: {"model": ErrorResponse},
    },
)
def get_transfer(
    session_id: uuid.UUID,
    current_user: User = Depends(require_student),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> TransferResponse:
    return get_learning_flow_service(db).get_transfer(
        session_id=session_id,
        user=current_user,
    )


@router.post(
    "/{session_id}/transfer/attempts",
    response_model=SubmitTransferAttemptResponse,
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        409: {"model": ErrorResponse},
    },
)
def submit_transfer_attempt(
    session_id: uuid.UUID,
    payload: Annotated[dict[str, Any], Body()],
    current_user: User = Depends(require_student),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> SubmitTransferAttemptResponse:
    try:
        validated_payload = SubmitTransferAttemptRequest.model_validate(payload)
    except ValidationError as exc:
        raise RequestValidationError(exc.errors()) from exc
    return get_learning_flow_service(db).submit_transfer_attempt(
        session_id=session_id,
        user=current_user,
        payload=validated_payload,
    )


@router.get(
    "/{session_id}/result",
    response_model=DiagnosticResultResponse,
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        409: {"model": ErrorResponse},
    },
)
def get_result(
    session_id: uuid.UUID,
    current_user: User = Depends(require_student),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> DiagnosticResultResponse:
    return get_learning_flow_service(db).get_result(
        session_id=session_id,
        user=current_user,
    )
