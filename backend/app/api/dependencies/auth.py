from __future__ import annotations

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.api.dependencies.db import get_db
from app.api.errors import ApiErrorException
from app.core.config import get_settings
from app.db.models.user import User
from app.services.auth_service import AuthService


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:  # noqa: B008
    return AuthService(db)


def get_current_user(
    request: Request,
    auth_service: AuthService = Depends(get_auth_service),  # noqa: B008
) -> User:
    session_cookie = request.cookies.get(get_settings().auth_cookie_name)
    if not session_cookie:
        raise ApiErrorException(
            status_code=401,
            code="AUTH_REQUIRED",
            message="Bạn cần đăng nhập để tiếp tục.",
        )

    user = auth_service.get_user_for_token(session_cookie)
    if user is None:
        raise ApiErrorException(
            status_code=401,
            code="SESSION_EXPIRED",
            message="Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        )
    return user


def require_student(current_user: User = Depends(get_current_user)) -> User:  # noqa: B008
    if current_user.role != "student":
        raise ApiErrorException(
            status_code=403,
            code="FORBIDDEN",
            message="Bạn không có quyền truy cập tài nguyên này.",
        )
    return current_user


def require_teacher(current_user: User = Depends(get_current_user)) -> User:  # noqa: B008
    if current_user.role != "teacher":
        raise ApiErrorException(
            status_code=403,
            code="FORBIDDEN",
            message="Bạn không có quyền truy cập tài nguyên này.",
        )
    return current_user
