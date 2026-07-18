from __future__ import annotations

import uuid
from typing import Literal

from pydantic import Field

from app.schemas.base import ApiSchema

DiagnosticSessionState = Literal[
    "diagnosing",
    "gap_confirmed",
    "in_remediation",
    "transfer_ready",
    "completed",
]
DiagnosticOutcome = Literal[
    "mastered_without_remediation",
    "mastered_after_remediation",
    "needs_teacher_support",
]


class StartDiagnosticSessionResponse(ApiSchema):
    session_id: uuid.UUID
    state: DiagnosticSessionState
    route: str
    resumed: bool


class DiagnosticOptionResponse(ApiSchema):
    id: uuid.UUID
    label: str


class DiagnosticQuestionResponse(ApiSchema):
    id: uuid.UUID
    prompt: str
    selection_mode: Literal["single"] = "single"
    options: list[DiagnosticOptionResponse]


class DiagnosticProgressResponse(ApiSchema):
    answered: int
    estimated_total: int | None = None
    total: int | None = None


class DiagnosticSessionResponse(ApiSchema):
    id: uuid.UUID
    assignment_id: uuid.UUID
    assignment_title: str
    state: DiagnosticSessionState
    progress: DiagnosticProgressResponse
    current_question: DiagnosticQuestionResponse | None = None
    next_route: str | None = None


class SubmitDiagnosticAttemptRequest(ApiSchema):
    question_id: uuid.UUID
    selected_option_id: uuid.UUID
    client_attempt_id: str = Field(min_length=1, max_length=100)


class DiagnosticFeedbackResponse(ApiSchema):
    title: str
    message: str
    tone: Literal["neutral", "encouraging", "corrective"]


class NextQuestionActionResponse(ApiSchema):
    type: Literal["next_question"] = "next_question"
    label: str


class NavigateActionResponse(ApiSchema):
    type: Literal["navigate"] = "navigate"
    label: str
    route: str


class CompletedActionResponse(ApiSchema):
    type: Literal["completed"] = "completed"
    label: str
    route: str


class SubmitDiagnosticAttemptResponse(ApiSchema):
    attempt_id: uuid.UUID
    correct: bool | None = None
    feedback: DiagnosticFeedbackResponse
    next_action: NextQuestionActionResponse | NavigateActionResponse | CompletedActionResponse


class StartRemediationRunResponse(ApiSchema):
    session_id: uuid.UUID
    run_id: uuid.UUID
    cycle_number: int
    state: DiagnosticSessionState
    route: str
    resumed: bool


class RemediationUnitResponse(ApiSchema):
    title: str
    summary: str
    explanation: str
    worked_example: str
    practice_instruction: str


class RemediationResponse(ApiSchema):
    session_id: uuid.UUID
    assignment_title: str
    state: DiagnosticSessionState
    cycle_number: int
    unit: RemediationUnitResponse
    progress: DiagnosticProgressResponse
    current_question: DiagnosticQuestionResponse | None = None
    next_route: str | None = None


class SubmitRemediationAttemptRequest(ApiSchema):
    question_id: uuid.UUID
    selected_option_id: uuid.UUID
    client_attempt_id: str = Field(min_length=1, max_length=100)


class SubmitRemediationAttemptResponse(ApiSchema):
    attempt_id: uuid.UUID
    correct: bool | None = None
    feedback: DiagnosticFeedbackResponse
    next_action: NextQuestionActionResponse | NavigateActionResponse


class StartTransferCheckResponse(ApiSchema):
    session_id: uuid.UUID
    transfer_check_id: uuid.UUID
    cycle_number: int
    state: DiagnosticSessionState
    route: str
    resumed: bool


class TransferResponse(ApiSchema):
    session_id: uuid.UUID
    assignment_title: str
    state: DiagnosticSessionState
    cycle_number: int
    progress: DiagnosticProgressResponse
    current_question: DiagnosticQuestionResponse | None = None
    next_route: str | None = None


class SubmitTransferAttemptRequest(ApiSchema):
    question_id: uuid.UUID
    selected_option_id: uuid.UUID
    client_attempt_id: str = Field(min_length=1, max_length=100)


class SubmitTransferAttemptResponse(ApiSchema):
    attempt_id: uuid.UUID
    correct: bool | None = None
    feedback: DiagnosticFeedbackResponse
    next_action: NextQuestionActionResponse | NavigateActionResponse | CompletedActionResponse


class ResultAssignmentResponse(ApiSchema):
    id: uuid.UUID
    title: str


class ResultSummaryResponse(ApiSchema):
    title: str
    message: str


class ResultEvidenceResponse(ApiSchema):
    diagnostic_questions_answered: int
    remediation_questions_answered: int
    transfer_questions_answered: int
    remediation_cycles: int


class ResultRootCauseResponse(ApiSchema):
    name: str


class DiagnosticResultResponse(ApiSchema):
    session_id: uuid.UUID
    assignment: ResultAssignmentResponse
    outcome: DiagnosticOutcome
    summary: ResultSummaryResponse
    learning_evidence: ResultEvidenceResponse
    root_cause: ResultRootCauseResponse | None = None
    completed_at: str | None = None
