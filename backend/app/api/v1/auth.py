from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_user
from app.api.dependencies.db import get_db
from app.api.errors import ApiErrorException
from app.core.config import get_settings
from app.core.logging import get_logger
from app.db.models.user import User
from app.schemas.auth import AuthUserResponse, LoginRequest, LoginResponse
from app.schemas.common import ErrorResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])
logger = get_logger(__name__)


def serialize_user(user: User) -> AuthUserResponse:
    return AuthUserResponse(
        id=user.id,
        display_name=user.display_name,
        role=user.role,
    )


def set_auth_cookie(response: Response, raw_session_token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=raw_session_token,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        path="/",
        max_age=settings.auth_session_ttl_minutes * 60,
    )


def clear_auth_cookie(response: Response) -> None:
    settings = get_settings()
    response.delete_cookie(
        key=settings.auth_cookie_name,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        path="/",
    )


@router.post(
    "/login",
    response_model=LoginResponse,
    responses={401: {"model": ErrorResponse}},
)
def login(
    input: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),  # noqa: B008
) -> LoginResponse:
    auth_service = AuthService(db)
    result = auth_service.authenticate(input.username, input.password)

    if result is None:
        logger.warning("Login failed for username=%s", input.username.strip().lower())
        raise ApiErrorException(
            status_code=401,
            code="INVALID_CREDENTIALS",
            message="Tên đăng nhập hoặc mật khẩu không đúng.",
        )

    set_auth_cookie(response, result.raw_session_token)
    logger.info("Login success user_id=%s role=%s", result.user.id, result.user.role)
    return LoginResponse(user=serialize_user(result.user))


@router.get(
    "/me",
    response_model=AuthUserResponse,
    responses={401: {"model": ErrorResponse}},
)
def me(current_user: User = Depends(get_current_user)) -> AuthUserResponse:  # noqa: B008
    return serialize_user(current_user)


@router.post("/logout", status_code=204)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),  # noqa: B008
) -> Response:
    cookie_value = request.cookies.get(get_settings().auth_cookie_name)
    if cookie_value is not None:
        auth_service = AuthService(db)
        revoked = auth_service.revoke_session(cookie_value)
        if revoked:
            logger.info("Logout success")

    clear_auth_cookie(response)
    response.status_code = 204
    return response
