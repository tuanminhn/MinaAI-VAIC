from __future__ import annotations

import uuid
from datetime import datetime
from pydantic import Field

from app.schemas.base import ApiSchema


class TeacherClassSummaryResponse(ApiSchema):
    id: uuid.UUID
    code: str
    name: str
    grade: int
    academic_year: str
    school_name: str
    student_count: int


class TeacherClassesResponse(ApiSchema):
    items: list[TeacherClassSummaryResponse]


class TeacherClassSchoolResponse(ApiSchema):
    id: uuid.UUID
    name: str


class TeacherClassDetailResponse(ApiSchema):
    id: uuid.UUID
    code: str
    name: str
    grade: int
    academic_year: str
    school: TeacherClassSchoolResponse


class TeacherStudentSummaryResponse(ApiSchema):
    id: uuid.UUID
    display_name: str
    is_active: bool


class TeacherStudentsResponse(ApiSchema):
    items: list[TeacherStudentSummaryResponse]


class TeacherAssignmentSummaryResponse(ApiSchema):
    id: uuid.UUID
    title: str
    status: str
    student_count: int
    assigned_at: datetime
    due_at: datetime | None


class TeacherClassAssignmentsResponse(ApiSchema):
    items: list[TeacherAssignmentSummaryResponse]


class TeacherCreateAssignmentRequest(ApiSchema):
    title: str = Field(min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    target_skill_code: str = Field(min_length=3, max_length=150)
    estimated_minutes: int = Field(default=15, ge=1, le=240)
    due_at: datetime | None = None
    publish: bool = True


class TeacherCreateAssignmentResponse(ApiSchema):
    id: uuid.UUID
    title: str
    status: str
    student_count: int


class TeacherAssignmentOverviewAssignmentResponse(ApiSchema):
    id: uuid.UUID
    title: str
    classroom_name: str


class TeacherAssignmentOverviewCountsResponse(ApiSchema):
    not_started: int
    diagnosing: int
    in_remediation: int
    completed: int
    needs_support: int


class TeacherRootCauseGroupResponse(ApiSchema):
    skill_name: str
    student_count: int


class TeacherAssignmentOverviewResponse(ApiSchema):
    assignment: TeacherAssignmentOverviewAssignmentResponse
    counts: TeacherAssignmentOverviewCountsResponse
    root_cause_groups: list[TeacherRootCauseGroupResponse]


class TeacherAssignmentStudentInfoResponse(ApiSchema):
    id: uuid.UUID
    display_name: str


class TeacherAssignmentStudentRowResponse(ApiSchema):
    student: TeacherAssignmentStudentInfoResponse
    session_id: uuid.UUID | None
    assignment_status: str
    session_state: str | None
    outcome: str | None
    root_cause_skill_name: str | None
    diagnostic_attempts: int
    remediation_attempts: int
    transfer_attempts: int
    updated_at: datetime


class TeacherAssignmentStudentsResponse(ApiSchema):
    items: list[TeacherAssignmentStudentRowResponse]
    page: int
    page_size: int
    total: int


class TeacherEvidenceStudentResponse(ApiSchema):
    id: uuid.UUID
    display_name: str


class TeacherEvidenceAssignmentResponse(ApiSchema):
    id: uuid.UUID
    title: str


class TeacherEvidenceRootCauseResponse(ApiSchema):
    name: str


class TeacherTimelineEventResponse(ApiSchema):
    from_state: str | None
    to_state: str
    reason_code: str
    skill_name: str | None
    created_at: datetime


class TeacherEvidenceAttemptResponse(ApiSchema):
    phase: str
    question_prompt: str
    selected_option_label: str
    is_correct: bool
    skill_name: str
    answered_at: datetime


class TeacherLearningSessionEvidenceResponse(ApiSchema):
    student: TeacherEvidenceStudentResponse
    assignment: TeacherEvidenceAssignmentResponse
    state: str
    outcome: str | None
    root_cause: TeacherEvidenceRootCauseResponse | None
    timeline: list[TeacherTimelineEventResponse]
    attempts: list[TeacherEvidenceAttemptResponse]


class TeacherSupportGroupResponse(ApiSchema):
    skill_id: uuid.UUID
    skill_name: str
    student_count: int
    needs_support_count: int
    classroom_names: list[str]


class TeacherSupportGroupsResponse(ApiSchema):
    items: list[TeacherSupportGroupResponse]


class TeacherInterventionResponse(ApiSchema):
    student_id: uuid.UUID
    student_name: str
    classroom_name: str
    assignment_id: uuid.UUID
    assignment_title: str
    session_id: uuid.UUID
    root_cause_skill_name: str | None
    priority: str
    priority_score: int
    reason: str
    updated_at: datetime


class TeacherInterventionsResponse(ApiSchema):
    items: list[TeacherInterventionResponse]


class TeacherStudentMasteryResponse(ApiSchema):
    skill_id: uuid.UUID
    skill_name: str
    status: str
    mastery_score: float
    confidence: float
    evidence_count: int
    last_evaluated_at: datetime | None


class TeacherStudentSessionResponse(ApiSchema):
    session_id: uuid.UUID
    assignment_id: uuid.UUID
    assignment_title: str
    state: str
    outcome: str | None
    root_cause_skill_name: str | None
    updated_at: datetime


class TeacherStudentProfileResponse(ApiSchema):
    id: uuid.UUID
    display_name: str
    classroom_name: str
    school_name: str
    masteries: list[TeacherStudentMasteryResponse]
    recent_sessions: list[TeacherStudentSessionResponse]
