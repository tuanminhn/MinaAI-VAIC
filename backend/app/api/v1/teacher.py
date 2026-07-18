from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies.auth import require_teacher
from app.api.dependencies.db import get_db
from app.db.models.user import User
from app.repositories.classroom_repository import ClassroomRepository
from app.repositories.teacher_repository import TeacherRepository
from app.schemas.common import ErrorResponse
from app.schemas.teacher import (
    TeacherAssignmentOverviewResponse,
    TeacherAssignmentStudentsResponse,
    TeacherClassAssignmentsResponse,
    TeacherClassDetailResponse,
    TeacherClassesResponse,
    TeacherLearningSessionEvidenceResponse,
    TeacherStudentsResponse,
    TeacherInterventionsResponse,
    TeacherStudentProfileResponse,
    TeacherSupportGroupsResponse,
    TeacherCreateAssignmentRequest,
    TeacherCreateAssignmentResponse,
)
from app.services.teacher_analytics_service import TeacherAnalyticsService
from app.services.teacher_class_service import TeacherClassService

router = APIRouter(prefix="/teacher", tags=["teacher"])


def get_teacher_class_service(db: Session) -> TeacherClassService:
    return TeacherClassService(classrooms=ClassroomRepository(db))


def get_teacher_analytics_service(db: Session) -> TeacherAnalyticsService:
    return TeacherAnalyticsService(
        teacher_repository=TeacherRepository(db),
        classrooms=ClassroomRepository(db),
    )


@router.get(
    "/classes",
    response_model=TeacherClassesResponse,
    responses={401: {"model": ErrorResponse}, 403: {"model": ErrorResponse}},
)
def teacher_classes(
    current_user: User = Depends(require_teacher),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> TeacherClassesResponse:
    return get_teacher_class_service(db).list_classes(user=current_user)


@router.get(
    "/classes/{class_id}",
    response_model=TeacherClassDetailResponse,
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
def teacher_class_detail(
    class_id: uuid.UUID,
    current_user: User = Depends(require_teacher),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> TeacherClassDetailResponse:
    return get_teacher_class_service(db).get_class_detail(user=current_user, class_id=class_id)


@router.get(
    "/classes/{class_id}/students",
    response_model=TeacherStudentsResponse,
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
def teacher_class_students(
    class_id: uuid.UUID,
    current_user: User = Depends(require_teacher),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> TeacherStudentsResponse:
    return get_teacher_class_service(db).list_students(user=current_user, class_id=class_id)


@router.get(
    "/classes/{class_id}/assignments",
    response_model=TeacherClassAssignmentsResponse,
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
def teacher_class_assignments(
    class_id: uuid.UUID,
    current_user: User = Depends(require_teacher),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> TeacherClassAssignmentsResponse:
    return get_teacher_analytics_service(db).list_class_assignments(
        user=current_user,
        class_id=class_id,
    )


@router.post("/classes/{class_id}/assignments", response_model=TeacherCreateAssignmentResponse, status_code=201)
def teacher_create_assignment(
    class_id: uuid.UUID,
    payload: TeacherCreateAssignmentRequest,
    current_user: User = Depends(require_teacher),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> TeacherCreateAssignmentResponse:
    return get_teacher_analytics_service(db).create_assignment(user=current_user, class_id=class_id, payload=payload)


@router.get(
    "/assignments/{assignment_id}/overview",
    response_model=TeacherAssignmentOverviewResponse,
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
def teacher_assignment_overview(
    assignment_id: uuid.UUID,
    current_user: User = Depends(require_teacher),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> TeacherAssignmentOverviewResponse:
    return get_teacher_analytics_service(db).get_assignment_overview(
        user=current_user,
        assignment_id=assignment_id,
    )


@router.get(
    "/assignments/{assignment_id}/students",
    response_model=TeacherAssignmentStudentsResponse,
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
def teacher_assignment_students(
    assignment_id: uuid.UUID,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, alias="pageSize", ge=1, le=50),
    current_user: User = Depends(require_teacher),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> TeacherAssignmentStudentsResponse:
    return get_teacher_analytics_service(db).list_assignment_students(
        user=current_user,
        assignment_id=assignment_id,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/learning-sessions/{session_id}",
    response_model=TeacherLearningSessionEvidenceResponse,
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
def teacher_learning_session(
    session_id: uuid.UUID,
    current_user: User = Depends(require_teacher),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> TeacherLearningSessionEvidenceResponse:
    return get_teacher_analytics_service(db).get_learning_session_evidence(
        user=current_user,
        session_id=session_id,
    )


@router.get("/support-groups", response_model=TeacherSupportGroupsResponse)
def teacher_support_groups(
    current_user: User = Depends(require_teacher),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> TeacherSupportGroupsResponse:
    return get_teacher_analytics_service(db).list_support_groups(user=current_user)


@router.get("/interventions", response_model=TeacherInterventionsResponse)
def teacher_interventions(
    current_user: User = Depends(require_teacher),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> TeacherInterventionsResponse:
    return get_teacher_analytics_service(db).list_interventions(user=current_user)


@router.get("/students/{student_id}/profile", response_model=TeacherStudentProfileResponse)
def teacher_student_profile(
    student_id: uuid.UUID,
    current_user: User = Depends(require_teacher),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
) -> TeacherStudentProfileResponse:
    return get_teacher_analytics_service(db).get_student_profile(
        user=current_user, student_id=student_id
    )
