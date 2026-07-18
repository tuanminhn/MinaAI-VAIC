from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.student_skill_mastery import StudentSkillMastery


def record_skill_evidence(
    db: Session,
    *,
    student_user_id: uuid.UUID,
    skill_id: uuid.UUID,
    is_correct: bool,
    phase: str,
) -> StudentSkillMastery:
    mastery = db.execute(
        select(StudentSkillMastery)
        .where(
            StudentSkillMastery.student_user_id == student_user_id,
            StudentSkillMastery.skill_id == skill_id,
        )
        .with_for_update()
    ).scalar_one_or_none()
    if mastery is None:
        mastery = StudentSkillMastery(
            student_user_id=student_user_id,
            skill_id=skill_id,
            status="unknown",
            mastery_score=0,
            confidence=0,
            evidence_count=0,
        )
        db.add(mastery)

    # SQLAlchemy column defaults are applied when an INSERT is flushed, not when
    # a new ORM object is constructed. Coalescing also keeps legacy rows safe.
    previous_count = mastery.evidence_count or 0
    previous_score = mastery.mastery_score or 0.0
    value = 1.0 if is_correct else 0.0
    mastery.evidence_count = previous_count + 1
    mastery.mastery_score = round(
        ((previous_score * previous_count) + value) / mastery.evidence_count, 4
    )
    mastery.confidence = round(min(1.0, mastery.evidence_count / 4), 4)
    mastery.last_evaluated_at = datetime.now(UTC)

    if phase == "transfer":
        mastery.status = "mastered" if is_correct and mastery.mastery_score >= 0.75 else "needs_teacher_support"
    elif phase == "remediation":
        mastery.status = "practicing" if is_correct else "learning"
    elif mastery.evidence_count < 2:
        mastery.status = "diagnosing"
    else:
        mastery.status = "mastered" if mastery.mastery_score >= 0.8 else "needs_review"
    return mastery
