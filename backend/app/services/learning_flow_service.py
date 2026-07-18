from __future__ import annotations

import uuid
from datetime import UTC, datetime

from app.api.errors import ApiErrorException
from app.db.models.diagnostic_session import DiagnosticSession
from app.db.models.learning_session_transition import LearningSessionTransition
from app.db.models.question_item import QuestionItem
from app.db.models.remediation_attempt import RemediationAttempt
from app.db.models.remediation_run import RemediationRun
from app.db.models.transfer_attempt import TransferAttempt
from app.db.models.transfer_check import TransferCheck
from app.db.models.user import User
from app.repositories.content_repository import ContentRepository
from app.repositories.diagnostic_repository import DiagnosticRepository
from app.schemas.diagnostic import (
    CompletedActionResponse,
    DiagnosticFeedbackResponse,
    DiagnosticOptionResponse,
    DiagnosticProgressResponse,
    DiagnosticQuestionResponse,
    DiagnosticResultResponse,
    NavigateActionResponse,
    NextQuestionActionResponse,
    RemediationResponse,
    RemediationUnitResponse,
    ResultAssignmentResponse,
    ResultEvidenceResponse,
    ResultRootCauseResponse,
    ResultSummaryResponse,
    StartRemediationRunResponse,
    StartTransferCheckResponse,
    SubmitRemediationAttemptRequest,
    SubmitRemediationAttemptResponse,
    SubmitTransferAttemptRequest,
    SubmitTransferAttemptResponse,
    TransferResponse,
)
from app.services.learning_state_machine import LearningStateMachine
from app.services.mastery_service import record_skill_evidence

QUESTION_COUNT_PER_PHASE = 2


class LearningFlowService:
    def __init__(
        self,
        *,
        diagnostic_repository: DiagnosticRepository,
        content_repository: ContentRepository,
        state_machine: LearningStateMachine,
    ) -> None:
        self.diagnostic_repository = diagnostic_repository
        self.content_repository = content_repository
        self.state_machine = state_machine

    def start_or_resume_remediation(
        self,
        *,
        session_id: uuid.UUID,
        user: User,
    ) -> StartRemediationRunResponse:
        session = self._get_session_for_student_with_lock(session_id=session_id, user=user)
        if session.state not in {"gap_confirmed", "in_remediation"}:
            raise ApiErrorException(
                409,
                "REMEDIATION_SESSION_NOT_READY",
                "Phiên học này chưa sẵn sàng cho phần củng cố.",
            )
        if session.root_cause_skill_id is None:
            raise ApiErrorException(
                409,
                "REMEDIATION_SESSION_NOT_READY",
                "Phiên học này chưa xác định được phần kiến thức cần củng cố.",
            )

        existing_run = self.diagnostic_repository.get_active_remediation_run_with_lock(session.id)
        if existing_run is not None:
            return StartRemediationRunResponse(
                session_id=session.id,
                run_id=existing_run.id,
                cycle_number=existing_run.cycle_number,
                state=session.state,
                route=f"/student/remediation/{session.id}",
                resumed=True,
            )

        cycle_number = session.remediation_cycle_count + 1
        if cycle_number > 2:
            raise ApiErrorException(
                409,
                "LEARNING_STATE_CONFLICT",
                "Phiên học này đã đạt giới hạn số lần củng cố.",
            )

        units = self.content_repository.list_remediation_units(skill_id=session.root_cause_skill_id)
        if not units:
            raise ApiErrorException(
                409,
                "REMEDIATION_CONTENT_INSUFFICIENT",
                "Nội dung củng cố hiện chưa đủ để tiếp tục bài học này.",
            )
        questions = self.diagnostic_repository.list_questions_for_skill_and_purpose(
            skill_id=session.root_cause_skill_id,
            purpose="remediation",
        )
        if len(questions) < QUESTION_COUNT_PER_PHASE:
            raise ApiErrorException(
                409,
                "REMEDIATION_CONTENT_INSUFFICIENT",
                "Nội dung củng cố hiện chưa đủ để tiếp tục bài học này.",
            )

        previous_state = session.state
        session.state = "in_remediation"
        session.remediation_cycle_count = cycle_number
        session.assignment_recipient.status = "remediation"

        run = self.diagnostic_repository.add(
            RemediationRun(
                session_id=session.id,
                remediation_unit_id=units[0].id,
                cycle_number=cycle_number,
                status="active",
                started_at=datetime.now(UTC),
            )
        )
        self._record_transition(
            session=session,
            from_state=previous_state,
            to_state="in_remediation",
            reason_code="remediation_started",
            skill_id=session.root_cause_skill_id,
        )
        self.diagnostic_repository.session.flush()
        return StartRemediationRunResponse(
            session_id=session.id,
            run_id=run.id,
            cycle_number=run.cycle_number,
            state=session.state,
            route=f"/student/remediation/{session.id}",
            resumed=False,
        )

    def get_remediation(self, *, session_id: uuid.UUID, user: User) -> RemediationResponse:
        session = self._get_session_for_student(session_id=session_id, user=user)
        run = self.diagnostic_repository.get_active_remediation_run(session.id)
        if session.state != "in_remediation" or run is None:
            raise ApiErrorException(
                409,
                "REMEDIATION_SESSION_NOT_READY",
                "Phiên học này chưa sẵn sàng cho phần củng cố.",
            )

        current_question = self._get_current_remediation_question(run)
        return RemediationResponse(
            session_id=session.id,
            assignment_title=session.assignment_recipient.assignment.title,
            state=session.state,
            cycle_number=run.cycle_number,
            unit=RemediationUnitResponse(
                title=run.remediation_unit.title,
                summary=run.remediation_unit.summary,
                explanation=run.remediation_unit.explanation,
                worked_example=run.remediation_unit.worked_example,
                practice_instruction=run.remediation_unit.practice_instruction,
            ),
            progress=DiagnosticProgressResponse(
                answered=self.diagnostic_repository.get_remediation_attempt_count(run.id),
                total=QUESTION_COUNT_PER_PHASE,
            ),
            current_question=self._serialize_question(current_question)
            if current_question is not None
            else None,
            next_route=None,
        )

    def submit_remediation_attempt(
        self,
        *,
        session_id: uuid.UUID,
        user: User,
        payload: SubmitRemediationAttemptRequest,
    ) -> SubmitRemediationAttemptResponse:
        session = self._get_session_for_student_with_lock(session_id=session_id, user=user)
        run = self.diagnostic_repository.get_active_remediation_run_with_lock(session.id)
        if session.state != "in_remediation" or run is None:
            raise ApiErrorException(
                409,
                "LEARNING_PHASE_CLOSED",
                "Phần củng cố này hiện không còn mở.",
            )

        existing_attempt = self.diagnostic_repository.get_remediation_attempt_by_client_attempt_id(
            remediation_run_id=run.id,
            client_attempt_id=payload.client_attempt_id,
        )
        if existing_attempt is not None:
            if (
                existing_attempt.question_id != payload.question_id
                or existing_attempt.selected_option_id != payload.selected_option_id
            ):
                raise ApiErrorException(
                    409,
                    "ATTEMPT_CONFLICT",
                    "Yêu cầu gửi lại không khớp với lần gửi trước.",
                )
            return self._build_remediation_attempt_response(
                session=session,
                run=run,
                attempt=existing_attempt,
            )

        current_question = self._get_current_remediation_question(run)
        if current_question is None or current_question.id != payload.question_id:
            raise ApiErrorException(
                409,
                "QUESTION_NOT_CURRENT",
                "Câu hỏi này không còn là câu hỏi hiện tại.",
            )

        selected_option = self.diagnostic_repository.get_option(payload.selected_option_id)
        if selected_option is None or selected_option.question_id != current_question.id:
            raise ApiErrorException(
                400,
                "OPTION_NOT_IN_QUESTION",
                "Đáp án đã chọn không thuộc câu hỏi hiện tại.",
            )

        answered_before = self.diagnostic_repository.get_remediation_attempt_count(run.id)
        attempt = self.diagnostic_repository.add(
            RemediationAttempt(
                remediation_run_id=run.id,
                question_id=current_question.id,
                selected_option_id=selected_option.id,
                client_attempt_id=payload.client_attempt_id,
                sequence_number=answered_before + 1,
                is_correct=bool(selected_option.is_correct),
            )
        )
        record_skill_evidence(
            self.diagnostic_repository.session,
            student_user_id=user.id,
            skill_id=current_question.skill_id,
            is_correct=attempt.is_correct,
            phase="remediation",
        )

        answered_after = answered_before + 1
        if answered_after < QUESTION_COUNT_PER_PHASE:
            self.diagnostic_repository.session.flush()
            return self._build_remediation_attempt_response(
                session=session,
                run=run,
                attempt=attempt,
            )

        run.status = "completed"
        run.completed_at = datetime.now(UTC)
        previous_state = session.state
        session.state = "transfer_ready"
        session.assignment_recipient.status = "transfer_ready"
        self._record_transition(
            session=session,
            from_state=previous_state,
            to_state="transfer_ready",
            reason_code="remediation_completed",
            skill_id=session.root_cause_skill_id,
        )
        self.diagnostic_repository.session.flush()
        return self._build_remediation_attempt_response(session=session, run=run, attempt=attempt)

    def start_or_resume_transfer(
        self,
        *,
        session_id: uuid.UUID,
        user: User,
    ) -> StartTransferCheckResponse:
        session = self._get_session_for_student_with_lock(session_id=session_id, user=user)
        if session.state != "transfer_ready":
            raise ApiErrorException(
                409,
                "REMEDIATION_SESSION_NOT_READY",
                "Phiên học này chưa sẵn sàng cho phần kiểm tra lại.",
            )

        existing_check = self.diagnostic_repository.get_active_transfer_check_with_lock(session.id)
        if existing_check is not None:
            return StartTransferCheckResponse(
                session_id=session.id,
                transfer_check_id=existing_check.id,
                cycle_number=existing_check.cycle_number,
                state=session.state,
                route=f"/student/transfer/{session.id}",
                resumed=True,
            )

        cycle_number = session.transfer_cycle_count + 1
        if cycle_number > 2:
            raise ApiErrorException(
                409,
                "LEARNING_STATE_CONFLICT",
                "Phiên học này đã đạt giới hạn số lần kiểm tra lại.",
            )
        questions = self.diagnostic_repository.list_questions_for_skill_and_purpose(
            skill_id=session.target_skill_id,
            purpose="transfer",
        )
        if len(questions) < QUESTION_COUNT_PER_PHASE:
            raise ApiErrorException(
                409,
                "TRANSFER_CONTENT_INSUFFICIENT",
                "Nội dung kiểm tra lại hiện chưa đủ để tiếp tục bài học này.",
            )

        session.transfer_cycle_count = cycle_number
        transfer_check = self.diagnostic_repository.add(
            TransferCheck(
                session_id=session.id,
                target_skill_id=session.target_skill_id,
                cycle_number=cycle_number,
                status="active",
                correct_count=0,
                answered_count=0,
                started_at=datetime.now(UTC),
            )
        )
        self.diagnostic_repository.session.flush()
        return StartTransferCheckResponse(
            session_id=session.id,
            transfer_check_id=transfer_check.id,
            cycle_number=transfer_check.cycle_number,
            state=session.state,
            route=f"/student/transfer/{session.id}",
            resumed=False,
        )

    def get_transfer(self, *, session_id: uuid.UUID, user: User) -> TransferResponse:
        session = self._get_session_for_student(session_id=session_id, user=user)
        transfer_check = self.diagnostic_repository.get_active_transfer_check(session.id)
        if session.state != "transfer_ready" or transfer_check is None:
            raise ApiErrorException(
                409,
                "LEARNING_PHASE_CLOSED",
                "Phần kiểm tra lại này hiện không còn mở.",
            )

        current_question = self._get_current_transfer_question(session, transfer_check)
        return TransferResponse(
            session_id=session.id,
            assignment_title=session.assignment_recipient.assignment.title,
            state=session.state,
            cycle_number=transfer_check.cycle_number,
            progress=DiagnosticProgressResponse(
                answered=transfer_check.answered_count,
                total=QUESTION_COUNT_PER_PHASE,
            ),
            current_question=self._serialize_question(current_question)
            if current_question is not None
            else None,
            next_route=None,
        )

    def submit_transfer_attempt(
        self,
        *,
        session_id: uuid.UUID,
        user: User,
        payload: SubmitTransferAttemptRequest,
    ) -> SubmitTransferAttemptResponse:
        session = self._get_session_for_student_with_lock(session_id=session_id, user=user)
        transfer_check = self.diagnostic_repository.get_active_transfer_check_with_lock(session.id)
        if session.state != "transfer_ready" or transfer_check is None:
            raise ApiErrorException(
                409,
                "LEARNING_PHASE_CLOSED",
                "Phần kiểm tra lại này hiện không còn mở.",
            )

        existing_attempt = self.diagnostic_repository.get_transfer_attempt_by_client_attempt_id(
            transfer_check_id=transfer_check.id,
            client_attempt_id=payload.client_attempt_id,
        )
        if existing_attempt is not None:
            if (
                existing_attempt.question_id != payload.question_id
                or existing_attempt.selected_option_id != payload.selected_option_id
            ):
                raise ApiErrorException(
                    409,
                    "ATTEMPT_CONFLICT",
                    "Yêu cầu gửi lại không khớp với lần gửi trước.",
                )
            return self._build_transfer_attempt_response(
                session=session,
                transfer_check=transfer_check,
                attempt=existing_attempt,
            )

        current_question = self._get_current_transfer_question(session, transfer_check)
        if current_question is None or current_question.id != payload.question_id:
            raise ApiErrorException(
                409,
                "QUESTION_NOT_CURRENT",
                "Câu hỏi này không còn là câu hỏi hiện tại.",
            )

        selected_option = self.diagnostic_repository.get_option(payload.selected_option_id)
        if selected_option is None or selected_option.question_id != current_question.id:
            raise ApiErrorException(
                400,
                "OPTION_NOT_IN_QUESTION",
                "Đáp án đã chọn không thuộc câu hỏi hiện tại.",
            )

        attempt = self.diagnostic_repository.add(
            TransferAttempt(
                transfer_check_id=transfer_check.id,
                question_id=current_question.id,
                selected_option_id=selected_option.id,
                client_attempt_id=payload.client_attempt_id,
                sequence_number=self.diagnostic_repository.get_transfer_attempt_count(
                    transfer_check.id
                )
                + 1,
                is_correct=bool(selected_option.is_correct),
            )
        )
        record_skill_evidence(
            self.diagnostic_repository.session,
            student_user_id=user.id,
            skill_id=current_question.skill_id,
            is_correct=attempt.is_correct,
            phase="transfer",
        )
        transfer_check.answered_count += 1
        if attempt.is_correct:
            transfer_check.correct_count += 1

        if transfer_check.answered_count < QUESTION_COUNT_PER_PHASE:
            self.diagnostic_repository.session.flush()
            return self._build_transfer_attempt_response(
                session=session,
                transfer_check=transfer_check,
                attempt=attempt,
            )

        passed = transfer_check.correct_count == QUESTION_COUNT_PER_PHASE
        transfer_check.status = "passed" if passed else "failed"
        transfer_check.completed_at = datetime.now(UTC)
        decision = self.state_machine.decide_after_transfer(
            passed=passed,
            cycle_number=transfer_check.cycle_number,
        )

        if decision.kind == "retry_remediation":
            previous_state = session.state
            session.state = "in_remediation"
            session.assignment_recipient.status = "remediation"
            self._record_transition(
                session=session,
                from_state=previous_state,
                to_state="in_remediation",
                reason_code="transfer_retry_required",
                skill_id=session.root_cause_skill_id,
            )
            self.diagnostic_repository.session.flush()
            return self._build_transfer_attempt_response(
                session=session,
                transfer_check=transfer_check,
                attempt=attempt,
            )

        if decision.outcome is None:
            raise RuntimeError("Completed transfer decision must include an outcome.")

        self._complete_session_after_transfer(session=session, outcome=decision.outcome)
        self.diagnostic_repository.session.flush()
        return self._build_transfer_attempt_response(
            session=session,
            transfer_check=transfer_check,
            attempt=attempt,
        )

    def get_result(self, *, session_id: uuid.UUID, user: User) -> DiagnosticResultResponse:
        session = self._get_session_for_student(session_id=session_id, user=user)
        if session.state != "completed" or session.outcome is None:
            raise ApiErrorException(
                409,
                "LEARNING_PHASE_CLOSED",
                "Phiên học này chưa có kết quả cuối cùng.",
            )

        diagnostic_count = self.diagnostic_repository.get_attempt_count(session.id)
        remediation_count = sum(
            self.diagnostic_repository.get_remediation_attempt_count(run.id)
            for run in session.remediation_runs
        )
        transfer_count = sum(
            self.diagnostic_repository.get_transfer_attempt_count(check.id)
            for check in session.transfer_checks
        )
        summary_title, summary_message = self._result_summary(session.outcome)
        return DiagnosticResultResponse(
            session_id=session.id,
            assignment=ResultAssignmentResponse(
                id=session.assignment_recipient.assignment.id,
                title=session.assignment_recipient.assignment.title,
            ),
            outcome=session.outcome,
            summary=ResultSummaryResponse(
                title=summary_title,
                message=summary_message,
            ),
            learning_evidence=ResultEvidenceResponse(
                diagnostic_questions_answered=diagnostic_count,
                remediation_questions_answered=remediation_count,
                transfer_questions_answered=transfer_count,
                remediation_cycles=session.remediation_cycle_count,
            ),
            root_cause=ResultRootCauseResponse(name=session.root_cause_skill.name)
            if session.root_cause_skill is not None
            else None,
            completed_at=session.completed_at.isoformat().replace("+00:00", "Z")
            if session.completed_at
            else None,
        )

    def _complete_session_after_transfer(
        self,
        *,
        session: DiagnosticSession,
        outcome: str,
    ) -> None:
        previous_state = session.state
        session.state = "completed"
        session.outcome = outcome
        session.current_skill_id = None
        session.completed_at = datetime.now(UTC)
        if outcome == "needs_teacher_support":
            session.assignment_recipient.status = "remediation"
            session.assignment_recipient.completed_at = None
        else:
            session.assignment_recipient.status = "completed"
            session.assignment_recipient.completed_at = session.completed_at
        total_answered = (
            self.diagnostic_repository.get_attempt_count(session.id)
            + sum(
                self.diagnostic_repository.get_remediation_attempt_count(run.id)
                for run in session.remediation_runs
            )
            + sum(
                self.diagnostic_repository.get_transfer_attempt_count(check.id)
                for check in session.transfer_checks
            )
        )
        session.assignment_recipient.progress_total = total_answered
        session.assignment_recipient.progress_completed = total_answered
        self._record_transition(
            session=session,
            from_state=previous_state,
            to_state="completed",
            reason_code="transfer_completed",
            skill_id=session.root_cause_skill_id,
        )

    def _record_transition(
        self,
        *,
        session: DiagnosticSession,
        from_state: str | None,
        to_state: str,
        reason_code: str,
        skill_id: uuid.UUID | None,
    ) -> None:
        self.diagnostic_repository.add(
            LearningSessionTransition(
                session=session,
                from_state=from_state,
                to_state=to_state,
                reason_code=reason_code,
                skill_id=skill_id,
            )
        )

    def _get_current_remediation_question(self, run: RemediationRun) -> QuestionItem | None:
        all_questions = self.diagnostic_repository.list_questions_for_skill_and_purpose(
            skill_id=run.remediation_unit.skill_id,
            purpose="remediation",
        )
        if len(all_questions) < QUESTION_COUNT_PER_PHASE:
            raise ApiErrorException(
                409,
                "REMEDIATION_CONTENT_INSUFFICIENT",
                "Nội dung củng cố hiện chưa đủ để tiếp tục bài học này.",
            )
        current_attempts = self.diagnostic_repository.list_remediation_attempts(run.id)
        used_in_run = {attempt.question_id for attempt in current_attempts}
        session_runs = self.diagnostic_repository.list_remediation_runs(run.session_id)
        used_before_current = {
            attempt.question_id
            for session_run in session_runs
            if session_run.id != run.id
            for attempt in session_run.attempts
        }
        remaining_unused = [
            question
            for question in all_questions
            if question.id not in used_before_current and question.id not in used_in_run
        ]
        if len(remaining_unused) >= QUESTION_COUNT_PER_PHASE:
            pool = remaining_unused
        else:
            pool = [question for question in all_questions if question.id not in used_in_run]
        return pool[0] if pool else None

    def _get_current_transfer_question(
        self,
        session: DiagnosticSession,
        transfer_check: TransferCheck,
    ) -> QuestionItem | None:
        all_questions = self.diagnostic_repository.list_questions_for_skill_and_purpose(
            skill_id=session.target_skill_id,
            purpose="transfer",
        )
        if len(all_questions) < QUESTION_COUNT_PER_PHASE:
            raise ApiErrorException(
                409,
                "TRANSFER_CONTENT_INSUFFICIENT",
                "Nội dung kiểm tra lại hiện chưa đủ để tiếp tục bài học này.",
            )
        current_attempts = self.diagnostic_repository.list_transfer_attempts(transfer_check.id)
        used_in_check = {attempt.question_id for attempt in current_attempts}
        previous_checks = self.diagnostic_repository.list_transfer_checks(session.id)
        used_before_current = {
            attempt.question_id
            for check in previous_checks
            if check.id != transfer_check.id
            for attempt in check.attempts
        }
        remaining_unused = [
            question
            for question in all_questions
            if question.id not in used_before_current and question.id not in used_in_check
        ]
        if len(remaining_unused) >= QUESTION_COUNT_PER_PHASE:
            pool = remaining_unused
        else:
            pool = [question for question in all_questions if question.id not in used_in_check]
        return pool[0] if pool else None

    def _build_remediation_attempt_response(
        self,
        *,
        session: DiagnosticSession,
        run: RemediationRun,
        attempt: RemediationAttempt,
    ) -> SubmitRemediationAttemptResponse:
        if session.state == "transfer_ready":
            return SubmitRemediationAttemptResponse(
                attempt_id=attempt.id,
                correct=attempt.is_correct,
                feedback=DiagnosticFeedbackResponse(
                    title="Em đã hoàn thành phần luyện tập",
                    message="Mình cùng kiểm tra lại một lần nhé.",
                    tone="encouraging",
                ),
                next_action=NavigateActionResponse(
                    label="Bắt đầu kiểm tra lại",
                    route=f"/student/transfer/{session.id}",
                ),
            )
        return SubmitRemediationAttemptResponse(
            attempt_id=attempt.id,
            correct=attempt.is_correct,
            feedback=DiagnosticFeedbackResponse(
                title="Đã ghi nhận câu trả lời",
                message="Mình tiếp tục thêm một bước ngắn nữa nhé.",
                tone="neutral" if not attempt.is_correct else "encouraging",
            ),
            next_action=NextQuestionActionResponse(label="Câu tiếp theo"),
        )

    def _build_transfer_attempt_response(
        self,
        *,
        session: DiagnosticSession,
        transfer_check: TransferCheck,
        attempt: TransferAttempt,
    ) -> SubmitTransferAttemptResponse:
        if session.state == "completed":
            return SubmitTransferAttemptResponse(
                attempt_id=attempt.id,
                correct=attempt.is_correct,
                feedback=DiagnosticFeedbackResponse(
                    title="Em đã hoàn thành bài học",
                    message=(
                        "Em đã củng cố kiến thức nền và hoàn thành phần kiểm tra lại."
                        if session.outcome == "mastered_after_remediation"
                        else "Mina đã ghi nhận phần kiến thức em cần được hỗ trợ thêm."
                    ),
                    tone="encouraging" if session.outcome != "needs_teacher_support" else "neutral",
                ),
                next_action=CompletedActionResponse(
                    label="Xem kết quả",
                    route=f"/student/result/{session.id}",
                ),
            )
        if session.state == "in_remediation":
            return SubmitTransferAttemptResponse(
                attempt_id=attempt.id,
                correct=attempt.is_correct,
                feedback=DiagnosticFeedbackResponse(
                    title="Mình cùng củng cố thêm một lần",
                    message="Mina sẽ mở lại phần luyện tập liên quan để em thử thêm.",
                    tone="neutral",
                ),
                next_action=NavigateActionResponse(
                    label="Củng cố thêm một lần",
                    route=f"/student/remediation/{session.id}",
                ),
            )
        return SubmitTransferAttemptResponse(
            attempt_id=attempt.id,
            correct=attempt.is_correct,
            feedback=DiagnosticFeedbackResponse(
                title="Đã ghi nhận câu trả lời",
                message="Em tiếp tục thêm một câu nữa nhé.",
                tone="encouraging" if attempt.is_correct else "neutral",
            ),
            next_action=NextQuestionActionResponse(label="Câu tiếp theo"),
        )

    @staticmethod
    def _serialize_question(question: QuestionItem) -> DiagnosticQuestionResponse:
        return DiagnosticQuestionResponse(
            id=question.id,
            prompt=question.prompt,
            selection_mode="single",
            options=[
                DiagnosticOptionResponse(id=option.id, label=option.label)
                for option in sorted(
                    question.options, key=lambda item: (item.sort_order, item.code)
                )
            ],
        )

    @staticmethod
    def _result_summary(outcome: str) -> tuple[str, str]:
        if outcome == "mastered_without_remediation":
            return (
                "Em đã hoàn thành bài học",
                "Em đã thực hiện tốt các bước kiến thức cần thiết trong phần kiểm tra.",
            )
        if outcome == "mastered_after_remediation":
            return (
                "Em đã hoàn thành bài học",
                "Em đã củng cố kiến thức nền và hoàn thành phần kiểm tra lại.",
            )
        return (
            "Em đã hoàn thành bài học",
            "Mina đã ghi nhận phần kiến thức em cần được hỗ trợ thêm. "
            "Giáo viên có thể xem kết quả và cùng em tiếp tục.",
        )

    def _get_session_for_student(self, *, session_id: uuid.UUID, user: User) -> DiagnosticSession:
        session = self.diagnostic_repository.get_session_for_student(
            session_id=session_id,
            student_user_id=user.id,
        )
        if session is None:
            raise ApiErrorException(
                404,
                "DIAGNOSTIC_SESSION_NOT_FOUND",
                "Không tìm thấy phiên học này.",
            )
        return session

    def _get_session_for_student_with_lock(
        self,
        *,
        session_id: uuid.UUID,
        user: User,
    ) -> DiagnosticSession:
        session = self.diagnostic_repository.get_session_for_student_with_lock(
            session_id=session_id,
            student_user_id=user.id,
        )
        if session is None:
            raise ApiErrorException(
                404,
                "DIAGNOSTIC_SESSION_NOT_FOUND",
                "Không tìm thấy phiên học này.",
            )
        return session
