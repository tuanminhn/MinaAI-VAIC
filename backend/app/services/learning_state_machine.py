from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from app.schemas.diagnostic import DiagnosticOutcome


@dataclass(frozen=True)
class TransferDecision:
    kind: Literal["continue", "retry_remediation", "completed"]
    outcome: DiagnosticOutcome | None = None


class LearningStateMachine:
    @staticmethod
    def decide_after_transfer(*, passed: bool, cycle_number: int) -> TransferDecision:
        if passed:
            return TransferDecision(
                kind="completed",
                outcome="mastered_after_remediation",
            )

        if cycle_number >= 2:
            return TransferDecision(
                kind="completed",
                outcome="needs_teacher_support",
            )

        return TransferDecision(kind="retry_remediation")
