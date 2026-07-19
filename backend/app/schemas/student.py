from __future__ import annotations

import uuid
from typing import Literal

from app.schemas.base import ApiSchema


class AssignmentProgressResponse(ApiSchema):
    completed: int
    total: int


class AssignmentSummaryResponse(ApiSchema):
    id: uuid.UUID
    title: str
    description: str | None = None
    subject: Literal["math"] = "math"
    grade: int
    status: str
    progress: AssignmentProgressResponse
    estimated_minutes: int | None = None
    assigned_at: str | None = None
    due_at: str | None = None
    diagnostic_available: bool
    next_route: str | None = None


class StudentHomeStudentResponse(ApiSchema):
    id: uuid.UUID
    display_name: str
    classroom_name: str | None = None
    school_name: str | None = None


class StudentHomeResponse(ApiSchema):
    student: StudentHomeStudentResponse
    current_assignment: AssignmentSummaryResponse | None = None
    recent_assignments: list[AssignmentSummaryResponse]


class StudentAssignmentsResponse(ApiSchema):
    items: list[AssignmentSummaryResponse]
    page: int
    page_size: int
    total: int
