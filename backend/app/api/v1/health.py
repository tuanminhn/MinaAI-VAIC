from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.db.session import check_database_connection
from app.schemas.common import ErrorResponse
from app.schemas.health import HealthReadyResponse, HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="mina-backend")


@router.get(
    "/health/ready",
    response_model=HealthReadyResponse,
    responses={503: {"model": ErrorResponse}},
)
def ready() -> HealthReadyResponse | JSONResponse:
    if not check_database_connection():
        return JSONResponse(
            status_code=503,
            content=ErrorResponse(
                code="DATABASE_UNAVAILABLE",
                message="Máy chủ dữ liệu chưa sẵn sàng.",
            ).model_dump(),
        )

    return HealthReadyResponse(status="ready", database="reachable")
