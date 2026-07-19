from __future__ import annotations

from fastapi import Request
from fastapi.responses import JSONResponse

from app.schemas.common import ErrorResponse


class ApiErrorException(Exception):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        super().__init__(message)


async def api_error_exception_handler(
    _: Request,
    exc: ApiErrorException,
) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(code=exc.code, message=exc.message).model_dump(),
    )
