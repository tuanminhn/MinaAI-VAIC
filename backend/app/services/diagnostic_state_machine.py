from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Literal

from app.db.models.skill import Skill

EvaluationStatus = Literal["pending", "current", "passed", "failed", "root_cause"]


@dataclass(frozen=True)
class EvaluationSnapshot:
    skill_id: uuid.UUID
    parent_skill_id: uuid.UUID | None
    status: EvaluationStatus
    answered_count: int
    correct_count: int
    evaluation_order: int


@dataclass(frozen=True)
class StateMachineDecision:
    kind: Literal["completed", "root_cause", "next_skill"]
    next_skill_id: uuid.UUID | None = None
    parent_skill_id: uuid.UUID | None = None
    root_cause_skill_id: uuid.UUID | None = None


class DiagnosticStateMachine:
    def select_initial_target(
        self,
        skills: list[Skill],
        direct_prerequisite_map: dict[uuid.UUID, list[uuid.UUID]],
    ) -> Skill:
        chain_lengths = {
            skill.id: self._prerequisite_depth(skill.id, direct_prerequisite_map)
            for skill in skills
        }
        ordered = sorted(
            skills,
            key=lambda skill: (-chain_lengths[skill.id], -skill.sort_order, skill.code),
        )
        return ordered[0]

    def decide_after_skill_result(
        self,
        *,
        current_skill_id: uuid.UUID,
        passed: bool,
        target_skill_id: uuid.UUID,
        evaluations: list[EvaluationSnapshot],
        direct_prerequisite_map: dict[uuid.UUID, list[uuid.UUID]],
    ) -> StateMachineDecision:
        current = self._get_evaluation(evaluations, current_skill_id)
        if passed:
            if current.skill_id == target_skill_id and current.parent_skill_id is None:
                return StateMachineDecision(kind="completed")

            if current.parent_skill_id is None:
                return StateMachineDecision(kind="completed")

            next_prerequisite = self._find_next_pending_prerequisite(
                parent_skill_id=current.parent_skill_id,
                evaluations=evaluations,
                direct_prerequisite_map=direct_prerequisite_map,
            )
            if next_prerequisite is not None:
                return StateMachineDecision(
                    kind="next_skill",
                    next_skill_id=next_prerequisite,
                    parent_skill_id=current.parent_skill_id,
                )

            return StateMachineDecision(
                kind="root_cause",
                root_cause_skill_id=current.parent_skill_id,
            )

        prerequisites = direct_prerequisite_map.get(current.skill_id, [])
        if not prerequisites:
            return StateMachineDecision(kind="root_cause", root_cause_skill_id=current.skill_id)

        next_prerequisite = self._find_next_pending_prerequisite(
            parent_skill_id=current.skill_id,
            evaluations=evaluations,
            direct_prerequisite_map=direct_prerequisite_map,
        )
        if next_prerequisite is None:
            return StateMachineDecision(kind="root_cause", root_cause_skill_id=current.skill_id)

        return StateMachineDecision(
            kind="next_skill",
            next_skill_id=next_prerequisite,
            parent_skill_id=current.skill_id,
        )

    @staticmethod
    def _get_evaluation(
        evaluations: list[EvaluationSnapshot],
        skill_id: uuid.UUID,
    ) -> EvaluationSnapshot:
        for evaluation in evaluations:
            if evaluation.skill_id == skill_id:
                return evaluation
        raise RuntimeError("Current skill evaluation is missing from diagnostic state.")

    @staticmethod
    def _find_next_pending_prerequisite(
        *,
        parent_skill_id: uuid.UUID,
        evaluations: list[EvaluationSnapshot],
        direct_prerequisite_map: dict[uuid.UUID, list[uuid.UUID]],
    ) -> uuid.UUID | None:
        evaluated_ids = {evaluation.skill_id for evaluation in evaluations}
        statuses = {evaluation.skill_id: evaluation.status for evaluation in evaluations}
        for prerequisite_id in direct_prerequisite_map.get(parent_skill_id, []):
            if prerequisite_id not in evaluated_ids:
                return prerequisite_id
            if statuses[prerequisite_id] == "current":
                return prerequisite_id
        return None

    @staticmethod
    def _prerequisite_depth(
        skill_id: uuid.UUID,
        direct_prerequisite_map: dict[uuid.UUID, list[uuid.UUID]],
    ) -> int:
        direct_prerequisites = direct_prerequisite_map.get(skill_id, [])
        if not direct_prerequisites:
            return 0
        return 1 + max(
            DiagnosticStateMachine._prerequisite_depth(
                prerequisite_id,
                direct_prerequisite_map,
            )
            for prerequisite_id in direct_prerequisites
        )
