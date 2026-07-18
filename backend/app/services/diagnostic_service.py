from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime

from app.api.errors import ApiErrorException
from app.db.models.diagnostic_attempt import DiagnosticAttempt
from app.db.models.diagnostic_session import DiagnosticSession
from app.db.models.diagnostic_skill_evaluation import DiagnosticSkillEvaluation
from app.db.models.learning_session_transition import LearningSessionTransition
from app.db.models.question_item import QuestionItem
from app.db.models.skill import Skill
from app.db.models.user import User
from app.repositories.content_repository import ContentRepository
from app.repositories.diagnostic_repository import DiagnosticRepository
from app.schemas.diagnostic import (
    CompletedActionResponse,
    DiagnosticFeedbackResponse,
    DiagnosticOptionResponse,
    DiagnosticProgressResponse,
    DiagnosticQuestionResponse,
    DiagnosticSessionResponse,
    NavigateActionResponse,
    NextQuestionActionResponse,
    StartDiagnosticSessionResponse,
    SubmitDiagnosticAttemptRequest,
    SubmitDiagnosticAttemptResponse,
)
from app.services.diagnostic_state_machine import (
    DiagnosticStateMachine,
    EvaluationSnapshot,
)
from app.services.skill_graph_service import SkillGraphService
from app.services.mastery_service import record_skill_evidence

QUESTION_LIMIT_PER_SKILL = 2


@dataclass(frozen=True)
class DiagnosticContext:
    target_skills: list[Skill]
    direct_prerequisite_map: dict[uuid.UUID, list[uuid.UUID]]


class DiagnosticService:
    def __init__(
        self,
        *,
        diagnostic_repository: DiagnosticRepository,
        content_repository: ContentRepository,
        state_machine: DiagnosticStateMachine,
        skill_graph: SkillGraphService,
    ) -> None:
        self.diagnostic_repository = diagnostic_repository
        self.content_repository = content_repository
        self.state_machine = state_machine
        self.skill_graph = skill_graph

    def start_or_resume_session(
        self,
        *,
        assignment_id: uuid.UUID,
        user: User,
    ) -> StartDiagnosticSessionResponse:
        record = self.diagnostic_repository.get_assignment_for_student_with_lock(
            assignment_id=assignment_id,
            student_user_id=user.id,
        )
        if record is None:
            raise ApiErrorException(
                404,
                "ASSIGNMENT_NOT_FOUND",
                "Không tìm thấy bài được giao.",
            )
        if record.assignment.status != "published":
            raise ApiErrorException(
                400,
                "ASSIGNMENT_NOT_AVAILABLE",
                "Bài học này hiện chưa sẵn sàng để làm.",
            )

        latest_session = self.diagnostic_repository.get_latest_session_for_recipient_with_lock(
            record.recipient.id
        )
        if latest_session is not None:
            return StartDiagnosticSessionResponse(
                session_id=latest_session.id,
                state=latest_session.state,
                route=self._build_route_for_state(latest_session.state, latest_session.id),
                resumed=True,
            )

        context = self._build_context(record.assignment.id)
        target_skill = self.state_machine.select_initial_target(
            context.target_skills,
            context.direct_prerequisite_map,
        )
        self._ensure_skill_chain_has_sufficient_questions(target_skill, context)

        now = datetime.now(UTC)
        if record.recipient.status == "not_started":
            record.recipient.status = "in_progress"
        if record.recipient.started_at is None:
            record.recipient.started_at = now

        session = self.diagnostic_repository.add(
            DiagnosticSession(
                assignment_recipient_id=record.recipient.id,
                student_user_id=user.id,
                target_skill_id=target_skill.id,
                current_skill_id=target_skill.id,
                root_cause_skill_id=None,
                state="diagnosing",
                outcome=None,
                remediation_cycle_count=0,
                transfer_cycle_count=0,
                started_at=now,
            )
        )
        self.diagnostic_repository.add(
            LearningSessionTransition(
                session=session,
                from_state=None,
                to_state="diagnosing",
                reason_code="diagnostic_started",
                skill_id=target_skill.id,
            )
        )
        self.diagnostic_repository.add(
            DiagnosticSkillEvaluation(
                session=session,
                skill_id=target_skill.id,
                parent_skill_id=None,
                status="current",
                answered_count=0,
                correct_count=0,
                evaluation_order=1,
            )
        )
        self.diagnostic_repository.session.flush()

        return StartDiagnosticSessionResponse(
            session_id=session.id,
            state=session.state,
            route=self._build_route_for_state(session.state, session.id),
            resumed=False,
        )

    def get_session(
        self,
        *,
        session_id: uuid.UUID,
        user: User,
    ) -> DiagnosticSessionResponse:
        session = self.diagnostic_repository.get_session_for_student(
            session_id=session_id,
            student_user_id=user.id,
        )
        if session is None:
            raise ApiErrorException(
                404,
                "DIAGNOSTIC_SESSION_NOT_FOUND",
                "Không tìm thấy phiên làm bài này.",
            )
        return self._serialize_session(session)

    def submit_attempt(
        self,
        *,
        session_id: uuid.UUID,
        user: User,
        payload: SubmitDiagnosticAttemptRequest,
    ) -> SubmitDiagnosticAttemptResponse:
        session = self.diagnostic_repository.get_session_for_student_with_lock(
            session_id=session_id,
            student_user_id=user.id,
        )
        if session is None:
            raise ApiErrorException(
                404,
                "DIAGNOSTIC_SESSION_NOT_FOUND",
                "Không tìm thấy phiên làm bài này.",
            )

        existing_attempt = self.diagnostic_repository.get_attempt_by_client_attempt_id(
            session_id=session.id,
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
            return self._build_attempt_response(session, existing_attempt)

        if session.state != "diagnosing":
            raise ApiErrorException(
                409,
                "DIAGNOSTIC_SESSION_CLOSED",
                "Phiên làm bài này đã chuyển sang bước khác.",
            )

        context = self._build_context(session.assignment_recipient.assignment_id)
        current_evaluation = self.diagnostic_repository.get_current_evaluation(session.id)
        if current_evaluation is None or session.current_skill_id is None:
            raise ApiErrorException(
                409,
                "DIAGNOSTIC_STATE_CONFLICT",
                "Phiên làm bài đang ở trạng thái không hợp lệ.",
            )

        current_question = self._get_current_question(
            session=session,
            evaluation=current_evaluation,
        )
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
            DiagnosticAttempt(
                session_id=session.id,
                skill_id=current_evaluation.skill_id,
                question_id=current_question.id,
                selected_option_id=selected_option.id,
                client_attempt_id=payload.client_attempt_id,
                sequence_number=self.diagnostic_repository.get_attempt_count(session.id) + 1,
                is_correct=bool(selected_option.is_correct),
            )
        )
        record_skill_evidence(
            self.diagnostic_repository.session,
            student_user_id=user.id,
            skill_id=current_evaluation.skill_id,
            is_correct=attempt.is_correct,
            phase="diagnostic",
        )

        current_evaluation.answered_count += 1
        if attempt.is_correct:
            current_evaluation.correct_count += 1

        if current_evaluation.answered_count < QUESTION_LIMIT_PER_SKILL:
            self.diagnostic_repository.session.flush()
            return self._build_attempt_response(session, attempt)

        passed = current_evaluation.correct_count == QUESTION_LIMIT_PER_SKILL
        current_evaluation.status = "passed" if passed else "failed"

        decision = self.state_machine.decide_after_skill_result(
            current_skill_id=current_evaluation.skill_id,
            passed=passed,
            target_skill_id=session.target_skill_id,
            evaluations=self._to_snapshots(self.diagnostic_repository.list_evaluations(session.id)),
            direct_prerequisite_map=context.direct_prerequisite_map,
        )

        if decision.kind == "completed":
            self._mark_session_completed(session)
            self.diagnostic_repository.session.flush()
            return self._build_attempt_response(session, attempt)

        if decision.kind == "root_cause":
            if decision.root_cause_skill_id is None:
                raise RuntimeError("Root-cause decision is missing root_cause_skill_id.")
            self._mark_session_gap_confirmed(
                session=session,
                root_cause_skill_id=decision.root_cause_skill_id,
            )
            self.diagnostic_repository.session.flush()
            return self._build_attempt_response(session, attempt)

        if decision.next_skill_id is None:
            raise RuntimeError("Next-skill decision is missing next_skill_id.")

        self._move_to_next_skill(
            session=session,
            next_skill_id=decision.next_skill_id,
            parent_skill_id=decision.parent_skill_id,
        )
        self.diagnostic_repository.session.flush()
        return self._build_attempt_response(session, attempt)

    def _build_context(self, assignment_id: uuid.UUID) -> DiagnosticContext:
        target_skills = self.content_repository.list_assignment_target_skills(assignment_id)
        if not target_skills:
            raise ApiErrorException(
                400,
                "DIAGNOSTIC_CONTENT_MISSING",
                "Bài học này chưa có nội dung chẩn đoán phù hợp.",
            )

        for target_skill in target_skills:
            package = target_skill.content_package
            if package is None or package.status != "published":
                raise ApiErrorException(
                    400,
                    "DIAGNOSTIC_CONTENT_MISSING",
                    "Bài học này chưa có nội dung chẩn đoán phù hợp.",
                )

        package_id = target_skills[0].content_package_id
        skills = self.content_repository.list_skills_by_package_id(package_id)
        edges = self.content_repository.list_skill_prerequisites_by_package_id(package_id)
        self.skill_graph.ensure_acyclic(skills=skills, edges=edges)
        direct_map = self.skill_graph.build_prerequisite_map(skills=skills, edges=edges)
        return DiagnosticContext(
            target_skills=target_skills,
            direct_prerequisite_map=direct_map,
        )

    def _ensure_skill_chain_has_sufficient_questions(
        self,
        target_skill: Skill,
        context: DiagnosticContext,
    ) -> None:
        skill_ids = {target_skill.id, *self._collect_prerequisites(target_skill.id, context)}
        for skill_id in skill_ids:
            questions = self.diagnostic_repository.list_diagnostic_questions_for_skill(skill_id)
            if len(questions) < QUESTION_LIMIT_PER_SKILL:
                raise ApiErrorException(
                    400,
                    "DIAGNOSTIC_QUESTIONS_INSUFFICIENT",
                    "Nội dung chẩn đoán hiện chưa đủ để mở bài học này.",
                )

    def _collect_prerequisites(
        self,
        skill_id: uuid.UUID,
        context: DiagnosticContext,
    ) -> set[uuid.UUID]:
        collected: set[uuid.UUID] = set()
        for prerequisite_id in context.direct_prerequisite_map.get(skill_id, []):
            if prerequisite_id in collected:
                continue
            collected.add(prerequisite_id)
            collected.update(self._collect_prerequisites(prerequisite_id, context))
        return collected

    def _get_current_question(
        self,
        *,
        session: DiagnosticSession,
        evaluation: DiagnosticSkillEvaluation,
    ) -> QuestionItem | None:
        attempts = self.diagnostic_repository.list_attempts(session.id)
        used_question_ids = {attempt.question_id for attempt in attempts}
        questions = self.diagnostic_repository.list_diagnostic_questions_for_skill(
            evaluation.skill_id
        )
        for question in questions:
            if question.id not in used_question_ids:
                return question
        return None

    def _serialize_session(self, session: DiagnosticSession) -> DiagnosticSessionResponse:
        current_question: DiagnosticQuestionResponse | None = None
        current_evaluation = self.diagnostic_repository.get_current_evaluation(session.id)

        if session.state == "diagnosing" and current_evaluation is not None:
            question = self._get_current_question(session=session, evaluation=current_evaluation)
            if question is not None:
                current_question = DiagnosticQuestionResponse(
                    id=question.id,
                    prompt=question.prompt,
                    selection_mode="single",
                    options=[
                        DiagnosticOptionResponse(id=option.id, label=option.label)
                        for option in sorted(
                            question.options,
                            key=lambda item: (item.sort_order, item.code),
                        )
                    ],
                )

        return DiagnosticSessionResponse(
            id=session.id,
            assignment_id=session.assignment_recipient.assignment_id,
            assignment_title=session.assignment_recipient.assignment.title,
            state=session.state,
            progress=DiagnosticProgressResponse(
                answered=self.diagnostic_repository.get_attempt_count(session.id),
                estimated_total=None,
            ),
            current_question=current_question,
            next_route=self._build_session_next_route(session),
        )

    def _build_attempt_response(
        self,
        session: DiagnosticSession,
        attempt: DiagnosticAttempt,
    ) -> SubmitDiagnosticAttemptResponse:
        if session.state == "completed":
            return SubmitDiagnosticAttemptResponse(
                attempt_id=attempt.id,
                correct=attempt.is_correct,
                feedback=DiagnosticFeedbackResponse(
                    title="Em đã hoàn thành phần kiểm tra",
                    message="Các bước kiến thức cần thiết đã được thực hiện tốt.",
                    tone="encouraging",
                ),
                next_action=CompletedActionResponse(
                    label="Xem kết quả",
                    route=self._build_route_for_state("completed", session.id),
                ),
            )

        if session.state == "gap_confirmed":
            return SubmitDiagnosticAttemptResponse(
                attempt_id=attempt.id,
                correct=attempt.is_correct,
                feedback=DiagnosticFeedbackResponse(
                    title="Mình đã tìm được bước cần củng cố",
                    message="Mina sẽ cùng em ôn lại phần kiến thức nền liên quan.",
                    tone="neutral",
                ),
                next_action=NavigateActionResponse(
                    label="Bắt đầu củng cố",
                    route=self._build_route_for_state("gap_confirmed", session.id),
                ),
            )

        return SubmitDiagnosticAttemptResponse(
            attempt_id=attempt.id,
            correct=attempt.is_correct,
            feedback=DiagnosticFeedbackResponse(
                title="Đã ghi nhận câu trả lời",
                message=(
                    "Em đã hoàn thành bước này."
                    if attempt.is_correct
                    else "Mình cùng kiểm tra thêm một bước nhé."
                ),
                tone="encouraging" if attempt.is_correct else "neutral",
            ),
            next_action=NextQuestionActionResponse(label="Câu tiếp theo"),
        )

    def _move_to_next_skill(
        self,
        *,
        session: DiagnosticSession,
        next_skill_id: uuid.UUID,
        parent_skill_id: uuid.UUID | None,
    ) -> None:
        next_evaluation = self.diagnostic_repository.get_evaluation(
            session_id=session.id,
            skill_id=next_skill_id,
        )
        if next_evaluation is None:
            self.diagnostic_repository.add(
                DiagnosticSkillEvaluation(
                    session_id=session.id,
                    skill_id=next_skill_id,
                    parent_skill_id=parent_skill_id,
                    status="current",
                    answered_count=0,
                    correct_count=0,
                    evaluation_order=self.diagnostic_repository.get_next_evaluation_order(
                        session.id
                    ),
                )
            )
        else:
            next_evaluation.status = "current"

        session.current_skill_id = next_skill_id

    def _mark_session_completed(self, session: DiagnosticSession) -> None:
        now = datetime.now(UTC)
        previous_state = session.state
        session.state = "completed"
        session.outcome = "mastered_without_remediation"
        session.current_skill_id = None
        session.completed_at = now
        session.assignment_recipient.status = "completed"
        session.assignment_recipient.completed_at = now
        session.assignment_recipient.progress_total = self.diagnostic_repository.get_attempt_count(
            session.id
        )
        session.assignment_recipient.progress_completed = (
            session.assignment_recipient.progress_total
        )
        self.diagnostic_repository.add(
            LearningSessionTransition(
                session=session,
                from_state=previous_state,
                to_state="completed",
                reason_code="diagnostic_mastered",
                skill_id=session.target_skill_id,
            )
        )

    def _mark_session_gap_confirmed(
        self,
        *,
        session: DiagnosticSession,
        root_cause_skill_id: uuid.UUID,
    ) -> None:
        previous_state = session.state
        session.state = "gap_confirmed"
        session.current_skill_id = None
        session.root_cause_skill_id = root_cause_skill_id
        session.assignment_recipient.status = "remediation"
        session.assignment_recipient.progress_total = self.diagnostic_repository.get_attempt_count(
            session.id
        )
        session.assignment_recipient.progress_completed = (
            session.assignment_recipient.progress_total
        )

        root_evaluation = self.diagnostic_repository.get_evaluation(
            session_id=session.id,
            skill_id=root_cause_skill_id,
        )
        if root_evaluation is not None:
            root_evaluation.status = "root_cause"
        self.diagnostic_repository.add(
            LearningSessionTransition(
                session=session,
                from_state=previous_state,
                to_state="gap_confirmed",
                reason_code="root_cause_confirmed",
                skill_id=root_cause_skill_id,
            )
        )

    def _build_session_next_route(self, session: DiagnosticSession) -> str | None:
        if session.state == "diagnosing":
            return None
        return self._build_route_for_state(session.state, session.id)

    @staticmethod
    def _build_route_for_state(state: str, session_id: uuid.UUID) -> str:
        if state == "completed":
            return f"/student/result/{session_id}"
        if state in {"gap_confirmed", "in_remediation"}:
            return f"/student/remediation/{session_id}"
        if state == "transfer_ready":
            return f"/student/transfer/{session_id}"
        return f"/student/diagnostic/{session_id}"

    @staticmethod
    def _to_snapshots(
        evaluations: list[DiagnosticSkillEvaluation],
    ) -> list[EvaluationSnapshot]:
        return [
            EvaluationSnapshot(
                skill_id=evaluation.skill_id,
                parent_skill_id=evaluation.parent_skill_id,
                status=evaluation.status,
                answered_count=evaluation.answered_count,
                correct_count=evaluation.correct_count,
                evaluation_order=evaluation.evaluation_order,
            )
            for evaluation in evaluations
        ]
