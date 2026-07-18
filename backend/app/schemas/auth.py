from __future__ import annotations

import uuid

from pydantic import BaseModel, Field

from app.schemas.base import ApiSchema


class LoginRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


class AuthUserResponse(ApiSchema):
    id: uuid.UUID
    display_name: str
    role: str
    school_name: str | None = None
    classroom_name: str | None = None


class LoginResponse(ApiSchema):
    user: AuthUserResponse
