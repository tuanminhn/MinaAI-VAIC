from __future__ import annotations

import uuid
from unittest.mock import MagicMock

from app.services.mastery_service import record_skill_evidence


def test_first_evidence_initializes_new_mastery_before_flush() -> None:
    db = MagicMock()
    db.execute.return_value.scalar_one_or_none.return_value = None

    mastery = record_skill_evidence(
        db,
        student_user_id=uuid.uuid4(),
        skill_id=uuid.uuid4(),
        is_correct=True,
        phase="diagnostic",
    )

    assert mastery.evidence_count == 1
    assert mastery.mastery_score == 1.0
    assert mastery.confidence == 0.25
    assert mastery.status == "diagnosing"
    db.add.assert_called_once_with(mastery)


def test_legacy_null_counters_are_coalesced() -> None:
    db = MagicMock()
    mastery = MagicMock()
    mastery.evidence_count = None
    mastery.mastery_score = None
    db.execute.return_value.scalar_one_or_none.return_value = mastery

    result = record_skill_evidence(
        db,
        student_user_id=uuid.uuid4(),
        skill_id=uuid.uuid4(),
        is_correct=False,
        phase="diagnostic",
    )

    assert result.evidence_count == 1
    assert result.mastery_score == 0.0
    assert result.confidence == 0.25
